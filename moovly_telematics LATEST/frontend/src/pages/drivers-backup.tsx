import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter, Eye, Edit, Trash2, Clock, MapPin, Star, AlertCircle, Users, UserPlus, CheckCircle, MessageSquare, RefreshCw, Wifi, WifiOff, Copy, Truck, FileSpreadsheet, Upload, Download } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Driver } from "@shared/schema";

export default function DriversPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [newDriver, setNewDriver] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    idNumber: "",
    status: "active",
    vehicleId: "",
    currentRoute: "",
    performance: "85",
    shiftStart: "08:00",
    shiftEnd: "17:00",
    emergencyContact: "",
    address: "",
    dateOfBirth: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    bankAccountNumber: "",
    medicalConditions: "",
    notes: "",
    taxNumber: "",
    workingDays: "monday-friday",
    hourlyRate: ""
  });
  
  // Registration states for OTP functionality
  const [registrationStep, setRegistrationStep] = useState<'form' | 'otp' | 'completed'>('form');
  const [registrationToken, setRegistrationToken] = useState<string>("");
  const [otpCode, setOtpCode] = useState("");
  const [driverCredentials, setDriverCredentials] = useState<{username: string, pin: string} | null>(null);
  
  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: drivers, isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  // Add driver mutation
  const addDriverMutation = useMutation({
    mutationFn: async (driverData: any) => {
      // Generate username from name (first name + last initial)
      const nameParts = driverData.name.split(' ');
      const firstName = nameParts[0]?.toLowerCase() || '';
      const lastInitial = nameParts[nameParts.length - 1]?.charAt(0)?.toLowerCase() || '';
      const username = firstName + (lastInitial ? '.' + lastInitial : '') + Math.floor(Math.random() * 100);
      
      return apiRequest('/api/drivers', 'POST', {
        ...driverData,
        username,
        vehicleId: driverData.vehicleId ? Number(driverData.vehicleId) : null,
        performance: driverData.performance ? Number(driverData.performance) : 85
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setIsDialogOpen(false);
      resetDriverForm();
      toast({
        title: "Driver Added",
        description: "New driver has been successfully added to the system",
      });
    },
  });

  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest(`/api/drivers/${id}`, 'PUT', {
        ...data,
        vehicleId: data.vehicleId ? Number(data.vehicleId) : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      setEditingDriver(null);
      setIsDialogOpen(false);
      resetDriverForm();
      toast({
        title: "Driver Updated",
        description: "Driver information has been successfully updated",
      });
    },
  });

  // Delete driver mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/drivers/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Driver Removed",
        description: "Driver has been successfully removed from the system",
      });
    },
  });

  // Helper functions
  const resetDriverForm = () => {
    setNewDriver({
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      idNumber: "",
      status: "active",
      vehicleId: "",
      currentRoute: "",
      performance: "85",
      shiftStart: "08:00",
      shiftEnd: "17:00",
      emergencyContact: "",
      address: "",
      dateOfBirth: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      bankAccountNumber: "",
      medicalConditions: "",
      notes: ""
    });
    setRegistrationStep('form');
    setRegistrationToken("");
    setOtpCode("");
    setDriverCredentials(null);
  };

  // Registration handling functions
  const formatPhoneNumber = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      return '+27' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('27')) {
      return '+' + cleanPhone;
    } else if (!cleanPhone.startsWith('+27')) {
      return '+27' + cleanPhone;
    }
    return phone;
  };

  const validateRegistrationForm = (): boolean => {
    if (!newDriver.name.trim()) {
      toast({ title: "Error", description: "Driver name is required", variant: "destructive" });
      return false;
    }
    if (!newDriver.email.trim() || !newDriver.email.includes('@')) {
      toast({ title: "Error", description: "Valid email is required", variant: "destructive" });
      return false;
    }
    if (!newDriver.phone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" });
      return false;
    }
    if (!newDriver.licenseNumber.trim()) {
      toast({ title: "Error", description: "License number is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleRegistration = async () => {
    if (!validateRegistrationForm()) return;

    try {
      const formattedPhone = formatPhoneNumber(newDriver.phone);
      const registrationData = {
        name: newDriver.name,
        email: newDriver.email,
        phone: formattedPhone,
        licenseNumber: newDriver.licenseNumber,
        idNumber: newDriver.idNumber || ''
      };

      const response = await fetch('/api/driver/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const result = await response.json();
      
      if (result.success) {
        setRegistrationToken(result.registrationToken);
        setRegistrationStep('otp');
        toast({
          title: "OTP Sent",
          description: `Verification code sent to ${formattedPhone}`,
        });
      } else {
        toast({ title: "Registration Failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Registration failed. Please try again.", variant: "destructive" });
    }
  };

  const handleOTPVerification = async () => {
    if (!otpCode.trim()) {
      toast({ title: "Error", description: "Please enter the OTP code", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/driver/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationToken,
          otpCode: otpCode.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDriverCredentials({
          username: result.username,
          pin: result.pin
        });
        setRegistrationStep('completed');
        
        // Add the complete driver to the system
        addDriverMutation.mutate(newDriver);
        
        toast({
          title: "Registration Complete",
          description: "Driver registered successfully with mobile app credentials",
        });
      } else {
        toast({ title: "Verification Failed", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "OTP verification failed. Please try again.", variant: "destructive" });
    }
  };

  const handleAddDriver = () => {
    console.log("Driver form submitted with data:", newDriver);
    if (editingDriver) {
      updateDriverMutation.mutate({ id: editingDriver.id, data: newDriver });
    } else {
      // Validate required fields
      if (!newDriver.name || !newDriver.email || !newDriver.phone || !newDriver.licenseNumber) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields (name, email, phone, license number).",
          variant: "destructive",
        });
        return;
      }
      console.log("Submitting driver:", newDriver);
      // Use direct driver creation
      addDriverMutation.mutate(newDriver);
    }
  };

  const handleEditDriver = (driver: Driver) => {
    setEditingDriver(driver);
    setNewDriver({
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      licenseNumber: driver.licenseNumber,
      idNumber: driver.idNumber || "",
      status: driver.status,
      vehicleId: driver.vehicleId?.toString() || "",
      currentRoute: driver.currentRoute || "",
      performance: driver.performance || "85",
      shiftStart: "08:00",
      shiftEnd: "17:00",
      emergencyContact: "",
      address: "",
      dateOfBirth: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      bankAccountNumber: "",
      medicalConditions: "",
      notes: ""
    });
    setIsDialogOpen(true);
  };

  const handleUpdateDriver = () => {
    if (editingDriver) {
      updateDriverMutation.mutate({ id: editingDriver.id, data: newDriver });
    }
  };

  const handleDeleteDriver = (id: number) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      deleteDriverMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'break':
        return 'bg-yellow-100 text-yellow-800';
      case 'driving':
        return 'bg-blue-100 text-blue-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      case 'delayed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '🟢';
      case 'break':
        return '🟡';
      case 'driving':
        return '🔵';
      case 'offline':
        return '⚫';
      case 'delayed':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getMoovScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceColor = (performance: string) => {
    const score = parseFloat(performance);
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  // Bulk import functions
  const downloadDriverTemplate = async () => {
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      
      // Template data with all driver fields
      const templateData = [
        {
          "Driver Name *": "John Smith",
          "Email *": "john.smith@example.com",
          "Phone *": "0123456789",
          "License Number *": "DL123456789",
          "ID Number": "8901234567890",
          "Status": "active",
          "Vehicle ID": "1",
          "Shift Start": "08:00",
          "Shift End": "17:00",
          "Address": "123 Main Street, Cape Town",
          "Date of Birth": "1985-05-15",
          "Emergency Contact Name": "Jane Smith",
          "Emergency Contact Phone": "0987654321",
          "Bank Account Number": "1234567890",
          "Medical Conditions": "None",
          "Tax Number": "TAX123456",
          "Working Days": "monday-friday",
          "Hourly Rate": "150",
          "Notes": "Experienced driver"
        },
        {
          "Driver Name *": "Sarah Johnson",
          "Email *": "sarah.johnson@example.com",
          "Phone *": "0112233445",
          "License Number *": "DL987654321",
          "ID Number": "9012345678901",
          "Status": "active",
          "Vehicle ID": "2",
          "Shift Start": "06:00",
          "Shift End": "14:00",
          "Address": "456 Oak Avenue, Johannesburg",
          "Date of Birth": "1990-08-22",
          "Emergency Contact Name": "Mike Johnson",
          "Emergency Contact Phone": "0876543210",
          "Bank Account Number": "0987654321",
          "Medical Conditions": "Glasses required",
          "Tax Number": "TAX654321",
          "Working Days": "monday-saturday",
          "Hourly Rate": "175",
          "Notes": "Local area specialist"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths for better readability
      const wscols = [
        { wch: 20 }, // Driver Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // License Number
        { wch: 15 }, // ID Number
        { wch: 12 }, // Status
        { wch: 12 }, // Vehicle ID
        { wch: 12 }, // Shift Start
        { wch: 12 }, // Shift End
        { wch: 30 }, // Address
        { wch: 15 }, // Date of Birth
        { wch: 20 }, // Emergency Contact Name
        { wch: 20 }, // Emergency Contact Phone
        { wch: 20 }, // Bank Account Number
        { wch: 20 }, // Medical Conditions
        { wch: 15 }, // Tax Number
        { wch: 18 }, // Working Days
        { wch: 12 }, // Hourly Rate
        { wch: 25 }  // Notes
      ];
      ws['!cols'] = wscols;
      
      XLSX.utils.book_append_sheet(wb, ws, "Drivers");
      XLSX.writeFile(wb, "driver_import_template.xlsx");
      
      toast({
        title: "Template Downloaded",
        description: "Driver import template has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setSelectedFile(file);
        setShowBulkImportDialog(true);
      }
    };
    input.click();
  };

  const processBulkImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      const importedDrivers = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Map Excel columns to driver object with smart mapping
          const driverData = {
            name: row['Driver Name *'] || row['Name'] || row['driver_name'] || '',
            email: row['Email *'] || row['email'] || row['driver_email'] || '',
            phone: row['Phone *'] || row['phone'] || row['driver_phone'] || '',
            licenseNumber: row['License Number *'] || row['license'] || row['license_number'] || '',
            idNumber: row['ID Number'] || row['id'] || row['id_number'] || '',
            status: row['Status'] || row['status'] || 'active',
            vehicleId: row['Vehicle ID'] || row['vehicle'] || row['vehicle_id'] || '',
            shiftStart: row['Shift Start'] || row['shift_start'] || '08:00',
            shiftEnd: row['Shift End'] || row['shift_end'] || '17:00',
            address: row['Address'] || row['address'] || '',
            dateOfBirth: row['Date of Birth'] || row['dob'] || row['birth_date'] || '',
            emergencyContactName: row['Emergency Contact Name'] || row['emergency_name'] || '',
            emergencyContactPhone: row['Emergency Contact Phone'] || row['emergency_phone'] || '',
            bankAccountNumber: row['Bank Account Number'] || row['bank_account'] || '',
            medicalConditions: row['Medical Conditions'] || row['medical'] || '',
            taxNumber: row['Tax Number'] || row['tax'] || '',
            workingDays: row['Working Days'] || row['working_days'] || 'monday-friday',
            hourlyRate: row['Hourly Rate'] || row['rate'] || '',
            notes: row['Notes'] || row['notes'] || ''
          };

          // Validate required fields
          if (!driverData.name || !driverData.email || !driverData.phone || !driverData.licenseNumber) {
            errors.push(`Row ${i + 2}: Missing required fields (Name, Email, Phone, License Number)`);
            continue;
          }

          importedDrivers.push(driverData);
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
        }
      }

      if (importedDrivers.length > 0) {
        // Send to backend for bulk creation
        const response = await apiRequest('/api/drivers/bulk-import', 'POST', {
          drivers: importedDrivers
        });

        if (response) {
          queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
          toast({
            title: "Import Successful",
            description: `Successfully imported ${importedDrivers.length} drivers. ${errors.length > 0 ? `${errors.length} rows had errors.` : ''}`,
          });
        }
      } else {
        toast({
          title: "Import Failed",
          description: "No valid driver data found in the file",
          variant: "destructive",
        });
      }

      if (errors.length > 0) {
        console.warn('Import errors:', errors);
      }

    } catch (error) {
      console.error('Bulk import failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to process the Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setShowBulkImportDialog(false);
      setSelectedFile(null);
    }
  };

  // Filter drivers based on search and status
  const filteredDrivers = Array.isArray(drivers) ? drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1">
        <Header title="Drivers" />
        
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Couriers & Drivers</h1>
              <p className="text-gray-600 mt-1">Manage your fleet drivers and their performance</p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={downloadDriverTemplate}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleBulkImport}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { 
                    setEditingDriver(null); 
                    resetDriverForm(); 
                    setIsDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Driver
                  </Button>
                </DialogTrigger>
            </div>
          </div>

          {/* Bulk Import Dialog */}
          <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Bulk Import Drivers
                </DialogTitle>
                <DialogDescription>
                  Import multiple drivers from Excel spreadsheet
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {selectedFile && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Selected File:</p>
                    <p className="text-sm text-blue-700">{selectedFile.name}</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  <p>• Use the template for proper column formatting</p>
                  <p>• Required fields: Name, Email, Phone, License Number</p>
                  <p>• Smart column mapping will detect common field names</p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowBulkImportDialog(false)}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={processBulkImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? "Importing..." : "Import Drivers"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between mb-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <div style={{ display: 'none' }}></div>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>{editingDriver ? 'Edit Driver' : 'Register New Driver'}</span>
                  </DialogTitle>
                  <DialogDescription>
                    {editingDriver ? 'Update driver information and vehicle assignment.' : 'Complete driver registration with automatic credentials generation.'}
                  </DialogDescription>
                </DialogHeader>

                {registrationStep === 'form' && (
                  <div className="space-y-8 py-4">
                    
                    {/* Personal Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
                          <Input
                            id="name"
                            value={newDriver.name}
                            onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                            placeholder="Enter driver's full name"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="idNumber" className="text-sm font-medium text-gray-700">ID Number *</Label>
                          <Input
                            id="idNumber"
                            value={newDriver.idNumber}
                            onChange={(e) => setNewDriver({...newDriver, idNumber: e.target.value})}
                            placeholder="National ID or passport number"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">Date of Birth</Label>
                          <Input
                            id="dateOfBirth"
                            type="date"
                            value={newDriver.dateOfBirth}
                            onChange={(e) => setNewDriver({...newDriver, dateOfBirth: e.target.value})}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address" className="text-sm font-medium text-gray-700">Home Address</Label>
                          <Input
                            id="address"
                            value={newDriver.address}
                            onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
                            placeholder="Full residential address"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                        <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
                        Contact Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={newDriver.email}
                            onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                            placeholder="driver@company.com"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Mobile Number *</Label>
                          <Input
                            id="phone"
                            value={newDriver.phone}
                            onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                            placeholder="+27 XX XXX XXXX"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactName" className="text-sm font-medium text-gray-700">Emergency Contact Name</Label>
                          <Input
                            id="emergencyContactName"
                            value={newDriver.emergencyContactName}
                            onChange={(e) => setNewDriver({...newDriver, emergencyContactName: e.target.value})}
                            placeholder="Emergency contact person"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContactPhone" className="text-sm font-medium text-gray-700">Emergency Contact Phone</Label>
                          <Input
                            id="emergencyContactPhone"
                            value={newDriver.emergencyContactPhone}
                            onChange={(e) => setNewDriver({...newDriver, emergencyContactPhone: e.target.value})}
                            placeholder="+27 XX XXX XXXX"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Professional Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                        <Truck className="h-5 w-5 mr-2 text-purple-600" />
                        Professional Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="licenseNumber" className="text-sm font-medium text-gray-700">Driver's License Number *</Label>
                          <Input
                            id="licenseNumber"
                            value={newDriver.licenseNumber}
                            onChange={(e) => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                            placeholder="License number"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehicleId" className="text-sm font-medium text-gray-700">Assigned Vehicle</Label>
                          <Select 
                            value={newDriver.vehicleId} 
                            onValueChange={(value) => setNewDriver({...newDriver, vehicleId: value})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No vehicle assigned</SelectItem>
                              {vehicles?.map((vehicle: any) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.make} {vehicle.model} - {vehicle.registration}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="status" className="text-sm font-medium text-gray-700">Employment Status</Label>
                          <Select 
                            value={newDriver.status} 
                            onValueChange={(value) => setNewDriver({...newDriver, status: value})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="performance" className="text-sm font-medium text-gray-700">Initial MoovScore</Label>
                          <Input
                            id="performance"
                            type="number"
                            min="0"
                            max="100"
                            value={newDriver.performance}
                            onChange={(e) => setNewDriver({...newDriver, performance: e.target.value})}
                            placeholder="85"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Banking Information Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                        <Copy className="h-5 w-5 mr-2 text-orange-600" />
                        Banking & Financial Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="bankAccountNumber" className="text-sm font-medium text-gray-700">Bank Account Number</Label>
                          <Input
                            id="bankAccountNumber"
                            value={newDriver.bankAccountNumber}
                            onChange={(e) => setNewDriver({...newDriver, bankAccountNumber: e.target.value})}
                            placeholder="Account number for payments"
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="taxNumber" className="text-sm font-medium text-gray-700">Tax Number</Label>
                          <Input
                            id="taxNumber"
                            value={newDriver.taxNumber || ""}
                            onChange={(e) => setNewDriver({...newDriver, taxNumber: e.target.value})}
                            placeholder="Tax reference number"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Shift Management Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                        Shift Management
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="shiftStart" className="text-sm font-medium text-gray-700">Shift Start Time</Label>
                          <Input
                            id="shiftStart"
                            type="time"
                            value={newDriver.shiftStart}
                            onChange={(e) => setNewDriver({...newDriver, shiftStart: e.target.value})}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="shiftEnd" className="text-sm font-medium text-gray-700">Shift End Time</Label>
                          <Input
                            id="shiftEnd"
                            type="time"
                            value={newDriver.shiftEnd}
                            onChange={(e) => setNewDriver({...newDriver, shiftEnd: e.target.value})}
                            className="w-full"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="workingDays" className="text-sm font-medium text-gray-700">Working Days</Label>
                          <Select 
                            value={newDriver.workingDays || "monday-friday"} 
                            onValueChange={(value) => setNewDriver({...newDriver, workingDays: value})}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select working days" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday-friday">Monday to Friday</SelectItem>
                              <SelectItem value="monday-saturday">Monday to Saturday</SelectItem>
                              <SelectItem value="all-week">All Week</SelectItem>
                              <SelectItem value="custom">Custom Schedule</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="hourlyRate" className="text-sm font-medium text-gray-700">Hourly Rate (ZAR)</Label>
                          <Input
                            id="hourlyRate"
                            type="number"
                            min="0"
                            step="0.01"
                            value={newDriver.hourlyRate || ""}
                            onChange={(e) => setNewDriver({...newDriver, hourlyRate: e.target.value})}
                            placeholder="150.00"
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Health & Safety Section */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3 flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
                        Health & Safety Information
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="medicalConditions" className="text-sm font-medium text-gray-700">Medical Conditions / Allergies</Label>
                          <Textarea
                            id="medicalConditions"
                            value={newDriver.medicalConditions}
                            onChange={(e) => setNewDriver({...newDriver, medicalConditions: e.target.value})}
                            placeholder="List any medical conditions, allergies, or health considerations"
                            className="w-full min-h-[80px]"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Additional Notes</Label>
                          <Textarea
                            id="notes"
                            value={newDriver.notes}
                            onChange={(e) => setNewDriver({...newDriver, notes: e.target.value})}
                            placeholder="Any additional information, certifications, or special notes about this driver"
                            className="w-full min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddDriver}
                    disabled={addDriverMutation.isPending || updateDriverMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addDriverMutation.isPending || updateDriverMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        {editingDriver ? 'Updating...' : 'Adding Driver...'}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        {editingDriver ? 'Update Driver' : 'Add Driver'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search drivers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="driving">Driving</SelectItem>
                <SelectItem value="break">On Break</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Driver Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDrivers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No drivers match your current filters.' 
                    : 'Get started by adding your first driver to the system.'
                  }
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Driver
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => (
                <Card key={driver.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {driver.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                          <p className="text-sm text-gray-500">{driver.email}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(driver.status)}>
                        {getStatusIcon(driver.status)} {driver.status}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium">{driver.phone}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">License:</span>
                        <span className="font-medium">{driver.licenseNumber}</span>
                      </div>
                      
                      {driver.vehicleId && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Vehicle:</span>
                          <span className="font-medium">Vehicle #{driver.vehicleId}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">MoovScore:</span>
                        <span className={`font-bold ${getMoovScoreColor(Number(driver.performance || 0))}`}>
                          <Star className="h-3 w-3 inline mr-1" />
                          {driver.performance || '85'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditDriver(driver)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteDriver(driver.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
                      </div>
                    </div>
                  </div>
                )}

                {registrationStep === 'completed' && driverCredentials && (
                  <div className="space-y-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Registration Complete!</h3>
                      <p className="text-gray-600 mb-6">
                        Driver credentials have been generated successfully
                      </p>
                    </div>
                    
                    <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 space-y-4">
                      <h4 className="font-medium text-gray-900">Driver Login Credentials</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Username:</span>
                          <span className="font-mono font-medium">{driverCredentials.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">PIN:</span>
                          <span className="font-mono font-medium">{driverCredentials.pin}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded">
                        <p><strong>Instructions:</strong> Share these credentials with the driver for mobile app login at /mobile</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={newDriver.name}
                      onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDriver.email}
                      onChange={(e) => setNewDriver({...newDriver, email: e.target.value})}
                      placeholder="Enter email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={newDriver.phone}
                      onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="license">License Number *</Label>
                    <Input
                      id="license"
                      value={newDriver.licenseNumber}
                      onChange={(e) => setNewDriver({...newDriver, licenseNumber: e.target.value})}
                      placeholder="Enter license number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newDriver.status} onValueChange={(value) => setNewDriver({...newDriver, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="break">On Break</SelectItem>
                        <SelectItem value="driving">Driving</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                        <SelectItem value="delayed">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Assign Vehicle</Label>
                    <Select value={newDriver.vehicleId} onValueChange={(value) => setNewDriver({...newDriver, vehicleId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No vehicle assigned</SelectItem>
                        {Array.isArray(vehicles) && vehicles.map((vehicle: any) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shiftStart">Shift Start</Label>
                    <Input
                      id="shiftStart"
                      type="time"
                      value={newDriver.shiftStart}
                      onChange={(e) => setNewDriver({...newDriver, shiftStart: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shiftEnd">Shift End</Label>
                    <Input
                      id="shiftEnd"
                      type="time"
                      value={newDriver.shiftEnd}
                      onChange={(e) => setNewDriver({...newDriver, shiftEnd: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      value={newDriver.emergencyContact}
                      onChange={(e) => setNewDriver({...newDriver, emergencyContact: e.target.value})}
                      placeholder="Emergency contact information"
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={newDriver.address}
                      onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
                      placeholder="Driver address"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsDialogOpen(false);
                    resetDriverForm();
                  }}>
                    Cancel
                  </Button>
                  
                  {registrationStep === 'form' && (
                    <Button 
                      onClick={editingDriver ? handleUpdateDriver : handleAddDriver}
                      disabled={addDriverMutation.isPending || updateDriverMutation.isPending}
                    >
                      {addDriverMutation.isPending ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        editingDriver ? 'Update Driver' : 'Register Driver'
                      )}
                    </Button>
                  )}
                  
                  {registrationStep === 'otp' && (
                    <Button 
                      onClick={handleOTPVerification}
                      disabled={!otpCode.trim()}
                    >
                      Verify OTP
                    </Button>
                  )}
                  
                  {registrationStep === 'completed' && (
                    <Button 
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetDriverForm();
                        queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
                      }}
                    >
                      Complete Registration
                    </Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search drivers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="break">On Break</SelectItem>
                <SelectItem value="driving">Driving</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drivers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>All Drivers ({filteredDrivers.length})</span>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Active</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span>Break</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span>Driving</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
                    <span>Offline</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Driver</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Vehicle</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Network</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Shift</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Performance</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Mobile PIN</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Current Route</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-t">
                          <td className="py-4 px-6">
                            <div className="animate-pulse flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                              <div className="space-y-2">
                                <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                <div className="w-32 h-3 bg-gray-200 rounded"></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6"><div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div></td>
                          <td className="py-4 px-6"><div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div></td>
                        </tr>
                      ))
                    ) : filteredDrivers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12">
                          <div className="text-gray-500">
                            <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium mb-2">No drivers found</p>
                            <p className="text-sm">Try adjusting your search or filters, or add a new driver.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredDrivers.map((driver) => (
                        <tr key={driver.id} className="border-t hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {driver.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium text-gray-900">{driver.name}</div>
                                <div className="text-sm text-gray-600">{driver.email}</div>
                                <div className="text-xs text-gray-500">{driver.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {driver.vehicleId ? (
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">Vehicle {driver.vehicleId}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <Badge className={getStatusColor(driver.status)} variant="outline">
                              <span className="mr-1">{getStatusIcon(driver.status)}</span>
                              {driver.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1">
                              {(driver as any).networkStatus === 'offline' ? (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <WifiOff className="h-4 w-4" />
                                  <span className="text-xs font-medium">Offline</span>
                                  {(driver as any).pendingJobs > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {(driver as any).pendingJobs} pending
                                    </Badge>
                                  )}
                                </div>
                              ) : (driver as any).networkStatus === 'poor' ? (
                                <div className="flex items-center space-x-1 text-yellow-600">
                                  <Wifi className="h-4 w-4" />
                                  <span className="text-xs font-medium">Poor</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <Wifi className="h-4 w-4" />
                                  <span className="text-xs font-medium">Online</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>08:00–17:00</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className={`font-medium ${getMoovScoreColor(parseFloat(driver.performance || '85'))}`}>
                                {driver.performance || '85'}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2">
                              <span 
                                className="font-mono text-lg font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded cursor-pointer hover:bg-blue-100 transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText((driver as any).pin || '1234');
                                  toast({ title: "PIN copied to clipboard", duration: 2000 });
                                }}
                                title="Click to copy PIN"
                              >
                                {(driver as any).pin || '1234'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Last used PIN
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {driver.currentRoute ? (
                              <div className="flex items-center space-x-1 text-sm">
                                <MapPin className="h-4 w-4 text-blue-500" />
                                <span className="truncate max-w-xs">{driver.currentRoute}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No active route</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-600 hover:text-gray-700"
                                onClick={() => handleEditDriver(driver)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteDriver(driver.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}