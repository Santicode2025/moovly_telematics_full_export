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
import SmartRouteSuggestions from "@/components/SmartRouteSuggestions";
import { DriverSelector } from "@/components/DriverSelector";
import JobReassignmentInterface from "@/components/JobReassignmentInterface";
import { insertJobSchema, type Job, type Driver, type Vehicle } from "@shared/schema";
import { z } from "zod";

const createJobFormSchema = z.object({
  customerId: z.coerce.number().nullable().optional(), // For existing customers
  customerName: z.string().min(1, "Customer name is required"),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().optional(),
  jobType: z.enum(["delivery", "pickup"], { required_error: "Job type is required" }),
  notes: z.string().optional(),
  driverId: z.coerce.number().nullable().optional(),
  orderPriority: z.enum(["first", "auto", "last"]).default("auto"),
  arrivalTime: z.string().default("Anytime"),
  timeAtStop: z.coerce.number().min(1, "Time at stop must be at least 1 minute").default(5),
  packageCount: z.coerce.number().min(1, "Package count must be at least 1").default(1),
  accessInstructions: z.string().optional(),
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

export default function JobsWithTabsPage() {
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false);
  const [showCreateCustomerDialog, setShowCreateCustomerDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedJobs, setSelectedJobs] = useState<number[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchValue, setCustomerSearchValue] = useState("");
  
  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
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
      customerId: null,
      customerName: "",
      pickupAddress: "",
      deliveryAddress: "",
      scheduledDate: "",
      scheduledTime: "",
      jobType: "delivery",
      notes: "",
      driverId: null,
      customerPhone: "",
      customerEmail: "",
      packageDetails: "",
      specialInstructions: "",
      orderPriority: "auto",
      arrivalTime: "Anytime",
      timeAtStop: 5,
      packageCount: 1,
      accessInstructions: "",
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
      description: `Coordinates: ${addressData.latitude.toFixed(6)}, ${addressData.longitude.toFixed(6)} - 50m geofence created`,
    });
  };

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchValue(customer.name);
    jobForm.setValue("customerId", customer.id);
    jobForm.setValue("customerName", customer.name);
    jobForm.setValue("customerEmail", customer.email || "");
    jobForm.setValue("customerPhone", customer.phone);
    
    toast({
      title: "Customer Selected",
      description: `Selected ${customer.name} - contact details auto-filled`,
    });
  };

  // Handle manual customer name input
  const handleCustomerNameChange = (value: string) => {
    setCustomerSearchValue(value);
    jobForm.setValue("customerName", value);
    if (!value) {
      setSelectedCustomer(null);
      jobForm.setValue("customerId", null);
    }
  };

  // Filter customers based on search
  const filteredCustomersForDropdown = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearchValue.toLowerCase())
  ).slice(0, 5); // Limit to 5 results

  // Watch job type for conditional address graying
  const selectedJobType = jobForm.watch("jobType");

  const createJobMutation = useMutation({
    mutationFn: async (data: CreateJobFormData) => {
      // Convert string dates to proper ISO format
      const scheduledDateISO = data.scheduledDate; // Keep as string, backend will handle conversion
      const scheduledTimeISO = data.scheduledTime 
        ? `${data.scheduledDate}T${data.scheduledTime}:00` 
        : undefined;
      
      // Format data to match backend insertJobSchema
      const formattedData = {
        customerName: data.customerName,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        scheduledDate: scheduledDateISO,
        scheduledTime: scheduledTimeISO,
        hasFixedTime: !!data.scheduledTime,
        priority: "medium", // Set default priority since removed from form
        notes: data.notes || undefined,
        driverId: data.driverId || undefined,
        orderPriority: data.orderPriority || "auto",
        jobType: data.jobType,
        arrivalTime: data.arrivalTime || "Anytime",
        packageCount: data.packageCount,
        timeAtStop: data.timeAtStop,
        customerPhone: data.customerPhone || undefined,
        customerEmail: data.customerEmail || undefined,
        packageDetails: data.packageDetails || undefined,
        specialInstructions: data.specialInstructions || undefined,
        accessInstructions: data.accessInstructions || undefined
      };
      return await apiRequest("POST", "/api/jobs", formattedData);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      jobForm.reset();
      setSelectedCustomer(null);
      setCustomerSearchValue("");
      setShowCreateJobDialog(false);
      toast({
        title: "Success",
        description: "Job created successfully and push notification sent to drivers",
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
      return await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      customerForm.reset();
      setGeocodedData(null);
      setShowCreateCustomerDialog(false);
      toast({
        title: "Success",
        description: "Customer added with automatic geocoding and 50m geofence created",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "in_progress": return <Clock className="w-4 h-4" />;
      case "pending": return <Pause className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Template download function
  const downloadJobTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      
      // Template data with comprehensive job fields
      const templateData = [
        {
          "Customer Name *": "ABC Electronics",
          "Pickup Address *": "123 Main St, Cape Town, 8001", 
          "Delivery Address *": "456 Oak Ave, Cape Town, 8002",
          "Scheduled Date *": "2024-01-15",
          "Priority": "medium",
          "Notes": "Handle with care - fragile items",
          "Driver Username": "john.smith"
        },
        {
          "Customer Name *": "XYZ Furniture",
          "Pickup Address *": "789 Industrial Rd, Cape Town, 8003",
          "Delivery Address *": "321 Residential St, Cape Town, 8004", 
          "Scheduled Date *": "2024-01-16",
          "Priority": "high",
          "Notes": "Large furniture delivery",
          "Driver Username": "jane.doe"
        }
      ];
      
      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 15 },
        { wch: 12 }, { wch: 25 }, { wch: 15 }
      ];
      
      const instructionsData = [
        { "Field": "Customer Name *", "Description": "Name of the customer", "Example": "ABC Electronics", "Notes": "Required" },
        { "Field": "Pickup Address *", "Description": "Full pickup address", "Example": "123 Main St, Cape Town, 8001", "Notes": "Required" },
        { "Field": "Delivery Address *", "Description": "Full delivery address", "Example": "456 Oak Ave, Cape Town, 8002", "Notes": "Required" },
        { "Field": "Scheduled Date *", "Description": "Date for job execution", "Example": "2024-01-15", "Notes": "Required - YYYY-MM-DD format" },
        { "Field": "Priority", "Description": "Job priority level", "Example": "medium", "Notes": "low, medium, or high" },
        { "Field": "Notes", "Description": "Additional job notes", "Example": "Handle with care", "Notes": "Optional" },
        { "Field": "Driver Username", "Description": "Assigned driver username", "Example": "john.smith", "Notes": "Optional - must exist in system" }
      ];
      
      const instructionsWS = XLSX.utils.json_to_sheet(instructionsData);
      instructionsWS['!cols'] = [
        { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 35 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Jobs Template");
      XLSX.utils.book_append_sheet(wb, instructionsWS, "Instructions");
      XLSX.writeFile(wb, "job_import_template.xlsx");
      
      toast({
        title: "Template Downloaded",
        description: "Job import template downloaded successfully",
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
    setShowBulkImportDialog(true);
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

  const processJobsBulkImport = async () => {
    if (!excelData || excelData.length === 0) {
      toast({
        title: "Error",
        description: "No data to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const jobsToImport = excelData.map((row: any) => {
        // Smart auto-mapping for common column variations
        const getFieldValue = (possibleKeys: string[]) => {
          for (const key of possibleKeys) {
            const exactMatch = row[key];
            if (exactMatch) return exactMatch;
            
            // Case-insensitive search
            const lowerKey = Object.keys(row).find(k => 
              k.toLowerCase().includes(key.toLowerCase()) ||
              key.toLowerCase().includes(k.toLowerCase())
            );
            if (lowerKey) return row[lowerKey];
          }
          return "";
        };

        // Handle date formatting - only set if valid date provided
        const rawDate = getFieldValue(['Scheduled Date', 'Date', 'scheduled_date']);
        let scheduledDate = '';
        if (rawDate) {
          try {
            if (typeof rawDate === 'number') {
              // Excel serial date
              const excelDate = new Date((rawDate - 25569) * 86400 * 1000);
              scheduledDate = excelDate.toISOString();
            } else {
              const parsedDate = new Date(rawDate);
              if (!isNaN(parsedDate.getTime())) {
                scheduledDate = parsedDate.toISOString();
              }
            }
          } catch (error) {
            console.error('Date parsing error for:', rawDate);
          }
        }

        // Enhanced driver matching with smart suggestions
        const driverUsername = getFieldValue(['Driver Username', 'Driver', 'driver_username', 'Driver Name', 'Assigned Driver']);
        let driverId = undefined;
        let driverMatchInfo = null;
        
        if (driverUsername && String(driverUsername).trim().toLowerCase() !== 'allocate later') {
          const searchTerm = String(driverUsername).trim().toLowerCase();
          
          // Try exact matches first
          let foundDriver = drivers.find(d => 
            d.username.toLowerCase() === searchTerm ||
            d.email?.toLowerCase() === searchTerm
          );
          
          // Try name combinations if no exact match
          if (!foundDriver) {
            foundDriver = drivers.find(d => {
              const fullName = d.name.toLowerCase();
              return fullName === searchTerm || 
                     fullName.includes(searchTerm) ||
                     searchTerm.includes(fullName);
            });
          }
          
          // Try partial matches as last resort
          if (!foundDriver) {
            foundDriver = drivers.find(d => 
              d.name.toLowerCase().includes(searchTerm) ||
              d.username.toLowerCase().includes(searchTerm)
            );
          }
          
          if (foundDriver) {
            driverId = foundDriver.id;
            driverMatchInfo = {
              originalInput: driverUsername,
              matchedDriver: `${foundDriver.name} (${foundDriver.username})`,
              matchType: 'found'
            };
          } else {
            driverMatchInfo = {
              originalInput: driverUsername,
              matchedDriver: null,
              matchType: 'not_found'
            };
          }
        } else if (!driverUsername || String(driverUsername).trim().toLowerCase() === 'allocate later') {
          driverMatchInfo = {
            originalInput: driverUsername || 'Empty',
            matchedDriver: 'Will be allocated later',
            matchType: 'allocate_later'
          };
        }

        return {
          customerName: String(getFieldValue(['Customer Name', 'Customer', 'customer_name'])).trim(),
          pickupAddress: String(getFieldValue(['Pickup Address', 'Pickup', 'pickup_address'])).trim(),
          deliveryAddress: String(getFieldValue(['Delivery Address', 'Delivery', 'delivery_address'])).trim(),
          scheduledDate,
          priority: String(getFieldValue(['Priority', 'priority']) || 'medium').trim(),
          notes: String(getFieldValue(['Notes', 'notes']) || '').trim(),
          driverId,
          driverMatchInfo // Include driver matching details for reporting
        };
      });

      // Analyze driver matching statistics
      const driverStats = jobsToImport.reduce((stats, job) => {
        if (job.driverMatchInfo) {
          switch (job.driverMatchInfo.matchType) {
            case 'found':
              stats.matched++;
              break;
            case 'not_found':
              stats.unmatched++;
              stats.unmatchedDrivers.push(job.driverMatchInfo.originalInput);
              break;
            case 'allocate_later':
              stats.allocateLater++;
              break;
          }
        }
        return stats;
      }, { matched: 0, unmatched: 0, allocateLater: 0, unmatchedDrivers: [] as string[] });

      // Send to bulk import API
      const response = await apiRequest('POST', '/api/jobs/bulk-import', { jobs: jobsToImport }) as any;
      
      if (response && response.results) {
        const { successful, failed, errors } = response.results;
        
        // Enhanced success message with driver allocation stats
        let description = `${successful} jobs imported successfully`;
        
        if (driverStats.matched > 0) {
          description += `\n✅ ${driverStats.matched} drivers matched automatically`;
        }
        if (driverStats.allocateLater > 0) {
          description += `\n⏳ ${driverStats.allocateLater} jobs marked for later allocation`;
        }
        if (driverStats.unmatched > 0) {
          description += `\n⚠️ ${driverStats.unmatched} drivers not found: ${driverStats.unmatchedDrivers.slice(0, 3).join(', ')}${driverStats.unmatchedDrivers.length > 3 ? '...' : ''}`;
        }
        
        if (failed > 0) {
          toast({
            title: `Import completed with issues`,
            description: `${description}\n❌ ${failed} jobs failed to import. Check console for details.`,
            variant: "destructive",
          });
          console.error('Import errors:', errors);
          console.log('Driver matching statistics:', driverStats);
        } else {
          toast({
            title: "🎉 Bulk Import Successful!",
            description: description,
          });
          
          if (driverStats.unmatched > 0) {
            console.log('Unmatched drivers (consider adding these to the system):', driverStats.unmatchedDrivers);
          }
        }

        // Refresh jobs list
        queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
        
        // Reset state
        setShowBulkImportDialog(false);
        setSelectedFile(null);
        setExcelData(null);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Error",
        description: "Failed to import jobs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
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

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    customer.phone.includes(customerSearchTerm) ||
    customer.address.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

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
    createCustomerMutation.mutate({
      ...data,
      ...(geocodedData?.latitude && geocodedData?.longitude && {
        latitude: geocodedData.latitude,
        longitude: geocodedData.longitude,
      }),
    });
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Jobs & Dispatch
          </TabsTrigger>
          <TabsTrigger value="reassignment" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Job Reassignment
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
              <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-[#0097B8] hover:bg-[#007a99] text-white">
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
                                <FormLabel>Customer Name * {selectedCustomer && <span className="text-green-600">(Selected from address book)</span>}</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input 
                                      placeholder="Start typing customer name..." 
                                      value={customerSearchValue}
                                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                                      className="w-full"
                                    />
                                    {customerSearchValue && !selectedCustomer && filteredCustomersForDropdown.length > 0 && (
                                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {filteredCustomersForDropdown.map((customer) => (
                                          <button
                                            key={customer.id}
                                            type="button"
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 flex items-center justify-between"
                                            onClick={() => handleCustomerSelect(customer)}
                                          >
                                            <div>
                                              <div className="font-medium">{customer.name}</div>
                                              <div className="text-sm text-gray-500">{customer.phone}</div>
                                            </div>
                                            <div className="text-xs text-blue-600">{customer.totalJobs} jobs</div>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
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
                                <FormLabel>Customer Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="customer@company.com" {...field} />
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
                                <FormLabel>Customer Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="+27 11 123 4567" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      {/* Required Fields */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Required Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Job Type Selection */}
                          <FormField
                            control={jobForm.control}
                            name="jobType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Job Type *</FormLabel>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant={field.value === "delivery" ? "default" : "outline"}
                                    size="sm"
                                    className={`flex-1 ${field.value === "delivery" ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-blue-600 text-blue-600 hover:bg-blue-50"}`}
                                    onClick={() => field.onChange("delivery")}
                                  >
                                    Delivery
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={field.value === "pickup" ? "default" : "outline"}
                                    size="sm"
                                    className={`flex-1 ${field.value === "pickup" ? "bg-purple-600 hover:bg-purple-700 text-white" : "border-purple-600 text-purple-600 hover:bg-purple-50"}`}
                                    onClick={() => field.onChange("pickup")}
                                  >
                                    Pickup
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Address Fields with Conditional Graying */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="pickupAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={selectedJobType === "delivery" ? "text-gray-400" : ""}>Pickup Address *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="123 Main St, City" 
                                      {...field} 
                                      disabled={selectedJobType === "delivery"}
                                      className={selectedJobType === "delivery" ? "bg-gray-100 text-gray-400" : ""}
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
                                  <FormLabel className={selectedJobType === "pickup" ? "text-gray-400" : ""}>Delivery Address *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="456 Oak Ave, Town" 
                                      {...field} 
                                      disabled={selectedJobType === "pickup"}
                                      className={selectedJobType === "pickup" ? "bg-gray-100 text-gray-400" : ""}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          {/* Scheduled Date */}
                          <FormField
                            control={jobForm.control}
                            name="scheduledDate"
                            render={({ field }) => (
                              <FormItem className="md:w-1/2">
                                <FormLabel>Scheduled Date *</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
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
                        <CardContent className="space-y-6">
                          {/* Scheduled Time */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="scheduledTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Scheduled Time</FormLabel>
                                  <FormControl>
                                    <Input type="time" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Circuit-Style Job Configuration */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                            {/* Package Count */}
                            <FormField
                              control={jobForm.control}
                              name="packageCount"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Packages
                                  </FormLabel>
                                  <div className="flex items-center gap-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-8 h-8 p-0"
                                      onClick={() => field.onChange(Math.max(1, field.value - 1))}
                                    >
                                      -
                                    </Button>
                                    <span className="text-lg font-semibold w-12 text-center">{field.value}</span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-8 h-8 p-0"
                                      onClick={() => field.onChange(field.value + 1)}
                                    >
                                      +
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Order Priority */}
                            <FormField
                              control={jobForm.control}
                              name="orderPriority"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Order Priority</FormLabel>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={field.value === "first" ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => field.onChange("first")}
                                    >
                                      First
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={field.value === "auto" ? "default" : "outline"}
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => field.onChange("auto")}
                                    >
                                      Auto
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={field.value === "last" ? "outline" : "outline"}
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => field.onChange("last")}
                                    >
                                      Last
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Empty space where job type was - now moved to required section */}
                            <div></div>

                            {/* Time at Stop */}
                            <FormField
                              control={jobForm.control}
                              name="timeAtStop"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Time at Stop (minutes)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="5"
                                      {...field}
                                      onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Timing and Access */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={jobForm.control}
                              name="arrivalTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Arrival Time</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="time"
                                      placeholder="09:00"
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </FormControl>
                                  <p className="text-xs text-gray-500 mt-1">Leave empty for "Anytime"</p>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={jobForm.control}
                              name="accessInstructions"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Access Instructions</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Ring doorbell, side entrance..." {...field} value={field.value || ""} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={jobForm.control}
                            name="packageDetails"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Package Details</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Electronics, fragile items, documents..." {...field} />
                                </FormControl>
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
                                  <Textarea placeholder="Ring doorbell, signature required..." {...field} />
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
                                  <Textarea placeholder="Internal notes..." {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>

                      {/* Driver Assignment */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Driver Assignment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <FormField
                            control={jobForm.control}
                            name="driverId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assign Driver</FormLabel>
                                <FormControl>
                                  <DriverSelector
                                    value={field.value?.toString() || ""}
                                    onValueChange={(val) => field.onChange(val ? parseInt(val) : null)}
                                    placeholder="Search and select driver..."
                                    showAllocateLater={true}
                                    showAutoSuggest={true}
                                    pickupAddress={jobForm.watch("pickupAddress")}
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
              
              <Button 
                onClick={handleOneClickOptimize}
                disabled={optimizeRoutesMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                {optimizeRoutesMutation.isPending ? "Optimizing..." : "One-Click Optimize"}
              </Button>
              
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
            </div>
          </div>

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

          {/* Smart Route Suggestions */}
          <SmartRouteSuggestions
            selectedJobs={selectedJobs}
            onSuggestionApplied={() => {
              setSelectedJobs([]);
              queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
            }}
          />

        </TabsContent>

        {/* Job Reassignment Tab */}
        <TabsContent value="reassignment" className="space-y-6">
          <JobReassignmentInterface />
        </TabsContent>

        {/* Address Book Tab */}
        <TabsContent value="address-book" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search customers..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog open={showCreateCustomerDialog} onOpenChange={setShowCreateCustomerDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center">
                      <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                      Add New Customer
                    </DialogTitle>
                  </DialogHeader>
                  
                  <Form {...customerForm}>
                    <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={customerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Customer Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="ABC Electronics Ltd" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="contact@abc.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="+27 11 123 4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Address * <span className="text-xs text-blue-600">(Smart geocoding enabled)</span></FormLabel>
                              <FormControl>
                                <AddressAutoComplete
                                  value={field.value}
                                  onChange={field.onChange}
                                  onAddressSelect={handleAddressSelect}
                                  placeholder="Start typing an address..."
                                />
                              </FormControl>
                              <FormMessage />
                              {geocodedData && (
                                <div className="text-xs text-green-600 mt-1 flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  <span>Lat: {geocodedData.latitude?.toFixed(6)}, Lng: {geocodedData.longitude?.toFixed(6)}</span>
                                  <span className="text-blue-600">• 50m geofence created</span>
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Johannesburg" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code *</FormLabel>
                              <FormControl>
                                <Input placeholder="2000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={customerForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Special delivery instructions..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateCustomerDialog(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCustomerMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Address Book ({filteredCustomers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Coordinates</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="font-medium">{customer.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            {customer.email && (
                              <div className="flex items-center text-gray-600">
                                <Mail className="w-3 h-3 mr-1" />
                                {customer.email}
                              </div>
                            )}
                            <div className="flex items-center text-gray-600">
                              <Phone className="w-3 h-3 mr-1" />
                              {customer.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.address}</div>
                            <div className="text-gray-500">{customer.city}, {customer.postalCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            {customer.latitude && customer.longitude ? (
                              <div className="space-y-1">
                                <div className="flex items-center text-green-600">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>Lat: {typeof customer.latitude === 'string' ? parseFloat(customer.latitude).toFixed(4) : customer.latitude?.toFixed(4)}</span>
                                </div>
                                <div className="flex items-center text-blue-600">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>Lng: {typeof customer.longitude === 'string' ? parseFloat(customer.longitude).toFixed(4) : customer.longitude?.toFixed(4)}</span>
                                </div>
                                <div className="text-gray-500">50m geofence</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">No coordinates</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{customer.totalJobs} jobs</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteCustomerMutation.mutate(customer.id)}
                              disabled={deleteCustomerMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3 text-red-600" />
                            </Button>
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
      </Tabs>

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
              <p>• Required fields: Customer Name, Pickup Address, Delivery Address, Scheduled Date</p>
              <p>• Smart column mapping detects common field variations</p>
              <p>• <strong>Enhanced Driver Matching:</strong> Searches by username, full name, first name, last name, and email</p>
              <p>• Use "Allocate Later" in Driver column to assign manually later</p>
              <p>• Leave Driver column empty for batch allocation after import</p>
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
              disabled={!excelData || excelData.length === 0 || isImporting}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-import-jobs"
            >
              {isImporting ? "Importing..." : "Import Jobs"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}