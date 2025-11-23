import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
}

interface AddressAutoCompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    fullAddress: string;
    latitude: number;
    longitude: number;
    streetNumber?: string;
    streetName?: string;
    city?: string;
    postalCode?: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export default function AddressAutoComplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Start typing an address...",
  className = "",
}: AddressAutoCompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search for address suggestions
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Using Nominatim API for free geocoding (OpenStreetMap)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(value)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=5&` +
          `countrycodes=za,gb,us,au,ca` // Limit to major English-speaking countries
        );
        
        if (response.ok) {
          const data: AddressSuggestion[] = await response.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [value]);

  // Handle address selection
  const handleAddressSelect = async (suggestion: AddressSuggestion) => {
    const fullAddress = suggestion.display_name;
    const latitude = parseFloat(suggestion.lat);
    const longitude = parseFloat(suggestion.lon);
    
    onChange(fullAddress);
    setShowSuggestions(false);
    setSuggestions([]);

    // Extract street information
    const streetNumber = suggestion.address.house_number;
    const streetName = suggestion.address.road;
    const city = suggestion.address.city || suggestion.address.suburb;
    const postalCode = suggestion.address.postcode;

    // Call the parent callback with geocoded data
    if (onAddressSelect) {
      onAddressSelect({
        fullAddress,
        latitude,
        longitude,
        streetNumber,
        streetName,
        city,
        postalCode,
      });
    }

    // Create automatic geofence for this address
    try {
      await apiRequest("/api/geofences/auto-create", "POST", {
        address: fullAddress,
        latitude,
        longitude,
        radius: 50, // 50 meter radius
        type: "delivery_address",
      });
    } catch (error) {
      console.error("Error creating automatic geofence:", error);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleAddressSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className={`w-full justify-start p-3 h-auto text-left rounded-none ${
                    index === selectedIndex ? "bg-accent" : ""
                  }`}
                  onClick={() => handleAddressSelect(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.address.house_number && suggestion.address.road
                          ? `${suggestion.address.house_number} ${suggestion.address.road}`
                          : suggestion.address.road || "Address"
                        }
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {[
                          suggestion.address.suburb,
                          suggestion.address.city,
                          suggestion.address.postcode,
                          suggestion.address.country
                        ].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}