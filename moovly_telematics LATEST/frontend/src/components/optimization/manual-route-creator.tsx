import { useState, useCallback } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { Map, Crown, AlertTriangle, GripVertical, Clock, MapPin, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: number;
  jobNumber: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: Date;
  priority: string;
  estimatedDuration: number;
  status: string;
  driverId?: number | null;
  vehicleId?: number | null;
}

interface JobCardProps {
  job: Job;
  index: number;
  moveJob: (from: number, to: number) => void;
}

function JobCard({ job, index, moveJob }: JobCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'JOB',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: 'JOB',
    hover(item: { index: number }) {
      if (item.index !== index) {
        moveJob(item.index, index);
        item.index = index;
      }
    },
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'low':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`p-4 m-2 rounded-lg border-2 cursor-move transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:shadow-md'
      } ${getPriorityColor(job.priority)}`}
    >
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{job.jobNumber}</h4>
            <Badge variant={job.priority === 'high' ? 'destructive' : job.priority === 'medium' ? 'default' : 'secondary'}>
              {job.priority}
            </Badge>
          </div>
          
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{job.customerName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{job.pickupAddress}</span>
            </div>
            
            <div className="flex items-center gap-2 text-blue-600">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{job.deliveryAddress}</span>
            </div>
            
            {job.estimatedDuration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{job.estimatedDuration} mins</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Check if user has Moovly Business subscription
const useSubscriptionCheck = () => {
  // In a real app, this would check the user's subscription
  // For now, we'll simulate Business access
  return { hasBusiness: true, isLoading: false };
};

export function ManualRouteCreator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasBusiness, isLoading: subscriptionLoading } = useSubscriptionCheck();

  // Fetch available jobs
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs'],
    enabled: hasBusiness,
  });

  // Filter unassigned jobs for route creation
  const unassignedJobs = Array.isArray(jobs) ? jobs.filter((job: Job) => !job.driverId && job.status === 'pending') : [];
  
  const [route, setRoute] = useState<Job[]>([]);
  const [routeName, setRouteName] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');

  // Fetch drivers and vehicles for assignment
  const { data: drivers = [] } = useQuery({
    queryKey: ['/api/drivers'],
    enabled: hasBusiness,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles'],
    enabled: hasBusiness,
  });

  const moveJob = useCallback((from: number, to: number) => {
    setRoute((prevRoute) => {
      const updated = [...prevRoute];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  }, []);

  const addJobToRoute = (job: Job) => {
    if (!route.find(j => j.id === job.id)) {
      setRoute([...route, job]);
    }
  };

  const removeJobFromRoute = (jobId: number) => {
    setRoute(route.filter(j => j.id !== jobId));
  };

  const clearRoute = () => {
    setRoute([]);
  };

  const saveRouteMutation = useMutation({
    mutationFn: async (routeData: any) => {
      return apiRequest('/api/routes', 'POST', routeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Route Created",
        description: `Manual route "${routeName}" has been saved successfully.`,
      });
      setRoute([]);
      setRouteName('');
      setSelectedDriver('');
      setSelectedVehicle('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create route.",
        variant: "destructive",
      });
    },
  });

  const saveRoute = () => {
    if (!routeName.trim()) {
      toast({
        title: "Route Name Required",
        description: "Please enter a name for this route.",
        variant: "destructive",
      });
      return;
    }

    if (route.length === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please add jobs to the route before saving.",
        variant: "destructive",
      });
      return;
    }

    const routeData = {
      name: routeName,
      description: `Manual route with ${route.length} jobs`,
      jobIds: route.map(job => job.id),
      driverId: selectedDriver ? Number(selectedDriver) : null,
      vehicleId: selectedVehicle ? Number(selectedVehicle) : null,
      estimatedTime: route.reduce((total, job) => total + (job.estimatedDuration || 30), 0),
      isActive: true
    };

    saveRouteMutation.mutate(routeData);
  };

  if (subscriptionLoading) {
    return <div>Loading subscription details...</div>;
  }

  if (!hasBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Manual Route Creator
            <Badge variant="secondary">Business Only</Badge>
          </CardTitle>
          <CardDescription>
            Advanced drag-and-drop route creation for optimal job sequencing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Moovly Business Required</h3>
            <p className="text-muted-foreground mb-4">
              Manual Route Creator is exclusive to Moovly Business subscribers. 
              Upgrade your plan to access advanced route planning features.
            </p>
            <Button variant="outline">
              Upgrade to Business
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Manual Route Creator
            <Badge variant="default">Business</Badge>
          </CardTitle>
          <CardDescription>
            Drag and drop jobs to create optimized delivery routes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div>Loading available jobs...</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Available Jobs */}
              <div>
                <h3 className="text-lg font-medium mb-4">Available Jobs ({unassignedJobs.length})</h3>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-2">
                  {unassignedJobs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No unassigned jobs available
                    </div>
                  ) : (
                    unassignedJobs.map((job: Job) => (
                      <div
                        key={job.id}
                        className="p-3 m-1 bg-gray-50 border rounded cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => addJobToRoute(job)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{job.jobNumber}</div>
                            <div className="text-sm text-muted-foreground">{job.customerName}</div>
                            <div className="text-xs text-blue-600">{job.deliveryAddress}</div>
                          </div>
                          <Badge variant={job.priority === 'high' ? 'destructive' : 'secondary'}>
                            {job.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Route Builder */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Route ({route.length} jobs)</h3>
                  {route.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearRoute}>
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-4 mb-6">
                  <Input
                    placeholder="Enter route name..."
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(drivers) && drivers.map((driver: any) => (
                          <SelectItem key={driver.id} value={driver.id.toString()}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(vehicles) && vehicles.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.vehicleNumber} - {vehicle.make}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto border rounded-lg p-2 min-h-[200px] relative">
                  {route.length === 0 ? (
                    <div className="text-center text-muted-foreground py-16">
                      <Map className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Drag jobs here to build your route</p>
                    </div>
                  ) : (
                    <div>
                      {route.map((job, index) => (
                        <div key={job.id} className="relative">
                          <div className="absolute left-2 top-6 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold z-10">
                            {index + 1}
                          </div>
                          <JobCard job={job} index={index} moveJob={moveJob} />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            onClick={() => removeJobFromRoute(job.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {route.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div>Total Jobs: {route.length}</div>
                      <div>Estimated Time: {route.reduce((total, job) => total + (job.estimatedDuration || 30), 0)} minutes</div>
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                <Button 
                  onClick={saveRoute}
                  disabled={saveRouteMutation.isPending || route.length === 0}
                  className="w-full"
                >
                  {saveRouteMutation.isPending ? 'Creating Route...' : 'Create Route'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DndProvider>
  );
}