import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle, 
  Package,
  ArrowLeft,
  GripVertical,
  MoreHorizontal
} from "lucide-react";

interface Job {
  id: number;
  jobNumber: string;
  customerName: string;
  pickupAddress: string;
  deliveryAddress: string;
  scheduledDate: string;
  status: string;
  priority: string;
  orderPriority?: 'first' | 'auto' | 'last';
  jobType?: 'delivery' | 'pickup';
  arrivalTime?: string;
  timeAtStop?: number;
  driverId: number | null;
  pickupName?: string;
  deliveryName?: string;
  packages?: number;
  notes?: string;
  lat?: number;
  lng?: number;
}

interface CircuitDriverInterfaceProps {
  jobs: Job[];
  currentLocation: { lat: number; lng: number } | null;
  onJobSelect?: (job: Job) => void;
  onJobComplete?: (jobId: number) => void;
  onJobReorder?: (jobs: Job[]) => void;
  canReorderJobs?: boolean;
}

export default function CircuitDriverInterface({
  jobs,
  currentLocation,
  onJobSelect,
  onJobComplete,
  onJobReorder,
  canReorderJobs = false
}: CircuitDriverInterfaceProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [mapCenter] = useState({ lat: -26.2041, lng: 28.0473 }); // Johannesburg default
  const [reorderableJobs, setReorderableJobs] = useState<Job[]>(jobs);

  useEffect(() => {
    setReorderableJobs(jobs);
  }, [jobs]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    onJobSelect?.(job);
  };

  const handleJobReorder = (dragIndex: number, dropIndex: number) => {
    if (!canReorderJobs) return;
    
    const newJobs = [...reorderableJobs];
    const draggedJob = newJobs[dragIndex];
    newJobs.splice(dragIndex, 1);
    newJobs.splice(dropIndex, 0, draggedJob);
    
    setReorderableJobs(newJobs);
    onJobReorder?.(newJobs);
  };

  const getJobTypeColor = (job: Job) => {
    if (job.jobType === 'pickup') return 'bg-green-500';
    if (job.jobType === 'delivery') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const getPriorityBadge = (job: Job) => {
    if (job.orderPriority === 'first') return { text: 'First', color: 'bg-red-100 text-red-700' };
    if (job.orderPriority === 'last') return { text: 'Last', color: 'bg-yellow-100 text-yellow-700' };
    return { text: 'Auto', color: 'bg-gray-100 text-gray-700' };
  };

  if (selectedJob) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Job Details Header */}
        <div className="bg-white border-b p-4 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedJob(null)}
            className="mr-3 p-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getJobTypeColor(selectedJob)}`} />
              <span className="font-medium">Stop {selectedJob.jobNumber}</span>
              <Badge variant="outline" className={getPriorityBadge(selectedJob).color}>
                {getPriorityBadge(selectedJob).text}
              </Badge>
            </div>
            <p className="text-sm text-gray-600">{selectedJob.customerName}</p>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Map View for Selected Job */}
        <div className="flex-1 bg-gray-100 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Map showing route to:</p>
              <p className="font-medium">{selectedJob.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="bg-white border-t p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Customer</p>
              <p className="font-medium">{selectedJob.customerName}</p>
            </div>
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-medium capitalize">{selectedJob.jobType || 'Delivery'}</p>
            </div>
            {selectedJob.arrivalTime && (
              <div>
                <p className="text-gray-600">Arrival Time</p>
                <p className="font-medium">{selectedJob.arrivalTime}</p>
              </div>
            )}
            <div>
              <p className="text-gray-600">Time at Stop</p>
              <p className="font-medium">{selectedJob.timeAtStop || 5} min</p>
            </div>
          </div>

          <div>
            <p className="text-gray-600 text-sm">Address</p>
            <p className="font-medium">{selectedJob.deliveryAddress}</p>
          </div>

          {selectedJob.notes && (
            <div>
              <p className="text-gray-600 text-sm">Notes</p>
              <p className="text-sm">{selectedJob.notes}</p>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setSelectedJob(null)}
            >
              Done
            </Button>
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => onJobComplete?.(selectedJob.id)}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Navigate
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Route Summary Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Today's Route</h2>
            <p className="text-sm text-gray-600">
              {reorderableJobs.length} stops • {reorderableJobs.filter(j => j.status !== 'completed').length} remaining
            </p>
          </div>
          <Button variant="outline" size="sm" className="bg-blue-600 text-white">
            Start Route
          </Button>
        </div>
      </div>

      {/* Map View */}
      <div className="h-64 bg-gray-100 relative border-b">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Route map with {reorderableJobs.length} stops</p>
            <p className="text-xs text-gray-500">Blue lines show delivery route</p>
          </div>
        </div>
        
        {/* Route Time Info */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-gray-600" />
              <span>2h 24m</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-gray-600" />
              <span>{reorderableJobs.length} stops</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {reorderableJobs.map((job, index) => (
              <Card 
                key={job.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  job.status === 'completed' ? 'opacity-60' : ''
                }`}
                onClick={() => handleJobClick(job)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    {/* Job Number Badge */}
                    <div className={`w-8 h-8 rounded-full ${getJobTypeColor(job)} text-white text-sm font-medium flex items-center justify-center`}>
                      {index + 1}
                    </div>
                    
                    {/* Job Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-medium truncate">{job.customerName}</p>
                        <Badge variant="outline" className={`text-xs ${getPriorityBadge(job).color}`}>
                          {getPriorityBadge(job).text}
                        </Badge>
                        {job.jobType && (
                          <Badge variant="outline" className="text-xs">
                            {job.jobType}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">{job.deliveryAddress}</p>
                      {job.arrivalTime && (
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1 text-gray-500" />
                          <span className="text-xs text-gray-500">{job.arrivalTime}</span>
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center space-x-2">
                      {job.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {canReorderJobs && job.status !== 'completed' && (
                        <div className="cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}