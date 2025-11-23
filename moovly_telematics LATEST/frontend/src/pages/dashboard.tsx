import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { FleetPerformanceChart } from "@/components/dashboard/fleet-performance-chart";
import { RouteEfficiency } from "@/components/dashboard/route-efficiency";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import VehicleTrackingMap from "@/components/VehicleTrackingMap";
import { UrgentAttention } from "@/components/dashboard/urgent-attention";
import { UpcomingJobs } from "@/components/dashboard/upcoming-jobs";
import FeedbackWidget from "@/components/FeedbackWidget";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, Users, CheckCircle, Fuel } from "lucide-react";

interface DashboardStats {
  activeVehicles: number;
  activeDrivers: number;
  completedJobs: number;
  fuelSavings: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header title="Dashboard" />
        
        <div className="p-4 lg:p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))
            ) : (
              <>
                <StatsCard
                  title="Active Vehicles"
                  value={stats?.activeVehicles || 0}
                  icon={Truck}
                  iconColor="text-green-600"
                  iconBg="bg-green-100"
                  change="+5.2%"
                  changeLabel="from last month"
                />
                <StatsCard
                  title="Active Drivers"
                  value={stats?.activeDrivers || 0}
                  icon={Users}
                  iconColor="text-[#00A8CC]"
                  iconBg="bg-[#00A8CC]/10"
                  change="+2.1%"
                  changeLabel="from last month"
                />
                <StatsCard
                  title="Completed Jobs"
                  value={stats?.completedJobs || 0}
                  icon={CheckCircle}
                  iconColor="text-purple-600"
                  iconBg="bg-purple-100"
                  change="+8.3%"
                  changeLabel="from last month"
                />
                <StatsCard
                  title="Fuel Savings"
                  value={`${stats?.fuelSavings || 0}%`}
                  icon={Fuel}
                  iconColor="text-yellow-600"
                  iconBg="bg-yellow-100"
                  change="+1.2%"
                  changeLabel="from last month"
                />
              </>
            )}
          </div>

          {/* Urgent Attention Widget */}
          <div className="mb-8">
            <UrgentAttention />
          </div>


          {/* Interactive Vehicle Tracking Map */}
          <div className="mb-8">
            <VehicleTrackingMap />
          </div>

          {/* Charts and Tables */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <FleetPerformanceChart />
            <RouteEfficiency />
          </div>

          {/* Bottom Section - Upcoming Jobs and Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <UpcomingJobs />
            <RecentActivity />
          </div>

          {/* Feedback Widget */}
          <div className="mb-8">
            <FeedbackWidget context="dashboard" />
          </div>
        </div>
      </div>
    </div>
  );
}
