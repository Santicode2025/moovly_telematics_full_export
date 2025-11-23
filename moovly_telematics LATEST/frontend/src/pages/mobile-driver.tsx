import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
// MoovlyGoInterface removed - placed on backburner for future use
import InteractiveMap from "@/components/mobile/interactive-map";
import CircuitDriverInterface from "@/components/mobile/circuit-driver-interface";
import { NotificationManager } from "@/components/NotificationManager";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle, 
  AlertCircle,
  User,
  Car,
  MessageSquare,
  Fuel,
  FileText,
  LogOut,
  Camera,
  Coffee,
  Play,
  Pause,
  Timer,
  Lock,
  LogIn,
  Wrench,
  Upload,
  Wifi,
  WifiOff,
  Route,
  Send,
  RefreshCw,
  MessageCircle,
  Target,
  Bell,
  Package,
  Edit3,
  Save,
  ArrowLeft,
  Menu
} from "lucide-react";

interface Driver {
  id: number;
  username: string;
  name: string;
  email: string;
  phone: string;
  idNumber?: string;
  licenseNumber: string;
  status: string;
  performance: string;
}

interface Job {
  id: number;
  jobNumber: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string;
  status: string;
  priority: string;
  driverId: number | null;
}

interface PODData {
  jobId: number;
  recipientName: string;
  recipientMobile: string;
  recipientDepartment: string;
  recipientSignature: string;
  deliveryNotes: string;
  timestamp: string;
}

