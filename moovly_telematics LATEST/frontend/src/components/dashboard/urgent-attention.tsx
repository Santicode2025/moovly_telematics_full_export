import { AlertTriangle, Clock, Zap, Navigation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function UrgentAttention() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [] } = useQuery({
    queryKey: ["/api/jobs"],
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
  });

  // Quick assignment mutation
  const quickAssignMutation = useMutation({
    mutationFn: async ({ jobId, driverId }: { jobId: number; driverId: number }) => {
      return await apiRequest(`/api/jobs/${jobId}`, "PATCH", { 
        driverId: driverId,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Assigned",
        description: "Urgent job has been assigned successfully",
      });
    },
  });

  // Identify urgent jobs that need attention
  const urgentJobs = Array.isArray(jobs) ? jobs.filter((job: any) => {
    const isUrgent = job.priority === 'urgent' || job.priority === 'high';
    const isUnassigned = !job.driverId;
    const isOverdue = job.scheduledDate && new Date(job.scheduledDate) < new Date();
    const isPending = job.status === 'pending';
    
    return (isUrgent || isOverdue) && (isUnassigned || isPending);
  }).slice(0, 5) : []; // Show max 5 urgent items

  const handleQuickAssign = (jobId: number) => {
    const availableDrivers = Array.isArray(drivers) ? drivers.filter((d: any) => d.status === 'active') : [];
    if (availableDrivers.length > 0) {
      quickAssignMutation.mutate({ jobId, driverId: availableDrivers[0].id });
    } else {
      toast({
        title: "No Available Drivers",
        description: "All drivers are currently busy",
        variant: "destructive",
      });
    }
  };

  const getUrgencyIcon = (job: any) => {
    if (job.priority === 'urgent') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (job.priority === 'high') return <Zap className="h-4 w-4 text-orange-500" />;
    if (new Date(job.scheduledDate) < new Date()) return <Clock className="h-4 w-4 text-red-500" />;
    return <Navigation className="h-4 w-4 text-blue-500" />;
  };

  const getUrgencyLabel = (job: any) => {
    if (job.priority === 'urgent') return 'URGENT';
    if (job.priority === 'high') return 'HIGH PRIORITY';
    if (new Date(job.scheduledDate) < new Date()) return 'OVERDUE';
    return 'NEEDS ATTENTION';
  };

  const getUrgencyColor = (job: any) => {
    if (job.priority === 'urgent' || new Date(job.scheduledDate) < new Date()) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (job.priority === 'high') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  if (urgentJobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Urgent Attention
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-green-600 text-sm font-medium">
              ✓ All jobs are under control
            </div>
            <div className="text-gray-500 text-xs mt-1">
              No urgent items require immediate attention
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <CardTitle className="flex items-center text-red-700">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Urgent Attention ({urgentJobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentJobs.map((job: any) => (
          <div 
            key={job.id} 
            className={`p-3 rounded-lg border ${getUrgencyColor(job)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getUrgencyIcon(job)}
                  <span className="font-medium text-sm">#{job.jobNumber}</span>
                  <Badge variant="outline" className="text-xs">
                    {getUrgencyLabel(job)}
                  </Badge>
                </div>
                <div className="text-sm text-gray-700 mb-1">
                  {job.customerName}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {job.deliveryAddress}
                </div>
                {job.scheduledDate && (
                  <div className="text-xs text-gray-500 mt-1">
                    Due: {new Date(job.scheduledDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="ml-2">
                {!job.driverId ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickAssign(job.id)}
                    disabled={quickAssignMutation.isPending}
                    className="text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="text-xs">
                    View
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {urgentJobs.length > 0 && (
          <div className="pt-2 border-t">
            <Button variant="link" className="text-xs text-red-600 p-0">
              View all urgent jobs →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}