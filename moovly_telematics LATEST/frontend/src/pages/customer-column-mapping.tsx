import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle,
  AlertTriangle,
  Info,
  Upload
} from "lucide-react";
import { useLocation } from "wouter";

interface ColumnMapping {
  excelColumn: string;
  systemField: string;
  isRequired: boolean;
  isMapped: boolean;
}

interface PreviewData {
  [key: string]: any;
}

// System field definitions
const SYSTEM_FIELDS = [
  { key: "pickupName", label: "Pickup Name", required: true },
  { key: "pickupPhone", label: "Pickup Phone", required: true },
  { key: "pickupEmail", label: "Pickup Email", required: false },
  { key: "pickupAddress", label: "Pickup Address", required: true },
  { key: "pickupInstructions", label: "Pickup Instructions", required: false },
  { key: "deliveryName", label: "Delivery Name", required: true },
  { key: "deliveryPhone", label: "Delivery Phone", required: true },
  { key: "deliveryEmail", label: "Delivery Email", required: false },
  { key: "deliveryAddress", label: "Delivery Address", required: true },
  { key: "deliveryInstructions", label: "Delivery Instructions", required: false },
  { key: "addressType", label: "Address Type", required: false },
  { key: "orderPriority", label: "Order Priority", required: false },
  { key: "jobType", label: "Job Type", required: false },
  { key: "arrivalTime", label: "Arrival Time", required: false },
  { key: "timeAtStop", label: "Time at Stop", required: false },
  { key: "packageCount", label: "Package Count", required: false },
  { key: "accessInstructions", label: "Access Instructions", required: false },
  { key: "packageDescription", label: "Package Description", required: true },
  { key: "packageWeight", label: "Package Weight", required: false },
  { key: "packageDimensions", label: "Package Dimensions", required: false },
  { key: "packageValue", label: "Package Value", required: false },
  { key: "specialInstructions", label: "Special Instructions", required: false }
];

