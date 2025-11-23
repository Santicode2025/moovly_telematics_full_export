import { useState, useCallback, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Package, 
  Zap, 
  Users,
  RotateCcw,
  AlertTriangle 
} from "lucide-react";
import type { Job, Driver } from "@shared/schema";

interface DroppableDriverCardProps {
  driver: Driver;
  jobs: Job[];
  onJobDrop: (jobId: number, driverId: number) => void;
}

interface DraggableJobCardProps {
  job: Job;
}

interface JobReassignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  targetDriverId: number | null;
  onConfirm: (reason: string, notes?: string) => void;
  conflicts: string[];
}

const ITEM_TYPE = 'job';

const JobReassignmentDialog = ({ 
  isOpen, 
  onClose, 
  job, 
  targetDriverId, 
  onConfirm, 
  conflicts 
}: JobReassignmentDialogProps) => {
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!reason) return;
    onConfirm(reason, notes);
    setReason("");
    setNotes("");
    onClose();
  };

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const targetDriver = drivers.find(d => d.id === targetDriverId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <RotateCcw className="w-5 h-5 mr-2" />
            Reassign Job
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {job && (
            <div className="p-4 bg-blue-50 rounded-lg space-y-2">
              <div className="font-medium text-blue-900">
                Job #{job.jobNumber} - {job.customerName}
              </div>
              <div className="text-sm text-blue-700">
                From: {job.pickupAddress}
              </div>
              <div className="text-sm text-blue-700">
                To: {job.deliveryAddress}
              </div>
            </div>
          )}

          {targetDriver && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-900">
                New Driver: {targetDriver.name}
              </div>
              <div className="text-sm text-green-700">
                {targetDriver.email}
              </div>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center font-medium text-red-900 mb-2">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Conflicts Detected
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {conflicts.map((conflict, index) => (
                  <li key={index}>• {conflict}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Reason for Reassignment *
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger data-testid="select-reassignment-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driver_unavailable">Driver Unavailable</SelectItem>
                <SelectItem value="workload_balancing">Workload Balancing</SelectItem>
                <SelectItem value="route_optimization">Route Optimization</SelectItem>
                <SelectItem value="customer_request">Customer Request</SelectItem>
                <SelectItem value="emergency_coverage">Emergency Coverage</SelectItem>
                <SelectItem value="driver_sick">Driver Sick Leave</SelectItem>
                <SelectItem value="vehicle_maintenance">Vehicle Maintenance</SelectItem>
                <SelectItem value="scheduling_conflict">Scheduling Conflict</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Notes (Optional)
            </label>
            <Textarea
              placeholder="Add any additional context or instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              data-testid="textarea-reassignment-notes"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-confirm-reassignment"
          >
            {conflicts.length > 0 ? "Reassign Anyway" : "Confirm Reassignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DraggableJobCard = ({ job }: DraggableJobCardProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id: job.id, job },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      ref={drag}
      className={`cursor-move transition-all duration-200 ${
        isDragging 
          ? 'opacity-50 scale-95 rotate-2 shadow-lg' 
          : 'hover:shadow-md'
      }`}
      data-testid={`job-card-${job.id}`}
    >
      <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="font-semibold text-sm">
              #{job.jobNumber}
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(job.priority || 'medium')}>
                {job.priority || 'medium'}
              </Badge>
              <Badge className={getStatusColor(job.status)}>
                {job.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-medium text-gray-900">
              {job.customerName}
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex items-center text-green-600">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{job.pickupAddress}</span>
              </div>
              <div className="flex items-center text-red-600">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{job.deliveryAddress}</span>
              </div>
            </div>

            {job.scheduledDate && (
              <div className="flex items-center text-gray-600 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(job.scheduledDate).toLocaleDateString()}
              </div>
            )}

            {job.packageCount && (
              <div className="flex items-center text-gray-600 text-xs">
                <Package className="w-3 h-3 mr-1" />
                {job.packageCount} package(s)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DroppableDriverCard = ({ driver, jobs, onJobDrop }: DroppableDriverCardProps) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    drop: (item: { id: number; job: Job }) => {
      if (item.job.driverId !== driver.id) {
        onJobDrop(item.id, driver.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const assignedJobs = jobs.filter(job => job.driverId === driver.id);
  const workloadPercentage = Math.min((assignedJobs.length / 8) * 100, 100); // Assuming 8 jobs = 100%

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div
      ref={drop}
      className={`transition-all duration-200 ${
        isOver && canDrop 
          ? 'ring-4 ring-blue-300 bg-blue-50 scale-105' 
          : canDrop 
          ? 'ring-2 ring-gray-200 hover:ring-blue-200' 
          : ''
      }`}
      data-testid={`driver-card-${driver.id}`}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              <div>
                <div className="font-medium">{driver.name}</div>
                <div className="text-sm text-gray-500 font-normal">
                  {driver.email}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="ml-2">
              {assignedJobs.length} jobs
            </Badge>
          </CardTitle>
          
          {/* Workload indicator */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Workload</span>
              <span>{Math.round(workloadPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getWorkloadColor(workloadPercentage)}`}
                style={{ width: `${workloadPercentage}%` }}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-3 min-h-[200px]">
            {assignedJobs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No jobs assigned</p>
                <p className="text-xs">Drag jobs here to assign</p>
              </div>
            ) : (
              assignedJobs.map((job) => (
                <DraggableJobCard key={job.id} job={job} />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function JobReassignmentInterface() {
  const [reassignmentDialog, setReassignmentDialog] = useState<{
    isOpen: boolean;
    job: Job | null;
    targetDriverId: number | null;
    conflicts: string[];
  }>({
    isOpen: false,
    job: null,
    targetDriverId: null,
    conflicts: []
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Socket.io listeners for real-time updates
  useEffect(() => {
    // Connect to socket.io if available (global io from index.html)
    if (typeof window !== 'undefined' && (window as any).io) {
      const socket = (window as any).io();
      
      // Listen for job reassignment events from other dispatchers
      socket.on('job-reassigned', (data: any) => {
        // Refresh job and driver data when reassignments happen
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
        
        // Show notification if not the current user's action
        toast({
          title: "Job Reassigned",
          description: `Job #${data.job?.jobNumber || 'N/A'} has been reassigned by another dispatcher.`,
        });
      });
      
      socket.on('jobs-bulk-reassigned', (data: any) => {
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
        
        toast({
          title: "Bulk Reassignment",
          description: `${data.reassignedJobs?.length || 0} jobs were reassigned by another dispatcher.`,
        });
      });
      
      return () => {
        socket.off('job-reassigned');
        socket.off('jobs-bulk-reassigned');
        socket.disconnect();
      };
    }
  }, [queryClient, toast]);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const reassignJobMutation = useMutation({
    mutationFn: async ({ jobId, newDriverId, reason, notes }: {
      jobId: number;
      newDriverId: number | null;
      reason: string;
      notes?: string;
    }) => {
      const response = await fetch('/api/jobs/reassign', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ jobId, newDriverId, reason, notes })
      });
      if (!response.ok) {
        throw new Error(`Failed to reassign job: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate both jobs and drivers queries for real-time consistency
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Job Reassigned Successfully",
        description: `Job has been reassigned to the new driver.`,
      });
      
      if (data.conflicts?.length > 0) {
        toast({
          title: "Conflicts Detected",
          description: `${data.conflicts.length} conflict(s) were detected but the job was reassigned.`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Reassignment Failed",
        description: error instanceof Error ? error.message : "Failed to reassign job",
        variant: "destructive"
      });
    },
  });

  const checkConflictsMutation = useMutation({
    mutationFn: async ({ jobId, newDriverId }: { jobId: number; newDriverId: number }) => {
      const response = await fetch(`/api/jobs/${jobId}/check-reassignment-conflicts`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer admin-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newDriverId })
      });
      if (!response.ok) {
        throw new Error(`Failed to check conflicts: ${response.statusText}`);
      }
      return response.json();
    }
  });

  const handleJobDrop = async (jobId: number, targetDriverId: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.driverId === targetDriverId) return;

    try {
      // Check for conflicts first
      const conflictResult = await checkConflictsMutation.mutateAsync({
        jobId,
        newDriverId: targetDriverId
      });

      setReassignmentDialog({
        isOpen: true,
        job,
        targetDriverId,
        conflicts: conflictResult?.conflicts || []
      });
    } catch (error) {
      // If conflict check fails, still allow reassignment but without conflict info
      setReassignmentDialog({
        isOpen: true,
        job,
        targetDriverId,
        conflicts: []
      });
    }
  };

  const handleConfirmReassignment = (reason: string, notes?: string) => {
    if (!reassignmentDialog.job || reassignmentDialog.targetDriverId === null) return;

    reassignJobMutation.mutate({
      jobId: reassignmentDialog.job.id,
      newDriverId: reassignmentDialog.targetDriverId,
      reason,
      notes
    });
  };

  // Create unassigned jobs section
  const unassignedJobs = jobs.filter(job => !job.driverId);

  if (jobsLoading || driversLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job reassignment interface...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job Reassignment</h2>
            <p className="text-gray-600">Drag and drop jobs between drivers to reassign</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Low workload</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span>Medium workload</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>High workload</span>
            </div>
          </div>
        </div>

        {/* Unassigned Jobs Section */}
        {unassignedJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                Unassigned Jobs ({unassignedJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unassignedJobs.map((job) => (
                  <DraggableJobCard key={job.id} job={job} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <DroppableDriverCard
              key={driver.id}
              driver={driver}
              jobs={jobs}
              onJobDrop={handleJobDrop}
            />
          ))}
        </div>

        {/* Reassignment Dialog */}
        <JobReassignmentDialog
          isOpen={reassignmentDialog.isOpen}
          onClose={() => setReassignmentDialog({ isOpen: false, job: null, targetDriverId: null, conflicts: [] })}
          job={reassignmentDialog.job}
          targetDriverId={reassignmentDialog.targetDriverId}
          onConfirm={handleConfirmReassignment}
          conflicts={reassignmentDialog.conflicts}
        />
      </div>
    </DndProvider>
  );
}