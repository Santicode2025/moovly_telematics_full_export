import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import DeliveryZoneManager from "@/components/moovly-go/delivery-zone-manager";
import { MapPin, Target, Users, BarChart3, Settings } from "lucide-react";

export default function MoovlyGoGeofencingPage() {
  const [activeTab, setActiveTab] = useState("zones");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Moovly Go Geofencing</h1>
            <p className="text-gray-600">Automated zone-based delivery assignment for courier optimization</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Target className="w-3 h-3 mr-1" />
            Auto-Assignment Active
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Cape Town Zones
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            1-3 Day SLA
          </Badge>
        </div>
      </div>

      {/* Feature Separation Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800 mb-1">Moovly Go Geofencing System</h3>
              <p className="text-amber-700 text-sm">
                This geofencing system is specifically for <strong>Moovly Go courier platform</strong> with automatic job assignment based on delivery zones. 
                The existing Moovly Connect fleet management geofencing (customer arrival alerts, route monitoring) remains unchanged and continues to operate independently.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="zones" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Delivery Zones</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Driver Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zones">
          <DeliveryZoneManager />
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Driver Zone Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Driver Assignment Interface</h3>
                <p className="text-gray-600 mb-4">Assign drivers to specific delivery zones for automatic job distribution</p>
                <Button>Configure Driver Assignments</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">94.5%</div>
                  <p className="text-sm text-gray-600">Jobs auto-assigned successfully</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Average Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">2.3s</div>
                  <p className="text-sm text-gray-600">Assignment processing time</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SLA Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">98.7%</div>
                  <p className="text-sm text-gray-600">On-time deliveries</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Auto-Assignment Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Enable auto-assignment</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fallback to manual assignment</span>
                  <Badge variant="outline">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assignment timeout</span>
                  <span className="text-sm font-medium">30 seconds</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zone Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Default priority</span>
                  <span className="text-sm font-medium">1 (Highest)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Default delivery SLA</span>
                  <span className="text-sm font-medium">48 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Max concurrent jobs per driver</span>
                  <span className="text-sm font-medium">10</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Implementation Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-2">Order Received</h4>
              <p className="text-sm text-gray-600">Customer places order with delivery address</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-2">Zone Detection</h4>
              <p className="text-sm text-gray-600">System identifies delivery zone using coordinates</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-2">Auto-Assignment</h4>
              <p className="text-sm text-gray-600">Job automatically assigned to zone driver</p>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">4</span>
              </div>
              <h4 className="font-semibold mb-2">SLA Tracking</h4>
              <p className="text-sm text-gray-600">Driver ensures delivery within 1-3 day timeframe</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}