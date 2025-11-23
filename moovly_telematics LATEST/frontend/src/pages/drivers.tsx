import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Filter, Phone, Mail, Car, UserPlus, Download, Upload, FileSpreadsheet } from "lucide-react";
import { insertDriverSchema, type Driver } from "@shared/schema";
import { z } from "zod";

const addDriverFormSchema = insertDriverSchema.pick({
  username: true,
  name: true,
  email: true,
  phone: true,
  licenseNumber: true,
  status: true,
  idNumber: true,
  pin: true,
}).extend({
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
});

type AddDriverFormData = z.infer<typeof addDriverFormSchema>;

export default function DriversPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["/api/drivers"],
  });

  const form = useForm<AddDriverFormData>({
    resolver: zodResolver(addDriverFormSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      phone: "",
      licenseNumber: "",
      status: "active",
      idNumber: "",
      pin: "",
    },
  });

  const addDriverMutation = useMutation({
    mutationFn: async (data: AddDriverFormData) => {
      return await apiRequest("POST", "/api/drivers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      form.reset();
      setShowAddDialog(false);
      toast({
        title: "Success",
        description: "Driver added successfully",
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

  const filteredDrivers = drivers.filter((driver) => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm) ||
      driver.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || driver.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  // Template download function
  const downloadDriverTemplate = async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      
      // Template data with comprehensive driver fields
      const templateData = [
        {
          "Driver Username *": "john.smith",
          "Full Name *": "John Smith", 
          "Email Address": "john@example.com",
          "Phone Number *": "+27 82 555 1234",
          "License Number *": "ABC12345",
          "ID Number *": "8001015009088",
          "PIN *": "1234",
          "Status": "active"
        },
        {
          "Driver Username *": "jane.doe",
          "Full Name *": "Jane Doe",
          "Email Address": "jane@example.com", 
          "Phone Number *": "+27 83 444 5678",
          "License Number *": "DEF67890",
          "ID Number *": "9203105008099",
          "PIN *": "5678",
          "Status": "active"
        }
      ];
      
      const ws = XLSX.utils.json_to_sheet(templateData);
      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 20 },
        { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 12 }
      ];
      
      const instructionsData = [
        { "Field": "Driver Username *", "Description": "Unique username for driver login", "Example": "john.smith", "Notes": "Required - Must be unique" },
        { "Field": "Full Name *", "Description": "Driver's complete name", "Example": "John Smith", "Notes": "Required" },
        { "Field": "Email Address", "Description": "Contact email", "Example": "john@example.com", "Notes": "Optional" },
        { "Field": "Phone Number *", "Description": "Mobile contact number", "Example": "+27 82 555 1234", "Notes": "Required" },
        { "Field": "License Number *", "Description": "Driver's license number", "Example": "ABC12345", "Notes": "Required" },
        { "Field": "ID Number *", "Description": "National ID number", "Example": "8001015009088", "Notes": "Required" },
        { "Field": "PIN *", "Description": "4-digit driver login PIN", "Example": "1234", "Notes": "Required - Must be 4 digits" },
        { "Field": "Status", "Description": "Driver status", "Example": "active", "Notes": "active, inactive, or suspended" }
      ];
      
      const instructionsWS = XLSX.utils.json_to_sheet(instructionsData);
      instructionsWS['!cols'] = [
        { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 35 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, "Drivers Template");
      XLSX.utils.book_append_sheet(wb, instructionsWS, "Instructions");
      XLSX.writeFile(wb, "driver_import_template.xlsx");
      
      toast({
        title: "Template Downloaded",
        description: "Driver import template downloaded successfully",
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

  const handleDriversBulkImport = () => {
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

  const processDriversBulkImport = async () => {
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
      const driversToImport = excelData.map((row: any) => {
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

        return {
          username: getFieldValue(['Driver Username', 'Username', 'User', 'driver_username']),
          name: getFieldValue(['Full Name', 'Name', 'Driver Name', 'full_name']),
          email: getFieldValue(['Email Address', 'Email', 'email']),
          phone: getFieldValue(['Phone Number', 'Phone', 'Mobile', 'phone']),
          licenseNumber: getFieldValue(['License Number', 'License', 'license_number']),
          idNumber: getFieldValue(['ID Number', 'ID', 'National ID', 'id_number']),
          pin: String(getFieldValue(['PIN', 'pin'])).padStart(4, '0'),
          status: getFieldValue(['Status', 'status']) || 'active'
        };
      });

      // Send to bulk import API
      const response = await apiRequest('POST', '/api/drivers/bulk-import', { drivers: driversToImport }) as any;
      
      if (response && response.results) {
        const { successful, failed, errors } = response.results;
        
        if (failed > 0) {
          toast({
            title: `Import completed with issues`,
            description: `${successful} drivers imported successfully, ${failed} failed. Check console for details.`,
            variant: "destructive",
          });
          console.error('Import errors:', errors);
        } else {
          toast({
            title: "Success",
            description: `${successful} drivers imported successfully`,
          });
        }

        // Refresh drivers list
        queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
        
        // Reset state
        setShowBulkImportDialog(false);
        setSelectedFile(null);
        setExcelData(null);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Error",
        description: "Failed to import drivers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const onSubmit = (data: AddDriverFormData) => {
    addDriverMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Drivers</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your fleet drivers and their information
          </p>
        </div>
        <div className="flex gap-3">
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
            onClick={handleDriversBulkImport}
            className="flex items-center"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import Drivers
          </Button>
          
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Driver Username *</FormLabel>
                          <FormControl>
                            <Input placeholder="john.smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.smith@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+27 82 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="idNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="8001015009087" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678901234" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>4-Digit PIN *</FormLabel>
                          <FormControl>
                            <Input 
                              type="text"
                              inputMode="numeric"
                              maxLength={4}
                              placeholder="1234"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            Used for mobile app login
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                          </Select>
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
                    onClick={() => setShowAddDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addDriverMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addDriverMutation.isPending ? "Adding..." : "Add Driver"}
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
              Bulk Import Drivers
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    Select an Excel file to import drivers
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="driver-file-input"
                    data-testid="file-input-drivers"
                  />
                  <label
                    htmlFor="driver-file-input"
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
              <p>• Required fields: Username, Name, Phone, License, ID, PIN</p>
              <p>• Smart column mapping detects common field variations</p>
              <p>• PIN must be exactly 4 digits</p>
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
              onClick={processDriversBulkImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? "Importing..." : "Import Drivers"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search drivers by name, email, or phone..."
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
            <SelectItem value="all">All Drivers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Drivers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Drivers ({filteredDrivers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-sm text-gray-500">@{driver.username}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1" />
                          {driver.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-3 h-3 mr-1" />
                          {driver.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{driver.licenseNumber}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        driver.status === 'active' ? 'bg-green-100 text-green-800' :
                        driver.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {driver.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Car className="w-3 h-3 mr-1" />
                        {driver.vehicleId ? `Vehicle #${driver.vehicleId}` : 'Unassigned'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        MoovScore: {driver.performance || 0}
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