export default function CustomerColumnMappingPage() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [previewData, setPreviewData] = useState<PreviewData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Get back URL from query params or default to bulk import
  const backUrl = new URLSearchParams(window.location.search).get('back') || '/customer/bulk-import';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" && 
        file.type !== "application/vnd.ms-excel") {
      toast({
        title: "Invalid File Type",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    await parseExcelFile(file);
  };

  const parseExcelFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const XLSX = await import('xlsx');
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Get all data including headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        throw new Error("Excel file is empty");
      }

      // Extract column headers from first row
      const headers = (jsonData[0] as string[]).filter(header => header && header.trim());
      setExcelColumns(headers);

      // Get preview data (first 3 rows after header)
      const preview = jsonData.slice(1, 4).map((row: any) => {
        const rowData: PreviewData = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || '';
        });
        return rowData;
      });
      setPreviewData(preview);

      // Initialize column mappings
      const mappings: ColumnMapping[] = headers.map(column => {
        // Try to auto-map based on column names
        const autoMapping = autoMapColumn(column);
        return {
          excelColumn: column,
          systemField: autoMapping || '',
          isRequired: false,
          isMapped: !!autoMapping
        };
      });

      // Mark required fields
      mappings.forEach(mapping => {
        const systemField = SYSTEM_FIELDS.find(f => f.key === mapping.systemField);
        if (systemField) {
          mapping.isRequired = systemField.required;
        }
      });

      setColumnMappings(mappings);

      // Count auto-mapped fields
      const autoMappedCount = mappings.filter(m => m.isMapped).length;
      
      toast({
        title: "File Analyzed",
        description: `Found ${headers.length} columns. Auto-mapped ${autoMappedCount} fields.`,
      });

    } catch (error) {
      console.error("File parsing error:", error);
      toast({
        title: "File Parsing Error",
        description: error instanceof Error ? error.message : "Failed to parse Excel file",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
  };

  const autoMapColumn = (columnName: string): string | null => {
    const normalized = columnName.toLowerCase().replace(/[^a-z]/g, '');
    
    // Common mapping patterns
    const mappingPatterns: { [key: string]: string } = {
      'pickupname': 'pickupName',
      'fromname': 'pickupName',
      'sendername': 'pickupName',
      'pickupphone': 'pickupPhone',
      'fromphone': 'pickupPhone',
      'senderphone': 'pickupPhone',
      'orderpriority': 'orderPriority',
      'order': 'orderPriority',
      'priority': 'orderPriority',
      'jobtype': 'jobType',
      'type': 'jobType',
      'arrivaltime': 'arrivalTime',
      'arrival': 'arrivalTime',
      'timeatstop': 'timeAtStop',
      'stoptime': 'timeAtStop',
      'duration': 'timeAtStop',
      'packagecount': 'packageCount',
      'packages': 'packageCount',
      'count': 'packageCount',
      'qty': 'packageCount',
      'quantity': 'packageCount',
      'accessinstructions': 'accessInstructions',
      'access': 'accessInstructions',
      'doorcode': 'accessInstructions',
      'gatecode': 'accessInstructions',
      'buildingaccess': 'accessInstructions',
      'pickupemail': 'pickupEmail',
      'fromemail': 'pickupEmail',
      'senderemail': 'pickupEmail',
      'pickupaddress': 'pickupAddress',
      'fromaddress': 'pickupAddress',
      'senderaddress': 'pickupAddress',
      'pickupinstructions': 'pickupInstructions',
      'frominstructions': 'pickupInstructions',
      'deliveryname': 'deliveryName',
      'toname': 'deliveryName',
      'recipientname': 'deliveryName',
      'deliveryphone': 'deliveryPhone',
      'tophone': 'deliveryPhone',
      'recipientphone': 'deliveryPhone',
      'deliveryemail': 'deliveryEmail',
      'toemail': 'deliveryEmail',
      'recipientemail': 'deliveryEmail',
      'deliveryaddress': 'deliveryAddress',
      'toaddress': 'deliveryAddress',
      'recipientaddress': 'deliveryAddress',
      'deliveryinstructions': 'deliveryInstructions',
      'toinstructions': 'deliveryInstructions',
      'packagedescription': 'packageDescription',
      'description': 'packageDescription',
      'itemdescription': 'packageDescription',
      'packageweight': 'packageWeight',
      'weight': 'packageWeight',
      'packagedimensions': 'packageDimensions',
      'dimensions': 'packageDimensions',
      'size': 'packageDimensions',
      'packagevalue': 'packageValue',
      'value': 'packageValue',
      'cost': 'packageValue',
      'specialinstructions': 'specialInstructions',
      'instructions': 'specialInstructions',
      'notes': 'specialInstructions'
    };

    return mappingPatterns[normalized] || null;
  };

  const updateMapping = (excelColumn: string, systemField: string) => {
    setColumnMappings(mappings => 
      mappings.map(mapping => {
        if (mapping.excelColumn === excelColumn) {
          const field = SYSTEM_FIELDS.find(f => f.key === systemField);
          return {
            ...mapping,
            systemField,
            isRequired: field?.required || false,
            isMapped: systemField !== ''
          };
        }
        // Clear any other mappings to the same system field
        if (mapping.systemField === systemField && systemField !== '') {
          return {
            ...mapping,
            systemField: '',
            isRequired: false,
            isMapped: false
          };
        }
        return mapping;
      })
    );
  };

  const getValidationStatus = () => {
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    const mappedRequiredFields = columnMappings.filter(m => 
      m.isMapped && requiredFields.some(rf => rf.key === m.systemField)
    );
    
    const missingRequiredFields = requiredFields.filter(rf =>
      !mappedRequiredFields.some(mrf => mrf.systemField === rf.key)
    );

    return {
      isValid: missingRequiredFields.length === 0,
      missingFields: missingRequiredFields,
      mappedCount: mappedRequiredFields.length,
      totalRequired: requiredFields.length
    };
  };

  const handleOneClickAutoMap = () => {
    const updatedMappings = columnMappings.map(mapping => {
      // If not already mapped, try to auto-map
      if (!mapping.isMapped) {
        const autoMapping = autoMapColumn(mapping.excelColumn);
        if (autoMapping) {
          const field = SYSTEM_FIELDS.find(f => f.key === autoMapping);
          return {
            ...mapping,
            systemField: autoMapping,
            isRequired: field?.required || false,
            isMapped: true
          };
        }
      }
      return mapping;
    });

    // Clear duplicates - if multiple columns map to same field, keep the first one
    const finalMappings = updatedMappings.map((mapping, index) => {
      if (mapping.isMapped && mapping.systemField) {
        const isDuplicate = updatedMappings.slice(0, index).some(
          m => m.systemField === mapping.systemField && m.isMapped
        );
        if (isDuplicate) {
          return {
            ...mapping,
            systemField: '',
            isRequired: false,
            isMapped: false
          };
        }
      }
      return mapping;
    });

    setColumnMappings(finalMappings);
    
    const autoMappedCount = finalMappings.filter(m => m.isMapped).length;
    toast({
      title: "Auto-Mapping Complete",
      description: `Successfully mapped ${autoMappedCount} fields automatically.`,
    });
  };

  const proceedWithMapping = () => {
    const validation = getValidationStatus();
    if (!validation.isValid) {
      toast({
        title: "Missing Required Mappings",
        description: `Please map all required fields: ${validation.missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Create mapping object for the bulk import page
    const mappingData = {
      file: selectedFile,
      mappings: columnMappings.filter(m => m.isMapped).reduce((acc, mapping) => {
        acc[mapping.systemField] = mapping.excelColumn;
        return acc;
      }, {} as { [key: string]: string })
    };

    // Store in sessionStorage and navigate back
    sessionStorage.setItem('columnMapping', JSON.stringify(mappingData));
    setLocation(`${backUrl}?mapped=true`);
  };

  const validation = getValidationStatus();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(backUrl)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Column Mapping</h1>
            <p className="text-gray-600">Map your Excel columns to system fields</p>
          </div>
        </div>

        {/* File Upload */}
        {!selectedFile && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Select Your Excel File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Choose an Excel file to analyze columns and create mappings</p>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select Excel File
                  </label>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Info and Processing */}
        {selectedFile && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>File:</strong> {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              {isProcessing && <span className="ml-2">- Analyzing columns...</span>}
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Status */}
        {columnMappings.length > 0 && (
          <Alert className={`mb-6 ${validation.isValid ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
            {validation.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              <strong>Mapping Status:</strong> {validation.mappedCount} of {validation.totalRequired} required fields mapped
              {!validation.isValid && (
                <div className="mt-2">
                  <strong>Missing:</strong> {validation.missingFields.map(f => f.label).join(', ')}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Column Mapping Interface */}
        {columnMappings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mapping Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Column Mappings</CardTitle>
                <p className="text-sm text-gray-600">
                  Map each Excel column to a system field. Required fields must be mapped.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {columnMappings.map((mapping, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{mapping.excelColumn}</span>
                          {mapping.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                          {mapping.isMapped && <Badge variant="outline" className="text-xs">Mapped</Badge>}
                        </div>
                        
                        <Select
                          value={mapping.systemField}
                          onValueChange={(value) => updateMapping(mapping.excelColumn, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select system field..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Skip this column --</SelectItem>
                            {SYSTEM_FIELDS.map(field => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.label} {field.required && "*"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t space-y-3">
                  <Button 
                    onClick={handleOneClickAutoMap}
                    variant="outline"
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    One-Click Auto-Map All Fields
                  </Button>
                  
                  <Button 
                    onClick={proceedWithMapping}
                    disabled={!validation.isValid}
                    className="w-full"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue with This Mapping
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Data */}
            <Card>
              <CardHeader>
                <CardTitle>Data Preview</CardTitle>
                <p className="text-sm text-gray-600">
                  First 3 rows from your Excel file
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Excel Column</th>
                        <th className="text-left p-2 font-medium">Sample Data</th>
                        <th className="text-left p-2 font-medium">Maps To</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelColumns.map((column, colIndex) => {
                        const mapping = columnMappings.find(m => m.excelColumn === column);
                        const systemField = SYSTEM_FIELDS.find(f => f.key === mapping?.systemField);
                        
                        return (
                          <tr key={colIndex} className="border-b">
                            <td className="p-2 font-medium">{column}</td>
                            <td className="p-2">
                              <div className="space-y-1">
                                {previewData.slice(0, 3).map((row, rowIndex) => (
                                  <div key={rowIndex} className="text-xs text-gray-600 truncate max-w-32">
                                    {row[column] || <em>empty</em>}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              {mapping?.isMapped ? (
                                <Badge variant={mapping.isRequired ? "default" : "outline"}>
                                  {systemField?.label}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">Not mapped</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}