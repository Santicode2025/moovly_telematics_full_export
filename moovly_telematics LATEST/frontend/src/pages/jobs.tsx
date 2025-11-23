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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { sendPushNotification } from "@/lib/pushService";
import { Plus, Search, Filter, Package, Clock, MapPin, User, Car, AlertCircle, CheckCircle, Pause, XCircle, Download, Upload, FileSpreadsheet } from "lucide-react";
import { insertJobSchema, type Job, type Driver, type Vehicle } from "@shared/schema";
import { z } from "zod";

const createJobFormSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  jobType: z.enum(["delivery", "pickup"], { required_error: "Job type is required" }),
  pickupAddress: z.string().min(1, "Pickup address is required"),
  deliveryAddress: z.string().min(1, "Delivery address is required"),
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().optional(),
  driverId: z.number().optional(),
  orderPriority: z.enum(["first", "auto", "last"]).default("auto"),
  arrivalTime: z.string().default("Anytime"),
  timeAtStop: z.number().default(5),
  packageCount: z.number().default(1),
  notes: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  packageDetails: z.string().optional(),
  specialInstructions: z.string().optional(),
  accessInstructions: z.string().optional(),
});

type CreateJobFormData = z.infer<typeof createJobFormSchema>;

export default function JobsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Customer autocomplete states
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
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

  const { data: customers = [] } = useQuery<any[]>({
    queryKey: ["/api/customers"],
  });

  const form = useForm<CreateJobFormData>({
    resolver: zodResolver(createJobFormSchema),
    defaultValues: {
      customerName: "",
      jobType: "delivery",
      pickupAddress: "",
      deliveryAddress: "",
      scheduledDate: "",
      scheduledTime: "",
      driverId: undefined,
      orderPriority: "auto",
      arrivalTime: "Anytime",
      timeAtStop: 5,
      packageCount: 1,
      notes: "",
      customerPhone: "",
      customerEmail: "",
      packageDetails: "",
      specialInstructions: "",
      accessInstructions: "",
    },
  });

  // Watch job type for conditional logic
  const jobType = form.watch("jobType");

  const createJobMutation = useMutation({
    mutationFn: async (data: CreateJobFormData) => {
      const formattedData = {
        ...data,
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        scheduledTime: data.scheduledTime ? new Date(`${data.scheduledDate}T${data.scheduledTime}`).toISOString() : undefined,
      };
      return await apiRequest("POST", "/api/jobs", formattedData);
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      
      // Send push notification to assigned driver
      if (variables.driverId) {
        try {
          await sendPushNotification(variables.driverId, {
            title: "New Job Assigned",
            body: `${variables.jobType || 'Delivery'} job for ${variables.customerName}`,
            data: { ...variables }
          });
        } catch (error) {
          console.error("Failed to send push notification:", error);
        }
      }
      
      form.reset();
      setShowCreateDialog(false);
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

        // Handle driver username to ID mapping with normalization
        const driverUsername = getFieldValue(['Driver Username', 'Driver', 'driver_username']);
        let driverId = undefined;
        if (driverUsername) {
          const normalizedUsername = String(driverUsername).trim().toLowerCase();
          const foundDriver = drivers.find(d => 
            d.username.toLowerCase() === normalizedUsername ||
            d.name.toLowerCase() === normalizedUsername ||
            d.email?.toLowerCase() === normalizedUsername
          );
          if (foundDriver) {
            driverId = foundDriver.id;
          }
        }

        return {
          customerName: String(getFieldValue(['Customer Name', 'Customer', 'customer_name'])).trim(),
          pickupAddress: String(getFieldValue(['Pickup Address', 'Pickup', 'pickup_address'])).trim(),
          deliveryAddress: String(getFieldValue(['Delivery Address', 'Delivery', 'delivery_address'])).trim(),
          scheduledDate,
          priority: String(getFieldValue(['Priority', 'priority']) || 'medium').trim(),
          notes: String(getFieldValue(['Notes', 'notes']) || '').trim(),
          driverId
        };
      });

      // Send to bulk import API
      const response = await apiRequest('POST', '/api/jobs/bulk-import', { jobs: jobsToImport }) as any;
      
      if (response && response.results) {
        const { successful, failed, errors } = response.results;
        
        if (failed > 0) {
          toast({
            title: `Import completed with issues`,
            description: `${successful} jobs imported successfully, ${failed} failed. Check console for details.`,
            variant: "destructive",
          });
          console.error('Import errors:', errors);
        } else {
          toast({
            title: "Success",
            description: `${successful} jobs imported successfully`,
          });
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

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer: any) =>
    customer.name?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Handle customer selection
  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    form.setValue("customerName", customer.name);
    if (customer.phone) form.setValue("customerPhone", customer.phone);
    if (customer.email) form.setValue("customerEmail", customer.email);
  };

  const onSubmit = (data: CreateJobFormData) => {
    createJobMutation.mutate(data);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs & Dispatch</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create, assign, and manage delivery jobs
          </p>
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
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
        
        {/* New Job Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* REQUIRED FIELDS Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600 border-b border-red-200 pb-2">
                    REQUIRED FIELDS
                  </h3>
                  
                  {/* Customer Name with Autocomplete */}
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="Type customer name..."
                              value={customerSearch}
                              onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                field.onChange(e.target.value);
                                setSelectedCustomer(null);
                              }}
                              data-testid="input-customer-name"
                            />
                            {customerSearch && !selectedCustomer && filteredCustomers.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                {filteredCustomers.slice(0, 5).map((customer: any) => (
                                  <div
                                    key={customer.id}
                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleCustomerSelect(customer)}
                                  >
                                    <div className="font-medium">{customer.name}</div>
                                    {customer.phone && <div className="text-sm text-gray-600">{customer.phone}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Job Type */}
                  <FormField
                    control={form.control}
                    name="jobType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-job-type">
                              <SelectValue placeholder="Select job type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="delivery">Delivery</SelectItem>
                            <SelectItem value="pickup">Pickup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Pickup Address - Disabled when job type is Delivery */}
                  <FormField
                    control={form.control}
                    name="pickupAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter pickup address"
                            className={jobType === "delivery" ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : ""}
                            disabled={jobType === "delivery"}
                            data-testid="input-pickup-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delivery Address - Disabled when job type is Pickup */}
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Enter delivery address"
                            className={jobType === "pickup" ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400" : ""}
                            disabled={jobType === "pickup"}
                            data-testid="input-delivery-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Scheduled Date */}
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            data-testid="input-scheduled-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* OPTIONAL FIELDS Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-blue-600 border-b border-blue-200 pb-2">
                    OPTIONAL FIELDS
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Scheduled Time */}
                    <FormField
                      control={form.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled Time</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="time"
                              data-testid="input-scheduled-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Assign Driver */}
                    <FormField
                      control={form.control}
                      name="driverId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Driver</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger data-testid="select-driver">
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {drivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                  {driver.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Order Priority */}
                    <FormField
                      control={form.control}
                      name="orderPriority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Priority</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-order-priority">
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="first">First</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="last">Last</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Arrival Time */}
                    <FormField
                      control={form.control}
                      name="arrivalTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Arrival Time</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Anytime"
                              data-testid="input-arrival-time"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Time at Stop */}
                    <FormField
                      control={form.control}
                      name="timeAtStop"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time at Stop (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 5)}
                              data-testid="input-time-at-stop"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Package Count */}
                    <FormField
                      control={form.control}
                      name="packageCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Count</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min="1"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              data-testid="input-package-count"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Customer Phone */}
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Phone</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter phone number"
                              data-testid="input-customer-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Customer Email */}
                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Enter email address"
                              data-testid="input-customer-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Text Areas */}
                  <div className="space-y-4">
                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Additional notes or comments"
                              data-testid="input-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Package Details */}
                    <FormField
                      control={form.control}
                      name="packageDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Package Details</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe package contents, size, weight, etc."
                              data-testid="input-package-details"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Special Instructions */}
                    <FormField
                      control={form.control}
                      name="specialInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Instructions</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Special handling or delivery instructions"
                              data-testid="input-special-instructions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Access Instructions */}
                    <FormField
                      control={form.control}
                      name="accessInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Instructions</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Gate code, buzzer number, etc."
                              data-testid="input-access-instructions"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      form.reset();
                      setCustomerSearch("");
                      setSelectedCustomer(null);
                    }}
                    data-testid="button-cancel-job"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={createJobMutation.isPending}
                    data-testid="button-create-job"
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
              <p>• Required fields: Customer Name, Pickup Address, Delivery Address, Scheduled Date</p>
              <p>• Smart column mapping detects common field variations</p>
              <p>• Driver Username will be resolved to system driver if found</p>
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

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search jobs by customer, location, or job number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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