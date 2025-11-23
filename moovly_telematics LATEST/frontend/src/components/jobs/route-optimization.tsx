import { useState } from "react";
import { Route, MapPin, Clock, Navigation, Zap, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface RouteOptimizationProps {
  selectedJobs: number[];
  onClose: () => void;
}

export function RouteOptimization({ selectedJobs, onClose }: RouteOptimizationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizedRoutes, setOptimizedRoutes] = useState<any[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const optimizeRoutesMutation = useMutation({
    mutationFn: async (jobIds: number[]) => {
      setIsOptimizing(true);
      setOptimizationProgress(0);
      
      // Simulate route optimization progress
      const intervals = [20, 40, 60, 80, 95, 100];
      for (let i = 0; i < intervals.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setOptimizationProgress(intervals[i]);
      }
      
      return await apiRequest("/api/routes/optimize", "POST", { jobIds });
    },
    onSuccess: (data) => {
      setOptimizedRoutes(data.optimizedRoutes || []);
      setIsOptimizing(false);
      toast({
        title: "Routes Optimized",
        description: `Generated ${data.optimizedRoutes?.length || 0} optimized routes`,
      });
    },
    onError: () => {
      setIsOptimizing(false);
      setOptimizationProgress(0);
      toast({
        title: "Optimization Failed",
        description: "Unable to optimize routes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const applyOptimizedRoutes = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/routes/apply-optimized", "POST", { 
        routes: optimizedRoutes 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/routes"] });
      toast({
        title: "Routes Applied",
        description: "Optimized routes have been applied successfully",
      });
      onClose();
    },
  });

  const handleOptimize = () => {
    if (selectedJobs.length === 0) {
      toast({
        title: "No Jobs Selected",
        description: "Please select jobs to optimize routes",
        variant: "destructive",
      });
      return;
    }
    optimizeRoutesMutation.mutate(selectedJobs);
  };

  const getOptimizationFactors = () => [
    { icon: Clock, label: "Time of Day", status: "analyzing", description: "Current traffic patterns" },
    { icon: Navigation, label: "Distance", status: "optimizing", description: "Shortest path calculation" },
    { icon: MapPin, label: "Location Clustering", status: "complete", description: "Grouped nearby deliveries" },
    { icon: Route, label: "Traffic Conditions", status: isOptimizing ? "analyzing" : "complete", description: "Real-time traffic data" },
  ];

  const getEstimatedSavings = () => ({
    time: "2.5 hours",
    fuel: "15.2L",
    distance: "84km",
    cost: "R1,250"
  });

  if (selectedJobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Route className="h-5 w-5 mr-2" />
            Route Optimization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Select jobs to optimize routes</p>
            <p className="text-sm text-gray-400">
              Choose jobs from the table above, then optimize their delivery routes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Route className="h-5 w-5 mr-2" />
            Route Optimization ({selectedJobs.length} jobs)
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Optimization Factors */}
        <div>
          <h4 className="font-medium mb-3">Optimization Factors</h4>
          <div className="grid grid-cols-2 gap-3">
            {getOptimizationFactors().map((factor, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <factor.icon className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{factor.label}</span>
                    {factor.status === "complete" && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {factor.status === "analyzing" && <AlertCircle className="h-3 w-3 text-orange-500" />}
                  </div>
                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        {isOptimizing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Optimizing routes...</span>
              <span>{optimizationProgress}%</span>
            </div>
            <Progress value={optimizationProgress} className="h-2" />
          </div>
        )}

        {/* Estimated Savings */}
        {!isOptimizing && optimizedRoutes.length === 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Estimated Savings</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-600">Time:</span>
                <span className="font-medium ml-2">{getEstimatedSavings().time}</span>
              </div>
              <div>
                <span className="text-green-600">Fuel:</span>
                <span className="font-medium ml-2">{getEstimatedSavings().fuel}</span>
              </div>
              <div>
                <span className="text-green-600">Distance:</span>
                <span className="font-medium ml-2">{getEstimatedSavings().distance}</span>
              </div>
              <div>
                <span className="text-green-600">Cost:</span>
                <span className="font-medium ml-2">{getEstimatedSavings().cost}</span>
              </div>
            </div>
          </div>
        )}

        {/* Optimized Routes Results */}
        {optimizedRoutes.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Optimized Routes ({optimizedRoutes.length})</h4>
            {optimizedRoutes.map((route, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Route {index + 1}</Badge>
                    <span className="text-sm font-medium">Driver {route.driverId}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {route.estimatedTime} • {route.totalDistance}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {route.jobs?.length || 0} stops • {route.efficiency}% efficiency
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4 border-t">
          {optimizedRoutes.length === 0 ? (
            <Button 
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="flex-1"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isOptimizing ? "Optimizing..." : "Optimize Routes"}
            </Button>
          ) : (
            <>
              <Button 
                onClick={() => applyOptimizedRoutes.mutate()}
                disabled={applyOptimizedRoutes.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Routes
              </Button>
              <Button 
                variant="outline"
                onClick={() => setOptimizedRoutes([])}
              >
                Recalculate
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}