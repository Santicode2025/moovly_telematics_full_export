import { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, FilterIcon, MapPinned, TrendingUp, TrendingDown, Users, Car, AlertTriangle, CheckCircle, Play, Pause, SkipBack, SkipForward, Download, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import DriverScoreTable from '@/components/analytics/driver-score-table';
import RouteHistoryMap from '@/components/analytics/route-history-map';
import RouteComparisonMap from '@/components/RouteComparisonMap';
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

type Period = 'daily' | 'weekly' | 'monthly';

interface AnalyticsData {
  averageScore: number;
  drivers: Array<{
    id: number;
    name: string;
    trips: number;
    harshEvents: number;
    idleTime: number;
    score: number;
  }>;
  routeHistory: Array<{
    id: string;
    driverName: string;
    startLocation: string;
    endLocation: string;
    distance: string;
    duration: string;
    date: string;
    moovScore: number;
  }>;
  fleetStats: {
    totalDrivers: number;
    activeVehicles: number;
    completedJobs: number;
    fuelSavings: number;
    safetyIncidents: number;
  };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [data, setData] = useState<AnalyticsData | null>(null);
  
  // Universal date/time selection for all reports
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    endDate: new Date(),
    preset: '7days' // 'today', '7days', '30days', '3months', '12months', 'custom'
  });

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", period],
    queryFn: () => fetch(`/api/analytics?period=${period}`).then(res => res.json()),
  });

  useEffect(() => {
    // Mock data for demonstration - replace with real API data
    const mockData: AnalyticsData = {
      averageScore: 87.3,
      drivers: [
        { id: 1, name: 'John Smith', trips: 45, harshEvents: 2, idleTime: 12, score: 94 },
        { id: 2, name: 'Sarah Johnson', trips: 38, harshEvents: 1, idleTime: 8, score: 89 },
        { id: 3, name: 'Mike Davis', trips: 42, harshEvents: 3, idleTime: 15, score: 91 },
        { id: 4, name: 'Lisa Wong', trips: 35, harshEvents: 0, idleTime: 5, score: 87 },
        { id: 5, name: 'David Brown', trips: 48, harshEvents: 1, idleTime: 10, score: 93 },
      ],
      routeHistory: [
        {
          id: '1',
          driverName: 'John Smith',
          startLocation: 'Cape Town CBD',
          endLocation: 'Stellenbosch',
          distance: '55km',
          duration: '1h 15m',
          date: '2025-06-29',
          moovScore: 94
        },
        {
          id: '2',
          driverName: 'Sarah Johnson',
          startLocation: 'Johannesburg',
          endLocation: 'Pretoria',
          distance: '58km',
          duration: '1h 5m',
          date: '2025-06-29',
          moovScore: 89
        },
        {
          id: '3',
          driverName: 'Mike Davis',
          startLocation: 'Durban',
          endLocation: 'Pietermaritzburg',
          distance: '85km',
          duration: '1h 30m',
          date: '2025-06-28',
          moovScore: 91
        }
      ],
      fleetStats: {
        totalDrivers: 12,
        activeVehicles: 8,
        completedJobs: 156,
        fuelSavings: 12450,
        safetyIncidents: 3
      }
    };
    setData(mockData);
  }, [period]);

  const downloadReport = (format: 'excel' | 'pdf') => {
    console.log(`Downloading ${format} report for ${period} period`);
  };

  const performanceData = [
    { name: 'Jan', efficiency: 85, fuelCost: 2400, maintenanceCost: 800, moovScore: 87 },
    { name: 'Feb', efficiency: 88, fuelCost: 2200, maintenanceCost: 600, moovScore: 89 },
    { name: 'Mar', efficiency: 92, fuelCost: 2100, maintenanceCost: 700, moovScore: 91 },
    { name: 'Apr', efficiency: 87, fuelCost: 2300, maintenanceCost: 900, moovScore: 88 },
    { name: 'May', efficiency: 94, fuelCost: 2000, maintenanceCost: 500, moovScore: 93 },
    { name: 'Jun', efficiency: 91, fuelCost: 2150, maintenanceCost: 650, moovScore: 87 },
  ];

  const vehicleStatus = [
    { name: 'Active', value: 12, color: '#00C49F' },
    { name: 'Maintenance', value: 3, color: '#FFBB28' },
    { name: 'Out of Service', value: 1, color: '#FF8042' },
  ];

  // Route Replay Section Component
  const RouteReplaySection = () => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [selectedDriver, setSelectedDriver] = useState<string>("");
    const [selectedJob, setSelectedJob] = useState<string>("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentPosition, setCurrentPosition] = useState(0);
    const [showPlannedRoute, setShowPlannedRoute] = useState(true);
    const [showActualRoute, setShowActualRoute] = useState(true);

    // Sample route data - in production this would come from API
    const [routeData, setRouteData] = useState({
      plannedRoute: [
        { lat: -26.2041, lng: 28.0473, timestamp: '09:00', type: 'planned' as const, speed: 0 },
        { lat: -26.1951, lng: 28.0473, timestamp: '09:15', type: 'planned' as const, speed: 45 },
        { lat: -26.1851, lng: 28.0573, timestamp: '09:30', type: 'planned' as const, speed: 50 },
        { lat: -26.1751, lng: 28.0673, timestamp: '09:45', type: 'planned' as const, speed: 0 },
      ],
      actualRoute: [
        { lat: -26.2041, lng: 28.0473, timestamp: '09:02', type: 'actual' as const, speed: 0 },
        { lat: -26.1961, lng: 28.0483, timestamp: '09:18', type: 'actual' as const, speed: 35 },
        { lat: -26.1881, lng: 28.0593, timestamp: '09:35', type: 'actual' as const, speed: 45 },
        { lat: -26.1751, lng: 28.0673, timestamp: '09:52', type: 'actual' as const, speed: 0 },
      ],
      deviations: [
        { point: 1, plannedTime: '09:15', actualTime: '09:18', distance: '0.2km' },
        { point: 2, plannedTime: '09:30', actualTime: '09:35', distance: '0.8km' },
      ],
      summary: {
        plannedDistance: '15.2km',
        actualDistance: '16.8km',
        plannedDuration: '45min',
        actualDuration: '50min',
        fuelEfficiency: '12.3L/100km',
        moovScore: 78,
        deviationReasons: ['Traffic delay', 'Route optimization', 'Customer request']
      }
    });

    const { data: drivers } = useQuery({
      queryKey: ['/api/drivers'],
    });

    const { data: jobs } = useQuery({
      queryKey: ['/api/jobs'],
    });

    // Playback controls
    const handlePlay = () => setIsPlaying(!isPlaying);
    const handleSpeedChange = (speed: number[]) => setPlaybackSpeed(speed[0]);
    const handlePositionChange = (position: number[]) => setCurrentPosition(position[0]);

    // Download trip report
    const downloadTripReport = () => {
      const reportData = {
        date: format(selectedDate, 'yyyy-MM-dd'),
        driver: selectedDriver,
        job: selectedJob,
        plannedRoute: routeData.plannedRoute,
        actualRoute: routeData.actualRoute,
        deviations: routeData.deviations,
        summary: routeData.summary
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `route-report-${format(selectedDate, 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Route Replay & Analysis</h2>
          <Badge variant="outline" className="text-xs">
            Historical Data: {period === 'monthly' ? '12-36 months' : '12 months'} (Moovly {period === 'monthly' ? 'Business' : 'Connect'})
          </Badge>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Driver</label>
            <Select value={selectedDriver} onValueChange={setSelectedDriver}>
              <SelectTrigger>
                <SelectValue placeholder="Select driver" />
              </SelectTrigger>
              <SelectContent>
                {(drivers as any[])?.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id.toString()}>
                    {driver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Job/Route</label>
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger>
                <SelectValue placeholder="Select job" />
              </SelectTrigger>
              <SelectContent>
                {(jobs as any[])?.map((job) => (
                  <SelectItem key={job.id} value={job.id.toString()}>
                    {job.jobNumber} - {job.customerName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Actions</label>
            <Button onClick={downloadTripReport} className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </div>

        {/* Map and Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Route Replay Map</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={showPlannedRoute ? "default" : "outline"}
                      onClick={() => setShowPlannedRoute(!showPlannedRoute)}
                    >
                      Planned Route
                    </Button>
                    <Button
                      size="sm"
                      variant={showActualRoute ? "default" : "outline"}
                      onClick={() => setShowActualRoute(!showActualRoute)}
                    >
                      Actual Route
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RouteComparisonMap
                  plannedRoute={routeData.plannedRoute}
                  actualRoute={routeData.actualRoute}
                  showPlanned={showPlannedRoute}
                  showActual={showActualRoute}
                  currentPosition={currentPosition}
                  className="h-96"
                />

                {/* Playback Controls */}
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      size="sm"
                      onClick={handlePlay}
                      className="flex items-center gap-2"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button size="sm" variant="outline">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">Speed: {playbackSpeed}x</span>
                  </div>

                  {/* Progress Slider */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Playback Position</label>
                    <Slider
                      value={[currentPosition]}
                      onValueChange={handlePositionChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Start</span>
                      <span>{currentPosition}%</span>
                      <span>End</span>
                    </div>
                  </div>

                  {/* Speed Control */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Playback Speed</label>
                    <Slider
                      value={[playbackSpeed]}
                      onValueChange={handleSpeedChange}
                      min={0.5}
                      max={5}
                      step={0.5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0.5x</span>
                      <span>Normal</span>
                      <span>5x</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Analysis Panel */}
          <div className="space-y-4">
            {/* Route Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Route Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Planned Distance:</span>
                  <span className="font-medium">{routeData.summary.plannedDistance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Actual Distance:</span>
                  <span className="font-medium text-orange-600">{routeData.summary.actualDistance}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Planned Duration:</span>
                  <span className="font-medium">{routeData.summary.plannedDuration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Actual Duration:</span>
                  <span className="font-medium text-orange-600">{routeData.summary.actualDuration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Fuel Efficiency:</span>
                  <span className="font-medium text-green-600">{routeData.summary.fuelEfficiency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>MoovScore:</span>
                  <span className="font-medium text-secondary">{routeData.summary.moovScore}%</span>
                </div>
              </CardContent>
            </Card>

            {/* Route Deviations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Route Deviations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {routeData.deviations.map((deviation, index) => (
                    <div key={index} className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Point {deviation.point}</span>
                        <span className="text-orange-600">{deviation.distance}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Planned: {deviation.plannedTime} | Actual: {deviation.actualTime}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deviation Reasons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deviation Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {routeData.summary.deviationReasons.map((reason, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header title="Analytics" />
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold">Fleet Analytics</h1>
              <p className="text-gray-600 mt-1">Performance insights and MoovScore tracking</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setPeriod('daily')} variant={period === 'daily' ? 'default' : 'outline'}>Daily</Button>
              <Button onClick={() => setPeriod('weekly')} variant={period === 'weekly' ? 'default' : 'outline'}>Weekly</Button>
              <Button onClick={() => setPeriod('monthly')} variant={period === 'monthly' ? 'default' : 'outline'}>Monthly</Button>
            </div>
          </div>

          {/* Key Performance Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fleet Average</p>
                    <p className="text-2xl font-bold text-green-600">{data?.averageScore ?? '--'}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">MoovScore Performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                    <p className="text-2xl font-bold">{data?.fleetStats.totalDrivers ?? 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Currently assigned</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vehicles</p>
                    <p className="text-2xl font-bold">{data?.fleetStats.activeVehicles ?? 0}</p>
                  </div>
                  <Car className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Operational</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Jobs</p>
                    <p className="text-2xl font-bold">{data?.fleetStats.completedJobs ?? 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">This {period}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Safety Incidents</p>
                    <p className="text-2xl font-bold text-red-600">{data?.fleetStats.safetyIncidents ?? 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-xs text-gray-500 mt-1">Reported incidents</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">MoovScore Overview</h2>
                <p className="text-sm text-muted-foreground">Fleet average: <span className="font-bold text-green-600">{data?.averageScore ?? '--'}%</span></p>
                <p className="text-xs mt-1 text-gray-500">Based on harsh braking, acceleration, cornering & idling.</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-1">
                  <MapPinned size={18} /> Route History Map
                </h2>
                <RouteHistoryMap data={data?.routeHistory || []} />
              </CardContent>
            </Card>
          </div>

          {/* DEBUG: Test simple tabs */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Analytics Sub-Tabs</h2>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 bg-blue-500 text-white rounded text-sm">Driver Scorecards</button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm">Performance Trends</button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm">Route Analysis</button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm">Route Replay</button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm">Vehicle Status</button>
              <button className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm">Reports</button>
            </div>
          </div>
          
          <Tabs defaultValue="scorecards" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1">
              <TabsTrigger value="scorecards" className="text-xs md:text-sm">Driver Scorecards</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs md:text-sm">Performance Trends</TabsTrigger>
              <TabsTrigger value="routes" className="text-xs md:text-sm">Route Analysis</TabsTrigger>
              <TabsTrigger value="replay" className="text-xs md:text-sm">Route Replay</TabsTrigger>
              <TabsTrigger value="vehicles" className="text-xs md:text-sm">Vehicle Status</TabsTrigger>
              <TabsTrigger value="reports" className="text-xs md:text-sm">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="scorecards" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Driver Scorecards</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => downloadReport('excel')}>
                    <DownloadIcon size={16} className="mr-2" /> Excel
                  </Button>
                  <Button variant="outline" onClick={() => downloadReport('pdf')}>
                    <DownloadIcon size={16} className="mr-2" /> PDF
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <DriverScoreTable drivers={data?.drivers || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>MoovScore Trends</CardTitle>
                    <CardDescription>Monthly performance tracking</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="moovScore" stroke="#10b981" strokeWidth={3} />
                        <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cost Analysis</CardTitle>
                    <CardDescription>Fuel and maintenance costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="fuelCost" fill="#8884d8" />
                        <Bar dataKey="maintenanceCost" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="routes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Route Performance Analysis</CardTitle>
                  <CardDescription>Detailed route history and efficiency metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <RouteHistoryMap data={data?.routeHistory || []} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Status Distribution</CardTitle>
                    <CardDescription>Current fleet status overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={vehicleStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {vehicleStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Fleet Performance Summary</CardTitle>
                    <CardDescription>Key operational metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Average Fuel Efficiency</span>
                        <span className="text-lg font-bold text-green-600">12.5 L/100km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Distance Covered</span>
                        <span className="text-lg font-bold">45,230 km</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Maintenance Due</span>
                        <span className="text-lg font-bold text-orange-600">3 vehicles</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Fleet Safety Score</span>
                        <span className="text-lg font-bold text-secondary">87.3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="replay" className="space-y-6">
              <RouteReplaySection />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Comprehensive Reports</h2>
                <Badge variant="outline" className="text-xs">
                  Unified Report Center
                </Badge>
              </div>

              {/* Universal Date Range Selector */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <CalendarIcon className="h-5 w-5" />
                    Universal Date/Time Selection
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Apply date range to all report types below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Quick Select</label>
                      <Select
                        value={reportDateRange.preset}
                        onValueChange={(value) => {
                          const now = new Date();
                          let startDate = new Date();
                          
                          switch (value) {
                            case 'today':
                              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                              break;
                            case '7days':
                              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                              break;
                            case '30days':
                              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                              break;
                            case '3months':
                              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                              break;
                            case '12months':
                              startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                              break;
                            default:
                              startDate = reportDateRange.startDate;
                          }
                          
                          setReportDateRange({
                            startDate,
                            endDate: now,
                            preset: value
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="3months">Last 3 months</SelectItem>
                          <SelectItem value="12months">Last 12 months</SelectItem>
                          <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Start Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(reportDateRange.startDate, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={reportDateRange.startDate}
                            onSelect={(date) => date && setReportDateRange(prev => ({ ...prev, startDate: date, preset: 'custom' }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">End Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(reportDateRange.endDate, 'PPP')}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={reportDateRange.endDate}
                            onSelect={(date) => date && setReportDateRange(prev => ({ ...prev, endDate: date, preset: 'custom' }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-blue-900">Apply to Reports</label>
                      <div className="flex flex-col space-y-1 text-xs text-blue-700">
                        <span>• Selected: {format(reportDateRange.startDate, 'MMM dd')} - {format(reportDateRange.endDate, 'MMM dd, yyyy')}</span>
                        <span>• Duration: {Math.ceil((reportDateRange.endDate.getTime() - reportDateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        <span>• Applied to all reports below</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Trip Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPinned className="h-5 w-5" />
                      Trip Reports
                    </CardTitle>
                    <CardDescription>
                      Detailed driver trip analysis and performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Driver</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Drivers</SelectItem>
                          <SelectItem value="1">John Smith</SelectItem>
                          <SelectItem value="2">Sarah Johnson</SelectItem>
                          <SelectItem value="3">Mike Davis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Range</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="3months">Last 3 months</SelectItem>
                          <SelectItem value="12months">Last 12 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Route efficiency and deviations</p>
                      <p>• MoovScore breakdown</p>
                      <p>• Time and distance analysis</p>
                      <p>• Vehicle details included</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Geofence Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Geofence Reports
                    </CardTitle>
                    <CardDescription>
                      Client visit tracking and geofence analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Report Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Geofence Visits</SelectItem>
                          <SelectItem value="client">Single Client Analysis</SelectItem>
                          <SelectItem value="violations">Boundary Violations</SelectItem>
                          <SelectItem value="dwell">Dwell Time Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Client (Optional)</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="abc">ABC Electronics</SelectItem>
                          <SelectItem value="xyz">XYZ Furniture</SelectItem>
                          <SelectItem value="tech">Tech Solutions Ltd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Entry/exit timestamps</p>
                      <p>• Visit frequency analysis</p>
                      <p>• Dwell time metrics</p>
                      <p>• Client-specific summaries</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Refuel Report */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Refuel Report
                    </CardTitle>
                    <CardDescription>
                      Individual fuel entries with driver and vehicle details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vehicle</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vehicles</SelectItem>
                          <SelectItem value="transit">Ford Transit (VH-001)</SelectItem>
                          <SelectItem value="sprinter">Mercedes Sprinter (VH-042)</SelectItem>
                          <SelectItem value="daily">Iveco Daily (VH-023)</SelectItem>
                          <SelectItem value="cooper">Mini Cooper (VH-COOPER)</SelectItem>
                          <SelectItem value="swift">Suzuki Swift (VH-101)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time Period</label>
                      <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border">
                        📅 Using: {format(reportDateRange.startDate, 'MMM dd')} - {format(reportDateRange.endDate, 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Driver name</p>
                      <p>• Vehicle registration</p>
                      <p>• Date & time of refuel</p>
                      <p>• Filled amount (litres)</p>
                      <p>• Vehicle odometer reading</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Fuel Consumption Report */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Fuel Consumption Report
                    </CardTitle>
                    <CardDescription>
                      Fuel efficiency analysis with consumption metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vehicle</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vehicles</SelectItem>
                          <SelectItem value="transit">Ford Transit (VH-001)</SelectItem>
                          <SelectItem value="sprinter">Mercedes Sprinter (VH-042)</SelectItem>
                          <SelectItem value="daily">Iveco Daily (VH-023)</SelectItem>
                          <SelectItem value="cooper">Mini Cooper (VH-COOPER)</SelectItem>
                          <SelectItem value="swift">Suzuki Swift (VH-101)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Time Period</label>
                      <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border">
                        📅 Using: {format(reportDateRange.startDate, 'MMM dd')} - {format(reportDateRange.endDate, 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Driver name</p>
                      <p>• Vehicle registration</p>
                      <p>• Total litres used</p>
                      <p>• Total km driven</p>
                      <p>• Litres/km efficiency</p>
                      <p>• Litres/100km consumption</p>
                    </div>
                  </CardContent>
                </Card>

                {/* MoovScore Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      MoovScore Reports
                    </CardTitle>
                    <CardDescription>
                      Driver behavior and performance analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Report Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual Driver Report</SelectItem>
                          <SelectItem value="fleet">Fleet MoovScore Summary</SelectItem>
                          <SelectItem value="trends">Performance Trends</SelectItem>
                          <SelectItem value="incidents">Incident Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Driver</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Drivers</SelectItem>
                          <SelectItem value="1">John Smith (88.0)</SelectItem>
                          <SelectItem value="2">Sarah Johnson (92.5)</SelectItem>
                          <SelectItem value="3">Mike Davis (85.3)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Behavior score breakdown</p>
                      <p>• Harsh events analysis</p>
                      <p>• Improvement recommendations</p>
                      <p>• Historical trend analysis</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Maintenance Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Vehicle Reports
                    </CardTitle>
                    <CardDescription>
                      Maintenance schedules and vehicle analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Report Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="maintenance">Maintenance Schedule</SelectItem>
                          <SelectItem value="utilization">Vehicle Utilization</SelectItem>
                          <SelectItem value="costs">Operating Costs</SelectItem>
                          <SelectItem value="inspection">Inspection History</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Vehicle</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Vehicles</SelectItem>
                          <SelectItem value="1">Ford Transit (ABC-123)</SelectItem>
                          <SelectItem value="2">Mercedes Sprinter (XYZ-789)</SelectItem>
                          <SelectItem value="3">Iveco Daily (DEF-456)</SelectItem>
                          <SelectItem value="4">Mini Cooper (MOOV-123)</SelectItem>
                          <SelectItem value="5">Suzuki Swift (GP21RSGP)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Maintenance history</p>
                      <p>• Upcoming service dates</p>
                      <p>• Cost per km analysis</p>
                      <p>• Vehicle specifications</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Job Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Job Reports
                    </CardTitle>
                    <CardDescription>
                      Comprehensive job analytics and delivery performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Report Type</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="driver">Per Driver Job Analysis</SelectItem>
                          <SelectItem value="overall">Overall Job Performance</SelectItem>
                          <SelectItem value="timing">On-Time vs Late Analysis</SelectItem>
                          <SelectItem value="routes">Route Deviation Analysis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Driver (Optional)</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select driver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Drivers</SelectItem>
                          <SelectItem value="1">John Smith</SelectItem>
                          <SelectItem value="2">Sarah Johnson</SelectItem>
                          <SelectItem value="3">Mike Davis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Date Range</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="7days">Last 7 days</SelectItem>
                          <SelectItem value="30days">Last 30 days</SelectItem>
                          <SelectItem value="3months">Last 3 months</SelectItem>
                          <SelectItem value="custom">Custom Date Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Excel
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Per driver: destinations, routes, timing</p>
                      <p>• On-time vs late delivery stats</p>
                      <p>• Route deviation % and km analysis</p>
                      <p>• Delivery efficiency metrics</p>
                      <p>• Customer satisfaction scores</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Reports */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FilterIcon className="h-5 w-5" />
                      Custom Reports
                    </CardTitle>
                    <CardDescription>
                      Build custom reports with multiple data sources
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data Sources</label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="trips" className="rounded" />
                          <label htmlFor="trips" className="text-sm">Trip Data</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="fuel" className="rounded" />
                          <label htmlFor="fuel" className="text-sm">Fuel Data</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="geofence" className="rounded" />
                          <label htmlFor="geofence" className="text-sm">Geofence Data</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="moovscore" className="rounded" />
                          <label htmlFor="moovscore" className="text-sm">MoovScore Data</label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Format</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excel">Excel Workbook</SelectItem>
                          <SelectItem value="pdf">PDF Report</SelectItem>
                          <SelectItem value="csv">CSV Export</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Custom Report
                    </Button>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>• Multi-source data fusion</p>
                      <p>• Flexible date ranges</p>
                      <p>• Advanced filtering options</p>
                      <p>• Scheduled delivery available</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Report Generation Status */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Report Downloads</CardTitle>
                  <CardDescription>Track your report generation history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Trip Report - John Smith</p>
                          <p className="text-sm text-gray-500">Generated 2 minutes ago</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Re-download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Fuel Summary - All Vehicles</p>
                          <p className="text-sm text-gray-500">Generated 15 minutes ago</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Re-download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-secondary" />
                        <div>
                          <p className="font-medium">MoovScore Fleet Report</p>
                          <p className="text-sm text-gray-500">In progress...</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" disabled>
                        Processing...
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}