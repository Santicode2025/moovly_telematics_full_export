import { useState, useEffect } from "react";
import { Bell, BellOff, Settings, TestTube, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/services/NotificationService";

interface NotificationPreferences {
  jobAssignments: boolean;
  jobUpdates: boolean;
  routeOptimization: boolean;
  breakReminders: boolean;
  systemAlerts: boolean;
}

interface NotificationManagerProps {
  authToken?: string;
  isDriver?: boolean;
}

export function NotificationManager({ authToken, isDriver = true }: NotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    jobAssignments: true,
    jobUpdates: true,
    routeOptimization: true,
    breakReminders: true,
    systemAlerts: true
  });
  
  const loadPreferences = async () => {
    if (!authToken) return;
    
    try {
      const loadedPrefs = await NotificationService.getPreferences(authToken);
      if (loadedPrefs) {
        setPreferences(loadedPrefs);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  };
  const { toast } = useToast();

  useEffect(() => {
    initializeNotifications();
  }, [authToken]);

  useEffect(() => {
    if (authToken && isSubscribed) {
      loadPreferences();
    }
  }, [authToken, isSubscribed]);

  const initializeNotifications = async () => {
    setIsLoading(true);
    
    // Check if notifications are supported
    const supported = NotificationService.isSupported();
    setIsSupported(supported);
    
    if (supported) {
      // Initialize the service
      const initialized = await NotificationService.initialize();
      
      if (initialized) {
        // Check current permission
        setPermission(NotificationService.getPermissionStatus());
        
        // Check if subscribed
        const subscribed = await NotificationService.isSubscribed();
        setIsSubscribed(subscribed);
      }
    }
    
    setIsLoading(false);
  };

  const handleSubscribe = async () => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to enable notifications",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await NotificationService.subscribe(authToken);
      if (success) {
        setIsSubscribed(true);
        setPermission('granted');
        await loadPreferences(); // Load preferences after successful subscription
        toast({
          title: "🔔 Notifications Enabled!",
          description: "You'll now receive push notifications for job updates",
        });
      } else {
        toast({
          title: "Failed to Enable Notifications",
          description: "Please check your browser settings and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleUnsubscribe = async () => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to disable notifications",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await NotificationService.unsubscribe(authToken);
      if (success) {
        setIsSubscribed(false);
        toast({
          title: "Notifications Disabled",
          description: "You will no longer receive push notifications",
        });
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleSendTest = async () => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send test notifications",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await NotificationService.sendTestNotification(authToken);
      if (success) {
        toast({
          title: "Test Sent",
          description: "Check your notifications for the test message",
        });
      } else {
        toast({
          title: "Test Failed",
          description: "Unable to send test notification",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!authToken) {
      toast({
        title: "Authentication Required",
        description: "Please log in to update preferences",
        variant: "destructive",
      });
      return;
    }
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      await NotificationService.updatePreferences(authToken, newPreferences);
      toast({
        title: "Preferences Updated",
        description: "Notification settings have been saved",
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update notification preferences",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>;
    }
    
    if (permission === 'denied') {
      return <Badge variant="destructive">Permission Denied</Badge>;
    }
    
    if (isSubscribed) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    
    return <Badge variant="outline">Inactive</Badge>;
  };

  if (!isDriver) {
    return null; // Only show for drivers
  }

  return (
    <Card className="w-full max-w-md" data-testid="notification-manager">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isSupported && (
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        )}

        {isSupported && permission === 'denied' && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 mb-2">
              Notifications are blocked. To enable:
            </p>
            <ol className="text-xs text-red-700 list-decimal list-inside space-y-1">
              <li>Click the lock icon in your address bar</li>
              <li>Set notifications to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        )}

        {isSupported && (
          <div className="space-y-4">
            {/* Subscription Controls */}
            <div className="flex gap-2">
              {!isSubscribed ? (
                <Button 
                  onClick={handleSubscribe}
                  disabled={isLoading || permission === 'denied'}
                  className="flex-1"
                  data-testid="subscribe-button"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  {isLoading ? "Enabling..." : "Enable Notifications"}
                </Button>
              ) : (
                <Button 
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                  data-testid="unsubscribe-button"
                >
                  <BellOff className="w-4 h-4 mr-2" />
                  {isLoading ? "Disabling..." : "Disable Notifications"}
                </Button>
              )}
              
              {isSubscribed && (
                <Button 
                  onClick={handleSendTest}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                  data-testid="test-notification-button"
                >
                  <TestTube className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Notification Preferences */}
            {isSubscribed && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Notification Preferences
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="job-assignments" className="text-sm">
                      New Job Assignments
                    </Label>
                    <Switch
                      id="job-assignments"
                      checked={preferences.jobAssignments}
                      onCheckedChange={(checked) => handlePreferenceChange('jobAssignments', checked)}
                      data-testid="pref-job-assignments"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="job-updates" className="text-sm">
                      Job Updates
                    </Label>
                    <Switch
                      id="job-updates"
                      checked={preferences.jobUpdates}
                      onCheckedChange={(checked) => handlePreferenceChange('jobUpdates', checked)}
                      data-testid="pref-job-updates"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="route-optimization" className="text-sm">
                      Route Optimization
                    </Label>
                    <Switch
                      id="route-optimization"
                      checked={preferences.routeOptimization}
                      onCheckedChange={(checked) => handlePreferenceChange('routeOptimization', checked)}
                      data-testid="pref-route-optimization"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="break-reminders" className="text-sm">
                      Break Reminders
                    </Label>
                    <Switch
                      id="break-reminders"
                      checked={preferences.breakReminders}
                      onCheckedChange={(checked) => handlePreferenceChange('breakReminders', checked)}
                      data-testid="pref-break-reminders"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="system-alerts" className="text-sm">
                      System Alerts
                    </Label>
                    <Switch
                      id="system-alerts"
                      checked={preferences.systemAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange('systemAlerts', checked)}
                      data-testid="pref-system-alerts"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center gap-1">
                {isSupported ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                Browser Support: {isSupported ? "Yes" : "No"}
              </div>
              <div className="flex items-center gap-1">
                {permission === 'granted' ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                Permission: {permission.charAt(0).toUpperCase() + permission.slice(1)}
              </div>
              <div className="flex items-center gap-1">
                {isSubscribed ? (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                Subscription: {isSubscribed ? "Active" : "Inactive"}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}