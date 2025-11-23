import { useState, useEffect } from "react";
import { Car, Clock, MapPin, Camera, CheckCircle, AlertTriangle, Menu, X, Fuel, FileText, Phone, Calendar, Plus, ChevronLeft, ChevronRight, Users, Settings, CreditCard, ArrowLeft, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Mock government staff user
const mockGovStaff = {
  id: 1,
  employeeNumber: "CT001234",
  firstName: "John",
  lastName: "Smith",
  email: "john.smith@capetown.gov.za",
  department: "Public Works",
  position: "Senior Engineer"
};

// Mock vehicle fleet data
const mockVehicleFleet = [
  {
    id: 1,
    vehicleNumber: "CT-PW-001",
    make: "Toyota",
    model: "Hilux",
    registration: "CA 123-456",
    fuelType: "diesel",
    category: "pickup",
    capacity: 5,
    licenseRequired: "B",
    department: "Public Works",
    features: ["4WD", "Tow Bar", "Canopy"],
    status: "available",
    image: "/api/placeholder/300/200"
  },
  {
    id: 2,
    vehicleNumber: "CT-PW-002",
    make: "Ford",
    model: "Ranger",
    registration: "CA 234-567",
    fuelType: "diesel",
    category: "pickup",
    capacity: 5,
    licenseRequired: "B",
    department: "Public Works",
    features: ["4WD", "Tow Bar"],
    status: "available",
    image: "/api/placeholder/300/200"
  },
  {
    id: 3,
    vehicleNumber: "CT-HS-003",
    make: "Nissan",
    model: "NP200",
    registration: "CA 345-678",
    fuelType: "petrol",
    category: "bakkie",
    capacity: 2,
    licenseRequired: "B",
    department: "Health Services",
    features: ["Canopy", "Fuel Efficient"],
    status: "in_use",
    image: "/api/placeholder/300/200"
  },
  {
    id: 4,
    vehicleNumber: "CT-TR-004",
    make: "Mercedes",
    model: "Sprinter",
    registration: "CA 456-789",
    fuelType: "diesel",
    category: "van",
    capacity: 12,
    licenseRequired: "B",
    department: "Transport",
    features: ["Passenger Transport", "AC"],
    status: "available",
    image: "/api/placeholder/300/200"
  },
  {
    id: 5,
    vehicleNumber: "CT-TR-005",
    make: "Isuzu",
    model: "NPR 400",
    registration: "CA 567-890",
    fuelType: "diesel",
    category: "truck",
    capacity: 3,
    licenseRequired: "C1",
    department: "Transport",
    features: ["Crane", "Heavy Duty"],
    status: "maintenance",
    image: "/api/placeholder/300/200"
  }
];

// Mock current booking - set to null to show booking button
const mockCurrentBooking = null;

// Mock user licenses
const mockUserLicenses = ["B", "C1"];

export default function GovernmentMobilePage() {
  const [activeTab, setActiveTab] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tripStatus, setTripStatus] = useState("not_started"); // not_started, in_progress, completed
  const [currentLocation, setCurrentLocation] = useState<GeolocationPosition | null>(null);
  const [startOdometer, setStartOdometer] = useState("");
  const [endOdometer, setEndOdometer] = useState("");
  const [fuelLevel, setFuelLevel] = useState("");
  const [incidentReport, setIncidentReport] = useState("");
  
  // Booking system state
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Calendar, 2: Vehicle Select, 3: Details, 4: Confirm
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStartTime, setSelectedStartTime] = useState("");
  const [selectedEndTime, setSelectedEndTime] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [bookingDestination, setBookingDestination] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  // Real-time tracking and geofence state
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [geofenceAlerts, setGeofenceAlerts] = useState<any[]>([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [totalDistance, setTotalDistance] = useState(0);
  const [tripRoute, setTripRoute] = useState<any[]>([]);
  
  // Driver performance features
  const [drivingScore, setDrivingScore] = useState(85);
  const [lastSpeedAlert, setLastSpeedAlert] = useState<Date | null>(null);
  const [harshBrakingCount, setHarshBrakingCount] = useState(0);
  const [rapidAccelerationCount, setRapidAccelerationCount] = useState(0);
  
  // Vehicle inspection checklist state
  const [showInspectionChecklist, setShowInspectionChecklist] = useState(false);
  const [inspectionItems, setInspectionItems] = useState({
    tyres: true,
    lights: true,
    brakes: true,
    fluids: true,
    mirrors: true,
    interior: true,
    exterior: true,
    licenseDisc: true,
    driverLicense: true,
  });
  const [requiredPhotos, setRequiredPhotos] = useState<string[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: string}>({});
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [miscPhotos, setMiscPhotos] = useState<string[]>([]);
  
  const { toast } = useToast();

  // Get current location and start GPS tracking
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setCurrentLocation(position),
        (error) => console.error("Location error:", error)
      );
    }
  }, []);

  // Real-time GPS tracking when trip is active
  useEffect(() => {
    if (isLiveTracking && tripStatus === "in_progress") {
      const interval = setInterval(() => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: new Date(),
                speed: position.coords.speed || 0
              };
              
              // Update current location
              setCurrentLocation(position);
              setCurrentSpeed(position.coords.speed || 0);
              
              // Add to trip route
              setTripRoute(prev => [...prev, newLocation]);
              
              // Check for geofence events
              checkGeofenceProximity(newLocation);
              
              // Monitor driving behavior
              monitorDrivingBehavior(position);
              
              // Send to server for real-time tracking
              sendLocationUpdate(newLocation);
            },
            (error) => console.error("GPS tracking error:", error),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
          );
        }
      }, 10000); // Update every 10 seconds
      
      setTrackingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isLiveTracking, tripStatus]);

  const handleStartTrip = () => {
    if (!startOdometer) {
      toast({
        title: "Missing Information",
        description: "Please enter the starting odometer reading.",
        variant: "destructive",
      });
      return;
    }

    setTripStatus("in_progress");
    setIsLiveTracking(true);
    setTripRoute([]);
    setGeofenceAlerts([]);
    setTotalDistance(0);
    
    toast({
      title: "Trip Started",
      description: "Live tracking enabled. Drive safely!",
    });
  };

  const handleEndTrip = () => {
    if (!endOdometer) {
      toast({
        title: "Missing Information", 
        description: "Please enter the ending odometer reading.",
        variant: "destructive",
      });
      return;
    }

    setTripStatus("completed");
    setIsLiveTracking(false);
    
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    
    toast({
      title: "Trip Completed",
      description: `Distance: ${endOdometer && startOdometer ? (parseInt(endOdometer) - parseInt(startOdometer)) : 0} km. Driving score: ${drivingScore}`,
    });
  };

  const handleEmergencyContact = () => {
    window.open("tel:0215550123", "_self");
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateAvailable = (date: string) => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate >= today; // Only future dates available
  };

  const getAvailableVehicles = () => {
    return mockVehicleFleet.filter(vehicle => 
      vehicle.status === "available" && 
      mockUserLicenses.includes(vehicle.licenseRequired)
    );
  };

  // Advanced tracking functions
  const checkGeofenceProximity = (location: any) => {
    // Mock geofences for government facilities
    const mockGeofences = [
      { id: 1, name: "City Hall", lat: -33.9249, lng: 18.4241, radius: 100, type: "pickup_point" },
      { id: 2, name: "Civic Centre", lat: -33.9221, lng: 18.4231, radius: 75, type: "dropoff_point" },
      { id: 3, name: "Hospital Complex", lat: -33.9280, lng: 18.4850, radius: 50, type: "government_facility" }
    ];
    
    mockGeofences.forEach(geofence => {
      const distance = calculateDistance(location.lat, location.lng, geofence.lat, geofence.lng);
      
      if (distance <= geofence.radius) {
        // Create geofence alert
        const alert = {
          id: Date.now(),
          geofence: geofence.name,
          type: "entry",
          timestamp: new Date(),
          message: `Entered ${geofence.name} zone`
        };
        
        setGeofenceAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts
        
        // Notify dispatcher
        toast({
          title: "Zone Entry",
          description: `You have entered ${geofence.name}`,
        });
      }
    });
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const monitorDrivingBehavior = (position: GeolocationPosition) => {
    const speed = position.coords.speed || 0;
    const speedKmh = speed * 3.6; // Convert m/s to km/h
    
    // Speed monitoring
    if (speedKmh > 60 && (!lastSpeedAlert || Date.now() - lastSpeedAlert.getTime() > 60000)) {
      setLastSpeedAlert(new Date());
      toast({
        title: "Speed Alert",
        description: `Current speed: ${speedKmh.toFixed(0)} km/h. Please maintain safe speeds.`,
        variant: "destructive",
      });
    }
    
    // Mock harsh braking detection (would use accelerometer in real app)
    if (Math.random() < 0.001) { // Very low probability for demo
      setHarshBrakingCount(prev => prev + 1);
      setDrivingScore(prev => Math.max(0, prev - 2));
      toast({
        title: "Harsh Braking Detected",
        description: "Please brake gently for passenger safety and vehicle care.",
        variant: "destructive",
      });
    }
  };

  const sendLocationUpdate = async (location: any) => {
    // In real implementation, send to server
    console.log("Sending location update:", location);
  };

  // Vehicle inspection functions
  const handleInspectionToggle = (item: string, value: boolean) => {
    setInspectionItems(prev => ({ ...prev, [item]: value }));
    
    if (!value) {
      // If set to "No", add to required photos
      setRequiredPhotos(prev => [...prev.filter(photo => photo !== item), item]);
    } else {
      // If set to "Yes", remove from required photos
      setRequiredPhotos(prev => prev.filter(photo => photo !== item));
      setCapturedPhotos(prev => {
        const newPhotos = { ...prev };
        delete newPhotos[item];
        return newPhotos;
      });
    }
  };

  const handlePhotoCapture = (item: string) => {
    // Create camera input for photo capture only
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const timestamp = new Date().toISOString();
          const photoData = {
            url: reader.result as string,
            timestamp: timestamp,
            item: item
          };
          
          setCapturedPhotos(prev => ({ ...prev, [item]: photoData }));
          
          toast({
            title: "Photo Captured",
            description: `Photo for ${item} captured at ${new Date(timestamp).toLocaleString()}`,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleMiscPhotoCapture = () => {
    // Create camera input for additional photo capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const timestamp = new Date().toISOString();
          const photoData = {
            url: reader.result as string,
            timestamp: timestamp,
            type: 'additional'
          };
          
          setMiscPhotos(prev => [...prev, photoData]);
          
          toast({
            title: "Photo Added",
            description: `Additional photo captured at ${new Date(timestamp).toLocaleString()}`,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const canSubmitInspection = () => {
    // Check if all required photos are captured
    return requiredPhotos.every(item => capturedPhotos[item]);
  };

  const handleSubmitInspection = () => {
    if (!canSubmitInspection()) {
      toast({
        title: "Missing Photos",
        description: "Please take photos for all items marked as 'No'.",
        variant: "destructive",
      });
      return;
    }
    
    setShowInspectionChecklist(false);
    
    toast({
      title: "Inspection Submitted",
      description: "Vehicle inspection checklist has been submitted successfully.",
    });
  };

  const handleBookingSubmit = () => {
    const selectedVehicle = mockVehicleFleet.find(v => v.id === selectedVehicleId);
    
    toast({
      title: "Booking Submitted",
      description: `Your booking for ${selectedVehicle?.vehicleNumber} has been submitted for approval.`,
    });
    
    // Reset booking flow
    setShowBookingFlow(false);
    setBookingStep(1);
    setSelectedDate("");
    setSelectedStartTime("");
    setSelectedEndTime("");
    setSelectedVehicleId(null);
    setBookingPurpose("");
    setBookingDestination("");
    setBookingNotes("");
  };

  const MenuButton = ({ icon: Icon, label, tabKey, badge }: any) => (
    <button
      onClick={() => {
        setActiveTab(tabKey);
        setIsMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full p-3 rounded-lg transition-colors ${
        activeTab === tabKey
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
      {badge && (
        <Badge variant="destructive" className="ml-auto">
          {badge}
        </Badge>
      )}
    </button>
  );

  const renderHome = () => (
    <div className="space-y-4">
      {/* Staff Info Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{mockGovStaff.firstName} {mockGovStaff.lastName}</h2>
              <p className="text-blue-100">{mockGovStaff.department}</p>
              <p className="text-sm text-blue-200">{mockGovStaff.employeeNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-200">City of Cape Town</p>
              <p className="text-lg font-bold">Municipal Fleet</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Booking Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Current Booking
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mockCurrentBooking ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{mockCurrentBooking.bookingNumber}</span>
                <Badge variant="default" className="bg-green-600">Approved</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Vehicle</Label>
                  <p className="font-medium">{mockCurrentBooking.vehicleNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {mockCurrentBooking.vehicle.make} {mockCurrentBooking.vehicle.model}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registration</Label>
                  <p className="font-medium">{mockCurrentBooking.vehicle.registration}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {mockCurrentBooking.vehicle.fuelType}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Destination</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{mockCurrentBooking.destination}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Purpose</Label>
                <p className="text-sm">{mockCurrentBooking.purpose}</p>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(mockCurrentBooking.requestedStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                  {new Date(mockCurrentBooking.requestedEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active vehicle booking</p>
              <p className="text-sm">Contact your supervisor for vehicle assignment</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Controls */}
      {mockCurrentBooking && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Trip Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tripStatus === "not_started" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="startOdometer">Starting Odometer Reading *</Label>
                  <Input
                    id="startOdometer"
                    type="number"
                    placeholder="e.g., 45678"
                    value={startOdometer}
                    onChange={(e) => setStartOdometer(e.target.value)}
                  />
                </div>
                <Button onClick={handleStartTrip} className="w-full bg-green-600 hover:bg-green-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Start Trip
                </Button>
              </div>
            )}

            {tripStatus === "in_progress" && (
              <div className="space-y-4">
                {/* Live Tracking Dashboard */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium">Live Trip Tracking</span>
                  </div>
                  
                  {/* Real-time Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{currentSpeed.toFixed(0)}</div>
                      <div className="text-xs text-gray-600">km/h</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{totalDistance.toFixed(1)}</div>
                      <div className="text-xs text-gray-600">km driven</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${drivingScore >= 80 ? 'text-green-600' : drivingScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {drivingScore}
                      </div>
                      <div className="text-xs text-gray-600">drive score</div>
                    </div>
                  </div>
                  
                  {/* Current Location */}
                  {currentLocation && (
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>GPS: {currentLocation.coords.latitude.toFixed(4)}, {currentLocation.coords.longitude.toFixed(4)}</span>
                    </div>
                  )}
                  
                  {/* Recent Geofence Alerts */}
                  {geofenceAlerts.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700 mb-1">Recent Zone Events:</div>
                      <div className="space-y-1 max-h-16 overflow-y-auto">
                        {geofenceAlerts.slice(0, 2).map((alert) => (
                          <div key={alert.id} className="flex items-center gap-2 text-xs bg-white p-1 rounded">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="flex-1">{alert.message}</span>
                            <span className="text-gray-500">{alert.timestamp.toLocaleTimeString().slice(0, 5)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Driver Performance Alerts */}
                  {(harshBrakingCount > 0 || rapidAccelerationCount > 0) && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <div className="text-xs text-orange-700">
                        Performance: {harshBrakingCount} harsh braking, {rapidAccelerationCount} rapid acceleration
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-green-600 mt-2">
                    Started at {startOdometer} km • Trip duration: {Math.floor(Math.random() * 45 + 15)} minutes
                  </p>
                </div>

                <div>
                  <Label htmlFor="endOdometer">Ending Odometer Reading *</Label>
                  <Input
                    id="endOdometer"
                    type="number"
                    placeholder="e.g., 45720"
                    value={endOdometer}
                    onChange={(e) => setEndOdometer(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="fuelLevel">Fuel Level (%)</Label>
                  <Input
                    id="fuelLevel"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g., 75"
                    value={fuelLevel}
                    onChange={(e) => setFuelLevel(e.target.value)}
                  />
                </div>

                <Button onClick={handleEndTrip} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Car className="w-4 h-4 mr-2" />
                  End Trip & Stop Tracking
                </Button>
              </div>
            )}

            {tripStatus === "completed" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                <p className="font-medium text-blue-900">Trip Completed</p>
                <p className="text-sm text-blue-700">
                  Distance: {endOdometer && startOdometer ? (parseInt(endOdometer) - parseInt(startOdometer)) : 0} km
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Vehicle returned successfully
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehicle Booking Button */}
      {!mockCurrentBooking && (
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={() => setShowBookingFlow(true)} 
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-lg"
            >
              <Plus className="w-6 h-6 mr-2" />
              Book Vehicle
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setShowInspectionChecklist(true)} className="h-16 flex-col">
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-xs">Vehicle Inspection</span>
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("incident")} className="h-16 flex-col">
              <AlertTriangle className="w-5 h-5 mb-1" />
              <span className="text-xs">Report Incident</span>
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("fuel")} className="h-16 flex-col">
              <Fuel className="w-5 h-5 mb-1" />
              <span className="text-xs">Fuel Receipt</span>
            </Button>
            <Button variant="outline" onClick={() => setActiveTab("expenses")} className="h-16 flex-col">
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-xs">Expenses</span>
            </Button>
            <Button variant="outline" onClick={handleEmergencyContact} className="h-16 flex-col">
              <Phone className="w-5 h-5 mb-1" />
              <span className="text-xs">Emergency</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIncident = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Incident Report
          </CardTitle>
          <CardDescription>Report any incidents, damages, or safety concerns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="incident">Incident Description *</Label>
            <Textarea
              id="incident"
              placeholder="Describe what happened, when, and where..."
              value={incidentReport}
              onChange={(e) => setIncidentReport(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label>Photo Evidence</Label>
            <Button variant="outline" className="w-full mt-2">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <div className="bg-gray-50 p-3 rounded border">
              {currentLocation ? (
                <div className="text-sm">
                  <p>Lat: {currentLocation.coords.latitude.toFixed(6)}</p>
                  <p>Lng: {currentLocation.coords.longitude.toFixed(6)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accuracy: ±{currentLocation.coords.accuracy}m
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Getting location...</p>
              )}
            </div>
          </div>

          <Button className="w-full bg-red-600 hover:bg-red-700">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Submit Incident Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderFuel = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Fuel Receipt
          </CardTitle>
          <CardDescription>Capture fuel receipts for expense tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <Camera className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">Scan Fuel Receipt</p>
            <p className="text-sm text-gray-500">
              Position receipt clearly in camera view
            </p>
            <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Liters</Label>
              <Input type="number" placeholder="45.67" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input type="number" placeholder="R 856.23" />
            </div>
          </div>

          <div>
            <Label>Station Name</Label>
            <Input placeholder="e.g., Shell Mitchell's Plain" />
          </div>

          <Button className="w-full">
            Save Fuel Receipt
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Travel Expenses
          </CardTitle>
          <CardDescription>Log parking, tolls, and other trip expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Expense Type</Label>
              <select className="w-full p-2 border rounded">
                <option>Parking</option>
                <option>Toll Fees</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <Label>Amount (R)</Label>
              <Input type="number" placeholder="25.00" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input placeholder="e.g., Parking at municipal offices" />
          </div>

          <div>
            <Label>Receipt Photo</Label>
            <Button variant="outline" className="w-full mt-2">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <Button className="w-full bg-green-600 hover:bg-green-700">
            Add Expense
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // Calendar component
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentCalendarDate);
    const firstDay = getFirstDayOfMonth(currentCalendarDate);
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
      const dateString = formatDate(date);
      const isAvailable = isDateAvailable(dateString);
      const isSelected = selectedDate === dateString;
      
      days.push(
        <button
          key={day}
          onClick={() => isAvailable && setSelectedDate(dateString)}
          disabled={!isAvailable}
          className={`h-10 rounded-lg text-sm font-medium transition-colors ${
            isSelected 
              ? "bg-blue-600 text-white" 
              : isAvailable
                ? "hover:bg-blue-100 text-gray-900"
                : "text-gray-300 cursor-not-allowed"
          }`}
        >
          {day}
        </button>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {currentCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-gray-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  // Vehicle selection component
  const renderVehicleSelection = () => {
    const availableVehicles = getAvailableVehicles();
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Select Vehicle</h3>
          <p className="text-sm text-gray-600">Choose from vehicles you're licensed to drive</p>
        </div>
        
        <div className="space-y-3">
          {availableVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => setSelectedVehicleId(vehicle.id)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedVehicleId === vehicle.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <Car className="w-6 h-6 text-gray-500" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{vehicle.vehicleNumber}</h4>
                    <Badge variant="outline" className="text-xs">
                      License {vehicle.licenseRequired}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {vehicle.make} {vehicle.model} • {vehicle.registration}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{vehicle.capacity} seats</span>
                    <span className="text-xs text-gray-500">• {vehicle.fuelType}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {vehicle.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {selectedVehicleId === vehicle.id && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {availableVehicles.length === 0 && (
          <div className="text-center py-8">
            <Car className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No vehicles available for your license type</p>
            <p className="text-sm text-gray-500">Contact fleet manager for assistance</p>
          </div>
        )}
      </div>
    );
  };

  // Booking details form
  const renderBookingDetails = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Booking Details</h3>
        <p className="text-sm text-gray-600">Complete your vehicle reservation</p>
      </div>
      
      <div className="space-y-4">
        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={selectedStartTime}
              onChange={(e) => setSelectedStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label>End Time</Label>
            <Input
              type="time"
              value={selectedEndTime}
              onChange={(e) => setSelectedEndTime(e.target.value)}
            />
          </div>
        </div>
        
        {/* Purpose */}
        <div>
          <Label>Purpose of Trip *</Label>
          <Input
            placeholder="e.g., Site inspection, Meeting, Service delivery"
            value={bookingPurpose}
            onChange={(e) => setBookingPurpose(e.target.value)}
          />
        </div>
        
        {/* Destination */}
        <div>
          <Label>Destination *</Label>
          <Input
            placeholder="Full address or location"
            value={bookingDestination}
            onChange={(e) => setBookingDestination(e.target.value)}
          />
        </div>
        
        {/* Project Code */}
        <div>
          <Label>Project Code</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select project code" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PW-2025-001">PW-2025-001 - Road Maintenance</SelectItem>
              <SelectItem value="HS-2025-002">HS-2025-002 - Health Inspections</SelectItem>
              <SelectItem value="TR-2025-003">TR-2025-003 - Public Transport</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Notes */}
        <div>
          <Label>Additional Notes</Label>
          <Textarea
            placeholder="Any special requirements..."
            value={bookingNotes}
            onChange={(e) => setBookingNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // Booking confirmation
  const renderBookingConfirmation = () => {
    const selectedVehicle = mockVehicleFleet.find(v => v.id === selectedVehicleId);
    
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Confirm Booking</h3>
          <p className="text-sm text-gray-600">Review your vehicle reservation</p>
        </div>
        
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Car className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">{selectedVehicle?.vehicleNumber}</h4>
                <p className="text-sm text-gray-600">
                  {selectedVehicle?.make} {selectedVehicle?.model}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">Date</Label>
                <p className="font-medium">
                  {new Date(selectedDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Time</Label>
                <p className="font-medium">
                  {selectedStartTime} - {selectedEndTime}
                </p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">Destination</Label>
                <p className="font-medium">{bookingDestination}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-gray-500">Purpose</Label>
                <p className="font-medium">{bookingPurpose}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Awaiting Approval</p>
              <p className="text-yellow-700">
                Your supervisor will review this booking. You'll receive SMS notification when approved.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Booking flow modal
  const renderBookingFlow = () => {
    if (!showBookingFlow) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">
              {bookingStep === 1 && "Select Date"}
              {bookingStep === 2 && "Choose Vehicle"}
              {bookingStep === 3 && "Trip Details"}
              {bookingStep === 4 && "Confirm Booking"}
            </h2>
            <button
              onClick={() => setShowBookingFlow(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex justify-center p-4 border-b">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step <= bookingStep 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-8 h-0.5 mx-1 ${
                      step < bookingStep ? "bg-blue-600" : "bg-gray-200"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            {bookingStep === 1 && renderCalendar()}
            {bookingStep === 2 && renderVehicleSelection()}
            {bookingStep === 3 && renderBookingDetails()}
            {bookingStep === 4 && renderBookingConfirmation()}
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              {bookingStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setBookingStep(bookingStep - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              
              {bookingStep < 4 ? (
                <Button
                  onClick={() => {
                    if (bookingStep === 1 && !selectedDate) {
                      toast({
                        title: "Select Date",
                        description: "Please select a date for your booking.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (bookingStep === 2 && !selectedVehicleId) {
                      toast({
                        title: "Select Vehicle",
                        description: "Please choose a vehicle for your trip.",
                        variant: "destructive",
                      });
                      return;
                    }
                    if (bookingStep === 3 && (!bookingPurpose || !bookingDestination)) {
                      toast({
                        title: "Complete Details",
                        description: "Please fill in all required fields.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setBookingStep(bookingStep + 1);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={
                    (bookingStep === 1 && !selectedDate) ||
                    (bookingStep === 2 && !selectedVehicleId) ||
                    (bookingStep === 3 && (!bookingPurpose || !bookingDestination))
                  }
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleBookingSubmit}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Submit Booking
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="text-lg font-semibold">City Fleet</h1>
          <p className="text-sm text-blue-200">Municipal Vehicle System</p>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40">
          <div className="bg-white w-64 h-full p-4 space-y-2">
            <div className="pb-4 border-b border-gray-200 mb-4">
              <h2 className="font-semibold text-gray-900">Navigation</h2>
            </div>
            
            <MenuButton icon={Car} label="Home" tabKey="home" />
            <MenuButton icon={AlertTriangle} label="Incident Report" tabKey="incident" />
            <MenuButton icon={Fuel} label="Fuel Receipt" tabKey="fuel" />
            <MenuButton icon={FileText} label="Expenses" tabKey="expenses" />
            
            <div className="pt-4 border-t border-gray-200 mt-4">
              <Button variant="outline" onClick={handleEmergencyContact} className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Emergency: 021-555-0123
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 pb-20">
        {activeTab === "home" && renderHome()}
        {activeTab === "incident" && renderIncident()}
        {activeTab === "fuel" && renderFuel()}
        {activeTab === "expenses" && renderExpenses()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => setActiveTab("home")}
            className={`p-3 rounded-lg flex flex-col items-center text-xs transition-colors ${
              activeTab === "home"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Car className="w-5 h-5 mb-1" />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab("incident")}
            className={`p-3 rounded-lg flex flex-col items-center text-xs transition-colors ${
              activeTab === "incident"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <AlertTriangle className="w-5 h-5 mb-1" />
            <span>Incident</span>
          </button>
          
          <button
            onClick={() => setActiveTab("fuel")}
            className={`p-3 rounded-lg flex flex-col items-center text-xs transition-colors ${
              activeTab === "fuel"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Fuel className="w-5 h-5 mb-1" />
            <span>Fuel</span>
          </button>
          
          <button
            onClick={() => setActiveTab("expenses")}
            className={`p-3 rounded-lg flex flex-col items-center text-xs transition-colors ${
              activeTab === "expenses"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span>Expenses</span>
          </button>
        </div>
      </div>

      {/* Vehicle Inspection Checklist Modal */}
      {showInspectionChecklist && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          {/* Header */}
          <div className="bg-blue-900 text-white p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowInspectionChecklist(false)}
                  className="text-white hover:bg-blue-800 p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="font-semibold">Vehicle Checklist</h1>
                  <p className="text-sm text-blue-200">Pre-Trip Inspection</p>
                </div>
              </div>
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Inspection Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Vehicle Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Individual Inspection Items */}
                {[
                  { key: 'tyres', label: 'Tyres', icon: '🛞' },
                  { key: 'lights', label: 'Lights', icon: '💡' },
                  { key: 'brakes', label: 'Brakes', icon: '🛑' },
                  { key: 'fluids', label: 'Fluids', icon: '🛢️' },
                  { key: 'mirrors', label: 'Mirrors', icon: '🪞' },
                  { key: 'interior', label: 'Interior Body', icon: '🚗' },
                  { key: 'exterior', label: 'Exterior Body', icon: '🚙' },
                  { key: 'licenseDisc', label: 'License Disc', icon: '📄' },
                  { key: 'driverLicense', label: 'Driver License', icon: '🆔' },
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm">{item.icon}</span>
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      
                      {/* Yes/No Toggle */}
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!inspectionItems[item.key as keyof typeof inspectionItems] ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          No
                        </span>
                        <button
                          onClick={() => handleInspectionToggle(item.key, !inspectionItems[item.key as keyof typeof inspectionItems])}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            inspectionItems[item.key as keyof typeof inspectionItems] 
                              ? 'bg-blue-900' 
                              : 'bg-red-500'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              inspectionItems[item.key as keyof typeof inspectionItems] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-sm ${inspectionItems[item.key as keyof typeof inspectionItems] ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                          Yes
                        </span>
                      </div>
                    </div>
                    
                    {/* Photo requirement for "No" items */}
                    {!inspectionItems[item.key as keyof typeof inspectionItems] && (
                      <div className="ml-11 space-y-2">
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          📸 Photo required for this item
                        </div>
                        {capturedPhotos[item.key] ? (
                          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                            <CheckCircle className="w-4 h-4" />
                            <div>
                              <p>Photo captured successfully</p>
                              <p className="text-xs text-gray-500">
                                {new Date(capturedPhotos[item.key].timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handlePhotoCapture(item.key)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Take Photo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Additional Photos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Photos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleMiscPhotoCapture}
                  variant="outline"
                  className="w-full h-12 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Add Photo
                </Button>
                {miscPhotos.length > 0 && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{miscPhotos.length} additional photo(s) captured</p>
                    {miscPhotos.map((photo, index) => (
                      <p key={index} className="text-xs text-gray-500">
                        Photo {index + 1}: {new Date(photo.timestamp).toLocaleString()}
                      </p>
                    ))}
                  </div>
                )}
                
                {/* Notes Section under Additional Photos */}
                <div className="pt-3 border-t border-gray-200">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Notes</Label>
                  <textarea
                    placeholder="Add notes about vehicle condition..."
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="space-y-3">
              {requiredPhotos.length > 0 && !canSubmitInspection() && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  ⚠️ Please take photos for all items marked as "No" before submitting
                </div>
              )}
              
              <Button
                onClick={handleSubmitInspection}
                disabled={!canSubmitInspection()}
                className={`w-full h-12 ${
                  canSubmitInspection() 
                    ? 'bg-blue-900 hover:bg-blue-800' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Submit Checklist
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Flow Modal */}
      {renderBookingFlow()}
    </div>
  );
}