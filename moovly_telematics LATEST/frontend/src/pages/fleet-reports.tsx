import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer 
} from "recharts";
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Fuel, 
  Clock, 
  Users, 
  Car, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Calendar,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

interface ReportFilters {
  reportType: string;
  reportPeriod: string;
  startDate: string;
  endDate: string;
  driverId?: string;
  vehicleId?: string;
}

export default function FleetReportsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'fuel_efficiency',
    reportPeriod: 'monthly',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Fetch drivers and vehicles for filters
  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (reportFilters: ReportFilters) => {
      return await apiRequest("/api/reports/generate", "POST", reportFilters);
    },
    onSuccess: (data) => {
      setReportData(data);
      toast({
        title: "Report Generated",
        description: "Fleet report has been generated successfully",
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

  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = () => {
    generateReportMutation.mutate(filters);
  };

  const handleExportReport = (format: string) => {
    if (!reportData) return;
    
    // Create CSV export for now
    if (format === 'csv') {
      const csvData = convertToCSV(reportData);
      downloadCSV(csvData, `fleet_report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    }
    
    toast({
      title: "Export Started",
      description: `Exporting report as ${format.toUpperCase()}`,
    });
  };

  const convertToCSV = (data: any) => {
    // Simple CSV conversion for summary data
    const rows = [
      ['Metric', 'Value', 'Unit'],
      ...Object.entries(data.data?.summary || {}).map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value,
        getUnitForMetric(key)
      ])
    ];
    
    return rows.map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getUnitForMetric = (metric: string) => {
    const units: Record<string, string> = {
      totalFuelConsumed: 'Liters',
      averageFuelEfficiency: 'km/L',
      totalDistance: 'km',
      fuelCostTotal: 'ZAR',
      onTimeDeliveryRate: '%',
      averageDeliveryTime: 'minutes',
      fleetUtilizationRate: '%',
      costPerKilometer: 'ZAR/km'
    };
    return units[metric] || '';
  };

  const renderRecommendations = (recommendations: any[]) => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2 text-blue-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border-l-4 ${
              rec.type === 'success' ? 'border-green-500 bg-green-50' :
              rec.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
              rec.type === 'alert' ? 'border-red-500 bg-red-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start">
                {rec.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mt-1 mr-3" />}
                {rec.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1 mr-3" />}
                {rec.type === 'alert' && <AlertTriangle className="w-5 h-5 text-red-600 mt-1 mr-3" />}
                {rec.type === 'info' && <Info className="w-5 h-5 text-blue-600 mt-1 mr-3" />}
                <div className="flex-1">
                  <h4 className="font-semibold">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <p className="text-sm font-medium mt-2">{rec.action}</p>
                  {rec.vehicles && rec.vehicles.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Vehicles:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.vehicles.map((vehicle: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{vehicle}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {rec.drivers && rec.drivers.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs font-medium text-gray-500">Drivers:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rec.drivers.map((driver: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">{driver}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const renderFuelEfficiencyReport = (data: any) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fuel Consumed</CardTitle>
            <Fuel className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.totalFuelConsumed?.toFixed(1) || 0}L</div>
            <p className="text-xs text-muted-foreground">This reporting period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.averageFuelEfficiency?.toFixed(1) || 0} km/L</div>
            <p className="text-xs text-muted-foreground">Fleet average</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            <Car className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.totalDistance?.toFixed(0) || 0} km</div>
            <p className="text-xs text-muted-foreground">All vehicles</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fuel Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{data.summary?.fuelCostTotal?.toFixed(0) || 0}</div>
            <p className="text-xs text-muted-foreground">Total spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.byVehicle && (
          <Card>
            <CardHeader>
              <CardTitle>Fuel Efficiency by Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byVehicle.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="vehicleName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={10}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="fuelEfficiency" fill="#0088FE" name="Efficiency (km/L)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.trends && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Fuel Consumption Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends.weeklyFuelConsumption}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="consumption" stroke="#00C49F" name="Fuel (L)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {renderRecommendations(data.recommendations)}
    </div>
  );

  const renderDeliveryPerformanceReport = (data: any) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.totalDeliveries || 0}</div>
            <p className="text-xs text-muted-foreground">Completed jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.onTimeDeliveryRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Within 30 minutes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.averageDeliveryTime?.toFixed(0) || 0} min</div>
            <p className="text-xs text-muted-foreground">Start to completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary?.customerSatisfactionScore || 0}/100</div>
            <p className="text-xs text-muted-foreground">Average rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.byDriver && (
          <Card>
            <CardHeader>
              <CardTitle>Driver Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.byDriver.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="driverName" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={10}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="onTimeRate" fill="#00C49F" name="On-Time Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.delays && (
          <Card>
            <CardHeader>
              <CardTitle>Delay Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.delays.commonReasons}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ reason, count }) => `${reason}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {data.delays.commonReasons.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendations */}
      {renderRecommendations(data.recommendations)}
    </div>
  );

  const renderGenericReport = (data: any, title: string) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title} Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {data.summary && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(data.summary).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </p>
                  <p className="text-lg font-semibold">
                    {typeof value === 'number' ? value.toFixed(2) : value} {getUnitForMetric(key)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {renderRecommendations(data.recommendations)}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="fleet-reports-page">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Fleet Reports</h1>
        <div className="flex gap-2">
          {reportData && (
            <>
              <Button 
                variant="outline" 
                onClick={() => handleExportReport('csv')}
                data-testid="button-export-csv"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExportReport('pdf')}
                data-testid="button-export-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select 
                value={filters.reportType} 
                onValueChange={(value) => setFilters({...filters, reportType: value})}
              >
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel_efficiency">Fuel Efficiency</SelectItem>
                  <SelectItem value="delivery_performance">Delivery Performance</SelectItem>
                  <SelectItem value="driver_performance">Driver Performance</SelectItem>
                  <SelectItem value="vehicle_utilization">Vehicle Utilization</SelectItem>
                  <SelectItem value="cost_analysis">Cost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportPeriod">Period</Label>
              <Select 
                value={filters.reportPeriod} 
                onValueChange={(value) => setFilters({...filters, reportPeriod: value})}
              >
                <SelectTrigger data-testid="select-report-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                data-testid="input-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                data-testid="input-end-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver">Driver (Optional)</Label>
              <Select 
                value={filters.driverId || "all"} 
                onValueChange={(value) => setFilters({...filters, driverId: value === "all" ? undefined : value})}
              >
                <SelectTrigger data-testid="select-driver-filter">
                  <SelectValue placeholder="All drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle (Optional)</Label>
              <Select 
                value={filters.vehicleId || "all"} 
                onValueChange={(value) => setFilters({...filters, vehicleId: value === "all" ? undefined : value})}
              >
                <SelectTrigger data-testid="select-vehicle-filter">
                  <SelectValue placeholder="All vehicles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vehicles</SelectItem>
                  {vehicles.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.make} {vehicle.model} ({vehicle.plateNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button 
              onClick={handleGenerateReport}
              disabled={generateReportMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-generate-report"
            >
              {generateReportMutation.isPending ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div data-testid="report-results">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {filters.reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Report
            </h2>
            <p className="text-sm text-gray-600">
              Generated on {new Date(reportData.generatedAt).toLocaleString()} 
              for period: {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
            </p>
          </div>

          {filters.reportType === 'fuel_efficiency' && renderFuelEfficiencyReport(reportData.data)}
          {filters.reportType === 'delivery_performance' && renderDeliveryPerformanceReport(reportData.data)}
          {filters.reportType === 'driver_performance' && renderGenericReport(reportData.data, 'Driver Performance')}
          {filters.reportType === 'vehicle_utilization' && renderGenericReport(reportData.data, 'Vehicle Utilization')}
          {filters.reportType === 'cost_analysis' && renderGenericReport(reportData.data, 'Cost Analysis')}
        </div>
      )}
    </div>
  );
}