import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapPin, 
  Plus, 
  Scan, 
  Mic, 
  Navigation, 
  Package, 
  Clock, 
  Route, 
  BarChart3, 
  Settings,
  Play,
  ChevronUp,
  ChevronDown,
  Target,
  CheckCircle,
  Camera
} from "lucide-react";

export default function MoovlyGoDashboard() {
  const [stops, setStops] = useState([
    {
      id: "1",
      packageId: "PKG001",
      addressRaw: "Pick n Pay Clothing, Canal Walk",
      addressNorm: "Canal Walk Shopping Centre, Century City, Cape Town, 7441",
      loadIndex: 1,
      status: "pending",
      timeWindow: "09:00-17:00"
    },
    {
      id: "2", 
      packageId: "PKG002",
      addressRaw: "Woolworths Food, V&A Waterfront",
      addressNorm: "V&A Waterfront, Cape Town, 8001",
      loadIndex: 2,
      status: "pending",
      timeWindow: "10:00-18:00"
    }
  ]);

  const [optimizationMode, setOptimizationMode] = useState("balanced");
  const [showOptimization, setShowOptimization] = useState(false);

  const handleAddStop = () => {
    // Mock add stop functionality
    const newStop = {
      id: String(stops.length + 1),
      packageId: `PKG${String(stops.length + 1).padStart(3, '0')}`,
      addressRaw: "New delivery address",
      addressNorm: "New normalized address",
      loadIndex: stops.length + 1,
      status: "pending",
      timeWindow: "09:00-17:00"
    };
    setStops([...stops, newStop]);
  };

  const handleOptimize = () => {
    setShowOptimization(true);
    // Mock optimization results
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M8 3C7.5 3 7 3.5 7 4V6H5C4.5 6 4 6.5 4 7V20C4 20.5 4.5 21 5 21H8V19H6V8H8V20C8 20.5 8.5 21 9 21H11C11.5 21 12 20.5 12 20V4C12 3.5 11.5 3 11 3H8Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Moovly Go</h1>
              <p className="text-sm text-slate-600">Load. Plan. Deliver.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">JD</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Load Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Load Packages</span>
                </CardTitle>
                <CardDescription>
                  Scan, speak, or type addresses in the order you load your vehicle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Input Methods */}
                <div className="grid sm:grid-cols-4 gap-3">
                  <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
                    <Scan className="w-4 h-4" />
                    <span>Scan</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Camera className="w-4 h-4" />
                    <span>OCR</span>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <Mic className="w-4 h-4" />
                    <span>Voice</span>
                  </Button>
                  <Button variant="outline" onClick={handleAddStop}>
                    <Plus className="w-4 h-4 mr-2" />
                    Type
                  </Button>
                </div>

                {/* Quick Add Form */}
                <div className="border rounded-lg p-4 bg-slate-50">
                  <Input 
                    placeholder="Type to add more stops..." 
                    className="mb-3"
                  />
                  <div className="flex items-center space-x-3 text-sm text-slate-600">
                    <span>Package finder: Not set</span>
                    <span>•</span>
                    <span>Packages: 1</span>
                    <span>•</span>
                    <span>Type: Delivery</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stops List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Route className="w-5 h-5 text-green-600" />
                    <span>Your Stops</span>
                  </div>
                  <Badge variant="secondary">{stops.length} stops</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {stops.map((stop, index) => (
                  <div key={stop.id} className="border rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold text-sm">{stop.loadIndex}</span>
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-medium text-slate-900">{stop.addressRaw}</h3>
                          <p className="text-sm text-slate-600">{stop.addressNorm}</p>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4" />
                            <span>{stop.packageId}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{stop.timeWindow}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>Delivery</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Optimization Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Optimize Route</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Optimization Mode
                  </label>
                  <Select value={optimizationMode} onValueChange={setOptimizationMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strictLIFO">Strict LIFO</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="fastest">Fastest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleOptimize}
                  disabled={stops.length < 2}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Optimize Route
                </Button>

                {showOptimization && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-700">
                        <div className="font-medium">Route Optimized!</div>
                        <div className="mt-1">
                          • Save 45 minutes
                          <br />
                          • Save 12 km distance
                          <br />
                          • 85% efficiency score
                        </div>
                      </div>
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Start Navigation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <span>Today's Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-700">0</div>
                    <div className="text-xs text-blue-600">Completed</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-700">{stops.length}</div>
                    <div className="text-xs text-green-600">Total Stops</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Estimated Time</span>
                    <span className="font-medium">2h 15m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Distance</span>
                    <span className="font-medium">47 km</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Fuel Cost</span>
                    <span className="font-medium">R85</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  Set Starting Point
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Add Time Windows
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Load Previous Route
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}