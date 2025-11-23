import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (existing)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Customers table for address book
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  notes: text("notes"),
  totalJobs: integer("total_jobs").default(0),
  lastJobDate: timestamp("last_job_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Drivers table
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Custom identifier: first name, fleet number, etc.
  name: text("name").notNull(), // Full name (first + surname)
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(), // Required for SMS OTP
  idNumber: text("id_number"), // National ID or driver ID number
  licenseNumber: text("license_number").notNull().unique(),
  pin: text("pin"), // 4-digit PIN for authentication (hashed)
  pinSetAt: timestamp("pin_set_at"), // When PIN was last set
  otpCode: text("otp_code"), // Current OTP code
  otpExpiresAt: timestamp("otp_expires_at"), // OTP expiration time
  otpAttempts: integer("otp_attempts").default(0), // Failed OTP attempts
  registrationToken: text("registration_token"), // Token for registration process
  isRegistered: boolean("is_registered").default(false), // Registration completion status
  status: text("status").notNull().default("pending"), // pending, active, inactive, suspended
  role: text("role").notNull().default("fleet"), // fleet, courier - determines which interface they can access
  vehicleId: integer("vehicle_id"),
  currentRoute: text("current_route"),
  performance: decimal("performance", { precision: 5, scale: 2 }).default("0"),
  lastLoginAt: timestamp("last_login_at"),
  // Network status fields
  networkStatus: text("network_status").default("online"), // online, offline, poor
  lastSyncAt: timestamp("last_sync_at"),
  pendingJobs: integer("pending_jobs").default(0), // Count of jobs waiting to sync
  // Break time tracking
  isOnBreak: boolean("is_on_break").default(false),
  breakStartTime: timestamp("break_start_time"),
  breakAlertSent: boolean("break_alert_sent").default(false),
  // Push notification fields
  pushSubscription: jsonb("push_subscription"), // Web Push subscription object
  notificationPreferences: jsonb("notification_preferences").default('{"jobAssigned": true, "jobUpdated": true, "routeOptimized": true, "breakReminders": true}'),
  // Current location tracking
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
  currentLongitude: decimal("current_longitude", { precision: 10, scale: 7 }),
  lastLocationUpdate: timestamp("last_location_update"),
  bearing: decimal("bearing", { precision: 5, scale: 2 }), // Direction vehicle is facing (0-360 degrees)
  speed: decimal("speed", { precision: 5, scale: 2 }), // Current speed in km/h
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vehicleNumber: text("vehicle_number").notNull().unique(),
  registration: text("registration").notNull().unique(), // Vehicle registration number
  chassisNumber: text("chassis_number").notNull().unique(), // Required field
  engineNumber: text("engine_number").notNull().unique(), // Required field
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  currentOdometer: decimal("current_odometer", { precision: 10, scale: 2 }).default("0"),
  plateNumber: text("plate_number").notNull().unique(),
  status: text("status").notNull().default("active"), // active, maintenance, inactive
  fuelType: text("fuel_type").notNull(), // diesel, petrol, electric, hybrid
  mileage: decimal("mileage", { precision: 10, scale: 2 }).default("0"),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  nextMaintenanceDate: timestamp("next_maintenance_date"),
  assignedDriverId: integer("assigned_driver_id"), // Currently assigned driver
  assignedDate: timestamp("assigned_date"), // When vehicle was assigned to current driver
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  jobNumber: text("job_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  driverId: integer("driver_id"),
  vehicleId: integer("vehicle_id"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, delayed, cancelled
  priority: text("priority").notNull().default("medium"), // high, medium, low
  orderPriority: text("order_priority").default("auto"), // first, auto, last
  jobType: text("job_type").default("delivery"), // delivery, pickup
  arrivalTime: text("arrival_time"), // HH:MM format or "Anytime"
  timeAtStop: integer("time_at_stop").default(5), // minutes
  packageCount: integer("package_count").default(1), // Number of packages
  accessInstructions: text("access_instructions"), // Special access notes (e.g., "Ring doorbell", "Side entrance")
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: timestamp("scheduled_time"),
  completedDate: timestamp("completed_date"),
  estimatedDistance: decimal("estimated_distance", { precision: 8, scale: 2 }),
  actualDistance: decimal("actual_distance", { precision: 8, scale: 2 }),
  notes: text("notes"),
  packageDetails: text("package_details"),
  specialInstructions: text("special_instructions"),
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  isCarryOver: boolean("is_carry_over").default(false),
  hasFixedTime: boolean("has_fixed_time").default(false),
  // Tracking fields for customer notifications
  trackingToken: text("tracking_token").unique(), // UUID for customer tracking link
  customerNotificationSent: boolean("customer_notification_sent").default(false),
  driverStartedAt: timestamp("driver_started_at"),
  estimatedArrivalTime: timestamp("estimated_arrival_time"),
  currentDriverLatitude: decimal("current_driver_latitude", { precision: 10, scale: 7 }),
  currentDriverLongitude: decimal("current_driver_longitude", { precision: 10, scale: 7 }),
  lastLocationUpdate: timestamp("last_location_update"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job Reassignment History table for tracking all job reassignment activities
export const jobReassignmentHistory = pgTable("job_reassignment_history", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  jobNumber: text("job_number").notNull(), // For quick reference
  fromDriverId: integer("from_driver_id"), // null if unassigned
  toDriverId: integer("to_driver_id"), // null if unassigning
  fromDriverName: text("from_driver_name"), // Store names for historical reference
  toDriverName: text("to_driver_name"),
  reassignedBy: integer("reassigned_by").notNull(), // User who performed the reassignment
  reassignedByName: text("reassigned_by_name").notNull(),
  reason: text("reason").notNull().default("dispatcher_reassignment"), // dispatcher_reassignment, emergency, vehicle_breakdown, driver_unavailable, workload_balancing
  notes: text("notes"), // Optional explanation
  previousStatus: text("previous_status").notNull(), // Job status before reassignment
  newStatus: text("new_status").notNull(), // Job status after reassignment
  conflictsDetected: text("conflicts_detected"), // JSON array of detected conflicts
  automaticReassignment: boolean("automatic_reassignment").default(false), // True if system-generated
  customerNotified: boolean("customer_notified").default(false), // Whether customer was notified
  driverNotified: boolean("driver_notified").default(false), // Whether new driver was notified
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobReassignmentHistorySchema = createInsertSchema(jobReassignmentHistory).omit({
  id: true,
  createdAt: true,
});

// Hub Operations & Scanning
export const hubs = pgTable("hubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Hub identifier
  address: text("address").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hubScans = pgTable("hub_scans", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  hubId: integer("hub_id").notNull(),
  scanType: text("scan_type").notNull(), // "departure", "arrival", "sort", "load"
  scannerUserId: integer("scanner_user_id"), // Who performed the scan
  scanTime: timestamp("scan_time").defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interhubManifests = pgTable("interhub_manifests", {
  id: serial("id").primaryKey(),
  manifestNumber: text("manifest_number").notNull().unique(),
  fromHubId: integer("from_hub_id").notNull(),
  toHubId: integer("to_hub_id").notNull(),
  driverId: integer("driver_id"),
  vehicleId: integer("vehicle_id"),
  status: text("status").default("pending"), // pending, in_transit, delivered, completed
  departureTime: timestamp("departure_time"),
  arrivalTime: timestamp("arrival_time"),
  totalPackages: integer("total_packages").default(0),
  totalWeight: decimal("total_weight", { precision: 8, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const manifestItems = pgTable("manifest_items", {
  id: serial("id").primaryKey(),
  manifestId: integer("manifest_id").notNull(),
  jobId: integer("job_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
});

// Exception Handling with Severity
export const exceptions = pgTable("exceptions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  driverId: integer("driver_id"),
  type: text("type").notNull(), // "delay", "damage", "missed_delivery", "address_issue", "customer_unavailable"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").default("open"), // open, investigating, resolved, escalated
  assignedTo: integer("assigned_to"), // User handling the exception
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Webhook Configuration & Events
export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"), // If customer-specific
  url: text("url").notNull(),
  events: text("events").array().notNull(), // ["job_created", "job_completed", "job_delayed"]
  secret: text("secret"), // For webhook signature verification
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webhookLogs = pgTable("webhook_logs", {
  id: serial("id").primaryKey(),
  endpointId: integer("endpoint_id").notNull(),
  jobId: integer("job_id"),
  event: text("event").notNull(),
  payload: text("payload").notNull(), // JSON payload sent
  httpStatus: integer("http_status"),
  responseTime: integer("response_time_ms"),
  success: boolean("success").default(false),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zone-based Routing & Management
export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  boundaries: text("boundaries").notNull(), // GeoJSON polygon
  baseRate: decimal("base_rate", { precision: 8, scale: 2 }),
  perKmRate: decimal("per_km_rate", { precision: 8, scale: 2 }),
  assignedDriverIds: text("assigned_driver_ids").array(), // Driver IDs for this zone
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const addressGeocoding = pgTable("address_geocoding", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  zoneId: integer("zone_id"), // Which delivery zone this address belongs to
  geocodingSource: text("geocoding_source"), // "google", "opencage", "manual"
  accuracy: text("accuracy"), // "street", "city", "region"
  lastVerified: timestamp("last_verified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Multi-carrier Integration
export const carriers = pgTable("carriers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true),
  supportedServices: text("supported_services").array(), // ["standard", "express", "overnight"]
  createdAt: timestamp("created_at").defaultNow(),
});

export const carrierRates = pgTable("carrier_rates", {
  id: serial("id").primaryKey(),
  carrierId: integer("carrier_id").notNull(),
  zoneId: integer("zone_id"),
  service: text("service").notNull(), // "standard", "express", "overnight"
  baseRate: decimal("base_rate", { precision: 8, scale: 2 }),
  perKmRate: decimal("per_km_rate", { precision: 8, scale: 2 }),
  minWeight: decimal("min_weight", { precision: 8, scale: 2 }),
  maxWeight: decimal("max_weight", { precision: 8, scale: 2 }),
  effectiveDate: timestamp("effective_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// API Integration & E-commerce
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  keyName: text("key_name").notNull(),
  apiKey: text("api_key").notNull().unique(),
  permissions: text("permissions").array().notNull(), // ["create_jobs", "track_jobs", "manage_webhooks"]
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  rateLimit: integer("rate_limit").default(1000), // Requests per hour
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiUsage = pgTable("api_usage", {
  id: serial("id").primaryKey(),
  apiKeyId: integer("api_key_id").notNull(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  requestTime: timestamp("request_time").defaultNow(),
  responseStatus: integer("response_status"),
  responseTime: integer("response_time_ms"),
});

// Routes table
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  efficiency: decimal("efficiency", { precision: 5, scale: 2 }).default("0"),
  estimatedTime: integer("estimated_time"), // in minutes
  distance: decimal("distance", { precision: 8, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance records table
export const maintenanceRecords = pgTable("maintenance_records", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  type: text("type").notNull(), // routine, repair, inspection
  description: text("description").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  performedDate: timestamp("performed_date").notNull(),
  performedBy: text("performed_by"),
  nextDueDate: timestamp("next_due_date"),
  mileageAtService: decimal("mileage_at_service", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("completed"), // scheduled, in_progress, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fuel entries table
export const fuelEntries = pgTable("fuel_entries", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  liters: decimal("liters", { precision: 8, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  odometer: decimal("odometer", { precision: 10, scale: 2 }).notNull(),
  photoUrl: text("photo_url"),
  location: text("location"),
  fuelStationName: text("fuel_station_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Driver shifts table
export const driverShifts = pgTable("driver_shifts", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  status: text("status").notNull().default("scheduled"), // scheduled, active, completed, missed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alerts table
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // fuel_low, maintenance_due, shift_overdue, job_delayed
  message: text("message").notNull(),
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  entityType: text("entity_type"), // vehicle, driver, job
  entityId: integer("entity_id"),
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Regional pricing table
export const regionalPricing = pgTable("regional_pricing", {
  id: serial("id").primaryKey(),
  region: text("region").notNull().unique(), // ZA, US, GB, etc.
  planName: text("plan_name").notNull(),
  monthlyPrice: text("monthly_price").notNull(),
  annualPrice: text("annual_price").notNull(),
  currency: text("currency").notNull(),
  currencySymbol: text("currency_symbol").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip data table for MoovScore calculation
export const tripData = pgTable("trip_data", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  jobId: integer("job_id"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  distance: decimal("distance", { precision: 8, scale: 2 }).notNull(),
  speedViolations: integer("speed_violations").notNull().default(0),
  harshBrakes: integer("harsh_brakes").notNull().default(0),
  harshAccelerations: integer("harsh_accelerations").notNull().default(0),
  harshTurns: integer("harsh_turns").notNull().default(0),
  idleTimeSeconds: integer("idle_time_seconds").notNull().default(0),
  moovScore: integer("moov_score").notNull().default(100),
  fuelConsumed: decimal("fuel_consumed", { precision: 8, scale: 2 }).default("0"),
  avgSpeed: decimal("avg_speed", { precision: 5, scale: 2 }).default("0"),
  maxSpeed: decimal("max_speed", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Fleet reporting metrics table
export const fleetReports = pgTable("fleet_reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(), // fuel_efficiency, delivery_performance, driver_performance, vehicle_utilization
  reportPeriod: text("report_period").notNull(), // daily, weekly, monthly, quarterly, yearly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  generatedBy: integer("generated_by"), // User ID who generated the report
  reportData: jsonb("report_data").notNull(), // JSON containing the report metrics
  filters: jsonb("filters"), // JSON containing applied filters
  exportFormat: text("export_format"), // pdf, excel, csv
  filePath: text("file_path"), // Path to exported file if saved
  status: text("status").notNull().default("generated"), // generating, generated, exported
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance metrics aggregation table
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // driver, vehicle, fleet
  entityId: integer("entity_id"), // Driver ID, Vehicle ID, or null for fleet-wide
  metricType: text("metric_type").notNull(), // fuel_efficiency, delivery_time, moov_score, utilization
  metricPeriod: text("metric_period").notNull(), // daily, weekly, monthly
  metricDate: timestamp("metric_date").notNull(),
  metricValue: decimal("metric_value", { precision: 10, scale: 4 }).notNull(),
  previousValue: decimal("previous_value", { precision: 10, scale: 4 }),
  percentageChange: decimal("percentage_change", { precision: 5, scale: 2 }),
  benchmark: decimal("benchmark", { precision: 10, scale: 4 }), // Industry or fleet benchmark
  ranking: integer("ranking"), // Ranking within fleet/region
  additionalData: jsonb("additional_data"), // Extra metrics specific to metric type
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery performance tracking
export const deliveryMetrics = pgTable("delivery_metrics", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  driverId: integer("driver_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  travelTime: integer("travel_time_minutes"), // Actual travel time
  delayTime: integer("delay_time_minutes"), // Positive for late, negative for early
  delayReason: text("delay_reason"), // traffic, vehicle_issue, customer_unavailable, etc.
  customerRating: integer("customer_rating"), // 1-5 stars
  onTimeDelivery: boolean("on_time_delivery").default(false),
  distanceTraveled: decimal("distance_traveled", { precision: 8, scale: 2 }),
  fuelEfficiency: decimal("fuel_efficiency", { precision: 6, scale: 2 }), // km/liter or miles/gallon
  createdAt: timestamp("created_at").defaultNow(),
});

// Cost tracking for comprehensive reporting
export const costAnalysis = pgTable("cost_analysis", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  costType: text("cost_type").notNull(), // fuel, maintenance, insurance, depreciation
  costCategory: text("cost_category"), // routine_maintenance, repair, accident
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ZAR"),
  costDate: timestamp("cost_date").notNull(),
  description: text("description"),
  relatedJobId: integer("related_job_id"), // If cost is job-specific
  relatedTripId: integer("related_trip_id"), // If cost is trip-specific
  odometer: decimal("odometer", { precision: 10, scale: 2 }),
  isRecurring: boolean("is_recurring").default(false),
  recurringPeriod: text("recurring_period"), // monthly, quarterly, annually
  costPerKm: decimal("cost_per_km", { precision: 6, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table for in-app messaging
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  messageType: text("message_type").notNull().default("text"), // text, alert, notification
  entityType: text("entity_type"), // job, vehicle, driver
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Client accounts table for admin management
export const clientAccounts = pgTable("client_accounts", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  email: text("email").notNull().unique(),
  status: text("status").notNull().default("active"), // active, paused, disabled
  subscriptionPlan: text("subscription_plan").notNull(), // "Moovly Connect", "Moovly Business"
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart Optimization Rules (Moovly Business exclusive)
export const optimizationRules = pgTable("optimization_rules", {
  id: serial("id").primaryKey(),
  priorityClients: text("priority_clients").notNull().default("high"), // high, medium, low
  timeSensitiveJobs: boolean("time_sensitive_jobs").notNull().default(true),
  routeOptimization: boolean("route_optimization").notNull().default(true),
  fuelEfficiencyFocus: boolean("fuel_efficiency_focus").notNull().default(false),
  driverPerformanceWeight: integer("driver_performance_weight").notNull().default(70), // 0-100
  maxJobsPerRoute: integer("max_jobs_per_route").notNull().default(8),
  emergencyJobsOnly: boolean("emergency_jobs_only").notNull().default(false),
  weatherOptimization: boolean("weather_optimization").notNull().default(true),
  trafficAvoidance: boolean("traffic_avoidance").notNull().default(true),
  clientPreferences: boolean("client_preferences").notNull().default(true),
  autoReassignment: boolean("auto_reassignment").notNull().default(false),
  peakHourAdjustment: boolean("peak_hour_adjustment").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost Centre (Moovly Business exclusive) - OCR Document Management
export const costCentreDocuments = pgTable("cost_centre_documents", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  driverId: integer("driver_id"),
  documentType: text("document_type").notNull(), // fuel_receipt, tyre_invoice, repair_bill, maintenance_receipt, other
  originalImageUrl: text("original_image_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  ocrProcessed: boolean("ocr_processed").default(false),
  ocrRawText: text("ocr_raw_text"),
  ocrConfidence: decimal("ocr_confidence", { precision: 5, scale: 2 }),
  extractedData: text("extracted_data"), // JSON string of extracted fields
  manuallyVerified: boolean("manually_verified").default(false),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed, verified
  uploadedBy: integer("uploaded_by"), // user ID who uploaded
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cost Centre Entries (Moovly Business exclusive)
export const costCentreEntries = pgTable("cost_centre_entries", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  documentId: integer("document_id"), // Reference to costCentreDocuments
  category: text("category").notNull(), // fuel, tyres, repairs, maintenance, insurance, registration, other
  subCategory: text("sub_category"), // brake_pads, oil_change, etc.
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ZAR"),
  supplier: text("supplier"),
  supplierAddress: text("supplier_address"),
  transactionDate: timestamp("transaction_date").notNull(),
  odometer: decimal("odometer", { precision: 10, scale: 2 }),
  quantity: decimal("quantity", { precision: 8, scale: 2 }), // liters of fuel, number of tyres, etc.
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }),
  description: text("description"),
  isRecurring: boolean("is_recurring").default(false),
  nextDueDate: timestamp("next_due_date"),
  driverId: integer("driver_id"), // Who incurred the cost
  jobId: integer("job_id"), // Associated job if applicable
  approvedBy: integer("approved_by"), // Manager who approved
  approvalStatus: text("approval_status").notNull().default("pending"), // pending, approved, rejected
  tags: text("tags"), // JSON array of tags for filtering
  attachments: text("attachments"), // JSON array of additional files
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Notifications table for tracking alerts sent to customers
export const customerNotifications = pgTable("customer_notifications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  customerId: integer("customer_id"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  notificationType: text("notification_type").notNull(), // eta_alert, arrival_notification, completion_notification
  notificationMethod: text("notification_method").notNull(), // sms, email, both
  trackingUrl: text("tracking_url"),
  messageContent: text("message_content"),
  sentAt: timestamp("sent_at"),
  deliveryStatus: text("delivery_status").default("pending"), // pending, sent, delivered, failed
  responseReceived: boolean("response_received").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government Departments table for municipal staff organization
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "Public Works", "Health Services", "Emergency Services"
  code: text("code").notNull().unique(), // e.g., "PW", "HS", "ES"
  description: text("description"),
  budget: decimal("budget", { precision: 15, scale: 2 }), // Annual vehicle budget
  budgetUsed: decimal("budget_used", { precision: 15, scale: 2 }).default("0"),
  managerName: text("manager_name"),
  managerEmail: text("manager_email"),
  managerPhone: text("manager_phone"),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(5), // 1-10 for emergency/priority departments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government Staff table for municipal employees
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  employeeNumber: text("employee_number").notNull().unique(), // Municipal employee ID
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  departmentId: integer("department_id").notNull(),
  position: text("position"), // Job title
  licenseNumber: text("license_number"), // Driver's license
  licenseExpiry: timestamp("license_expiry"),
  isApprover: boolean("is_approver").default(false), // Can approve vehicle bookings
  canBookVehicles: boolean("can_book_vehicles").default(true),
  maxBookingDuration: integer("max_booking_duration").default(480), // Max hours per booking
  status: text("status").notNull().default("active"), // active, inactive, suspended
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicle Bookings table for staff reservations
export const vehicleBookings = pgTable("vehicle_bookings", {
  id: serial("id").primaryKey(),
  bookingNumber: text("booking_number").notNull().unique(), // e.g., "VB-2025-001"
  staffId: integer("staff_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  departmentId: integer("department_id").notNull(),
  purpose: text("purpose").notNull(), // Site visit, meeting, emergency response, etc.
  destination: text("destination").notNull(),
  projectCode: text("project_code"), // For budget allocation
  
  // Booking times
  requestedStartTime: timestamp("requested_start_time").notNull(),
  requestedEndTime: timestamp("requested_end_time").notNull(),
  actualStartTime: timestamp("actual_start_time"),
  actualEndTime: timestamp("actual_end_time"),
  
  // Approval workflow
  status: text("status").notNull().default("pending"), // pending, approved, rejected, in_use, completed, cancelled
  approvedBy: integer("approved_by"), // Staff ID of approver
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  
  // Trip details
  startOdometer: decimal("start_odometer", { precision: 10, scale: 2 }),
  endOdometer: decimal("end_odometer", { precision: 10, scale: 2 }),
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }),
  fuelUsed: decimal("fuel_used", { precision: 8, scale: 2 }),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 10, scale: 2 }),
  
  // Additional fields
  passengers: integer("passengers").default(1),
  notes: text("notes"),
  emergencyBooking: boolean("emergency_booking").default(false),
  requiresApproval: boolean("requires_approval").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trip Logs table for detailed journey tracking
export const tripLogs = pgTable("trip_logs", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  staffId: integer("staff_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  
  // GPS tracking (mobile app captured)
  startLatitude: decimal("start_latitude", { precision: 10, scale: 7 }),
  startLongitude: decimal("start_longitude", { precision: 10, scale: 7 }),
  endLatitude: decimal("end_latitude", { precision: 10, scale: 7 }),
  endLongitude: decimal("end_longitude", { precision: 10, scale: 7 }),
  
  // Route tracking
  routeData: text("route_data"), // JSON array of GPS coordinates
  totalDistance: decimal("total_distance", { precision: 8, scale: 2 }),
  drivingTime: integer("driving_time"), // Minutes
  stoppages: integer("stoppages").default(0),
  maxSpeed: decimal("max_speed", { precision: 5, scale: 2 }),
  avgSpeed: decimal("avg_speed", { precision: 5, scale: 2 }),
  
  // Fuel and costs
  fuelStart: decimal("fuel_start", { precision: 5, scale: 2 }), // Fuel level at start (%)
  fuelEnd: decimal("fuel_end", { precision: 5, scale: 2 }), // Fuel level at end (%)
  fuelPurchased: decimal("fuel_purchased", { precision: 8, scale: 2 }), // Liters
  fuelCost: decimal("fuel_cost", { precision: 10, scale: 2 }),
  parkingCost: decimal("parking_cost", { precision: 10, scale: 2 }),
  tollCost: decimal("toll_cost", { precision: 10, scale: 2 }),
  
  // Documentation
  photoUrls: text("photo_urls"), // JSON array of image URLs
  receipts: text("receipts"), // JSON array of receipt data
  incidentReports: text("incident_reports"), // JSON array of incident data
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vehicle Availability table for tracking when vehicles are free/busy
export const vehicleAvailability = pgTable("vehicle_availability", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  date: timestamp("date").notNull(),
  timeSlots: text("time_slots").notNull(), // JSON array of available time slots
  maintenanceBlocked: boolean("maintenance_blocked").default(false),
  administrativeHold: boolean("administrative_hold").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government Policies table for configurable rules
export const governmentPolicies = pgTable("government_policies", {
  id: serial("id").primaryKey(),
  policyName: text("policy_name").notNull().unique(),
  policyType: text("policy_type").notNull(), // booking_rules, cost_limits, usage_restrictions
  rules: text("rules").notNull(), // JSON configuration
  affectedDepartments: text("affected_departments"), // JSON array of department IDs
  isActive: boolean("is_active").default(true),
  effectiveDate: timestamp("effective_date").defaultNow(),
  expiryDate: timestamp("expiry_date"),
  createdBy: integer("created_by"), // Staff ID
  approvedBy: integer("approved_by"), // Staff ID
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Trail table for government compliance
export const auditTrail = pgTable("audit_trail", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(), // booking_created, vehicle_assigned, trip_completed, etc.
  entityType: text("entity_type").notNull(), // booking, vehicle, staff, department
  entityId: integer("entity_id").notNull(),
  performedBy: integer("performed_by"), // Staff ID
  oldValues: text("old_values"), // JSON of previous values
  newValues: text("new_values"), // JSON of new values
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  sessionId: text("session_id"),
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Offline Jobs table for sync when network returns
export const offlineJobs = pgTable("offline_jobs", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  jobId: integer("job_id"),
  jobData: text("job_data").notNull(), // JSON string of job completion data
  syncType: text("sync_type").notNull(), // 'job_complete', 'fuel_entry', 'checklist', etc.
  createdAt: timestamp("created_at").defaultNow(),
  syncedAt: timestamp("synced_at"), // null until successfully synced
  syncAttempts: integer("sync_attempts").default(0),
});

// Vehicle Daily Assignments table for tracking driver-vehicle assignments
export const vehicleDailyAssignments = pgTable("vehicle_daily_assignments", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  assignmentDate: timestamp("assignment_date").notNull(),
  startingOdometer: decimal("starting_odometer", { precision: 10, scale: 2 }).notNull(),
  endingOdometer: decimal("ending_odometer", { precision: 10, scale: 2 }),
  motivationalMessage: text("motivational_message"), // Daily motivational message shown
  isActive: boolean("is_active").default(true), // Current active assignment
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System Alerts table for dispatcher notifications
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // maintenance_due, vehicle_inspection, driver_break_exceeded, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  entityType: text("entity_type"), // driver, vehicle, job, maintenance
  entityId: integer("entity_id"), // ID of the related entity
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  resolvedBy: integer("resolved_by"), // User ID who resolved
  resolvedAt: timestamp("resolved_at"),
  expiresAt: timestamp("expires_at"), // Auto-expire for temporary alerts
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  jobNumber: true,
  trackingToken: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Coerce numeric fields from strings
  driverId: z.coerce.number().optional(),
  vehicleId: z.coerce.number().optional(),
  packageCount: z.coerce.number().default(1),
  timeAtStop: z.coerce.number().default(5),
  // Coerce date fields from strings
  scheduledDate: z.coerce.date(),
  scheduledTime: z.coerce.date().optional(),
});

export const insertRouteSchema = createInsertSchema(routes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFuelEntrySchema = createInsertSchema(fuelEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDriverShiftSchema = createInsertSchema(driverShifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAlertSchema = createInsertSchema(alerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRegionalPricingSchema = createInsertSchema(regionalPricing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripDataSchema = createInsertSchema(tripData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFleetReportSchema = createInsertSchema(fleetReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryMetricSchema = createInsertSchema(deliveryMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertCostAnalysisSchema = createInsertSchema(costAnalysis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientAccountSchema = createInsertSchema(clientAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOptimizationRulesSchema = createInsertSchema(optimizationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostCentreDocumentSchema = createInsertSchema(costCentreDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCostCentreEntrySchema = createInsertSchema(costCentreEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerNotificationSchema = createInsertSchema(customerNotifications).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleDailyAssignmentSchema = createInsertSchema(vehicleDailyAssignments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Government Schema Types
export const insertDepartmentSchema = createInsertSchema(departments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleBookingSchema = createInsertSchema(vehicleBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripLogSchema = createInsertSchema(tripLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVehicleAvailabilitySchema = createInsertSchema(vehicleAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGovernmentPolicySchema = createInsertSchema(governmentPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuditTrailSchema = createInsertSchema(auditTrail).omit({
  id: true,
  createdAt: true,
});

// Government Type Exports
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type VehicleBooking = typeof vehicleBookings.$inferSelect;
export type InsertVehicleBooking = z.infer<typeof insertVehicleBookingSchema>;

export type TripLog = typeof tripLogs.$inferSelect;
export type InsertTripLog = z.infer<typeof insertTripLogSchema>;

export type VehicleAvailability = typeof vehicleAvailability.$inferSelect;
export type InsertVehicleAvailability = z.infer<typeof insertVehicleAvailabilitySchema>;

export type GovernmentPolicy = typeof governmentPolicies.$inferSelect;
export type InsertGovernmentPolicy = z.infer<typeof insertGovernmentPolicySchema>;

export type AuditTrail = typeof auditTrail.$inferSelect;
export type InsertAuditTrail = z.infer<typeof insertAuditTrailSchema>;

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({
  id: true,
  createdAt: true,
});

// Geofences table for Business tier
export const geofences = pgTable("geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // customer_address, custom_zone, depot, restricted_area
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: integer("radius").notNull(), // in meters
  isActive: boolean("is_active").default(true),
  alertOnEntry: boolean("alert_on_entry").default(true),
  alertOnExit: boolean("alert_on_exit").default(false),
  alertOnDwell: boolean("alert_on_dwell").default(false),
  dwellTimeMinutes: integer("dwell_time_minutes").default(5),
  customerId: integer("customer_id").references(() => customers.id),
  jobId: integer("job_id").references(() => jobs.id),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Geofence events tracking
export const geofenceEvents = pgTable("geofence_events", {
  id: serial("id").primaryKey(),
  geofenceId: integer("geofence_id").references(() => geofences.id),
  driverId: integer("driver_id").references(() => drivers.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  jobId: integer("job_id").references(() => jobs.id),
  eventType: text("event_type").notNull(), // entry, exit, dwell
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  eventTime: timestamp("event_time").defaultNow(),
  alertSent: boolean("alert_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGeofenceSchema = createInsertSchema(geofences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeofenceEventSchema = createInsertSchema(geofenceEvents).omit({
  id: true,
  createdAt: true,
});

// Driver-Geofence assignments for auto-assignment
export const driverGeofenceAssignments = pgTable("driver_geofence_assignments", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull().references(() => drivers.id),
  geofenceId: integer("geofence_id").notNull().references(() => geofences.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  maxConcurrentJobs: integer("max_concurrent_jobs").default(10),
  workingHours: jsonb("working_hours"), // { "monday": { "start": "08:00", "end": "17:00" }, ... }
});

// Auto-assignment rules and logs
export const autoAssignmentLogs = pgTable("auto_assignment_logs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  driverId: integer("driver_id").references(() => drivers.id),
  geofenceId: integer("geofence_id").references(() => geofences.id),
  assignmentMethod: text("assignment_method").notNull(), // auto_geofence, manual, fallback
  assignedAt: timestamp("assigned_at").defaultNow(),
  deliveryAddress: text("delivery_address").notNull(),
  coordinates: jsonb("coordinates"), // { lat, lng }
  status: text("status").default("assigned"), // assigned, completed, failed, reassigned
});

export const insertOfflineJobSchema = createInsertSchema(offlineJobs).omit({
  id: true,
  createdAt: true,
  syncedAt: true,
});

// System settings for configurable options
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  settingType: text("setting_type").notNull(), // number, boolean, string, json
  defaultValue: text("default_value"),
  isEditable: boolean("is_editable").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertJobReassignmentHistory = z.infer<typeof insertJobReassignmentHistorySchema>;
export type JobReassignmentHistory = typeof jobReassignmentHistory.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

export type InsertFuelEntry = z.infer<typeof insertFuelEntrySchema>;
export type FuelEntry = typeof fuelEntries.$inferSelect;

export type InsertDriverShift = z.infer<typeof insertDriverShiftSchema>;
export type DriverShift = typeof driverShifts.$inferSelect;

export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;

export type InsertRegionalPricing = z.infer<typeof insertRegionalPricingSchema>;
export type RegionalPricing = typeof regionalPricing.$inferSelect;

export type InsertTripData = z.infer<typeof insertTripDataSchema>;
export type TripData = typeof tripData.$inferSelect;

export type InsertFleetReport = z.infer<typeof insertFleetReportSchema>;
export type FleetReport = typeof fleetReports.$inferSelect;

export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;

export type InsertDeliveryMetric = z.infer<typeof insertDeliveryMetricSchema>;
export type DeliveryMetric = typeof deliveryMetrics.$inferSelect;

export type InsertCostAnalysis = z.infer<typeof insertCostAnalysisSchema>;
export type CostAnalysis = typeof costAnalysis.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertClientAccount = z.infer<typeof insertClientAccountSchema>;
export type ClientAccount = typeof clientAccounts.$inferSelect;

export type InsertOptimizationRules = z.infer<typeof insertOptimizationRulesSchema>;
export type OptimizationRules = typeof optimizationRules.$inferSelect;

export type InsertCostCentreDocument = z.infer<typeof insertCostCentreDocumentSchema>;
export type CostCentreDocument = typeof costCentreDocuments.$inferSelect;

export type InsertCostCentreEntry = z.infer<typeof insertCostCentreEntrySchema>;
export type CostCentreEntry = typeof costCentreEntries.$inferSelect;

export type InsertCustomerNotification = z.infer<typeof insertCustomerNotificationSchema>;
export type CustomerNotification = typeof customerNotifications.$inferSelect;

export type InsertGeofence = z.infer<typeof insertGeofenceSchema>;
export type Geofence = typeof geofences.$inferSelect;

export type InsertGeofenceEvent = z.infer<typeof insertGeofenceEventSchema>;
export type GeofenceEvent = typeof geofenceEvents.$inferSelect;

export type InsertOfflineJob = z.infer<typeof insertOfflineJobSchema>;
export type OfflineJob = typeof offlineJobs.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Government Geofences for pickup/dropoff monitoring
export const governmentGeofences = pgTable("government_geofences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "City Hall Pickup", "Hospital Dropoff", etc.
  facilityType: text("facility_type").notNull(), // pickup_point, dropoff_point, government_facility, restricted_zone
  departmentId: integer("department_id").references(() => departments.id),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  radius: integer("radius").notNull().default(50), // meters
  
  // Alert settings
  alertOnEntry: boolean("alert_on_entry").default(true),
  alertOnExit: boolean("alert_on_exit").default(true),
  alertOnDwell: boolean("alert_on_dwell").default(false),
  dwellTimeMinutes: integer("dwell_time_minutes").default(10),
  
  // Operating hours
  operatingHours: text("operating_hours"), // JSON: {"monday": "08:00-17:00", ...}
  isActive: boolean("is_active").default(true),
  description: text("description"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Government Geofence Events for vehicle tracking
export const governmentGeofenceEvents = pgTable("government_geofence_events", {
  id: serial("id").primaryKey(),
  geofenceId: integer("geofence_id").references(() => governmentGeofences.id),
  bookingId: integer("booking_id").references(() => vehicleBookings.id),
  staffId: integer("staff_id").references(() => staff.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  
  eventType: text("event_type").notNull(), // entry, exit, dwell_start, dwell_end
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  eventTime: timestamp("event_time").defaultNow(),
  dwellDuration: integer("dwell_duration"), // minutes
  
  // Automated alerts sent
  dispatcherAlertSent: boolean("dispatcher_alert_sent").default(false),
  supervisorAlertSent: boolean("supervisor_alert_sent").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Real-time Dispatcher Alerts for government fleet
export const governmentDispatcherAlerts = pgTable("government_dispatcher_alerts", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").references(() => vehicleBookings.id),
  geofenceEventId: integer("geofence_event_id").references(() => governmentGeofenceEvents.id),
  staffId: integer("staff_id").references(() => staff.id),
  vehicleId: integer("vehicle_id").references(() => vehicles.id),
  
  alertType: text("alert_type").notNull(), // pickup_arrival, pickup_departure, dropoff_arrival, dropoff_complete, unauthorized_zone, extended_dwell
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  
  // Status tracking
  isRead: boolean("is_read").default(false),
  isResolved: boolean("is_resolved").default(false),
  readBy: integer("read_by"), // Staff ID
  readAt: timestamp("read_at"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  
  // Auto-expire for time-sensitive alerts
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGovernmentGeofenceSchema = createInsertSchema(governmentGeofences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGovernmentGeofenceEventSchema = createInsertSchema(governmentGeofenceEvents).omit({
  id: true,
  createdAt: true,
});

export const insertGovernmentDispatcherAlertSchema = createInsertSchema(governmentDispatcherAlerts).omit({
  id: true,
  createdAt: true,
});

export type GovernmentGeofence = typeof governmentGeofences.$inferSelect;
export type InsertGovernmentGeofence = z.infer<typeof insertGovernmentGeofenceSchema>;

export type GovernmentGeofenceEvent = typeof governmentGeofenceEvents.$inferSelect;
export type InsertGovernmentGeofenceEvent = z.infer<typeof insertGovernmentGeofenceEventSchema>;

export type GovernmentDispatcherAlert = typeof governmentDispatcherAlerts.$inferSelect;
export type InsertGovernmentDispatcherAlert = z.infer<typeof insertGovernmentDispatcherAlertSchema>;

// Enterprise feature insert schemas and types
export const insertHubSchema = createInsertSchema(hubs).omit({
  id: true,
  createdAt: true,
});

export const insertHubScanSchema = createInsertSchema(hubScans).omit({
  id: true,
  createdAt: true,
});

export const insertInterhubManifestSchema = createInsertSchema(interhubManifests).omit({
  id: true,
  createdAt: true,
});

export const insertManifestItemSchema = createInsertSchema(manifestItems).omit({
  id: true,
});

export const insertExceptionSchema = createInsertSchema(exceptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebhookEndpointSchema = createInsertSchema(webhookEndpoints).omit({
  id: true,
  createdAt: true,
});

export const insertWebhookLogSchema = createInsertSchema(webhookLogs).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryZoneSchema = createInsertSchema(deliveryZones).omit({
  id: true,
  createdAt: true,
});

export const insertAddressGeocodingSchema = createInsertSchema(addressGeocoding).omit({
  id: true,
  createdAt: true,
});

export const insertCarrierSchema = createInsertSchema(carriers).omit({
  id: true,
  createdAt: true,
});

export const insertCarrierRateSchema = createInsertSchema(carrierRates).omit({
  id: true,
  createdAt: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});

export const insertApiUsageSchema = createInsertSchema(apiUsage).omit({
  id: true,
});

// Enterprise feature types
export type Hub = typeof hubs.$inferSelect;
export type InsertHub = z.infer<typeof insertHubSchema>;

export type HubScan = typeof hubScans.$inferSelect;
export type InsertHubScan = z.infer<typeof insertHubScanSchema>;

export type InterhubManifest = typeof interhubManifests.$inferSelect;
export type InsertInterhubManifest = z.infer<typeof insertInterhubManifestSchema>;

export type ManifestItem = typeof manifestItems.$inferSelect;
export type InsertManifestItem = z.infer<typeof insertManifestItemSchema>;

export type Exception = typeof exceptions.$inferSelect;
export type InsertException = z.infer<typeof insertExceptionSchema>;

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type InsertWebhookEndpoint = z.infer<typeof insertWebhookEndpointSchema>;

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type InsertWebhookLog = z.infer<typeof insertWebhookLogSchema>;

export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type InsertDeliveryZone = z.infer<typeof insertDeliveryZoneSchema>;

export type AddressGeocoding = typeof addressGeocoding.$inferSelect;
export type InsertAddressGeocoding = z.infer<typeof insertAddressGeocodingSchema>;

export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = z.infer<typeof insertCarrierSchema>;

export type CarrierRate = typeof carrierRates.$inferSelect;
export type InsertCarrierRate = z.infer<typeof insertCarrierRateSchema>;

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export type ApiUsage = typeof apiUsage.$inferSelect;
export type InsertApiUsage = z.infer<typeof insertApiUsageSchema>;

export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

// ===== MOOVLY GO SCHEMAS =====
// Moovly Go user types - individual drivers and teams
export const moovlyGoUsers = pgTable("moovly_go_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // "individual", "team_admin", "team_driver"
  subscriptionPlan: text("subscription_plan").notNull().default("free"), // "free", "individual", "team_starter", "business", "enterprise"
  subscriptionStatus: text("subscription_status").default("active"), // "active", "inactive", "suspended"
  teamId: integer("team_id"), // null for individual drivers
  isVerified: boolean("is_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const moovlyGoTeams = pgTable("moovly_go_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  adminUserId: integer("admin_user_id").notNull(),
  subscriptionPlan: text("subscription_plan").notNull().default("team_starter"),
  maxDrivers: integer("max_drivers").default(3),
  currentDriverCount: integer("current_driver_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Moovly Go stops - core entity for route optimization
export const moovlyGoStops = pgTable("moovly_go_stops", {
  id: text("id").primaryKey(), // UUID
  routePlanId: text("route_plan_id").notNull(),
  packageId: text("package_id"), // Barcode or tracking number
  addressRaw: text("address_raw"), // OCR/typed/voice text
  addressNorm: text("address_norm"), // normalized address
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  serviceMinutes: integer("service_minutes").default(5), // Time at stop
  timeWindowStart: text("time_window_start"), // ISO time string
  timeWindowEnd: text("time_window_end"), // ISO time string
  loadIndex: integer("load_index").notNull(), // Scan order (1..N)
  notes: text("notes"), // Text or voice transcript
  photoUris: text("photo_uris").array(), // Proof of delivery photos
  status: text("status").notNull().default("pending"), // pending, enroute, delivered, failed
  geocodingProvider: text("geocoding_provider"), // "osm", "google", "manual"
  geocodingConfidence: decimal("geocoding_confidence", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Moovly Go route plans
export const moovlyGoRoutePlans = pgTable("moovly_go_route_plans", {
  id: text("id").primaryKey(), // UUID
  driverId: integer("driver_id").notNull(), // References moovlyGoUsers
  date: text("date").notNull(), // YYYY-MM-DD
  optimizationMode: text("optimization_mode").notNull().default("balanced"), // strictLIFO, balanced, fastest
  status: text("status").notNull().default("planning"), // planning, optimized, in_progress, completed
  // Baseline metrics (by scan order)
  baselineDistanceKm: decimal("baseline_distance_km", { precision: 8, scale: 2 }),
  baselineDurationMin: integer("baseline_duration_min"),
  // Optimized metrics (by solver)
  optimizedDistanceKm: decimal("optimized_distance_km", { precision: 8, scale: 2 }),
  optimizedDurationMin: integer("optimized_duration_min"),
  // Savings
  savingsKm: decimal("savings_km", { precision: 8, scale: 2 }),
  savingsMin: integer("savings_min"),
  // Origin point
  originLatitude: decimal("origin_latitude", { precision: 10, scale: 7 }),
  originLongitude: decimal("origin_longitude", { precision: 10, scale: 7 }),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Address book for frequent destinations
export const moovlyGoAddressBook = pgTable("moovly_go_address_book", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  alias: text("alias").notNull(), // "Home", "Warehouse", "McDonald's Sandton"
  addressNorm: text("address_norm").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  useCount: integer("use_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Earnings tracking for individual drivers
export const moovlyGoEarnings = pgTable("moovly_go_earnings", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  routePlanId: text("route_plan_id"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  fuelCost: decimal("fuel_cost", { precision: 10, scale: 2 }).default("0"),
  stops: integer("stops").default(0),
  distanceKm: decimal("distance_km", { precision: 8, scale: 2 }).default("0"),
  timeMin: integer("time_min").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gamification - driver achievements and badges
export const moovlyGoAchievements = pgTable("moovly_go_achievements", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  type: text("type").notNull(), // "km_saved", "time_saved", "efficiency_streak", "early_finisher"
  title: text("title").notNull(),
  description: text("description").notNull(),
  value: integer("value"), // Numeric value for the achievement
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Moovly Go insert schemas
export const insertMoovlyGoUserSchema = createInsertSchema(moovlyGoUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoovlyGoTeamSchema = createInsertSchema(moovlyGoTeams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMoovlyGoStopSchema = createInsertSchema(moovlyGoStops).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertMoovlyGoRoutePlanSchema = createInsertSchema(moovlyGoRoutePlans).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertMoovlyGoAddressBookSchema = createInsertSchema(moovlyGoAddressBook).omit({
  id: true,
  createdAt: true,
});

export const insertMoovlyGoEarningsSchema = createInsertSchema(moovlyGoEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertMoovlyGoAchievementSchema = createInsertSchema(moovlyGoAchievements).omit({
  id: true,
});

// Moovly Go types
export type MoovlyGoUser = typeof moovlyGoUsers.$inferSelect;
export type InsertMoovlyGoUser = z.infer<typeof insertMoovlyGoUserSchema>;
export type MoovlyGoTeam = typeof moovlyGoTeams.$inferSelect;
export type InsertMoovlyGoTeam = z.infer<typeof insertMoovlyGoTeamSchema>;
export type MoovlyGoStop = typeof moovlyGoStops.$inferSelect;
export type InsertMoovlyGoStop = z.infer<typeof insertMoovlyGoStopSchema>;
export type MoovlyGoRoutePlan = typeof moovlyGoRoutePlans.$inferSelect;
export type InsertMoovlyGoRoutePlan = z.infer<typeof insertMoovlyGoRoutePlanSchema>;
export type MoovlyGoAddressBook = typeof moovlyGoAddressBook.$inferSelect;
export type InsertMoovlyGoAddressBook = z.infer<typeof insertMoovlyGoAddressBookSchema>;
export type MoovlyGoEarnings = typeof moovlyGoEarnings.$inferSelect;
export type InsertMoovlyGoEarnings = z.infer<typeof insertMoovlyGoEarningsSchema>;

// ===== CUSTOMER PORTAL TABLES =====

// Customer Portal Users - separate from main fleet users
export const customerPortalUsers = pgTable("customer_portal_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  company: text("company"),
  isVerified: boolean("is_verified").default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpiresAt: timestamp("reset_password_expires_at"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer Orders - integrates with existing jobs system
export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  customerUserId: integer("customer_user_id").references(() => customerPortalUsers.id).notNull(),
  jobId: integer("job_id").references(() => jobs.id), // Links to main job system
  orderNumber: text("order_number").notNull().unique(),
  
  // Order details
  pickupName: text("pickup_name").notNull(),
  pickupPhone: text("pickup_phone").notNull(),
  pickupEmail: text("pickup_email"),
  pickupAddress: text("pickup_address").notNull(),
  pickupInstructions: text("pickup_instructions"),
  
  deliveryName: text("delivery_name").notNull(),
  deliveryPhone: text("delivery_phone").notNull(),
  deliveryEmail: text("delivery_email"),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryInstructions: text("delivery_instructions"),
  
  // Scheduling
  preferredPickupTime: timestamp("preferred_pickup_time"),
  preferredDeliveryTime: timestamp("preferred_delivery_time"),
  isAsapDelivery: boolean("is_asap_delivery").default(true),
  
  // Package details
  packageDescription: text("package_description").notNull(),
  packageWeight: text("package_weight"),
  packageDimensions: text("package_dimensions"),
  packageValue: decimal("package_value", { precision: 10, scale: 2 }),
  specialInstructions: text("special_instructions"),
  
  // Pricing
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  finalCost: decimal("final_cost", { precision: 10, scale: 2 }),
  currency: text("currency").default("ZAR"),
  
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, confirmed, assigned, picked_up, in_transit, delivered, cancelled
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualPickupTime: timestamp("actual_pickup_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  
  // Driver assignment
  assignedDriverId: integer("assigned_driver_id").references(() => drivers.id),
  driverNotes: text("driver_notes"),
  
  // Tracking
  trackingNumber: text("tracking_number").unique(),
  proofOfDelivery: text("proof_of_delivery"), // Image URL or signature
  customerRating: integer("customer_rating"), // 1-5 stars
  customerFeedback: text("customer_feedback"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customer order status updates for timeline tracking
export const customerOrderUpdates = pgTable("customer_order_updates", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => customerOrders.id).notNull(),
  status: text("status").notNull(),
  message: text("message"),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  updatedBy: text("updated_by"), // system, driver, dispatcher
  timestamp: timestamp("timestamp").defaultNow(),
});

// Customer-Dispatcher messaging system
export const customerMessages = pgTable("customer_messages", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => customerOrders.id),
  customerUserId: integer("customer_user_id").references(() => customerPortalUsers.id),
  senderType: text("sender_type").notNull(), // customer, dispatcher, system
  senderName: text("sender_name").notNull(),
  message: text("message").notNull(),
  attachments: jsonb("attachments"), // Array of file URLs
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer Portal Schema Types and Insert Schemas
export const insertCustomerPortalUserSchema = createInsertSchema(customerPortalUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerOrderSchema = createInsertSchema(customerOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerOrderUpdateSchema = createInsertSchema(customerOrderUpdates).omit({
  id: true,
  timestamp: true,
});

export const insertCustomerMessageSchema = createInsertSchema(customerMessages).omit({
  id: true,
  createdAt: true,
});

export type CustomerPortalUser = typeof customerPortalUsers.$inferSelect;
export type InsertCustomerPortalUser = z.infer<typeof insertCustomerPortalUserSchema>;

export type CustomerOrder = typeof customerOrders.$inferSelect;
export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;

export type CustomerOrderUpdate = typeof customerOrderUpdates.$inferSelect;
export type InsertCustomerOrderUpdate = z.infer<typeof insertCustomerOrderUpdateSchema>;

export type CustomerMessage = typeof customerMessages.$inferSelect;
export type InsertCustomerMessage = z.infer<typeof insertCustomerMessageSchema>;
export type MoovlyGoAchievement = typeof moovlyGoAchievements.$inferSelect;
export type InsertMoovlyGoAchievement = z.infer<typeof insertMoovlyGoAchievementSchema>;

// Driver-Geofence assignment types
export type DriverGeofenceAssignment = typeof driverGeofenceAssignments.$inferSelect;
export type InsertDriverGeofenceAssignment = typeof driverGeofenceAssignments.$inferInsert;
export type AutoAssignmentLog = typeof autoAssignmentLogs.$inferSelect;
export type InsertAutoAssignmentLog = typeof autoAssignmentLogs.$inferInsert;

// Driver-Geofence assignment schemas
export const insertDriverGeofenceAssignmentSchema = createInsertSchema(driverGeofenceAssignments).omit({
  id: true,
  assignedAt: true,
});
export const insertAutoAssignmentLogSchema = createInsertSchema(autoAssignmentLogs).omit({
  id: true,
  assignedAt: true,
});




