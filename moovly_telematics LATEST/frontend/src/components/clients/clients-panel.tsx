import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, LogIn, Ban, Clock, Crown, Building2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ClientAccount } from "@shared/schema";

export function ClientsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<ClientAccount[]>({
    queryKey: ["/api/clients"],
  });

  const loginAsClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await fetch(`/api/clients/${clientId}/login-as`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to login as client");
      return await response.json();
    },
    onSuccess: (response: any) => {
      // Redirect to client's dashboard view
      window.open(response.redirectUrl || "/dashboard", "_blank");
      toast({
        title: "Success",
        description: "Logged in as client successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to login as client",
        variant: "destructive",
      });
    },
  });

  const disableAccountMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await fetch(`/api/clients/${clientId}/disable`, { method: "PATCH" });
      if (!response.ok) throw new Error("Failed to disable client account");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Success",
        description: "Client account disabled successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to disable client account",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "paused":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case "disabled":
        return <Badge variant="destructive">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "Moovly Connect":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Building2 className="w-3 h-3 mr-1" />
          Connect
        </Badge>;
      case "Moovly Business":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Crown className="w-3 h-3 mr-1" />
          Business
        </Badge>;
      default:
        return <Badge variant="outline">{plan}</Badge>;
    }
  };

  const formatLastActivity = (date: string | Date | null | undefined) => {
    if (!date) return "Never";
    
    const now = new Date();
    const activityDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} days ago`;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Users className="h-4 w-4 mr-2" />
          Clients
          <Badge variant="secondary" className="ml-2 text-xs">
{(clients as ClientAccount[]).length}
          </Badge>
        </Button>
      </SheetTrigger>

      <SheetContent className="w-[800px] sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Panel - Client Accounts
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">Loading client accounts...</div>
                </div>
              ) : (clients as ClientAccount[]).length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-gray-500">No client accounts found</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(clients as ClientAccount[]).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">{client.clientName}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell>{getPlanBadge(client.subscriptionPlan)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastActivity(client.lastActivity || client.createdAt || '')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loginAsClientMutation.mutate(client.id)}
                              disabled={client.status === "disabled" || loginAsClientMutation.isPending}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <LogIn className="w-3 h-3 mr-1" />
                              Login as Client
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => disableAccountMutation.mutate(client.id)}
                              disabled={client.status === "disabled" || disableAccountMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Disable Account
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}