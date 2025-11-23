import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Search, User, MapPin, Star, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type Driver = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  licenseNumber: string;
  vehicleType: string;
  status: string;
  currentLocation?: string;
  performanceScore?: number;
};

interface DriverSelectorProps {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  showAllocateLater?: boolean;
  showAutoSuggest?: boolean;
  pickupAddress?: string;
}

export function DriverSelector({
  value,
  onValueChange,
  placeholder = "Select driver...",
  disabled = false,
  showAllocateLater = true,
  showAutoSuggest = true,
  pickupAddress
}: DriverSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter(driver => 
    driver.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available drivers (not busy)
  const availableDrivers = filteredDrivers.filter(driver => 
    driver.status === 'available' || driver.status === 'on_break'
  );

  // Auto-suggest best driver based on criteria
  const suggestBestDriver = () => {
    if (availableDrivers.length === 0) return;
    
    // Simple logic: highest performance score among available drivers
    const bestDriver = availableDrivers.reduce((best, current) => {
      const bestScore = best.performanceScore || 0;
      const currentScore = current.performanceScore || 0;
      return currentScore > bestScore ? current : best;
    });
    
    onValueChange(bestDriver.id);
    setOpen(false);
  };

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'on_break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDriverStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return '🟢';
      case 'busy': return '🔴';
      case 'on_break': return '🟡';
      default: return '⚪';
    }
  };

  const selectedDriver = drivers.find(driver => driver.id === value);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
            data-testid="driver-selector-trigger"
          >
            <div className="flex items-center gap-2">
              {selectedDriver ? (
                <>
                  <User className="w-4 h-4" />
                  <span>{selectedDriver.firstName} {selectedDriver.lastName}</span>
                  <Badge variant="outline" className={getDriverStatusColor(selectedDriver.status)}>
                    {getDriverStatusIcon(selectedDriver.status)} {selectedDriver.status}
                  </Badge>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Search drivers..." 
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                value={searchQuery}
                onValueChange={setSearchQuery}
                data-testid="driver-search-input"
              />
            </div>
            <CommandList>
              <CommandEmpty>No drivers found.</CommandEmpty>
              <CommandGroup>
                {/* Special Options */}
                {showAllocateLater && (
                  <CommandItem
                    value="allocate-later"
                    onSelect={() => {
                      onValueChange(undefined);
                      setOpen(false);
                    }}
                    className="bg-blue-50 hover:bg-blue-100"
                    data-testid="allocate-later-option"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium text-blue-700">Allocate Later</span>
                      <span className="text-xs text-blue-600">Assign driver manually later</span>
                    </div>
                  </CommandItem>
                )}
                
                {showAutoSuggest && availableDrivers.length > 0 && (
                  <CommandItem
                    value="auto-suggest"
                    onSelect={suggestBestDriver}
                    className="bg-green-50 hover:bg-green-100"
                    data-testid="auto-suggest-option"
                  >
                    <Star className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium text-green-700">Auto-Suggest Best Driver</span>
                      <span className="text-xs text-green-600">System recommends optimal driver</span>
                    </div>
                  </CommandItem>
                )}

                {/* Available Drivers */}
                {availableDrivers.map((driver) => (
                  <CommandItem
                    key={driver.id}
                    value={`${driver.firstName} ${driver.lastName} ${driver.username} ${driver.email}`}
                    onSelect={() => {
                      onValueChange(driver.id);
                      setOpen(false);
                    }}
                    data-testid={`driver-option-${driver.id}`}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === driver.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="font-medium">{driver.firstName} {driver.lastName}</span>
                          <Badge variant="outline" className={getDriverStatusColor(driver.status)}>
                            {getDriverStatusIcon(driver.status)} {driver.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {driver.username} • {driver.vehicleType}
                          {driver.performanceScore && (
                            <span className="ml-2">⭐ {driver.performanceScore}/5</span>
                          )}
                        </div>
                        {driver.currentLocation && (
                          <div className="text-xs text-gray-400 ml-6 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {driver.currentLocation}
                          </div>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}

                {/* Busy Drivers (if any) */}
                {filteredDrivers.filter(d => d.status === 'busy').length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 border-t mt-2 pt-2">
                      Busy Drivers (Not Recommended)
                    </div>
                    {filteredDrivers.filter(d => d.status === 'busy').map((driver) => (
                      <CommandItem
                        key={driver.id}
                        value={`${driver.firstName} ${driver.lastName} ${driver.username} ${driver.email}`}
                        onSelect={() => {
                          onValueChange(driver.id);
                          setOpen(false);
                        }}
                        className="opacity-60"
                        data-testid={`driver-option-busy-${driver.id}`}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === driver.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex items-center justify-between w-full">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{driver.firstName} {driver.lastName}</span>
                              <Badge variant="outline" className={getDriverStatusColor(driver.status)}>
                                {getDriverStatusIcon(driver.status)} {driver.status}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500 ml-6">
                              {driver.username} • {driver.vehicleType}
                              {driver.performanceScore && (
                                <span className="ml-2">⭐ {driver.performanceScore}/5</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Driver Info */}
      {selectedDriver && (
        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
          <div className="flex items-center justify-between">
            <span>Selected: {selectedDriver.firstName} {selectedDriver.lastName}</span>
            <Badge className={getDriverStatusColor(selectedDriver.status)}>
              {getDriverStatusIcon(selectedDriver.status)} {selectedDriver.status}
            </Badge>
          </div>
          <div className="mt-1">
            📧 {selectedDriver.email} • 📱 {selectedDriver.phoneNumber}
            {selectedDriver.performanceScore && (
              <span className="ml-2">⭐ {selectedDriver.performanceScore}/5 rating</span>
            )}
          </div>
        </div>
      )}

      {/* Driver Statistics */}
      <div className="text-xs text-gray-500 flex gap-4">
        <span>✅ {availableDrivers.length} available</span>
        <span>🔴 {drivers.filter(d => d.status === 'busy').length} busy</span>
        <span>🟡 {drivers.filter(d => d.status === 'on_break').length} on break</span>
      </div>
    </div>
  );
}