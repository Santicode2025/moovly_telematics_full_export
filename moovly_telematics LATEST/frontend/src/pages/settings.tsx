import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Bell, Shield, Database, HelpCircle, FileText, User, MapPin, 
  AlertTriangle, Copy, Save, Key, Cloud, Clock, BarChart3,
  Building2, Globe, Mail, Phone, CreditCard, Users, Palette,
  Upload, Truck, Download, CheckCircle, AlertCircle
} from "lucide-react";
import { detectRegionFlag, getRegionName } from "@/utils/regionUtils";
import { detectCurrency } from "@/utils/currencyUtils";

export default function SettingsPage() {
  // State for all settings
  const [distanceUnit, setDistanceUnit] = useState("auto");
  const [emailAlert, setEmailAlert] = useState(true);
  const [webAlert, setWebAlert] = useState(true);
  const [telegramAlert, setTelegramAlert] = useState(false);
  const [reportFormat, setReportFormat] = useState("pdf");
  const [apiKey, setApiKey] = useState("sk_live_mvy_1234567890abcdef");
  const [cloudStorage, setCloudStorage] = useState("none");
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Admin", 
    email: "admin@moovly.com",
    phone: "+27 11 123 4567",
    company: "Moovly Fleet Management",
    position: "Fleet Manager"
  });
  const [shiftSettings, setShiftSettings] = useState({
    standardShiftHours: 8,
    overtimeThreshold: 10,
    autoCarryOver: true,
    shiftEndWarning: 30
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    marketing: false,
  });

  // Driver permissions settings
  const [driverPermissions, setDriverPermissions] = useState({
    allowRouteAdjustment: false,
    moovlyConnectRouteAdjustment: false,
    moovlyGoRouteAdjustment: false,
  });

  // Telematics settings
  const [telematicsSettings, setTelematicsSettings] = useState({
    harshBrakingThreshold: 0.4, // g-force threshold for harsh braking
    rapidAccelerationThreshold: 0.4, // g-force threshold for rapid acceleration
    harshCorneringThreshold: 0.5, // g-force threshold for harsh cornering
    speedLimitBuffer: 10, // km/h over speed limit before alert
    speedingAlertDelay: 5, // seconds of speeding before alert
    idlingTimeThreshold: 300, // seconds before idling alert
    moovscoreUpdateInterval: 60, // seconds between score updates
    enableRealTimeAlerts: false, // real-time alerts to drivers
    enableGpsTracking: true,
    trackingInterval: 30, // GPS tracking interval in seconds
  });

  // Vehicle import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  const { toast } = useToast();
  const flag = detectRegionFlag();
  const regionName = getRegionName();
  const currency = detectCurrency();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('moovlySettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setDistanceUnit(settings.distanceUnit || "auto");
      setEmailAlert(settings.emailAlert ?? true);
      setWebAlert(settings.webAlert ?? true);
      setTelegramAlert(settings.telegramAlert ?? false);
      setReportFormat(settings.reportFormat || "pdf");
      setCloudStorage(settings.cloudStorage || "none");
      if (settings.profileData) setProfileData(settings.profileData);
      if (settings.shiftSettings) setShiftSettings(settings.shiftSettings);
      if (settings.notifications) setNotifications(settings.notifications);
      if (settings.telematicsSettings) setTelematicsSettings(settings.telematicsSettings);
      if (settings.driverPermissions) setDriverPermissions(settings.driverPermissions);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      distanceUnit,
      emailAlert,
      webAlert,
      telegramAlert,
      reportFormat,
      cloudStorage,
      profileData,
      shiftSettings,
      notifications,
      telematicsSettings,
      driverPermissions
    };
    localStorage.setItem('moovlySettings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: "API Key Copied",
      description: "API key has been copied to clipboard.",
    });
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleShiftChange = (field: string, value: any) => {
    setShiftSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTelematicsChange = (field: string, value: any) => {
    setTelematicsSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleDriverPermissionChange = (field: string, value: boolean) => {
    setDriverPermissions(prev => ({ ...prev, [field]: value }));
  };

  // Vehicle import handlers
  const handleVehicleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('vehicleFile', file);

      const response = await fetch('/api/vehicles/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportResults(result);
        toast({
          title: "Import Successful",
          description: `${result.imported} vehicles imported successfully.`,
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import vehicles. Please check file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const csvContent = `Registration,Chassis Number,Engine Number,Make,Model,Year,Current Odometer
ABC123GP,1HGBH41JXMN109186,123456789,Toyota,Hilux,2020,45000
DEF456GP,2T1BURHE0JC014702,987654321,Ford,Ranger,2019,62000
GHI789GP,JTDKB20U983114562,456789123,Isuzu,KB,2021,28000`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'vehicle_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Vehicle import template has been downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header title="Settings" />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground mt-2">
                Manage your account settings and fleet preferences
              </p>
            </div>
            <Button onClick={saveSettings} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>

          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="telematics">Telematics</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            {/* Account & Profile Settings */}
            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={profileData.firstName}
                        onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={profileData.lastName}
                        onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={profileData.company}
                      onChange={(e) => handleProfileChange('company', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => handleProfileChange('position', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Vehicle Import */}
            <TabsContent value="vehicles" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Vehicle Import
                  </CardTitle>
                  <CardDescription>
                    Import vehicle data from spreadsheet. Chassis and engine numbers are required.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-blue-600" />
                      <div>
                        <h3 className="font-medium">Download Template</h3>
                        <p className="text-sm text-gray-600">Get a pre-formatted CSV template with required fields</p>
                      </div>
                    </div>
                    <Button onClick={downloadTemplate} variant="outline" className="border-blue-200">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="vehicle-file" className="text-base font-medium">
                        Upload Vehicle Spreadsheet
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Upload a CSV file with columns: Registration, Chassis Number*, Engine Number*, Make, Model, Year, Current Odometer
                      </p>
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        id="vehicle-file"
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleVehicleImport}
                        disabled={isImporting}
                        className="hidden"
                      />
                      <label htmlFor="vehicle-file" className="cursor-pointer">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700">
                          {isImporting ? "Importing..." : "Click to upload file"}
                        </p>
                        <p className="text-sm text-gray-500">
                          CSV, Excel files supported
                        </p>
                      </label>
                    </div>

                    {importResults && (
                      <div className="mt-4 p-4 border rounded-lg bg-green-50">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h3 className="font-medium text-green-800">Import Completed</h3>
                        </div>
                        <div className="text-sm text-green-700">
                          <p>✓ {importResults.imported} vehicles imported successfully</p>
                          {importResults.errors && importResults.errors.length > 0 && (
                            <p>⚠ {importResults.errors.length} errors occurred</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-lg bg-amber-50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p className="font-medium">Required Fields:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Chassis Number (must be unique)</li>
                          <li>Engine Number (must be unique)</li>
                          <li>Registration, Make, Model, Year are also required</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notification Preferences */}
            <TabsContent value="notifications" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Alert Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to receive notifications and alerts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts and updates via email
                      </p>
                    </div>
                    <Switch checked={emailAlert} onCheckedChange={setEmailAlert} />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Web UI Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in the web interface
                      </p>
                    </div>
                    <Switch checked={webAlert} onCheckedChange={setWebAlert} />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Telegram Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send urgent alerts to Telegram
                      </p>
                    </div>
                    <Switch checked={telegramAlert} onCheckedChange={setTelegramAlert} />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications on mobile devices
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push} 
                      onCheckedChange={(value) => handleNotificationChange('push', value)} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">SMS Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send critical alerts via SMS
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.sms} 
                      onCheckedChange={(value) => handleNotificationChange('sms', value)} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* App Preferences */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Distance Unit Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how distances are displayed in the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Distance Unit</Label>
                    <Select value={distanceUnit} onValueChange={setDistanceUnit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect (by region)</SelectItem>
                        <SelectItem value="km">Kilometers (km)</SelectItem>
                        <SelectItem value="mi">Miles (mi)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Current region: {flag} {regionName} | Currency: {currency.symbol}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    MoovScore Report Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose your preferred format for MoovScore reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Report Format</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Format</SelectItem>
                        <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                        <SelectItem value="csv">CSV Format</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Driver Shift & Overtime Rules
                  </CardTitle>
                  <CardDescription>
                    Configure shift durations and overtime policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Standard Shift Hours</Label>
                      <Input
                        type="number"
                        value={shiftSettings.standardShiftHours}
                        onChange={(e) => handleShiftChange('standardShiftHours', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Overtime Threshold (hours)</Label>
                      <Input
                        type="number"
                        value={shiftSettings.overtimeThreshold}
                        onChange={(e) => handleShiftChange('overtimeThreshold', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Shift End Warning (minutes before)</Label>
                    <Input
                      type="number"
                      value={shiftSettings.shiftEndWarning}
                      onChange={(e) => handleShiftChange('shiftEndWarning', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Auto Job Carry-Over</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically carry incomplete jobs to next shift
                      </p>
                    </div>
                    <Switch 
                      checked={shiftSettings.autoCarryOver} 
                      onCheckedChange={(value) => handleShiftChange('autoCarryOver', value)} 
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Driver Route Adjustment Permissions
                  </CardTitle>
                  <CardDescription>
                    Control which drivers can manually adjust their delivery routes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Allow Route Adjustments</Label>
                      <p className="text-sm text-muted-foreground">
                        Master control for all driver route adjustments
                      </p>
                    </div>
                    <Switch 
                      checked={driverPermissions.allowRouteAdjustment} 
                      onCheckedChange={(value) => handleDriverPermissionChange('allowRouteAdjustment', value)} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Moovly Connect Routes</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow fleet management drivers to adjust their routes
                      </p>
                    </div>
                    <Switch 
                      checked={driverPermissions.moovlyConnectRouteAdjustment} 
                      onCheckedChange={(value) => handleDriverPermissionChange('moovlyConnectRouteAdjustment', value)}
                      disabled={!driverPermissions.allowRouteAdjustment}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Moovly Go Routes</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow courier drivers to adjust their delivery routes
                      </p>
                    </div>
                    <Switch 
                      checked={driverPermissions.moovlyGoRouteAdjustment} 
                      onCheckedChange={(value) => handleDriverPermissionChange('moovlyGoRouteAdjustment', value)}
                      disabled={!driverPermissions.allowRouteAdjustment}
                    />
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Dispatcher Control:</strong> Route adjustments must be enabled here before drivers can modify their routes. This gives dispatchers full control over route flexibility.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Telematics Settings */}
            <TabsContent value="telematics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Harsh Events Detection
                  </CardTitle>
                  <CardDescription>
                    Configure g-force thresholds for detecting harsh driving events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Harsh Braking Threshold (g-force)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="1.0"
                        value={telematicsSettings.harshBrakingThreshold}
                        onChange={(e) => handleTelematicsChange('harshBrakingThreshold', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 0.4g (recommended for commercial vehicles)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Rapid Acceleration Threshold (g-force)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="1.0"
                        value={telematicsSettings.rapidAccelerationThreshold}
                        onChange={(e) => handleTelematicsChange('rapidAccelerationThreshold', parseFloat(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 0.4g (recommended for commercial vehicles)
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Harsh Cornering Threshold (g-force)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="1.0"
                      value={telematicsSettings.harshCorneringThreshold}
                      onChange={(e) => handleTelematicsChange('harshCorneringThreshold', parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default: 0.5g (lateral g-force for harsh cornering)
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>G-Force Reference:</strong> 1g = 9.8 m/s². Commercial vehicles typically use 0.4g for braking/acceleration and 0.5g for cornering thresholds.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Speed Monitoring
                  </CardTitle>
                  <CardDescription>
                    Configure speed limit monitoring and violation thresholds
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Speed Limit Buffer (km/h)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        value={telematicsSettings.speedLimitBuffer}
                        onChange={(e) => handleTelematicsChange('speedLimitBuffer', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default: 10 km/h over posted speed limit
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Speeding Alert Delay (seconds)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={telematicsSettings.speedingAlertDelay}
                        onChange={(e) => handleTelematicsChange('speedingAlertDelay', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Time driver must exceed limit before alert
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-amber-800">
                      <strong>Speed Monitoring:</strong> System will alert when drivers exceed speed limits by more than {telematicsSettings.speedLimitBuffer} km/h for {telematicsSettings.speedingAlertDelay} seconds or more.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tracking & Monitoring
                  </CardTitle>
                  <CardDescription>
                    Configure GPS tracking and monitoring intervals
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GPS Tracking Interval (seconds)</Label>
                      <Input
                        type="number"
                        min="10"
                        max="300"
                        value={telematicsSettings.trackingInterval}
                        onChange={(e) => handleTelematicsChange('trackingInterval', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        How often to record GPS location
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Idling Alert Threshold (seconds)</Label>
                      <Input
                        type="number"
                        min="60"
                        max="1800"
                        value={telematicsSettings.idlingTimeThreshold}
                        onChange={(e) => handleTelematicsChange('idlingTimeThreshold', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Alert when vehicle idles for this duration
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>MoovScore Update Interval (seconds)</Label>
                    <Input
                      type="number"
                      min="30"
                      max="300"
                      value={telematicsSettings.moovscoreUpdateInterval}
                      onChange={(e) => handleTelematicsChange('moovscoreUpdateInterval', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground">
                      How often to recalculate driver performance scores
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable GPS Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Track vehicle locations and routes
                      </p>
                    </div>
                    <Switch 
                      checked={telematicsSettings.enableGpsTracking} 
                      onCheckedChange={(value) => handleTelematicsChange('enableGpsTracking', value)} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Real-time Driver Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Send instant alerts to drivers for harsh events
                      </p>
                    </div>
                    <Switch 
                      checked={telematicsSettings.enableRealTimeAlerts} 
                      onCheckedChange={(value) => handleTelematicsChange('enableRealTimeAlerts', value)} 
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security & API */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Key Access
                    <Badge variant="secondary">Moovly Business</Badge>
                  </CardTitle>
                  <CardDescription>
                    Manage your API key for integrations and third-party access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <Input type="text" value={apiKey} readOnly className="font-mono" />
                      <Button variant="outline" onClick={copyApiKey} className="flex items-center gap-2">
                        <Copy className="h-4 w-4" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Keep your API key secure. It provides full access to your fleet data.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage your account security and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    Enable Two-Factor Authentication
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Login History
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Management */}
            <TabsContent value="data" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Cloud Storage Settings
                    <Badge variant="secondary">Business Only</Badge>
                  </CardTitle>
                  <CardDescription>
                    Configure cloud storage synchronization for your fleet data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cloud Storage Provider</Label>
                    <Select value={cloudStorage} onValueChange={setCloudStorage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="gdrive">Google Drive</SelectItem>
                        <SelectItem value="onedrive">Microsoft OneDrive</SelectItem>
                        <SelectItem value="dropbox">Dropbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {cloudStorage !== "none" && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Sync enabled with {cloudStorage === "gdrive" ? "Google Drive" : 
                        cloudStorage === "onedrive" ? "OneDrive" : "Dropbox"}. 
                        Reports and data will be automatically backed up.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Export, backup, or delete your fleet data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Export All Data
                  </Button>
                  <Button variant="outline" className="w-full">
                    Download Backup
                  </Button>
                  <Separator />
                  <Button variant="destructive" className="w-full">
                    Delete All Data
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Support & Legal */}
            <TabsContent value="support" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Support & Help
                  </CardTitle>
                  <CardDescription>
                    Get help with your account and technical issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Community Forum
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Legal & Compliance
                  </CardTitle>
                  <CardDescription>
                    Review terms, privacy policy, and compliance information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Privacy Policy
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Terms of Service
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Data Processing Agreement
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Compliance Documentation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}