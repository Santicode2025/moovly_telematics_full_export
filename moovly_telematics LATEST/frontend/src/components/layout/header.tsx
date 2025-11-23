import { useState, useEffect } from "react";
import { Bell, User, LogOut, Settings, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertCentre } from "@/components/alerts/alert-centre";
import { ClientsPanel } from "@/components/clients/clients-panel";
import { useQuery } from "@tanstack/react-query";
import { detectRegionFlag, initializeIPDetection } from "@/utils/regionUtils";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [flag, setFlag] = useState(detectRegionFlag());
  
  const { data: alerts = [] } = useQuery({
    queryKey: ["/api/alerts/unread"],
  });

  const unreadCount = Array.isArray(alerts) ? alerts.length : 0;

  // Initialize IP-based geolocation detection
  useEffect(() => {
    const loadIPDetection = async () => {
      await initializeIPDetection();
      setFlag(detectRegionFlag());
    };
    
    loadIPDetection();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <span className="text-2xl">{flag}</span>
          </div>
          <div className="flex items-center space-x-4">
            {/* Clients Panel */}
            <ClientsPanel />
            
            {/* Alert Centre */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative p-2 hover:bg-gray-100">
                  <div className="relative flex items-center justify-center">
                    {/* Red map pin icon matching the image */}
                    <div className="relative">
                      <MapPin className="h-8 w-8 text-red-500 fill-red-500" />
                    </div>
                    {/* Red notification badge with white text */}
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-0" align="end">
                <AlertCentre />
              </PopoverContent>
            </Popover>
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700">John Smith</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => {
                    window.location.href = '/api/logout';
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Off
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
