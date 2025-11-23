import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, TrendingUp, MessageSquare, Settings, Trophy, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OptimizationRules } from '@/components/optimization/optimization-rules';
import { ManualRouteCreator } from '@/components/optimization/manual-route-creator';
import { MaintenanceBoard } from '@/components/optimization/maintenance-board';
import { GeofenceManagement } from '@/components/geofences/geofence-management';

export default function AdvancedFeatures() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedJob, setSelectedJob] = useState('');

  // Socket.io connection
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/socket.io/`;
    
    // In a real implementation, we'd use socket.io-client here
    console.log('Socket connection would be established to:', wsUrl);
  }, []);

  // Fetch trip data for MoovScore
  const { data: tripData = [], isLoading: tripDataLoading } = useQuery({
    queryKey: ['/api/trip-data'],
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/messages'],
  });

  // Fetch jobs for carry-over testing
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Fetch drivers
  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['/api/drivers'],
  });

  // Create trip data mutation
  const createTripMutation = useMutation({
    mutationFn: (tripData: any) => apiRequest('/api/trip-data', 'POST', tripData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trip-data'] });
      toast({
        title: "Trip Data Created",
        description: "MoovScore has been calculated automatically.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create trip data.",
        variant: "destructive",
      });
    },
  });

  // Job carry-over mutation
  const carryOverMutation = useMutation({
    mutationFn: ({ jobId, driverId, nextDaySchedule }: any) => 
      apiRequest('/api/jobs/carry-over', 'POST', { jobId, driverId, nextDaySchedule }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job Carried Over",
        description: "Job has been scheduled for the next day.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to carry over job.",
        variant: "destructive",
      });
    },
  });

  // Job prioritization mutation
  const prioritizeMutation = useMutation({
    mutationFn: (jobs: any[]) => apiRequest('/api/jobs/prioritize', 'POST', { jobs }),
    onSuccess: (prioritizedJobs) => {
      console.log('Prioritized jobs:', prioritizedJobs);
      toast({
        title: "Jobs Prioritized",
        description: "Jobs have been automatically prioritized.",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: any) => apiRequest('/api/messages', 'POST', messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: "Message Sent",
        description: "Your message has been delivered.",
      });
    },
  });

  const handleCreateTripData = () => {
    const sampleTripData = {
      driverId: parseInt(selectedDriver) || 1,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(),
      distance: 45.5,
      speedViolations: Math.floor(Math.random() * 5),
      harshBrakes: Math.floor(Math.random() * 3),
      harshAccelerations: Math.floor(Math.random() * 2),
      harshTurns: Math.floor(Math.random() * 4),
      idleTimeSeconds: Math.floor(Math.random() * 600), // 0-10 minutes
      fuelUsed: 12.3,
      route: "Main Street to Industrial District"
    };

    createTripMutation.mutate(sampleTripData);
  };

  const handleCarryOverJob = () => {
    if (!selectedJob || !selectedDriver) {
      toast({
        title: "Selection Required",
        description: "Please select both a job and driver for carry-over.",
        variant: "destructive",
      });
      return;
    }

    const nextDaySchedule = new Date();
    nextDaySchedule.setDate(nextDaySchedule.getDate() + 1);
    nextDaySchedule.setHours(8, 0, 0, 0); // 8 AM next day

    carryOverMutation.mutate({
      jobId: parseInt(selectedJob),
      driverId: parseInt(selectedDriver),
      nextDaySchedule: nextDaySchedule.toISOString()
    });
  };

  const handlePrioritizeJobs = () => {
    if (jobs.length === 0) {
      toast({
        title: "No Jobs Available",
        description: "Please create some jobs first.",
        variant: "destructive",
      });
      return;
    }

    prioritizeMutation.mutate(jobs);
  };

  const handleSendMessage = () => {
    if (!selectedDriver) {
      toast({
        title: "Selection Required",
        description: "Please select a driver to send a message to.",
        variant: "destructive",
      });
      return;
    }

    const messageData = {
      fromUserId: 1, // Admin user
      toUserId: parseInt(selectedDriver),
      message: "This is a test message from the advanced features demo.",
      messageType: "notification",
      entityType: "system",
      entityId: null
    };

    sendMessageMutation.mutate(messageData);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Fleet Features</h1>
        <p className="text-muted-foreground">
          Demonstration of MoovScore, job carry-over, prioritization, and real-time messaging
        </p>
      </div>

      <Tabs defaultValue="moovscore" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="moovscore">MoovScore</TabsTrigger>
          <TabsTrigger value="job-management">Job Management</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="optimization">Smart Optimization</TabsTrigger>
          <TabsTrigger value="route-creator">Route Creator</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Board</TabsTrigger>
          <TabsTrigger value="geofences">Geofence Alerts</TabsTrigger>
          <TabsTrigger value="controls">Test Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="moovscore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Driver Performance - MoovScore
              </CardTitle>
              <CardDescription>
                Real-time driver scoring based on driving behavior
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tripDataLoading ? (
                <div>Loading trip data...</div>
              ) : (
                <div className="space-y-4">
                  {tripData.length === 0 ? (
                    <p className="text-muted-foreground">No trip data available. Create some test data below.</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {tripData.slice(0, 6).map((trip: any) => (
                        <Card key={trip.id} className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Driver {trip.driverId}</span>
                            <Badge 
                              variant={trip.moovScore >= 80 ? "default" : trip.moovScore >= 60 ? "secondary" : "destructive"}
                            >
                              Score: {trip.moovScore}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>Route: {trip.route}</div>
                            <div>Distance: {trip.distance} km</div>
                            <div>Violations: {trip.speedViolations} speed, {trip.harshBrakes} harsh brakes</div>
                            <div>Idle time: {Math.floor(trip.idleTimeSeconds / 60)} minutes</div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="job-management" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Job Carry-Over
                </CardTitle>
                <CardDescription>
                  Automatically handle incomplete jobs for next day
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobsLoading ? (
                  <div>Loading jobs...</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Jobs with Carry-Over Status</Label>
                      {jobs.filter((job: any) => job.isCarryOver).length === 0 ? (
                        <p className="text-muted-foreground text-sm">No carried-over jobs</p>
                      ) : (
                        <div className="space-y-2">
                          {jobs.filter((job: any) => job.isCarryOver).map((job: any) => (
                            <div key={job.id} className="flex items-center justify-between p-2 border rounded">
                              <span>{job.jobNumber}</span>
                              <Badge variant="secondary">Carried Over</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Smart Prioritization
                </CardTitle>
                <CardDescription>
                  Intelligent job scheduling and route optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Priority Distribution</Label>
                  {jobsLoading ? (
                    <div>Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>High Priority</span>
                        <Badge variant="destructive">
                          {jobs.filter((job: any) => job.priority === 'high').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Medium Priority</span>
                        <Badge variant="secondary">
                          {jobs.filter((job: any) => job.priority === 'medium').length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Low Priority</span>
                        <Badge variant="outline">
                          {jobs.filter((job: any) => job.priority === 'low').length}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handlePrioritizeJobs}
                  disabled={prioritizeMutation.isPending}
                  className="w-full"
                >
                  Re-prioritize All Jobs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Real-Time Messaging
              </CardTitle>
              <CardDescription>
                Socket.io powered communication system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div>Loading messages...</div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recent Messages</Label>
                    {messages.length === 0 ? (
                      <p className="text-muted-foreground">No messages yet. Send a test message below.</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {messages.slice(-5).map((message: any) => (
                          <div key={message.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium">From User {message.fromUserId}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {message.messageType}
                              </Badge>
                              {!message.isRead && (
                                <Badge variant="destructive" className="text-xs">
                                  Unread
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <OptimizationRules />
        </TabsContent>

        <TabsContent value="route-creator" className="space-y-4">
          <ManualRouteCreator />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <MaintenanceBoard />
        </TabsContent>

        <TabsContent value="geofences" className="space-y-4">
          <GeofenceManagement />
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Test Controls
              </CardTitle>
              <CardDescription>
                Generate test data and trigger advanced features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="driver-select">Select Driver</Label>
                  <select 
                    id="driver-select"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Choose a driver...</option>
                    {drivers.map((driver: any) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="job-select">Select Job</Label>
                  <select 
                    id="job-select"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Choose a job...</option>
                    {jobs.map((job: any) => (
                      <option key={job.id} value={job.id}>
                        {job.jobNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button 
                  onClick={handleCreateTripData}
                  disabled={createTripMutation.isPending || !selectedDriver}
                  className="w-full"
                >
                  Generate Trip Data
                </Button>

                <Button 
                  onClick={handleCarryOverJob}
                  disabled={carryOverMutation.isPending || !selectedJob || !selectedDriver}
                  className="w-full"
                >
                  Test Job Carry-Over
                </Button>

                <Button 
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !selectedDriver}
                  className="w-full"
                >
                  Send Test Message
                </Button>

                <Button 
                  onClick={handlePrioritizeJobs}
                  disabled={prioritizeMutation.isPending}
                  className="w-full"
                >
                  Test Job Prioritization
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Socket.io Status</h4>
                <p className="text-sm text-muted-foreground">
                  Real-time messaging system is configured and ready. 
                  In a production environment, this would show live connection status.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}