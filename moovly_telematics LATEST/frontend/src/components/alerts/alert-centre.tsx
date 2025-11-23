import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, CheckCircle, X, Settings, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { apiRequest } from "@/lib/queryClient";

interface Alert {
  id: number;
  type: string;
  message: string;
  severity: string;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean | null;
  isResolved: boolean | null;
  createdAt: string;
  updatedAt: string;
}

const AlertIcon = ({ type, severity }: { type: string; severity: string }) => {
  const getIcon = () => {
    switch (type) {
      case 'job_incomplete':
        return <Clock className="h-4 w-4" />;
      case 'fuel_missing':
        return <AlertTriangle className="h-4 w-4" />;
      case 'route_deviation':
        return <AlertTriangle className="h-4 w-4" />;
      case 'driver_shift_end':
        return <Clock className="h-4 w-4" />;
      case 'checklist_flagged':
        return <CheckCircle className="h-4 w-4" />;
      case 'geofence_event':
        return <MapPin className="h-4 w-4" />;
      case 'pin_help_request':
        return <MapPin className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getColor = () => {
    // Special handling for PIN help requests - always use red
    if (type === 'pin_help_request') {
      return 'text-red-600';
    }
    
    switch (severity) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return <span className={getColor()}>{getIcon()}</span>;
};

const PriorityBadge = ({ severity }: { severity: string }) => {
  const getVariant = () => {
    switch (severity) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant() as any} className="text-xs">
      {severity?.toUpperCase()}
    </Badge>
  );
};

export function AlertCentre() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["/api/alerts"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest(`/api/alerts/${alertId}/read`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
    },
  });

  const markAsResolvedMutation = useMutation({
    mutationFn: async (alertId: number) => {
      await apiRequest(`/api/alerts/${alertId}/resolve`, {
        method: "PUT",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/alerts/unread"] });
    },
  });

  const unreadAlerts = alerts.filter((alert: Alert) => !alert.isRead);
  const readAlerts = alerts.filter((alert: Alert) => alert.isRead && !alert.isResolved);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Alert Centre</h3>
        <Button variant="ghost" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-96">
        {alerts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm">No alerts at this time</p>
            <p className="text-xs text-gray-400">Your fleet is running smoothly</p>
          </div>
        ) : (
          <div className="space-y-1">
            {/* Unread Alerts */}
            {unreadAlerts.length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    New Alerts ({unreadAlerts.length})
                  </p>
                </div>
                {unreadAlerts.map((alert: Alert) => (
                  <div
                    key={alert.id}
                    className="p-3 hover:bg-gray-50 border-l-4 border-l-red-500 bg-red-50/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <AlertIcon type={alert.type} severity={alert.severity} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <PriorityBadge severity={alert.severity} />
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                            </p>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => markAsReadMutation.mutate(alert.id)}
                              >
                                Mark Read
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => markAsResolvedMutation.mutate(alert.id)}
                              >
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Read Alerts */}
            {readAlerts.length > 0 && (
              <>
                {unreadAlerts.length > 0 && <Separator />}
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Recent Alerts
                  </p>
                </div>
                {readAlerts.slice(0, 5).map((alert: Alert) => (
                  <div
                    key={alert.id}
                    className="p-3 hover:bg-gray-50 opacity-75"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <AlertIcon type={alert.type} severity={alert.severity} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {alert.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <PriorityBadge severity={alert.severity} />
                          </div>
                          <p className="text-sm text-gray-500 mb-2">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => markAsResolvedMutation.mutate(alert.id)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-gray-50">
        <Button variant="outline" size="sm" className="w-full">
          View All Alerts
        </Button>
      </div>
    </div>
  );
}