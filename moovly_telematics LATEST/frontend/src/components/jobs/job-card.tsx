import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, User, AlertTriangle, Zap, Eye, Edit, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JobCardProps {
  job: any;
  onAssign: (jobId: number, driverId: number) => void;
  onUnassign: (jobId: number) => void;
}

export function JobCard({ job, onAssign, onUnassign }: JobCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
  });

  const assignMutation = useMutation({
    mutationFn: async ({ driverId }: { driverId: number }) => {
      return await apiRequest(`/api/jobs/${job.id}`, "PATCH", { 
        driverId: driverId,
        status: 'assigned'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setIsAssigning(false);
      toast({
        title: "Job Assigned",
        description: `Job #${job.jobNumber} has been assigned successfully`,
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/jobs/${job.id}`, "PATCH", { 
        driverId: null,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Job Unassigned",
        description: `Job #${job.jobNumber} has been unassigned`,
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'assigned':
        return <User className="h-4 w-4" />;
      case 'in-progress':
        return <Zap className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleQuickAssign = () => {
    const availableDrivers = Array.isArray(drivers) ? drivers.filter((d: any) => d.status === 'active') : [];
    if (availableDrivers.length > 0) {
      assignMutation.mutate({ driverId: availableDrivers[0].id });
    } else {
      toast({
        title: "No Available Drivers",
        description: "All drivers are currently busy",
        variant: "destructive",
      });
    }
  };

  const handleManualAssign = (driverId: string) => {
    if (driverId) {
      assignMutation.mutate({ driverId: parseInt(driverId) });
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${
      job.priority === 'urgent' ? 'border-l-4 border-l-red-500' : 
      job.priority === 'high' ? 'border-l-4 border-l-orange-500' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold flex items-center">
            #{job.jobNumber}
            {(job.priority === 'urgent' || job.priority === 'high') && (
              <Badge className={`ml-2 text-xs ${getPriorityColor(job.priority)}`}>
                {job.priority?.toUpperCase()}
              </Badge>
            )}
          </CardTitle>
          <Badge className={`${getStatusColor(job.status)} border`}>
            {getStatusIcon(job.status)}
            <span className="ml-1">{job.status}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Customer Information */}
        <div>
          <h4 className="font-medium text-gray-900 mb-1">{job.customerName}</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
              <div>
                <div className="font-medium">Pickup:</div>
                <div className="text-xs">{job.pickupAddress}</div>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
              <div>
                <div className="font-medium">Delivery:</div>
                <div className="text-xs">{job.deliveryAddress}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scheduled Time */}
        {job.scheduledDate && (
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>{formatDate(job.scheduledDate)} at {formatTime(job.scheduledDate)}</span>
          </div>
        )}

        {/* Driver Assignment */}
        <div className="space-y-2">
          {job.driverId ? (
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    D{job.driverId}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Driver {job.driverId}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => unassignMutation.mutate()}
                disabled={unassignMutation.isPending}
                className="text-red-600 hover:text-red-700"
              >
                Unassign
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={handleQuickAssign}
                  disabled={assignMutation.isPending}
                  className="flex-1"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Quick Assign
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
              
              {isAssigning && (
                <Select onValueChange={handleManualAssign}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose specific driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(drivers) && drivers.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {driver.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span>{driver.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {driver.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {!isAssigning && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAssigning(true)}
                  className="w-full text-xs"
                >
                  Choose Specific Driver
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Additional Info */}
        {job.notes && (
          <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
            <strong>Notes:</strong> {job.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}