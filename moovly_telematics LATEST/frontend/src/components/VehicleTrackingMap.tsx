import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Navigation, 
  Car, 
  Truck, 
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Target,
  Activity,
  Clock,
  Smartphone
} from "lucide-react";

interface DriverLocation {
  id: number;
  name: string;
  vehicleRegistration: string;
  vehicleType: string;
  latitude: number;
  longitude: number;
  status: string;
  lastUpdate: string;
  currentJob?: {
    id: number;
    customerName: string;
    deliveryAddress: string;
    estimatedArrival: string;
  };
  speed: number;
  heading: number;
}

interface VehicleTrackingMapProps {
  className?: string;
}

export default function VehicleTrackingMap({ className = "" }: VehicleTrackingMapProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -26.2041, lng: 28.0473 }); // Johannesburg center
  const [zoomLevel, setZoomLevel] = useState(12);
  const mapRef = useRef<HTMLDivElement>(null);

  // Fetch real-time driver locations
  const { data: driverLocations = [], isLoading } = useQuery({
    queryKey: ["/api/drivers/locations"],
    queryFn: async () => {
      const response = await apiRequest("/api/drivers/locations");
      return Array.isArray(response) ? response : [];
    },
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Fetch specific driver details when selected
  const { data: selectedDriverDetails } = useQuery({
    queryKey: ["/api/drivers", selectedDriver],
    queryFn: async () => {
      const response = await apiRequest(`/api/drivers/${selectedDriver}`);
      return response;
    },
    enabled: !!selectedDriver,
  });

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType?.toLowerCase()) {
      case 'truck': return <Truck className="w-4 h-4" />;
      case 'van': return <Car className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'break': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      case 'idle': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'offline': return 'bg-red-100 text-red-800 border-red-200';
      case 'idle': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 2, 20));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 2, 8));
  };

  const handleResetView = () => {
    setMapCenter({ lat: -26.2041, lng: 28.0473 });
    setZoomLevel(12);
    setSelectedDriver(null);
  };

  const focusOnDriver = (driver: DriverLocation) => {
    setMapCenter({ lat: driver.latitude, lng: driver.longitude });
    setZoomLevel(16);
    setSelectedDriver(driver.id);
  };

  const handleDriverClick = (driver: DriverLocation) => {
    focusOnDriver(driver);
  };

  // Calculate map bounds to fit all drivers
  const fitAllDrivers = () => {
    if (!Array.isArray(driverLocations) || driverLocations.length === 0) return;
    
    const lats = driverLocations.map((d: DriverLocation) => d.latitude);
    const lngs = driverLocations.map((d: DriverLocation) => d.longitude);
    
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
    
    setMapCenter({ lat: centerLat, lng: centerLng });
    setZoomLevel(11);
    setSelectedDriver(null);
  };

  // Mock driver locations for demonstration
  const mockDriverLocations: DriverLocation[] = [
    {
      id: 1,
      name: "John Smith",
      vehicleRegistration: "GP123ABC",
      vehicleType: "van",
      latitude: -26.1951,
      longitude: 28.0573,
      status: "active",
      lastUpdate: new Date().toISOString(),
      currentJob: {
        id: 101,
        customerName: "ABC Corp",
        deliveryAddress: "Sandton City Mall",
        estimatedArrival: "14:30"
      },
      speed: 45,
      heading: 90
    },
    {
      id: 2,
      name: "Sarah Johnson",
      vehicleRegistration: "GP456DEF",
      vehicleType: "truck",
      latitude: -26.2141,
      longitude: 28.0373,
      status: "break",
      lastUpdate: new Date().toISOString(),
      speed: 0,
      heading: 0
    },
    {
      id: 3,
      name: "Mike Wilson",
      vehicleRegistration: "GP789GHI",
      vehicleType: "van",
      latitude: -26.1841,
      longitude: 28.0673,
      status: "active",
      lastUpdate: new Date().toISOString(),
      currentJob: {
        id: 102,
        customerName: "XYZ Ltd",
        deliveryAddress: "Rosebank Mall",
        estimatedArrival: "15:15"
      },
      speed: 32,
      heading: 180
    },
    {
      id: 4,
      name: "Lisa Brown",
      vehicleRegistration: "GP012JKL",
      vehicleType: "van",
      latitude: -26.2241,
      longitude: 28.0273,
      status: "idle",
      lastUpdate: new Date().toISOString(),
      speed: 0,
      heading: 45
    }
  ];

  const activeDrivers = mockDriverLocations.filter(d => d.status === 'active').length;
  const totalDrivers = mockDriverLocations.length;

  const MapContent = () => (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">{activeDrivers} Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">{totalDrivers} Total</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={fitAllDrivers}>
            <Target className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleResetView}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Interactive Map Area */}
      <div 
        ref={mapRef}
        className={`relative bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden ${
          isFullScreen ? 'h-[80vh]' : 'h-96'
        }`}
        style={{
          backgroundImage: `
            linear-gradient(90deg, #f0f0f0 1px, transparent 1px),
            linear-gradient(180deg, #f0f0f0 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {/* Map Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50" />
        
        {/* Driver Markers */}
        {Array.isArray(driverLocations) && driverLocations.length > 0 
          ? driverLocations.map((driver: DriverLocation) => {
          // Calculate position based on map center and zoom
          const xOffset = (driver.longitude - mapCenter.lng) * zoomLevel * 100 + 200;
          const yOffset = (mapCenter.lat - driver.latitude) * zoomLevel * 100 + 150;
          
          const isSelected = selectedDriver === driver.id;
          const isVisible = xOffset > -50 && xOffset < 650 && yOffset > -50 && yOffset < 450;
          
          if (!isVisible) return null;
          
          return (
            <div
              key={driver.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                isSelected ? 'scale-125 z-20' : 'z-10 hover:scale-110'
              }`}
              style={{
                left: `${Math.max(0, Math.min(100, (xOffset / 600) * 100))}%`,
                top: `${Math.max(0, Math.min(100, (yOffset / 400) * 100))}%`,
              }}
              onClick={() => handleDriverClick(driver)}
            >
              {/* Driver Marker */}
              <div className={`relative p-2 rounded-full ${getStatusColor(driver.status)} shadow-lg`}>
                {getVehicleIcon(driver.vehicleType)}
              </div>
              
              {/* Driver Info Popup */}
              {isSelected && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border p-3 min-w-[200px] z-30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{driver.name}</h4>
                      <Badge className={getStatusBadgeColor(driver.status)}>
                        {driver.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Car className="w-3 h-3" />
                        <span>{driver.vehicleRegistration}</span>
                      </div>
                      {driver.speed > 0 && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Navigation className="w-3 h-3" />
                          <span>{driver.speed} km/h</span>
                        </div>
                      )}
                      {driver.currentJob && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border">
                          <div className="text-xs font-medium text-blue-800">
                            Current Job: {driver.currentJob.customerName}
                          </div>
                          <div className="text-xs text-blue-600">
                            ETA: {driver.currentJob.estimatedArrival}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Speed indicator for moving vehicles */}
              {driver.speed > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {driver.speed}
                </div>
              )}
            </div>
          );
        })
          : mockDriverLocations.map((driver) => {
          // Calculate position based on map center and zoom
          const xOffset = (driver.longitude - mapCenter.lng) * zoomLevel * 100 + 200;
          const yOffset = (mapCenter.lat - driver.latitude) * zoomLevel * 100 + 150;
          
          const isSelected = selectedDriver === driver.id;
          const isVisible = xOffset > -50 && xOffset < 650 && yOffset > -50 && yOffset < 450;
          
          if (!isVisible) return null;
          
          return (
            <div
              key={driver.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                isSelected ? 'scale-125 z-20' : 'z-10 hover:scale-110'
              }`}
              style={{
                left: `${Math.max(0, Math.min(100, (xOffset / 600) * 100))}%`,
                top: `${Math.max(0, Math.min(100, (yOffset / 400) * 100))}%`,
              }}
              onClick={() => handleDriverClick(driver)}
            >
              {/* Driver Marker */}
              <div className={`relative p-2 rounded-full ${getStatusColor(driver.status)} shadow-lg`}>
                {getVehicleIcon(driver.vehicleType)}
              </div>
              
              {/* Driver Info Popup */}
              {isSelected && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl border p-3 min-w-[200px] z-30">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{driver.name}</h4>
                      <Badge className={getStatusBadgeColor(driver.status)}>
                        {driver.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Car className="w-3 h-3" />
                        <span>{driver.vehicleRegistration}</span>
                      </div>
                      {driver.speed > 0 && (
                        <div className="flex items-center space-x-2 mt-1">
                          <Navigation className="w-3 h-3" />
                          <span>{driver.speed} km/h</span>
                        </div>
                      )}
                      {driver.currentJob && (
                        <div className="mt-2 p-2 bg-blue-50 rounded border">
                          <div className="text-xs font-medium text-blue-800">
                            Current Job: {driver.currentJob.customerName}
                          </div>
                          <div className="text-xs text-blue-600">
                            ETA: {driver.currentJob.estimatedArrival}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Speed indicator for moving vehicles */}
              {driver.speed > 0 && (
                <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {driver.speed}
                </div>
              )}
            </div>
          );
        })}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 space-y-2">
          <h5 className="text-xs font-medium text-gray-800">Driver Status</h5>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Break</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Idle</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Offline</span>
            </div>
          </div>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="text-xs text-gray-600">
            Zoom: {zoomLevel}x
          </div>
        </div>
      </div>

      {/* Driver List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Array.isArray(driverLocations) && driverLocations.length > 0 ? driverLocations : mockDriverLocations).map((driver: DriverLocation) => (
          <Card 
            key={driver.id} 
            className={`cursor-pointer transition-all ${
              selectedDriver === driver.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            }`}
            onClick={() => focusOnDriver(driver)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getVehicleIcon(driver.vehicleType)}
                  <span className="font-medium text-sm">{driver.name}</span>
                </div>
                <Badge className={getStatusBadgeColor(driver.status)}>
                  {driver.status}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div>{driver.vehicleRegistration}</div>
                {driver.speed > 0 && (
                  <div className="flex items-center space-x-1">
                    <Navigation className="w-3 h-3" />
                    <span>{driver.speed} km/h</span>
                  </div>
                )}
                {driver.currentJob && (
                  <div className="text-blue-600">
                    Job: {driver.currentJob.customerName}
                  </div>
                )}
                <div className="flex items-center space-x-1 text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>Updated {new Date(driver.lastUpdate).toLocaleTimeString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isFullScreen) {
    return (
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Live Vehicle Tracking
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <MapContent />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Smartphone className="w-5 h-5 mr-2" />
          Live Driver Tracking (Mobile)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MapContent />
      </CardContent>
    </Card>
  );
}