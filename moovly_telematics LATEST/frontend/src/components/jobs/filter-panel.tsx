import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Filter, Calendar as CalendarIcon, MapPin, Users, RotateCcw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface FilterPanelProps {
  filters: any;
  setFilters: (filters: any) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ filters, setFilters, onClearFilters }: FilterPanelProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search || "");
  const [dateRange, setDateRange] = useState(null);

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  const statusOptions = [
    { value: "all", label: "All Statuses", count: 0 },
    { value: "pending", label: "Pending", count: 0 },
    { value: "assigned", label: "Assigned", count: 0 },
    { value: "in-progress", label: "In Progress", count: 0 },
    { value: "completed", label: "Completed", count: 0 },
    { value: "cancelled", label: "Cancelled", count: 0 },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value === "all" ? "" : value
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters({
      ...filters,
      search: value
    });
  };

  const hasActiveFilters = Object.values(filters).some((value: any) => value && value !== "all" && value !== "");

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Search Jobs
          </div>
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear Filters
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by job number, customer name, or address..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Priority</label>
            <Select value={filters.priority || "all"} onValueChange={(value) => handleFilterChange("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Assigned Driver</label>
            <Select value={filters.driverId || "all"} onValueChange={(value) => handleFilterChange("driverId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Drivers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {Array.isArray(drivers) && drivers.map((driver: any) => (
                  <SelectItem key={driver.id} value={driver.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      <span>{driver.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Vehicle</label>
            <Select value={filters.vehicleId || "all"} onValueChange={(value) => handleFilterChange("vehicleId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vehicles</SelectItem>
                {Array.isArray(vehicles) && vehicles.map((vehicle: any) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <span>{vehicle.vehicleNumber}</span>
                      <span className="text-xs text-gray-500">
                        {vehicle.make} {vehicle.model}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Location Area</label>
            <Select value={filters.location || "all"} onValueChange={(value) => handleFilterChange("location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="north">North Area</SelectItem>
                <SelectItem value="south">South Area</SelectItem>
                <SelectItem value="east">East Area</SelectItem>
                <SelectItem value="west">West Area</SelectItem>
                <SelectItem value="central">Central Area</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange ? "Selected range" : "Pick a date range"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Time Slot</label>
            <Select value={filters.timeSlot || "all"} onValueChange={(value) => handleFilterChange("timeSlot", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All Times" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Times</SelectItem>
                <SelectItem value="morning">Morning (6AM-12PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12PM-6PM)</SelectItem>
                <SelectItem value="evening">Evening (6PM-10PM)</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>
            {Object.entries(filters).map(([key, value]: [string, any]) => {
              if (value && value !== "all" && value !== "") {
                return (
                  <Badge 
                    key={key} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {key}: {value}
                    <button
                      onClick={() => handleFilterChange(key, "all")}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                );
              }
              return null;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}