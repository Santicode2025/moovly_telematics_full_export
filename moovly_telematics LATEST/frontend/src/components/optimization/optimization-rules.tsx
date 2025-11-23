import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Settings, Crown, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define the optimization rules schema
const optimizationRulesSchema = z.object({
  priorityClients: z.enum(['high', 'medium', 'low']),
  timeSensitiveJobs: z.boolean(),
  routeOptimization: z.boolean(),
  fuelEfficiencyFocus: z.boolean(),
  driverPerformanceWeight: z.number().min(0).max(100),
  maxJobsPerRoute: z.number().min(1).max(20),
  emergencyJobsOnly: z.boolean(),
  weatherOptimization: z.boolean(),
  trafficAvoidance: z.boolean(),
  clientPreferences: z.boolean(),
  autoReassignment: z.boolean(),
  peakHourAdjustment: z.boolean(),
});

interface OptimizationRules {
  id?: number;
  priorityClients: "high" | "medium" | "low";
  timeSensitiveJobs: boolean;
  routeOptimization: boolean;
  fuelEfficiencyFocus: boolean;
  driverPerformanceWeight: number;
  maxJobsPerRoute: number;
  emergencyJobsOnly: boolean;
  weatherOptimization: boolean;
  trafficAvoidance: boolean;
  clientPreferences: boolean;
  autoReassignment: boolean;
  peakHourAdjustment: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Check if user has Moovly Business subscription
const useSubscriptionCheck = () => {
  // In a real app, this would check the user's subscription
  // For now, we'll simulate Business access
  return { hasBusiness: true, isLoading: false };
};

export function OptimizationRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasBusiness, isLoading: subscriptionLoading } = useSubscriptionCheck();

  // Fetch current optimization rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/optimization-rules'],
    enabled: hasBusiness,
  });

  const form = useForm<OptimizationRules>({
    resolver: zodResolver(optimizationRulesSchema),
    defaultValues: {
      priorityClients: 'medium',
      timeSensitiveJobs: true,
      routeOptimization: true,
      fuelEfficiencyFocus: false,
      driverPerformanceWeight: 50,
      maxJobsPerRoute: 8,
      emergencyJobsOnly: false,
      weatherOptimization: false,
      trafficAvoidance: true,
      clientPreferences: true,
      autoReassignment: false,
      peakHourAdjustment: true,
    },
  });

  // Set form values when rules are loaded
  useEffect(() => {
    if (rules) {
      form.reset(rules);
    }
  }, [rules, form]);

  const saveRulesMutation = useMutation({
    mutationFn: async (optimizationRules: OptimizationRules) => {
      return apiRequest('/api/optimization-rules', 'POST', optimizationRules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/optimization-rules'] });
      toast({
        title: "Rules Saved",
        description: "Smart optimization rules have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save optimization rules.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OptimizationRules) => {
    saveRulesMutation.mutate(data);
  };

  const resetToDefaults = () => {
    form.reset({
      priorityClients: 'medium',
      timeSensitiveJobs: true,
      routeOptimization: true,
      fuelEfficiencyFocus: false,
      driverPerformanceWeight: 50,
      maxJobsPerRoute: 8,
      emergencyJobsOnly: false,
      weatherOptimization: false,
      trafficAvoidance: true,
      clientPreferences: true,
      autoReassignment: false,
      peakHourAdjustment: true,
    });
    toast({
      title: "Reset Complete",
      description: "Optimization rules reset to default values.",
    });
  };

  if (subscriptionLoading) {
    return <div>Loading subscription details...</div>;
  }

  if (!hasBusiness) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Smart Optimization Rules
            <Badge variant="secondary">Business Only</Badge>
          </CardTitle>
          <CardDescription>
            Advanced route and job optimization rules for maximum efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Moovly Business Required</h3>
            <p className="text-muted-foreground mb-4">
              Smart Optimization Rules are exclusive to Moovly Business subscribers. 
              Upgrade your plan to access advanced fleet optimization features.
            </p>
            <Button variant="outline">
              Upgrade to Business
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Smart Optimization Rules
          <Badge variant="default">Business</Badge>
        </CardTitle>
        <CardDescription>
          Configure advanced AI-powered optimization for maximum fleet efficiency
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rulesLoading ? (
          <div>Loading optimization rules...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Priority Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Priority Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="priorityClients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority Clients Focus</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="high">High Priority Clients First</SelectItem>
                            <SelectItem value="medium">Balanced Approach</SelectItem>
                            <SelectItem value="low">Cost Efficiency First</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          How to prioritize jobs based on client importance
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeSensitiveJobs"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Time-Sensitive Priority</FormLabel>
                          <FormDescription>
                            Prioritize jobs with tight delivery windows
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyJobsOnly"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Emergency Mode</FormLabel>
                          <FormDescription>
                            Only accept emergency and critical jobs
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Route Optimization */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Route Optimization</h3>
                  
                  <FormField
                    control={form.control}
                    name="routeOptimization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Smart Route Planning</FormLabel>
                          <FormDescription>
                            AI-powered route optimization for efficiency
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fuelEfficiencyFocus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Fuel Efficiency Focus</FormLabel>
                          <FormDescription>
                            Prioritize fuel-efficient routes over speed
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weatherOptimization"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Weather-Based Routing</FormLabel>
                          <FormDescription>
                            Adjust routes based on weather conditions
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="trafficAvoidance"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Traffic Avoidance</FormLabel>
                          <FormDescription>
                            Dynamically avoid traffic congestion
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Driver Management */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Driver Management</h3>
                  
                  <FormField
                    control={form.control}
                    name="driverPerformanceWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Driver Performance Weight: {field.value}%</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={100}
                            step={5}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          How much driver performance affects job assignment
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxJobsPerRoute"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Jobs Per Route: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            min={1}
                            max={20}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value) => field.onChange(value[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of jobs per route for optimal efficiency
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="autoReassignment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-Reassignment</FormLabel>
                          <FormDescription>
                            Automatically reassign jobs when drivers are unavailable
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Advanced Settings</h3>
                  
                  <FormField
                    control={form.control}
                    name="clientPreferences"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Client Preferences</FormLabel>
                          <FormDescription>
                            Honor specific client delivery preferences
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="peakHourAdjustment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Peak Hour Adjustment</FormLabel>
                          <FormDescription>
                            Adjust scheduling for peak traffic hours
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={saveRulesMutation.isPending}
                >
                  {saveRulesMutation.isPending ? 'Saving...' : 'Save Rules'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetToDefaults}
                >
                  Reset to Defaults
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}