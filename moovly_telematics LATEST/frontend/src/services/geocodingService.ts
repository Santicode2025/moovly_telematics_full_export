interface GeocodedAddress {
  lat: number;
  lng: number;
  formatted_address: string;
  confidence: number;
  source: 'here' | 'nominatim' | 'google' | 'cache';
  components: {
    street_number?: string;
    street_name?: string;
    city?: string;
    postal_code?: string;
    province?: string;
    country?: string;
  };
  place_type?: string;
  business_name?: string;
}

interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  postalCode?: string;
  province?: string;
  country?: string;
}

interface CacheEntry {
  address: GeocodedAddress;
  timestamp: number;
  hits: number;
}

class CostAwareGeocodingService {
  private deviceCache = new Map<string, CacheEntry>();
  private maxCacheSize = 1000; // LRU cache limit
  private cacheHitCount = 0;
  private geocodingRequestCount = 0;
  private batchQueue: string[] = [];
  private batchTimer?: NodeJS.Timeout;

  // South African localities for address normalization
  private zaLocalities = new Set([
    'johannesburg', 'cape town', 'durban', 'pretoria', 'port elizabeth', 'bloemfontein',
    'east london', 'pietermaritzburg', 'witbank', 'welkom', 'kimberley', 'rustenburg',
    'polokwane', 'klerksdorp', 'middelburg', 'potchefstroom', 'centurion', 'vanderbijlpark',
    'springs', 'uitenhage', 'roodepoort', 'boksburg', 'brakpan', 'alberton', 'germiston',
    'randburg', 'sandton', 'krugersdorp', 'benoni', 'kempton park', 'nigel', 'edenvale',
    'somerset west', 'stellenbosch', 'paarl', 'george', 'oudtshoorn', 'mossel bay',
    'strand', 'worcester', 'malmesbury', 'caledon', 'hermanus', 'bredasdorp'
  ]);

  // Common South African address patterns for normalization
  private zaAddressPatterns = [
    /\b(\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln)\b/i,
    /\b(\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Way|Close|Crescent|Cres|Place|Pl|Gardens|Park)\b/i,
    /\b(Unit|Flat|Apt)\s*(\d+)[,\s]+(\d+)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];

  constructor() {
    this.loadDeviceCache();
  }

  // Cost-aware geocoding pipeline
  async geocodeAddress(rawAddress: string, options: {
    confidence?: number;
    source?: 'barcode' | 'ocr' | 'manual';
    forceRefresh?: boolean;
  } = {}): Promise<GeocodedAddress | null> {
    
    // Step 1: Check device cache first
    if (!options.forceRefresh) {
      const cached = this.getFromDeviceCache(rawAddress);
      if (cached) {
        this.cacheHitCount++;
        return { ...cached, source: 'cache' };
      }
    }

    // Step 2: Normalize address for South African context
    const normalizedAddress = this.normalizeZAAddress(rawAddress);
    
    // Step 3: Check cache with normalized address
    if (!options.forceRefresh && normalizedAddress !== rawAddress) {
      const cached = this.getFromDeviceCache(normalizedAddress);
      if (cached) {
        this.cacheHitCount++;
        return { ...cached, source: 'cache' };
      }
    }

    // Step 4: Check if we should batch this request (Wi-Fi only)
    if (this.isOnWiFi() && !options.forceRefresh) {
      return this.addToBatchQueue(normalizedAddress);
    }

    // Step 5: Geocode using cost-aware strategy
    return this.performGeocoding(normalizedAddress);
  }

  // Normalize South African addresses
  private normalizeZAAddress(address: string): string {
    let normalized = address.trim();

    // Convert common abbreviations
    normalized = normalized
      .replace(/\bSt\b/gi, 'Street')
      .replace(/\bRd\b/gi, 'Road')
      .replace(/\bAve\b/gi, 'Avenue')
      .replace(/\bDr\b/gi, 'Drive')
      .replace(/\bCres\b/gi, 'Crescent')
      .replace(/\bPl\b/gi, 'Place');

    // Add South Africa if not present and looks like SA address
    if (!normalized.toLowerCase().includes('south africa') && 
        !normalized.toLowerCase().includes(', za') &&
        this.looksLikeSAAddress(normalized)) {
      normalized += ', South Africa';
    }

    // Fix common postal code patterns
    normalized = normalized.replace(/\b(\d{4})\s*,?\s*$/, ', $1, South Africa');

    return normalized;
  }

