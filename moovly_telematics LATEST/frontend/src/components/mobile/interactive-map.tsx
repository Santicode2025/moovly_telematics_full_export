import { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Circle, 
  CheckCircle, 
  Target, 
  RotateCcw,
  Play,
  Square,
  Hand,
  ZoomIn,
  ZoomOut
} from "lucide-react";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Job {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  status: 'pending' | 'grouped' | 'completed';
  groupId?: string;
}

interface CircleGroup {
  id: string;
  center: L.LatLng;
  radius: number;
  jobs: Job[];
  groupNumber: number;
  color: string;
}

// Custom icons like Circuit - clean blue circles with white numbers
const createCustomIcon = (number: number | string, isCompleted: boolean = false, isGrouped: boolean = false) => {
  const backgroundColor = isCompleted ? '#10b981' : isGrouped ? '#f59e0b' : '#3b82f6';
  const content = isCompleted ? '✓' : number;
  
  const divIcon = `
    <div style="
      width: 32px;
      height: 32px;
      background: ${backgroundColor};
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">${content}</div>
  `;
  
  return L.divIcon({
    html: divIcon,
    className: 'circuit-style-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

interface InteractiveMapProps {
  jobs: Job[];
  onJobsUpdate: (jobs: Job[]) => void;
  onOptimizeGroup: (groupedJobs: Job[], remainingJobs: Job[]) => void;
}

// Drawing control component
function DrawingControl({ onCircleCreated, isDrawing, setIsDrawing }: {
  onCircleCreated: (center: L.LatLng, radius: number) => void;
  isDrawing: boolean;
  setIsDrawing: (drawing: boolean) => void;
}) {
  const map = useMap();
  const [drawingCircle, setDrawingCircle] = useState<L.Circle | null>(null);
  const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);

  useMapEvents({
    mousedown(e) {
      if (!isDrawing) return;
      setStartPoint(e.latlng);
      
      // Create initial circle
      const circle = L.circle(e.latlng, { radius: 0, color: '#0ea5e9', fillOpacity: 0.1 });
      circle.addTo(map);
      setDrawingCircle(circle);
    },
    
    mousemove(e) {
      if (!isDrawing || !startPoint || !drawingCircle) return;
      
      const radius = startPoint.distanceTo(e.latlng);
      drawingCircle.setRadius(radius);
    },
    
    mouseup(e) {
      if (!isDrawing || !startPoint || !drawingCircle) return;
      
      const radius = startPoint.distanceTo(e.latlng);
      if (radius > 50) { // Minimum radius of 50 meters
        onCircleCreated(startPoint, radius);
      }
      
      map.removeLayer(drawingCircle);
      setDrawingCircle(null);
      setStartPoint(null);
      setIsDrawing(false);
    }
  });

  return null;
}

export default function InteractiveMap({ jobs, onJobsUpdate, onOptimizeGroup }: InteractiveMapProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Job[]>([]);
  const [circleGroups, setCircleGroups] = useState<CircleGroup[]>([]);
  const [groupCounter, setGroupCounter] = useState(1);
  const mapRef = useRef<L.Map | null>(null);
  
  // Cape Town center coordinates (fixed from Johannesburg)
  const defaultCenter: [number, number] = [-33.9249, 18.4241];
  
  // Generate route coordinates from jobs in order
  const getRouteCoordinates = (): [number, number][] => {
    const sortedJobs = [...jobs].sort((a, b) => a.priority - b.priority);
    return sortedJobs.map(job => [job.lat, job.lng] as [number, number]);
  };
  
  // Get map bounds based on job locations
  const getMapBounds = () => {
    if (jobs.length === 0) return defaultCenter;
    
    const validJobs = jobs.filter(job => job.lat && job.lng);
    if (validJobs.length === 0) return defaultCenter;
    
    const lats = validJobs.map(job => job.lat);
    const lngs = validJobs.map(job => job.lng);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    return [centerLat, centerLng] as [number, number];
  };
  
  // Auto-fit map to show all jobs
  const FitBoundsToJobs = () => {
    const map = useMap();
    
    useEffect(() => {
      if (jobs.length > 0) {
        const validJobs = jobs.filter(job => job.lat && job.lng);
        if (validJobs.length > 0) {
          const bounds = L.latLngBounds(validJobs.map(job => [job.lat, job.lng] as [number, number]));
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    }, [jobs, map]);
    
    return null;
  };
  
  // Check if point is inside circle
  const isJobInCircle = (job: Job, center: L.LatLng, radius: number) => {
    const jobLatLng = L.latLng(job.lat, job.lng);
    return center.distanceTo(jobLatLng) <= radius;
  };

  // Handle circle creation
  const handleCircleCreated = (center: L.LatLng, radius: number) => {
    // Find jobs within the circle
    const jobsInCircle = jobs.filter(job => 
      job.status === 'pending' && isJobInCircle(job, center, radius)
    );
    
    if (jobsInCircle.length === 0) return;
    
    // Generate group color
    const colors = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];
    const groupColor = colors[circleGroups.length % colors.length];
    
    const newGroup: CircleGroup = {
      id: `group-${Date.now()}`,
      center,
      radius,
      jobs: jobsInCircle,
      groupNumber: groupCounter,
      color: groupColor
    };
    
    setCircleGroups([...circleGroups, newGroup]);
    setGroupCounter(groupCounter + 1);
    setSelectedJobs(jobsInCircle.map(job => job.id));
    setCurrentGroup(jobsInCircle);
  };

  const handleConfirmGroup = () => {
    if (selectedJobs.length === 0 || circleGroups.length === 0) return;
    
    const groupId = `group-${Date.now()}`;
    const updatedJobs = jobs.map(job => {
      if (selectedJobs.includes(job.id)) {
        return { ...job, status: 'grouped' as const, groupId, priority: selectedJobs.indexOf(job.id) + 1 };
      }
      return job;
    });
    
    const groupedJobs = updatedJobs.filter(job => job.groupId === groupId);
    const remainingJobs = updatedJobs.filter(job => !job.groupId);
    
    onJobsUpdate(updatedJobs);
    onOptimizeGroup(groupedJobs, remainingJobs);
    
    // Reset selection
    setIsSelecting(false);
    setSelectedJobs([]);
    setCurrentGroup([]);
  };

  const handleClearSelection = () => {
    setSelectedJobs([]);
    setCurrentGroup([]);
    setIsSelecting(false);
    setIsDrawing(false);
    setCircleGroups([]);
    setGroupCounter(1);
  };
  
  const handleOptimizeSelectedGroup = () => {
    if (circleGroups.length === 0) return;
    
    // Get the most recent group
    const latestGroup = circleGroups[circleGroups.length - 1];
    const groupedJobs = latestGroup.jobs;
    const remainingJobs = jobs.filter(job => !groupedJobs.find(gj => gj.id === job.id));
    
    onOptimizeGroup(groupedJobs, remainingJobs);
  };

  const handleCompleteGroup = () => {
    const updatedJobs = jobs.map(job => {
      if (job.status === 'grouped') {
        return { ...job, status: 'completed' as const };
      }
      return job;
    });
    
    const remainingJobs = updatedJobs.filter(job => job.status === 'pending');
    onJobsUpdate(updatedJobs);
    
    if (remainingJobs.length > 0) {
      onOptimizeGroup([], remainingJobs);
    }
    
    setCurrentGroup([]);
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center">
          <MapPin className="w-4 h-4 mr-2" />
          Route Customization
        </h3>
        <div className="flex items-center space-x-2">
          {!isDrawing ? (
            <Button
              size="sm"
              onClick={() => setIsDrawing(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white"
            >
              <Circle className="w-3 h-3 mr-1" />
              Draw Circle
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDrawing(false)}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Cancel Draw
            </Button>
          )}
          {circleGroups.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearSelection}
            >
              Clear Groups
            </Button>
          )}
        </div>
      </div>

      {/* Drawing Instructions */}
      {isDrawing && (
        <Card className="border-sky-200 bg-sky-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 text-sm text-sky-800">
              <Hand className="w-4 h-4" />
              <span>Click and drag on the map to draw a circle around jobs you want to group</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real Leaflet Interactive Map */}
      <Card className="relative overflow-hidden">
        <div style={{ height: '400px', cursor: isDrawing ? 'crosshair' : 'default' }}>
          <MapContainer
            center={getMapBounds()}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            {/* Satellite imagery like Circuit */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
            
            {/* Route polyline connecting all stops like Circuit */}
            {jobs.length > 1 && (
              <Polyline
                positions={getRouteCoordinates()}
                pathOptions={{
                  color: '#3b82f6',
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '0'
                }}
              />
            )}
            
            {/* Auto-fit bounds to jobs */}
            <FitBoundsToJobs />
            
            {/* Drawing Control */}
            <DrawingControl 
              onCircleCreated={handleCircleCreated} 
              isDrawing={isDrawing} 
              setIsDrawing={setIsDrawing} 
            />
            
            {/* Job Markers */}
            {jobs.map((job, index) => {
              const displayNumber = job.priority || (index + 1);
              const isCompleted = job.status === 'completed';
              const isGrouped = job.status === 'grouped';
              
              return (
                <Marker
                  key={job.id}
                  position={[job.lat, job.lng]}
                  icon={createCustomIcon(displayNumber, isCompleted, isGrouped)}
                >
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{job.title}</p>
                      <p className="text-slate-600">{job.address}</p>
                      <p className="text-xs mt-1">Status: {job.status}</p>
                      {job.priority && <p className="text-xs">Priority: {job.priority}</p>}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
            
            {/* Circle Groups Overlay */}
            {circleGroups.map((group) => (
              <Marker
                key={`group-${group.id}`}
                position={[group.center.lat, group.center.lng]}
                icon={L.divIcon({
                  html: `
                    <div style="
                      width: ${group.radius * 2 / 111320}px; 
                      height: ${group.radius * 2 / 111320}px;
                      border: 3px solid ${group.color};
                      border-radius: 50%;
                      background: ${group.color}20;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: ${group.color};
                      font-weight: bold;
                      font-size: 14px;
                    ">${group.groupNumber}</div>
                  `,
                  className: 'circle-group-marker',
                  iconSize: [group.radius * 2 / 111320, group.radius * 2 / 111320],
                  iconAnchor: [group.radius / 111320, group.radius / 111320]
                })}
              />
            ))}
          </MapContainer>
        </div>
        
        {/* Enhanced Map Controls like Circuit */}
        <div className="absolute top-2 right-2 z-[1000] flex flex-col space-y-1">
          <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
            <button
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 border-b"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.zoomIn();
                }
              }}
            >
              <span className="text-lg font-bold text-gray-700">+</span>
            </button>
            <button
              className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
              onClick={() => {
                if (mapRef.current) {
                  mapRef.current.zoomOut();
                }
              }}
            >
              <span className="text-lg font-bold text-gray-700">−</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Circle Groups Summary */}
      {circleGroups.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-blue-900">Drawn Groups ({circleGroups.length})</h4>
              <Badge className="bg-blue-500 text-white">Ready to Optimize</Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              {circleGroups.map((group, groupIndex) => (
                <div key={group.id} className="bg-white rounded p-2 border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm" style={{ color: group.color }}>
                      Group {group.groupNumber} ({group.jobs.length} jobs)
                    </span>
                    <div 
                      className="w-4 h-4 rounded-full border-2" 
                      style={{ borderColor: group.color, backgroundColor: `${group.color}40` }}
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    {group.jobs.slice(0, 2).map(job => job.title).join(', ')}
                    {group.jobs.length > 2 && ` +${group.jobs.length - 2} more`}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleOptimizeSelectedGroup}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Target className="w-4 h-4 mr-1" />
                Optimize Groups
              </Button>
              <Button
                onClick={handleClearSelection}
                variant="outline"
                size="sm"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Jobs Summary */}
      {selectedJobs.length > 0 && (
        <Card className="border-sky-200 bg-sky-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sky-900">Selected Jobs ({selectedJobs.length})</h4>
              <Badge className="bg-sky-500 text-white">Priority Group</Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              {currentGroup.slice(0, 5).map((job, index) => (
                <div key={job.id} className="flex items-center space-x-2 text-sm">
                  <div className="w-5 h-5 bg-sky-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="text-slate-700">{job.title}</span>
                </div>
              ))}
              {currentGroup.length > 5 && (
                <div className="text-xs text-slate-500 mt-1">
                  +{currentGroup.length - 5} more jobs in this group
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleConfirmGroup}
                className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                size="sm"
              >
                <Target className="w-4 h-4 mr-1" />
                Confirm Group
              </Button>
              <Button
                onClick={handleClearSelection}
                variant="outline"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Group Progress */}
      {jobs.some(job => job.status === 'grouped') && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-orange-900">Active Priority Group</h4>
              <Badge variant="secondary">In Progress</Badge>
            </div>
            
            <div className="space-y-2 mb-4">
              {jobs
                .filter(job => job.status === 'grouped')
                .sort((a, b) => a.priority - b.priority)
                .map(job => (
                  <div key={job.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {job.priority}
                    </div>
                    <span className="text-slate-700">{job.title}</span>
                  </div>
                ))}
            </div>
            
            <Button
              onClick={handleCompleteGroup}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Group & Re-optimize Others
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card>
        <CardContent className="p-3">
          <h5 className="font-medium text-slate-900 mb-2">Map Legend</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded-full"></div>
              <span>Pending Jobs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-sky-500 rounded-full"></div>
              <span>Selected</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <span>Priority Group</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}