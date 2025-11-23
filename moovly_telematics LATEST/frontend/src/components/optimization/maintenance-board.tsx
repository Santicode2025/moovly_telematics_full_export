import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { Crown, AlertTriangle, Plus, Settings, Clock, CheckCircle, Circle, Wrench, Calendar, DollarSign, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  type: string;
  description: string;
  status: string;
  cost: string | null;
  performedDate: Date;
  performedBy: string | null;
  nextDueDate: Date | null;
  mileageAtService: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface Vehicle {
  id: number;
  vehicleNumber: string;
  make: string;
  model: string;
  status: string;
}

const maintenanceColumns = {
  'scheduled': {
    title: 'Scheduled',
    icon: Calendar,
    color: 'bg-blue-50 border-blue-200',
    badgeVariant: 'default' as const
  },
  'in-progress': {
    title: 'In Progress', 
    icon: Wrench,
    color: 'bg-yellow-50 border-yellow-200',
    badgeVariant: 'secondary' as const
  },
  'completed': {
    title: 'Completed',
    icon: CheckCircle,
    color: 'bg-green-50 border-green-200',
    badgeVariant: 'outline' as const
  }
};

interface MaintenanceCardProps {
  record: MaintenanceRecord;
  vehicles: Vehicle[];
  onUpdateStatus: (id: number, status: string) => void;
}

function MaintenanceCard({ record, vehicles, onUpdateStatus }: MaintenanceCardProps) {
  const vehicle = vehicles.find(v => v.id === record.vehicleId);
  
  const getPriorityColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'urgent':
      case 'emergency':
        return 'border-l-4 border-l-red-500';
      case 'routine':
        return 'border-l-4 border-l-blue-500';
      case 'preventive':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  };

  return (
    <div className={`bg-white p-3 m-2 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(record.type)}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {record.type}
          </Badge>
          <select
            value={record.status}
            onChange={(e) => onUpdateStatus(record.id, e.target.value)}
            className="text-xs border rounded px-1 py-0.5"
          >
            <option value="scheduled">Scheduled</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        
        <h4 className="font-medium text-sm line-clamp-2">{record.description}</h4>
        
        <div className="space-y-1 text-xs text-gray-600">
          {vehicle && (
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3" />
              <span>{vehicle.vehicleNumber} - {vehicle.make} {vehicle.model}</span>
            </div>
          )}
          
          {record.performedBy && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{record.performedBy}</span>
            </div>
          )}
          
          {record.cost && (
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span>{record.cost}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(record.performedDate).toLocaleDateString()}</span>
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

export function MaintenanceBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasBusiness, isLoading: subscriptionLoading } = useSubscriptionCheck();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    vehicleId: '',
    type: '',
    description: '',
    cost: '',
    performedBy: '',
    status: 'scheduled',
    performedDate: new Date().toISOString().split('T')[0],
    mileageAtService: ''
  });

  // Fetch maintenance records
  const { data: maintenanceRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['/api/maintenance'],
    enabled: hasBusiness,
  });

  // Fetch vehicles for the dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['/api/vehicles'],
    enabled: hasBusiness,
  });

  // Group records by status
  const groupedRecords = (Array.isArray(maintenanceRecords) ? maintenanceRecords : []).reduce((acc: any, record: MaintenanceRecord) => {
    const status = record.status || 'scheduled';
    if (!acc[status]) acc[status] = [];
    acc[status].push(record);
    return acc;
  }, {});

  // Add new maintenance task
  const addTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      return apiRequest('/api/maintenance', 'POST', {
        ...taskData,
        vehicleId: Number(taskData.vehicleId),
        performedDate: new Date(taskData.performedDate)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: "Task Added",
        description: "Maintenance task has been added to the board.",
      });
      setIsDialogOpen(false);
      setNewTask({
        vehicleId: '',
        type: '',
        description: '',
        cost: '',
        performedBy: '',
        status: 'scheduled',
        performedDate: new Date().toISOString().split('T')[0],
        mileageAtService: ''
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add maintenance task.",
        variant: "destructive",
      });
    },
  });

  // Update task status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest(`/api/maintenance/${id}`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] });
      toast({
        title: "Status Updated",
        description: "Maintenance task status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    },
  });

  const handleAddTask = () => {
    if (!newTask.vehicleId || !newTask.type || !newTask.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    addTaskMutation.mutate(newTask);
  };

  const handleUpdateStatus = useCallback((id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  }, [updateStatusMutation]);

  if (subscriptionLoading) {
    return <div>Loading subscription details...</div>;
  }

  if (!hasBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Maintenance Board
            <Badge variant="secondary">Business Only</Badge>
          </CardTitle>
          <CardDescription>
            Trello-style Kanban board for tracking vehicle maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Moovly Business Required</h3>
            <p className="text-muted-foreground mb-4">
              The Maintenance Board is exclusive to Moovly Business subscribers. 
              Upgrade your plan to access advanced maintenance tracking features.
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Maintenance Board
          <Badge variant="default">Business</Badge>
        </CardTitle>
        <CardDescription>
          Kanban-style board for tracking vehicle maintenance and repairs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Maintenance Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Maintenance Task</DialogTitle>
                <DialogDescription>
                  Create a new maintenance task for vehicle tracking.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle">Vehicle *</Label>
                  <Select value={newTask.vehicleId} onValueChange={(value) => setNewTask({...newTask, vehicleId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(vehicles) && vehicles.map((vehicle: Vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                          {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select value={newTask.type} onValueChange={(value) => setNewTask({...newTask, type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select maintenance type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine Service</SelectItem>
                      <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="urgent">Urgent Repair</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    placeholder="Describe the maintenance task..."
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost</Label>
                    <Input
                      placeholder="0.00"
                      value={newTask.cost}
                      onChange={(e) => setNewTask({...newTask, cost: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="performedBy">Performed By</Label>
                    <Input
                      placeholder="Technician name"
                      value={newTask.performedBy}
                      onChange={(e) => setNewTask({...newTask, performedBy: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      type="date"
                      value={newTask.performedDate}
                      onChange={(e) => setNewTask({...newTask, performedDate: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mileage">Mileage</Label>
                    <Input
                      placeholder="Current mileage"
                      value={newTask.mileageAtService}
                      onChange={(e) => setNewTask({...newTask, mileageAtService: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTask} disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending ? 'Adding...' : 'Add Task'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {recordsLoading ? (
          <div>Loading maintenance records...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(maintenanceColumns).map(([status, column]) => {
              const Icon = column.icon;
              const records = groupedRecords[status] || [];
              
              return (
                <div key={status} className={`rounded-lg border-2 ${column.color} min-h-[400px]`}>
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <h3 className="font-semibold">{column.title}</h3>
                      <Badge variant={column.badgeVariant}>{records.length}</Badge>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    {records.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                      </div>
                    ) : (
                      records.map((record: MaintenanceRecord) => (
                        <MaintenanceCard
                          key={record.id}
                          record={record}
                          vehicles={vehicles}
                          onUpdateStatus={handleUpdateStatus}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}