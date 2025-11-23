import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: string | Date;
  type: 'planned' | 'actual';
  speed?: number;
}

interface RouteComparisonProps {
  plannedRoute: RoutePoint[];
  actualRoute: RoutePoint[];
  showPlanned?: boolean;
  showActual?: boolean;
  currentPosition?: number; // 0-100 percentage for playback
  className?: string;
}

const RouteComparisonMap = ({ 
  plannedRoute, 
  actualRoute, 
  showPlanned = true, 
  showActual = true,
  currentPosition = 0,
  className = "h-96"
}: RouteComparisonProps) => {
  
  // Convert route points to coordinate arrays for Polyline
  const plannedCoords: [number, number][] = plannedRoute.map(point => [point.lat, point.lng]);
  const actualCoords: [number, number][] = actualRoute.map(point => [point.lat, point.lng]);
  
  // Calculate center point for map initialization
  const center: [number, number] = plannedCoords.length > 0 
    ? plannedCoords[0] 
    : actualCoords.length > 0 
    ? actualCoords[0] 
    : [-26.2041, 28.0473]; // Default to Johannesburg
  
  // Calculate current position markers based on playback position
  const getCurrentPositionIndex = (route: RoutePoint[], position: number) => {
    const index = Math.floor((position / 100) * (route.length - 1));
    return Math.max(0, Math.min(index, route.length - 1));
  };

  const plannedCurrentIndex = getCurrentPositionIndex(plannedRoute, currentPosition);
  const actualCurrentIndex = getCurrentPositionIndex(actualRoute, currentPosition);

  // Custom marker icons
  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const currentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />

        {/* Planned Route - Green solid line */}
        {showPlanned && plannedCoords.length > 1 && (
          <Polyline 
            positions={plannedCoords} 
            pathOptions={{ 
              color: '#22c55e', 
              weight: 4, 
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }} 
          />
        )}

        {/* Actual Route - Blue dashed line */}
        {showActual && actualCoords.length > 1 && (
          <Polyline 
            positions={actualCoords} 
            pathOptions={{ 
              color: '#3b82f6', 
              weight: 4, 
              opacity: 0.8,
              dashArray: '10,10',
              lineCap: 'round',
              lineJoin: 'round'
            }} 
          />
        )}

        {/* Start and End Markers */}
        {plannedCoords.length > 0 && (
          <>
            <Marker position={plannedCoords[0]} icon={startIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>Start Point</strong><br/>
                  Planned: {new Date(plannedRoute[0]?.timestamp).toLocaleTimeString()}
                  {actualRoute[0] && (
                    <>
                      <br/>Actual: {new Date(actualRoute[0].timestamp).toLocaleTimeString()}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
            
            <Marker position={plannedCoords[plannedCoords.length - 1]} icon={endIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>End Point</strong><br/>
                  Planned: {new Date(plannedRoute[plannedRoute.length - 1]?.timestamp).toLocaleTimeString()}
                  {actualRoute[actualRoute.length - 1] && (
                    <>
                      <br/>Actual: {new Date(actualRoute[actualRoute.length - 1].timestamp).toLocaleTimeString()}
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Current Position Markers during playback */}
        {currentPosition > 0 && currentPosition < 100 && (
          <>
            {showPlanned && plannedRoute[plannedCurrentIndex] && (
              <Marker 
                position={[plannedRoute[plannedCurrentIndex].lat, plannedRoute[plannedCurrentIndex].lng]} 
                icon={currentIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Planned Position</strong><br/>
                    Time: {new Date(plannedRoute[plannedCurrentIndex].timestamp).toLocaleTimeString()}<br/>
                    {plannedRoute[plannedCurrentIndex].speed && (
                      <>Speed: {plannedRoute[plannedCurrentIndex].speed} km/h</>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
            
            {showActual && actualRoute[actualCurrentIndex] && (
              <Marker 
                position={[actualRoute[actualCurrentIndex].lat, actualRoute[actualCurrentIndex].lng]} 
                icon={currentIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>Actual Position</strong><br/>
                    Time: {new Date(actualRoute[actualCurrentIndex].timestamp).toLocaleTimeString()}<br/>
                    {actualRoute[actualCurrentIndex].speed && (
                      <>Speed: {actualRoute[actualCurrentIndex].speed} km/h</>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default RouteComparisonMap;