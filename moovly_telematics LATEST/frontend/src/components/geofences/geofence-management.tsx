import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Edit, Trash2, Shield, Building, Home, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Geofence {
  id: number;
  name: string;
  type: string;
  latitude: string;
  longitude: string;
  radius: number;
  isActive: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  alertOnDwell: boolean;
  dwellTimeMinutes?: number;
  customerId?: number;
  description?: string;
  createdAt: string;
}

export function GeofenceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState<Geofence | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "custom_zone",
    latitude: "",
    longitude: "",
    radius: 50,
    description: "",
    alertOnEntry: true,
    alertOnExit: false,
    alertOnDwell: false,
    dwellTimeMinutes: 5,
  });

  const { data: geofences = [], isLoading } = useQuery({
    queryKey: ["/api/geofences"],
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
  });

  const createGeofenceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/geofences", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geofences"] });
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Geofence Created",
        description: "New geofence zone has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create geofence",
        variant: "destructive",
      });
    },
  });

  const updateGeofenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/geofences/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geofences"] });
      setSelectedGeofence(null);
      toast({
        title: "Geofence Updated",
        description: "Geofence settings have been updated successfully",
      });
    },
  });

  const deleteGeofenceMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/geofences/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geofences"] });
      toast({
        title: "Geofence Deleted",
        description: "Geofence has been removed successfully",
      });
    },
  });

  const createCustomerGeofencesMutation = useMutation({
    mutationFn: async (customerId: number) => {
      return await apiRequest(`/api/customers/${customerId}/geofences`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/geofences"] });
      toast({
        title: "Customer Geofences Created",
        description: "Auto-generated 50m radius geofences for customer addresses",
      });
    },
  });

  const testProximityMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/geofences/check-proximity", "POST", data);
    },
    onSuccess: (events) => {
      toast({
        title: "Proximity Check Complete",
        description: `${events.length} geofence events triggered - check Alert Centre`,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "custom_zone",
      latitude: "",
      longitude: "",
      radius: 50,
      description: "",
      alertOnEntry: true,
      alertOnExit: false,
      alertOnDwell: false,
      dwellTimeMinutes: 5,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGeofenceMutation.mutate(formData);
  };

  const getGeofenceIcon = (type: string) => {
    switch (type) {
      case 'customer_address':
        return <Home className="h-4 w-4" />;
      case 'depot':
        return <Building className="h-4 w-4" />;
      case 'restricted_area':
        return <Shield className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'customer_address':
        return 'bg-green-100 text-green-800';
      case 'depot':
        return 'bg-blue-100 text-blue-800';
      case 'restricted_area':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Geofence Management</h2>
          <p className="text-gray-600">Business Tier - Smart boundary alerts integrated with Alert Centre</p>
        </div>
        
        <div className="flex space-x-3">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Geofence
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Geofence</DialogTitle>
                <DialogDescription>
                  Define a new geofence zone for automatic alerts
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Geofence Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Main Depot, Restricted Zone"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom_zone">Custom Zone</SelectItem>
                      <SelectItem value="depot">Depot</SelectItem>
                      <SelectItem value="restricted_area">Restricted Area</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      placeholder="-26.2041"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      placeholder="28.0473"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="radius">Radius (meters)</Label>
                  <Input
                    id="radius"
                    type="number"
                    value={formData.radius}
                    onChange={(e) => setFormData({...formData, radius: parseInt(e.target.value)})}
                    min="10"
                    max="5000"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alertOnEntry">Alert on Entry</Label>
                    <Switch
                      id="alertOnEntry"
                      checked={formData.alertOnEntry}
                      onCheckedChange={(checked) => setFormData({...formData, alertOnEntry: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alertOnExit">Alert on Exit</Label>
                    <Switch
                      id="alertOnExit"
                      checked={formData.alertOnExit}
                      onCheckedChange={(checked) => setFormData({...formData, alertOnExit: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alertOnDwell">Alert on Dwell Time</Label>
                    <Switch
                      id="alertOnDwell"
                      checked={formData.alertOnDwell}
                      onCheckedChange={(checked) => setFormData({...formData, alertOnDwell: checked})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Optional description"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGeofenceMutation.isPending}>
                    Create Geofence
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto-Generate Customer Geofences</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 mb-3">
              Create 50m radius geofences for all customer delivery addresses
            </p>
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => {
                customers.forEach((customer: any) => {
                  if (customer.latitude && customer.longitude) {
                    createCustomerGeofencesMutation.mutate(customer.id);
                  }
                });
              }}
              disabled={createCustomerGeofencesMutation.isPending}
            >
              Generate All Customer Geofences
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Test Proximity Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600 mb-3">
              Test geofence system with sample coordinates
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => {
                testProximityMutation.mutate({
                  latitude: -26.2041,
                  longitude: 28.0473,
                  driverId: 1,
                  vehicleId: 1,
                  jobId: 1
                });
              }}
              disabled={testProximityMutation.isPending}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Test Alert System
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Geofences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {geofences.filter((g: Geofence) => g.isActive).length}
            </div>
            <p className="text-xs text-gray-600">
              Currently monitoring {geofences.length} total zones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Geofences List */}
      <Card>
        <CardHeader>
          <CardTitle>All Geofences</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : geofences.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No geofences created yet</p>
              <p className="text-sm text-gray-400">
                Create your first geofence to start monitoring driver locations
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {geofences.map((geofence: Geofence) => (
                <div key={geofence.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getGeofenceIcon(geofence.type)}
                      <div>
                        <h3 className="font-medium">{geofence.name}</h3>
                        <p className="text-sm text-gray-600">{geofence.description || 'No description'}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Badge className={getTypeColor(geofence.type)}>
                        {geofence.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant={geofence.isActive ? "default" : "secondary"}>
                        {geofence.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <div>Radius: {geofence.radius}m</div>
                      <div className="flex space-x-1">
                        {geofence.alertOnEntry && <span className="text-green-600">Entry</span>}
                        {geofence.alertOnExit && <span className="text-blue-600">Exit</span>}
                        {geofence.alertOnDwell && <span className="text-orange-600">Dwell</span>}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedGeofence(geofence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteGeofenceMutation.mutate(geofence.id)}
                        disabled={deleteGeofenceMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}