export default function MobileDriverPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showPOD, setShowPOD] = useState(false);
  const [selectedJobForPOD, setSelectedJobForPOD] = useState<Job | null>(null);
  const [podData, setPodData] = useState<PODData>({
    jobId: 0,
    recipientName: "",
    recipientMobile: "",
    recipientDepartment: "",
    recipientSignature: "",
    deliveryNotes: "",
    timestamp: ""
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [canReorderJobs, setCanReorderJobs] = useState(true); // TODO: Get from dispatcher settings
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [clientPins, setClientPins] = useState<Array<{id: string, name: string, lat: number, lng: number}>>([]);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [shiftEndTime, setShiftEndTime] = useState<Date | null>(null);

  const [offlineJobs, setOfflineJobs] = useState<Job[]>([]);
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState("");
  const [vehicleChecklist, setVehicleChecklist] = useState({
    tyres: true,
    lights: true,
    brakes: true,
    fluids: true,
    mirrors: true,
    interior: true,
    exterior: true,
    licenseDisc: true,
    driverLicense: true
  });

  // Role-based access control - determined by logged-in driver's role
  const [userRole, setUserRole] = useState<'fleet' | 'courier'>('fleet');
  const appMode = userRole; // Dynamic based on driver's assigned role
  
  // Interactive Map for Fleet Jobs
  const [fleetMapJobs, setFleetMapJobs] = useState<any[]>([]);
  
  // Location tracking
  const locationWatchId = useRef<number | null>(null);
  
  const [messageText, setMessageText] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showVehicleSelection, setShowVehicleSelection] = useState(false);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [startingOdometer, setStartingOdometer] = useState("");
  const [showOdometerUpdate, setShowOdometerUpdate] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState("");
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [fuelEntry, setFuelEntry] = useState({
    litres: '',
    cost: '',
    odometerReading: '',
    odometerPhoto: null as any,
    fuelSlipPhoto: null as any,
    pumpStationPhoto: null as any
  });
  
  // Checklist state variables
  const [requiredPhotos, setRequiredPhotos] = useState<string[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<{[key: string]: any}>({});
  const [miscPhotos, setMiscPhotos] = useState<any[]>([]);
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Utility function for authenticated API calls
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}, config: { critical?: boolean } = {}) => {
    const token = localStorage.getItem('mobileAuthToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const authenticatedOptions: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, authenticatedOptions);
    
    // Handle 401 responses - only redirect for critical auth failures
    if (response.status === 401) {
      if (config.critical) {
        localStorage.removeItem('mobileDriver');
        localStorage.removeItem('mobileAuthToken');
        localStorage.removeItem('authenticated');
        window.location.href = '/mobile';
        throw new Error('Authentication failed - redirecting to login');
      } else {
        // For non-critical calls, just throw error without redirecting
        throw new Error('Invalid or expired token');
      }
    }
    
    return response;
  };

  // Fetch messages for the current driver
  const { data: driverMessages = [], refetch: refetchMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/mobile/messages', currentDriver?.id],
    queryFn: async () => {
      console.log('Fetching messages for driver ID:', currentDriver?.id);
      
      const response = await makeAuthenticatedRequest(`/api/mobile/messages?driverId=${currentDriver?.id}`, {}, { critical: false });
      const data = await response.json();
      console.log('Driver messages response:', data);
      return data;
    },
    enabled: !!currentDriver?.id && !!localStorage.getItem('mobileAuthToken'),
    refetchInterval: 15000, // Reduced frequency - every 15 seconds instead of 5
    refetchIntervalInBackground: false, // Don't poll when tab is not visible
    retry: false, // Don't retry failed requests
  });

  // Initialize mobile app features
  useEffect(() => {
    const savedDriver = localStorage.getItem("mobileDriver");
    const isAuthenticated = localStorage.getItem("authenticated");
    
    console.log('=== MOBILE DRIVER DEBUG ===');
    console.log('savedDriver raw:', savedDriver);
    console.log('isAuthenticated:', isAuthenticated);
    
    if (savedDriver && isAuthenticated) {
      const driver = JSON.parse(savedDriver);
      console.log('Parsed driver object:', driver);
      setCurrentDriver(driver);
      setIsLoggedIn(true);
      
      // Set user role based on driver's appMode from login
      console.log('Driver appMode:', driver.appMode);
      console.log('Driver role:', driver.role);
      
      // Moovly Go placed on backburner - always use Connect interface (fleet role)
      console.log('Driver appMode:', driver.appMode, '- forcing fleet role for Connect interface');
      setUserRole('fleet');
      
      loadDriverData();
      initializeMobileFeatures();
    } else {
      // Clear any stale data and redirect to mobile login if not logged in
      localStorage.removeItem("mobileDriver");
      localStorage.removeItem("authenticated");
      window.location.href = '/mobile';
    }

    // Monitor online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (locationWatchId.current) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, []);

  // Initialize mobile-specific features
  const initializeMobileFeatures = () => {
    startLocationTracking();
    setupShiftTimer();
    loadOfflineJobs();
  };

  // Live GPS Tracking
  const startLocationTracking = () => {
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(newLocation);
          
          // Send location to backend if online
          if (isOnline && currentDriver) {
            sendLocationUpdate(newLocation);
          }
        },
        (error) => console.error("GPS Error:", error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    }
  };

  const sendLocationUpdate = async (location: {lat: number, lng: number}) => {
    try {
      await makeAuthenticatedRequest('/api/drivers/location', {
        method: 'POST',
        body: JSON.stringify({
          driverId: currentDriver?.id,
          latitude: location.lat,
          longitude: location.lng,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error("Failed to send location:", error);
    }
  };

  // Break Mode Toggle
  const toggleBreakMode = async () => {
    const newBreakStatus = !isOnBreak;
    setIsOnBreak(newBreakStatus);
    
    try {
      await makeAuthenticatedRequest('/api/drivers/break-mode', {
        method: 'POST',
        body: JSON.stringify({
          driverId: currentDriver?.id,
          onBreak: newBreakStatus
        })
      });
      
      toast({
        title: newBreakStatus ? "Break Started" : "Break Ended",
        description: newBreakStatus ? "You are now on break" : "Welcome back to work"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update break status",
        variant: "destructive"
      });
    }
  };

  // Vehicle selection and management
  const motivationalMessages = [
    "Ready to make today amazing! Let's deliver excellence! 🚚✨",
    "Today's your day to shine! Safe travels ahead! 🌟",
    "Let's make every delivery count! You've got this! 💪",
    "Another day, another opportunity to excel! Drive safe! 🛣️",
    "Ready to serve our customers with a smile! Great job! 😊",
    "Today's mission: deliver happiness everywhere! Let's go! 📦",
    "Your dedication makes the difference! Drive proudly! 🏆",
    "Making communities better, one delivery at a time! 🌍",
    "Excellence is your standard! Have a fantastic day! ⭐",
    "Delivering more than packages - delivering trust! Thank you! 🤝"
  ];

  const loadVehicles = async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/vehicles/available');
      if (response.ok) {
        const vehicleData = await response.json();
        setVehicles(vehicleData);
      }
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    }
  };

  const selectVehicle = async (vehicle: any) => {
    if (!startingOdometer) {
      toast({
        title: "Odometer Required",
        description: "Please enter the starting odometer reading",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await makeAuthenticatedRequest('/api/drivers/assign-vehicle', {
        method: 'POST',
        body: JSON.stringify({
          driverId: currentDriver?.id,
          vehicleId: vehicle.id,
          startingOdometer: parseFloat(startingOdometer)
        })
      });

      if (response.ok) {
        setSelectedVehicle(vehicle);
        setShowVehicleSelection(false);
        setShowOdometerUpdate(false);
        
        // Show motivational message
        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        setMotivationalMessage(randomMessage);
        setShowWelcomeMessage(true);
        
        toast({
          title: "Vehicle Assigned",
          description: `You're now driving ${vehicle.make} ${vehicle.model} (${vehicle.registration})`,
        });
      }
    } catch (error) {
      toast({
        title: "Assignment Failed", 
        description: "Failed to assign vehicle. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.registration.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
    vehicle.make.toLowerCase().includes(vehicleSearchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(vehicleSearchTerm.toLowerCase())
  );

  // AI-like congratulatory messages for sync success
  const getRandomSyncMessage = () => {
    const messages = [
      "Great work! Your data is now safely synchronized 🎉",
      "Excellent! All your hard work has been backed up successfully ✨",
      "Well done! Your offline work is now synced to the cloud 🌟",
      "Fantastic! Everything is up to date and secure 🚀",
      "Amazing job! Your data sync completed perfectly 💫",
      "Outstanding! All your work has been saved successfully 🏆",
      "Perfect sync! Your dedication shows in every completed task 👏",
      "Brilliant! Your data is now synchronized across all systems ⭐",
      "Superb work! All offline tasks have been updated successfully 🎯",
      "Incredible! Your sync completed without any issues 🔥"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Show sync success popup with AI-like personality
  const showSyncSuccessPopup = () => {
    const message = getRandomSyncMessage();
    setSyncSuccessMessage(message);
    setShowSyncSuccess(true);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
      setShowSyncSuccess(false);
    }, 4000);
  };

  // Offline Data Sync
  const syncOfflineData = async () => {
    if (offlineJobs.length > 0) {
      try {
        for (const job of offlineJobs) {
          await fetch(`/api/jobs/${job.id}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job)
          });
        }
        setOfflineJobs([]);
        
        // Show AI-like congratulatory popup
        showSyncSuccessPopup();
        
        // Also update pending jobs count
        if (currentDriver) {
          await fetch(`/api/driver/${currentDriver.id}/reset-pending-jobs`, {
            method: 'POST'
          });
        }
      } catch (error) {
        console.error("Sync failed:", error);
        toast({
          title: "Sync Failed",
          description: "Unable to sync offline data. Please try again.",
          variant: "destructive"
        });
      }
    }
  };



  // Setup shift timer
  const setupShiftTimer = () => {
    // Set shift end time (example: 8 hours from now)
    const shiftEnd = new Date();
    shiftEnd.setHours(shiftEnd.getHours() + 8);
    setShiftEndTime(shiftEnd);
  };

  // Load offline jobs
  const loadOfflineJobs = () => {
    const saved = localStorage.getItem('offlineJobs');
    if (saved) {
      setOfflineJobs(JSON.parse(saved));
    }
  };

  // Checklist photo capture function
  const handleChecklistPhotoCapture = (itemKey: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const timestamp = new Date().toISOString();
          const photoData = {
            url: reader.result as string,
            timestamp: timestamp,
            type: itemKey
          };
          
          setCapturedPhotos(prev => ({
            ...prev,
            [itemKey]: photoData
          }));
          
          toast({
            title: "Photo Captured",
            description: `${itemKey} photo captured at ${new Date(timestamp).toLocaleString()}`,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // Miscellaneous photo capture function
  const handleMiscPhotoCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
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

  // Check if inspection can be submitted
  const canSubmitInspection = () => {
    // Check if all required photos are captured
    for (const photoKey of requiredPhotos) {
      if (!capturedPhotos[photoKey]) {
        return false;
      }
    }
    return true;
  };

  // Submit inspection
  const handleSubmitInspection = async () => {
    if (!canSubmitInspection()) {
      toast({
        title: "Incomplete Inspection",
        description: "Please take all required photos before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      const inspectionData = {
        driverId: currentDriver?.id,
        vehicleId: selectedVehicle?.id,
        checklist: vehicleChecklist,
        requiredPhotos: capturedPhotos,
        additionalPhotos: miscPhotos,
        notes: inspectionNotes,
        timestamp: new Date().toISOString()
      };

      // Save inspection locally first (for offline support)
      const savedInspections = JSON.parse(localStorage.getItem('offlineInspections') || '[]');
      savedInspections.push(inspectionData);
      localStorage.setItem('offlineInspections', JSON.stringify(savedInspections));

      toast({
        title: "Inspection Submitted",
        description: "Vehicle inspection completed successfully.",
      });

      // Reset form
      setRequiredPhotos([]);
      setCapturedPhotos({});
      setMiscPhotos([]);
      setInspectionNotes("");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit inspection. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Photo capture simulation for fuel upload
  const capturePhoto = async (photoType: 'odometer' | 'fuelSlip' | 'pumpStation') => {
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
            type: photoType
          };
          
          setFuelEntry(prev => ({
            ...prev,
            [`${photoType}Photo`]: photoData
          }));
          
          toast({
            title: "Photo Captured",
            description: `${photoType} photo captured at ${new Date(timestamp).toLocaleString()}`,
          });
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  // Submit fuel entry
  const submitFuelEntry = async () => {
    const { litres, cost, odometerReading, odometerPhoto, fuelSlipPhoto, pumpStationPhoto } = fuelEntry;
    
    if (!litres || !cost || !odometerReading || !odometerPhoto || !fuelSlipPhoto || !pumpStationPhoto) {
      toast({
        title: "Missing Information",
        description: "Please complete all fields (including odometer reading) and photos before submitting.",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        driverId: currentDriver?.id,
        vehicleId: selectedVehicle?.id,
        litres: parseFloat(litres),
        cost: parseFloat(cost),
        odometerReading: parseFloat(odometerReading),
        odometerPhoto,
        fuelSlipPhoto,
        pumpStationPhoto,
        timestamp: new Date().toISOString(),
        location: currentLocation
      };

      if (isOnline) {
        await makeAuthenticatedRequest('/api/fuel-entries', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        
        toast({
          title: "Fuel Entry Submitted",
          description: "Your fuel entry has been recorded successfully."
        });
      } else {
        // Store offline for later sync
        const offlineFuel = JSON.parse(localStorage.getItem('offlineFuelEntries') || '[]');
        offlineFuel.push(payload);
        localStorage.setItem('offlineFuelEntries', JSON.stringify(offlineFuel));
        
        toast({
          title: "Saved Offline",
          description: "Fuel entry saved locally and will sync when online."
        });
      }

      // Reset form
      setFuelEntry({
        litres: '',
        cost: '',
        odometerReading: '',
        odometerPhoto: null,
        fuelSlipPhoto: null,
        pumpStationPhoto: null
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit fuel entry. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle forgot PIN request
  const handleForgotPin = async () => {
    if (!loginForm.username) {
      toast({
        title: "Username Required",
        description: "Please enter your username first to request PIN help.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create an alert in the Alert Centre for dispatch
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "pin_help_request",
          message: `Driver ${loginForm.username} is requesting PIN assistance. Please check their last used PIN in the Drivers tab and help them login.`,
          severity: "medium",
          entityType: "driver",
          entityId: null, // We don't have driver ID yet
          metadata: {
            username: loginForm.username,
            requestedAt: new Date().toISOString(),
            deviceType: "mobile"
          }
        }),
      });

      if (response.ok) {
        toast({
          title: "Help Request Sent",
          description: "Your PIN help request has been sent to dispatch. They will assist you shortly.",
          duration: 5000
        });
      } else {
        throw new Error('Failed to send help request');
      }
    } catch (error) {
      toast({
        title: "Request Failed",
        description: "Unable to send help request. Please contact dispatch directly.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use the PIN login endpoint
      const response = await fetch("/api/driver/pin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: loginForm.username,
          pin: loginForm.password
        }),
      });

      const data = await response.json();

      if (data.success && data.driver) {
        setCurrentDriver(data.driver);
        setIsLoggedIn(true);
        // Set user role from API response - locks them to their assigned interface
        setUserRole(data.driver.role || 'fleet');
        localStorage.setItem("mobileDriver", JSON.stringify(data.driver));
        loadDriverData();
        initializeMobileFeatures();
        
        // Check if vehicle is assigned
        if (!data.driver.vehicleId) {
          await loadVehicles();
          setShowVehicleSelection(true);
        }
        toast({
          title: "Welcome Back!",
          description: `Signed in successfully, ${data.driver.name}`,
        });
      } else {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid username or PIN.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const loadDriverData = async () => {
    try {
      const jobsResponse = await fetch("/api/jobs");
      const allJobs = await jobsResponse.json();
      
      // Filter jobs assigned to current driver or available jobs
      const driverJobs = allJobs.filter((job: Job) => 
        job.driverId === currentDriver?.id || (job.driverId === null && job.status === 'pending')
      );
      setJobs(driverJobs);
      
      // Convert jobs to map format for interactive map
      const mapJobs = driverJobs.map((job: Job, index: number) => ({
        id: job.id.toString(),
        title: job.jobNumber,
        address: job.deliveryAddress,
        lat: -26.2041 + (Math.random() - 0.5) * 0.1, // Mock coordinates around Johannesburg
        lng: 28.0473 + (Math.random() - 0.5) * 0.1,
        priority: index + 1,
        status: job.status === 'completed' ? 'completed' : 'pending'
      }));
      setFleetMapJobs(mapJobs);
    } catch (error) {
      console.error("Error loading driver data:", error);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentDriver(null);
    setJobs([]);
    localStorage.removeItem("mobileDriver");
    localStorage.removeItem("authenticated");
    
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    
    // Redirect to mobile login
    window.location.href = '/mobile';
  };

  const startJob = async (jobId: number) => {
    try {
      await fetch(`/api/jobs/${jobId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId: currentDriver?.id }),
      });
      
      toast({
        title: "Job Started",
        description: "Job has been started successfully.",
      });
      loadDriverData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completeJob = (jobId: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setSelectedJobForPOD(job);
      setPodData({
        jobId: job.id,
        recipientName: "",
        recipientMobile: "",
        recipientDepartment: "",
        recipientSignature: "",
        deliveryNotes: "",
        timestamp: new Date().toISOString()
      });
      setShowPOD(true);
    }
  };

  const submitPOD = async () => {
    if (!podData.recipientName || !podData.recipientMobile || !podData.recipientSignature) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and add signature",
        variant: "destructive"
      });
      return;
    }

    try {
      await fetch(`/api/jobs/${podData.jobId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          driverId: currentDriver?.id,
          completedAt: new Date().toISOString(),
          notes: "Completed via mobile app",
          podData: podData
        }),
      });
      
      setJobs(jobs.map(job => 
        job.id === podData.jobId 
          ? { ...job, status: 'completed' }
          : job
      ));
      
      setShowPOD(false);
      setSelectedJobForPOD(null);
      clearSignature();
      
      toast({
        title: "Delivery Completed",
        description: "Proof of delivery captured successfully"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to complete job. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Signature pad functionality
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      setPodData(prev => ({ ...prev, recipientSignature: dataURL }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setPodData(prev => ({ ...prev, recipientSignature: "" }));
      }
    }
  };



  // Login Screen
  // Messaging handlers
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedPhoto) return;

    console.log('Current driver:', currentDriver);
    console.log('Driver ID:', currentDriver?.id);

    try {
      // Ensure we have a valid driver ID
      if (!currentDriver || !currentDriver.id) {
        toast({
          title: "Error",
          description: "Please log in again to send messages.",
          variant: "destructive"
        });
        return;
      }

      // Use JSON instead of FormData for consistency with API
      const messageData = {
        driverId: currentDriver.id.toString(),
        content: messageText.trim() || 'Image shared',
        messageType: selectedPhoto ? 'image' : 'text'
      };

      // Send to dispatch messaging endpoint
      const result = await makeAuthenticatedRequest('/api/mobile/messages', {
        method: 'POST',
        body: JSON.stringify(messageData),
      });

      if (result.ok) {
        toast({
          title: "Message sent",
          description: "Your message has been delivered to dispatch.",
        });
        setMessageText("");
        setSelectedPhoto("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Refresh messages
        refetchMessages();
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or check your connection.",
        variant: "destructive",
      });
    }
  };

  const handleQuickMessage = (message: string) => {
    setMessageText(message);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-[#363636] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
              <Car className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-secondary">Moovly Driver</CardTitle>
            <p className="text-gray-600">Sign in to manage your deliveries</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Username (e.g. test.driver.smith)"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                  className="h-12"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="4-Digit PIN"
                  maxLength={4}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  required
                  className="h-12"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-secondary hover:bg-ring"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              
              {/* Forgot PIN Button */}
              <div className="text-center">
                <Button 
                  type="button"
                  variant="ghost"
                  className="text-secondary hover:text-ring text-sm"
                  onClick={handleForgotPin}
                  disabled={!loginForm.username || loading}
                >
                  Forgot PIN? Request Help
                </Button>
              </div>
            </form>
            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Demo Credentials:</p>
              <p>test.driver.smith / PIN: 4133</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Mobile App Interface
  console.log('=== RENDER DEBUG ===');
  console.log('userRole:', userRole);
  console.log('currentDriver:', currentDriver);
  console.log('isLoggedIn:', isLoggedIn);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug info */}
      
      {/* Always use Connect Interface - Moovly Go on backburner */}
      {(
        <>
          {/* Header - Only for Fleet Mode */}
          <div className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">{currentDriver?.name}</h1>
                  <p className="text-sm text-gray-500">Driver ID: {currentDriver?.licenseNumber}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Network Status with Low Network Mode */}
                <div className="flex items-center space-x-2">
                  {isOnline ? (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-full">
                      <Wifi className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-red-50 rounded-full">
                      <WifiOff className="w-3 h-3 text-red-600" />
                      <span className="text-xs text-red-700 font-medium">Offline</span>
                      {offlineJobs.length > 0 && (
                        <Badge variant="destructive" className="text-xs ml-1">
                          {offlineJobs.length}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Break Mode Toggle */}
                <Button
                  variant={isOnBreak ? "destructive" : "outline"}
                  size="sm"
                  onClick={toggleBreakMode}
                  className="text-xs"
                >
                  <Coffee className="w-3 h-3 mr-1" />
                  {isOnBreak ? "On Break" : "Break"}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* User Role Display - Read Only */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-center">
                <div className="flex items-center py-1 px-3 bg-white rounded-full border">
                  {userRole === 'fleet' ? (
                    <>
                      <Car className="w-3 h-3 mr-2 text-blue-600" />
                      <span className="text-xs font-medium text-gray-700">Fleet Driver</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-3 h-3 mr-2 text-teal-600" />
                      <span className="text-xs font-medium text-gray-700">Courier Driver</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Location & Shift Status Bar */}
            <div className="px-4 pb-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {currentLocation 
                      ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                      : "Getting location..."
                    }
                  </span>
                </div>
                {shiftEndTime && (
                  <div className="flex items-center space-x-1">
                    <Timer className="w-3 h-3" />
                    <span>Shift ends: {shiftEndTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Simplified Navigation - Circuit Style */}
          <div className="bg-white border-b shadow-sm">
            <div className="flex justify-around">
              {[
                { key: "main", label: "Route", icon: Route },
                { key: "vehicle", label: "Vehicle", icon: Car },
                { key: "messages", label: "Messages", icon: MessageCircle, badge: 3 },
                { key: "menu", label: "More", icon: Menu },
              ].map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex flex-col items-center py-4 px-4 text-xs relative min-w-[70px] transition-all duration-200 hover:bg-gray-50 ${
                    activeTab === key
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50 font-medium"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="font-medium">{label}</span>
                  {badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className={activeTab === 'main' ? '' : 'p-4'}>
            {activeTab === "main" && (
              <div className="h-screen">
                <CircuitDriverInterface
                  jobs={jobs}
                  currentLocation={currentLocation}
                  onJobSelect={(job) => {
                    console.log('Selected job:', job);
                  }}
                  onJobComplete={(jobId) => {
                    completeJob(jobId);
                  }}
                  onJobReorder={(reorderedJobs) => {
                    console.log('Jobs reordered:', reorderedJobs);
                    // TODO: Save reordered jobs to backend
                  }}
                  canReorderJobs={canReorderJobs}
                />
              </div>
            )}

            {activeTab === "jobs" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your Jobs</h2>
              <Badge variant="secondary">{jobs.length} active</Badge>
            </div>
            
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No jobs assigned</p>
                  <p className="text-sm text-gray-500">Check back later for new deliveries</p>
                </CardContent>
              </Card>
            ) : (
              jobs.map((job) => (
                <Card key={job.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{job.jobNumber}</h3>
                        <p className="text-sm text-gray-600">{job.customerName}</p>
                      </div>
                      <Badge 
                        variant={job.status === 'pending' ? 'secondary' : 
                                job.status === 'in_transit' ? 'default' : 'outline'}
                      >
                        {job.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Pickup</p>
                          <p className="text-sm text-gray-600">{job.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Delivery</p>
                          <p className="text-sm text-gray-600">{job.deliveryAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-secondary" />
                        <p className="text-sm text-gray-600">
                          {new Date(job.scheduledDate).toLocaleDateString()} at{" "}
                          {new Date(job.scheduledDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {job.status === 'pending' && (
                        <Button
                          onClick={() => startJob(job.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Start Job
                        </Button>
                      )}
                      {job.status === 'in_transit' && (
                        <Button
                          onClick={() => completeJob(job.id)}
                          className="flex-1 bg-secondary hover:bg-ring"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="px-3">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "route" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Route className="w-5 h-5 mr-2" />
                  Route Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Today's Route</span>
                    <Badge variant="secondary">{jobs.length} stops</Badge>
                  </div>

                  {/* Simple Map View */}
                  <div className="bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 min-h-[200px] relative">
                    <div className="text-center">
                      <MapPin className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">Interactive Map View</p>
                      <p className="text-xs text-gray-500 mb-3">Current location and job destinations</p>
                    </div>

                    {/* Client Pins Display */}
                    {currentLocation && (
                      <div className="bg-white p-2 rounded border shadow-sm mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-secondary/100 rounded-full"></div>
                          <span className="text-xs text-gray-700">
                            Your Location: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Job Location Pins */}
                    {jobs.slice(0, 3).map((job, index) => (
                      <div key={job.id} className="bg-white p-2 rounded border shadow-sm mb-1">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'pending' ? 'bg-orange-500' :
                            job.status === 'in_transit' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-gray-700">
                            {job.customerName} - {job.deliveryAddress.split(',')[0]}
                          </span>
                        </div>
                      </div>
                    ))}

                    {jobs.length > 3 && (
                      <div className="text-xs text-gray-500 text-center mt-2">
                        +{jobs.length - 3} more destinations
                      </div>
                    )}
                  </div>

                  <Button className="w-full" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    Start Navigation
                  </Button>
                  
                  <Button className="w-full" variant="secondary" size="sm">
                    <MapPin className="w-4 h-4 mr-2" />
                    View Full Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "map" && (
          <div className="space-y-4">
            <InteractiveMap
              jobs={fleetMapJobs}
              onJobsUpdate={setFleetMapJobs}
              onOptimizeGroup={(groupedJobs, remainingJobs) => {
                // Update fleet map jobs with grouped priorities
                const allJobs = [...groupedJobs, ...remainingJobs];
                setFleetMapJobs(allJobs);
                toast({
                  title: "Route Customized",
                  description: `${groupedJobs.length} jobs prioritized, ${remainingJobs.length} optimized.`
                });
              }}
            />
          </div>
        )}

            {activeTab === "menu" && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Features</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("fuel")}>
                      <Fuel className="w-4 h-4 mr-2" />
                      Log Fuel Entry
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("checklist")}>
                      <FileText className="w-4 h-4 mr-2" />
                      Vehicle Checklist
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("sync")}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("notifications")}>
                      <Bell className="w-4 h-4 mr-2" />
                      Push Notifications
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

        {activeTab === "checklist" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
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
                        <span className={`text-sm ${!vehicleChecklist[item.key as keyof typeof vehicleChecklist] ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          No
                        </span>
                        <button
                          onClick={() => {
                            const newValue = !vehicleChecklist[item.key as keyof typeof vehicleChecklist];
                            setVehicleChecklist(prev => ({ ...prev, [item.key]: newValue }));
                            
                            if (!newValue) {
                              // If set to "No", add to required photos
                              setRequiredPhotos((prev: string[]) => [...prev.filter(photo => photo !== item.key), item.key]);
                            } else {
                              // If set to "Yes", remove from required photos
                              setRequiredPhotos((prev: string[]) => prev.filter(photo => photo !== item.key));
                              setCapturedPhotos((prev: any) => {
                                const newPhotos = { ...prev };
                                delete newPhotos[item.key];
                                return newPhotos;
                              });
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            vehicleChecklist[item.key as keyof typeof vehicleChecklist] 
                              ? 'bg-[#00A8CC]' 
                              : 'bg-red-500'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              vehicleChecklist[item.key as keyof typeof vehicleChecklist] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className={`text-sm ${vehicleChecklist[item.key as keyof typeof vehicleChecklist] ? 'text-[#00A8CC] font-medium' : 'text-gray-500'}`}>
                          Yes
                        </span>
                      </div>
                    </div>
                    
                    {/* Photo requirement for "No" items */}
                    {!vehicleChecklist[item.key as keyof typeof vehicleChecklist] && (
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
                            onClick={() => handleChecklistPhotoCapture(item.key)}
                            size="sm"
                            className="bg-[#00A8CC] hover:bg-[#0097B8]"
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
                  className="w-full h-12 border-2 border-dashed border-[#00A8CC]/30 text-[#00A8CC] hover:bg-[#00A8CC]/10"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Add Photo
                </Button>
                {miscPhotos.length > 0 && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{miscPhotos.length} additional photo(s) captured</p>
                    {miscPhotos.map((photo: any, index: number) => (
                      <p key={index} className="text-xs text-gray-500">
                        Photo {index + 1}: {new Date(photo.timestamp).toLocaleString()}
                      </p>
                    ))}
                  </div>
                )}
                
                {/* Notes Section under Additional Photos */}
                <div className="pt-3 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Notes</label>
                  <Textarea
                    placeholder="Add notes about vehicle condition..."
                    value={inspectionNotes}
                    onChange={(e) => setInspectionNotes(e.target.value)}
                    className="min-h-[80px]"
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
                    ? 'bg-[#00A8CC] hover:bg-[#0097B8]' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Submit Checklist
              </Button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <NotificationManager 
              authToken={localStorage.getItem('mobileAuthToken') || undefined}
              isDriver={true}
            />
          </div>
        )}

        {activeTab === "fuel" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Fuel className="w-5 h-5 mr-2" />
                  Fuel Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">Litres Filled</label>
                      <Input 
                        type="number" 
                        placeholder="Litres" 
                        className="text-center"
                        value={fuelEntry.litres}
                        onChange={(e) => setFuelEntry(prev => ({ ...prev, litres: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Total Cost (ZAR)</label>
                      <Input 
                        type="number" 
                        placeholder="R 0.00" 
                        className="text-center"
                        value={fuelEntry.cost}
                        onChange={(e) => setFuelEntry(prev => ({ ...prev, cost: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  {/* Odometer Reading - Critical for fuel consumption calculations */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Odometer Reading
                      <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                    </label>
                    <Input 
                      type="number" 
                      placeholder="Current odometer reading" 
                      className="text-center"
                      value={fuelEntry.odometerReading}
                      onChange={(e) => setFuelEntry(prev => ({ ...prev, odometerReading: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter the current odometer reading for fuel consumption tracking
                    </p>
                  </div>

                  {/* Photo Requirements */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Photo of Odometer</label>
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        size="sm"
                        onClick={() => capturePhoto('odometer')}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <div className="mt-2 h-24 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                        {fuelEntry.odometerPhoto ? (
                          <div className="text-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                            <div>
                              <span className="text-xs text-green-600">Photo captured</span>
                              <p className="text-xs text-gray-500">
                                {new Date(fuelEntry.odometerPhoto.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No photo taken</span>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Photo of Fuel Slip</label>
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        size="sm"
                        onClick={() => capturePhoto('fuelSlip')}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <div className="mt-2 h-24 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                        {fuelEntry.fuelSlipPhoto ? (
                          <div className="text-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                            <div>
                              <span className="text-xs text-green-600">Photo captured</span>
                              <p className="text-xs text-gray-500">
                                {new Date(fuelEntry.fuelSlipPhoto.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No photo taken</span>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Photo of Pump Station Sign</label>
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline" 
                        size="sm"
                        onClick={() => capturePhoto('pumpStation')}
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      <div className="mt-2 h-24 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                        {fuelEntry.pumpStationPhoto ? (
                          <div className="text-center">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                            <div>
                              <span className="text-xs text-green-600">Photo captured</span>
                              <p className="text-xs text-gray-500">
                                {new Date(fuelEntry.pumpStationPhoto.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No photo taken</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Validation Warning */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Complete All Fields</p>
                        <p className="text-xs text-yellow-700">All fields (litres, cost, odometer reading) and photos are required for fuel entry submission.</p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full bg-[#00A8CC] hover:bg-[#0097B8]"
                    onClick={submitFuelEntry}
                    disabled={!fuelEntry.litres || !fuelEntry.cost || !fuelEntry.odometerReading || !fuelEntry.odometerPhoto || !fuelEntry.fuelSlipPhoto || !fuelEntry.pumpStationPhoto}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Fuel Entry
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Fuel Entries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">45.2 L - R 762.50</p>
                      <p className="text-xs text-gray-600">Engen - 2 hours ago</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Synced</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-sm font-medium">38.8 L - R 655.20</p>
                      <p className="text-xs text-gray-600">Shell - Yesterday</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Synced</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sync" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Low Network Mode
                  </div>
                  <div className="flex items-center space-x-2">
                    {isOnline ? (
                      <Badge variant="secondary" className="bg-green-50 text-green-700">
                        <Wifi className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <WifiOff className="w-3 h-3 mr-1" />
                        Offline
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Network Status Explanation */}
                  <div className={`p-3 rounded-lg border ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-start space-x-2">
                      {isOnline ? (
                        <Wifi className="w-4 h-4 text-green-600 mt-0.5" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-red-600 mt-0.5" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                          {isOnline ? 'Connected to Internet' : 'No Internet Connection'}
                        </p>
                        <p className={`text-xs ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
                          {isOnline 
                            ? 'All data is syncing automatically'
                            : 'Data will be saved locally and synced when connected'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pending Jobs Queue */}
                  {offlineJobs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Pending Sync ({offlineJobs.length})</h3>
                        <Button
                          size="sm"
                          onClick={syncOfflineData}
                          disabled={!isOnline}
                          className="text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Sync Now
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {offlineJobs.map((job, index) => (
                          <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-medium text-yellow-800">
                                  {job.status === 'completed' && '✅ Job Completed'}
                                  {job.status === 'in_transit' && '🚚 In Transit'}
                                  {job.status === 'pending' && '📋 Pending Job'}
                                </p>
                                <p className="text-xs text-yellow-700">
                                  {new Date(job.scheduledDate).toLocaleString()}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Offline
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Sync Button */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Manual Sync</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={syncOfflineData}
                        disabled={!isOnline}
                        className="text-xs"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Force Sync
                      </Button>
                    </div>
                    
                    <p className="text-xs text-gray-600">
                      Use manual sync if automatic sync fails or if you want to immediately upload pending data.
                    </p>
                  </div>

                  {/* Data Usage Tips */}
                  <div className="bg-[#00A8CC]/10 border border-[#00A8CC]/20 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-[#00A8CC] mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-[#00A8CC]">Low Network Tips</p>
                        <ul className="text-xs text-[#424242] mt-1 space-y-1">
                          <li>• Complete jobs offline - they'll sync automatically</li>
                          <li>• Take photos for fuel entries without internet</li>
                          <li>• Essential data is saved locally until connected</li>
                          <li>• Messages may be delayed in poor signal areas</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Smart Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No new notifications</p>
                    <p className="text-sm text-gray-500">Alerts will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">{notification.title}</p>
                            <p className="text-xs text-gray-600">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "vehicle" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  Current Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedVehicle ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{selectedVehicle.make} {selectedVehicle.model}</span>
                      <Badge variant="secondary">{selectedVehicle.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Plate:</span>
                        <p className="font-medium">{selectedVehicle.plateNumber}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Mileage:</span>
                        <p className="font-medium">{selectedVehicle.mileage} km</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Car className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-4">No vehicle assigned</p>
                    <Button variant="outline" className="w-full">
                      Request Vehicle Assignment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Maintenance Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea 
                  placeholder="Report any vehicle issues or maintenance needs..."
                  className="min-h-[100px]"
                />
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Camera className="w-4 h-4 mr-2" />
                    Add Photos
                  </Button>
                  <Button className="w-full">
                    <Wrench className="w-4 h-4 mr-2" />
                    Submit Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("fuel")}>
                  <Fuel className="w-4 h-4 mr-2" />
                  Log Fuel Entry
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab("checklist")}>
                  <FileText className="w-4 h-4 mr-2" />
                  Vehicle Checklist
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-4">
            {/* Conversation History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Dispatch Chat
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Online
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4">
                  <div className="space-y-3">
                    {messagesLoading ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Loading messages...</p>
                      </div>
                    ) : driverMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">No messages yet</p>
                        <p className="text-xs text-gray-400">Your conversation with dispatch will appear here</p>
                        <p className="text-xs text-gray-400 mt-2">Driver ID: {currentDriver?.id}</p>
                      </div>
                    ) : (
                      driverMessages
                        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((message: any) => (
                          <div key={message.id} className={`flex ${message.fromUserId === currentDriver?.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-lg max-w-[80%] ${
                              message.fromUserId === currentDriver?.id 
                                ? 'bg-[#00A8CC] text-white' 
                                : 'bg-gray-100'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                message.fromUserId === currentDriver?.id 
                                  ? 'text-white/80' 
                                  : 'text-gray-500'
                              }`}>
                                {message.fromUserId === currentDriver?.id ? 'You' : 'Dispatch'} • {new Date(message.createdAt).toLocaleTimeString()}
                                {message.fromUserId === currentDriver?.id && ' • ✓'}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                    <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="space-y-3">
                  {/* Photo Preview */}
                  {selectedPhoto && (
                    <div className="relative">
                      <img 
                        src={selectedPhoto} 
                        alt="Selected photo" 
                        className="w-full max-h-48 object-cover rounded border"
                      />
                      <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        📍 {new Date().toLocaleString()}
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2"
                        onClick={() => setSelectedPhoto("")}
                      >
                        ×
                      </Button>
                    </div>
                  )}

                  {/* Message Input Area */}
                  <div className="flex space-x-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="flex-1 min-h-[80px] resize-none"
                    />
                    <div className="flex flex-col space-y-2">
                      {/* Camera Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                      {/* Send Button */}
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() && !selectedPhoto}
                        className="px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                  />

                  {/* Message Options */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickMessage("Starting break - 15 minutes")}
                    >
                      ☕ Break Time
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickMessage("Running 10 minutes late")}
                    >
                      ⏰ Running Late
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickMessage("Delivery completed")}
                    >
                      ✅ Completed
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleQuickMessage("Need assistance")}
                    >
                      🆘 Help
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
          </div>
        )}



        {activeTab === "sync" && (
          <div className="space-y-4">{/* Emergency Contact */}
            <Card>
              <CardContent className="pt-4">
                <Button variant="destructive" className="w-full">
                  <Phone className="w-4 h-4 mr-2" />
                  Emergency Contact
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* AI-like Sync Success Popup */}
      {showSyncSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="text-green-600 text-2xl">✨</div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Complete!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {syncSuccessMessage}
              </p>
            </div>
            <Button
              onClick={() => setShowSyncSuccess(false)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Awesome! 👍
            </Button>
          </div>
        </div>
      )}

      {/* Vehicle Selection Modal */}
      {showVehicleSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Select Your Vehicle</h2>
              <p className="text-sm text-gray-600">Choose the vehicle you'll be driving today</p>
            </div>
            <div className="p-4">
              <Input
                placeholder="Search by registration..."
                value={vehicleSearchTerm}
                onChange={(e) => setVehicleSearchTerm(e.target.value)}
                className="mb-4"
              />
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowOdometerUpdate(true);
                    }}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-[#00A8CC]/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{vehicle.registration}</p>
                        <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model} ({vehicle.year})</p>
                      </div>
                      <Badge variant="outline">{vehicle.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Odometer Update Modal */}
      {showOdometerUpdate && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Update Odometer</h2>
              <p className="text-sm text-gray-600">
                Enter the current odometer reading for {selectedVehicle.registration}
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <Label htmlFor="odometer">Current Odometer Reading (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  placeholder="Enter odometer reading"
                  value={startingOdometer}
                  onChange={(e) => setStartingOdometer(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowOdometerUpdate(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => selectVehicle(selectedVehicle)}
                  className="flex-1 bg-[#00A8CC] hover:bg-[#0097B8]"
                  disabled={!startingOdometer}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof of Delivery Modal */}
      {showPOD && selectedJobForPOD && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center">
              <ArrowLeft 
                className="w-5 h-5 mr-3 cursor-pointer" 
                onClick={() => setShowPOD(false)}
              />
              <h2 className="text-lg font-semibold">Recipient details</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Job Info with Package Icon */}
              <div className="text-center py-4">
                <div className="text-sm text-gray-600 mb-2">
                  {selectedJobForPOD.customerName} <span className="text-[#00A8CC] font-medium">#{selectedJobForPOD.jobNumber}</span>
                </div>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              {/* Recipient Details Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="recipientName" className="text-sm font-medium text-gray-700">
                    Name and surname *
                  </Label>
                  <Input
                    id="recipientName"
                    value={podData.recipientName}
                    onChange={(e) => setPodData(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="Enter recipient name"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recipientMobile" className="text-sm font-medium text-gray-700">
                    Mobile number *
                  </Label>
                  <Input
                    id="recipientMobile"
                    value={podData.recipientMobile}
                    onChange={(e) => setPodData(prev => ({ ...prev, recipientMobile: e.target.value }))}
                    placeholder="Enter mobile number"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="recipientDepartment" className="text-sm font-medium text-gray-700">
                    Department
                  </Label>
                  <Input
                    id="recipientDepartment"
                    value={podData.recipientDepartment}
                    onChange={(e) => setPodData(prev => ({ ...prev, recipientDepartment: e.target.value }))}
                    placeholder="Enter department (optional)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="deliveryNotes" className="text-sm font-medium text-gray-700">
                    Delivery notes
                  </Label>
                  <Textarea
                    id="deliveryNotes"
                    value={podData.deliveryNotes}
                    onChange={(e) => setPodData(prev => ({ ...prev, deliveryNotes: e.target.value }))}
                    placeholder="Any additional notes about the delivery..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>

                {/* Signature Pad */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Recipient signature *
                  </Label>
                  <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                    <canvas
                      ref={canvasRef}
                      width={280}
                      height={150}
                      className="w-full border border-gray-200 bg-white rounded cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">Sign above</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSignature}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 space-y-3">
                <Button
                  onClick={submitPOD}
                  className="w-full bg-[#00A8CC] hover:bg-[#0097B8] h-12"
                  disabled={!podData.recipientName || !podData.recipientMobile || !podData.recipientSignature}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Complete Delivery
                </Button>
                
                {(!podData.recipientName || !podData.recipientMobile || !podData.recipientSignature) && (
                  <p className="text-xs text-gray-500 text-center">
                    Please fill in all required fields and add a signature to complete
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Message Modal */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome Aboard!</h2>
              <p className="text-gray-600 mb-4">{motivationalMessage}</p>
              <p className="text-sm text-gray-500 mb-6">
                You can now complete your vehicle checklist, report any issues, and upload fuel entries.
              </p>
              <Button
                onClick={() => setShowWelcomeMessage(false)}
                className="w-full bg-[#00A8CC] hover:bg-[#0097B8]"
              >
                Let's Get Started!
              </Button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}