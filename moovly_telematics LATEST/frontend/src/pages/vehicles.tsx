import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Car,
  Plus,
  Search,
  Settings,
  Fuel,
  Calendar,
  User,
  Wrench,
  MapPin,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Eye,
} from "lucide-react";

interface Vehicle {
  id: number;
  vehicleNumber: string;
  registration: string;
  chassisNumber: string;
  engineNumber: string;
  make: string;
  model: string;
  year: number;
  currentOdometer: string;
  plateNumber: string;
  status: string;
  fuelType: string;
  mileage: string;
  lastMaintenanceDate: string | null;
  nextMaintenanceDate: string | null;
  assignedDriverId: number | null;
  assignedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Driver {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
}

export default function VehiclesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { toast } = useToast();

  // Fetch vehicles data
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/vehicles'],
  });

  // Fetch drivers data for assignment
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers'],
  });

  // Filter vehicles based on search and status
  const filteredVehicles = (vehicles as Vehicle[]).filter((vehicle) => {
    const matchesSearch = 
      vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get assigned driver name
  const getDriverName = (driverId: number | null) => {
    if (!driverId) return "Unassigned";
    const driver = (drivers as Driver[]).find(d => d.id === driverId);
    return driver ? driver.name : `Driver ${driverId}`;
  };

  // Calculate days until next maintenance
  const getDaysUntilMaintenance = (nextMaintenanceDate: string | null) => {
    if (!nextMaintenanceDate) return null;
    const today = new Date();
    const nextDate = new Date(nextMaintenanceDate);
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get maintenance status
  const getMaintenanceStatus = (daysUntil: number | null) => {
    if (daysUntil === null) return { status: "unknown", color: "bg-gray-100 text-gray-800" };
    if (daysUntil < 0) return { status: "overdue", color: "bg-red-100 text-red-800" };
    if (daysUntil <= 7) return { status: "due soon", color: "bg-yellow-100 text-yellow-800" };
    return { status: "ok", color: "bg-green-100 text-green-800" };
  };

  // Vehicle assignment mutation
  const assignVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, driverId }: { vehicleId: number; driverId: number | null }) => {
      const response = await fetch(`/api/vehicles/${vehicleId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      if (!response.ok) throw new Error("Failed to assign vehicle");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      toast({
        title: "Vehicle assignment updated",
        description: "The vehicle has been successfully assigned.",
      });
    },
    onError: () => {
      toast({
        title: "Assignment failed",
        description: "Failed to update vehicle assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAssignDriver = (vehicleId: number, driverId: string) => {
    const assignedDriverId = driverId === "unassigned" ? null : parseInt(driverId);
    assignVehicleMutation.mutate({ vehicleId, driverId: assignedDriverId });
  };

  const handleViewDetails = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsDialog(true);
  };

  if (vehiclesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <Header title="Vehicle Management" />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading vehicles...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header title="Vehicle Management" />
        <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
            <p className="text-gray-600">Manage your fleet vehicles, assignments, and maintenance</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vehicle
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                  <p className="text-2xl font-bold text-gray-900">{(vehicles as Vehicle[]).length}</p>
                </div>
                <Car className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredVehicles.filter(v => v.status === 'active').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Maintenance</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredVehicles.filter(v => v.status === 'maintenance').length}
                  </p>
                </div>
                <Wrench className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maintenance Due</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredVehicles.filter(v => {
                      const days = getDaysUntilMaintenance(v.nextMaintenanceDate);
                      return days !== null && days <= 7;
                    }).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search vehicles by number, registration, make, or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fleet Vehicles</CardTitle>
            <CardDescription>
              Showing {filteredVehicles.length} of {(vehicles as Vehicle[]).length} vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned Driver</TableHead>
                    <TableHead>Current Mileage</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => {
                    const daysUntilMaintenance = getDaysUntilMaintenance(vehicle.nextMaintenanceDate);
                    const maintenanceStatus = getMaintenanceStatus(daysUntilMaintenance);
                    
                    return (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{vehicle.vehicleNumber}</div>
                            <div className="text-sm text-gray-500">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            <div className="text-xs text-gray-400">{vehicle.registration}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={vehicle.assignedDriverId?.toString() || "unassigned"}
                            onValueChange={(value) => handleAssignDriver(vehicle.id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <span className="text-gray-500">Unassigned</span>
                              </SelectItem>
                              {(drivers as Driver[]).filter(d => d.status === 'active').map((driver) => (
                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4 text-gray-400" />
                            {parseFloat(vehicle.currentOdometer || "0").toLocaleString()} km
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={maintenanceStatus.color}>
                              {maintenanceStatus.status}
                            </Badge>
                            {daysUntilMaintenance !== null && (
                              <div className="text-xs text-gray-500">
                                {daysUntilMaintenance < 0 
                                  ? `${Math.abs(daysUntilMaintenance)} days overdue`
                                  : `${daysUntilMaintenance} days remaining`
                                }
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(vehicle)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Vehicle Details</DialogTitle>
              <DialogDescription>
                Complete information for {selectedVehicle?.vehicleNumber}
              </DialogDescription>
            </DialogHeader>
            
            {selectedVehicle && (
              <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Vehicle Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Vehicle Number</Label>
                            <p className="font-medium">{selectedVehicle.vehicleNumber}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Registration</Label>
                            <p className="font-medium">{selectedVehicle.registration}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Make & Model</Label>
                            <p className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Year</Label>
                            <p className="font-medium">{selectedVehicle.year}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Chassis Number</Label>
                            <p className="font-medium text-xs">{selectedVehicle.chassisNumber}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Engine Number</Label>
                            <p className="font-medium text-xs">{selectedVehicle.engineNumber}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status & Metrics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Status</Label>
                            <Badge className={getStatusColor(selectedVehicle.status)}>
                              {selectedVehicle.status}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Fuel Type</Label>
                            <p className="font-medium capitalize">{selectedVehicle.fuelType}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Current Odometer</Label>
                            <p className="font-medium">{parseFloat(selectedVehicle.currentOdometer || "0").toLocaleString()} km</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Assigned Driver</Label>
                            <p className="font-medium">{getDriverName(selectedVehicle.assignedDriverId)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="maintenance" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Maintenance Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Last Maintenance</Label>
                          <p className="font-medium">
                            {selectedVehicle.lastMaintenanceDate 
                              ? new Date(selectedVehicle.lastMaintenanceDate).toLocaleDateString()
                              : "No record"
                            }
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Next Maintenance</Label>
                          <p className="font-medium">
                            {selectedVehicle.nextMaintenanceDate 
                              ? new Date(selectedVehicle.nextMaintenanceDate).toLocaleDateString()
                              : "Not scheduled"
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assignments" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Driver Assignment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">Assignment history will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Vehicle Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500">Insurance, registration, and other documents will be displayed here.</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </div>
  );
}