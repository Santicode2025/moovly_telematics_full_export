import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Car, 
  Fuel,
  Wrench,
  DollarSign,
  TrendingUp,
  FileImage,
  Scan,
  Download
} from "lucide-react";

interface CostCentreDocument {
  id: number;
  vehicleId: number;
  driverId?: number;
  documentType: string;
  originalImageUrl: string;
  ocrProcessed: boolean;
  ocrConfidence?: number;
  extractedData?: string;
  status: string;
  uploadedBy?: number;
  createdAt: string;
  updatedAt: string;
}

interface CostCentreEntry {
  id: number;
  vehicleId: number;
  documentId?: number;
  category: string;
  amount: string;
  currency: string;
  supplier?: string;
  transactionDate: string;
  odometer?: string;
  quantity?: string;
  description?: string;
  approvalStatus: string;
  createdAt: string;
}

interface VehicleCostSummary {
  totalCosts: number;
  fuelCosts: number;
  maintenanceCosts: number;
  tyreCosts: number;
  otherCosts: number;
  entriesCount: number;
}

export default function CostCentrePage() {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<CostCentreDocument | null>(null);
  const [activeTab, setActiveTab] = useState("documents");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicles for vehicle selector
  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  // Fetch cost centre documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/cost-centre/documents", selectedVehicle],
    queryFn: () => apiRequest(`/api/cost-centre/documents${selectedVehicle ? `?vehicleId=${selectedVehicle}` : ""}`),
  });

  // Fetch cost centre entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/cost-centre/entries", selectedVehicle],
    queryFn: () => apiRequest(`/api/cost-centre/entries${selectedVehicle ? `?vehicleId=${selectedVehicle}` : ""}`),
  });

  // Fetch vehicle cost summary
  const { data: costSummary } = useQuery({
    queryKey: ["/api/cost-centre/vehicles", selectedVehicle, "summary"],
    queryFn: () => apiRequest(`/api/cost-centre/vehicles/${selectedVehicle}/summary`),
    enabled: !!selectedVehicle,
  });

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/cost-centre/documents', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centre/documents"] });
      toast({
        title: "Document Uploaded",
        description: "OCR processing started. Results will be available shortly.",
      });
      setUploadingFile(false);
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      setUploadingFile(false);
    },
  });

  // Process OCR mutation
  const processOCRMutation = useMutation({
    mutationFn: (documentId: number) => apiRequest(`/api/cost-centre/process-ocr/${documentId}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centre/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centre/entries"] });
      toast({
        title: "OCR Processing Complete",
        description: "Document has been processed and cost entry created.",
      });
    },
    onError: () => {
      toast({
        title: "OCR Processing Failed",
        description: "Failed to process document. Please try manual entry.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedVehicle) {
      toast({
        title: "Upload Error",
        description: "Please select a vehicle and choose a file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('vehicleId', selectedVehicle);
    formData.append('documentType', 'fuel_receipt'); // Default type
    formData.append('uploadedBy', '1'); // Current user ID

    setUploadingFile(true);
    uploadMutation.mutate(formData);
  }, [selectedVehicle, uploadMutation, toast]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, text: "Pending" },
      processing: { variant: "default" as const, icon: Scan, text: "Processing" },
      completed: { variant: "default" as const, icon: CheckCircle, text: "Completed" },
      failed: { variant: "destructive" as const, icon: AlertCircle, text: "Failed" },
      verified: { variant: "default" as const, icon: CheckCircle, text: "Verified" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      fuel: Fuel,
      tyres: Car,
      maintenance: Wrench,
      repairs: Wrench,
      insurance: FileText,
      other: FileText
    };
    return icons[category as keyof typeof icons] || FileText;
  };

  const formatCurrency = (amount: string, currency: string = "ZAR") => {
    const symbols = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };
    const symbol = symbols[currency as keyof typeof symbols] || currency;
    return `${symbol}${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Cost Centre</h1>
          <p className="text-muted-foreground">OCR document scanning and cost tracking for Moovly Business</p>
        </div>
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          Moovly Business
        </Badge>
      </div>

      {/* Vehicle Selector */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Selection
          </CardTitle>
          <CardDescription>Select a vehicle to view and manage its cost records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="vehicle-select">Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger id="vehicle-select">
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.vehicleNumber} - {vehicle.make} {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedVehicle && (
              <div className="flex-1">
                <Label htmlFor="file-upload">Upload Receipt/Invoice</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    className="cursor-pointer"
                  />
                  <Button disabled={uploadingFile} className="whitespace-nowrap">
                    {uploadingFile ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary Cards */}
      {costSummary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Costs</p>
                  <p className="text-2xl font-bold">R{costSummary.totalCosts.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Costs</p>
                  <p className="text-xl font-semibold">R{costSummary.fuelCosts.toLocaleString()}</p>
                </div>
                <Fuel className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maintenance</p>
                  <p className="text-xl font-semibold">R{costSummary.maintenanceCosts.toLocaleString()}</p>
                </div>
                <Wrench className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tyres</p>
                  <p className="text-xl font-semibold">R{costSummary.tyreCosts.toLocaleString()}</p>
                </div>
                <Car className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Other</p>
                  <p className="text-xl font-semibold">R{costSummary.otherCosts.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cost Entries ({entries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>OCR-processed receipts and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileImage className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No documents uploaded</p>
                  <p className="text-muted-foreground">Upload a receipt or invoice to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>OCR Confidence</TableHead>
                      <TableHead>Upload Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((document: CostCentreDocument) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">
                          {document.documentType.replace('_', ' ').toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(document.status)}
                        </TableCell>
                        <TableCell>
                          {document.ocrConfidence ? `${document.ocrConfidence}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(document.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedDocument(document)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Document Details</DialogTitle>
                                  <DialogDescription>
                                    OCR results and extracted data
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedDocument && (
                                  <div className="space-y-4">
                                    <div>
                                      <Label>Document Type</Label>
                                      <p className="text-sm bg-muted p-2 rounded">
                                        {selectedDocument.documentType.replace('_', ' ').toUpperCase()}
                                      </p>
                                    </div>
                                    {selectedDocument.ocrRawText && (
                                      <div>
                                        <Label>OCR Raw Text</Label>
                                        <pre className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                                          {selectedDocument.ocrRawText}
                                        </pre>
                                      </div>
                                    )}
                                    {selectedDocument.extractedData && (
                                      <div>
                                        <Label>Extracted Data</Label>
                                        <pre className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">
                                          {JSON.stringify(JSON.parse(selectedDocument.extractedData), null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {document.status === 'completed' && !document.ocrProcessed && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => processOCRMutation.mutate(document.id)}
                                disabled={processOCRMutation.isPending}
                              >
                                {processOCRMutation.isPending ? (
                                  <Clock className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Scan className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>Cost Entries</CardTitle>
              <CardDescription>Processed expenses and cost records</CardDescription>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading cost entries...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium">No cost entries</p>
                  <p className="text-muted-foreground">Upload and process documents to create cost entries</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry: CostCentreEntry) => {
                      const CategoryIcon = getCategoryIcon(entry.category);
                      return (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4" />
                              <span className="capitalize">{entry.category}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(entry.amount, entry.currency)}
                          </TableCell>
                          <TableCell>{entry.supplier || '-'}</TableCell>
                          <TableCell>
                            {new Date(entry.transactionDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={entry.approvalStatus === 'approved' ? 'default' : 'secondary'}>
                              {entry.approvalStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}