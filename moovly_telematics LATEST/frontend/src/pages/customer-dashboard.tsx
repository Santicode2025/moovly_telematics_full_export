import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Phone,
  MessageSquare,
  Plus,
  ExternalLink
} from "lucide-react";
import { useLocation } from "wouter";

interface OrderStatus {
  id: string;
  orderNumber: string;
  status: "loading" | "to_job" | "on_job" | "to_plant" | "at_plant";
  estimatedTime: string;
  actualTime?: string;
  location?: string;
  driverName?: string;
  vehicleNumber?: string;
}

interface CustomerOrder {
  id: number;
  orderNumber: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  estimatedDeliveryTime: string;
  assignedDriverId?: number;
  driverName?: string;
  trackingNumber: string;
  createdAt: string;
  statusUpdates: Array<{
    status: string;
    message: string;
    timestamp: string;
    location?: string;
  }>;
}

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("active");

  // Fetch customer's orders - show most recent 5
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/customer/orders"],
  });

  // Mock data to simulate Loop4.io interface until backend is ready
  const mockOrders: OrderStatus[] = [
    {
      id: "BT214_FROTA_2078_1",
      orderNumber: "ORD-2024-001",
      status: "on_job",
      estimatedTime: "10:33",
      actualTime: "10:35",
      location: "Somerset West",
      driverName: "Fernando Santos",
      vehicleNumber: "BT214"
    },
    {
      id: "BT214_FROTA_2078_2",
      orderNumber: "ORD-2024-002",
      status: "to_job",
      estimatedTime: "10:50",
      location: "Strand Area",
      driverName: "Gilberto Pereira",
      vehicleNumber: "BT214"
    },
    {
      id: "BT214_FROTA_2078_3",
      orderNumber: "ORD-2024-003",
      status: "loading",
      estimatedTime: "11:15",
      location: "Helderberg",
      driverName: "Carlos Souza",
      vehicleNumber: "BT214"
    },
    {
      id: "BT214_FROTA_2078_4",
      orderNumber: "ORD-2024-004",
      status: "at_plant",
      estimatedTime: "Completed",
      actualTime: "09:45",
      location: "Delivered",
      driverName: "Henrique Castro",
      vehicleNumber: "BT214"
    },
    {
      id: "BT214_FROTA_2078_5",
      orderNumber: "ORD-2024-005",
      status: "loading",
      estimatedTime: "12:00",
      location: "Pending Pickup",
      driverName: "Pedro Oliveira",
      vehicleNumber: "BT214"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "loading": return "bg-[#00A8CC]";
      case "to_job": return "bg-yellow-500";
      case "on_job": return "bg-green-500";
      case "to_plant": return "bg-purple-500";
      case "at_plant": return "bg-gray-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "loading": return <Package className="w-4 h-4 text-white" />;
      case "to_job": return <Truck className="w-4 h-4 text-white" />;
      case "on_job": return <MapPin className="w-4 h-4 text-white" />;
      case "to_plant": return <Truck className="w-4 h-4 text-white" />;
      case "at_plant": return <CheckCircle className="w-4 h-4 text-white" />;
      default: return <Clock className="w-4 h-4 text-white" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "loading": return "Loading";
      case "to_job": return "To Job";
      case "on_job": return "On Job";
      case "to_plant": return "To Plant";
      case "at_plant": return "At Plant";
      default: return "Unknown";
    }
  };

  const getProgressPercentage = (status: string) => {
    switch (status) {
      case "loading": return 20;
      case "to_job": return 40;
      case "on_job": return 60;
      case "to_plant": return 80;
      case "at_plant": return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00A8CC] to-[#0097B8] text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Moovly Go Customer Portal</h1>
              <p className="text-white/80">Track your deliveries in real-time</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setLocation("/customer/place-order")}
              className="bg-white text-[#00A8CC] hover:bg-[#00A8CC]/5"
            >
              <Plus className="w-4 h-4 mr-2" />
              Place New Order
            </Button>
            <Button
              onClick={() => setLocation("/customer/bulk-import")}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#00A8CC]"
            >
              <Package className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
            <Button
              onClick={() => setLocation("/customer/messages")}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-[#00A8CC]"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-[#00A8CC]/10 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#00A8CC]" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">8</p>
                  <p className="text-sm text-gray-600">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-gray-600">In Transit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Order Tracking - Similar to Loop4.io */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Order Tracking</span>
              <Badge variant="outline" className="ml-2">5 Active Orders</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className={`p-4 border rounded-lg bg-white shadow-sm ${
                    order.status === 'on_job' ? 'border-green-300 bg-green-50' : 
                    order.status === 'at_plant' ? 'border-gray-300 bg-gray-50' : 
                    'border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Order Info */}
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 ${getStatusColor(order.status)} rounded-full flex items-center justify-center`}>
                          {getStatusIcon(order.status)}
                        </div>
                        <div>
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.driverName} - {order.vehicleNumber}</p>
                        </div>
                      </div>

                      {/* Progress Timeline */}
                      <div className="hidden md:flex items-center space-x-2 flex-1 max-w-md">
                        <div className="text-xs text-gray-600">Loading</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getStatusColor(order.status)}`}
                            style={{ width: `${getProgressPercentage(order.status)}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-600">Delivered</div>
                      </div>

                      {/* Time Info */}
                      <div className="text-right">
                        <p className="font-medium">{order.estimatedTime}</p>
                        {order.actualTime && order.actualTime !== order.estimatedTime && (
                          <p className="text-sm text-gray-500">{order.actualTime}</p>
                        )}
                        <p className="text-xs text-gray-600">{order.location}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`${
                          order.status === 'on_job' ? 'border-green-500 text-green-700' :
                          order.status === 'at_plant' ? 'border-gray-500 text-gray-700' :
                          'border-[#00A8CC] text-[#00A8CC]'
                        }`}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Track
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Progress Bar */}
                  <div className="md:hidden mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-gray-600">Loading</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(order.status)}`}
                          style={{ width: `${getProgressPercentage(order.status)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">Delivered</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Orders (3)</TabsTrigger>
            <TabsTrigger value="completed">Completed (8)</TabsTrigger>
            <TabsTrigger value="all">All Orders (12)</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {mockOrders
              .filter(order => !['at_plant'].includes(order.status))
              .map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">Driver: {order.driverName}</p>
                        <p className="text-xs text-gray-500">Vehicle: {order.vehicleNumber}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {mockOrders
              .filter(order => order.status === 'at_plant')
              .map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600">Delivered by: {order.driverName}</p>
                        <p className="text-xs text-gray-500">Completed at: {order.actualTime}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className="border-green-500 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Delivered
                        </Badge>
                        <Button size="sm" variant="outline">
                          View Receipt
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {mockOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">Driver: {order.driverName}</p>
                      <p className="text-xs text-gray-500">Status: {getStatusLabel(order.status)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}