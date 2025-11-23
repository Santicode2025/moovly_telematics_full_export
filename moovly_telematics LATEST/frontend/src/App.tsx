import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import DriversPage from "@/pages/drivers";
import VehiclesPage from "@/pages/vehicles";
import DriverRegistrationPage from "@/pages/driver-registration";
import JobsWithTabsPage from "@/pages/jobs-with-tabs";
import AnalyticsPage from "@/pages/analytics";
import MaintenancePage from "@/pages/maintenance";
import SettingsPage from "@/pages/settings";
import AdvancedFeaturesPage from "@/pages/advanced-features";

import MessagingPage from "@/pages/messaging";
import AddressBookPage from "@/pages/address-book";
import TrackPage from "@/pages/track";
import MobileDriverPage from "@/pages/mobile-driver";
import DownloadAppPage from "@/pages/download-app";
import MobileLogin from "@/pages/mobile-login";
import NotFound from "@/pages/not-found";
import GovernmentFleetPage from "@/pages/government-fleet";
import MoovlyGoPage from "@/pages/moovly-go";
import MoovlyGoDashboardPage from "@/pages/moovly-go-dashboard";
import MoovlyGoGeofencingPage from "@/pages/moovly-go-geofencing";
import CustomerLoginPage from "@/pages/customer-login";
import CustomerDashboard from "@/pages/customer-dashboard";
import CustomerPlaceOrderPage from "@/pages/customer-place-order";
import CustomerMessagesPage from "@/pages/customer-messages";
import CustomerBulkImportPage from "@/pages/customer-bulk-import";
import CustomerColumnMappingPage from "@/pages/customer-column-mapping";
import CircuitGoPage from "@/pages/circuit-go";
import FleetReportsPage from "@/pages/fleet-reports";
import FleetMapPage from "@/pages/fleet-map";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/drivers" component={DriversPage} />
      <Route path="/vehicles" component={VehiclesPage} />

      <Route path="/jobs" component={JobsWithTabsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/reports" component={FleetReportsPage} />
      <Route path="/fleet-map" component={FleetMapPage} />
      <Route path="/maintenance" component={MaintenancePage} />
      <Route path="/advanced" component={AdvancedFeaturesPage} />
      

      <Route path="/messaging" component={MessagingPage} />
      <Route path="/address-book" component={AddressBookPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/track/:token" component={TrackPage} />
      <Route path="/mobile" component={MobileLogin} />
      <Route path="/mobile-driver" component={MobileDriverPage} />
      <Route path="/download" component={DownloadAppPage} />
      <Route path="/government" component={GovernmentFleetPage} />
      <Route path="/moovly-go" component={CircuitGoPage} />
      <Route path="/moovly-go/dashboard" component={MoovlyGoDashboardPage} />
      <Route path="/moovly-go/geofencing" component={MoovlyGoGeofencingPage} />
      <Route path="/moovly-go/legacy" component={MoovlyGoPage} />
      
      {/* Customer Portal Routes */}
      <Route path="/customer/login" component={CustomerLoginPage} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/customer/place-order" component={CustomerPlaceOrderPage} />
      <Route path="/customer/messages" component={CustomerMessagesPage} />
      <Route path="/customer/bulk-import" component={CustomerBulkImportPage} />
      <Route path="/customer/column-mapping" component={CustomerColumnMappingPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