  private looksLikeSAAddress(address: string): boolean {
    const lowerAddress = address.toLowerCase();
    
    // Check for SA localities
    for (const locality of Array.from(this.zaLocalities)) {
      if (lowerAddress.includes(locality)) {
        return true;
      }
    }

    // Check for SA postal code pattern (4 digits)
    if (/\b\d{4}\b/.test(address)) {
      return true;
    }

    // Check for SA address patterns
    return this.zaAddressPatterns.some(pattern => pattern.test(address));
  }

  // Primary geocoding with Nominatim
  private async geocodeWithNominatim(address: string): Promise<GeocodedAddress | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(address)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=1&` +
        `countrycodes=za&` + // Focus on South Africa for cost savings
        `bounded=1&` +
        `viewbox=16.45,-34.84,32.89,-22.13` // South Africa bounding box
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || data.length === 0) return null;

      const result = data[0];
      const confidence = this.calculateNominatimConfidence(result, address);

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name,
        confidence,
        source: 'nominatim',
        components: this.parseNominatimComponents(result.address)
      };
    } catch (error) {
      console.error('Nominatim geocoding failed:', error);
      return null;
    }
  }

  // HERE API geocoding (primary service - 250k free requests/month)
  private async geocodeWithHERE(address: string): Promise<GeocodedAddress | null> {
    try {
      // HERE Geocoding API - excellent for businesses and places
      const response = await fetch(
        `https://geocode.search.hereapi.com/v1/geocode?` +
        `q=${encodeURIComponent(address)}&` +
        `in=countryCode:ZAF&` + // Focus on South Africa
        `limit=1&` +
        `apiKey=${import.meta.env.VITE_HERE_API_KEY || process.env.HERE_API_KEY}`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.items || data.items.length === 0) return null;

      const result = data.items[0];
      const position = result.position;
      const confidence = this.calculateHEREConfidence(result, address);

      return {
        lat: position.lat,
        lng: position.lng,
        formatted_address: result.address.label,
        confidence,
        source: 'here',
        place_type: result.resultType,
        business_name: result.title !== result.address.label ? result.title : undefined,
        components: this.parseHEREComponents(result.address)
      };
    } catch (error) {
      console.error('HERE geocoding failed:', error);
      return null;
    }
  }

  private calculateHEREConfidence(result: any, originalAddress: string): number {
    let confidence = 0.8; // Base confidence for HERE
    
    // Higher confidence for business/POI results
    if (result.resultType === 'place') confidence += 0.15;
    
    // Address component matching
    const addressLower = originalAddress.toLowerCase();
    const resultLower = result.address.label.toLowerCase();
    
    if (resultLower.includes(addressLower.split(' ')[0])) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private parseHEREComponents(address: any): any {
    return {
      street_number: address.houseNumber,
      street_name: address.street,
      city: address.city,
      postal_code: address.postalCode,
      province: address.state || address.county,
      country: address.countryName
    };
  }

  // Fallback geocoding with Google
  private async geocodeWithGoogle(address: string): Promise<GeocodedAddress | null> {
    try {
      // Use server-side endpoint to hide API key and add regional restrictions
      const response = await fetch('/api/geocode/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address,
          region: 'za', // Restrict to South Africa
          bounds: {
            south: -34.84,
            west: 16.45,
            north: -22.13,
            east: 32.89
          }
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (!data.success) return null;

      return {
        lat: data.result.lat,
        lng: data.result.lng,
        formatted_address: data.result.formatted_address,
        confidence: data.result.confidence || 0.9,
        source: 'google',
        components: data.result.components
      };
    } catch (error) {
      console.error('Google geocoding failed:', error);
      return null;
    }
  }

  // Main geocoding logic with fallback strategy
  private async performGeocoding(address: string): Promise<GeocodedAddress | null> {
    this.geocodingRequestCount++;

    // Try HERE first (250k free requests/month, great for businesses)
    let result = await this.geocodeWithHERE(address);
    console.log(`HERE result:`, result);
    
    // If HERE fails or low confidence, try Nominatim (free backup)
    if (!result || result.confidence < 0.7) {
      console.log(`HERE confidence low (${result?.confidence || 0}), falling back to Nominatim`);
      result = await this.geocodeWithNominatim(address);
    }
    
    // Last resort: Google (paid)
    if (!result || result.confidence < 0.6) {
      console.log(`All free services failed, trying Google as last resort`);
      const googleResult = await this.geocodeWithGoogle(address);
      if (googleResult) {
        result = googleResult;
      }
    }

    // Cache the result if we got one
    if (result) {
      this.addToDeviceCache(address, result);
      // Also cache on server
      this.cacheOnServer(address, result);
    }

    return result;
  }

  // Device cache management (LRU)
  private getFromDeviceCache(address: string): GeocodedAddress | null {
    const entry = this.deviceCache.get(address);
    if (!entry) return null;

    // Check if cache entry is still valid (30 days)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    if (Date.now() - entry.timestamp > maxAge) {
      this.deviceCache.delete(address);
      return null;
    }

    // Update hit count and move to end (LRU)
    entry.hits++;
    this.deviceCache.delete(address);
    this.deviceCache.set(address, entry);

    return entry.address;
  }

  private addToDeviceCache(address: string, geocoded: GeocodedAddress): void {
    // Implement LRU eviction
    if (this.deviceCache.size >= this.maxCacheSize) {
      const firstKey = this.deviceCache.keys().next().value;
      if (firstKey) {
        this.deviceCache.delete(firstKey);
      }
    }

    this.deviceCache.set(address, {
      address: geocoded,
      timestamp: Date.now(),
      hits: 1
    });

    this.saveDeviceCache();
  }

  // Batch processing for Wi-Fi scenarios
  private isOnWiFi(): boolean {
    // Check network connection type
    const connection = (navigator as any).connection;
    return connection && connection.type === 'wifi';
  }

  private addToBatchQueue(address: string): Promise<GeocodedAddress | null> {
    return new Promise((resolve) => {
      this.batchQueue.push(address);
      
      // Set timer for batch processing (5 seconds)
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
      }
      
      this.batchTimer = setTimeout(() => {
        this.processBatchQueue().catch(console.error);
      }, 5000);

      // For now, return null and process in background
      // In a real implementation, you'd wait for the batch result
      resolve(null);
    });
  }

  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const addresses = [...this.batchQueue];
    this.batchQueue = [];

    console.log(`Processing batch of ${addresses.length} addresses`);

    // Process in chunks of 10-20 addresses
    const chunkSize = 15;
    for (let i = 0; i < addresses.length; i += chunkSize) {
      const chunk = addresses.slice(i, i + chunkSize);
      await this.processBatchChunk(chunk);
      
      // Small delay between chunks to be nice to APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async processBatchChunk(addresses: string[]): Promise<void> {
    const promises = addresses.map(address => this.performGeocoding(address));
    await Promise.all(promises);
  }

  // Server-side caching
  private async cacheOnServer(address: string, result: GeocodedAddress): Promise<void> {
    try {
      await fetch('/api/geocode/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, result })
      });
    } catch (error) {
      console.error('Failed to cache on server:', error);
    }
  }

  // Local storage persistence
  private loadDeviceCache(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const cached = localStorage.getItem('moovly_geocode_cache');
        if (cached) {
          const data = JSON.parse(cached);
          this.deviceCache = new Map(data);
        }
      }
    } catch (error) {
      console.error('Failed to load device cache:', error);
    }
  }

  private saveDeviceCache(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = Array.from(this.deviceCache.entries());
        localStorage.setItem('moovly_geocode_cache', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save device cache:', error);
    }
  }

  // Confidence calculation helpers
  private calculateNominatimConfidence(result: any, originalAddress: string): number {
    let confidence = 0.5; // Base confidence

    // Boost confidence based on match quality
    if (result.importance) {
      confidence += Math.min(result.importance * 0.3, 0.3);
    }

    // Check if we have detailed address components
    if (result.address) {
      if (result.address.house_number) confidence += 0.1;
      if (result.address.road) confidence += 0.1;
      if (result.address.city || result.address.town) confidence += 0.1;
      if (result.address.postcode) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private parseNominatimComponents(address: any): AddressComponents {
    return {
      streetNumber: address.house_number,
      streetName: address.road,
      city: address.city || address.town || address.village,
      postalCode: address.postcode,
      province: address.state,
      country: address.country
    };
  }

  // Statistics and monitoring
  getCacheStats() {
    const hitRate = this.geocodingRequestCount > 0 
      ? (this.cacheHitCount / (this.cacheHitCount + this.geocodingRequestCount)) * 100 
      : 0;

    return {
      cacheSize: this.deviceCache.size,
      hitRate: hitRate.toFixed(1),
      totalRequests: this.geocodingRequestCount,
      cacheHits: this.cacheHitCount,
      batchQueueSize: this.batchQueue.length
    };
  }

  // Clear cache for testing
  clearCache(): void {
    this.deviceCache.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('moovly_geocode_cache');
    }
    this.cacheHitCount = 0;
    this.geocodingRequestCount = 0;
  }
}

// Export singleton instance
export const geocodingService = new CostAwareGeocodingService();
export type { GeocodedAddress, AddressComponents };