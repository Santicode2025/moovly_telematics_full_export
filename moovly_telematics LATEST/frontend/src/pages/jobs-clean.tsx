import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Package, Clock, MapPin, User, Car, AlertCircle, CheckCircle, Pause, XCircle, Zap, Calendar, BookOpen, Building2, Phone, Mail, Edit, Trash2, Download, Upload, FileSpreadsheet } from "lucide-react";
import AddressAutoComplete from "@/components/AddressAutoComplete";
import { insertJobSchema, type Job, type Driver, type Vehicle } from "@shared/schema";
import { z } from "zod";

const createJobFormSchema = insertJobSchema.pick({
  customerName: true,
  pickupAddress: true,
  deliveryAddress: true,
  scheduledDate: true,
  priority: true,
  notes: true,
  driverId: true,
}).extend({
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  packageDetails: z.string().optional(),
  specialInstructions: z.string().optional(),
});

type CreateJobFormData = z.infer<typeof createJobFormSchema>;

// Customer schema for Address Book
const createCustomerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  notes: z.string().optional(),
});

type CreateCustomerData = z.infer<typeof createCustomerSchema>;

interface Customer {
  id: number;
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  totalJobs: number;
  lastJobDate?: string;
  createdAt: string;
}

export default function JobsPage() {
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false);
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [clientSuggestions, setClientSuggestions] = useState<Customer[]>([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles = [] } = useQuery<Vehicle[]>({
    queryKey: ["/api/vehicles"],
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const jobForm = useForm<CreateJobFormData>({
    resolver: zodResolver(createJobFormSchema),
    defaultValues: {
      customerName: "",
      pickupAddress: "",
      deliveryAddress: "",
      scheduledDate: "",
      scheduledTime: "",
      priority: "medium",
      notes: "",
      driverId: undefined,
      customerPhone: "",
      customerEmail: "",
      packageDetails: "",
      specialInstructions: "",
    },
  });

  const customerForm = useForm<CreateCustomerData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      notes: "",
    },
  });

  // State for geocoded address data
  const [geocodedData, setGeocodedData] = useState<{
    latitude?: number;
    longitude?: number;
    streetNumber?: string;
    streetName?: string;
  } | null>(null);

  // Handle address selection from autocomplete
  const handleAddressSelect = (addressData: {
    fullAddress: string;
    latitude: number;
    longitude: number;
    streetNumber?: string;
    streetName?: string;
    city?: string;
    postalCode?: string;
  }) => {
    // Update form fields
    customerForm.setValue("address", addressData.fullAddress);
    if (addressData.city) {
      customerForm.setValue("city", addressData.city);
    }
    if (addressData.postalCode) {
      customerForm.setValue("postalCode", addressData.postalCode);
    }

    // Store geocoded data
    setGeocodedData({
      latitude: addressData.latitude,
      longitude: addressData.longitude,
      streetNumber: addressData.streetNumber,
      streetName: addressData.streetName,
    });

    toast({
      title: "Address Geocoded",
      description: `Coordinates: ${addressData.latitude.toFixed(6)}, ${addressData.longitude.toFixed(6)}`,
    });
  };

  const createJobMutation = useMutation({
    mutationFn: async (data: CreateJobFormData) => {
      const formattedData = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
      };
      return await apiRequest("/api/jobs", "POST", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      jobForm.reset();
      setShowCreateJobDialog(false);
      toast({
        title: "Success",
        description: "Job created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CreateCustomerData) => {
      // Include geocoded data if available
      const customerData = {
        ...data,
        latitude: geocodedData?.latitude,
        longitude: geocodedData?.longitude,
      };
      return await apiRequest("/api/customers", "POST", customerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      customerForm.reset();
      setGeocodedData(null);
      setShowCreateCustomerDialog(false);
      toast({
        title: "Success",
        description: "Customer created successfully with automatic geofence.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/customers/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: "Customer removed from address book",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      case "pending": return <Pause className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || job.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const optimizeRoutesMutation = useMutation({
    mutationFn: async () => {
      const pendingJobs = jobs.filter(job => job.status === 'pending' && !job.driverId);
      if (pendingJobs.length === 0) {
        throw new Error("No unassigned pending jobs to optimize");
      }
      return await apiRequest("/api/routes/optimize-one-click", "POST", { 
        jobIds: pendingJobs.map(job => job.id) 
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Routes Optimized", 
        description: `Successfully assigned and optimized ${(data as any).assignedJobs || 0} jobs`,
      });
    },
    onError: (error) => {
      toast({
        title: "Optimization Failed",
        description: error.message || "Unable to optimize routes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOneClickOptimize = () => {
    const pendingJobs = jobs.filter(job => job.status === 'pending' && !job.driverId);
    if (pendingJobs.length === 0) {
      toast({
        title: "No Jobs to Optimize",
        description: "All jobs are already assigned or completed",
        variant: "destructive",
      });
      return;
    }
    optimizeRoutesMutation.mutate();
  };

  const onJobSubmit = (data: CreateJobFormData) => {
    createJobMutation.mutate(data);
  };

  const onCustomerSubmit = (data: CreateCustomerData) => {
    createCustomerMutation.mutate(data);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm) ||
    customer.address.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  // Smart client autocomplete function
  const searchClients = (query: string) => {
    if (!query.trim() || query.length < 2) {
      setClientSuggestions([]);
      setShowClientSuggestions(false);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email?.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone.includes(query)
    ).slice(0, 5); // Show top 5 matches

    setClientSuggestions(filtered);
    setShowClientSuggestions(filtered.length > 0);
  };

  // Bulk import functions
  const downloadJobTemplate = async () => {
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      
      // Get all drivers for the template reference
      const driverNames = drivers.map(d => d.name).join(', ');
      const customerNames = customers.slice(0, 5).map(c => c.name).join(', ');
      
      // Enhanced template data with all job fields including driver assignment
      const templateData = [
        {
          "Customer Name *": "ABC Company",
          "Customer Phone": "0211234567",
          "Customer Email": "orders@abc.com",
          "Pickup Address *": "123 Main Street, Cape Town",
          "Delivery Address *": "456 Oak Avenue, Stellenbosch", 
          "Scheduled Date *": "2025-01-15",
          "Scheduled Time": "10:00",
          "Priority": "high",
          "Driver Name": "John Smith", // Optional - will auto-assign if blank
          "Package Details": "Electronics package - handle with care",
          "Special Instructions": "Ring doorbell twice",
          "Notes": "Fragile items inside",
          "Job Type": "delivery",
          "Package Count": "2",
          "Time at Stop": "5",
          "Access Instructions": "Gate code: 1234"
        },
        {
          "Customer Name *": "XYZ Store",
          "Customer Phone": "0217654321",
          "Customer Email": "delivery@xyz.com",
          "Pickup Address *": "789 Pine Road, Durban",
          "Delivery Address *": "321 Cedar Lane, Johannesburg",
          "Scheduled Date *": "2025-01-16",
          "Scheduled Time": "14:30",
          "Priority": "medium",
          "Driver Name": "", // Leave blank for auto-assignment
          "Package Details": "Office supplies",
          "Special Instructions": "Business hours delivery only",
          "Notes": "Contact recipient before delivery",
          "Job Type": "pickup",
          "Package Count": "1",
          "Time at Stop": "10",
          "Access Instructions": "Reception desk"
        }
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      
      // Set column widths for better readability
      const wscols = [
        { wch: 20 }, // Customer Name
        { wch: 15 }, // Customer Phone
        { wch: 25 }, // Customer Email
        { wch: 40 }, // Pickup Address
        { wch: 40 }, // Delivery Address
        { wch: 15 }, // Scheduled Date
        { wch: 12 }, // Scheduled Time
        { wch: 10 }, // Priority
        { wch: 20 }, // Driver Name
        { wch: 30 }, // Package Details
        { wch: 30 }, // Special Instructions
        { wch: 20 }, // Notes
        { wch: 12 }, // Job Type
        { wch: 12 }, // Package Count
        { wch: 12 }, // Time at Stop
        { wch: 25 }  // Access Instructions
      ];
      ws['!cols'] = wscols;
      
      // Add instructions sheet
      const instructionsData = [
        { "Field": "Customer Name *", "Description": "Full customer/company name (Required)", "Example": "ABC Company Ltd", "Notes": `Available clients: ${customerNames}` },
        { "Field": "Pickup Address *", "Description": "Complete pickup address (Required)", "Example": "123 Main St, Cape Town, 8001", "Notes": "Include postal code for accuracy" },
        { "Field": "Delivery Address *", "Description": "Complete delivery address (Required)", "Example": "456 Oak Ave, Stellenbosch, 7600", "Notes": "Include postal code for accuracy" },
        { "Field": "Scheduled Date *", "Description": "Job date (Required - YYYY-MM-DD)", "Example": "2025-01-15", "Notes": "Use YYYY-MM-DD format" },
        { "Field": "Priority", "Description": "Job priority level", "Example": "high, medium, low", "Notes": "Defaults to medium if blank" },
        { "Field": "Driver Name", "Description": "Assign to specific driver (Optional)", "Example": "John Smith", "Notes": `Available drivers: ${driverNames}. Leave blank for auto-assignment` },
        { "Field": "Job Type", "Description": "Type of job", "Example": "delivery, pickup", "Notes": "Defaults to delivery if blank" },
        { "Field": "", "Description": "", "Example": "", "Notes": "Smart column mapping will detect variations like:" },
        { "Field": "", "Description": "", "Example": "", "Notes": "• Customer/Client/Company → Customer Name" },
        { "Field": "", "Description": "", "Example": "", "Notes": "• From/Pickup/Origin → Pickup Address" },
        { "Field": "", "Description": "", "Example": "", "Notes": "• To/Delivery/Destination → Delivery Address" },
        { "Field": "", "Description": "", "Example": "", "Notes": "• Date/Schedule/When → Scheduled Date" },
        { "Field": "", "Description": "", "Example": "", "Notes": "• Driver/Assigned/Courier → Driver Name" }
      ];
      
      const instructionsWS = XLSX.utils.json_to_sheet(instructionsData);
      instructionsWS['!cols'] = [
        { wch: 20 }, { wch: 40 }, { wch: 30 }, { wch: 50 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Jobs Template");
      XLSX.utils.book_append_sheet(wb, instructionsWS, "Instructions & Notes");
      XLSX.writeFile(wb, "job_import_template.xlsx");
      
      toast({
        title: "Template Downloaded",
        description: "Smart job import template downloaded with driver assignment and client autocomplete",
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

  const handleJobsBulkImport = () => {
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

  const processJobsBulkImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    try {
      // Dynamically import XLSX
      const XLSX = await import('xlsx');
      
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet) as any[];

      const importedJobs = [];
      const errors = [];

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Smart auto-mapping with enhanced patterns
          const customerName = row['Customer Name *'] || row['Customer Name'] || row['Customer'] || row['Client'] || row['Company'] || row['customer_name'] || row['client_name'] || '';
          const pickupAddress = row['Pickup Address *'] || row['Pickup Address'] || row['Pickup'] || row['From'] || row['Origin'] || row['pickup_address'] || row['from_address'] || '';
          const deliveryAddress = row['Delivery Address *'] || row['Delivery Address'] || row['Delivery'] || row['To'] || row['Destination'] || row['delivery_address'] || row['to_address'] || '';
          const scheduledDate = row['Scheduled Date *'] || row['Scheduled Date'] || row['Date'] || row['Schedule'] || row['When'] || row['scheduled_date'] || row['job_date'] || '';
          
          // Find driver by name if specified
          let driverId = null;
          const driverName = row['Driver Name'] || row['Driver'] || row['Assigned Driver'] || row['Courier'] || row['driver_name'] || row['assigned_to'] || '';
          if (driverName) {
            const driver = drivers.find(d => 
              d.name.toLowerCase().includes(driverName.toLowerCase()) ||
              driverName.toLowerCase().includes(d.name.toLowerCase())
            );
            if (driver) {
              driverId = driver.id;
            }
          }

          // Map job data with smart field mapping
          const jobData = {
            customerName,
            customerPhone: row['Customer Phone'] || row['Phone'] || row['customer_phone'] || row['phone'] || '',
            customerEmail: row['Customer Email'] || row['Email'] || row['customer_email'] || row['email'] || '',
            pickupAddress,
            deliveryAddress,
            scheduledDate,
            scheduledTime: row['Scheduled Time'] || row['Time'] || row['scheduled_time'] || '',
            priority: row['Priority'] || row['priority'] || 'medium',
            driverId,
            packageDetails: row['Package Details'] || row['Package'] || row['Items'] || row['package_details'] || row['description'] || '',
            specialInstructions: row['Special Instructions'] || row['Instructions'] || row['special_instructions'] || row['notes'] || '',
            notes: row['Notes'] || row['Additional Notes'] || row['comments'] || ''
          };

          // Validate required fields
          if (!customerName || !pickupAddress || !deliveryAddress || !scheduledDate) {
            errors.push(`Row ${i + 2}: Missing required fields (Customer Name, Pickup Address, Delivery Address, Scheduled Date)`);
            continue;
          }

          importedJobs.push(jobData);
        } catch (error) {
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (importedJobs.length > 0) {
        // Send to backend for bulk creation
        const response = await apiRequest('/api/jobs/bulk-import', 'POST', {
          jobs: importedJobs
        });

        if (response) {
          queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
          toast({
            title: "Import Successful",
            description: `Successfully imported ${importedJobs.length} jobs. ${errors.length > 0 ? `${errors.length} rows had errors.` : ''}`,
          });
        }
      } else {
        toast({
          title: "Import Failed",
          description: "No valid job data found in the file",
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsImporting(false);
    
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setExcelData(jsonData);
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast({
        title: "Error",
        description: "Failed to read Excel file. Please check the format.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs & Address Book</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage delivery jobs and customer database
          </p>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Jobs & Dispatch
          </TabsTrigger>
          <TabsTrigger value="address-book" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Address Book
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={downloadJobTemplate}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleJobsBulkImport}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import Jobs
              </Button>
              
              <Button 
                onClick={handleOneClickOptimize}
                disabled={optimizeRoutesMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                {optimizeRoutesMutation.isPending ? "Optimizing..." : "One-Click Optimize"}
              </Button>
              <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center">
                      <Package className="w-5 h-5 mr-2 text-blue-600" />
                      Create New Job
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...jobForm}>
                    <form onSubmit={jobForm.handleSubmit(onJobSubmit)} className="space-y-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={jobForm.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                          <FormLabel>Customer Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe / ABC Company" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+27 82 555 1234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="customer@example.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Location Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Location Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={jobForm.control}
                      name="pickupAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pickup Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="123 Pickup Street, Cape Town, 8001"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="deliveryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Address *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="456 Delivery Avenue, Cape Town, 8002"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Job Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Job Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={jobForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Low Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="high">High Priority</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="packageDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Details</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 3 boxes, 25kg total" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={jobForm.control}
                      name="driverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Driver</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString() || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Auto-assign or select driver" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Auto-assign (recommended)</SelectItem>
                              {drivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                  {driver.name} - {driver.status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      <FormField
                        control={jobForm.control}
                        name="specialInstructions"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Special Instructions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Building access codes, contact person, fragile handling requirements..."
                                className="min-h-[60px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={jobForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Additional Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Internal notes, billing information, follow-up requirements..."
                                className="min-h-[60px]"
                                value={field.value || ""}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateJobDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createJobMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {createJobMutation.isPending ? "Creating..." : "Create Job"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {/* Bulk Import Dialog */}
          <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <FileSpreadsheet className="h-5 w-5 mr-2" />
                  Bulk Import Jobs
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {!selectedFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        Select an Excel file to import jobs
                      </p>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="job-file-input"
                        data-testid="file-input-jobs"
                      />
                      <label
                        htmlFor="job-file-input"
                        className="mt-2 cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Selected File:</p>
                      <p className="text-sm text-blue-700">{selectedFile.name}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        {excelData ? `${excelData.length} rows detected` : 'Processing...'}
                      </p>
                    </div>
                    
                    {excelData && excelData.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Preview (First 3 rows)</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="bg-gray-50">
                                {Object.keys(excelData[0]).map((header, i) => (
                                  <th key={i} className="border border-gray-200 p-2 text-left font-medium">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {excelData.slice(0, 3).map((row, i) => (
                                <tr key={i}>
                                  {Object.values(row).map((cell, j) => (
                                    <td key={j} className="border border-gray-200 p-2">
                                      {String(cell)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  <p>• Use the template for proper column formatting</p>
                  <p>• Required fields: Customer Name, Pickup/Delivery Addresses, Date</p>
                  <p>• Smart column mapping detects common field variations</p>
                  <p>• Driver assignment: specify driver name or leave blank for auto-assignment</p>
                  <p>• Client autocomplete: remembers customer names as you type</p>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowBulkImportDialog(false)}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={processJobsBulkImport}
                  disabled={!selectedFile || isImporting}
                >
                  {isImporting ? "Importing..." : "Import Jobs"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Jobs ({filteredJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Scheduled</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.jobNumber}</TableCell>
                        <TableCell>{job.customerName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center text-green-600 mb-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.pickupAddress}
                            </div>
                            <div className="flex items-center text-red-600">
                              <MapPin className="w-3 h-3 mr-1" />
                              {job.deliveryAddress}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {job.driverId ? (
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-2" />
                              <span>Driver {job.driverId}</span>
                            </div>
                          ) : (
                            <Badge variant="outline">Unassigned</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center ${
                            job.status === 'completed' ? 'text-green-600' :
                            job.status === 'in_progress' ? 'text-blue-600' :
                            job.status === 'pending' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {getStatusIcon(job.status)}
                            <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            job.priority === 'high' ? 'bg-red-100 text-red-800' :
                            job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {job.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(job.scheduledDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Book Tab */}
        <TabsContent value="address-book" className="space-y-6">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Address Book Coming Soon</h3>
            <p className="text-gray-600">Customer management features will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Jobs ({filteredJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="font-medium">{job.jobNumber}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{job.customerName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-green-600" />
                          <span className="truncate max-w-32">{job.pickupAddress}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1 text-red-600" />
                          <span className="truncate max-w-32">{job.deliveryAddress}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <User className="w-3 h-3 mr-1" />
                        {job.driverId ? 
                          drivers.find(d => d.id === job.driverId)?.name || `Driver #${job.driverId}` : 
                          'Unassigned'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {getStatusIcon(job.status)}
                        <span className="ml-1 capitalize">{job.status.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.priority === 'high' ? 'bg-red-100 text-red-800' :
                        job.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {job.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(job.scheduledDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}