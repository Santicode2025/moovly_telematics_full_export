import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Truck, Home, Users, ClipboardList, BarChart3, Wrench, Settings, FileText, UserPlus, MessageSquare, Menu, X, BookOpen, MapPin, Package, Smartphone, Map } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
// Moovly logo as SVG to reduce bundle size
const MoovlyLogo = () => (
  <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="8" fill="#1e3a8a"/>
    <text x="60" y="25" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="white" textAnchor="middle">Moovly</text>
  </svg>
);

const mainNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Vehicles", href: "/vehicles", icon: Truck },
  { name: "Jobs", href: "/jobs", icon: ClipboardList },
  { name: "Fleet Map", href: "/fleet-map", icon: Map },
  { name: "Messages", href: "/messaging", icon: MessageSquare },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
];

// Moovly Go navigation removed - placed on backburner for future use

// Driver Apps section removed as requested

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch messages to calculate unread driver count
  const { data: allMessages = [] } = useQuery({
    queryKey: ['/api/messages'],
  });

  // Calculate how many unique drivers have sent unread messages
  const unreadDriverCount = () => {
    if (!Array.isArray(allMessages)) return 0;
    
    const unreadDrivers = new Set();
    allMessages.forEach((msg: any) => {
      // Only count messages FROM drivers (not dispatcher) that are unread
      if (msg.fromUserId !== 1 && !msg.isRead) {
        unreadDrivers.add(msg.fromUserId);
      }
    });
    
    return unreadDrivers.size;
  };

  const driverMessageCount = unreadDriverCount();

  const renderNavItem = (item: any) => {
    const isActive = location === item.href;
    const isMessagesTab = item.href === "/messaging";
    const showBadge = isMessagesTab && driverMessageCount > 0;
    const hasCustomBadge = item.badge;
    
    return (
      <Link key={item.name} href={item.href}>
        <a
          className={cn(
            "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          )}
        >
          <item.icon
            className={cn(
              "mr-3 h-4 w-4",
              isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
            )}
          />
          {item.name}
          {showBadge && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm">
              {driverMessageCount}
            </span>
          )}
          {hasCustomBadge && (
            <span className={cn(
              "ml-auto text-xs px-2 py-1 rounded-full font-semibold",
              item.badge === "GO" ? "bg-sky-100 text-sky-700" : "bg-green-100 text-green-700"
            )}>
              {item.badge}
            </span>
          )}
        </a>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "bg-white shadow-sm border-r border-gray-200 min-h-screen flex flex-col transition-transform duration-300 ease-in-out",
        // Desktop - Always visible
        "lg:flex lg:w-64 lg:relative",
        // Mobile
        "fixed inset-y-0 left-0 z-50 w-64",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 flex-1">
        <div className="flex items-center justify-center mb-8">
          <MoovlyLogo />
        </div>
        
        {/* Main Navigation */}
        <nav className="space-y-2">
          {mainNavigation.map((item) => renderNavItem(item))}
        </nav>


        {/* Driver Apps section removed as requested */}
        </div>
        
        {/* Bottom Navigation - Settings positioned at bottom left */}
        <div className="p-6 border-t border-gray-100">
          <nav className="space-y-2">
            {bottomNavigation.map((item) => renderNavItem(item))}
          </nav>
        </div>
      </div>
    </>
  );
}
