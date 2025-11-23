import { useState, useRef, useEffect, useCallback } from "react";

console.log('MoovlyGoInterface component loading...');

// Extend Window interface for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MoovlyGoBirdLogo } from "@/components/ui/moovly-go-bird-logo";
// InteractiveMap will be implemented inline with proper Leaflet integration
import { 
  Package, 
  Scan, 
  Mic, 
  Camera, 
  Plus,
  Play,
  Target,
  Clock,
  BarChart3,
  CheckCircle,
  MapPin,
  Route,
  Zap,
  Map,
  MessageCircle,
  Send,
  Upload,
  X,
  FileImage,
  PenTool,
  Bell,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Battery,
  Settings,
  User,
  Phone,
  Leaf,
  Moon,
  Sun,
  BellOff,
  Circle,
  Layers,
  Coffee,
  LogOut,
  Search,
  VolumeX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Stop {
  id: string;
  packageId: string;
  addressRaw: string;
  addressNorm: string;
  loadIndex: number;
  status: string;
  timeWindow?: string;
  lat?: number;
  lng?: number;
  priority?: number;
  groupId?: string;
  proofPhoto?: string;
  signature?: string;
  customerNotes?: string;
  deliveredAt?: Date;
  customerPhone?: string;
  customerName?: string;
  type?: 'delivery' | 'pickup'; // Circuit-style job type for color coding
}

interface MapJob {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  priority: number;
  status: 'pending' | 'grouped' | 'completed';
  groupId?: string;
}

interface MoovlyGoInterfaceProps {
  driverId: number;
}

export default function MoovlyGoInterface({ driverId }: MoovlyGoInterfaceProps) {
  console.log('MoovlyGoInterface component rendering with driverId:', driverId);
  
  // GPS Location Detection is now properly implemented below
  // GPS Location Detection on Component Mount
  useEffect(() => {
    requestLocationPermission();
  }, []);
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [optimizationMode, setOptimizationMode] = useState("lifo"); // Default to LIFO
  const [isOptimized, setIsOptimized] = useState(false);
  const [optimization, setOptimization] = useState<any>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("route");
  const [mapJobs, setMapJobs] = useState<MapJob[]>([]);
  
  // Real Map State (Circuit-style)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-33.9249, 18.4241]); // Cape Town
  const [mapZoom, setMapZoom] = useState(12);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  
  // Circle Drawing State (Like Circuit's grouping feature)
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);
  const [circleGroups, setCircleGroups] = useState<Array<{
    id: string;
    center: L.LatLng;
    radius: number;
    stops: Stop[];
    groupNumber: number;
    color: string;
  }>>([]);
  const [groupCounter, setGroupCounter] = useState(1);
  const mapRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Circle Drawing Component for job grouping
  function DrawingControl() {
    const map = useMap();
    const [drawingCircle, setDrawingCircle] = useState<L.Circle | null>(null);
    const [startPoint, setStartPoint] = useState<L.LatLng | null>(null);

    useMapEvents({
      mousedown(e) {
        if (!isDrawingCircle) return;
        setStartPoint(e.latlng);
        
        const circle = L.circle(e.latlng, { radius: 0, color: '#3b82f6', fillOpacity: 0.1 });
        circle.addTo(map);
        setDrawingCircle(circle);
      },
      
      mousemove(e) {
        if (!isDrawingCircle || !startPoint || !drawingCircle) return;
        
        const radius = startPoint.distanceTo(e.latlng);
        drawingCircle.setRadius(radius);
      },
      
      mouseup(e) {
        if (!isDrawingCircle || !startPoint || !drawingCircle) return;
        
        const radius = startPoint.distanceTo(e.latlng);
        if (radius > 50) {
          handleCircleCreated(startPoint, radius);
        }
        
        map.removeLayer(drawingCircle);
        setDrawingCircle(null);
        setStartPoint(null);
        setIsDrawingCircle(false);
      }
    });

    return null;
  }
  
  // Handle circle creation for grouping
  const handleCircleCreated = (center: L.LatLng, radius: number) => {
    const stopsInCircle = stops.filter(stop => {
      if (!stop.lat || !stop.lng) return false;
      const stopLatLng = L.latLng(stop.lat, stop.lng);
      return center.distanceTo(stopLatLng) <= radius && stop.status !== 'completed';
    });
    
    if (stopsInCircle.length === 0) return;
    
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];
    const groupColor = colors[circleGroups.length % colors.length];
    
    const newGroup = {
      id: `group-${Date.now()}`,
      center,
      radius,
      stops: stopsInCircle,
      groupNumber: groupCounter,
      color: groupColor
    };
    
    setCircleGroups([...circleGroups, newGroup]);
    setGroupCounter(groupCounter + 1);
    
    addNotification(`Group ${groupCounter} created with ${stopsInCircle.length} stops`, 'success');
  };
  
  // Optimize grouped stops
  const optimizeGroups = () => {
    if (circleGroups.length === 0) return;
    
    let optimizedStops = [...stops];
    let priority = 1;
    
    // First, assign priorities to grouped stops
    circleGroups.forEach(group => {
      group.stops.forEach(groupStop => {
        const stopIndex = optimizedStops.findIndex(s => s.id === groupStop.id);
        if (stopIndex !== -1) {
          optimizedStops[stopIndex] = { ...optimizedStops[stopIndex], priority };
          priority++;
        }
      });
    });
    
    // Then assign priorities to remaining stops
    optimizedStops.forEach((stop, index) => {
      if (!stop.priority) {
        optimizedStops[index] = { ...stop, priority };
        priority++;
      }
    });
    
    // Sort by priority
    optimizedStops.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    setStops(optimizedStops);
    setIsOptimized(true);
    updateRoutePolyline(optimizedStops);
    
    addNotification(`Route optimized with ${circleGroups.length} priority groups`, 'success');
  };
  
  // Create numbered markers like Circuit - Circuit-style color coding
  const createNumberedIcon = (number: number, stop?: Stop, type: 'delivery' | 'pickup' = 'delivery') => {
    // Unified completion check for both 'completed' and 'delivered' status
    const isCompleted = stop ? (stop.status === 'completed' || stop.status === 'delivered') : false;
    const stopType = stop?.type || type;
    
    let color;
    if (isCompleted) {
      color = '#10b981'; // Green for completed
    } else if (stopType === 'delivery') {
      color = '#2563eb'; // Blue for deliveries (Circuit style)
    } else {
      color = '#7c3aed'; // Purple for pickups (Circuit style)
    }
    const textColor = '#ffffff';
    
    return L.divIcon({
      className: 'numbered-marker',
      html: `<div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: ${textColor};
        font-size: 14px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${number}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  };
  
  // Update route polyline
  const updateRoutePolyline = (stopsArray: Stop[]) => {
    if (stopsArray.length > 1) {
      const coords: [number, number][] = stopsArray
        .filter(stop => stop.lat && stop.lng)
        .map(stop => [stop.lat!, stop.lng!]);
      setRoutePolyline(coords);
      
      // Auto-fit map to show all stops
      if (stopsArray.length > 0 && mapRef.current) {
        const validStops = stopsArray.filter(stop => stop.lat && stop.lng);
        if (validStops.length > 0) {
          const bounds = L.latLngBounds(validStops.map(stop => [stop.lat!, stop.lng!]));
          mapRef.current.fitBounds(bounds, { padding: [20, 20] });
        }
      }
    }
  };
  
  // Notification helper
  const addNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toast({
      title: type === 'success' ? '✅ Success' : type === 'error' ? '❌ Error' : 'ℹ️ Info',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default',
    });
  };
  
  // OCR and Camera States
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [showAddressOptions, setShowAddressOptions] = useState(false);
  
  // Search/Autocomplete States
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [businessSuggestions, setBusinessSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showBusinessSuggestions, setShowBusinessSuggestions] = useState(false);

  // GPS Location States
  const [currentGPSLocation, setCurrentGPSLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  
  // Camera States
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Messaging States
  const [showMessaging, setShowMessaging] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // Delivery Features States
  const [showProofCapture, setShowProofCapture] = useState(false);
  const [showSignatureCapture, setShowSignatureCapture] = useState(false);
  const [selectedStopForDelivery, setSelectedStopForDelivery] = useState<Stop | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Signature Canvas Ref
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Offline Storage & Mobile Features
  const [offlineData, setOfflineData] = useState<any[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [showOfflineDialog, setShowOfflineDialog] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);

  // Geocoding service
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number; address: string } | null> => {
    try {
      // First try OpenStreetMap Nominatim (free)
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=za&limit=1&addressdetails=1`
      );
      
      if (osmResponse.ok) {
        const osmData = await osmResponse.json();
        if (osmData.length > 0) {
          const result = osmData[0];
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            address: result.display_name
          };
        }
      }
      
      // Fallback to Google Geocoding (requires API key)
      // For production, you'd implement this with your API key
      console.log('OSM geocoding failed, would use Google as fallback');
      return null;
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  };

  const handleAddStop = async () => {
    if (!currentInput.trim()) return;
    
    // Generate random coordinates around Johannesburg for demo
    const baseLat = -26.2041;
    const baseLng = 28.0473;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
    const randomLng = baseLng + (Math.random() - 0.5) * 0.1;
    
    const newStop: Stop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      packageId: `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      addressRaw: currentInput,
      addressNorm: currentInput,
      loadIndex: stops.length + 1,
      status: "pending",
      lat: randomLat,
      lng: randomLng,
      priority: stops.length + 1,
      type: 'delivery' // Circuit-style default
    };
    
    // Also add to map jobs
    const newMapJob: MapJob = {
      id: newStop.id,
      title: newStop.packageId,
      address: newStop.addressRaw,
      lat: randomLat,
      lng: randomLng,
      priority: stops.length + 1,
      status: 'pending'
    };
    
    setStops([...stops, newStop]);
    setMapJobs([...mapJobs, newMapJob]);
    setCurrentInput("");
    setIsOptimized(false);
  };

  const handleScanBarcode = async () => {
    setIsLoading(true);
    setShowCamera(true);
    
    try {
      // Try to use the camera for real-time scanning
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStream(stream);
        
        // Start barcode detection if available
        if ('BarcodeDetector' in window) {
          startRealtimeBarcodeDetection(stream);
        } else {
          // Show manual capture option
          console.log('BarcodeDetector not available, using manual capture');
        }
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      // Fallback to file input
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      fileInput.capture = 'environment';
      
      fileInput.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          await processBarcodeImage(file);
        }
        setIsLoading(false);
        setShowCamera(false);
      };
      
      fileInput.click();
      setIsLoading(false);
      setShowCamera(false);
    }
  };
  
  const startRealtimeBarcodeDetection = async (stream: MediaStream) => {
    if (!('BarcodeDetector' in window) || !videoRef.current) return;
    
    const barcodeDetector = new (window as any).BarcodeDetector({
      formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8']
    });
    
    const video = videoRef.current;
    
    const detectBarcodes = async () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const barcodes = await barcodeDetector.detect(video);
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            await processDetectedBarcode(barcode.rawValue);
            return;
          }
        } catch (error) {
          console.error('Barcode detection error:', error);
        }
      }
      
      // Continue scanning if no barcode found
      requestAnimationFrame(detectBarcodes);
    };
    
    // Start detection after video loads
    video.addEventListener('loadeddata', () => {
      detectBarcodes();
    });
  };
  
  const processDetectedBarcode = async (barcodeText: string) => {
    try {
      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setShowCamera(false);
      
      // Parse barcode data (could be JSON, simple text, or structured format)
      let packageData: any = {};
      
      try {
        packageData = JSON.parse(barcodeText);
      } catch {
        // If not JSON, treat as package ID or address
        if (barcodeText.includes('|')) {
          const parts = barcodeText.split('|');
          packageData = {
            packageId: parts[0] || `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            address: parts[1] || '',
            customerName: parts[2] || '',
            phone: parts[3] || ''
          };
        } else {
          packageData = {
            packageId: barcodeText || `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`
          };
        }
      }
      
      if (packageData.address) {
        // Auto-add as stop if address is present
        await addStopFromBarcode(packageData);
      } else {
        // Just populate input for manual entry
        setCurrentInput(`${packageData.packageId} - `);
      }
      
      setIsLoading(false);
      addNotification(`Barcode scanned: ${packageData.packageId}`, 'success');
    } catch (error) {
      console.error('Error processing detected barcode:', error);
      setIsLoading(false);
    }
  };
  
  const addStopFromBarcode = async (packageData: any) => {
    // Try to geocode the address
    let lat = -26.2041;
    let lng = 28.0473;
    
    if (packageData.address) {
      try {
        const geocoded = await geocodeAddress(packageData.address);
        if (geocoded) {
          lat = geocoded.lat;
          lng = geocoded.lng;
        }
      } catch (error) {
        console.error('Geocoding failed:', error);
      }
    }
    
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      packageId: packageData.packageId,
      addressRaw: packageData.address || 'Address needed',
      addressNorm: packageData.address || 'Address needed',
      loadIndex: stops.length + 1,
      status: "pending",
      lat,
      lng,
      priority: 1, // LIFO priority
      customerName: packageData.customerName,
      customerPhone: packageData.phone,
      type: 'delivery' // Circuit-style default
    };
    
    const updatedStops = [newStop, ...stops.map(s => ({...s, priority: (s.priority || 0) + 1}))];
    setStops(updatedStops);
    setIsOptimized(false);
  };
  
  const manualBarcodeCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      // Convert to blob and process
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'barcode-capture.jpg', { type: 'image/jpeg' });
          await processBarcodeImage(file);
        }
      }, 'image/jpeg', 0.9);
    }
  };
  
  const processBarcodeImage = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/moovly-go/scan-barcode', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.success && result.barcodeData) {
        // Extract package info from barcode
        const packageId = result.barcodeData.packageId || `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const address = result.barcodeData.address || "Address from barcode data";
        
        // Auto-populate or add as stop
        if (result.barcodeData.address) {
          const newStop: Stop = {
            id: `stop-${Date.now()}`,
            packageId: packageId,
            addressRaw: address,
            addressNorm: address,
            loadIndex: stops.length + 1,
            status: "pending",
            lat: result.barcodeData.lat || -26.2041,
            lng: result.barcodeData.lng || 28.0473,
            priority: 1 // LIFO priority
          };
          
          const updatedStops = [newStop, ...stops.map(s => ({...s, priority: (s.priority || 0) + 1}))];
          setStops(updatedStops);
        } else {
          // Just populate the input with package ID for manual address entry
          setCurrentInput(`${packageId} - `);
        }
      }
    } catch (error) {
      console.error('Barcode processing failed:', error);
    }
  };

  // Proof of Delivery Functions
  const handleTakeProofPhoto = async (stop: Stop) => {
    setSelectedStopForDelivery(stop);
    setShowProofCapture(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStream(stream);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      fileInputRef.current?.click();
    }
  };

  const captureProofPhoto = () => {
    if (!videoRef.current || !canvasRef.current || !selectedStopForDelivery) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      setStops(prev => prev.map(s => 
        s.id === selectedStopForDelivery.id 
          ? { ...s, proofPhoto: photoDataUrl, status: 'delivered', deliveredAt: new Date() }
          : s
      ));
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      
      setShowProofCapture(false);
      setSelectedStopForDelivery(null);
      addNotification('Package delivered with proof photo!', 'success');
    }
  };

  const handleCaptureSignature = (stop: Stop) => {
    setSelectedStopForDelivery(stop);
    setShowSignatureCapture(true);
  };

  const saveSignature = () => {
    if (!signatureCanvasRef.current || !selectedStopForDelivery) return;
    
    const canvas = signatureCanvasRef.current;
    const signatureDataUrl = canvas.toDataURL('image/png');
    
    setStops(prev => prev.map(s => 
      s.id === selectedStopForDelivery.id 
        ? { ...s, signature: signatureDataUrl, status: 'delivered', deliveredAt: new Date() }
        : s
    ));
    
    setShowSignatureCapture(false);
    setSelectedStopForDelivery(null);
    addNotification('Signature captured successfully!', 'success');
  };


  // Navigation Functions
  const navigateToStop = (stop: Stop) => {
    const { lat, lng, addressRaw } = stop;
    
    // Create Google Maps URL
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    
    // Create Waze URL
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    
    // Show navigation options
    showNavigationOptions(googleMapsUrl, wazeUrl, addressRaw);
  };
  
  const showNavigationOptions = (googleUrl: string, wazeUrl: string, address: string) => {
    const options = [
      { name: 'Google Maps', url: googleUrl, icon: '🗺️' },
      { name: 'Waze', url: wazeUrl, icon: '🚗' },
      { name: 'Apple Maps', url: `http://maps.apple.com/?daddr=${encodeURIComponent(address)}`, icon: '🍎' }
    ];
    
    // Create modal for navigation options
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end';
    modal.innerHTML = `
      <div class="bg-white rounded-t-xl w-full p-4 space-y-3">
        <div class="text-center">
          <h3 class="font-semibold text-lg">Navigate with:</h3>
          <p class="text-sm text-gray-600">${address}</p>
        </div>
        ${options.map(opt => `
          <button 
            class="w-full p-4 bg-gray-50 rounded-lg flex items-center space-x-3 hover:bg-gray-100"
            onclick="window.open('${opt.url}', '_blank'); this.closest('.fixed').remove();"
          >
            <span class="text-2xl">${opt.icon}</span>
            <span class="font-medium">${opt.name}</span>
          </button>
        `).join('')}
        <button 
          class="w-full p-3 bg-gray-200 rounded-lg text-gray-700"
          onclick="this.closest('.fixed').remove();"
        >
          Cancel
        </button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Remove modal when clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  };

  // Analytics and Performance Tracking
  const [analytics, setAnalytics] = useState({
    totalKmSaved: 0,
    timeSaved: 0,
    stopsCompleted: 0,
    earnings: 0,
    efficiency: 0
  });
  
  const calculateAnalytics = () => {
    const completed = stops.filter(s => s.status === 'delivered').length;
    const total = stops.length;
    
    if (total === 0) return;
    
    // Estimate time and distance savings with optimization
    const estimatedKmSaved = isOptimized ? total * 2.5 : 0; // Average 2.5km saved per stop with optimization
    const estimatedTimeSaved = isOptimized ? total * 8 : 0; // Average 8 minutes saved per stop
    const estimatedEarnings = completed * 15; // R15 per completed delivery
    const efficiency = total > 0 ? (completed / total) * 100 : 0;
    
    setAnalytics({
      totalKmSaved: estimatedKmSaved,
      timeSaved: estimatedTimeSaved,
      stopsCompleted: completed,
      earnings: estimatedEarnings,
      efficiency
    });
  };
  
  // Update analytics when stops change
  useEffect(() => {
    calculateAnalytics();
  }, [stops, isOptimized]);

  // Excel Import Functionality
  const handleExcelImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        processExcelFile(file);
      }
    };
    input.click();
  };
  
  const processExcelFile = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Import xlsx library dynamically
      const xlsx = await import('xlsx');
      
      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(worksheet);
      
      // Process each row
      const newStops: Stop[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        
        // Map common column names
        const address = row.address || row.Address || row.ADDRESSES || row.delivery_address || '';
        const packageId = row.package_id || row.Package || row.ID || row.reference || `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        const customerName = row.customer_name || row.Customer || row.Name || '';
        const phone = row.phone || row.Phone || row.contact || '';
        
        if (address) {
          // Try to geocode
          let lat = -26.2041 + (Math.random() - 0.5) * 0.1;
          let lng = 28.0473 + (Math.random() - 0.5) * 0.1;
          
          try {
            const geocoded = await geocodeAddress(address);
            if (geocoded) {
              lat = geocoded.lat;
              lng = geocoded.lng;
            }
          } catch (error) {
            console.error('Geocoding failed for:', address);
          }
          
          const newStop: Stop = {
            id: `stop-${Date.now()}-${i}`,
            packageId,
            addressRaw: address,
            addressNorm: address,
            loadIndex: stops.length + newStops.length + 1,
            status: "pending",
            lat,
            lng,
            priority: newStops.length + 1,
            customerName,
            customerPhone: phone,
            type: 'delivery' // Circuit-style default
          };
          
          newStops.push(newStop);
        }
      }
      
      // Add all stops
      setStops(prev => [...prev, ...newStops]);
      setIsOptimized(false);
      
      addNotification(`Imported ${newStops.length} stops from Excel`, 'success');
      setIsLoading(false);
    } catch (error) {
      console.error('Excel import failed:', error);
      addNotification('Excel import failed. Please check file format.', 'error');
      setIsLoading(false);
    }
  };

  // Address Book Management
  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [showAddressBook, setShowAddressBook] = useState(false);
  
  // Manual GPS detection state
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const saveAddress = (address: string) => {
    if (!savedAddresses.includes(address)) {
      const updated = [...savedAddresses, address];
      setSavedAddresses(updated);
      localStorage.setItem('moovly_saved_addresses', JSON.stringify(updated));
      addNotification('Address saved to address book', 'success');
    }
  };
  
  const loadSavedAddresses = () => {
    try {
      const saved = localStorage.getItem('moovly_saved_addresses');
      if (saved) {
        setSavedAddresses(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
    }
  };
  
  // Load saved addresses on component mount
  useEffect(() => {
    loadSavedAddresses();
  }, []);

  // Settings and Preferences
  const [settings, setSettings] = useState({
    darkMode: false,
    language: 'en',
    notifications: true,
    autoOptimize: false
  });
  
  const [showSettings, setShowSettings] = useState(false);
  
  const updateSettings = (newSettings: Partial<typeof settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('moovly_settings', JSON.stringify(updated));
    
    // Apply dark mode
    if (updated.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  
  // Load settings on component mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('moovly_settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        setSettings(parsedSettings);
        if (parsedSettings.darkMode) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Multi-language Support
  const translations = {
    en: {
      scanBarcode: 'Scan',
      voiceInput: 'Voice',
      ocrScan: 'OCR',
      addStop: 'Add Stop',
      optimize: 'Optimize',
      navigate: 'Navigate',
      delivered: 'Delivered',
      pending: 'Pending',
      photo: 'Photo',
      signature: 'Sign',
      message: 'Message',
      settings: 'Settings',
      addressBook: 'Address Book',
      analytics: 'Analytics',
      import: 'Import Excel'
    },
    af: {
      scanBarcode: 'Skandeer',
      voiceInput: 'Stem',
      ocrScan: 'OCR',
      addStop: 'Voeg Stop',
      optimize: 'Optimeer',
      navigate: 'Navigeer',
      delivered: 'Afgelewer',
      pending: 'Hangend',
      photo: 'Foto',
      signature: 'Teken',
      message: 'Boodskap',
      settings: 'Instellings',
      addressBook: 'Adresboek',
      analytics: 'Analise',
      import: 'Invoer Excel'
    },
    zu: {
      scanBarcode: 'Skena',
      voiceInput: 'Izwi',
      ocrScan: 'OCR',
      addStop: 'Engeza',
      optimize: 'Lungisa',
      navigate: 'Hamba',
      delivered: 'Kufinyeziwe',
      pending: 'Kulindile',
      photo: 'Isithombe',
      signature: 'Sayina',
      message: 'Umlayezo',
      settings: 'Izilungiselelo',
      addressBook: 'Incwadi Yamakheli',
      analytics: 'Ukuhlaziya',
      import: 'Ngenisa Excel'
    },
    xh: {
      scanBarcode: 'Skena',
      voiceInput: 'Ilizwi',
      ocrScan: 'OCR',
      addStop: 'Yongeza',
      optimize: 'Lungisa',
      navigate: 'Hamba',
      delivered: 'Kuthunyelwe',
      pending: 'Kulindile',
      photo: 'Ifoto',
      signature: 'Sayina',
      message: 'Umyalezo',
      settings: 'Iisetingi',
      addressBook: 'Incwadi Yedilesi',
      analytics: 'Uhlalutyo',
      import: 'Ngenisa Excel'
    }
  };
  
  const t = (key: keyof typeof translations.en) => {
    return translations[settings.language as keyof typeof translations]?.[key] || translations.en[key];
  };

  // Mobile & Offline Features
  useEffect(() => {
    // Network status monitoring
    const handleOnline = () => {
      setIsOnline(true);
      addNotification('Connection restored! Syncing data...', 'success');
      syncOfflineData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineDialog(true);
      addNotification('You are offline. Changes will sync when connection is restored.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced offline data synchronization - like Moovly Connect
  const syncOfflineData = useCallback(async () => {
    if (offlineData.length === 0) return;
    
    try {
      // Sync offline changes when online
      for (const data of offlineData) {
        if (data.type === 'stop_update') {
          // Sync stop updates
          await fetch('/api/moovly-go/stops', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data.payload)
          });
        }
      }
      
      setOfflineData([]);
      setLastSyncTime(new Date());
      addNotification('All offline data synced successfully!', 'success');
    } catch (error) {
      console.error('Sync failed:', error);
      addNotification('Sync failed. Will retry when connection improves.', 'error');
    }
  }, [offlineData]);

  // Store data for offline sync
  const storeOfflineData = (type: string, payload: any) => {
    const offlineEntry = {
      id: Date.now(),
      type,
      payload,
      timestamp: new Date()
    };
    setOfflineData(prev => [...prev, offlineEntry]);
  };

  // Enhanced stop update with offline support
  const updateStopWithOfflineSupport = (stopId: string, updates: Partial<Stop>) => {
    // Update local state immediately
    setStops(prev => prev.map(s => 
      s.id === stopId ? { ...s, ...updates } : s
    ));
    
    // Store for offline sync if needed
    if (!isOnline) {
      storeOfflineData('stop_update', { stopId, updates });
    } else {
      // Immediate sync when online
      fetch('/api/moovly-go/stops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stopId, updates })
      }).catch(() => {
        // Store for later if immediate sync fails
        storeOfflineData('stop_update', { stopId, updates });
      });
    }
  };

  // Touch gesture handling for swipe actions
  const handleTouchStart = (e: React.TouchEvent, stopId: string) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, stop: Stop) => {
    if (!touchStartPos) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartPos.x;
    const deltaY = Math.abs(touch.clientY - touchStartPos.y);
    
    // Swipe right to take photo
    if (deltaX > 100 && deltaY < 50) {
      handleTakeProofPhoto(stop);
    }
    // Swipe left to mark delivered
    else if (deltaX < -100 && deltaY < 50 && stop.status !== 'delivered') {
      updateStopWithOfflineSupport(stop.id, { 
        status: 'delivered', 
        deliveredAt: new Date() 
      });
      addNotification('Package marked as delivered!', 'success');
    }
    
    setTouchStartPos(null);
  };


  const sendCustomerMessage = async (stop: Stop, message: string) => {
    if (!message.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      stopId: stop.id,
      message,
      sender: 'driver',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMsg]);
    addNotification(`Message sent to ${stop.customerName || 'customer'}`, 'success');
  };

  const handleOptimizeRoute = async () => {
    if (stops.length < 2) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/moovly-go/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stops, mode: optimizationMode })
      });
      
      const result = await response.json();
      if (result.success) {
        setStops(result.optimizedStops);
        setOptimization(result.metrics);
        setIsOptimized(true);
      }
    } catch (error) {
      console.error('Route optimization failed:', error);
    }
    setIsLoading(false);
  };

  // Messaging Functions
  const loadMessages = async () => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/moovly-go/messages?driverId=${driverId}`);
      const result = await response.json();
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
    setIsLoadingMessages(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const response = await fetch('/api/moovly-go/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId,
          message: newMessage,
          timestamp: new Date().toISOString()
        })
      });
      
      const result = await response.json();
      if (result.success) {
        setNewMessage("");
        loadMessages(); // Refresh messages
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // GPS Location Detection Functions
  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported by this browser');
      setLocationPermission('denied');
      return;
    }

    try {
      setIsDetectingLocation(true);
      
      // Request location with timeout and high accuracy for mobile
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setCurrentGPSLocation(coords);
          setLocationPermission('granted');
          setIsDetectingLocation(false);
          
          console.log(`📍 GPS Location detected: ${coords.lat}, ${coords.lng}`);
          console.log('🎯 Address search will now show results near your location');
        },
        (error) => {
          setIsDetectingLocation(false);
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationPermission('denied');
              console.log('📍 Location access denied - using Johannesburg default');
              break;
            case error.POSITION_UNAVAILABLE:
              console.log('📍 Location unavailable - using Johannesburg default');
              break;
            case error.TIMEOUT:
              console.log('📍 Location timeout - using Johannesburg default');
              break;
            default:
              console.log('📍 Location error - using Johannesburg default');
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    } catch (error) {
      setIsDetectingLocation(false);
      setLocationPermission('denied');
      console.log('📍 Location detection failed - using Johannesburg default');
    }
  };

  const retryLocationDetection = () => {
    if (locationPermission === 'denied') {
      alert('📍 Location permission was denied. Please enable location access in your browser settings and refresh the page for better address suggestions.');
      return;
    }
    requestLocationPermission();
  };

  // Navigation Functions
  const handleNavigateToStop = (stop: Stop) => {
    if (!stop.lat || !stop.lng) {
      alert('⚠️ Location coordinates not available for this stop. Please ensure the address is properly geocoded.');
      return;
    }

    // Open Google Maps navigation with proper coordinates
    const destination = `${stop.lat},${stop.lng}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    
    console.log(`🗺️ Opening navigation to: ${stop.addressNorm || stop.addressRaw}`);
    console.log(`📍 Coordinates: ${stop.lat}, ${stop.lng}`);
    
    // Try to open in Google Maps app first (mobile), fall back to web
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // Mobile device - try to open Google Maps app
      const googleMapsAppUrl = `google.navigation:q=${destination}&mode=d`;
      
      // Create a temporary link to try app, with fallback to web
      const link = document.createElement('a');
      link.href = googleMapsAppUrl;
      
      // Set up fallback to web version after short delay
      setTimeout(() => {
        window.open(googleMapsUrl, '_blank');
      }, 1000);
      
      // Try to open app first
      link.click();
    } else {
      // Desktop - open Google Maps web version
      window.open(googleMapsUrl, '_blank');
    }

    // Add navigation analytics
    const now = new Date();
    setNotifications(prev => [...prev, {
      id: Date.now(),
      type: 'info' as const,
      message: `🗺️ Navigation started to ${stop.packageId}`,
      timestamp: now
    }]);

    // Remove notification after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.timestamp !== now));
    }, 3000);
  };

  const handleStartNavigation = () => {
    if (stops.length === 0) {
      alert('⚠️ No stops in your route. Please add stops first.');
      return;
    }

    const firstStop = stops[0];
    if (!firstStop.lat || !firstStop.lng) {
      alert('⚠️ First stop coordinates not available. Please ensure all addresses are properly geocoded.');
      return;
    }

    handleNavigateToStop(firstStop);
  };

  // Smart query detection - determine if search looks like business name vs address
  const isBusinessQuery = (query: string): boolean => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Business indicators: no numbers at start, common business words
    const businessIndicators = [
      'restaurant', 'cafe', 'shop', 'store', 'mall', 'centre', 'center', 
      'hotel', 'lodge', 'bank', 'pharmacy', 'clinic', 'hospital',
      'school', 'university', 'church', 'gym', 'salon', 'bar', 'pub',
      'office', 'company', 'ltd', 'pty', 'pizza', 'burger', 'coffee'
    ];
    
    // Address indicators: starts with number, contains address words
    const addressIndicators = ['street', 'road', 'avenue', 'drive', 'lane', 'close', 'way', 'place'];
    
    // If starts with number, likely an address
    if (/^\d+/.test(lowerQuery)) {
      return false;
    }
    
    // Check for business name patterns (brand names without numbers)
    if (businessIndicators.some(indicator => lowerQuery.includes(indicator))) {
      return true;
    }
    
    // Check for address patterns
    if (addressIndicators.some(indicator => lowerQuery.includes(indicator))) {
      return false;
    }
    
    // Single word/brand names are likely businesses (like "bootlegger", "mcdonalds")
    const wordCount = lowerQuery.split(/\s+/).length;
    if (wordCount <= 2 && !/\d/.test(lowerQuery)) {
      return true;
    }
    
    return false; // Default to address search for safety
  };

  // Address autocomplete search with dual-strategy like Circuit
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      setBusinessSuggestions([]);
      setShowBusinessSuggestions(false);
      return;
    }

    try {
      let addressMatches: string[] = [];
      let businessMatches: string[] = [];
      
      const isBusiness = isBusinessQuery(query);
      console.log(`🔍 Search strategy for "${query}": ${isBusiness ? 'BUSINESS' : 'ADDRESS'}`);
      
      try {
        // Dual API strategy based on query type
        if (isBusiness) {
          // Use Discover API for business searches (like Circuit)
          let discoverUrl = `/api/here/discover?q=${encodeURIComponent(query)}&limit=10`;
          if (currentGPSLocation) {
            discoverUrl += `&lat=${currentGPSLocation.lat}&lng=${currentGPSLocation.lng}`;
          }
          
          console.log(`🏢 Using HERE Discover API for business search`);
          const discoverResponse = await fetch(discoverUrl);
          
          if (discoverResponse.ok) {
            const discoverResult = await discoverResponse.json();
            if (discoverResult.success && discoverResult.data.items) {
              console.log(`🎯 Discover API found ${discoverResult.data.items.length} results`);
              for (const item of discoverResult.data.items) {
                const title = item.title || item.address?.label;
                if (title) {
                  businessMatches.push(title + (item.address?.label ? `, ${item.address.label}` : ''));
                }
              }
            }
          }
          
          // Also try autosuggest as backup for business searches
          let autosuggestUrl = `/api/here/autosuggest?q=${encodeURIComponent(query)}&limit=5`;
          if (currentGPSLocation) {
            autosuggestUrl += `&lat=${currentGPSLocation.lat}&lng=${currentGPSLocation.lng}`;
          }
          
          const autosuggestResponse = await fetch(autosuggestUrl);
          if (autosuggestResponse.ok) {
            const autosuggestResult = await autosuggestResponse.json();
            if (autosuggestResult.success && autosuggestResult.data.items) {
              for (const item of autosuggestResult.data.items) {
                if (item.resultType === 'place' || item.resultType === 'chain') {
                  const label = item.address?.label || item.title;
                  if (label && !businessMatches.includes(label)) {
                    businessMatches.push(label);
                  }
                }
              }
            }
          }
        } else {
          // Use Autosuggest API for address searches
          let autosuggestUrl = `/api/here/autosuggest?q=${encodeURIComponent(query)}&limit=8`;
          if (currentGPSLocation) {
            autosuggestUrl += `&lat=${currentGPSLocation.lat}&lng=${currentGPSLocation.lng}`;
          }
          
          console.log(`🏠 Using HERE Autosuggest API for address search`);
          const autosuggestResponse = await fetch(autosuggestUrl);
          
          if (autosuggestResponse.ok) {
            const autosuggestResult = await autosuggestResponse.json();
            if (autosuggestResult.success && autosuggestResult.data.items) {
              console.log(`📍 Autosuggest API found ${autosuggestResult.data.items.length} results`);
              for (const item of autosuggestResult.data.items) {
                const label = item.address?.label || item.title;
                if (item.resultType === 'place' || item.resultType === 'chain') {
                  businessMatches.push(label);
                } else {
                  addressMatches.push(label);
                }
              }
            }
          }
        }
        
        console.log(`📊 Final results: ${businessMatches.length} businesses, ${addressMatches.length} addresses`);
      } catch (apiError) {
        console.log('API search failed, using fallback suggestions');
      }
      
      // Fallback to basic suggestions if HERE fails
      if (addressMatches.length === 0 && businessMatches.length === 0) {
        addressMatches = [
          `${query}, Johannesburg, 2001`,
          `${query}, Cape Town, 8001`,
          `${query}, Durban, 4001`,
          `${query}, Pretoria, 0001`,
          `${query}, Port Elizabeth, 6001`
        ].filter((_, index) => index < 5);

        businessMatches = [
          `${query} Restaurant`,
          `${query} Shopping Centre`,
          `${query} Hospital`,
          `${query} School`,
          `${query} Office Park`
        ].filter((_, index) => index < 5);
      }

      setAddressSuggestions(addressMatches);
      setBusinessSuggestions(businessMatches);
      setShowAddressSuggestions(addressMatches.length > 0);
      setShowBusinessSuggestions(businessMatches.length > 0);
    } catch (error) {
      console.error('Address search failed:', error);
    }
  };

  // GPS Location Detection
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('GPS location is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentGPSLocation({ lat: latitude, lng: longitude });
        
        try {
          // Reverse geocode to get address using HERE API
          const response = await fetch(
            `/api/here/reverse-geocode?lat=${latitude}&lng=${longitude}`
          );
          const result = await response.json();
          
          if (result.success && result.address) {
            setCurrentInput(result.address);
            console.log('GPS location detected:', result.address);
          } else {
            setCurrentInput(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setCurrentInput(`GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('GPS error:', error);
        let message = 'Unable to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access denied. Please allow location access and try again.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location information unavailable.';
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out.';
        }
        alert(message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Please use Chrome, Safari, or Edge.');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true; // Show interim results for better UX
      recognition.lang = 'en-ZA'; // South African English for better local recognition
      
      recognition.onstart = () => {
        setIsListening(true);
        setCurrentInput('🎤 Listening...');
        console.log('Voice recognition started. Speak your address now...');
      };
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        
        // Get the most recent result
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript = event.results[i][0].transcript;
          } else {
            // Show interim results
            setCurrentInput(`🎤 ${event.results[i][0].transcript}...`);
          }
        }
        
        if (transcript) {
          setCurrentInput(transcript);
          setIsListening(false);
          
          // Auto-trigger address search for the spoken text
          handleAddressSearch(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        setIsListening(false);
        console.error('Speech recognition error:', event.error);
        
        switch (event.error) {
          case 'no-speech':
            alert('No speech detected. Please try again.');
            break;
          case 'network':
            alert('Network error. Please check your connection.');
            break;
          case 'not-allowed':
            alert('Microphone access denied. Please allow microphone access and try again.');
            break;
          default:
            alert('Voice recognition error. Please try again.');
        }
        setCurrentInput('');
      };
      
      recognition.onend = () => {
        setIsListening(false);
        if (currentInput.includes('Listening')) {
          setCurrentInput('');
        }
      };

      recognition.start();
    } catch (error) {
      setIsListening(false);
      alert('Voice input failed. Please try again.');
      setCurrentInput('');
    }
  };

  const handleCameraOCR = async () => {
    // OCR is specifically for reading text from images (addresses, labels)
    handleQuickScan();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingOCR(true);
    try {
      // Step 1: Process image with cost-aware OCR service
      const { ocrService } = await import('@/services/ocrService');
      const ocrResult = await ocrService.processImage(file);
      
      if (ocrResult.needsCorrection) {
        // Show correction prompt for low confidence OCR
        setCurrentInput(ocrResult.extractedText);
        alert(`OCR confidence low (${(ocrResult.confidence * 100).toFixed(1)}%). Please verify the address.`);
        setIsProcessingOCR(false);
        return;
      }
      
      // Step 2: Process addresses with cost-aware geocoding
      const { geocodingService } = await import('@/services/geocodingService');
      const processedAddresses = await ocrService.processOCRResult(ocrResult);
      
      for (const processed of processedAddresses) {
        if (processed.geocoded) {
          const newStop: Stop = {
            id: `stop-${Date.now()}`,
            packageId: `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            addressRaw: processed.original,
            addressNorm: processed.geocoded.formatted_address,
            loadIndex: stops.length + 1,
            status: "pending",
            lat: processed.geocoded.lat,
            lng: processed.geocoded.lng,
            priority: 1, // LIFO: newest packages get highest priority
            type: 'delivery' // Circuit-style default
          };
          
          // Add to beginning for LIFO (Last In, First Out)
          const updatedStops = [newStop, ...stops.map(s => ({...s, priority: (s.priority || 0) + 1}))];
          setStops(updatedStops);
          
          // Show geocoding stats
          const stats = geocodingService.getCacheStats();
          console.log(`Cost-saving stats: Cache hit rate ${stats.hitRate}%, ${stats.cacheSize} cached addresses`);
        }
      }
      
      setCurrentInput("");
    } catch (error) {
      console.error('OCR processing failed:', error);
    }
    setIsProcessingOCR(false);
    setShowCamera(false);
  };

  // Real camera functionality
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera for better OCR
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera access failed:', error);
      alert('Camera access denied. Using file upload instead.');
      fileInputRef.current?.click();
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert canvas to blob for OCR processing
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      
      // Stop camera
      stopCamera();
      
      // Process with OCR
      setIsProcessingOCR(true);
      try {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        const { ocrService } = await import('@/services/ocrService');
        const ocrResult = await ocrService.processImage(file);
        
        if (ocrResult.needsCorrection) {
          setCurrentInput(ocrResult.extractedText);
          alert(`OCR confidence low (${(ocrResult.confidence * 100).toFixed(1)}%). Please verify the address.`);
        } else {
          const processedAddresses = await ocrService.processOCRResult(ocrResult);
          
          for (const processed of processedAddresses) {
            if (processed.geocoded) {
              const newStop: Stop = {
                id: `stop-${Date.now()}`,
                packageId: `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                addressRaw: processed.original,
                addressNorm: processed.geocoded.formatted_address,
                loadIndex: stops.length + 1,
                status: 'pending',
                lat: processed.geocoded.lat,
                lng: processed.geocoded.lng,
                priority: 1
              };
              
              const updatedStops = [newStop, ...stops.map(s => ({...s, priority: (s.priority || 0) + 1}))];
              setStops(updatedStops);
            }
          }
          setCurrentInput('');
        }
      } catch (error) {
        console.error('OCR processing failed:', error);
        alert('Failed to process image. Please try again.');
      }
      setIsProcessingOCR(false);
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleQuickScan = () => {
    // Use real camera instead of file input for mobile
    if ('getUserMedia' in navigator.mediaDevices) {
      startCamera();
    } else {
      // Fallback to file input for older browsers
      fileInputRef.current?.click();
    }
  };

  const handleMapJobsUpdate = (updatedJobs: MapJob[]) => {
    setMapJobs(updatedJobs);
    // Sync with stops
    const updatedStops = stops.map(stop => {
      const mapJob = updatedJobs.find(job => job.id === stop.id);
      if (mapJob) {
        return {
          ...stop,
          status: mapJob.status === 'pending' ? 'pending' : mapJob.status === 'grouped' ? 'grouped' : 'completed',
          priority: mapJob.priority,
          groupId: mapJob.groupId
        };
      }
      return stop;
    });
    setStops(updatedStops);
  };

  // Break mode toggle
  const toggleBreakMode = () => {
    setIsOnBreak(!isOnBreak);
    addNotification(isOnBreak ? 'Break ended - back to work!' : 'Break started - take your time!', 'info');
  };

  // Logout handler
  const handleLogout = () => {
    // Clear any stored data and redirect to mobile login
    localStorage.removeItem('mobileDriver');
    localStorage.removeItem('authenticated');
    window.location.href = '/mobile';
  };

  const handleOptimizeGroup = async (groupedJobs: MapJob[], remainingJobs: MapJob[]) => {
    setIsLoading(true);
    try {
      // In a real app, this would call the optimization API
      const optimizedRemaining = remainingJobs.map((job, index) => ({
        ...job,
        priority: groupedJobs.length + index + 1
      }));
      
      const allJobs = [...groupedJobs, ...optimizedRemaining];
      setMapJobs(allJobs);
      
      // Update stops accordingly
      const updatedStops = stops.map(stop => {
        const job = allJobs.find(j => j.id === stop.id);
        if (job) {
          return { ...stop, priority: job.priority, groupId: job.groupId };
        }
        return stop;
      });
      
      setStops(updatedStops);
      setIsOptimized(true);
    } catch (error) {
      console.error('Group optimization failed:', error);
    }
    setIsLoading(false);
  };

    console.log('About to return JSX, driverId:', driverId, 'activeTab:', activeTab);
    
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header with Moovly Go Branding */}
      <div className="bg-[#424242] text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-1">
                <h1 className="font-bold text-lg text-white">moovly</h1>
                <span className="font-bold text-lg text-white">go</span>
              </div>
              <div className="w-16 h-1 bg-secondary rounded-full mt-1"></div>
              <p className="text-gray-300 text-sm font-medium mt-1">Load. Plan. Deliver.</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10 p-2" 
              title={t('settings')}
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10 p-2" 
              title="Analytics"
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`${isOnBreak ? 'text-orange-400 bg-white/10' : 'text-white'} hover:bg-white/10 p-2`}
              title={isOnBreak ? "End Break" : "Start Break"}
              onClick={toggleBreakMode}
            >
              <Coffee className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10 p-2" 
              title="Log Out"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mx-4 my-2">
          <TabsTrigger value="route" className="text-xs">Route Builder</TabsTrigger>
          <TabsTrigger value="map" className="text-xs">Interactive Map</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">{t('analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="route" className="mt-0">
          {/* Quick Input Section */}
          <div className="p-4 border-b bg-sky-50/50">
        <h2 className="font-semibold text-slate-900 mb-3 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Packages
        </h2>
        
        {/* Input Methods */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <Button
            size="sm"
            onClick={handleScanBarcode}
            disabled={isLoading}
            className="flex flex-col items-center p-2 h-auto bg-secondary hover:bg-ring text-white border-secondary"
          >
            <Scan className="w-4 h-4 mb-1" />
            <span className="text-xs">{t('scanBarcode')}</span>
          </Button>
          
          <Button
            size="sm"
            onClick={handleCameraOCR}
            disabled={isLoading}
            variant="outline"
            className="flex flex-col items-center p-2 h-auto"
          >
            <Camera className="w-4 h-4 mb-1" />
            <span className="text-xs">{t('ocrScan')}</span>
          </Button>
          
          <Button
            size="sm"
            onClick={handleVoiceInput}
            disabled={isLoading}
            variant="outline"
            className="flex flex-col items-center p-2 h-auto"
          >
            <Mic className="w-4 h-4 mb-1" />
            <span className="text-xs">{t('voiceInput')}</span>
          </Button>
          
        </div>

        {/* Additional Actions - Remove manual GPS button */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            size="sm"
            onClick={handleExcelImport}
            disabled={isLoading}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-2"
          >
            <Upload className="w-4 h-4" />
            <span className="text-xs">{t('import')}</span>
          </Button>
          
          <Button
            size="sm"
            onClick={() => setShowAddressBook(true)}
            variant="outline"
            className="flex items-center justify-center space-x-2 p-2"
          >
            <MapPin className="w-4 h-4" />
            <span className="text-xs">{t('addressBook')}</span>
          </Button>
        </div>

        {/* GPS Location Status Indicator */}
        {isDetectingLocation && (
          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-700">📍 Detecting your location for better suggestions...</span>
          </div>
        )}
        
        {currentGPSLocation && (
          <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
            <span className="text-sm text-green-700">📍 Using your location for address suggestions</span>
            <button 
              onClick={retryLocationDetection}
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              refresh
            </button>
          </div>
        )}
        
        {locationPermission === 'denied' && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
            <span className="text-sm text-yellow-700">⚠️ Location access denied - showing Johannesburg area results</span>
            <button 
              onClick={retryLocationDetection}
              className="text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              enable
            </button>
          </div>
        )}

        {/* Turquoise Address Entry Section - Single Clean Bar */}
        <div className="relative mb-6">
          <div className="flex items-center space-x-3 bg-white border-2 border-[#00A8CC] rounded-full p-4 shadow-lg">
            <Search className="w-5 h-5 text-[#00A8CC]" />
            <Input
              value={currentInput}
              onChange={(e) => {
                setCurrentInput(e.target.value);
                handleAddressSearch(e.target.value);
              }}
              placeholder="Tap to add more stops..."
              className="flex-1 border-none bg-transparent placeholder-gray-400 text-gray-800 focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && handleAddStop()}
            />
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleVoiceInput}
                disabled={isListening}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-[#00A8CC]/10 rounded-full"
              >
                {isListening ? 
                  <VolumeX className="w-5 h-5 text-[#00A8CC]" /> : 
                  <Mic className="w-5 h-5 text-[#00A8CC]" />
                }
              </Button>
              <Button
                onClick={handleScanBarcode}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="p-2 hover:bg-[#00A8CC]/10 rounded-full"
              >
                <Scan className="w-5 h-5 text-[#00A8CC]" />
              </Button>
            </div>
          </div>

          {/* Address Suggestions Dropdown - Turquoise Theme */}
          {showAddressSuggestions && addressSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-[#00A8CC] rounded-xl shadow-xl mt-3 max-h-48 overflow-y-auto">
              <div className="p-3 text-sm font-semibold text-[#00A8CC] border-b border-[#00A8CC]/20">📍 Address Suggestions</div>
              {addressSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentInput(suggestion);
                    setShowAddressSuggestions(false);
                    setShowBusinessSuggestions(false);
                  }}
                  className="w-full text-left p-4 border-b border-gray-100 hover:bg-[#00A8CC]/10 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-sm text-gray-900">
                    📍 {suggestion}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Business Suggestions Dropdown - Turquoise Theme */}
          {showBusinessSuggestions && businessSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-40 bg-white border-2 border-[#00A8CC] rounded-xl shadow-xl mt-2 max-h-40 overflow-y-auto">
              <div className="p-3 text-sm font-semibold text-[#00A8CC] border-b border-[#00A8CC]/20">🏢 Business Suggestions</div>
              {businessSuggestions.slice(0, 5).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentInput(suggestion);
                    setShowBusinessSuggestions(false);
                    setShowAddressSuggestions(false);
                  }}
                  className="w-full text-left p-4 border-b border-gray-100 hover:bg-[#00A8CC]/10 last:border-b-0 transition-colors"
                >
                  🏢 {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Address Options */}
          {showAddressOptions && (
            <div className="bg-white border rounded-lg p-2 shadow-lg space-y-1">
              <div className="text-xs font-medium text-gray-600 mb-2">Quick Add Options:</div>
              {[
                "123 Main Street, Sandton",
                "456 Oak Avenue, Rosebank", 
                "789 Pine Road, Fourways",
                "321 Elm Street, Randburg",
                "555 Commerce Drive, Midrand"
              ].map((address, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setCurrentInput(address);
                    setShowAddressOptions(false);
                  }}
                  className="w-full text-left justify-start h-8 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700"
                  variant="ghost"
                >
                  <MapPin className="w-3 h-3 mr-2" />
                  {address}
                </Button>
              ))}
            </div>
          )}
          
        </div>
        </TabsContent>

        <TabsContent value="map" className="mt-0">
          <div className="bg-white rounded-lg border">
            {/* Interactive Map with Real Stop Locations */}
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Map className="w-4 h-4 mr-2 text-[#00A8CC]" />
                Interactive Map - Route Overview
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {stops.length} stops • Tap a marker to see details or navigate
              </p>
            </div>
            
            <div className="relative">
              {/* Map Container - Height matches mobile viewport */}
              <div 
                className="w-full h-96 bg-gray-100 relative overflow-hidden rounded-b-lg"
                style={{ 
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cg fill=\'%23f0f0f0\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z\'/%3E%3C/g%3E%3C/svg%3E")',
                  backgroundSize: '40px 40px'
                }}
              >
                {/* Map stops visualization */}
                {stops.length > 0 ? (
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4">
                    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm w-full">
                      <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-[#00A8CC] rounded-full flex items-center justify-center mx-auto mb-2">
                          <Map className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Route Overview</h3>
                        <p className="text-sm text-gray-600">{stops.length} stops planned</p>
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stops.slice(0, 5).map((stop, index) => {
                          // Circuit-style color coding: Blue for deliveries, Purple for pickups
                          let bgColor;
                          const isCompleted = stop.status === 'completed' || stop.status === 'delivered';
                          if (isCompleted) {
                            bgColor = 'bg-green-600';
                          } else if (stop.type === 'pickup') {
                            bgColor = 'bg-purple-600'; // Purple for pickups
                          } else {
                            bgColor = 'bg-blue-600'; // Blue for deliveries (default)
                          }
                          
                          return (
                          <div key={stop.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${bgColor}`}>
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {stop.addressNorm || stop.addressRaw}
                              </p>
                              <p className="text-xs text-gray-600">Package: {stop.packageId}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleNavigateToStop(stop)}
                              className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Target className="w-3 h-3" />
                            </Button>
                          </div>
                          );
                        })}
                        
                        {stops.length > 5 && (
                          <div className="text-center py-2 text-sm text-gray-500">
                            +{stops.length - 5} more stops
                          </div>
                        )}
                      </div>
                      
                      {stops.length > 0 && (
                        <Button 
                          onClick={handleStartNavigation}
                          className="w-full mt-3 bg-[#00A8CC] hover:bg-[#0891b2] text-white"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start Navigation
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No stops added yet</p>
                      <p className="text-sm text-gray-500 mt-1">Add stops to see them on the map</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0">
          <div className="p-4 space-y-4">
            {/* Performance Overview */}
            <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('analytics')} Dashboard
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="font-bold text-green-600 text-xl">{analytics.totalKmSaved.toFixed(1)}km</div>
                  <div className="text-xs text-gray-600">Distance Saved</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="font-bold text-secondary text-xl">{analytics.timeSaved}min</div>
                  <div className="text-xs text-gray-600">Time Saved</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="font-bold text-orange-600 text-xl">R{analytics.earnings}</div>
                  <div className="text-xs text-gray-600">Earnings</div>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="font-bold text-purple-600 text-xl">{analytics.efficiency.toFixed(0)}%</div>
                  <div className="text-xs text-gray-600">Efficiency</div>
                </div>
              </div>
            </div>

            {/* Route Performance */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                <Route className="w-4 h-4 mr-2" />
                Route Performance
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completed Stops</span>
                  <span className="font-medium">{analytics.stopsCompleted} / {stops.length}</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stops.length > 0 ? (analytics.stopsCompleted / stops.length) * 100 : 0}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Route Optimized</span>
                  <Badge variant={isOptimized ? "default" : "secondary"}>
                    {isOptimized ? "✓ Yes" : "✗ No"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Daily Summary */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Today's Summary
              </h4>
              
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="font-bold text-secondary">{stops.length}</div>
                  <div className="text-blue-500">Total Stops</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="font-bold text-green-600">{analytics.stopsCompleted}</div>
                  <div className="text-green-500">Delivered</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-2">
                  <div className="font-bold text-orange-600">{stops.length - analytics.stopsCompleted}</div>
                  <div className="text-orange-500">Remaining</div>
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3 flex items-center">
                <Leaf className="w-4 h-4 mr-2" />
                Environmental Impact
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">CO₂ Saved</span>
                  <span className="font-medium text-green-800">{(analytics.totalKmSaved * 0.2).toFixed(1)}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Fuel Saved</span>
                  <span className="font-medium text-green-800">{(analytics.totalKmSaved * 0.08).toFixed(1)}L</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Stops List */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 flex items-center">
            <Route className="w-4 h-4 mr-2" />
            Your Route
          </h2>
          {stops.length > 0 && (
            <Badge variant={isOptimized ? "default" : "secondary"}>
              {stops.length} stops
            </Badge>
          )}
        </div>

        {stops.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="w-16 h-16 mx-auto mb-4 bg-sky-100 rounded-full flex items-center justify-center">
              <MoovlyGoBirdLogo size={32} className="text-secondary" />
            </div>
            <p className="text-sm font-medium">No packages loaded yet</p>
            <p className="text-xs mt-1 text-slate-400">Scan or add stops to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {stops.map((stop, index) => (
              <Card 
                key={stop.id} 
                className={`${isOptimized ? 'border-green-200 bg-green-50' : ''} ${
                  stop.status === 'delivered' ? 'opacity-75' : 'cursor-pointer hover:shadow-md transition-shadow'
                } touch-manipulation`}
                onTouchStart={(e) => handleTouchStart(e, stop.id)}
                onTouchEnd={(e) => handleTouchEnd(e, stop)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      stop.status === 'delivered' ? 'bg-green-600 text-white' :
                      isOptimized ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'
                    }`}>
                      {stop.status === 'delivered' ? '✓' : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                            {stop.packageId}
                          </span>
                          {!isOnline && (
                            <Badge variant="secondary" className="text-xs">
                              <WifiOff className="w-3 h-3 mr-1" />
                              Offline
                            </Badge>
                          )}
                        </div>
                        {stop.loadIndex && (
                          <span className="text-xs text-slate-500">
                            Load #{stop.loadIndex}
                          </span>
                        )}
                        
                        {/* Touch gesture hints */}
                        {stop.status !== 'delivered' && (
                          <div className="text-xs text-gray-500 mb-1 flex items-center space-x-3">
                            <span>👈 Swipe left to complete</span>
                            <span>👉 Swipe right for photo</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {stop.addressRaw}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">Delivery</span>
                          {stop.status === 'delivered' && (
                            <Badge variant="default" className="bg-green-600 text-white text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Delivered
                            </Badge>
                          )}
                        </div>
                        
                        {/* Delivery Actions */}
                        {stop.status !== 'delivered' && (
                          <div className="flex flex-wrap gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleNavigateToStop(stop)}
                              className="h-6 px-2 text-xs bg-blue-50 border-blue-200"
                            >
                              <Route className="w-3 h-3 mr-1" />
                              {t('navigate')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTakeProofPhoto(stop)}
                              className="h-6 px-2 text-xs"
                            >
                              <FileImage className="w-3 h-3 mr-1" />
                              {t('photo')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCaptureSignature(stop)}
                              className="h-6 px-2 text-xs"
                            >
                              <PenTool className="w-3 h-3 mr-1" />
                              {t('signature')}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedStopForDelivery(stop);
                                setShowMessaging(true);
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        {/* Delivered Info */}
                        {stop.status === 'delivered' && (
                          <div className="text-right">
                            {stop.deliveredAt && (
                              <div className="text-xs text-green-600">
                                {new Date(stop.deliveredAt).toLocaleTimeString()}
                              </div>
                            )}
                            <div className="flex space-x-1 mt-1">
                              {stop.proofPhoto && (
                                <Badge variant="secondary" className="text-xs">📷 Photo</Badge>
                              )}
                              {stop.signature && (
                                <Badge variant="secondary" className="text-xs">✍️ Signed</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Optimization Section */}
      {stops.length >= 2 && (
        <div className="p-4 border-t bg-sky-50/30">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center">
                <Target className="w-4 h-4 mr-2" />
                Route Optimization
              </h3>
            </div>

            <Select value={optimizationMode} onValueChange={setOptimizationMode}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strictLIFO">Strict LIFO (Last In, First Out)</SelectItem>
                <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                <SelectItem value="fastest">Fastest Route</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleOptimizeRoute}
              disabled={isLoading || stops.length < 2}
              className="w-full bg-secondary hover:bg-ring text-white shadow-md"
              data-tour="optimize-button"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Optimizing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Optimize Route</span>
                </div>
              )}
            </Button>

            {optimization && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Route Optimized!</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <div className="font-bold text-sky-700 text-lg">{optimization.savingsMin}min</div>
                      <div className="text-secondary font-medium">Time Saved</div>
                    </div>
                    <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                      <div className="font-bold text-sky-700 text-lg">{optimization.savingsKm}km</div>
                      <div className="text-secondary font-medium">Distance Saved</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs text-green-600">
                      Efficiency Score: {optimization.efficiencyScore}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {stops.length > 0 && (
        <div className="p-4 border-t">
          <div className="space-y-2">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-base py-3">
              <Play className="w-5 h-5 mr-2" />
              Start Navigation
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-1" />
                Schedule
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-1" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Constant Tap to Add More Stops Section */}
      <div className="fixed bottom-20 left-4 right-4 z-30">
        <div className="bg-white border border-gray-200 rounded-full shadow-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600" />
            </div>
            <Input
              placeholder="Tap to add more stops..."
              value={currentInput}
              onChange={(e) => {
                setCurrentInput(e.target.value);
                handleAddressSearch(e.target.value);
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAddStop()}
              className="border-0 bg-transparent text-gray-700 placeholder-gray-500 focus:ring-0 flex-1"
            />
            <Button
              onClick={handleAddStop}
              disabled={!currentInput.trim()}
              size="sm"
              className="bg-secondary hover:bg-ring text-white rounded-full p-2"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Three dots menu indicator */}
          <div className="absolute -top-2 right-8 flex space-x-1">
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <div className="animate-spin w-5 h-5 border-2 border-secondary border-t-transparent rounded-full"></div>
            <span className="text-sm font-medium">Processing...</span>
          </div>
        </div>
      )}

      {/* Proof of Delivery Photo Capture Modal */}
      {showProofCapture && selectedStopForDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Capture Proof Photo</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowProofCapture(false);
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                      setStream(null);
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Package: <span className="font-medium">{selectedStopForDelivery.packageId}</span>
              </div>
              
              <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={captureProofPhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const result = e.target?.result as string;
                      setStops(prev => prev.map(s => 
                        s.id === selectedStopForDelivery.id 
                          ? { ...s, proofPhoto: result, status: 'delivered', deliveredAt: new Date() }
                          : s
                      ));
                      setShowProofCapture(false);
                      setSelectedStopForDelivery(null);
                      addNotification('Package delivered with proof photo!', 'success');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Digital Signature Capture Modal */}
      {showSignatureCapture && selectedStopForDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Capture Signature</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSignatureCapture(false);
                    setSelectedStopForDelivery(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Package: <span className="font-medium">{selectedStopForDelivery.packageId}</span>
              </div>
              <div className="text-sm text-gray-600">
                Customer signature required for delivery confirmation.
              </div>
              
              <div className="border-2 border-gray-300 border-dashed rounded-lg">
                <canvas
                  ref={signatureCanvasRef}
                  width={300}
                  height={150}
                  className="w-full h-32 cursor-crosshair"
                  onTouchStart={(e) => {
                    e.preventDefault();
                    const canvas = signatureCanvasRef.current;
                    if (!canvas) return;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.lineCap = 'round';
                    
                    const rect = canvas.getBoundingClientRect();
                    const touch = e.touches[0];
                    const x = touch.clientX - rect.left;
                    const y = touch.clientY - rect.top;
                    
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    
                    const handleTouchMove = (e: TouchEvent) => {
                      e.preventDefault();
                      const touch = e.touches[0];
                      const newX = touch.clientX - rect.left;
                      const newY = touch.clientY - rect.top;
                      ctx.lineTo(newX, newY);
                      ctx.stroke();
                    };
                    
                    const handleTouchEnd = () => {
                      canvas.removeEventListener('touchmove', handleTouchMove);
                      canvas.removeEventListener('touchend', handleTouchEnd);
                    };
                    
                    canvas.addEventListener('touchmove', handleTouchMove);
                    canvas.addEventListener('touchend', handleTouchEnd);
                  }}
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={saveSignature} className="flex-1">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Signature
                </Button>
                <Button onClick={() => {
                  const canvas = signatureCanvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }} variant="outline" className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Messaging Modal */}
      {showMessaging && selectedStopForDelivery && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md h-96">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <span>Message Customer</span>
                  <div className="text-sm font-normal text-gray-600">
                    {selectedStopForDelivery.customerName || selectedStopForDelivery.packageId}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowMessaging(false);
                    setSelectedStopForDelivery(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full p-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages
                  .filter(m => m.stopId === selectedStopForDelivery.id)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`p-2 rounded-lg max-w-[80%] ${
                        message.sender === 'driver'
                          ? 'bg-secondary text-white ml-auto'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm">{message.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                
                {messages.filter(m => m.stopId === selectedStopForDelivery.id).length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t bg-gray-50 space-y-2">
                <div className="text-xs font-medium text-gray-600">Quick Messages:</div>
                <div className="flex flex-wrap gap-1">
                  {[
                    "On my way! 🚗",
                    "Arrived at location 📍", 
                    "Can't find the address 🤔",
                    "Call me please 📞"
                  ].map((quickMsg) => (
                    <Button
                      key={quickMsg}
                      size="sm"
                      variant="outline"
                      onClick={() => sendCustomerMessage(selectedStopForDelivery, quickMsg)}
                      className="text-xs h-7"
                    >
                      {quickMsg}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 border-t flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      sendCustomerMessage(selectedStopForDelivery, newMessage);
                      setNewMessage('');
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (newMessage.trim()) {
                      sendCustomerMessage(selectedStopForDelivery, newMessage);
                      setNewMessage('');
                    }
                  }}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success'
                ? 'bg-green-600 text-white'
                : notification.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-secondary text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notification.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {notification.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {notification.type === 'info' && <Bell className="w-4 h-4" />}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Offline Dialog */}
      {showOfflineDialog && !isOnline && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <WifiOff className="w-5 h-5 mr-2 text-red-600" />
                You're Offline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Don't worry! You can continue using Moovly Go. All changes will be saved locally 
                and synced automatically when your connection is restored.
              </p>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Offline Features Available:</div>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Continue taking delivery photos</li>
                  <li>• Capture customer signatures</li>
                  <li>• Mark packages as delivered</li>
                  <li>• Add stops to your route</li>
                </ul>
              </div>

              {offlineData.length > 0 && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-amber-800">
                    {offlineData.length} changes waiting to sync
                  </div>
                  <div className="text-xs text-amber-700 mt-1">
                    Last sync: {lastSyncTime.toLocaleTimeString()}
                  </div>
                </div>
              )}
              
              <Button 
                onClick={() => setShowOfflineDialog(false)}
                className="w-full"
              >
                Continue Working Offline
              </Button>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('settings')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Language Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSettings({ language: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="af">Afrikaans</option>
                  <option value="zu">isiZulu</option>
                  <option value="xh">isiXhosa</option>
                </select>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Dark Mode</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ darkMode: !settings.darkMode })}
                  className={settings.darkMode ? 'bg-gray-800 text-white' : ''}
                >
                  {settings.darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                </Button>
              </div>

              {/* Notifications Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Notifications</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ notifications: !settings.notifications })}
                  className={settings.notifications ? 'bg-secondary text-white' : ''}
                >
                  {settings.notifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                </Button>
              </div>

              {/* Auto Optimize Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Auto Optimize Routes</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ autoOptimize: !settings.autoOptimize })}
                  className={settings.autoOptimize ? 'bg-green-600 text-white' : ''}
                >
                  {settings.autoOptimize ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Address Book Modal */}
      {showAddressBook && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-96 overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('addressBook')}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddressBook(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {savedAddresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No saved addresses yet</p>
                  <p className="text-xs text-gray-400 mt-1">Add stops to save addresses automatically</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedAddresses.map((address, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center space-x-2 flex-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">{address}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentInput(address);
                          setShowAddressBook(false);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        Use
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      </div>
    );
}