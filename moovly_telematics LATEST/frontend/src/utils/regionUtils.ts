// IP-based country detection cache
let detectedCountry: string | null = null;

const flagMap: Record<string, string> = {
  ZA: "🇿🇦", // South Africa
  GB: "🇬🇧", // United Kingdom
  US: "🇺🇸", // United States
  AU: "🇦🇺", // Australia
  CA: "🇨🇦", // Canada
  DE: "🇩🇪", // Germany
  FR: "🇫🇷", // France
  NL: "🇳🇱", // Netherlands
  IT: "🇮🇹", // Italy
  ES: "🇪🇸", // Spain
  IN: "🇮🇳", // India
  CN: "🇨🇳", // China
  JP: "🇯🇵", // Japan
  BR: "🇧🇷", // Brazil
  MX: "🇲🇽", // Mexico
  NG: "🇳🇬", // Nigeria
  KE: "🇰🇪", // Kenya
  EG: "🇪🇬", // Egypt
  AE: "🇦🇪", // UAE
  SA: "🇸🇦", // Saudi Arabia
};

// Detect country using multiple methods
export const detectRegionFlag = (): string => {
  try {
    // Method 1: Check cached IP-based detection
    if (detectedCountry && flagMap[detectedCountry]) {
      return flagMap[detectedCountry];
    }

    // Method 2: Browser timezone detection
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneToCountry: Record<string, string> = {
      "Africa/Johannesburg": "ZA",
      "Europe/London": "GB",
      "America/New_York": "US",
      "America/Los_Angeles": "US",
      "America/Chicago": "US",
      "Australia/Sydney": "AU",
      "Europe/Berlin": "DE",
      "Europe/Paris": "FR",
      "Asia/Dubai": "AE",
      "Asia/Riyadh": "SA",
      "Asia/Tokyo": "JP",
      "Asia/Shanghai": "CN",
      "Asia/Kolkata": "IN",
      "America/Sao_Paulo": "BR",
      "America/Mexico_City": "MX",
      "Africa/Cairo": "EG",
      "Africa/Lagos": "NG",
      "Africa/Nairobi": "KE",
    };

    if (timezone && timezoneToCountry[timezone]) {
      const countryCode = timezoneToCountry[timezone];
      detectedCountry = countryCode;
      return flagMap[countryCode];
    }

    // Method 3: Browser locale detection
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const country = locale.split("-")[1];
    
    if (country && flagMap[country]) {
      detectedCountry = country;
      return flagMap[country];
    }

    // Method 4: Navigator language detection
    const language = navigator.language || navigator.languages?.[0];
    if (language) {
      const langCountry = language.split("-")[1];
      if (langCountry && flagMap[langCountry]) {
        detectedCountry = langCountry;
        return flagMap[langCountry];
      }
    }

    // Default fallback
    return "🇿🇦";
  } catch (error) {
    console.warn("Unable to detect region, using default flag:", error);
    return "🇿🇦";
  }
};

// Initialize IP-based detection on app load
export const initializeIPDetection = async (): Promise<void> => {
  try {
    // Use multiple IP geolocation services for reliability
    const services = [
      'https://ipapi.co/json/',
      'https://api.ipgeolocation.io/ipgeo?apiKey=free',
      'https://freegeoip.app/json/'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service);
        const data = await response.json();
        
        // Different services have different property names
        const country = data.country_code || data.country || data.countryCode;
        
        if (country && flagMap[country]) {
          detectedCountry = country;
          console.log(`Detected country from IP: ${country}`);
          break;
        }
      } catch (err) {
        console.warn(`Failed to get location from ${service}:`, err);
        continue;
      }
    }
  } catch (error) {
    console.warn("IP-based geolocation failed:", error);
  }
};

export const getRegionName = (): string => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const country = locale.split("-")[1];
    
    const regionMap: Record<string, string> = {
      ZA: "South Africa",
      GB: "United Kingdom",
      US: "United States",
      AU: "Australia",
      CA: "Canada",
      DE: "Germany",
      FR: "France",
      NL: "Netherlands",
      IT: "Italy",
      ES: "Spain",
    };
    
    return regionMap[country] || "South Africa";
  } catch (error) {
    console.warn("Unable to detect region name:", error);
    return "South Africa";
  }
};
