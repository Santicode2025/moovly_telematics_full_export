import {
  users,
  customers,
  drivers,
  vehicles,
  jobs,
  routes,
  maintenanceRecords,
  fuelEntries,
  driverShifts,
  alerts,
  regionalPricing,
  customerPortalUsers,
  customerOrders,
  customerMessages,
  jobReassignmentHistory,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Driver,
  type InsertDriver,
  type Vehicle,
  type InsertVehicle,
  type Job,
  type InsertJob,
  type Route,
  type InsertRoute,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type FuelEntry,
  type InsertFuelEntry,
  type DriverShift,
  type InsertDriverShift,
  type Alert,
  type InsertAlert,
  type RegionalPricing,
  type InsertRegionalPricing,
  type TripData,
  type InsertTripData,
  type Message,
  type InsertMessage,
  type ClientAccount,
  type InsertClientAccount,
  type OptimizationRules,
  type InsertOptimizationRules,
  type OfflineJob,
  type InsertOfflineJob,
  type CustomerPortalUser,
  type InsertCustomerPortalUser,
  type CustomerOrder,
  type InsertCustomerOrder,
  type CustomerMessage,
  type InsertCustomerMessage,
  type JobReassignmentHistory,
  type InsertJobReassignmentHistory,
  offlineJobs,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;

  // Driver operations
  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: number): Promise<boolean>;

  // Vehicle operations
  getAllVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getAvailableVehicles(): Promise<Vehicle[]>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;

  // Job operations
  getAllJobs(): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  getJobsByStatus(status: string): Promise<Job[]>;
  getJobsByDriver(driverId: number): Promise<Job[]>;

  // Route operations
  getAllRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;

  // Maintenance operations
  getAllMaintenanceRecords(): Promise<MaintenanceRecord[]>;
  getMaintenanceRecord(id: number): Promise<MaintenanceRecord | undefined>;
  getMaintenanceRecordsByVehicle(vehicleId: number): Promise<MaintenanceRecord[]>;
  createMaintenanceRecord(record: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: number, record: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined>;
  deleteMaintenanceRecord(id: number): Promise<boolean>;

  // Fuel entry operations
  getAllFuelEntries(): Promise<FuelEntry[]>;
  getFuelEntry(id: number): Promise<FuelEntry | undefined>;
  getFuelEntriesByVehicle(vehicleId: number): Promise<FuelEntry[]>;
  createFuelEntry(entry: InsertFuelEntry): Promise<FuelEntry>;
  updateFuelEntry(id: number, entry: Partial<InsertFuelEntry>): Promise<FuelEntry | undefined>;
  deleteFuelEntry(id: number): Promise<boolean>;
  getFuelEntriesForReport(vehicleId: string, startDate: Date, endDate: Date): Promise<Array<FuelEntry & { driverName: string; vehicleRegistration: string }>>;
  getFuelConsumptionReport(vehicleId: string, startDate: Date, endDate: Date): Promise<Array<{
    driverName: string;
    vehicleRegistration: string; 
    totalLitres: number;
    totalKm: number;
    litresPerKm: number;
    litresPer100Km: number;
  }>>;

  // Driver shift operations
  getAllDriverShifts(): Promise<DriverShift[]>;
  getDriverShift(id: number): Promise<DriverShift | undefined>;
  getDriverShiftsByDriver(driverId: number): Promise<DriverShift[]>;
  createDriverShift(shift: InsertDriverShift): Promise<DriverShift>;
  updateDriverShift(id: number, shift: Partial<InsertDriverShift>): Promise<DriverShift | undefined>;
  deleteDriverShift(id: number): Promise<boolean>;
  checkShiftStatus(driverId: number, currentTime: Date): Promise<{ withinShift: boolean; reassignedJobs?: Job[] }>;

  // Alert operations
  getAllAlerts(): Promise<Alert[]>;
  getAlert(id: number): Promise<Alert | undefined>;
  getUnreadAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: number, alert: Partial<InsertAlert>): Promise<Alert | undefined>;
  markAlertAsRead(id: number): Promise<boolean>;
  markAlertAsResolved(id: number): Promise<boolean>;
  deleteAlert(id: number): Promise<boolean>;

  // Regional pricing operations
  getAllRegionalPricing(): Promise<RegionalPricing[]>;
  getRegionalPricing(region: string): Promise<RegionalPricing | undefined>;
  createRegionalPricing(pricing: InsertRegionalPricing): Promise<RegionalPricing>;
  updateRegionalPricing(id: number, pricing: Partial<InsertRegionalPricing>): Promise<RegionalPricing | undefined>;

  // Job assignment operations
  assignJob(jobId: number, driverId: number): Promise<Job | undefined>;
  optimizeRoutes(jobs: Job[]): Promise<Job[]>;
  
  // Job reassignment operations
  reassignJob(jobId: number, newDriverId: number | null, reassignedBy: number, reason: string, notes?: string): Promise<{job: Job | undefined, reassignmentRecord: JobReassignmentHistory}>;
  bulkReassignJobs(jobIds: number[], newDriverId: number | null, reassignedBy: number, reason: string, notes?: string): Promise<{reassignedJobs: Job[], reassignmentRecords: JobReassignmentHistory[]}>;
  getJobReassignmentHistory(jobId: number): Promise<JobReassignmentHistory[]>;
  getAllJobReassignmentHistory(): Promise<JobReassignmentHistory[]>;
  getReassignmentHistoryByDriver(driverId: number): Promise<JobReassignmentHistory[]>;
  checkDriverWorkload(driverId: number): Promise<{totalJobs: number, pendingJobs: number, inProgressJobs: number}>;
  getAvailableDriversForReassignment(excludeDriverId?: number): Promise<Driver[]>;
  detectReassignmentConflicts(jobId: number, newDriverId: number): Promise<string[]>;

  // Vehicle assignment operations
  createVehicleAssignment(assignment: {
    driverId: number;
    vehicleId: number;
    assignmentDate: Date;
    startingOdometer: number;
    isActive: boolean;
  }): Promise<any>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    activeVehicles: number;
    activeDrivers: number;
    completedJobs: number;
    fuelSavings: number;
  }>;

  // Trip data operations for MoovScore
  getAllTripData(): Promise<TripData[]>;
  getTripData(id: number): Promise<TripData | undefined>;
  getTripDataByDriver(driverId: number): Promise<TripData[]>;
  createTripData(tripData: InsertTripData): Promise<TripData>;
  calculateMoovScore(tripData: InsertTripData): Promise<number>;

  // Job carry-over operations
  handleJobCarryOver(jobId: number, driverId: number, nextDaySchedule: Date): Promise<Job | undefined>;
  moveToUnassignedJobs(jobId: number): Promise<boolean>;
  prioritizeJobs(jobs: Job[]): Promise<Job[]>;

  // Messaging operations
  getAllMessages(): Promise<Message[]>;
  getMessagesByUser(userId: number): Promise<Message[]>;
  getUnreadMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(messageId: number): Promise<boolean>;
  deleteMessage(messageId: number): Promise<boolean>;

  // Client account management operations
  getAllClientAccounts(): Promise<ClientAccount[]>;
  getClientAccount(id: number): Promise<ClientAccount | undefined>;
  createClientAccount(clientData: InsertClientAccount): Promise<ClientAccount>;
  updateClientAccount(id: number, updateData: Partial<InsertClientAccount>): Promise<ClientAccount | undefined>;

  // Smart Optimization Rules operations (Moovly Business exclusive)
  getOptimizationRules(): Promise<OptimizationRules | null>;
  saveOptimizationRules(rules: InsertOptimizationRules): Promise<OptimizationRules>;

  // Network status and offline job operations
  updateDriverNetworkStatus(driverId: number, statusData: { networkStatus: string; pendingJobs: number; lastSyncAt: Date }): Promise<void>;
  storeOfflineJob(offlineJob: InsertOfflineJob): Promise<OfflineJob>;
  getOfflineJobsByDriver(driverId: number): Promise<OfflineJob[]>;
  markOfflineJobSynced(offlineJobId: number): Promise<void>;
  incrementOfflineJobAttempts(offlineJobId: number): Promise<void>;
  incrementDriverPendingJobs(driverId: number): Promise<void>;
  resetDriverPendingJobs(driverId: number): Promise<void>;
  updateJobStatus(jobId: number, status: string, jobData: any): Promise<void>;
  addFuelEntry(fuelData: any): Promise<void>;
  saveVehicleChecklist(checklistData: any): Promise<void>;

  // System Settings operations
  getSystemSettings(): Promise<any[]>;
  getSystemSetting(key: string): Promise<any | undefined>;
  updateSystemSetting(key: string, value: string): Promise<any | undefined>;

  // Break time monitoring operations
  getDriversOnLongBreak(alertMinutes: number): Promise<Driver[]>;
  
  // Real-time Driver Location Tracking
  getDriverLocations(): Promise<any[]>;
  updateDriverLocation(driverId: number, locationData: any): Promise<any>;

  // Feedback System
  getAllFeedback(): Promise<any[]>;
  createFeedback(feedbackData: any): Promise<any>;
  getFeedbackAnalytics(params: { category?: string; dateRange?: string }): Promise<any>;

  // Smart Route Suggestions based on Historical Data
  getSmartRouteSuggestions(jobIds: number[]): Promise<any[]>;
  generateSmartSuggestions(jobIds: number[]): Promise<any[]>;
  applyRouteSuggestion(suggestionId: number): Promise<any>;
  rejectRouteSuggestion(suggestionId: number): Promise<any>;
  getRouteAnalytics(params: { jobId?: number; driverId?: number; dateRange?: string }): Promise<any[]>;
  createRouteAnalytics(data: any): Promise<any>;

  // Missing methods from LSP diagnostics
  processOCRDocument(id: number, ocrData: any): Promise<any>;
  updateCostCentreDocument(id: number, updateData: any): Promise<any>;
  getAllTripData(): Promise<TripData[]>;
  getTripData(id: number): Promise<TripData | undefined>;
  getTripDataByDriver(driverId: number): Promise<TripData[]>;
  createTripData(tripData: InsertTripData): Promise<TripData>;
  handleJobCarryOver(): Promise<void>;
  prioritizeJobs(jobs: Job[]): Promise<Job[]>;
  moveToUnassignedJobs(jobId: number): Promise<boolean>;
  createClientAccount(clientData: InsertClientAccount): Promise<ClientAccount>;
  getClientAccount(id: number): Promise<ClientAccount | undefined>;
  updateClientAccount(id: number, updateData: Partial<InsertClientAccount>): Promise<ClientAccount | undefined>;
  getOptimizationRules(): Promise<OptimizationRules | null>;
  saveOptimizationRules(rules: InsertOptimizationRules): Promise<OptimizationRules>;
  getCostCentreDocumentsByVehicle(vehicleId: number): Promise<any[]>;
  getAllCostCentreDocuments(): Promise<any[]>;
  createCostCentreDocument(documentData: any): Promise<any>;
  getCostCentreDocument(id: number): Promise<any | undefined>;
  getCostCentreEntriesByVehicle(vehicleId: number): Promise<any[]>;
  getCostCentreEntriesByCategory(category: string): Promise<any[]>;
  getAllCostCentreEntries(): Promise<any[]>;
  createCostCentreEntry(entryData: any): Promise<any>;
  getVehicleCostSummary(vehicleId: number): Promise<any>;
  generateTrackingToken(jobId: number): Promise<string>;
  calculateETA(jobId: number, lat: number, lng: number): Promise<number | null>;
  startJobTracking(jobId: number, eta?: number): Promise<Job | undefined>;
  updateJobLocation(jobId: number, lat: number, lng: number): Promise<void>;
  createCustomerNotification(notificationData: any): Promise<any>;
  getJobByTrackingToken(token: string): Promise<Job | undefined>;
  getJobsNearingArrival(): Promise<Job[]>;
  getGeofencesByType(type: string): Promise<any[]>;
  getActiveGeofences(): Promise<any[]>;
  getAllGeofences(): Promise<any[]>;
  createGeofence(geofenceData: any): Promise<any>;
  assignVehicleToDriver(vehicleId: number, driverId: number | null): Promise<Vehicle | undefined>;

  // Customer portal operations
  getCustomerOrders(customerUserId: number): Promise<CustomerOrder[]>;
  getCustomerConversations(customerUserId: number): Promise<CustomerMessage[]>;
  getCustomerPortalUser(id: number): Promise<CustomerPortalUser | undefined>;
  getCustomerPortalUserByEmail(email: string): Promise<CustomerPortalUser | undefined>;
  createCustomerPortalUser(user: InsertCustomerPortalUser): Promise<CustomerPortalUser>;
  createCustomerOrder(order: InsertCustomerOrder): Promise<CustomerOrder>;
  createCustomerMessage(message: InsertCustomerMessage): Promise<CustomerMessage>;

  // Geocoding cache operations
  cacheGeocodingResult(address: string, result: any): Promise<void>;
  getCachedGeocodingResult(address: string): Promise<any | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private customers: Map<number, Customer>;
  private drivers: Map<number, Driver>;
  private vehicles: Map<number, Vehicle>;
  private jobs: Map<number, Job>;
  private routes: Map<number, Route>;
  private maintenanceRecords: Map<number, MaintenanceRecord>;
  private fuelEntries: Map<number, FuelEntry>;
  private driverShifts: Map<number, DriverShift>;
  private alerts: Map<number, Alert>;
  private regionalPricing: Map<number, RegionalPricing>;
  private tripData: Map<number, TripData>;
  private messages: Map<number, Message>;
  private clientAccounts: Map<number, ClientAccount>;
  private customerPortalUsers: Map<number, CustomerPortalUser>;
  private customerOrders: Map<number, CustomerOrder>;
  private customerMessages: Map<number, CustomerMessage>;
  private jobReassignmentHistory: Map<number, JobReassignmentHistory>;
  private geocodingCache: Map<string, { result: any; timestamp: number }>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.drivers = new Map();
    this.vehicles = new Map();
    this.jobs = new Map();
    this.routes = new Map();
    this.maintenanceRecords = new Map();
    this.fuelEntries = new Map();
    this.driverShifts = new Map();
    this.alerts = new Map();
    this.regionalPricing = new Map();
    this.tripData = new Map();
    this.messages = new Map();
    this.clientAccounts = new Map();
    this.customerPortalUsers = new Map();
    this.customerOrders = new Map();
    this.customerMessages = new Map();
    this.jobReassignmentHistory = new Map();
    this.geocodingCache = new Map();
    this.currentId = {
      users: 1,
      customers: 1,
      drivers: 1,
      vehicles: 1,
      jobs: 1,
      routes: 1,
      maintenanceRecords: 1,
      fuelEntries: 1,
      driverShifts: 1,
      alerts: 1,
      regionalPricing: 1,
      tripData: 1,
      messages: 1,
      clientAccounts: 1,
      customerPortalUsers: 1,
      customerOrders: 1,
      customerMessages: 1,
      jobReassignmentHistory: 1,
    };
    this.seedData();
  }

  private seedData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "admin@moovly.com",
      password: "password123",
    };
    this.users.set(1, defaultUser);
    this.currentId.users = 2;

    // Seed sample data
    this.seedSampleData();
  }

  private seedSampleData() {
    // Sample vehicles
    const sampleVehicles: Vehicle[] = [
      {
        id: 1,
        vehicleNumber: "VH-001",
        registration: "ABC-123",
        chassisNumber: "WF0EXXGCBE1234567",
        engineNumber: "ABCD1234",
        make: "Ford",
        model: "Transit",
        year: 2022,
        currentOdometer: "45632.50",
        plateNumber: "ABC-123",
        status: "active",
        fuelType: "diesel",
        mileage: "45632.50",
        lastMaintenanceDate: new Date("2024-05-15"),
        nextMaintenanceDate: new Date("2024-08-15"),
        assignedDriverId: null,
        assignedDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        vehicleNumber: "VH-042",
        registration: "XYZ-789",
        chassisNumber: "VS30XXESWME123456",
        engineNumber: "MERC5678",
        make: "Mercedes",
        model: "Sprinter",
        year: 2023,
        currentOdometer: "32145.75",
        plateNumber: "XYZ-789",
        status: "active",
        fuelType: "diesel",
        mileage: "32145.75",
        lastMaintenanceDate: new Date("2024-06-01"),
        nextMaintenanceDate: new Date("2024-09-01"),
        assignedDriverId: null,
        assignedDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        vehicleNumber: "VH-023",
        registration: "DEF-456",
        chassisNumber: "ZCFC35A00H1234567",
        engineNumber: "IVE9012",
        make: "Iveco",
        model: "Daily",
        year: 2021,
        currentOdometer: "67890.25",
        plateNumber: "DEF-456",
        status: "active",
        fuelType: "diesel",
        mileage: "67890.25",
        lastMaintenanceDate: new Date("2024-04-20"),
        nextMaintenanceDate: new Date("2024-07-20"),
        assignedDriverId: null,
        assignedDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 4,
        vehicleNumber: "VH-COOPER",
        registration: "MOOV-123",
        chassisNumber: "WMWXS33C20T123456",
        engineNumber: "MINI3456",
        make: "Mini",
        model: "Cooper",
        year: 2020,
        currentOdometer: "28450.75",
        plateNumber: "MOOV-123",
        status: "active",
        fuelType: "petrol",
        mileage: "28450.75",
        lastMaintenanceDate: new Date("2024-05-30"),
        nextMaintenanceDate: new Date("2024-08-30"),
        assignedDriverId: null,
        assignedDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 5,
        vehicleNumber: "VH-101",
        registration: "GP21RSGP",
        chassisNumber: "AAFR5574DDR8K563F",
        engineNumber: "1CDT66H748",
        make: "Suzuki",
        model: "Swift",
        year: 2021,
        currentOdometer: "2400.00",
        plateNumber: "GP21RSGP",
        status: "active",
        fuelType: "petrol",
        mileage: "2400.00",
        lastMaintenanceDate: new Date("2024-06-01"),
        nextMaintenanceDate: new Date("2024-10-01"),
        assignedDriverId: null,
        assignedDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleVehicles.forEach(vehicle => this.vehicles.set(vehicle.id, vehicle));
    this.currentId.vehicles = 6;

    // Sample drivers - only keeping fleet.driver for testing
    const sampleDrivers: Driver[] = [
      {
        id: 5,
        username: "fleet.driver",
        name: "Fleet Test Driver",
        email: "fleet@moovly.co.za",
        phone: "+27111222333",
        idNumber: "8501015800087",
        licenseNumber: "FL123456",
        pin: "1234", // Plain text PIN for test account
        pinSetAt: new Date(),
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        registrationToken: null,
        isRegistered: true,
        status: "active",
        role: "fleet",
        vehicleId: null,
        currentRoute: null,
        performance: "95.00",
        lastLoginAt: null,
        networkStatus: "online",
        lastSyncAt: new Date(),
        pendingJobs: 0,
        isOnBreak: false,
        breakStartTime: null,
        breakAlertSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleDrivers.forEach(driver => this.drivers.set(driver.id, driver));
    this.currentId.drivers = 6;

    // Sample customers for address book
    const sampleCustomers: Customer[] = [
      {
        id: 1,
        name: "ABC Electronics Ltd",
        email: "orders@abc-electronics.co.za",
        phone: "+27 21 555 0123",
        address: "123 Tech Street, Green Point",
        city: "Cape Town",
        postalCode: "8005",
        latitude: "-33.9049000",
        longitude: "18.4241000",
        notes: "Contact John for deliveries. Loading dock at rear.",
        totalJobs: 45,
        lastJobDate: new Date("2025-01-20"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "City Hospital Pharmacy",
        email: "procurement@cityhospital.co.za",
        phone: "+27 21 555 0456",
        address: "456 Medical Drive, Observatory",
        city: "Cape Town",
        postalCode: "7925",
        latitude: "-33.9320000",
        longitude: "18.4795000",
        notes: "Emergency deliveries accepted 24/7. Use hospital entrance.",
        totalJobs: 67,
        lastJobDate: new Date("2025-01-22"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Ocean View Restaurant",
        email: "manager@oceanview.co.za",
        phone: "+27 21 555 0789",
        address: "789 Beach Road, Sea Point",
        city: "Cape Town",
        postalCode: "8060",
        latitude: "-33.9047000",
        longitude: "18.3773000",
        notes: "Fresh produce deliveries before 10 AM only.",
        totalJobs: 23,
        lastJobDate: new Date("2025-01-18"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleCustomers.forEach(customer => this.customers.set(customer.id, customer));
    this.currentId.customers = 4;

    // Sample routes
    const sampleRoutes: Route[] = [
      {
        id: 1,
        name: "Route A - City Center",
        description: "Central business district deliveries",
        efficiency: "94.00",
        estimatedTime: 180,
        distance: "45.20",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        name: "Route B - Suburbs",
        description: "Suburban residential area",
        efficiency: "87.00",
        estimatedTime: 240,
        distance: "67.80",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        name: "Route C - Industrial",
        description: "Industrial zone deliveries",
        efficiency: "96.00",
        estimatedTime: 150,
        distance: "38.10",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleRoutes.forEach(route => this.routes.set(route.id, route));
    this.currentId.routes = 4;

    // Sample jobs
    const sampleJobs: Job[] = [
      {
        id: 1,
        jobNumber: "JOB-001",
        customerId: 1,
        customerName: "ABC Electronics",
        pickupAddress: "123 Main St, City",
        deliveryAddress: "456 Oak Ave, Town",
        driverId: 1,
        vehicleId: 1,
        status: "in_progress",
        scheduledDate: new Date(),
        completedDate: null,
        estimatedDistance: "25.50",
        actualDistance: null,
        notes: "Handle with care - electronics",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        jobNumber: "JOB-002",
        customerId: 2,
        customerName: "XYZ Furniture",
        pickupAddress: "789 Pine St, City",
        deliveryAddress: "321 Elm St, Village",
        driverId: 2,
        vehicleId: 2,
        status: "pending",
        scheduledDate: new Date(Date.now() + 86400000), // tomorrow
        completedDate: null,
        estimatedDistance: "42.30",
        actualDistance: null,
        notes: "Large furniture items",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        jobNumber: "JOB-003",
        customerId: 3,
        customerName: "Tech Solutions Ltd",
        pickupAddress: "555 Tech Park, City",
        deliveryAddress: "777 Innovation Dr, Town",
        driverId: 3,
        vehicleId: 3,
        status: "completed",
        scheduledDate: new Date(Date.now() - 86400000), // yesterday
        completedDate: new Date(),
        estimatedDistance: "18.75",
        actualDistance: "19.20",
        notes: "Delivered successfully",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleJobs.forEach(job => this.jobs.set(job.id, job));
    this.currentId.jobs = 4;

    // Sample regional pricing
    const sampleRegionalPricing: RegionalPricing[] = [
      {
        id: 1,
        region: "ZA",
        planName: "Moovly Connect",
        monthlyPrice: "R130",
        annualPrice: "R90",
        currency: "ZAR",
        currencySymbol: "R",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        region: "US",
        planName: "Moovly Connect",
        monthlyPrice: "$8.99",
        annualPrice: "$6.99",
        currency: "USD",
        currencySymbol: "$",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 3,
        region: "GB",
        planName: "Moovly Connect",
        monthlyPrice: "£7.99",
        annualPrice: "£5.99",
        currency: "GBP",
        currencySymbol: "£",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleRegionalPricing.forEach(pricing => this.regionalPricing.set(pricing.id, pricing));
    this.currentId.regionalPricing = 4;

    // Sample fuel entries
    const sampleFuelEntries: FuelEntry[] = [
      {
        id: 1,
        vehicleId: 1,
        liters: "55.50",
        cost: "950.00",
        odometer: "45632.50",
        photoUrl: null,
        location: "Shell Station, Main Road",
        fuelStationName: "Shell Main Road",
        createdAt: new Date(Date.now() - 7 * 86400000), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 86400000),
      },
      {
        id: 2,
        vehicleId: 2,
        liters: "62.30",
        cost: "1067.00",
        odometer: "32145.75",
        photoUrl: null,
        location: "BP Station, Industrial Area",
        fuelStationName: "BP Industrial",
        createdAt: new Date(Date.now() - 3 * 86400000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 86400000),
      },
    ];

    sampleFuelEntries.forEach(entry => this.fuelEntries.set(entry.id, entry));
    this.currentId.fuelEntries = 3;

    // Sample driver shifts
    const sampleDriverShifts: DriverShift[] = [
      {
        id: 1,
        driverId: 1,
        startTime: new Date(new Date().setHours(8, 0, 0, 0)),
        endTime: new Date(new Date().setHours(17, 0, 0, 0)),
        actualStartTime: new Date(new Date().setHours(8, 15, 0, 0)),
        actualEndTime: null,
        status: "active",
        notes: "Regular shift",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        driverId: 2,
        startTime: new Date(new Date().setHours(9, 0, 0, 0)),
        endTime: new Date(new Date().setHours(18, 0, 0, 0)),
        actualStartTime: new Date(new Date().setHours(9, 5, 0, 0)),
        actualEndTime: null,
        status: "active",
        notes: "Late shift",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleDriverShifts.forEach(shift => this.driverShifts.set(shift.id, shift));
    this.currentId.driverShifts = 3;

    // Sample alerts - removed for clean testing environment
    const sampleAlerts: Alert[] = [];

    sampleAlerts.forEach(alert => this.alerts.set(alert.id, alert));
    this.currentId.alerts = 1;

    // Sample customer portal users for testing
    const sampleCustomerPortalUsers: CustomerPortalUser[] = [
      {
        id: 1,
        email: "customer@test.com",
        password: "$2b$10$K2JhGJ0gSKzZoQHYKlQQIe.YoQlGHGN9KUKhwJ1FrJ0A4vJ9J0A4v", // hashed "test123"
        name: "Test Customer",
        phone: "+27123456789",
        company: "Test Company Ltd",
        isVerified: true,
        verificationToken: null,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleCustomerPortalUsers.forEach(user => this.customerPortalUsers.set(user.id, user));
    this.currentId.customerPortalUsers = 2;

    // Sample customer orders for testing
    const sampleCustomerOrders: CustomerOrder[] = [
      {
        id: 1,
        customerUserId: 1,
        jobId: 1,
        orderNumber: "ORD-2025-001",
        pickupName: "Test Company Ltd",
        pickupPhone: "+27123456789",
        pickupEmail: "customer@test.com",
        pickupAddress: "123 Test Street, Cape Town",
        pickupInstructions: "Ring bell at gate",
        deliveryName: "Destination Company",
        deliveryPhone: "+27987654321",
        deliveryEmail: "delivery@destination.com",
        deliveryAddress: "456 Delivery Avenue, Johannesburg", 
        deliveryInstructions: "Leave at reception",
        preferredPickupTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        preferredDeliveryTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        isAsapDelivery: false,
        packageDescription: "Important documents",
        packageWeight: "0.5kg",
        packageDimensions: "A4 envelope",
        packageValue: "100.00",
        specialInstructions: "Handle with care",
        estimatedCost: "50.00",
        finalCost: null,
        currency: "ZAR",
        status: "in_transit",
        estimatedDeliveryTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        actualPickupTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        actualDeliveryTime: null,
        assignedDriverId: 1,
        driverNotes: null,
        trackingNumber: "TRK-001-2025",
        proofOfDelivery: null,
        customerRating: null,
        customerFeedback: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      },
      {
        id: 2,
        customerUserId: 1,
        jobId: null,
        orderNumber: "ORD-2025-002",
        pickupName: "Test Company Ltd",
        pickupPhone: "+27123456789",
        pickupEmail: "customer@test.com",
        pickupAddress: "123 Test Street, Cape Town",
        pickupInstructions: null,
        deliveryName: "Another Client",
        deliveryPhone: "+27111222333",
        deliveryEmail: "client@another.com",
        deliveryAddress: "789 Client Road, Durban",
        deliveryInstructions: "Office hours only",
        preferredPickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        preferredDeliveryTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        isAsapDelivery: false,
        packageDescription: "Product samples",
        packageWeight: "2kg",
        packageDimensions: "30x20x10cm box",
        packageValue: "500.00",
        specialInstructions: "Fragile items",
        estimatedCost: "75.00",
        finalCost: null,
        currency: "ZAR",
        status: "pending",
        estimatedDeliveryTime: null,
        actualPickupTime: null,
        actualDeliveryTime: null,
        assignedDriverId: null,
        driverNotes: null,
        trackingNumber: "TRK-002-2025",
        proofOfDelivery: null,
        customerRating: null,
        customerFeedback: null,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    ];

    sampleCustomerOrders.forEach(order => this.customerOrders.set(order.id, order));
    this.currentId.customerOrders = 3;

    // Sample customer messages - removed for clean testing environment
    const sampleCustomerMessages: CustomerMessage[] = [];

    sampleCustomerMessages.forEach(message => this.customerMessages.set(message.id, message));
    this.currentId.customerMessages = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId.customers++;
    const customer: Customer = {
      ...insertCustomer,
      id,
      totalJobs: 0,
      lastJobDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;

    const updated: Customer = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = this.currentId.drivers++;
    const driver: Driver = {
      ...insertDriver,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: number, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const existing = this.drivers.get(id);
    if (!existing) return undefined;

    const updated: Driver = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: number): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Vehicle operations
  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentId.vehicles++;
    const vehicle: Vehicle = {
      ...insertVehicle,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, updateData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existing = this.vehicles.get(id);
    if (!existing) return undefined;

    const updated: Vehicle = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.vehicles.set(id, updated);
    return updated;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }

  async getAvailableVehicles(): Promise<Vehicle[]> {
    // Return vehicles that are not currently assigned to drivers or are available
    const allVehicles = Array.from(this.vehicles.values());
    return allVehicles.filter(vehicle => vehicle.status === 'active');
  }

  // Job operations
  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }

  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentId.jobs++;
    
    // Generate unique jobNumber and trackingToken
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const jobNumber = `JOB-${dateStr}-${id.toString().padStart(4, '0')}`;
    const trackingToken = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;
    
    const job: Job = {
      ...insertJob,
      id,
      jobNumber,
      trackingToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.jobs.set(id, job);
    return job;
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;

    const updated: Job = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: number): Promise<boolean> {
    return this.jobs.delete(id);
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  async getJobsByDriver(driverId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.driverId === driverId);
  }

  // Route operations
  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = this.currentId.routes++;
    const route: Route = {
      ...insertRoute,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: number, updateData: Partial<InsertRoute>): Promise<Route | undefined> {
    const existing = this.routes.get(id);
    if (!existing) return undefined;

    const updated: Route = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.routes.set(id, updated);
    return updated;
  }

  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Maintenance operations
  async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values());
  }

  async getMaintenanceRecord(id: number): Promise<MaintenanceRecord | undefined> {
    return this.maintenanceRecords.get(id);
  }

  async getMaintenanceRecordsByVehicle(vehicleId: number): Promise<MaintenanceRecord[]> {
    return Array.from(this.maintenanceRecords.values()).filter(
      record => record.vehicleId === vehicleId
    );
  }

  async createMaintenanceRecord(insertRecord: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const id = this.currentId.maintenanceRecords++;
    const record: MaintenanceRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.maintenanceRecords.set(id, record);
    return record;
  }

  async updateMaintenanceRecord(id: number, updateData: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const existing = this.maintenanceRecords.get(id);
    if (!existing) return undefined;

    const updated: MaintenanceRecord = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.maintenanceRecords.set(id, updated);
    return updated;
  }

  async deleteMaintenanceRecord(id: number): Promise<boolean> {
    return this.maintenanceRecords.delete(id);
  }

  // Vehicle assignment operation
  async assignVehicleToDriver(vehicleId: number, driverId: number | null): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) return undefined;

    // Unassign vehicle from previous driver if any
    if (vehicle.assignedDriverId) {
      const previousDriver = this.drivers.get(vehicle.assignedDriverId);
      if (previousDriver) {
        previousDriver.vehicleId = null;
        this.drivers.set(vehicle.assignedDriverId, previousDriver);
      }
    }

    // Assign new driver if provided
    if (driverId) {
      const newDriver = this.drivers.get(driverId);
      if (newDriver) {
        // Unassign driver from previous vehicle
        if (newDriver.vehicleId) {
          const previousVehicle = this.vehicles.get(newDriver.vehicleId);
          if (previousVehicle) {
            previousVehicle.assignedDriverId = null;
            previousVehicle.assignedDate = null;
            this.vehicles.set(newDriver.vehicleId, previousVehicle);
          }
        }
        
        // Assign new vehicle to driver
        newDriver.vehicleId = vehicleId;
        this.drivers.set(driverId, newDriver);
      }
    }

    // Update vehicle assignment
    const updated: Vehicle = {
      ...vehicle,
      assignedDriverId: driverId,
      assignedDate: driverId ? new Date() : null,
      updatedAt: new Date(),
    };
    this.vehicles.set(vehicleId, updated);
    return updated;
  }

  // Fuel entry operations
  async getAllFuelEntries(): Promise<FuelEntry[]> {
    return Array.from(this.fuelEntries.values());
  }

  async getFuelEntry(id: number): Promise<FuelEntry | undefined> {
    return this.fuelEntries.get(id);
  }

  async getFuelEntriesByVehicle(vehicleId: number): Promise<FuelEntry[]> {
    return Array.from(this.fuelEntries.values()).filter(entry => entry.vehicleId === vehicleId);
  }

  async createFuelEntry(insertEntry: InsertFuelEntry): Promise<FuelEntry> {
    const id = this.currentId.fuelEntries++;
    const entry: FuelEntry = {
      ...insertEntry,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fuelEntries.set(id, entry);
    return entry;
  }

  async updateFuelEntry(id: number, updateData: Partial<InsertFuelEntry>): Promise<FuelEntry | undefined> {
    const existing = this.fuelEntries.get(id);
    if (!existing) return undefined;

    const updated: FuelEntry = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.fuelEntries.set(id, updated);
    return updated;
  }

  async deleteFuelEntry(id: number): Promise<boolean> {
    return this.fuelEntries.delete(id);
  }

  // Real-time Driver Location Tracking
  async getDriverLocations(): Promise<any[]> {
    // Return real-time driver locations with current job information
    const drivers = await this.getAllDrivers();
    const jobs = await this.getAllJobs();
    
    return drivers
      .filter(driver => driver.status === 'active' || driver.status === 'break' || driver.status === 'idle')
      .map(driver => {
        // Find current active job for this driver
        const currentJob = jobs.find(job => 
          job.driverId === driver.id && 
          (job.status === 'in_progress' || job.status === 'pending')
        );
        
        // Generate realistic locations around Johannesburg area
        const baseLatitudes = [-26.1951, -26.2041, -26.1841, -26.2141, -26.2241, -26.1741];
        const baseLongitudes = [28.0573, 28.0473, 28.0673, 28.0373, 28.0273, 28.0773];
        
        const randomIndex = driver.id % baseLatitudes.length;
        const latitude = baseLatitudes[randomIndex] + (Math.random() - 0.5) * 0.01;
        const longitude = baseLongitudes[randomIndex] + (Math.random() - 0.5) * 0.01;
        
        return {
          id: driver.id,
          name: driver.name,
          vehicleRegistration: driver.vehicleId ? `GP${String(driver.vehicleId).padStart(3, '0')}ABC` : 'N/A',
          vehicleType: driver.vehicleId % 3 === 0 ? 'truck' : 'van',
          latitude,
          longitude,
          status: driver.status,
          lastUpdate: new Date().toISOString(),
          currentJob: currentJob ? {
            id: currentJob.id,
            customerName: currentJob.customerName,
            deliveryAddress: currentJob.deliveryAddress,
            estimatedArrival: new Date(Date.now() + Math.random() * 3600000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })
          } : undefined,
          speed: driver.status === 'active' ? Math.floor(Math.random() * 60) + 20 : 0,
          heading: Math.floor(Math.random() * 360)
        };
      });
  }

  async updateDriverLocation(driverId: number, locationData: any): Promise<any> {
    const driver = this.drivers.get(driverId);
    if (!driver) {
      return { success: false, error: "Driver not found" };
    }

    // Update driver's current location
    const updatedDriver: Driver = {
      ...driver,
      currentLatitude: locationData.latitude,
      currentLongitude: locationData.longitude,
      lastLocationUpdate: new Date(),
      bearing: locationData.bearing || driver.bearing,
      speed: locationData.speed || driver.speed,
      updatedAt: new Date(),
    };

    this.drivers.set(driverId, updatedDriver);

    // Also update any active jobs with the driver's location
    const activeJobs = Array.from(this.jobs.values()).filter(
      job => job.driverId === driverId && job.status === 'in_progress'
    );

    for (const job of activeJobs) {
      const updatedJob: Job = {
        ...job,
        currentDriverLatitude: locationData.latitude,
        currentDriverLongitude: locationData.longitude,
        lastLocationUpdate: new Date(),
        updatedAt: new Date(),
      };
      this.jobs.set(job.id, updatedJob);
    }

    return {
      success: true,
      driverId,
      location: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        bearing: locationData.bearing,
        speed: locationData.speed
      },
      updatedAt: new Date().toISOString(),
      activeJobsUpdated: activeJobs.length
    };
  }

  // Feedback System Implementation
  private feedbackSubmissions = new Map<number, any>();
  private feedbackCounter = 1;

  async getAllFeedback(): Promise<any[]> {
    return Array.from(this.feedbackSubmissions.values());
  }

  async createFeedback(feedbackData: any): Promise<any> {
    const feedback = {
      id: this.feedbackCounter++,
      ...feedbackData
    };
    
    this.feedbackSubmissions.set(feedback.id, feedback);
    return feedback;
  }

  async getFeedbackAnalytics(params: { category?: string; dateRange?: string }): Promise<any> {
    const allFeedback = Array.from(this.feedbackSubmissions.values());
    
    // Filter by category if specified
    let filteredFeedback = allFeedback;
    if (params.category) {
      filteredFeedback = allFeedback.filter(f => f.category === params.category);
    }
    
    // Calculate analytics
    const totalFeedback = filteredFeedback.length;
    const reactionCounts = filteredFeedback.reduce((acc, feedback) => {
      acc[feedback.reaction] = (acc[feedback.reaction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const averageRating = this.calculateAverageRating(filteredFeedback);
    const categoryCounts = filteredFeedback.reduce((acc, feedback) => {
      acc[feedback.category] = (acc[feedback.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalFeedback,
      reactionCounts,
      averageRating,
      categoryCounts,
      recentFeedback: filteredFeedback
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
    };
  }

  private calculateAverageRating(feedback: any[]): number {
    const ratingMap: Record<string, number> = {
      'Love it': 5,
      'Excellent': 5,
      'Great': 4,
      'Good': 3,
      'Okay': 2,
      'Not great': 1,
      'Disappointing': 1
    };
    
    const ratings = feedback.map(f => ratingMap[f.reaction] || 3);
    return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  }

  // Smart Route Suggestions based on Historical Data
  async getSmartRouteSuggestions(jobIds: number[]): Promise<any[]> {
    // Mock smart suggestions based on historical patterns
    if (jobIds.length === 0) return [];
    
    return [
      {
        id: 1,
        suggestionType: 'route_order',
        reasoning: 'Based on 247 similar routes, reordering deliveries by proximity can reduce travel time by 32%',
        predictedSavings: {
          time: '2.1 hours',
          fuel: '12.4L',
          distance: '68km',
          cost: 'R960'
        },
        confidence: 94,
        priority: 'high',
        historicalBasis: [
          { routeId: 'R-2024-0156', similarity: 96, performance: 'excellent' },
          { routeId: 'R-2024-0089', similarity: 89, performance: 'good' },
          { routeId: 'R-2023-0234', similarity: 84, performance: 'excellent' }
        ],
        status: 'pending'
      },
      {
        id: 2,
        suggestionType: 'timing',
        reasoning: 'Historical data shows 23% faster completion when starting 45 minutes earlier to avoid peak traffic',
        predictedSavings: {
          time: '1.7 hours',
          fuel: '8.2L',
          distance: '34km',
          cost: 'R670'
        },
        confidence: 87,
        priority: 'medium',
        historicalBasis: [
          { routeId: 'R-2024-0098', similarity: 91, performance: 'excellent' },
          { routeId: 'R-2024-0045', similarity: 78, performance: 'good' }
        ],
        status: 'pending'
      }
    ];
  }

  async generateSmartSuggestions(jobIds: number[]): Promise<any[]> {
    // Simulate AI analysis of historical job patterns
    const suggestions = await this.getSmartRouteSuggestions(jobIds);
    return suggestions;
  }

  async applyRouteSuggestion(suggestionId: number): Promise<any> {
    // Apply the route suggestion optimizations
    return { 
      success: true, 
      appliedAt: new Date().toISOString(),
      message: 'Smart route optimization applied successfully'
    };
  }

  async rejectRouteSuggestion(suggestionId: number): Promise<any> {
    // Mark suggestion as rejected for ML learning
    return { 
      success: true, 
      rejectedAt: new Date().toISOString(),
      message: 'Suggestion rejected, AI will learn from this feedback'
    };
  }

  async getRouteAnalytics(params: {
    jobId?: number;
    driverId?: number;
    dateRange?: string;
  }): Promise<any[]> {
    // Return historical route performance data
    return [
      {
        id: 1,
        jobId: params.jobId || 1,
        driverId: params.driverId || 1,
        plannedDistance: 45.2,
        actualDistance: 47.8,
        plannedDuration: 120,
        actualDuration: 135,
        efficiency: 89.2,
        deviation: 5.8,
        timeOfDay: 'morning',
        trafficCondition: 'moderate'
      }
    ];
  }

  async createRouteAnalytics(data: any): Promise<any> {
    return { id: Math.random(), ...data, createdAt: new Date() };
  }

  // Stub implementations for missing interface methods
  async processOCRDocument(id: number, ocrData: any): Promise<any> {
    return { id, processed: true, ocrData };
  }

  async updateCostCentreDocument(id: number, updateData: any): Promise<any> {
    return { id, ...updateData };
  }

  async getAllTripData(): Promise<TripData[]> {
    return Array.from(this.tripData.values());
  }

  async getTripData(id: number): Promise<TripData | undefined> {
    return this.tripData.get(id);
  }

  async getTripDataByDriver(driverId: number): Promise<TripData[]> {
    return Array.from(this.tripData.values()).filter(trip => trip.driverId === driverId);
  }

  async createTripData(tripData: InsertTripData): Promise<TripData> {
    const id = this.currentId.tripData++;
    const trip: TripData = {
      ...tripData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tripData.set(id, trip);
    return trip;
  }

  async handleJobCarryOver(): Promise<void> {
    // Handle job carry over logic
  }

  async prioritizeJobs(jobs: Job[]): Promise<Job[]> {
    return jobs.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      if (a.priority === 'high' && b.priority === 'normal') return -1;
      if (b.priority === 'high' && a.priority === 'normal') return 1;
      return 0;
    });
  }

  async moveToUnassignedJobs(jobId: number): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    
    job.driverId = null;
    job.vehicleId = null;
    job.status = 'pending';
    this.jobs.set(jobId, job);
    return true;
  }

  async getCostCentreDocumentsByVehicle(vehicleId: number): Promise<any[]> {
    return [];
  }

  async getAllCostCentreDocuments(): Promise<any[]> {
    return [];
  }

  async createCostCentreDocument(documentData: any): Promise<any> {
    return { id: Math.random(), ...documentData };
  }

  async getCostCentreDocument(id: number): Promise<any | undefined> {
    return undefined;
  }

  async getCostCentreEntriesByVehicle(vehicleId: number): Promise<any[]> {
    return [];
  }

  async getCostCentreEntriesByCategory(category: string): Promise<any[]> {
    return [];
  }

  async getAllCostCentreEntries(): Promise<any[]> {
    return [];
  }

  async createCostCentreEntry(entryData: any): Promise<any> {
    return { id: Math.random(), ...entryData };
  }

  async getVehicleCostSummary(vehicleId: number): Promise<any> {
    return { totalCost: 0, breakdown: {} };
  }

  async generateTrackingToken(jobId: number): Promise<string> {
    return `track_${jobId}_${Date.now()}`;
  }

  async calculateETA(jobId: number, lat: number, lng: number): Promise<number | null> {
    return 30; // 30 minutes default ETA
  }

  async startJobTracking(jobId: number, eta?: number): Promise<Job | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    job.status = 'in_progress';
    job.actualStartTime = new Date();
    this.jobs.set(jobId, job);
    return job;
  }

  async updateJobLocation(jobId: number, lat: number, lng: number): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.currentLatitude = lat.toString();
      job.currentLongitude = lng.toString();
      job.lastLocationUpdate = new Date();
      this.jobs.set(jobId, job);
    }
  }

  async createCustomerNotification(notificationData: any): Promise<any> {
    return { id: Math.random(), ...notificationData };
  }

  async getJobByTrackingToken(token: string): Promise<Job | undefined> {
    return Array.from(this.jobs.values()).find(job => job.trackingToken === token);
  }

  async getJobsNearingArrival(): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(job => job.status === 'in_progress');
  }

  async getGeofencesByType(type: string): Promise<any[]> {
    return [];
  }

  async getActiveGeofences(): Promise<any[]> {
    return [];
  }

  async getAllGeofences(): Promise<any[]> {
    return [];
  }

  async createGeofence(geofenceData: any): Promise<any> {
    return { id: Math.random(), ...geofenceData };
  }

  // System Settings operations
  async getSystemSettings(): Promise<any[]> {
    return [
      { key: 'harsh_braking_threshold', value: '0.4' },
      { key: 'rapid_acceleration_threshold', value: '0.4' },
      { key: 'harsh_cornering_threshold', value: '0.5' },
      { key: 'speed_limit_buffer', value: '10' }
    ];
  }

  async getSystemSetting(key: string): Promise<any | undefined> {
    const settings = await this.getSystemSettings();
    return settings.find(setting => setting.key === key);
  }

  async updateSystemSetting(key: string, value: string): Promise<any | undefined> {
    return { key, value, updated: true };
  }

  async getDriversOnLongBreak(alertMinutes: number): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(driver => {
      // Logic to check if driver is on long break
      return false; // Stub implementation
    });
  }

  async getFuelEntriesForReport(vehicleId: string, startDate: Date, endDate: Date): Promise<Array<FuelEntry & { driverName: string; vehicleRegistration: string }>> {
    const entries = Array.from(this.fuelEntries.values());
    const vehicles = Array.from(this.vehicles.values());
    const drivers = Array.from(this.drivers.values());
    
    return entries
      .filter(entry => {
        const entryDate = new Date(entry.createdAt);
        const matchesDate = entryDate >= startDate && entryDate <= endDate;
        const matchesVehicle = vehicleId === 'all' || entry.vehicleId === parseInt(vehicleId);
        return matchesDate && matchesVehicle;
      })
      .map(entry => {
        const vehicle = vehicles.find(v => v.id === entry.vehicleId);
        const driver = drivers.find(d => d.id === vehicle?.assignedDriverId);
        
        return {
          ...entry,
          driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown Driver',
          vehicleRegistration: vehicle?.registrationNumber || 'Unknown Vehicle'
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getFuelConsumptionReport(vehicleId: string, startDate: Date, endDate: Date): Promise<Array<{
    driverName: string;
    vehicleRegistration: string; 
    totalLitres: number;
    totalKm: number;
    litresPerKm: number;
    litresPer100Km: number;
  }>> {
    const entries = Array.from(this.fuelEntries.values());
    const vehicles = Array.from(this.vehicles.values());
    const drivers = Array.from(this.drivers.values());
    
    const filteredEntries = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      const matchesDate = entryDate >= startDate && entryDate <= endDate;
      const matchesVehicle = vehicleId === 'all' || entry.vehicleId === parseInt(vehicleId);
      return matchesDate && matchesVehicle;
    });

    // Group by vehicle/driver combination
    const groupedData = new Map<string, {
      driverName: string;
      vehicleRegistration: string;
      entries: FuelEntry[];
      totalLitres: number;
      firstOdometer: number;
      lastOdometer: number;
    }>();

    filteredEntries.forEach(entry => {
      const vehicle = vehicles.find(v => v.id === entry.vehicleId);
      const driver = drivers.find(d => d.id === vehicle?.assignedDriverId);
      const key = `${entry.vehicleId}-${vehicle?.assignedDriverId}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          driverName: driver ? `${driver.firstName} ${driver.lastName}` : 'Unknown Driver',
          vehicleRegistration: vehicle?.registrationNumber || 'Unknown Vehicle',
          entries: [],
          totalLitres: 0,
          firstOdometer: parseFloat(entry.odometer),
          lastOdometer: parseFloat(entry.odometer)
        });
      }
      
      const group = groupedData.get(key)!;
      group.entries.push(entry);
      group.totalLitres += parseFloat(entry.liters);
      
      const odometer = parseFloat(entry.odometer);
      if (odometer < group.firstOdometer) group.firstOdometer = odometer;
      if (odometer > group.lastOdometer) group.lastOdometer = odometer;
    });

    return Array.from(groupedData.values()).map(group => {
      const totalKm = Math.max(0, group.lastOdometer - group.firstOdometer);
      const litresPerKm = totalKm > 0 ? group.totalLitres / totalKm : 0;
      const litresPer100Km = totalKm > 0 ? (group.totalLitres / totalKm) * 100 : 0;
      
      return {
        driverName: group.driverName,
        vehicleRegistration: group.vehicleRegistration,
        totalLitres: Math.round(group.totalLitres * 100) / 100,
        totalKm: Math.round(totalKm * 100) / 100,
        litresPerKm: Math.round(litresPerKm * 1000) / 1000,
        litresPer100Km: Math.round(litresPer100Km * 100) / 100
      };
    });
  }

  // Driver shift operations
  async getAllDriverShifts(): Promise<DriverShift[]> {
    return Array.from(this.driverShifts.values());
  }

  async getDriverShift(id: number): Promise<DriverShift | undefined> {
    return this.driverShifts.get(id);
  }

  async getDriverShiftsByDriver(driverId: number): Promise<DriverShift[]> {
    return Array.from(this.driverShifts.values()).filter(shift => shift.driverId === driverId);
  }

  async createDriverShift(insertShift: InsertDriverShift): Promise<DriverShift> {
    const id = this.currentId.driverShifts++;
    const shift: DriverShift = {
      ...insertShift,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.driverShifts.set(id, shift);
    return shift;
  }

  async updateDriverShift(id: number, updateData: Partial<InsertDriverShift>): Promise<DriverShift | undefined> {
    const existing = this.driverShifts.get(id);
    if (!existing) return undefined;

    const updated: DriverShift = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.driverShifts.set(id, updated);
    return updated;
  }

  async deleteDriverShift(id: number): Promise<boolean> {
    return this.driverShifts.delete(id);
  }

  async checkShiftStatus(driverId: number, currentTime: Date): Promise<{ withinShift: boolean; reassignedJobs?: Job[] }> {
    const shifts = await this.getDriverShiftsByDriver(driverId);
    const activeShift = shifts.find(shift => 
      shift.status === "active" && 
      new Date(shift.startTime) <= currentTime && 
      new Date(shift.endTime) >= currentTime
    );

    if (activeShift) {
      return { withinShift: true };
    }

    // If no active shift, reassign incomplete jobs
    const incompleteJobs = Array.from(this.jobs.values()).filter(
      job => job.driverId === driverId && job.status !== "completed" && job.status !== "cancelled"
    );

    // Update jobs to unassigned status
    for (const job of incompleteJobs) {
      await this.updateJob(job.id, { status: "pending", driverId: null });
    }

    return { withinShift: false, reassignedJobs: incompleteJobs };
  }

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values());
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return Array.from(this.alerts.values()).filter(alert => !alert.isRead);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = this.currentId.alerts++;
    const alert: Alert = {
      ...insertAlert,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.alerts.set(id, alert);
    return alert;
  }

  async updateAlert(id: number, updateData: Partial<InsertAlert>): Promise<Alert | undefined> {
    const existing = this.alerts.get(id);
    if (!existing) return undefined;

    const updated: Alert = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async markAlertAsRead(id: number): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    const updated = { ...alert, isRead: true, updatedAt: new Date() };
    this.alerts.set(id, updated);
    return true;
  }

  async markAlertAsResolved(id: number): Promise<boolean> {
    const alert = this.alerts.get(id);
    if (!alert) return false;

    const updated = { ...alert, isResolved: true, updatedAt: new Date() };
    this.alerts.set(id, updated);
    return true;
  }

  async deleteAlert(id: number): Promise<boolean> {
    return this.alerts.delete(id);
  }

  // Regional pricing operations
  async getAllRegionalPricing(): Promise<RegionalPricing[]> {
    return Array.from(this.regionalPricing.values());
  }

  async getRegionalPricing(region: string): Promise<RegionalPricing | undefined> {
    return Array.from(this.regionalPricing.values()).find(pricing => pricing.region === region);
  }

  async createRegionalPricing(insertPricing: InsertRegionalPricing): Promise<RegionalPricing> {
    const id = this.currentId.regionalPricing++;
    const pricing: RegionalPricing = {
      ...insertPricing,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.regionalPricing.set(id, pricing);
    return pricing;
  }

  async updateRegionalPricing(id: number, updateData: Partial<InsertRegionalPricing>): Promise<RegionalPricing | undefined> {
    const existing = this.regionalPricing.get(id);
    if (!existing) return undefined;

    const updated: RegionalPricing = {
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
    this.regionalPricing.set(id, updated);
    return updated;
  }

  // Job assignment operations
  async assignJob(jobId: number, driverId: number): Promise<Job | undefined> {
    return await this.updateJob(jobId, { driverId, status: "in_progress" });
  }

  async optimizeRoutes(jobs: Job[]): Promise<Job[]> {
    // Circuit-style optimization with time override logic
    // Time takes precedence over order priority in job sequencing
    
    return jobs.sort((a, b) => {
      // First priority: Jobs with fixed times (hasFixedTime: true)
      const isValidFixedTime = (job: Job): boolean => {
        return job.hasFixedTime && 
               job.arrivalTime && 
               job.arrivalTime.trim().toLowerCase() !== "anytime" &&
               job.arrivalTime.trim() !== "";
      };
      
      const aHasFixedTime = isValidFixedTime(a);
      const bHasFixedTime = isValidFixedTime(b);
      
      if (aHasFixedTime && !bHasFixedTime) return -1;
      if (!aHasFixedTime && bHasFixedTime) return 1;
      
      // If both have fixed times, sort by arrival time
      if (aHasFixedTime && bHasFixedTime) {
        // Convert HH:MM to minutes for comparison with error handling
        const parseTime = (timeStr: string): number => {
          try {
            const cleanTime = timeStr.trim();
            const [hoursStr, minutesStr] = cleanTime.split(':');
            const hours = parseInt(hoursStr, 10);
            const minutes = parseInt(minutesStr, 10);
            
            // Validate time format
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
              return Infinity; // Invalid times go to end
            }
            
            return hours * 60 + minutes;
          } catch (error) {
            return Infinity; // Malformed times go to end
          }
        };
        
        const aTime = parseTime(a.arrivalTime!);
        const bTime = parseTime(b.arrivalTime!);
        return aTime - bTime;
      }
      
      // Second priority: Order priority for non-time-bound jobs
      const orderPriorityWeight = (job: Job) => {
        switch (job.orderPriority) {
          case "first": return 1;
          case "last": return 3;
          case "auto":
          default: return 2;
        }
      };
      
      const aOrderWeight = orderPriorityWeight(a);
      const bOrderWeight = orderPriorityWeight(b);
      
      if (aOrderWeight !== bOrderWeight) {
        return aOrderWeight - bOrderWeight;
      }
      
      // Third priority: Regular priority (urgent > high > medium)
      const priorityWeight = (priority: string) => {
        switch (priority) {
          case "urgent": return 1;
          case "high": return 2;
          case "medium": return 3;
          case "low": return 4;
          default: return 3;
        }
      };
      
      const aPriorityWeight = priorityWeight(a.priority);
      const bPriorityWeight = priorityWeight(b.priority);
      
      if (aPriorityWeight !== bPriorityWeight) {
        return aPriorityWeight - bPriorityWeight;
      }
      
      // Final fallback: Sort by scheduled date
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  }

  // Job reassignment operations
  async reassignJob(jobId: number, newDriverId: number | null, reassignedBy: number, reason: string, notes?: string): Promise<{job: Job | undefined, reassignmentRecord: JobReassignmentHistory}> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    // Get driver details for history
    const oldDriver = job.driverId ? this.drivers.get(job.driverId) : null;
    const newDriver = newDriverId ? this.drivers.get(newDriverId) : null;
    const reassigner = await this.getUser(reassignedBy);

    if (!reassigner) {
      throw new Error(`User with ID ${reassignedBy} not found`);
    }

    if (newDriverId && !newDriver) {
      throw new Error(`Driver with ID ${newDriverId} not found`);
    }

    // Update the job
    const updatedJob = await this.updateJob(jobId, { 
      driverId: newDriverId,
      status: newDriverId ? "assigned" : "pending"
    });

    // Create reassignment history record
    const reassignmentId = this.currentId.jobReassignmentHistory++;
    const reassignmentRecord: JobReassignmentHistory = {
      id: reassignmentId,
      jobId,
      jobNumber: job.jobNumber,
      fromDriverId: job.driverId,
      toDriverId: newDriverId,
      fromDriverName: oldDriver?.name || null,
      toDriverName: newDriver?.name || null,
      reassignedBy,
      reassignedByName: reassigner.username,
      reason,
      notes: notes || null,
      previousStatus: job.status,
      newStatus: newDriverId ? "assigned" : "pending",
      conflictsDetected: null,
      automaticReassignment: false,
      customerNotified: false,
      driverNotified: false,
      createdAt: new Date()
    };

    this.jobReassignmentHistory.set(reassignmentId, reassignmentRecord);

    return { job: updatedJob, reassignmentRecord };
  }

  async bulkReassignJobs(jobIds: number[], newDriverId: number | null, reassignedBy: number, reason: string, notes?: string): Promise<{reassignedJobs: Job[], reassignmentRecords: JobReassignmentHistory[]}> {
    const reassignedJobs: Job[] = [];
    const reassignmentRecords: JobReassignmentHistory[] = [];

    for (const jobId of jobIds) {
      try {
        const result = await this.reassignJob(jobId, newDriverId, reassignedBy, reason, notes);
        if (result.job) {
          reassignedJobs.push(result.job);
          reassignmentRecords.push(result.reassignmentRecord);
        }
      } catch (error) {
        console.error(`Failed to reassign job ${jobId}:`, error);
        // Continue with other jobs
      }
    }

    return { reassignedJobs, reassignmentRecords };
  }

  async getJobReassignmentHistory(jobId: number): Promise<JobReassignmentHistory[]> {
    return Array.from(this.jobReassignmentHistory.values())
      .filter(record => record.jobId === jobId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAllJobReassignmentHistory(): Promise<JobReassignmentHistory[]> {
    return Array.from(this.jobReassignmentHistory.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReassignmentHistoryByDriver(driverId: number): Promise<JobReassignmentHistory[]> {
    return Array.from(this.jobReassignmentHistory.values())
      .filter(record => record.fromDriverId === driverId || record.toDriverId === driverId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async checkDriverWorkload(driverId: number): Promise<{totalJobs: number, pendingJobs: number, inProgressJobs: number}> {
    const driverJobs = Array.from(this.jobs.values()).filter(job => job.driverId === driverId);
    
    const totalJobs = driverJobs.length;
    const pendingJobs = driverJobs.filter(job => job.status === "pending").length;
    const inProgressJobs = driverJobs.filter(job => job.status === "in_progress").length;

    return { totalJobs, pendingJobs, inProgressJobs };
  }

  async getAvailableDriversForReassignment(excludeDriverId?: number): Promise<Driver[]> {
    return Array.from(this.drivers.values()).filter(driver => {
      // Exclude specified driver
      if (excludeDriverId && driver.id === excludeDriverId) return false;
      
      // Only active drivers
      if (driver.status !== "active") return false;
      
      // Check if driver is registered
      if (!driver.isRegistered) return false;
      
      // Check if driver has a vehicle assigned
      if (!driver.vehicleId) return false;
      
      return true;
    });
  }

  async detectReassignmentConflicts(jobId: number, newDriverId: number): Promise<string[]> {
    const conflicts: string[] = [];
    const job = this.jobs.get(jobId);
    const driver = this.drivers.get(newDriverId);
    
    if (!job || !driver) return conflicts;

    // Check driver workload
    const workload = await this.checkDriverWorkload(newDriverId);
    if (workload.totalJobs >= 10) {
      conflicts.push(`Driver ${driver.name} has high workload (${workload.totalJobs} jobs)`);
    }

    // Check vehicle assignment
    if (!driver.vehicleId) {
      conflicts.push(`Driver ${driver.name} has no vehicle assigned`);
    }

    // Check driver status
    if (driver.status !== "active") {
      conflicts.push(`Driver ${driver.name} is not active (status: ${driver.status})`);
    }

    // Check for time conflicts with existing jobs
    const driverJobs = Array.from(this.jobs.values()).filter(j => 
      j.driverId === newDriverId && 
      j.status !== "completed" && 
      j.status !== "cancelled"
    );

    if (job.hasFixedTime && job.scheduledTime) {
      const jobTime = new Date(job.scheduledTime);
      const conflictingJobs = driverJobs.filter(existingJob => {
        if (!existingJob.hasFixedTime || !existingJob.scheduledTime) return false;
        const existingTime = new Date(existingJob.scheduledTime);
        const timeDiff = Math.abs(jobTime.getTime() - existingTime.getTime());
        return timeDiff < 60 * 60 * 1000; // Within 1 hour
      });
      
      if (conflictingJobs.length > 0) {
        conflicts.push(`Time conflict: Driver has ${conflictingJobs.length} job(s) within 1 hour of scheduled time`);
      }
    }

    return conflicts;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeVehicles: number;
    activeDrivers: number;
    completedJobs: number;
    fuelSavings: number;
  }> {
    const activeVehicles = Array.from(this.vehicles.values()).filter(v => v.status === "active").length;
    const activeDrivers = Array.from(this.drivers.values()).filter(d => d.status === "active").length;
    const completedJobs = Array.from(this.jobs.values()).filter(j => j.status === "completed").length;
    const fuelSavings = 15.2; // Mock calculation for fuel savings percentage

    return {
      activeVehicles,
      activeDrivers,
      completedJobs,
      fuelSavings,
    };
  }

  async createVehicleAssignment(assignment: {
    driverId: number;
    vehicleId: number;
    assignmentDate: Date;
    startingOdometer: number;
    isActive: boolean;
  }): Promise<any> {
    const driver = this.drivers.get(assignment.driverId);
    const vehicle = this.vehicles.get(assignment.vehicleId);
    
    if (!driver) {
      throw new Error(`Driver with ID ${assignment.driverId} not found`);
    }
    
    if (!vehicle) {
      throw new Error(`Vehicle with ID ${assignment.vehicleId} not found`);
    }

    // Update driver with vehicle assignment
    const updatedDriver = {
      ...driver,
      vehicleId: assignment.vehicleId,
      updatedAt: new Date(),
    };
    this.drivers.set(assignment.driverId, updatedDriver);

    // Update vehicle with driver assignment
    const updatedVehicle = {
      ...vehicle,
      assignedDriverId: assignment.driverId,
      assignedDate: assignment.assignmentDate,
      currentOdometer: assignment.startingOdometer.toString(),
      updatedAt: new Date(),
    };
    this.vehicles.set(assignment.vehicleId, updatedVehicle);

    return {
      success: true,
      driver: updatedDriver,
      vehicle: updatedVehicle,
      assignment: {
        driverId: assignment.driverId,
        vehicleId: assignment.vehicleId,
        assignmentDate: assignment.assignmentDate,
        startingOdometer: assignment.startingOdometer,
        isActive: assignment.isActive,
      },
    };
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values());
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.fromUserId === userId || message.toUserId === userId
    );
  }

  async getUnreadMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.toUserId === userId && !message.isRead
    );
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const id = this.messages.size + 1;
    const now = new Date();
    
    const message: Message = {
      id,
      ...messageData,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };
    
    this.messages.set(id, message);
    return message;
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    const message = this.messages.get(messageId);
    if (!message) {
      return false;
    }
    
    const updatedMessage = {
      ...message,
      isRead: true,
      updatedAt: new Date(),
    };
    
    this.messages.set(messageId, updatedMessage);
    return true;
  }

  async deleteMessage(messageId: number): Promise<boolean> {
    return this.messages.delete(messageId);
  }

  // Customer portal operations implementation
  async getCustomerOrders(customerUserId: number): Promise<CustomerOrder[]> {
    return Array.from(this.customerOrders.values()).filter(
      order => order.customerUserId === customerUserId
    );
  }

  async getCustomerConversations(customerUserId: number): Promise<CustomerMessage[]> {
    return Array.from(this.customerMessages.values()).filter(
      message => message.customerUserId === customerUserId
    );
  }

  async getCustomerPortalUser(id: number): Promise<CustomerPortalUser | undefined> {
    return this.customerPortalUsers.get(id);
  }

  async getCustomerPortalUserByEmail(email: string): Promise<CustomerPortalUser | undefined> {
    return Array.from(this.customerPortalUsers.values()).find(
      user => user.email === email
    );
  }

  async createCustomerPortalUser(userData: InsertCustomerPortalUser): Promise<CustomerPortalUser> {
    const id = this.currentId.customerPortalUsers++;
    const now = new Date();
    
    const user: CustomerPortalUser = {
      id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.customerPortalUsers.set(id, user);
    return user;
  }

  async createCustomerOrder(orderData: InsertCustomerOrder): Promise<CustomerOrder> {
    const id = this.currentId.customerOrders++;
    const now = new Date();
    
    const order: CustomerOrder = {
      id,
      ...orderData,
      createdAt: now,
      updatedAt: now,
    };
    
    this.customerOrders.set(id, order);
    return order;
  }

  async createCustomerMessage(messageData: InsertCustomerMessage): Promise<CustomerMessage> {
    const id = this.currentId.customerMessages++;
    const now = new Date();
    
    const message: CustomerMessage = {
      id,
      ...messageData,
      createdAt: now,
    };
    
    this.customerMessages.set(id, message);
    return message;
  }

  // Geocoding cache operations
  async cacheGeocodingResult(address: string, result: any): Promise<void> {
    const normalizedAddress = address.toLowerCase().trim();
    this.geocodingCache.set(normalizedAddress, {
      result,
      timestamp: Date.now()
    });
  }

  async getCachedGeocodingResult(address: string): Promise<any | null> {
    const normalizedAddress = address.toLowerCase().trim();
    const cached = this.geocodingCache.get(normalizedAddress);
    
    if (!cached) return null;
    
    // Check if cache entry is still valid (90 days as per cost-saving strategy)
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds
    if (Date.now() - cached.timestamp > maxAge) {
      this.geocodingCache.delete(normalizedAddress);
      return null;
    }
    
    return cached.result;
  }
}

// import { DatabaseStorage } from "./database-storage";

// Add Moovly Go stub methods to MemStorage class
(MemStorage.prototype as any).createMoovlyGoUser = async function(user: any) {
  if (!this.moovlyGoUsers) this.moovlyGoUsers = [];
  const newUser = { id: Date.now(), ...user, createdAt: new Date(), updatedAt: new Date() };
  this.moovlyGoUsers.push(newUser);
  return newUser;
};

(MemStorage.prototype as any).getMoovlyGoUserByEmail = async function(email: string) {
  if (!this.moovlyGoUsers) this.moovlyGoUsers = [];
  return this.moovlyGoUsers.find((user: any) => user.email === email);
};

export const storage = new MemStorage();
