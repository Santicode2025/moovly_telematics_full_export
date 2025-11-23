import { Clock, MapPin, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export function UpcomingJobs() {
  const { data: upcomingJobs = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/upcoming-jobs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Upcoming Jobs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(upcomingJobs) || upcomingJobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Upcoming Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No upcoming jobs scheduled</p>
            <p className="text-sm text-gray-400">
              All jobs for today are completed or no future jobs are scheduled
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Upcoming Jobs
          </div>
          <Badge variant="outline" className="text-xs">
            Next {upcomingJobs.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingJobs.map((job: any) => (
          <div key={job.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-sm">#{job.jobNumber}</span>
                <Badge className={getStatusColor(job.status)} variant="outline">
                  {job.status}
                </Badge>
              </div>
              <div className="text-right text-xs text-gray-600">
                <div>{formatDate(job.scheduledDate)}</div>
                <div className="font-medium">{formatTime(job.scheduledDate)}</div>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-900">
                {job.customerName}
              </div>
              
              <div className="flex items-center text-xs text-gray-600">
                <MapPin className="h-3 w-3 mr-1" />
                <span className="truncate">{job.deliveryAddress}</span>
              </div>
              
              {job.driverId && (
                <div className="flex items-center text-xs text-gray-600">
                  <User className="h-3 w-3 mr-1" />
                  <span>Driver {job.driverId}</span>
                </div>
              )}
            </div>
            
            {job.priority && (job.priority === 'high' || job.priority === 'urgent') && (
              <div className="mt-2">
                <Badge 
                  variant="destructive" 
                  className="text-xs"
                >
                  {job.priority.toUpperCase()} PRIORITY
                </Badge>
              </div>
            )}
          </div>
        ))}
        
        <div className="pt-2 border-t text-center">
          <a 
            href="/jobs" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all jobs →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}