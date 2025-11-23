import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Car, Clock, MapPin, Users, Building2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Mock data for demonstration - in production this would come from APIs
const mockStaff = {
  id: 1,
  employeeNumber: "CT001234",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@capetown.gov.za",
  department: "Public Works",
  position: "Senior Engineer"
};

const mockVehicles = [
  {
    id: 1,
    vehicleNumber: "CT-PW-001",
    registration: "CA 123-456",
    make: "Toyota",
    model: "Hilux",
    year: 2022,
    status: "available",
    fuelType: "diesel"
  },
  {
    id: 2,
    vehicleNumber: "CT-PW-002", 
    registration: "CA 234-567",
    make: "Ford",
    model: "Ranger",
    year: 2021,
    status: "available",
    fuelType: "diesel"
  },
  {
    id: 3,
    vehicleNumber: "CT-HS-003",
    registration: "CA 345-678",
    make: "Nissan",
    model: "NP200",
    year: 2023,
    status: "in_use",
    fuelType: "petrol"
  }
];

const mockBookings = [
  {
    id: 1,
    bookingNumber: "VB-2025-001",
    vehicleNumber: "CT-PW-001",
    purpose: "Site inspection at Mitchell's Plain",
    destination: "Mitchell's Plain Community Center",
    requestedStartTime: "2025-01-08T09:00:00Z",
    requestedEndTime: "2025-01-08T15:00:00Z",
    status: "approved",
    approvedBy: "Manager Jane Doe"
  },
  {
    id: 2,
    bookingNumber: "VB-2025-002",
    vehicleNumber: "CT-PW-002",
    purpose: "Emergency response - Water pipe burst",
    destination: "Khayelitsha Site B",
    requestedStartTime: "2025-01-08T14:00:00Z",
    requestedEndTime: "2025-01-08T18:00:00Z",
    status: "pending",
    emergencyBooking: true
  }
];

