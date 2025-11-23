import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Info
} from "lucide-react";
import { useLocation } from "wouter";

interface BulkImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export default function CustomerBulkImportPage() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<{ [key: string]: string } | null>(null);
  const [showCustomMapping, setShowCustomMapping] = useState(false);
  const { toast } = useToast();

  // Sample data structure for the template
  const templateData = [
    {
      "Pickup Name *": "John Smith",
      "Pickup Phone *": "0123456789",
      "Pickup Email": "john@example.com",
      "Pickup Address *": "123 Main Street, Somerset West",
      "Pickup Instructions": "Ring the doorbell",
      "Delivery Name *": "Jane Doe", 
      "Delivery Phone *": "0987654321",
      "Delivery Email": "jane@example.com",
      "Delivery Address *": "456 Oak Avenue, Strand",
      "Delivery Instructions": "Leave at front door",
      "Address Type": "street",
      "Order Priority": "Auto",
      "Job Type": "Delivery",
      "Arrival Time": "10:00",
      "Time at Stop": "5",
      "Package Count": "1",
      "Access Instructions": "Ring doorbell twice",
      "Package Description *": "Electronics package",
      "Package Weight": "2kg",
      "Package Dimensions": "30x20x10cm",
      "Package Value": "500",
      "Special Instructions": "Handle with care"
    },
    {
      "Pickup Name *": "ABC Company",
      "Pickup Phone *": "0211234567",
      "Pickup Email": "orders@abccompany.com",
      "Pickup Address *": "///words.example.address",
      "Pickup Instructions": "Reception desk",
      "Delivery Name *": "XYZ Store",
      "Delivery Phone *": "0217654321",
      "Delivery Email": "deliveries@xyzstore.com",
      "Delivery Address *": "789 Pine Road, Helderberg",
      "Delivery Instructions": "Loading dock entrance",
      "Address Type": "what3words",
      "Order Priority": "First",
      "Job Type": "Pickup",
      "Arrival Time": "Anytime",
      "Time at Stop": "3",
      "Package Count": "3",
      "Access Instructions": "Gate code: 1234",
      "Package Description *": "Office supplies",
      "Package Weight": "5kg",
      "Package Dimensions": "40x30x20cm",
      "Package Value": "1200",
      "Special Instructions": "Business delivery only"
    }
  ];

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    
    // Set column widths
    const wscols = [
      { wch: 15 }, // Pickup Name
      { wch: 15 }, // Pickup Phone
      { wch: 25 }, // Pickup Email
      { wch: 40 }, // Pickup Address
      { wch: 20 }, // Pickup Instructions
      { wch: 15 }, // Delivery Name
      { wch: 15 }, // Delivery Phone
      { wch: 25 }, // Delivery Email
      { wch: 40 }, // Delivery Address
      { wch: 20 }, // Delivery Instructions
      { wch: 12 }, // Address Type
      { wch: 15 }, // Order Priority
      { wch: 12 }, // Job Type
      { wch: 12 }, // Arrival Time
      { wch: 12 }, // Time at Stop
      { wch: 15 }, // Package Count
      { wch: 25 }, // Access Instructions
      { wch: 30 }, // Package Description
      { wch: 12 }, // Package Weight
      { wch: 15 }, // Package Dimensions
      { wch: 12 }, // Package Value
      { wch: 25 }  // Special Instructions
    ];
    ws['!cols'] = wscols;

    // Add header styling (make required fields bold)
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "2563EB" } } };
    const requiredStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "DC2626" } } };
    
    // Apply styles to headers
    const headers = Object.keys(templateData[0]);
    headers.forEach((header, index) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
      if (!ws[cellAddress]) ws[cellAddress] = { v: header, t: 's' };
      ws[cellAddress].s = header.includes('*') ? requiredStyle : headerStyle;
    });

    XLSX.utils.book_append_sheet(wb, ws, "Bulk Order Template");
    
    // Add instructions sheet
    const instructions = [
      ["BULK ORDER IMPORT INSTRUCTIONS"],
      [""],
      ["Required Fields (marked with *)"],
      ["- Pickup Name: Full name of person for pickup"],
      ["- Pickup Phone: Contact number (10+ digits)"],
      ["- Pickup Address: Complete pickup address"],
      ["- Delivery Name: Full name of recipient"],
      ["- Delivery Phone: Recipient contact number"],
      ["- Delivery Address: Complete delivery address"],
      ["- Package Description: Describe what you're sending"],
      [""],
      ["Optional Fields"],
      ["- Email addresses: For notifications"],
      ["- Instructions: Special pickup/delivery notes"],
      ["- Package details: Weight, dimensions, value"],
      ["- Special Instructions: Handling requirements"],
      [""],
      ["Address Types"],
      ["- street: Regular street addresses"],
      ["- what3words: Use ///word.word.word format"],
      [""],
      ["Delivery Scheduling"],
      ["- ASAP Delivery: TRUE for immediate, FALSE for scheduled"],
      ["- Preferred Delivery Time: Use HH:MM format (24-hour)"],
      [""],
      ["Tips for Success"],
      ["- Keep pickup/delivery addresses accurate"],
      ["- Include contact numbers for both parties"],
      ["- Be specific in package descriptions"],
      ["- Use clear, detailed instructions"],
      ["- Maximum 1000 orders per upload"],
      [""],
      ["After Upload"],
      ["- Orders will be automatically assigned to drivers in delivery zones"],
      ["- You'll receive confirmation SMS and email for each order"],
      ["- Track all orders in your customer dashboard"],
      ["- Chat with dispatchers if you have questions"]
    ];
    
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructions);
    instructionsWs['!cols'] = [{ wch: 60 }];
    
    // Style the title
    if (instructionsWs['A1']) {
      instructionsWs['A1'].s = { font: { bold: true, size: 16, color: { rgb: "2563EB" } } };
    }
    
    XLSX.utils.book_append_sheet(wb, instructionsWs, "Instructions");

    XLSX.writeFile(wb, "moovly_go_bulk_order_template.xlsx");
    
    toast({
      title: "Template Downloaded",
      description: "Bulk order template has been downloaded to your device",
    });
  };

  // Check for column mapping on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mapped') === 'true') {
      const mappingData = sessionStorage.getItem('columnMapping');
      if (mappingData) {
        const parsed = JSON.parse(mappingData);
        setColumnMapping(parsed.mappings);
        setSelectedFile(parsed.file);
        sessionStorage.removeItem('columnMapping');
        setShowCustomMapping(true);
        
        toast({
          title: "Column Mapping Applied",
          description: "Your custom column mappings are ready for upload.",
        });
      }
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && 
          file.type !== "application/vnd.ms-excel") {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setImportResult(null);
      setColumnMapping(null);
      setShowCustomMapping(false);
    }
  };

  const processExcelFile = async (file: File): Promise<any[]> => {
    const XLSX = await import('xlsx');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const validateOrderRow = (row: any, rowIndex: number): string[] => {
    const errors: string[] = [];
    
    // Required field validations
    if (!row["Pickup Name *"]?.trim()) {
      errors.push(`Row ${rowIndex}: Pickup Name is required`);
    }
    
    if (!row["Pickup Phone *"]?.toString().trim()) {
      errors.push(`Row ${rowIndex}: Pickup Phone is required`);
    } else if (row["Pickup Phone *"].toString().length < 10) {
      errors.push(`Row ${rowIndex}: Pickup Phone must be at least 10 digits`);
    }
    
    if (!row["Pickup Address *"]?.trim()) {
      errors.push(`Row ${rowIndex}: Pickup Address is required`);
    }
    
    if (!row["Delivery Name *"]?.trim()) {
      errors.push(`Row ${rowIndex}: Delivery Name is required`);
    }
    
    if (!row["Delivery Phone *"]?.toString().trim()) {
      errors.push(`Row ${rowIndex}: Delivery Phone is required`);
    } else if (row["Delivery Phone *"].toString().length < 10) {
      errors.push(`Row ${rowIndex}: Delivery Phone must be at least 10 digits`);
    }
    
    if (!row["Delivery Address *"]?.trim()) {
      errors.push(`Row ${rowIndex}: Delivery Address is required`);
    }
    
    if (!row["Package Description *"]?.trim()) {
      errors.push(`Row ${rowIndex}: Package Description is required`);
    }
    
    // Email validations (if provided)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (row["Pickup Email"] && !emailRegex.test(row["Pickup Email"])) {
      errors.push(`Row ${rowIndex}: Invalid Pickup Email format`);
    }
    if (row["Delivery Email"] && !emailRegex.test(row["Delivery Email"])) {
      errors.push(`Row ${rowIndex}: Invalid Delivery Email format`);
    }
    
    // Address type validation
    if (row["Address Type"] && !["street", "what3words"].includes(row["Address Type"])) {
      errors.push(`Row ${rowIndex}: Address Type must be 'street' or 'what3words'`);
    }
    
    // Time format validation
    if (row["Preferred Delivery Time"] && !/^\d{2}:\d{2}$/.test(row["Preferred Delivery Time"])) {
      errors.push(`Row ${rowIndex}: Preferred Delivery Time must be in HH:MM format`);
    }
    
    return errors;
  };

  const uploadBulkOrders = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an Excel file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Parse Excel file
      const excelData = await processExcelFile(selectedFile);
      
      if (excelData.length === 0) {
        throw new Error("Excel file is empty or has no data");
      }
      
      if (excelData.length > 1000) {
        throw new Error("Maximum 1000 orders allowed per upload");
      }
      
      // Validate all rows
      const allErrors: Array<{ row: number; field: string; message: string; }> = [];
      const validOrders: any[] = [];
      
      excelData.forEach((row, index) => {
        let transformedRow = row;
        
        // Apply column mapping if available
        if (columnMapping) {
          transformedRow = {};
          Object.entries(columnMapping).forEach(([systemField, excelColumn]) => {
            const fieldMapping: { [key: string]: string } = {
              'pickupName': 'Pickup Name *',
              'pickupPhone': 'Pickup Phone *',
              'pickupEmail': 'Pickup Email',
              'pickupAddress': 'Pickup Address *',
              'pickupInstructions': 'Pickup Instructions',
              'deliveryName': 'Delivery Name *',
              'deliveryPhone': 'Delivery Phone *',
              'deliveryEmail': 'Delivery Email',
              'deliveryAddress': 'Delivery Address *',
              'deliveryInstructions': 'Delivery Instructions',
              'addressType': 'Address Type',
              'isAsapDelivery': 'ASAP Delivery',
              'preferredDeliveryTime': 'Preferred Delivery Time',
              'packageDescription': 'Package Description *',
              'packageWeight': 'Package Weight',
              'packageDimensions': 'Package Dimensions',
              'packageValue': 'Package Value',
              'specialInstructions': 'Special Instructions'
            };
            
            const standardField = fieldMapping[systemField];
            if (standardField) {
              transformedRow[standardField] = row[excelColumn];
            }
          });
        }
        
        const rowErrors = validateOrderRow(transformedRow, index + 2);
        
        if (rowErrors.length === 0) {
          // Transform row data to match API format
          const orderData = {
            pickupName: transformedRow["Pickup Name *"],
            pickupPhone: transformedRow["Pickup Phone *"]?.toString(),
            pickupEmail: transformedRow["Pickup Email"] || "",
            pickupAddress: transformedRow["Pickup Address *"],
            pickupInstructions: transformedRow["Pickup Instructions"] || "",
            deliveryName: transformedRow["Delivery Name *"],
            deliveryPhone: transformedRow["Delivery Phone *"]?.toString(),
            deliveryEmail: transformedRow["Delivery Email"] || "",
            deliveryAddress: transformedRow["Delivery Address *"],
            deliveryInstructions: transformedRow["Delivery Instructions"] || "",
            addressType: transformedRow["Address Type"] || "street",
            isAsapDelivery: transformedRow["ASAP Delivery"]?.toString().toUpperCase() !== "FALSE",
            preferredDeliveryTime: transformedRow["Preferred Delivery Time"] || "",
            packageDescription: transformedRow["Package Description *"],
            packageWeight: transformedRow["Package Weight"] || "",
            packageDimensions: transformedRow["Package Dimensions"] || "",
            packageValue: transformedRow["Package Value"] || "",
            specialInstructions: transformedRow["Special Instructions"] || "",
          };
          
          validOrders.push(orderData);
        } else {
          rowErrors.forEach(error => {
            allErrors.push({
              row: index + 2,
              field: "validation",
              message: error
            });
          });
        }
      });
      
      // Upload valid orders
      const response = await fetch("/api/customer/bulk-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orders: validOrders }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setImportResult({
          success: true,
          totalRows: excelData.length,
          successCount: result.successCount,
          failureCount: allErrors.length + (result.failureCount || 0),
          errors: allErrors
        });
        
        toast({
          title: "Bulk Import Completed",
          description: `${result.successCount} orders uploaded successfully`,
        });
      } else {
        throw new Error(result.message || "Upload failed");
      }
      
    } catch (error) {
      console.error("Bulk upload error:", error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
    
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/customer/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Order Import</h1>
            <p className="text-gray-600">Upload multiple orders at once using Excel spreadsheet</p>
          </div>
        </div>

        {/* Instructions */}
        <Alert className="mb-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Download the template, fill in your order details, and upload to create multiple orders at once. 
            Maximum 1000 orders per upload.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Download Template */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="w-5 h-5 mr-2 text-green-600" />
                Step 1: Download Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Get the Excel template with all required fields and sample data. 
                The template includes detailed instructions and examples.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Template includes:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• All required and optional fields</li>
                  <li>• Sample data for reference</li>
                  <li>• Detailed instructions sheet</li>
                  <li>• Proper formatting examples</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Button onClick={downloadTemplate} className="w-full">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Excel Template
                </Button>
                
                <div className="text-center text-gray-500">or</div>
                
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/customer/column-mapping?back=/customer/bulk-import")} 
                  className="w-full"
                >
                  Use Your Own Excel Format
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload File */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Step 2: Upload Your File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                After filling out the template with your order details, upload the Excel file here.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="excel-file">Select Excel File</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                </div>
                
                {selectedFile && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">{selectedFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({Math.round(selectedFile.size / 1024)} KB)
                      </span>
                      {showCustomMapping && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Custom mapping applied
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={uploadBulkOrders}
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Orders
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Import Results */}
        {importResult && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                {importResult.success ? (
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                )}
                Import Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{importResult.totalRows}</div>
                  <div className="text-sm text-blue-700">Total Rows</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{importResult.successCount}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{importResult.failureCount}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
              </div>
              
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-800 mb-3">Errors Found:</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="text-sm p-3 bg-red-50 border border-red-200 rounded">
                        <span className="font-medium">Row {error.row}:</span> {error.message}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Fix the errors in your Excel file and try uploading again.
                  </p>
                </div>
              )}
              
              {importResult.successCount > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800">
                    <strong>{importResult.successCount} orders</strong> were successfully created and will be 
                    automatically assigned to drivers in their delivery zones. You can track all orders 
                    in your dashboard.
                  </p>
                  <Button 
                    onClick={() => setLocation("/customer/dashboard")} 
                    className="mt-3"
                    size="sm"
                  >
                    View Orders
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}