import { MapPin, Route, Clock } from "lucide-react";

interface RouteData {
  id: string;
  driverName: string;
  startLocation: string;
  endLocation: string;
  distance: string;
  duration: string;
  date: string;
  moovScore: number;
}

interface RouteHistoryMapProps {
  data: RouteData[];
}

const RouteHistoryMap = ({ data }: RouteHistoryMapProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No route data available</p>
          <p className="text-sm text-gray-400">Route history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-48 overflow-y-auto">
      {data.slice(0, 5).map((route) => (
        <div key={route.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Route className="h-4 w-4 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {route.driverName}
              </p>
              <p className="text-xs text-gray-500">
                {route.startLocation} → {route.endLocation}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">{route.distance}</p>
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {route.duration}
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              route.moovScore >= 85 ? "bg-green-100 text-green-800" :
              route.moovScore >= 70 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {route.moovScore}%
            </div>
          </div>
        </div>
      ))}
      {data.length > 5 && (
        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all {data.length} routes
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteHistoryMap;