import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, Calendar, Wrench, AlertTriangle, CheckCircle, Clock, User, Building2, Crown, FileText, Download, Camera, Fuel, ClipboardCheck, Upload, Eye, DollarSign, TrendingUp, FileImage, Scan } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MaintenanceRecord, Vehicle, ClientAccount } from "@shared/schema";
import { format } from "date-fns";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

interface MaintenanceTask {
  id: string;
  title: string;
  vehicleNumber: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'reported' | 'under_review' | 'in_repair' | 'complete';
  assignee?: string;
  dueDate?: string;
  description: string;
  createdAt: string;
  tags: string[];
}

const mockMaintenanceTasks: MaintenanceTask[] = [
  {
    id: '1',
    title: 'Brake pad replacement',
    vehicleNumber: 'VH-001',
    priority: 'urgent',
    status: 'reported',
    assignee: 'John Mechanic',
    dueDate: '2025-06-30',
    description: 'Front brake pads showing wear, needs immediate replacement',
    createdAt: '2025-06-29',
    tags: ['Safety Risk', 'Urgent']
  },
  {
    id: '2',
    title: 'Oil change service',
    vehicleNumber: 'VH-002',
    priority: 'medium',
    status: 'under_review',
    assignee: 'Sarah Tech',
    dueDate: '2025-07-05',
    description: 'Routine oil change and filter replacement',
    createdAt: '2025-06-28',
    tags: ['Routine', 'Scheduled']
  },
  {
    id: '3',
    title: 'Tire rotation',
    vehicleNumber: 'VH-003',
    priority: 'low',
    status: 'in_repair',
    assignee: 'Mike Service',
    dueDate: '2025-07-10',
    description: 'Regular tire rotation for even wear',
    createdAt: '2025-06-27',
    tags: ['Recurring Issue']
  }
];

