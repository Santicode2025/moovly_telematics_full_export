import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck } from "lucide-react";
import { Job, Driver, Vehicle } from "@shared/schema";

export function RecentActivity() {
  const { data: jobs, isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: drivers, isLoading: driversLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const isLoading = jobsLoading || driversLoading || vehiclesLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "En Route";
      case "pending":
        return "Loading";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getDriverName = (driverId: number | null) => {
    if (!driverId || !drivers) return "Unassigned";
    const driver = drivers.find(d => d.id === driverId);
    return driver?.name || "Unknown Driver";
  };

  const getVehicleNumber = (vehicleId: number | null) => {
    if (!vehicleId || !vehicles) return "-";
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.vehicleNumber || "-";
  };

  const recentJobs = jobs?.slice(0, 5) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-6 font-medium text-gray-600">Vehicle</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Driver</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Customer</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-600">ETA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-16 h-4" />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="w-24 h-4" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="w-32 h-4" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="w-20 h-6 rounded-full" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="w-16 h-4" />
                    </td>
                  </tr>
                ))
              ) : (
                recentJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {getVehicleNumber(job.vehicleId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900">
                      {getDriverName(job.driverId)}
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {job.customerName}
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={getStatusColor(job.status)}>
                        {getStatusLabel(job.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {job.status === "completed" ? "-" : "2:45 PM"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
