import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Truck, 
  Users, 
  Route, 
  Wifi, 
  WifiOff, 
  Coffee, 
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Navigation
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
// Real-time updates will be handled by existing websocket connection

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  networkStatus: string;
  isOnBreak: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  lastLocationUpdate?: string;
  bearing?: number;
  speed?: number;
  vehicleId?: number;
  currentRoute?: string;
}

interface Vehicle {
  id: number;
  vehicleNumber: string;
  registration: string;
  make: string;
  model: string;
  status: string;
  assignedDriverId?: number;
}

interface Job {
  id: number;
  jobNumber: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  priority: string;
  driverId?: number;
  currentDriverLatitude?: number;
  currentDriverLongitude?: number;
  lastLocationUpdate?: string;
}

// Custom driver marker icons based on status
const createDriverIcon = (driver: Driver, vehicle?: Vehicle) => {
  let color = '#6b7280'; // Default gray
  let icon = '🚛';
  
  if (driver.networkStatus === 'offline') {
    color = '#ef4444'; // Red for offline
    icon = '📴';
  } else if (driver.isOnBreak) {
    color = '#f59e0b'; // Orange for break
    icon = '☕';
  } else if (driver.status === 'active') {
    color = '#10b981'; // Green for active
    icon = '🚛';
  } else {
    color = '#6b7280'; // Gray for inactive
    icon = '🚛';
  }
  
  const html = `
    <div style="
      width: 40px;
      height: 40px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${icon}</div>
  `;
  
  return L.divIcon({
    html,
    className: 'driver-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Job location markers
const createJobIcon = (job: Job) => {
  let color = '#3b82f6'; // Blue for pending
  if (job.status === 'in_progress') color = '#f59e0b'; // Orange for in progress
  if (job.status === 'completed') color = '#10b981'; // Green for completed
  if (job.status === 'delayed') color = '#ef4444'; // Red for delayed
  
  const html = `
    <div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 2px solid white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    ">📦</div>
  `;
  
  return L.divIcon({
    html,
    className: 'job-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

// Map controls component
function MapControls({ onZoomIn, onZoomOut, onResetView }: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}) {
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="bg-white shadow-md"
        onClick={onZoomIn}
        data-testid="button-zoom-in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white shadow-md"
        onClick={onZoomOut}
        data-testid="button-zoom-out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white shadow-md"
        onClick={onResetView}
        data-testid="button-reset-view"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Custom hook for map control
function MapController({ drivers, jobs, showDrivers, showJobs, showRoutes }: {
  drivers: Driver[];
  jobs: Job[];
  showDrivers: boolean;
  showJobs: boolean;
  showRoutes: boolean;
}) {
  const map = useMap();
  
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    
    if (showDrivers) {
      drivers.forEach(driver => {
        if (driver.currentLatitude && driver.currentLongitude) {
          bounds.extend([driver.currentLatitude, driver.currentLongitude]);
        }
      });
    }
    
    if (showJobs) {
      jobs.forEach(job => {
        if (job.currentDriverLatitude && job.currentDriverLongitude) {
          bounds.extend([job.currentDriverLatitude, job.currentDriverLongitude]);
        }
      });
    }
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, drivers, jobs, showDrivers, showJobs]);
  
  return null;
}

export default function FleetMapPage() {
  const [showDrivers, setShowDrivers] = useState(true);
  const [showJobs, setShowJobs] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  // Fetch drivers data
  const { data: drivers = [], refetch: refetchDrivers } = useQuery({
    queryKey: ['/api/drivers'],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
  });

  // Fetch vehicles data
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  // Fetch active jobs data
  const { data: jobs = [], refetch: refetchJobs } = useQuery({
    queryKey: ['/api/jobs'],
    refetchInterval: 10000, // Refresh every 10 seconds for real-time feel
  });

  // Filter drivers with valid locations
  const driversWithLocation = useMemo(() => {
    return drivers.filter((driver: Driver) => 
      driver.currentLatitude && 
      driver.currentLongitude &&
      Math.abs(driver.currentLatitude) > 0 &&
      Math.abs(driver.currentLongitude) > 0
    );
  }, [drivers]);

  // Filter jobs with driver locations
  const jobsWithLocation = useMemo(() => {
    return jobs.filter((job: Job) => 
      job.currentDriverLatitude && 
      job.currentDriverLongitude &&
      job.status === 'in_progress'
    );
  }, [jobs]);

  // Calculate center point for map
  const mapCenter: [number, number] = useMemo(() => {
    if (driversWithLocation.length > 0) {
      const avgLat = driversWithLocation.reduce((sum, driver) => sum + (driver.currentLatitude || 0), 0) / driversWithLocation.length;
      const avgLng = driversWithLocation.reduce((sum, driver) => sum + (driver.currentLongitude || 0), 0) / driversWithLocation.length;
      return [avgLat, avgLng];
    }
    return [-26.2041, 28.0473]; // Default to Johannesburg
  }, [driversWithLocation]);

  // Statistics
  const stats = useMemo(() => {
    const onlineDrivers = drivers.filter((d: Driver) => d.networkStatus === 'online').length;
    const activeJobs = jobs.filter((j: Job) => j.status === 'in_progress').length;
    const driversOnBreak = drivers.filter((d: Driver) => d.isOnBreak).length;
    
    return {
      totalDrivers: drivers.length,
      onlineDrivers,
      activeJobs,
      driversOnBreak
    };
  }, [drivers, jobs]);

  const handleMapControl = (action: string) => {
    // Map control actions will be handled by the MapController component
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen" data-testid="page-fleet-map">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-page-title">
            Fleet Map
          </h1>
          <p className="text-gray-600 mt-1" data-testid="text-page-description">
            Real-time tracking of drivers and job routes
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="text-total-drivers">
                  {stats.totalDrivers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Drivers</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-online-drivers">
                  {stats.onlineDrivers}
                </p>
              </div>
              <Wifi className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="text-active-jobs">
                  {stats.activeJobs}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Break</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-drivers-on-break">
                  {stats.driversOnBreak}
                </p>
              </div>
              <Coffee className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Map Layers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-drivers"
                checked={showDrivers}
                onCheckedChange={setShowDrivers}
                data-testid="switch-show-drivers"
              />
              <label htmlFor="show-drivers" className="text-sm font-medium">
                Show Drivers ({driversWithLocation.length})
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-jobs"
                checked={showJobs}
                onCheckedChange={setShowJobs}
                data-testid="switch-show-jobs"
              />
              <label htmlFor="show-jobs" className="text-sm font-medium">
                Show Jobs ({jobsWithLocation.length})
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-routes"
                checked={showRoutes}
                onCheckedChange={setShowRoutes}
                data-testid="switch-show-routes"
              />
              <label htmlFor="show-routes" className="text-sm font-medium">
                Show Routes
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-[600px] relative" data-testid="container-map">
            <MapContainer
              center={mapCenter}
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapController 
                drivers={driversWithLocation}
                jobs={jobsWithLocation}
                showDrivers={showDrivers}
                showJobs={showJobs}
                showRoutes={showRoutes}
              />

              {/* Driver Markers */}
              {showDrivers && driversWithLocation.map((driver) => {
                const vehicle = vehicles.find((v: Vehicle) => v.id === driver.vehicleId);
                return (
                  <Marker
                    key={`driver-${driver.id}`}
                    position={[driver.currentLatitude!, driver.currentLongitude!]}
                    icon={createDriverIcon(driver, vehicle)}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-semibold text-lg">{driver.name}</h3>
                        <div className="space-y-1 mt-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={driver.networkStatus === 'online' ? 'default' : 'destructive'}
                            >
                              {driver.networkStatus === 'online' ? (
                                <><Wifi className="w-3 h-3 mr-1" /> Online</>
                              ) : (
                                <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
                              )}
                            </Badge>
                            {driver.isOnBreak && (
                              <Badge variant="outline">
                                <Coffee className="w-3 h-3 mr-1" /> On Break
                              </Badge>
                            )}
                          </div>
                          {vehicle && (
                            <p className="text-sm text-gray-600">
                              <Truck className="w-3 h-3 inline mr-1" />
                              {vehicle.make} {vehicle.model} ({vehicle.registration})
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            <Navigation className="w-3 h-3 inline mr-1" />
                            Speed: {driver.speed || 0} km/h
                          </p>
                          {driver.lastLocationUpdate && (
                            <p className="text-xs text-gray-500">
                              Last update: {new Date(driver.lastLocationUpdate).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Job Route Polylines */}
              {showRoutes && showJobs && jobsWithLocation.map((job) => {
                // For now, we'll show a simple line from driver location to delivery
                // In a real implementation, you'd geocode the addresses or use routing APIs
                return (
                  <Polyline
                    key={`route-${job.id}`}
                    positions={[
                      [job.currentDriverLatitude!, job.currentDriverLongitude!],
                      // This would be the actual delivery coordinates in a real implementation
                      [job.currentDriverLatitude! + 0.01, job.currentDriverLongitude! + 0.01]
                    ]}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.7}
                    dashArray="5, 10"
                  />
                );
              })}

              {/* Job Markers */}
              {showJobs && jobsWithLocation.map((job) => (
                <Marker
                  key={`job-${job.id}`}
                  position={[job.currentDriverLatitude!, job.currentDriverLongitude!]}
                  icon={createJobIcon(job)}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-semibold text-lg">{job.jobNumber}</h3>
                      <div className="space-y-1 mt-2">
                        <p className="text-sm"><strong>Customer:</strong> {job.customerName}</p>
                        <p className="text-sm"><strong>Pickup:</strong> {job.pickupAddress}</p>
                        <p className="text-sm"><strong>Delivery:</strong> {job.deliveryAddress}</p>
                        <Badge 
                          variant={
                            job.status === 'completed' ? 'default' :
                            job.status === 'in_progress' ? 'secondary' :
                            job.status === 'delayed' ? 'destructive' : 'outline'
                          }
                        >
                          {job.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {job.priority === 'high' && (
                          <Badge variant="destructive" className="ml-2">HIGH PRIORITY</Badge>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <MapControls 
              onZoomIn={() => handleMapControl('zoomIn')}
              onZoomOut={() => handleMapControl('zoomOut')}
              onResetView={() => handleMapControl('resetView')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Driver List Sidebar */}
      {driversWithLocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Drivers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {driversWithLocation.map((driver) => {
                const vehicle = vehicles.find((v: Vehicle) => v.id === driver.vehicleId);
                return (
                  <Card key={driver.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{driver.name}</h4>
                        <Badge 
                          variant={driver.networkStatus === 'online' ? 'default' : 'destructive'}
                        >
                          {driver.networkStatus}
                        </Badge>
                      </div>
                      {vehicle && (
                        <p className="text-sm text-gray-600 mb-1">
                          {vehicle.make} {vehicle.model} ({vehicle.registration})
                        </p>
                      )}
                      <div className="flex gap-2 mb-2">
                        {driver.isOnBreak && (
                          <Badge variant="outline">
                            <Coffee className="w-3 h-3 mr-1" /> Break
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {driver.speed || 0} km/h
                        </Badge>
                      </div>
                      {driver.lastLocationUpdate && (
                        <p className="text-xs text-gray-500">
                          Updated: {new Date(driver.lastLocationUpdate).toLocaleTimeString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}