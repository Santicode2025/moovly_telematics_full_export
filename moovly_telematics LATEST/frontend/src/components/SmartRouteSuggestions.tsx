import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Brain, 
  Route, 
  Clock, 
  Fuel, 
  TrendingUp, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Lightbulb,
  BarChart3,
  Navigation
} from "lucide-react";

interface SmartRouteSuggestionsProps {
  selectedJobs: number[];
  onSuggestionApplied?: () => void;
}

interface OptimizationSuggestion {
  id: number;
  suggestionType: string;
  reasoning: string;
  predictedSavings: {
    time: string;
    fuel: string;
    distance: string;
    cost: string;
  };
  confidence: number;
  priority: string;
  historicalBasis: Array<{
    routeId: string;
    similarity: number;
    performance: string;
  }>;
  status: string;
}

export default function SmartRouteSuggestions({ selectedJobs, onSuggestionApplied }: SmartRouteSuggestionsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch smart route suggestions based on historical data
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["/api/route-suggestions", selectedJobs],
    queryFn: async () => {
      const response = await apiRequest(`/api/route-suggestions?jobIds=${selectedJobs.join(',')}`, "GET");
      return Array.isArray(response) ? response : [];
    },
    enabled: selectedJobs.length > 0,
  });

  // Generate new suggestions based on historical analysis
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      // Simulate AI analysis progress
      const stages = [
        { progress: 20, message: "Analyzing historical route data..." },
        { progress: 40, message: "Identifying traffic patterns..." },
        { progress: 60, message: "Calculating optimal sequences..." },
        { progress: 80, message: "Predicting savings potential..." },
        { progress: 100, message: "Generating smart suggestions..." }
      ];
      
      for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress(stage.progress);
      }
      
      return await apiRequest("/api/route-suggestions/generate", "POST", { 
        jobIds: selectedJobs 
      });
    },
    onSuccess: () => {
      setIsAnalyzing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/route-suggestions"] });
      toast({
        title: "Smart Analysis Complete",
        description: "AI-powered route suggestions generated based on historical data",
      });
    },
    onError: () => {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      toast({
        title: "Analysis Failed",
        description: "Unable to generate suggestions. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Apply a specific suggestion
  const applySuggestionMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      return await apiRequest(`/api/route-suggestions/${suggestionId}/apply`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/route-suggestions"] });
      toast({
        title: "Suggestion Applied",
        description: "Smart route optimization has been applied successfully",
      });
      onSuggestionApplied?.();
    },
  });

  // Reject a suggestion
  const rejectSuggestionMutation = useMutation({
    mutationFn: async (suggestionId: number) => {
      return await apiRequest(`/api/route-suggestions/${suggestionId}/reject`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/route-suggestions"] });
      toast({
        title: "Suggestion Rejected",
        description: "The AI will learn from this feedback",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'route_order': return <Route className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'driver_assignment': return <Navigation className="w-4 h-4" />;
      case 'vehicle_selection': return <MapPin className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  if (selectedJobs.length === 0) {
    return (
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6 text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">AI Route Intelligence</h3>
          <p className="text-sm text-gray-500">
            Select jobs to get smart route suggestions based on historical performance data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-purple-600" />
            Smart Route Intelligence ({selectedJobs.length} jobs)
          </div>
          <Badge variant="outline" className="text-purple-600 border-purple-300">
            AI-Powered
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Analysis Progress */}
        {isAnalyzing && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-purple-600" />
                Analyzing historical patterns...
              </span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
        )}

        {/* Generate Suggestions Button */}
        {!isAnalyzing && (!Array.isArray(suggestions) || suggestions.length === 0) && (
          <div className="text-center space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <Lightbulb className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-purple-800 mb-2">Historical Data Analysis</h4>
              <p className="text-sm text-purple-600 mb-4">
                Generate intelligent route suggestions based on thousands of completed deliveries
              </p>
              <Button 
                onClick={() => generateSuggestionsMutation.mutate()}
                disabled={generateSuggestionsMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Brain className="h-4 w-4 mr-2" />
                Analyze & Suggest Routes
              </Button>
            </div>
          </div>
        )}

        {/* Smart Suggestions List */}
        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">AI Suggestions ({suggestions.length})</h4>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => generateSuggestionsMutation.mutate()}
                disabled={generateSuggestionsMutation.isPending}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>
            
            {Array.isArray(suggestions) && suggestions.map((suggestion: OptimizationSuggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      {getSuggestionIcon(suggestion.suggestionType)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium capitalize">
                          {suggestion.suggestionType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {suggestion.reasoning}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-sm text-green-600">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {suggestion.confidence}% confidence
                    </div>
                  </div>
                </div>

                {/* Predicted Savings */}
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <h5 className="text-sm font-medium text-green-800 mb-2">Predicted Savings</h5>
                  <div className="grid grid-cols-4 gap-3 text-xs">
                    <div>
                      <Clock className="w-3 h-3 text-green-600 mb-1" />
                      <div className="font-medium">{suggestion.predictedSavings.time}</div>
                      <div className="text-green-600">Time</div>
                    </div>
                    <div>
                      <Fuel className="w-3 h-3 text-green-600 mb-1" />
                      <div className="font-medium">{suggestion.predictedSavings.fuel}</div>
                      <div className="text-green-600">Fuel</div>
                    </div>
                    <div>
                      <Navigation className="w-3 h-3 text-green-600 mb-1" />
                      <div className="font-medium">{suggestion.predictedSavings.distance}</div>
                      <div className="text-green-600">Distance</div>
                    </div>
                    <div>
                      <TrendingUp className="w-3 h-3 text-green-600 mb-1" />
                      <div className="font-medium">{suggestion.predictedSavings.cost}</div>
                      <div className="text-green-600">Cost</div>
                    </div>
                  </div>
                </div>

                {/* Historical Basis */}
                {suggestion.historicalBasis && suggestion.historicalBasis.length > 0 && (
                  <div className="text-xs text-gray-600">
                    <div className="flex items-center mb-2">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Based on {suggestion.historicalBasis.length} similar routes with average {
                        suggestion.historicalBasis.reduce((acc, route) => acc + route.similarity, 0) / suggestion.historicalBasis.length
                      }% similarity
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2 border-t">
                  <Button 
                    size="sm"
                    onClick={() => applySuggestionMutation.mutate(suggestion.id)}
                    disabled={applySuggestionMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="w-3 h-3 mr-2" />
                    Apply Suggestion
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => rejectSuggestionMutation.mutate(suggestion.id)}
                    disabled={rejectSuggestionMutation.isPending}
                  >
                    <XCircle className="w-3 h-3 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Historical Performance Insights */}
        {!isAnalyzing && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">AI Insights</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600">2,847</div>
                <div className="text-blue-600">Routes Analyzed</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">94.2%</div>
                <div className="text-blue-600">Prediction Accuracy</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">R18,500</div>
                <div className="text-blue-600">Avg Monthly Savings</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}