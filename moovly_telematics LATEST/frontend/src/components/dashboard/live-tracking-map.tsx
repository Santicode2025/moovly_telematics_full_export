import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Car, User, RefreshCw, Maximize2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface VehicleLocation {
  id: number;
  vehicleNumber: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'active' | 'idle' | 'offline';
  lastUpdate: string;
  currentJob?: string;
}

// Mock real-time vehicle locations for demonstration
const generateMockLocations = (): VehicleLocation[] => [
  {
    id: 1,
    vehicleNumber: "FL-001",
    driverName: "John Smith",
    latitude: -26.2041 + (Math.random() - 0.5) * 0.1,
    longitude: 28.0473 + (Math.random() - 0.5) * 0.1,
    speed: Math.floor(Math.random() * 80) + 20,
    heading: Math.floor(Math.random() * 360),
    status: 'active',
    lastUpdate: new Date().toISOString(),
    currentJob: "Delivery to Sandton"
  },
  {
    id: 2,
    vehicleNumber: "FL-002", 
    driverName: "Sarah Johnson",
    latitude: -26.1076 + (Math.random() - 0.5) * 0.1,
    longitude: 28.0567 + (Math.random() - 0.5) * 0.1,
    speed: 0,
    heading: 180,
    status: 'idle',
    lastUpdate: new Date().toISOString(),
    currentJob: "On break"
  },
  {
    id: 3,
    vehicleNumber: "VH-COOPER",
    driverName: "Mike Wilson", 
    latitude: -26.1849 + (Math.random() - 0.5) * 0.1,
    longitude: 28.0293 + (Math.random() - 0.5) * 0.1,
    speed: Math.floor(Math.random() * 60) + 30,
    heading: Math.floor(Math.random() * 360),
    status: 'active',
    lastUpdate: new Date().toISOString(),
    currentJob: "Mini Cooper Delivery Route"
  }
];

export function LiveTrackingMap() {
  const [vehicleLocations, setVehicleLocations] = useState<VehicleLocation[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: -26.2041, lng: 28.0473 }); // Johannesburg
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const updateLocations = () => {
      setVehicleLocations(generateMockLocations());
    };

    updateLocations();
    const interval = setInterval(updateLocations, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'idle':
        return 'Idle';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setVehicleLocations(generateMockLocations());
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const centerOnVehicle = (vehicle: VehicleLocation) => {
    setMapCenter({ lat: vehicle.latitude, lng: vehicle.longitude });
    setSelectedVehicle(vehicle);
  };

  return (
    <Card className="h-[500px]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Fleet Tracking</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {vehicleLocations.length} Vehicles
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[400px]">
          {/* Map Area */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-green-50 relative border-r">
            <div className="absolute inset-0 p-4">
              <div className="w-full h-full rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                {/* Map Placeholder with Interactive Elements */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-200 to-green-200 opacity-50"></div>
                
                {/* Simulated Map Grid */}
                <div className="absolute inset-0">
                  <svg className="w-full h-full" viewBox="0 0 400 300">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Road lines */}
                    <path d="M 0 150 Q 100 120 200 150 Q 300 180 400 150" stroke="#6b7280" strokeWidth="3" fill="none" />
                    <path d="M 200 0 L 200 300" stroke="#6b7280" strokeWidth="2" fill="none" />
                    
                    {/* Vehicle markers */}
                    {vehicleLocations.map((vehicle, index) => {
                      const x = 50 + (index * 120) + (Math.sin(Date.now() / 10000 + index) * 20);
                      const y = 120 + (Math.cos(Date.now() / 8000 + index) * 30);
                      
                      return (
                        <g key={vehicle.id}>
                          {/* Vehicle dot */}
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill={vehicle.status === 'active' ? '#10b981' : vehicle.status === 'idle' ? '#f59e0b' : '#ef4444'}
                            stroke="white"
                            strokeWidth="2"
                            className="cursor-pointer hover:r-10 transition-all"
                            onClick={() => setSelectedVehicle(vehicle)}
                          />
                          
                          {/* Vehicle label */}
                          <text
                            x={x}
                            y={y - 15}
                            textAnchor="middle"
                            className="text-xs font-medium fill-gray-700"
                          >
                            {vehicle.vehicleNumber}
                          </text>
                          
                          {/* Speed indicator for active vehicles */}
                          {vehicle.status === 'active' && (
                            <text
                              x={x}
                              y={y + 20}
                              textAnchor="middle"
                              className="text-xs fill-gray-600"
                            >
                              {vehicle.speed} km/h
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
                
                <div className="text-center z-10">
                  <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Live Fleet Tracking Map</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click on vehicle markers to view details
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle List Panel */}
          <div className="bg-white overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm text-gray-900">Active Vehicles</h3>
              <p className="text-xs text-gray-500 mt-1">Real-time location updates</p>
            </div>
            
            <div className="space-y-1">
              {vehicleLocations.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedVehicle?.id === vehicle.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => centerOnVehicle(vehicle)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`}></div>
                      <div>
                        <p className="font-medium text-sm">{vehicle.vehicleNumber}</p>
                        <p className="text-xs text-gray-600">{vehicle.driverName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(vehicle.status)}
                    </Badge>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Navigation className="h-3 w-3" />
                      <span>{vehicle.speed} km/h</span>
                      {vehicle.currentJob && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="truncate">{vehicle.currentJob}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated {new Date(vehicle.lastUpdate).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {vehicleLocations.length === 0 && (
              <div className="p-4 text-center">
                <Car className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No vehicles online</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}