export default function GovernmentFleetPage() {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock booking form state
  const [bookingForm, setBookingForm] = useState({
    vehicleId: "",
    purpose: "",
    destination: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    passengers: 1,
    projectCode: "",
    notes: "",
    emergencyBooking: false
  });

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      // In production, this would call the API
      console.log("Creating booking:", bookingData);
      return { success: true, bookingNumber: `VB-2025-${Date.now()}` };
    },
    onSuccess: (data) => {
      toast({
        title: "Booking Created",
        description: `Vehicle booking ${data.bookingNumber} has been submitted for approval.`,
      });
      setIsBookingDialogOpen(false);
      setBookingForm({
        vehicleId: "",
        purpose: "",
        destination: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        passengers: 1,
        projectCode: "",
        notes: "",
        emergencyBooking: false
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateBooking = () => {
    if (!bookingForm.vehicleId || !bookingForm.purpose || !bookingForm.destination) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate(bookingForm);
  };

  const getStatusBadge = (status: string, emergency = false) => {
    if (emergency) {
      return <Badge variant="destructive" className="animate-pulse">Emergency</Badge>;
    }

    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending Approval</Badge>;
      case "in_use":
        return <Badge variant="outline"><Car className="w-3 h-3 mr-1" />In Use</Badge>;
      case "completed":
        return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVehicleStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-600">Available</Badge>;
      case "in_use":
        return <Badge variant="destructive">In Use</Badge>;
      case "maintenance":
        return <Badge variant="secondary">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">City of Cape Town Fleet</h1>
          <p className="text-muted-foreground">Book and manage municipal vehicle reservations</p>
        </div>
        
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Car className="w-4 h-4 mr-2" />
              Book Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Municipal Vehicle</DialogTitle>
              <DialogDescription>
                Reserve a vehicle for official municipal business. All bookings require supervisor approval.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              {/* Staff Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Staff Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Employee</Label>
                      <p className="font-medium">{mockStaff.firstName} {mockStaff.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Department</Label>
                      <p className="font-medium">{mockStaff.department}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Employee #</Label>
                      <p className="font-medium">{mockStaff.employeeNumber}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Position</Label>
                      <p className="font-medium">{mockStaff.position}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Selection */}
              <div className="space-y-2">
                <Label htmlFor="vehicle">Select Vehicle *</Label>
                <Select value={bookingForm.vehicleId} onValueChange={(value) => setBookingForm({...bookingForm, vehicleId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose available vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVehicles.filter(v => v.status === "available").map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model} ({vehicle.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Purpose and Destination */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Trip *</Label>
                  <Input
                    id="purpose"
                    placeholder="e.g., Site inspection, Meeting, Emergency response"
                    value={bookingForm.purpose}
                    onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination *</Label>
                  <Input
                    id="destination"
                    placeholder="Full address or location description"
                    value={bookingForm.destination}
                    onChange={(e) => setBookingForm({...bookingForm, destination: e.target.value})}
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={bookingForm.startDate}
                    onChange={(e) => setBookingForm({...bookingForm, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({...bookingForm, startTime: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={bookingForm.endDate}
                    onChange={(e) => setBookingForm({...bookingForm, endDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({...bookingForm, endTime: e.target.value})}
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passengers">Passengers</Label>
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max="8"
                    value={bookingForm.passengers}
                    onChange={(e) => setBookingForm({...bookingForm, passengers: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectCode">Project Code</Label>
                  <Input
                    id="projectCode"
                    placeholder="Budget allocation code"
                    value={bookingForm.projectCode}
                    onChange={(e) => setBookingForm({...bookingForm, projectCode: e.target.value})}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements or additional information"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({...bookingForm, notes: e.target.value})}
                />
              </div>

              {/* Emergency Booking */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emergency"
                  checked={bookingForm.emergencyBooking}
                  onChange={(e) => setBookingForm({...bookingForm, emergencyBooking: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="emergency" className="text-sm">
                  This is an emergency booking (requires immediate approval)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBooking} disabled={createBookingMutation.isPending}>
                {createBookingMutation.isPending ? "Creating..." : "Submit Booking"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Available Vehicles</p>
                <p className="text-2xl font-bold">{mockVehicles.filter(v => v.status === "available").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{mockBookings.filter(b => b.status === "pending").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Bookings</p>
                <p className="text-2xl font-bold">{mockBookings.filter(b => b.status === "approved").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="text-lg font-bold">{mockStaff.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Vehicles */}
        <Card>
          <CardHeader>
            <CardTitle>Available Vehicles</CardTitle>
            <CardDescription>Municipal fleet currently available for booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockVehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{vehicle.vehicleNumber}</p>
                      {getVehicleStatusBadge(vehicle.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vehicle.make} {vehicle.model} {vehicle.year} • {vehicle.registration}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {vehicle.fuelType}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={vehicle.status !== "available"}
                    onClick={() => {
                      setBookingForm({...bookingForm, vehicleId: vehicle.id.toString()});
                      setIsBookingDialogOpen(true);
                    }}
                  >
                    Book
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>My Bookings</CardTitle>
            <CardDescription>Your current and recent vehicle reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBookings.map((booking) => (
                <div key={booking.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{booking.bookingNumber}</p>
                    {getStatusBadge(booking.status, booking.emergencyBooking)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Car className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.destination}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{new Date(booking.requestedStartTime).toLocaleDateString()} - {new Date(booking.requestedEndTime).toLocaleDateString()}</span>
                    </div>
                    <p className="text-muted-foreground">{booking.purpose}</p>
                    {booking.approvedBy && (
                      <p className="text-xs text-green-600">Approved by {booking.approvedBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Municipal Vehicle Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Booking Requirements</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Valid driver's license required</li>
                <li>• Supervisor approval needed</li>
                <li>• Official business purposes only</li>
                <li>• Minimum 2-hour advance booking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">During Usage</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Check vehicle condition before use</li>
                <li>• Report any incidents immediately</li>
                <li>• Keep fuel receipts for reimbursement</li>
                <li>• Return vehicle clean and fueled</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Emergency Protocol</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Emergency bookings approved instantly</li>
                <li>• Contact fleet manager: 021-555-0123</li>
                <li>• After-hours support available</li>
                <li>• Incident reporting mandatory</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}