function KanbanColumn({ title, status, tasks, moveTask }: {
  title: string;
  status: string;
  tasks: MaintenanceTask[];
  moveTask: (taskId: string, newStatus: string) => void;
}) {
  const [, drop] = useDrop({
    accept: 'task',
    drop: (item: { id: string }) => moveTask(item.id, status),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'border-red-200 bg-red-50';
      case 'under_review': return 'border-yellow-200 bg-yellow-50';
      case 'in_repair': return 'border-blue-200 bg-blue-50';
      case 'complete': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div ref={drop} className={`p-4 rounded-lg border-2 border-dashed min-h-[400px] ${getStatusColor(status)}`}>
      <h3 className="font-semibold mb-4 flex items-center justify-between">
        {title}
        <Badge variant="outline">{tasks.length}</Badge>
      </h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ task }: { task: MaintenanceTask }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'task',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Safety Risk': return 'bg-red-100 text-red-700';
      case 'Urgent': return 'bg-orange-100 text-orange-700';
      case 'Recurring Issue': return 'bg-purple-100 text-purple-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div
      ref={drag}
      className={`p-3 bg-white rounded-lg shadow-sm border cursor-move transition-all ${
        isDragging ? 'opacity-50 rotate-2' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm">{task.title}</h4>
        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </Badge>
      </div>
      
      <p className="text-xs text-gray-600 mb-2">{task.vehicleNumber}</p>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      
      <div className="flex flex-wrap gap-1 mb-2">
        {task.tags.map((tag) => (
          <Badge key={tag} className={`text-xs ${getTagColor(tag)}`}>
            {tag}
          </Badge>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {task.assignee || 'Unassigned'}
        </div>
        {task.dueDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(task.dueDate), "MMM d")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tasks, setTasks] = useState<MaintenanceTask[]>(mockMaintenanceTasks);
  
  // Mock current client plan - in real app, this would come from user context
  const [currentPlan, setCurrentPlan] = useState<'Moovly Connect' | 'Moovly Business'>('Moovly Business');
  
  const { data: maintenanceRecords, isLoading: recordsLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const isLoading = recordsLoading || vehiclesLoading;

  const moveTask = (taskId: string, newStatus: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: newStatus as any } : task
    ));
  };

  const getVehicleNumber = (vehicleId: number) => {
    const vehicle = vehicles?.find(v => v.id === vehicleId);
    return vehicle?.vehicleNumber || `VH-${vehicleId.toString().padStart(3, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "in_progress":
        return <Wrench className="h-3 w-3" />;
      case "scheduled":
        return <Clock className="h-3 w-3" />;
      default:
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const filteredRecords = maintenanceRecords?.filter(record => {
    const matchesSearch = getVehicleNumber(record.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const statusCounts = maintenanceRecords?.reduce((acc, record) => {
    acc[record.status] = (acc[record.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const tasksByStatus = {
    reported: tasks.filter(t => t.status === 'reported'),
    under_review: tasks.filter(t => t.status === 'under_review'),
    in_repair: tasks.filter(t => t.status === 'in_repair'),
    complete: tasks.filter(t => t.status === 'complete'),
  };

  // Plan toggle for demo purposes
  const PlanToggle = () => (
    <div className="flex items-center gap-2 mb-4">
      <Badge variant="outline" className="text-xs">Demo Mode:</Badge>
      <Button
        variant={currentPlan === 'Moovly Connect' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setCurrentPlan('Moovly Connect')}
        className="text-xs"
      >
        <Building2 className="h-3 w-3 mr-1" />
        Connect
      </Button>
      <Button
        variant={currentPlan === 'Moovly Business' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setCurrentPlan('Moovly Business')}
        className="text-xs"
      >
        <Crown className="h-3 w-3 mr-1" />
        Business
      </Button>
    </div>
  );

  if (currentPlan === 'Moovly Connect') {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <Header title="Maintenance" />
          
          <div className="p-6">
            <PlanToggle />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vehicle Maintenance</h2>
                <p className="text-gray-600">Basic maintenance tracking and checklists</p>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Record
              </Button>
            </div>

            <Tabs defaultValue="status" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="status">Vehicle Status</TabsTrigger>
                <TabsTrigger value="inspection">Vehicle Inspection</TabsTrigger>
              </TabsList>

              <TabsContent value="status" className="space-y-6">
                {/* Status Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Scheduled</span>
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statusCounts.scheduled || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">In Progress</span>
                        <Wrench className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statusCounts.in_progress || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statusCounts.completed || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Alerts</span>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Simple Vehicle List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles?.slice(0, 6).map((vehicle) => (
                    <Card key={vehicle.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{vehicle.vehicleNumber}</h3>
                          <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                            {vehicle.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Driver notes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4" />
                            <span>Fuel reminder</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Last service: Mar 15</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="inspection" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Inspection Checklists</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <h3 className="font-medium mb-2">Bike Checklist</h3>
                          <p className="text-sm text-gray-600 mb-4">Pre-ride safety inspection</p>
                          <Button variant="outline" size="sm">Start Checklist</Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <h3 className="font-medium mb-2">Van Checklist</h3>
                          <p className="text-sm text-gray-600 mb-4">Daily vehicle inspection</p>
                          <Button variant="outline" size="sm">Start Checklist</Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <h3 className="font-medium mb-2">Truck Checklist</h3>
                          <p className="text-sm text-gray-600 mb-4">Commercial vehicle inspection</p>
                          <Button variant="outline" size="sm">Start Checklist</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Inspections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Inspections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">VH-00{i} - Daily Inspection</p>
                              <p className="text-sm text-gray-600">Completed by John Smith</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600">Passed</Badge>
                        </div>
                      ))}
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1">
          <Header title="Maintenance" />
          
          <div className="p-6">
            <PlanToggle />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Advanced Maintenance Dashboard</h2>
                <p className="text-gray-600">Trello-style task management with smart analytics</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </div>

            <Tabs defaultValue="status" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="status">Vehicle Status</TabsTrigger>
                <TabsTrigger value="inspection">Inspection</TabsTrigger>
                <TabsTrigger value="kanban">Task Board</TabsTrigger>
                <TabsTrigger value="cost-centre">Cost Centre</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
              </TabsList>

              {/* CONNECT FEATURES - Vehicle Status Tab */}
              <TabsContent value="status" className="space-y-6">
                {/* Status Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Scheduled</span>
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statusCounts.scheduled || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">In Progress</span>
                        <Wrench className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statusCounts.in_progress || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Completed</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {statusCounts.completed || 0}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Alerts</span>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">2</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Vehicle Status Cards with Driver Photos & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles?.slice(0, 6).map((vehicle) => (
                    <Card key={vehicle.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{vehicle.vehicleNumber}</h3>
                          <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                            {vehicle.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Driver Notes</p>
                            <p className="text-xs text-gray-600">Last updated 2h ago</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4" />
                            <span>Fuel reminder: 850km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Odometer: 45,230km</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span>Service due in 150km</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Light Reporting */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Basic Maintenance Records
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Simple PDF
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Vehicle</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Description</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                            <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredRecords.slice(0, 5).map((record) => (
                            <tr key={record.id}>
                              <td className="py-3 px-4 font-medium">{getVehicleNumber(record.vehicleId)}</td>
                              <td className="py-3 px-4">
                                <Badge variant="outline">{record.type}</Badge>
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate">{record.description}</td>
                              <td className="py-3 px-4 text-gray-600">
                                {format(new Date(record.performedDate), "MMM d, yyyy")}
                              </td>
                              <td className="py-3 px-4">
                                <Badge className={getStatusColor(record.status)}>
                                  {getStatusIcon(record.status)}
                                  <span className="ml-1">{record.status}</span>
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* CONNECT FEATURES - Vehicle Inspection Tab */}
              <TabsContent value="inspection" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Vehicle Inspection Checklists</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <h3 className="font-medium mb-2">Bike Checklist</h3>
                          <p className="text-sm text-gray-600 mb-4">Pre-ride safety inspection</p>
                          <Button variant="outline" size="sm">Start Checklist</Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <h3 className="font-medium mb-2">Van Checklist</h3>
                          <p className="text-sm text-gray-600 mb-4">Daily vehicle inspection</p>
                          <Button variant="outline" size="sm">Start Checklist</Button>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-dashed">
                        <CardContent className="p-6 text-center">
                          <ClipboardCheck className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                          <h3 className="font-medium mb-2">Truck Checklist</h3>
                          <p className="text-sm text-gray-600 mb-4">Commercial vehicle inspection</p>
                          <Button variant="outline" size="sm">Start Checklist</Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Incomplete Checklist Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Incomplete Checklists
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">VH-001 - Daily Inspection</p>
                            <p className="text-sm text-gray-600">Due 2 hours ago</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Complete</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-yellow-500" />
                          <div>
                            <p className="font-medium">VH-003 - Pre-trip Check</p>
                            <p className="text-sm text-gray-600">Due in 30 minutes</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">Start</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Inspections */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Inspections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">VH-00{i} - Daily Inspection</p>
                              <p className="text-sm text-gray-600">Completed by John Smith</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-green-600">Passed</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BUSINESS FEATURES - Advanced Task Board */}

              <TabsContent value="kanban" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Reported</span>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {tasksByStatus.reported.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Under Review</span>
                        <Clock className="h-4 w-4 text-yellow-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {tasksByStatus.under_review.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">In Repair</span>
                        <Wrench className="h-4 w-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {tasksByStatus.in_repair.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Complete</span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {tasksByStatus.complete.length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg. Repair Time</span>
                        <Clock className="h-4 w-4 text-purple-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mt-2">2.3d</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <KanbanColumn
                    title="Reported"
                    status="reported"
                    tasks={tasksByStatus.reported}
                    moveTask={moveTask}
                  />
                  <KanbanColumn
                    title="Under Review"
                    status="under_review"
                    tasks={tasksByStatus.under_review}
                    moveTask={moveTask}
                  />
                  <KanbanColumn
                    title="In Repair"
                    status="in_repair"
                    tasks={tasksByStatus.in_repair}
                    moveTask={moveTask}
                  />
                  <KanbanColumn
                    title="Complete"
                    status="complete"
                    tasks={tasksByStatus.complete}
                    moveTask={moveTask}
                  />
                </div>
              </TabsContent>

              {/* BUSINESS TIER - Cost Centre Tab */}
              <TabsContent value="cost-centre" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Cost Centre Management
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white ml-2">
                        Moovly Business
                      </Badge>
                    </CardTitle>
                    <CardDescription>OCR document scanning and automated cost tracking for receipts, invoices, and maintenance bills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Vehicle Selector for Cost Centre */}
                    <div className="mb-6">
                      <Label htmlFor="cost-vehicle-select">Select Vehicle for Cost Tracking</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                          <Select defaultValue="">
                            <SelectTrigger id="cost-vehicle-select">
                              <SelectValue placeholder="Choose a vehicle to view costs" />
                            </SelectTrigger>
                            <SelectContent>
                              {vehicles?.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="bg-primary hover:bg-primary/90">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Receipt
                        </Button>
                      </div>
                    </div>

                    {/* Cost Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Costs</p>
                              <p className="text-2xl font-bold">R45,230</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Fuel Costs</p>
                              <p className="text-2xl font-bold">R18,500</p>
                            </div>
                            <Fuel className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Maintenance</p>
                              <p className="text-2xl font-bold">R15,200</p>
                            </div>
                            <Wrench className="h-8 w-8 text-orange-500" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Tyres</p>
                              <p className="text-2xl font-bold">R8,900</p>
                            </div>
                            <User className="h-8 w-8 text-purple-500" />
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Documents</p>
                              <p className="text-2xl font-bold">24</p>
                            </div>
                            <FileImage className="h-8 w-8 text-indigo-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* OCR Document Processing */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Recent Documents */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileImage className="h-5 w-5" />
                            Recent Documents
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[
                              { type: 'Fuel Receipt', status: 'completed', confidence: 95, amount: 'R850.00', date: '2 hours ago' },
                              { type: 'Tyre Invoice', status: 'processing', confidence: null, amount: 'Processing...', date: '4 hours ago' },
                              { type: 'Service Bill', status: 'completed', confidence: 89, amount: 'R2,450.00', date: '1 day ago' },
                              { type: 'Fuel Receipt', status: 'failed', confidence: null, amount: 'Manual required', date: '2 days ago' }
                            ].map((doc, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileImage className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{doc.type}</p>
                                    <p className="text-xs text-gray-600">{doc.date}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{doc.amount}</span>
                                  {doc.status === 'completed' && (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {doc.confidence}%
                                    </Badge>
                                  )}
                                  {doc.status === 'processing' && (
                                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                                      <Scan className="h-3 w-3 mr-1 animate-spin" />
                                      Processing
                                    </Badge>
                                  )}
                                  {doc.status === 'failed' && (
                                    <Badge variant="destructive">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Failed
                                    </Badge>
                                  )}
                                  <Button variant="ghost" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Cost Entries */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5" />
                            Recent Cost Entries
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[
                              { category: 'fuel', supplier: 'Shell Garage', amount: 'R850.00', date: 'Today', status: 'approved' },
                              { category: 'maintenance', supplier: 'Auto Service Centre', amount: 'R2,450.00', date: 'Yesterday', status: 'pending' },
                              { category: 'tyres', supplier: 'Tyre City', amount: 'R4,200.00', date: '3 days ago', status: 'approved' },
                              { category: 'fuel', supplier: 'Engen Station', amount: 'R920.00', date: '5 days ago', status: 'approved' }
                            ].map((entry, index) => {
                              const categoryIcons = {
                                fuel: { icon: Fuel, color: 'text-blue-600', bg: 'bg-blue-100' },
                                maintenance: { icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-100' },
                                tyres: { icon: User, color: 'text-purple-600', bg: 'bg-purple-100' }
                              };
                              const config = categoryIcons[entry.category as keyof typeof categoryIcons] || categoryIcons.fuel;
                              const Icon = config.icon;
                              
                              return (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                                      <Icon className={`h-4 w-4 ${config.color}`} />
                                    </div>
                                    <div>
                                      <p className="font-medium text-sm">{entry.supplier}</p>
                                      <p className="text-xs text-gray-600">{entry.date}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{entry.amount}</span>
                                    <Badge variant={entry.status === 'approved' ? 'default' : 'secondary'}>
                                      {entry.status}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-6">
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Cost Report
                      </Button>
                      <Button variant="outline">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Manual Entry
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Maintenance Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Average Time to Repair</span>
                          <span className="text-lg font-bold text-blue-600">2.3 days</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Recurring Issues</span>
                          <span className="text-lg font-bold text-orange-600">12%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Fleet Uptime</span>
                          <span className="text-lg font-bold text-green-600">94.2%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Cost per Vehicle</span>
                          <span className="text-lg font-bold">R2,450</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Issues</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { issue: 'Brake maintenance', count: 8, color: 'bg-red-100 text-red-800' },
                          { issue: 'Oil changes', count: 6, color: 'bg-blue-100 text-blue-800' },
                          { issue: 'Tire replacements', count: 4, color: 'bg-yellow-100 text-yellow-800' },
                          { issue: 'Engine diagnostics', count: 3, color: 'bg-purple-100 text-purple-800' }
                        ].map((item) => (
                          <div key={item.issue} className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.issue}</span>
                            <Badge className={item.color}>{item.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { time: '2 hours ago', action: 'Task moved to In Repair', user: 'John Mechanic', vehicle: 'VH-001' },
                        { time: '4 hours ago', action: 'New task created', user: 'Sarah Dispatcher', vehicle: 'VH-002' },
                        { time: '6 hours ago', action: 'Task completed', user: 'Mike Tech', vehicle: 'VH-003' },
                        { time: '1 day ago', action: 'Urgent task assigned', user: 'Admin', vehicle: 'VH-001' }
                      ].map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.action}</p>
                            <p className="text-xs text-gray-600">{activity.user} • {activity.vehicle}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}