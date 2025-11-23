import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Calendar, Wrench, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MaintenanceRecord, Vehicle } from "@shared/schema";
import { format } from "date-fns";

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const { data: maintenanceRecords, isLoading: recordsLoading } = useQuery<MaintenanceRecord[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const isLoading = recordsLoading || vehiclesLoading;

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "routine":
        return "bg-blue-100 text-blue-800";
      case "repair":
        return "bg-red-100 text-red-800";
      case "inspection":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header title="Maintenance" />
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Maintenance</h2>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Maintenance
            </Button>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <span className="text-sm text-gray-600">Overdue</span>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {/* Calculate overdue based on nextDueDate */}
                  0
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Maintenance Records Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance Records</CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search maintenance..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Vehicle</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Cost</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Next Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <td key={j} className="py-4 px-6">
                              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 px-6 text-center text-gray-500">
                          No maintenance records found
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((record) => (
                        <tr key={record.id}>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Wrench className="h-4 w-4 text-primary" />
                              </div>
                              <span className="font-medium text-gray-900">
                                {getVehicleNumber(record.vehicleId)}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getTypeColor(record.type)}>
                              {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-900 max-w-xs truncate">
                            {record.description}
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {format(new Date(record.performedDate), "MMM d, yyyy")}
                          </td>
                          <td className="py-4 px-6 text-gray-900">
                            {record.cost ? `R${parseFloat(record.cost).toFixed(2)}` : '-'}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusColor(record.status)}>
                              {getStatusIcon(record.status)}
                              <span className="ml-1">
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </span>
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-gray-600">
                            {record.nextDueDate ? format(new Date(record.nextDueDate), "MMM d, yyyy") : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
