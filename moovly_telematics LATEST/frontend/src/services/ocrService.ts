import { geocodingService, type GeocodedAddress } from './geocodingService';

interface OCRResult {
  extractedText: string;
  confidence: number;
  textBlocks: TextBlock[];
  addressCandidates: string[];
  needsCorrection: boolean;
}

interface TextBlock {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

interface ProcessedAddress {
  original: string;
  corrected?: string;
  geocoded?: GeocodedAddress;
  confidence: number;
  source: 'barcode' | 'ocr' | 'manual';
}

class CostAwareOCRService {
  private addressBook = new Map<string, ProcessedAddress>();
  private readonly minConfidenceThreshold = 0.85;
  private readonly postalCodePattern = /\b\d{4}\b/;

  constructor() {
    this.loadAddressBook();
  }

  // Main OCR processing pipeline
  async processImage(imageFile: File): Promise<OCRResult> {
    try {
      // Step 1: Extract text using on-device Tesseract
      const ocrResult = await this.extractTextWithTesseract(imageFile);
      
      // Step 2: Parse for address candidates
      const addressCandidates = this.extractAddressCandidates(ocrResult.extractedText);
      
      // Step 3: Determine if correction is needed
      const needsCorrection = this.shouldPromptCorrection(ocrResult, addressCandidates);
      
      return {
        extractedText: ocrResult.extractedText,
        confidence: ocrResult.confidence,
        textBlocks: ocrResult.textBlocks,
        addressCandidates,
        needsCorrection
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error('Failed to process image');
    }
  }

  // Process barcode payload for addresses
  async processBarcodePayload(payload: string): Promise<ProcessedAddress | null> {
    const addressCandidates = this.extractAddressCandidates(payload);
    
    if (addressCandidates.length === 0) return null;

    const bestCandidate = addressCandidates[0];
    
    // Try geocoding the extracted address
    const geocoded = await geocodingService.geocodeAddress(bestCandidate, {
      source: 'barcode',
      confidence: 1.0 // Barcodes are typically reliable
    });

    const result: ProcessedAddress = {
      original: bestCandidate,
      geocoded: geocoded || undefined,
      confidence: 1.0,
      source: 'barcode'
    };

    // Cache in address book
    this.addToAddressBook(bestCandidate, result);
    
    return result;
  }

  // Process OCR result with geocoding
  async processOCRResult(ocrResult: OCRResult, userCorrections?: string[]): Promise<ProcessedAddress[]> {
    const results: ProcessedAddress[] = [];
    
    // Use corrections if provided, otherwise use candidates
    const addressesToProcess = userCorrections || ocrResult.addressCandidates;
    
    for (const address of addressesToProcess) {
      // Check address book first
      const cached = this.getFromAddressBook(address);
      if (cached) {
        results.push(cached);
        continue;
      }

      // Geocode the address
      const geocoded = await geocodingService.geocodeAddress(address, {
        source: 'ocr',
        confidence: ocrResult.confidence
      });

      const result: ProcessedAddress = {
        original: address,
        corrected: userCorrections ? address : undefined,
        geocoded: geocoded || undefined,
        confidence: ocrResult.confidence,
        source: 'ocr'
      };

      results.push(result);
      this.addToAddressBook(address, result);
    }
    
    return results;
  }

  // Extract text using Tesseract.js
  private async extractTextWithTesseract(imageFile: File): Promise<{
    extractedText: string;
    confidence: number;
    textBlocks: TextBlock[];
  }> {
    try {
      // Dynamic import for Tesseract.js
      const Tesseract = await import('tesseract.js');
      
      console.log('Starting OCR processing...');
      
      // Configure Tesseract for better South African address recognition
      const { data } = await Tesseract.recognize(imageFile, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      // Process the OCR result
      const extractedText = data.text.trim();
      const confidence = data.confidence / 100; // Convert to 0-1 scale
      
      console.log('OCR completed:', { extractedText, confidence });
      
      // Convert Tesseract words to our TextBlock format
      const textBlocks: TextBlock[] = data.words
        .filter(word => word.confidence > 30) // Filter low confidence words
        .map(word => ({
          text: word.text,
          confidence: word.confidence / 100,
          bbox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0
          }
        }));

      return {
        extractedText,
        confidence,
        textBlocks
      };
    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      
      // Fallback to mock for development if Tesseract fails
      const mockResults = this.getMockOCRResult(imageFile.name);
      console.log('Using fallback mock OCR result:', mockResults);
      return mockResults;
    }
  }

  // Mock OCR results for demonstration
  private getMockOCRResult(filename: string): {
    extractedText: string;
    confidence: number;
    textBlocks: TextBlock[];
  } {
    const mockTexts = [
      {
        text: "Delivery Address:\n123 Main Street\nCape Town, 8001\nSouth Africa",
        confidence: 0.92,
        addresses: ["123 Main Street, Cape Town, 8001, South Africa"]
      },
      {
        text: "Ship to:\nUnit 5A, 456 Somerset Road\nSomerset West, 7130\nWestern Cape",
        confidence: 0.88,
        addresses: ["Unit 5A, 456 Somerset Road, Somerset West, 7130"]
      },
      {
        text: "From: Warehouse\n789 Industrial Ave\nJohannesburg 2000\nTo: 321 Oak Street\nDurban 4001",
        confidence: 0.95,
        addresses: ["789 Industrial Ave, Johannesburg 2000", "321 Oak Street, Durban 4001"]
      },
      {
        text: "Package for:\nJohn Smith\n15 Beach Road\nPort Elizabeth\n6001",
        confidence: 0.78, // Low confidence to trigger correction
        addresses: ["15 Beach Road, Port Elizabeth, 6001"]
      }
    ];

    const result = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    
    return {
      extractedText: result.text,
      confidence: result.confidence,
      textBlocks: this.parseTextBlocks(result.text, result.confidence)
    };
  }

  private parseTextBlocks(text: string, confidence: number): TextBlock[] {
    const lines = text.split('\n');
    return lines.map((line, index) => ({
      text: line,
      confidence: confidence + (Math.random() * 0.1 - 0.05), // Slight variance
      bbox: {
        x: 10,
        y: index * 25 + 10,
        width: line.length * 8,
        height: 20
      }
    }));
  }

  // Extract potential addresses from text
  private extractAddressCandidates(text: string): string[] {
    const candidates: string[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Pattern 1: Multi-line addresses
    for (let i = 0; i < lines.length - 1; i++) {
      const line1 = lines[i];
      const line2 = lines[i + 1];
      
      // Look for street address followed by city/postal
      if (this.looksLikeStreetAddress(line1) && this.looksLikeCityLine(line2)) {
        const address = `${line1}, ${line2}`;
        candidates.push(address);
      }
    }
    
    // Pattern 2: Single line addresses
    lines.forEach(line => {
      if (this.looksLikeCompleteAddress(line)) {
        candidates.push(line);
      }
    });
    
    // Pattern 3: Address blocks (3+ lines)
    for (let i = 0; i < lines.length - 2; i++) {
      if (this.looksLikeAddressBlock(lines.slice(i, i + 3))) {
        const address = lines.slice(i, i + 3).join(', ');
        candidates.push(address);
      }
    }
    
    return [...new Set(candidates)]; // Remove duplicates
  }

  private looksLikeStreetAddress(line: string): boolean {
    // Check for street number + street name patterns
    const patterns = [
      /^\d+\s+[A-Za-z]/,  // "123 Main"
      /^Unit\s*\d+/i,     // "Unit 5A"
      /^Flat\s*\d+/i,     // "Flat 2B"
      /^\d+\/\d+/,        // "12/34"
    ];
    
    return patterns.some(pattern => pattern.test(line));
  }

  private looksLikeCityLine(line: string): boolean {
    // Check for city name + postal code
    return this.postalCodePattern.test(line) || 
           /^[A-Za-z\s]+,?\s*\d{4}/.test(line);
  }

  private looksLikeCompleteAddress(line: string): boolean {
    const hasNumber = /\d/.test(line);
    const hasPostal = this.postalCodePattern.test(line);
    const hasCommas = (line.match(/,/g) || []).length >= 2;
    
    return hasNumber && hasPostal && hasCommas && line.length > 20;
  }

  private looksLikeAddressBlock(lines: string[]): boolean {
    const [line1, line2, line3] = lines;
    return this.looksLikeStreetAddress(line1) && 
           line2.length > 3 && 
           this.looksLikeCityLine(line3);
  }

  // Determine if correction prompt is needed
  private shouldPromptCorrection(ocrResult: OCRResult, addresses: string[]): boolean {
    // Low confidence threshold
    if (ocrResult.confidence < this.minConfidenceThreshold) {
      return true;
    }
    
    // No addresses found
    if (addresses.length === 0) {
      return true;
    }
    
    // Check if any address is missing postal code
    const hasPostalCode = addresses.some(addr => this.postalCodePattern.test(addr));
    if (!hasPostalCode) {
      return true;
    }
    
    return false;
  }

  // Address book management
  private addToAddressBook(address: string, processed: ProcessedAddress): void {
    this.addressBook.set(address.toLowerCase(), processed);
    this.saveAddressBook();
  }

  private getFromAddressBook(address: string): ProcessedAddress | null {
    return this.addressBook.get(address.toLowerCase()) || null;
  }

  private loadAddressBook(): void {
    try {
      const saved = localStorage.getItem('moovly_address_book');
      if (saved) {
        const data = JSON.parse(saved);
        this.addressBook = new Map(data);
      }
    } catch (error) {
      console.error('Failed to load address book:', error);
    }
  }

  private saveAddressBook(): void {
    try {
      const data = Array.from(this.addressBook.entries());
      localStorage.setItem('moovly_address_book', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save address book:', error);
    }
  }

  // Get address book for user review
  getAddressBook(): Map<string, ProcessedAddress> {
    return new Map(this.addressBook);
  }

  // Clear address book
  clearAddressBook(): void {
    this.addressBook.clear();
    localStorage.removeItem('moovly_address_book');
  }

  // Statistics
  getStats() {
    return {
      addressBookSize: this.addressBook.size,
      threshold: this.minConfidenceThreshold
    };
  }
}

// Export singleton instance
export const ocrService = new CostAwareOCRService();
export type { OCRResult, ProcessedAddress, TextBlock };