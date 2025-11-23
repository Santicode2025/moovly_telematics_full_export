import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export function FleetPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4" />
            <p className="font-medium">Performance Chart</p>
            <p className="text-sm">Real-time fleet performance analytics would be displayed here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
