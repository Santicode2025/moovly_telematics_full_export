import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle, 
  User,
  Car,
  MessageSquare,
  TrendingUp,
  Fuel,
  Wifi,
  Bell,
  Star,
  Camera,
  Coffee,
  RefreshCw
} from "lucide-react";

export default function MobileAppMockup() {
  const [activeTab, setActiveTab] = useState("jobs");

  const tabs = [
    { id: "jobs", label: "Jobs", icon: MapPin },
    { id: "moov", label: "MoovScore", icon: TrendingUp },
    { id: "vehicle", label: "Vehicle", icon: Car },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "sync", label: "Sync", icon: RefreshCw }
  ];

  const TabContent = () => {
    switch (activeTab) {
      case "jobs":
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">JOB #M-2847</span>
                <Badge className="bg-orange-100 text-orange-700 text-xs">High Priority</Badge>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>Pick up: 45 Long Street, Cape Town</span>
                </div>
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  <span>Deliver: 123 Main Road, Bellville</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Due: 2:30 PM</span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="flex-1 text-xs">Start Job</Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Phone className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">JOB #M-2846</span>
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              </div>
              <div className="text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Completed at 11:45 AM</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">JOB #M-2848</span>
                <Badge variant="secondary" className="text-xs">Scheduled</Badge>
              </div>
              <div className="text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Scheduled: 4:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        );

      case "moov":
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-3">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(82 / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-xl font-bold text-blue-600">82</div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
              <h3 className="font-semibold">John Smith</h3>
              <p className="text-sm text-gray-600">Good Performance</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-green-600">94%</div>
                <div className="text-xs text-gray-600">On-time Rate</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-600">8.2L</div>
                <div className="text-xs text-gray-600">Fuel Efficiency</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-600">4.8</div>
                <div className="text-xs text-gray-600">Safety Score</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-orange-600">12</div>
                <div className="text-xs text-gray-600">Jobs Today</div>
              </div>
            </div>
          </div>
        );

      case "vehicle":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Vehicle Checklist</h3>
              <div className="space-y-2">
                {["Tyres", "Lights", "Brakes", "Fluids", "Mirrors"].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <span className="text-sm">{item}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Fuel Upload</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Odometer Photo</span>
                  <Camera className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Fuel Slip Photo</span>
                  <Camera className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Pump Station Photo</span>
                  <Camera className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button size="sm" className="w-full mt-2 text-xs">Upload Fuel Entry</Button>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Vehicle: VH-001</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Mini Cooper Countryman</div>
                <div>Odometer: 45,230 km</div>
                <div>Last Service: 15 Mar 2025</div>
              </div>
            </div>
          </div>
        );

      case "messages":
        return (
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">D</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium">Dispatch</div>
                  <div className="text-xs text-gray-600 mt-1">Please prioritize Job #M-2847 - customer is waiting</div>
                  <div className="text-xs text-gray-400 mt-1">2 min ago</div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">J</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium">You</div>
                  <div className="text-xs text-gray-600 mt-1">On my way now, ETA 15 minutes</div>
                  <div className="text-xs text-gray-400 mt-1">1 min ago</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">D</span>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium">Dispatch</div>
                  <div className="text-xs text-gray-600 mt-1">Great work today! All deliveries completed on time 👍</div>
                  <div className="text-xs text-gray-400 mt-1">1 hour ago</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Type a message..." 
                  className="flex-1 px-3 py-2 text-xs border rounded-lg"
                />
                <Button size="sm" className="text-xs">Send</Button>
              </div>
            </div>
          </div>
        );

      case "sync":
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-sm text-green-700">Online</span>
              </div>
              <div className="text-xs text-gray-600">
                Last sync: 2 minutes ago
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Pending Jobs (0)</h3>
              <div className="text-xs text-gray-600 text-center py-4">
                All jobs synced successfully
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h3 className="font-semibold text-sm mb-2">Sync History</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Job #M-2846 completed</span>
                  <span className="text-green-600">Synced</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Fuel entry uploaded</span>
                  <span className="text-green-600">Synced</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Vehicle checklist</span>
                  <span className="text-green-600">Synced</span>
                </div>
              </div>
            </div>

            <Button className="w-full text-xs">Manual Sync</Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white">
      {/* Mobile Phone Frame */}
      <div className="relative">
        {/* Phone Outline */}
        <div className="bg-gray-900 rounded-3xl p-2">
          <div className="bg-black rounded-2xl p-1">
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Status Bar */}
              <div className="bg-gray-50 px-4 py-1 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-medium">9:41</span>
                </div>
                <div className="flex items-center gap-1">
                  <Wifi className="h-3 w-3" />
                  <div className="w-6 h-3 border border-black rounded-sm">
                    <div className="w-4 h-1 bg-green-500 rounded-sm mt-0.5 ml-0.5"></div>
                  </div>
                </div>
              </div>

              {/* App Header */}
              <div className="bg-blue-900 text-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-bold text-lg">Moovly Driver</h1>
                    <div className="flex items-center gap-2 text-sm opacity-90">
                      <span>John Smith</span>
                      <Badge className="bg-green-500 text-white text-xs">Online</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Coffee className="h-5 w-5" />
                    <Bell className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="px-4 py-4 h-96 overflow-y-auto">
                <TabContent />
              </div>

              {/* Bottom Tab Navigation */}
              <div className="border-t bg-gray-50 px-2 py-2">
                <div className="flex">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex flex-col items-center py-2 px-1 ${
                          isActive 
                            ? 'text-blue-900' 
                            : 'text-gray-400'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        <span className="text-xs font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}