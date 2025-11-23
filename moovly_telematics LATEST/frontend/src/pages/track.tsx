import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, MapPin, Clock, Phone, CheckCircle2, Circle, User, Car } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface TrackingData {
  job: {
    id: number;
    jobNumber: string;
    customerName: string;
    pickupAddress: string;
    deliveryAddress: string;
    status: string;
    scheduledDate: string;
    driverStartedAt?: string;
    estimatedArrivalTime?: string;
    currentDriverLatitude?: string;
    currentDriverLongitude?: string;
    lastLocationUpdate?: string;
  };
  driver?: {
    name: string;
    phone: string;
  };
  vehicle?: {
    make: string;
    model: string;
    plateNumber: string;
  };
}

export default function TrackPage() {
  const [trackingToken, setTrackingToken] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get tracking token from URL path
  useEffect(() => {
    const path = window.location.pathname;
    const token = path.split('/track/')[1];
    if (token) {
      setTrackingToken(token);
    }
  }, []);

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: tracking, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/track", trackingToken],
    queryFn: () => apiRequest(`/api/track/${trackingToken}`),
    enabled: !!trackingToken,
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });

  // Auto-refresh location every 30 seconds
  useEffect(() => {
    if (trackingToken) {
      const interval = setInterval(() => {
        refetch();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [trackingToken, refetch]);

  const calculateTimeUntilArrival = (etaString?: string): string => {
    if (!etaString) return "Calculating...";
    
    const eta = new Date(etaString);
    const diffMs = eta.getTime() - currentTime.getTime();
    
    if (diffMs <= 0) return "Arriving now!";
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const remainingMinutes = diffMinutes % 60;
    
    if (diffHours > 0) {
      return `${diffHours}h ${remainingMinutes}m`;
    }
    return `${diffMinutes} minutes`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  if (!trackingToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Moovly Telematics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Invalid tracking link. Please check your tracking URL.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-primary-foreground animate-pulse" />
            </div>
            <CardTitle className="text-xl">Moovly Telematics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Loading tracking information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-xl">Moovly Telematics</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Tracking information not found or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trackingData = tracking as TrackingData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Moovly Telematics</h1>
              <p className="text-sm text-gray-600">Live Delivery Tracking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Job Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>Delivery #{trackingData.job.jobNumber}</span>
              </CardTitle>
              <Badge className={getStatusColor(trackingData.job.status)}>
                {getStatusIcon(trackingData.job.status)}
                <span className="ml-1 capitalize">{trackingData.job.status.replace('_', ' ')}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">Customer</h3>
              <p className="text-gray-600">{trackingData.job.customerName}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">Pickup Address</h3>
                <p className="text-gray-600">{trackingData.job.pickupAddress}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Delivery Address</h3>
                <p className="text-gray-600">{trackingData.job.deliveryAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ETA Information */}
        {trackingData.job.status === 'in_progress' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>Estimated Arrival</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {calculateTimeUntilArrival(trackingData.job.estimatedArrivalTime)}
                  </div>
                  <p className="text-gray-600">Time remaining</p>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {trackingData.job.estimatedArrivalTime 
                      ? new Date(trackingData.job.estimatedArrivalTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })
                      : 'Calculating...'
                    }
                  </div>
                  <p className="text-gray-600">Estimated arrival time</p>
                </div>
              </div>
              
              {trackingData.job.lastLocationUpdate && (
                <div className="mt-4 text-sm text-gray-500 text-center">
                  Last updated: {new Date(trackingData.job.lastLocationUpdate).toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Driver & Vehicle Information */}
        {(trackingData.driver || trackingData.vehicle) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-green-600" />
                <span>Driver & Vehicle Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trackingData.driver && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Driver</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{trackingData.driver.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{trackingData.driver.phone}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {trackingData.vehicle && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Vehicle</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span>{trackingData.vehicle.make} {trackingData.vehicle.model}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                          {trackingData.vehicle.plateNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Live Map Placeholder */}
        {trackingData.job.currentDriverLatitude && trackingData.job.currentDriverLongitude && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-red-600" />
                <span>Live Location</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Driver Location</p>
                  <p className="text-sm text-gray-500">
                    {parseFloat(trackingData.job.currentDriverLatitude).toFixed(4)}, {parseFloat(trackingData.job.currentDriverLongitude).toFixed(4)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Live tracking map would display here in production
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Powered by Moovly Telematics • Updates every 30 seconds</p>
          <p className="mt-1">Thank you for choosing our delivery service!</p>
        </div>
      </div>
    </div>
  );
}