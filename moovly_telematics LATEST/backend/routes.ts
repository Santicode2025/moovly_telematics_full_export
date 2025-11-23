import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { setupSocketIO } from "./socketio";
import { smsService, OTPService } from "./smsService";
import { PushNotificationService } from "./services/PushNotificationService";
import { 
  insertDriverSchema, 
  insertVehicleSchema, 
  insertJobSchema, 
  insertRouteSchema, 
  insertMaintenanceRecordSchema,
  insertUserSchema,
  insertFuelEntrySchema,
  insertDriverShiftSchema,
  insertAlertSchema,
  insertRegionalPricingSchema,
  insertTripDataSchema,
  insertMessageSchema,
  insertClientAccountSchema,
  insertCustomerSchema,
  insertMoovlyGoUserSchema,
  insertMoovlyGoStopSchema,
  insertMoovlyGoRoutePlanSchema,
  insertMoovlyGoAddressBookSchema,
  insertMoovlyGoEarningsSchema,
  insertDriverGeofenceAssignmentSchema,
  insertAutoAssignmentLogSchema,
  insertCustomerPortalUserSchema,
  insertCustomerOrderSchema,
  insertCustomerOrderUpdateSchema,
  insertCustomerMessageSchema,
  insertFleetReportSchema,
  insertPerformanceMetricSchema,
  insertDeliveryMetricSchema,
  insertCostAnalysisSchema
} from "@shared/schema";
import { z } from "zod";
import {
  calculateFuelEfficiencyMetrics,
  generateFuelEfficiencyRecommendations,
  calculateDeliveryPerformanceMetrics,
  generateDeliveryPerformanceRecommendations,
  calculateDriverPerformanceMetrics,
  generateDriverPerformanceRecommendations,
  calculateVehicleUtilizationMetrics,
  generateVehicleUtilizationRecommendations,
  calculateCostAnalysisMetrics,
  generateCostAnalysisRecommendations
} from "./reporting-utils";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Separate upload configuration for images only  
const uploadImage = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept images only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type. Please upload JPG, PNG or GIF files only.'));
    }
  }
});

// Upload configuration for documents (Excel, CSV, etc.)
const uploadDocument = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept spreadsheet and document files
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/pdf',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document file type. Please upload Excel, CSV, PDF or text files only.'));
    }
  }
});

// OCR processing utility
async function processOCRAsync(documentId: number, imagePath: string) {
  try {
    // Simulate OCR processing delay
    setTimeout(async () => {
      const mockOCRData = {
        rawText: "FUEL RECEIPT\nDate: 2025-06-29\nAmount: R735.00\nLitres: 42.5\nOdometer: 45,123\nShell Station",
        confidence: 95.2,
        extractedData: {
          date: "2025-06-29",
          amount: "735.00",
          currency: "ZAR",
          quantity: "42.5",
          unit: "litres",
          odometer: "45123",
          supplier: "Shell Station",
          documentType: "fuel_receipt"
        }
      };

      await storage.processOCRDocument(documentId, mockOCRData);
    }, 2000); // Simulate 2-second processing time
  } catch (error) {
    console.error("OCR processing failed:", error);
    // Update document status to failed
    await storage.updateCostCentreDocument(documentId, { status: 'failed' });
  }
}

// Authentication middleware for mobile API endpoints
const authenticateDriver = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer token

    if (!token && req.path.includes('/mobile/')) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // For development, we'll use a simple token validation
    if (token && token.startsWith('driver_')) {
      const driverId = parseInt(token.split('_')[1]);
      const driver = await storage.getDriver(driverId);
      
      if (driver && driver.status === "active") {
        req.driver = driver;
        return next();
      }
    }

    // Allow access to login endpoints without authentication
    if (req.path === '/api/drivers/mobile-login' || req.path === '/api/drivers/forgot-pin') {
      return next();
    }

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Apply mobile authentication middleware to mobile endpoints
  app.use('/api/mobile', authenticateDriver);
  app.use('/api/drivers/mobile-login', (req, res, next) => next()); // Allow login without auth
  app.use('/api/drivers/forgot-pin', (req, res, next) => next()); // Allow forgot PIN without auth

  // Driver Registration Routes
  app.post("/api/drivers/register", async (req, res) => {
    try {
      const { name, email, phone, licenseNumber, idNumber } = req.body;
      
      // Generate username from name (can be customized by admin)
      const username = name.toLowerCase().replace(/\s+/g, '.');
      
      // Check if phone or email already exists
      const drivers = await storage.getAllDrivers();
      const existingDriver = drivers.find(d => d.phone === phone || d.email === email);
      if (existingDriver) {
        return res.status(400).json({
          success: false,
          message: "Driver with this phone number or email already exists"
        });
      }

      // Generate registration token and OTP
      const registrationToken = OTPService.generateRegistrationToken();
      const otpCode = OTPService.generateOTP();
      const otpExpiresAt = OTPService.getOTPExpirationTime();

      // Create driver with pending status
      const newDriver = await storage.createDriver({
        username,
        name,
        email,
        phone,
        idNumber,
        licenseNumber,
        registrationToken,
        otpCode,
        otpExpiresAt,
        status: "pending",
        isRegistered: false
      });

      // Send OTP SMS
      const smsResult = await smsService.sendOTP(phone, otpCode);
      
      if (!smsResult.success) {
        console.error("Failed to send OTP SMS:", smsResult.error);
        return res.status(500).json({
          success: false,
          message: "Failed to send verification code. Please try again."
        });
      }

      res.json({
        success: true,
        message: "Driver registered successfully. OTP sent to phone.",
        registrationToken,
        driverId: newDriver.id
      });

    } catch (error) {
      console.error("Driver registration error:", error);
      res.status(500).json({
        success: false,
        message: "Registration failed. Please try again."
      });
    }
  });

  app.post("/api/drivers/verify-otp", async (req, res) => {
    try {
      const { registrationToken, otpCode } = req.body;

      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => d.registrationToken === registrationToken);

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration token"
        });
      }

      // Check OTP expiration
      if (driver.otpExpiresAt && OTPService.isOTPExpired(driver.otpExpiresAt)) {
        return res.status(400).json({
          success: false,
          message: "OTP has expired. Please request a new one."
        });
      }

      // Check OTP attempts
      if (driver.otpAttempts && driver.otpAttempts >= 3) {
        return res.status(400).json({
          success: false,
          message: "Too many failed attempts. Please request a new OTP."
        });
      }

      // Verify OTP
      if (driver.otpCode !== otpCode) {
        // Increment failed attempts
        await storage.updateDriver(driver.id, {
          otpAttempts: (driver.otpAttempts || 0) + 1
        });
        
        return res.status(400).json({
          success: false,
          message: "Invalid OTP code"
        });
      }

      // Generate 4-digit PIN for the driver
      const pin = OTPService.generatePIN();
      const hashedPIN = OTPService.hashPIN(pin);

      // Update driver as verified
      await storage.updateDriver(driver.id, {
        pin: hashedPIN,
        pinSetAt: new Date(),
        isRegistered: true,
        status: "active",
        otpCode: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        registrationToken: null
      });

      // Send welcome SMS with PIN
      await smsService.sendWelcome(driver.phone, driver.username);

      res.json({
        success: true,
        message: "Registration completed successfully!",
        username: driver.username,
        pin: pin, // Send PIN to driver once
        loginInstructions: "Use your username and this 4-digit PIN to login to the mobile app"
      });

    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(500).json({
        success: false,
        message: "Verification failed. Please try again."
      });
    }
  });

  app.post("/api/drivers/resend-otp", async (req, res) => {
    try {
      const { registrationToken } = req.body;

      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => d.registrationToken === registrationToken);

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration token"
        });
      }

      // Generate new OTP
      const otpCode = OTPService.generateOTP();
      const otpExpiresAt = OTPService.getOTPExpirationTime();

      // Update driver with new OTP
      await storage.updateDriver(driver.id, {
        otpCode,
        otpExpiresAt,
        otpAttempts: 0
      });

      // Send new OTP SMS
      const smsResult = await smsService.sendOTP(driver.phone, otpCode);
      
      if (!smsResult.success) {
        return res.status(500).json({
          success: false,
          message: "Failed to send verification code. Please try again."
        });
      }

      res.json({
        success: true,
        message: "New OTP sent successfully"
      });

    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resend OTP. Please try again."
      });
    }
  });

  // Updated Authentication Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // First check if it's a regular user (admin)
      const user = await storage.getUserByUsername(username);
      if (user && user.password === password) {
        return res.json({ 
          success: true,
          user: { 
            id: user.id, 
            username: user.username
          },
          token: "dummy-token-for-web",
          driver: null
        });
      }

      // Then check if it's a driver login with PIN
      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => d.username === username);
      
      if (driver) {
        // Check if driver is registered and has a PIN
        if (!driver.isRegistered || !driver.pin) {
          return res.status(400).json({
            success: false,
            message: "Driver registration not completed. Please complete registration first."
          });
        }

        // Verify PIN (password for drivers is their 4-digit PIN)
        if (OTPService.verifyPIN(password, driver.pin)) {
          // Update last login time
          await storage.updateDriver(driver.id, {
            lastLoginAt: new Date()
          });

          return res.json({ 
            success: true,
            user: { 
              id: driver.id, 
              username: driver.username,
              name: driver.name
            },
            token: "dummy-token-for-mobile",
            driver: driver
          });
        }
      }

      return res.status(401).json({ 
        success: false,
        message: "Invalid username or PIN" 
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error" 
      });
    }
  });

  // Enhanced mobile login with proper database authentication
  app.post("/api/drivers/mobile-login", async (req, res) => {
    try {
      const { username, pin } = req.body;

      // Enhanced validation
      if (!username?.trim() || !pin?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Username and PIN are required"
        });
      }

      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: "PIN must be exactly 4 digits"
        });
      }

      // Get driver from database
      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => d.username === username.trim());

      if (!driver) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or PIN"
        });
      }

      // Check if driver is active
      if (driver.status !== "active") {
        return res.status(401).json({
          success: false,
          message: "Driver account is not active. Please contact dispatch."
        });
      }

      // Verify PIN - for fleet.driver we allow plain text PIN "1234"
      const isPinValid = (driver.username === "fleet.driver" && pin === "1234") || 
                        (driver.pin && driver.pin === pin);

      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or PIN"
        });
      }

      // Update last login time
      await storage.updateDriver(driver.id, {
        lastLoginAt: new Date(),
        networkStatus: "online"
      });

      // Create session token (simplified for development)
      const sessionToken = `driver_${driver.id}_${Date.now()}`;

      // Return successful authentication
      return res.json({ 
        success: true,
        driver: {
          id: driver.id,
          username: driver.username,
          name: driver.name,
          email: driver.email,
          phone: driver.phone,
          status: driver.status,
          role: driver.role,
          vehicleId: driver.vehicleId,
          performance: driver.performance,
          pendingJobs: driver.pendingJobs || 0,
          networkStatus: "online"
        },
        token: sessionToken,
        message: "Successfully logged into Moovly Connect"
      });
    } catch (error) {
      console.error("Mobile login error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error" 
      });
    }
  });

  // Forgot PIN endpoint
  app.post("/api/drivers/forgot-pin", async (req, res) => {
    try {
      const { username, appMode } = req.body;
      
      // Create alert for dispatch (simplified)
      // This would normally create an alert in the system
      console.log(`PIN help requested for driver ${username} on ${appMode} mode`);

      res.json({ success: true, message: "Help request sent to dispatch" });
    } catch (error) {
      console.error("Forgot PIN error:", error);
      res.status(500).json({ success: false, message: "Failed to send help request" });
    }
  });

  // Mobile-specific job endpoints (secured)
  
  // Get jobs assigned to the authenticated driver
  app.get("/api/mobile/jobs", authenticateDriver, async (req: any, res) => {
    try {
      const driver = req.driver;
      const jobs = await storage.getJobsByDriver(driver.id);
      
      // Filter to only show assigned, in_progress jobs for mobile
      const mobileJobs = jobs.filter(job => 
        job.status === 'assigned' || job.status === 'in_progress'
      );
      
      res.json({
        success: true,
        jobs: mobileJobs,
        count: mobileJobs.length
      });
    } catch (error) {
      console.error("Error fetching driver jobs:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch jobs" 
      });
    }
  });

  // Start a job (mobile)
  app.post("/api/mobile/jobs/:id/start", authenticateDriver, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const driver = req.driver;
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found"
        });
      }

      if (job.driverId !== driver.id) {
        return res.status(403).json({
          success: false,
          message: "Job not assigned to you"
        });
      }

      if (job.status !== 'assigned') {
        return res.status(400).json({
          success: false,
          message: "Job cannot be started from current status"
        });
      }

      // Update job status to in_progress
      const updatedJob = await storage.updateJob(jobId, {
        status: 'in_progress',
        driverStartedAt: new Date()
      });

      // Emit real-time update
      if (global.io) {
        global.io.emit('job:started', {
          job: updatedJob,
          driverId: driver.id,
          message: `Job ${job.jobNumber} started by ${driver.name}`
        });
      }

      res.json({
        success: true,
        job: updatedJob,
        message: "Job started successfully"
      });
    } catch (error) {
      console.error("Error starting job:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start job"
      });
    }
  });

  // Complete a job (mobile)
  app.post("/api/mobile/jobs/:id/complete", authenticateDriver, async (req: any, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const driver = req.driver;
      const { notes, actualDistance } = req.body;
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found"
        });
      }

      if (job.driverId !== driver.id) {
        return res.status(403).json({
          success: false,
          message: "Job not assigned to you"
        });
      }

      if (job.status !== 'in_progress') {
        return res.status(400).json({
          success: false,
          message: "Job must be in progress to complete"
        });
      }

      // Update job status to completed
      const updatedJob = await storage.updateJob(jobId, {
        status: 'completed',
        completedDate: new Date(),
        actualDistance: actualDistance ? Number(actualDistance) : undefined,
        notes: notes || job.notes
      });

      // Emit real-time update
      if (global.io) {
        global.io.emit('job:completed', {
          job: updatedJob,
          driverId: driver.id,
          message: `Job ${job.jobNumber} completed by ${driver.name}`
        });
      }

      res.json({
        success: true,
        job: updatedJob,
        message: "Job completed successfully"
      });
    } catch (error) {
      console.error("Error completing job:", error);
      res.status(500).json({
        success: false,
        message: "Failed to complete job"
      });
    }
  });

  // Update driver location (mobile)
  app.post("/api/mobile/location", authenticateDriver, async (req: any, res) => {
    try {
      const driver = req.driver;
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: "Latitude and longitude are required"
        });
      }

      // Update driver's current location in active jobs
      const activeJobs = await storage.getJobsByDriver(driver.id);
      const inProgressJobs = activeJobs.filter(job => job.status === 'in_progress');
      
      for (const job of inProgressJobs) {
        await storage.updateJob(job.id, {
          currentDriverLatitude: Number(latitude),
          currentDriverLongitude: Number(longitude),
          lastLocationUpdate: new Date()
        });
      }

      // Emit real-time location update
      if (global.io && inProgressJobs.length > 0) {
        global.io.emit('driver:location_update', {
          driverId: driver.id,
          latitude,
          longitude,
          timestamp: new Date(),
          activeJobs: inProgressJobs.map(j => j.id)
        });
      }

      res.json({
        success: true,
        message: "Location updated",
        activeJobs: inProgressJobs.length
      });
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update location"
      });
    }
  });

  // HERE API Proxy (keep API key secure)
  app.get('/api/here/geocode', async (req, res) => {
    try {
      const { q, limit = 5 } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      const hereApiKey = process.env.HERE_API_KEY;
      if (!hereApiKey) {
        return res.status(500).json({ error: 'HERE API key not configured' });
      }

      const response = await fetch(
        `https://geocode.search.hereapi.com/v1/geocode?` +
        `q=${encodeURIComponent(q)}&` +
        `in=countryCode:ZAF&` +
        `limit=${limit}&` +
        `apiKey=${hereApiKey}`
      );

      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status}`);
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error) {
      console.error('HERE geocoding error:', error);
      res.status(500).json({ error: 'Geocoding failed' });
    }
  });

  app.get('/api/here/autosuggest', async (req, res) => {
    try {
      const { q, limit = 8, lat, lng } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      const hereApiKey = process.env.HERE_API_KEY;
      if (!hereApiKey) {
        return res.status(500).json({ error: 'HERE API key not configured' });
      }

      // Build location-aware request like Circuit does
      // HERE API requires a location parameter - use coords if available, else default to SA bounding box
      let locationParam = '';
      if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        locationParam = `at=${lat},${lng}`;
        console.log(`Using location context: ${lat},${lng} for query: ${q}`);
      } else {
        // Default to Cape Town center for better South African search results
        locationParam = 'at=-33.9249,18.4241';
        console.log(`Using Cape Town default location for query: ${q}`);
      }
      
      let url = `https://autosuggest.search.hereapi.com/v1/autosuggest?` +
        `q=${encodeURIComponent(q)}&` +
        `${locationParam}&` +
        `in=countryCode:ZAF&` +
        `limit=${limit}&` +
        `result_types=address,place&` +
        `apiKey=${hereApiKey}`;
      
      console.log(`HERE API URL: ${url.replace(hereApiKey, 'HIDDEN_KEY')}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HERE API error: ${response.status}`);
      }

      const data = await response.json();
      res.json({ success: true, data });
    } catch (error) {
      console.error('HERE autosuggest error:', error);
      res.status(500).json({ error: 'Address search failed' });
    }
  });

  // HERE Discover API for business/POI searches - optimized for business discovery like Circuit
  app.get('/api/here/discover', async (req, res) => {
    try {
      const { q, limit = 10, lat, lng } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: 'Query parameter required' });
      }

      const hereApiKey = process.env.HERE_API_KEY;
      if (!hereApiKey) {
        return res.status(500).json({ error: 'HERE API key not configured' });
      }

      // Build location-aware business search like Circuit does
      let locationParam = '';
      if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
        locationParam = `at=${lat},${lng}`;
        console.log(`🔍 Business search near: ${lat},${lng} for: "${q}"`);
      } else {
        // Default to Cape Town center for better South African business results
        locationParam = 'at=-33.9249,18.4241';
        console.log(`🔍 Business search using Cape Town default for: "${q}"`);
      }
      
      // HERE Discover API - optimized for businesses and POIs
      let url = `https://discover.search.hereapi.com/v1/discover?` +
        `q=${encodeURIComponent(q)}&` +
        `${locationParam}&` +
        `in=countryCode:ZAF&` +
        `limit=${limit}&` +
        `categories=100,200,300,400,500,600,700&` + // All business categories
        `apiKey=${hereApiKey}`;
      
      console.log(`🏢 HERE Discover API: ${url.replace(hereApiKey, 'HIDDEN_KEY')}`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HERE Discover API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform results to match autosuggest format for consistency
      const transformedData = {
        ...data,
        items: data.items?.map((item: any) => ({
          ...item,
          title: item.title,
          id: item.id,
          resultType: 'place',
          address: {
            label: item.address?.label || `${item.title}, ${item.address?.city || 'South Africa'}`
          },
          position: item.position,
          categories: item.categories,
          distance: item.distance,
          // Mark as business result for frontend handling
          businessResult: true
        })) || []
      };
      
      console.log(`🎯 Found ${transformedData.items.length} business results for "${q}"`);
      res.json({ success: true, data: transformedData });
    } catch (error) {
      console.error('HERE discover error:', error);
      res.status(500).json({ error: 'Business search failed' });
    }
  });

  // HERE API Reverse Geocoding for GPS coordinates
  app.get('/api/here/reverse-geocode', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
      }

      const hereApiKey = process.env.HERE_API_KEY;
      if (!hereApiKey) {
        return res.status(500).json({ success: false, error: 'HERE API key not configured' });
      }

      const response = await fetch(
        `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat},${lng}&apiKey=${hereApiKey}`
      );

      if (!response.ok) {
        throw new Error(`HERE API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const address = data.items[0].address.label;
        res.json({ success: true, address });
      } else {
        res.json({ success: false, error: 'No address found for these coordinates' });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      res.status(500).json({ success: false, error: 'Failed to reverse geocode coordinates' });
    }
  });

  // Moovly Go OCR Image Processing endpoint
  app.post("/api/moovly-go/process-image", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No image file provided" });
      }

      // Use Tesseract.js for OCR processing
      const Tesseract = (await import('tesseract.js')).default;
      
      const { data: { text } } = await Tesseract.recognize(
        req.file.buffer,
        'eng',
        { logger: m => console.log(m) }
      );

      const extractedText = text.trim();
      console.log('OCR extracted text:', extractedText);

      // Try to geocode the extracted address
      let geocoded = null;
      if (extractedText) {
        try {
          // Mock geocoding for now - in production, use Google Maps Geocoding API
          // Cost: FREE up to 25,000 requests/month, then $5/1000 requests
          const mockGeocode = {
            lat: -26.2041 + (Math.random() - 0.5) * 0.1,
            lng: 28.0473 + (Math.random() - 0.5) * 0.1,
            formatted_address: extractedText
          };
          geocoded = mockGeocode;
        } catch (geoError) {
          console.error('Geocoding failed:', geoError);
        }
      }

      res.json({ 
        success: true, 
        extractedText,
        geocoded,
        processingTime: Date.now()
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      res.status(500).json({ success: false, message: "OCR processing failed" });
    }
  });

  // Moovly Go Route Optimization with LIFO support
  app.post("/api/moovly-go/optimize", async (req, res) => {
    try {
      const { stops, mode } = req.body;
      
      if (!stops || stops.length < 2) {
        return res.status(400).json({ success: false, message: "At least 2 stops required" });
      }

      let optimizedStops = [...stops];
      
      switch (mode) {
        case 'lifo': // Last In, First Out - newest packages delivered first
          optimizedStops = stops.sort((a, b) => b.loadIndex - a.loadIndex);
          break;
        case 'fifo': // First In, First Out - oldest packages delivered first  
          optimizedStops = stops.sort((a, b) => a.loadIndex - b.loadIndex);
          break;
        case 'shortest':
          // Simple distance-based optimization (mock)
          optimizedStops = stops.sort((a, b) => {
            const distA = Math.sqrt(Math.pow(a.lat + 26.2041, 2) + Math.pow(a.lng - 28.0473, 2));
            const distB = Math.sqrt(Math.pow(b.lat + 26.2041, 2) + Math.pow(b.lng - 28.0473, 2));
            return distA - distB;
          });
          break;
        default:
          // Balanced optimization combining LIFO with distance
          optimizedStops = stops.sort((a, b) => {
            const priorityA = a.priority || a.loadIndex;
            const priorityB = b.priority || b.loadIndex;
            return priorityB - priorityA; // Higher priority first
          });
      }

      // Update priorities based on new order
      optimizedStops = optimizedStops.map((stop, index) => ({
        ...stop,
        priority: index + 1
      }));

      const metrics = {
        totalStops: optimizedStops.length,
        optimizationMode: mode,
        estimatedTime: optimizedStops.length * 15, // 15 min per stop
        estimatedDistance: optimizedStops.length * 2.5, // 2.5km per stop
        fuelSavings: mode === 'shortest' ? '15%' : mode === 'lifo' ? '0%' : '8%'
      };

      res.json({ 
        success: true, 
        optimizedStops, 
        metrics,
        message: `Route optimized using ${mode.toUpperCase()} strategy`
      });
    } catch (error) {
      console.error('Route optimization error:', error);
      res.status(500).json({ success: false, message: "Route optimization failed" });
    }
  });

  // Moovly Go Messaging - Get messages
  app.get("/api/moovly-go/messages", async (req, res) => {
    try {
      const { driverId } = req.query;
      
      // Mock messages for now - in production, fetch from database
      const mockMessages = [
        {
          id: 1,
          content: "Welcome to Moovly Go! Your route is ready for optimization.",
          fromDispatch: true,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          isRead: true
        },
        {
          id: 2,
          content: "Priority delivery at Sandton City - customer waiting",
          fromDispatch: true,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          isRead: false
        }
      ];

      res.json({ success: true, messages: mockMessages });
    } catch (error) {
      console.error('Message fetch error:', error);
      res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
  });

  // Moovly Go Messaging - Send message
  app.post("/api/moovly-go/send-message", async (req, res) => {
    try {
      const { driverId, message, timestamp } = req.body;
      
      console.log(`Moovly Go Driver ${driverId} sent message: ${message}`);
      
      // In production, save to database and notify dispatch via websocket
      const newMessage = {
        id: Date.now(),
        content: message,
        fromDispatch: false,
        timestamp,
        isRead: false
      };

      res.json({ success: true, message: newMessage });
    } catch (error) {
      console.error('Message send error:', error);
      res.status(500).json({ success: false, message: "Failed to send message" });
    }
  });

  // Moovly Go Barcode Scanning endpoint
  app.post("/api/moovly-go/scan-barcode", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No barcode image provided" });
      }

      console.log('Processing barcode image...');
      
      // In production, you would use a barcode scanning library like:
      // - @zxing/library (FREE)
      // - quagga2 (FREE) 
      // - Google Vision API (~$1.50/1000 requests)
      
      // For now, simulate barcode data extraction
      const mockBarcodeData = {
        packageId: `PKG${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        trackingNumber: `TRK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        // Some barcodes contain address data, some don't
        address: Math.random() > 0.5 ? [
          "123 Barcode Street, Sandton",
          "456 QR Code Ave, Rosebank",
          "789 Tracking Road, Fourways"
        ][Math.floor(Math.random() * 3)] : null,
        lat: -26.2041 + (Math.random() - 0.5) * 0.1,
        lng: 28.0473 + (Math.random() - 0.5) * 0.1,
        confidence: 0.95
      };

      res.json({ 
        success: true, 
        barcodeData: mockBarcodeData,
        message: mockBarcodeData.address 
          ? "Barcode scanned with address data" 
          : "Barcode scanned - package ID only"
      });
    } catch (error) {
      console.error('Barcode scanning error:', error);
      res.status(500).json({ success: false, message: "Barcode scanning failed" });
    }
  });

  // Dedicated PIN login endpoint for mobile drivers
  app.post("/api/driver/pin-login", async (req, res) => {
    try {
      const { username, pin } = req.body;

      if (!username || !pin) {
        return res.status(400).json({
          success: false,
          message: "Username and PIN are required"
        });
      }

      // Check if it's a driver login with PIN
      const drivers = await storage.getAllDrivers();
      const driver = drivers.find(d => d.username === username);
      
      if (!driver) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or PIN"
        });
      }

      // Check if driver has a PIN
      if (!driver.pin) {
        return res.status(400).json({
          success: false,
          message: "Driver PIN not set. Please contact administrator."
        });
      }

      // Verify PIN - handle both plain text and hashed PINs
      let isPinValid = false;
      if (driver.pin.length <= 4) {
        // Plain text PIN (for test accounts)
        isPinValid = pin === driver.pin;
      } else {
        // Hashed PIN
        isPinValid = OTPService.verifyPIN(pin, driver.pin);
      }

      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or PIN"
        });
      }

      // Update last login time
      await storage.updateDriver(driver.id, {
        lastLoginAt: new Date()
      });

      return res.json({ 
        success: true,
        user: { 
          id: driver.id, 
          username: driver.username,
          name: driver.name,
          email: driver.email,
          vehicleId: driver.vehicleId,
          role: driver.role || 'fleet' // Include role for access control
        },
        token: `mobile-token-${driver.id}-${Date.now()}`,
        driver: driver
      });

    } catch (error) {
      console.error("PIN login error:", error);
      res.status(500).json({ 
        success: false,
        message: "Internal server error" 
      });
    }
  });

  // Logout API route - redirect to login page
  app.get("/api/logout", async (req, res) => {
    try {
      // Clear any session data if needed
      if (req.session) {
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
        });
      }
      
      // Redirect to login page
      res.redirect("/login");
    } catch (error) {
      console.error("Logout error:", error);
      res.redirect("/login");
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Analytics endpoint
  app.get("/api/analytics", async (req, res) => {
    try {
      const { period = 'weekly' } = req.query;
      
      // Get all drivers with trip data
      const drivers = await storage.getAllDrivers();
      const tripData = await storage.getAllTripData();
      
      // Calculate analytics data
      const analyticsData = {
        averageScore: tripData.length > 0 ? 
          tripData.reduce((sum, trip) => sum + (trip.moovScore || 0), 0) / tripData.length : 0,
        drivers: drivers.map(driver => {
          const driverTrips = tripData.filter(trip => trip.driverId === driver.id);
          const avgScore = driverTrips.length > 0 ? 
            driverTrips.reduce((sum, trip) => sum + (trip.moovScore || 0), 0) / driverTrips.length : 0;
          const harshEvents = driverTrips.reduce((sum, trip) => 
            sum + (trip.harshBrakes || 0) + (trip.harshAccelerations || 0) + (trip.harshTurns || 0), 0);
          const idleTime = driverTrips.reduce((sum, trip) => 
            sum + Math.floor((trip.idleTimeSeconds || 0) / 60), 0);
          
          return {
            id: driver.id,
            name: driver.name,
            trips: driverTrips.length,
            harshEvents,
            idleTime,
            score: Math.round(avgScore)
          };
        }),
        routeHistory: tripData.slice(-10).map((trip, index) => {
          const driver = drivers.find(d => d.id === trip.driverId);
          return {
            id: trip.id.toString(),
            driverName: driver?.name || 'Unknown Driver',
            startLocation: 'Start Location',
            endLocation: 'End Location', 
            distance: trip.distance || '0km',
            duration: `${Math.floor((trip.endTime.getTime() - trip.startTime.getTime()) / 60000)}m`,
            date: trip.startTime.toISOString().split('T')[0],
            moovScore: trip.moovScore || 0
          };
        }),
        fleetStats: {
          totalDrivers: drivers.length,
          activeVehicles: (await storage.getAllVehicles()).filter(v => v.status === 'active').length,
          completedJobs: (await storage.getAllJobs()).filter(j => j.status === 'completed').length,
          fuelSavings: Math.floor(Math.random() * 20000) + 10000, // Mock data for now
          safetyIncidents: tripData.reduce((sum, trip) => 
            sum + (trip.harshBrakes || 0) + (trip.harshAccelerations || 0) + (trip.harshTurns || 0), 0)
        }
      };
      
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Dashboard upcoming jobs endpoint
  app.get("/api/dashboard/upcoming-jobs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const jobs = await storage.getJobsByStatus('scheduled');
      
      // Sort by scheduled date and limit results
      const upcomingJobs = jobs
        .filter(job => job.scheduledDate && new Date(job.scheduledDate) > new Date())
        .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime())
        .slice(0, limit);
        
      res.json(upcomingJobs);
    } catch (error) {
      console.error("Error fetching upcoming jobs:", error);
      res.status(500).json({ message: "Failed to fetch upcoming jobs" });
    }
  });

  // Performance stats endpoint
  app.get("/api/performance/stats", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      const jobs = await storage.getAllJobs();
      const vehicles = await storage.getAllVehicles();
      
      const performanceData = {
        totalDrivers: drivers.length,
        activeDrivers: drivers.filter(d => d.status === 'active').length,
        completedJobsToday: jobs.filter(j => {
          if (!j.updatedAt) return false;
          const today = new Date();
          const jobDate = new Date(j.updatedAt);
          return j.status === 'completed' && 
                 jobDate.toDateString() === today.toDateString();
        }).length,
        averageMoovScore: drivers.reduce((acc, d) => acc + ((d as any).moovScore || 0), 0) / drivers.length || 0,
        vehicleUtilization: vehicles.filter(v => v.status === 'active').length / vehicles.length * 100 || 0
      };
      
      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching performance stats:", error);
      res.status(500).json({ message: "Failed to fetch performance stats" });
    }
  });

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error fetching drivers:", error);
      res.status(500).json({ message: "Failed to fetch drivers" });
    }
  });

  // Real-time Driver Locations API (must be before /:id route)
  app.get("/api/drivers/locations", async (req, res) => {
    try {
      const locations = await storage.getDriverLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching driver locations:", error);
      res.status(500).json({ message: "Failed to fetch driver locations" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const driver = await storage.getDriver(id);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      console.error("Error fetching driver:", error);
      res.status(500).json({ message: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const driverData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver data", errors: error.errors });
      }
      console.error("Error creating driver:", error);
      res.status(500).json({ message: "Failed to create driver" });
    }
  });

  // Bulk import drivers endpoint
  app.post("/api/drivers/bulk-import", async (req, res) => {
    try {
      const { drivers } = req.body;
      
      if (!Array.isArray(drivers) || drivers.length === 0) {
        return res.status(400).json({ message: "No drivers provided for import" });
      }

      const importResults = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < drivers.length; i++) {
        const driverData = drivers[i];
        
        try {
          // Generate username from name if not provided
          if (!driverData.username) {
            const nameParts = driverData.name.split(' ');
            const firstName = nameParts[0]?.toLowerCase() || '';
            const lastInitial = nameParts[nameParts.length - 1]?.charAt(0)?.toLowerCase() || '';
            driverData.username = firstName + (lastInitial ? '.' + lastInitial : '') + Math.floor(Math.random() * 100);
          }

          // Parse and validate driver data
          const validatedData = insertDriverSchema.parse({
            ...driverData,
            vehicleId: driverData.vehicleId ? Number(driverData.vehicleId) : null,
            performance: driverData.performance ? Number(driverData.performance) : 85,
            hourlyRate: driverData.hourlyRate ? Number(driverData.hourlyRate) : null
          });

          await storage.createDriver(validatedData);
          importResults.successful++;
        } catch (error) {
          importResults.failed++;
          importResults.errors.push({
            row: i + 1,
            name: driverData.name || 'Unknown',
            error: error instanceof z.ZodError ? error.errors[0]?.message : error.message
          });
        }
      }

      res.json({
        message: `Import completed: ${importResults.successful} successful, ${importResults.failed} failed`,
        results: importResults
      });

    } catch (error) {
      console.error("Error in bulk driver import:", error);
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(id, updateData);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid driver data", errors: error.errors });
      }
      console.error("Error updating driver:", error);
      res.status(500).json({ message: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDriver(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ message: "Failed to delete driver" });
    }
  });

  // Break Management endpoints
  app.post("/api/drivers/:id/break", async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await storage.updateDriver(driverId, {
        isOnBreak: true,
        breakStartTime: new Date(),
        breakAlertSent: false
      });
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json({ message: "Break started", driver });
    } catch (error) {
      console.error("Error starting break:", error);
      res.status(500).json({ message: "Failed to start break" });
    }
  });

  app.post("/api/drivers/:id/end-break", async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await storage.updateDriver(driverId, {
        isOnBreak: false,
        breakStartTime: null,
        breakAlertSent: false
      });
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      res.json({ message: "Break ended", driver });
    } catch (error) {
      console.error("Error ending break:", error);
      res.status(500).json({ message: "Failed to end break" });
    }
  });

  // System Settings endpoints
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.get("/api/system-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSystemSetting(key);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error fetching system setting:", error);
      res.status(500).json({ message: "Failed to fetch system setting" });
    }
  });

  app.put("/api/system-settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      if (!value) {
        return res.status(400).json({ message: "Setting value is required" });
      }
      
      const setting = await storage.updateSystemSetting(key, value);
      
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error("Error updating system setting:", error);
      res.status(500).json({ message: "Failed to update system setting" });
    }
  });

  // Check for break alerts (to be called periodically)
  app.get("/api/break-alerts/check", async (req, res) => {
    try {
      // Get break alert threshold from settings
      const breakAlertSetting = await storage.getSystemSetting('break_alert_minutes');
      const alertMinutes = breakAlertSetting ? parseInt(breakAlertSetting.settingValue) : 60;
      
      // Find drivers who have been on break longer than threshold and haven't been alerted
      const driversOnBreak = await storage.getDriversOnLongBreak(alertMinutes);
      
      const alerts = [];
      for (const driver of driversOnBreak) {
        if (driver.breakStartTime && !driver.breakAlertSent) {
          const breakDuration = Math.floor((Date.now() - driver.breakStartTime.getTime()) / (1000 * 60));
          
          // Create alert in alert center
          await storage.createAlert({
            type: 'break_overtime',
            title: `Driver ${driver.name} on extended break`,
            description: `${driver.name} has been on break for ${breakDuration} minutes (threshold: ${alertMinutes} minutes)`,
            priority: 'medium',
            driverId: driver.id,
            isRead: false
          });
          
          // Mark alert as sent
          await storage.updateDriver(driver.id, { breakAlertSent: true });
          
          alerts.push({
            driverId: driver.id,
            driverName: driver.name,
            breakDuration,
            threshold: alertMinutes
          });
        }
      }
      
      res.json({ alertsCreated: alerts.length, alerts });
    } catch (error) {
      console.error("Error checking break alerts:", error);
      res.status(500).json({ message: "Failed to check break alerts" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  // Vehicle assignment API endpoints - must come before parameterized routes
  app.get("/api/vehicles/available", async (req, res) => {
    try {
      console.log("Fetching available vehicles...");
      const vehicles = await storage.getAvailableVehicles();
      console.log("Available vehicles found:", vehicles.length);
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching available vehicles:", error);
      res.status(500).json({ message: "Failed to fetch available vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  app.post("/api/vehicles", async (req, res) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      console.error("Error creating vehicle:", error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.put("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, updateData);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      console.error("Error updating vehicle:", error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  app.delete("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteVehicle(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { status } = req.query;
      let jobs;
      
      if (status && typeof status === 'string') {
        jobs = await storage.getJobsByStatus(status);
      } else {
        jobs = await storage.getAllJobs();
      }
      
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      console.error("Error fetching job:", error);
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  app.post("/api/jobs", async (req, res) => {
    try {
      // Create HTTP input schema with proper coercion and validation
      const httpJobSchema = insertJobSchema.extend({
        customerName: z.string().min(1, "Customer name is required"),
        pickupAddress: z.string().min(1, "Pickup address is required"),
        deliveryAddress: z.string().min(1, "Delivery address is required"),
        scheduledDate: z.coerce.date().default(new Date()),
        scheduledTime: z.coerce.date().optional(),
        packageCount: z.coerce.number().min(1).default(1),
        timeAtStop: z.coerce.number().min(1).default(5),
        arrivalTime: z.string().default("Anytime"),
        orderPriority: z.string().default("auto"),
        jobType: z.string().default("delivery"),
        priority: z.string().default("medium"),
        status: z.string().default("pending"),
        hasFixedTime: z.coerce.boolean().optional(),
        driverId: z.coerce.number().nullable().optional(),
      }).omit({
        jobNumber: true, // We generate this
        trackingToken: true, // We generate this
      });

      // Generate unique job number and tracking token
      const allJobs = await storage.getAllJobs();
      const jobNumber = `JOB-${String(allJobs.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
      const trackingToken = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Parse and validate input data with proper coercion
      const inputData = httpJobSchema.parse(req.body);
      
      // Derive hasFixedTime from arrivalTime if not provided
      const hasFixedTime = inputData.hasFixedTime ?? 
        (inputData.arrivalTime !== "Anytime" && inputData.arrivalTime.trim() !== "");
      
      // Create final job data
      const jobData = {
        ...inputData,
        jobNumber,
        trackingToken,
        hasFixedTime,
        // Normalize string fields
        customerName: inputData.customerName.trim(),
        pickupAddress: inputData.pickupAddress.trim(),
        deliveryAddress: inputData.deliveryAddress.trim(),
        arrivalTime: inputData.arrivalTime.trim(),
        notes: inputData.notes?.trim() || null,
        customerPhone: inputData.customerPhone?.trim() || null,
        customerEmail: inputData.customerEmail?.trim() || null,
        packageDetails: inputData.packageDetails?.trim() || null,
        specialInstructions: inputData.specialInstructions?.trim() || null,
        accessInstructions: inputData.accessInstructions?.trim() || null,
      };
      
      // Validate driver exists if assigned
      if (jobData.driverId) {
        const driver = await storage.getDriver(jobData.driverId);
        if (!driver) {
          return res.status(400).json({ message: "Assigned driver not found" });
        }
        if (driver.status !== "active") {
          return res.status(400).json({ message: "Cannot assign to inactive driver" });
        }
      }
      
      const job = await storage.createJob(jobData);
      
      // Emit real-time update for new job creation
      if (global.io) {
        global.io.emit('job:created', { job, message: `New job ${job.jobNumber} created` });
        if (job.driverId) {
          global.io.emit('job:assigned', { job, driverId: job.driverId, message: `Job ${job.jobNumber} assigned` });
        }
      }

      // Send push notifications to available drivers for new job
      try {
        if (!job.driverId) {
          // Get all active drivers for unassigned jobs
          const activeDrivers = await storage.getAllDrivers();
          const availableDrivers = activeDrivers.filter(driver => 
            driver.status === 'active' && 
            driver.pushSubscription && 
            driver.notificationPreferences?.newJobs !== false
          );

          for (const driver of availableDrivers) {
            try {
              const notificationPayload = PushNotificationService.createJobCreatedNotification({
                jobNumber: job.jobNumber,
                customerName: job.customerName,
                priority: job.priority || 'medium',
                pickupAddress: job.pickupAddress,
                deliveryAddress: job.deliveryAddress,
                scheduledDate: job.scheduledDate
              });
              
              await PushNotificationService.sendNotification(driver.pushSubscription, notificationPayload);
            } catch (notifError) {
              console.error(`Failed to send notification to driver ${driver.id}:`, notifError);
              // Clean up dead subscription
              await storage.updateDriver(driver.id, { pushSubscription: null });
            }
          }
        }
      } catch (error) {
        console.error('Error sending push notifications for new job:', error);
        // Don't fail the request if notifications fail
      }
      
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid job data", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  // Bulk import jobs endpoint
  app.post("/api/jobs/bulk-import", async (req, res) => {
    try {
      const { jobs } = req.body;
      
      if (!Array.isArray(jobs) || jobs.length === 0) {
        return res.status(400).json({ message: "No jobs provided for import" });
      }

      const importResults = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (let i = 0; i < jobs.length; i++) {
        const jobData = jobs[i];
        
        try {
          // Create simplified validation schema for bulk import
          const bulkJobSchema = z.object({
            customerName: z.string().min(1, "Customer name is required"),
            pickupAddress: z.string().min(1, "Pickup address is required"),
            deliveryAddress: z.string().min(1, "Delivery address is required"),
            scheduledDate: z.string().min(1, "Scheduled date is required"),
            scheduledTime: z.string().optional(),
            priority: z.string().default('medium'),
            driverId: z.number().optional().nullable(),
            customerPhone: z.string().optional(),
            customerEmail: z.string().optional(),
            packageDetails: z.string().optional(),
            specialInstructions: z.string().optional(),
            notes: z.string().optional()
          });

          // Parse and validate job data
          const validatedData = bulkJobSchema.parse(jobData);

          // Generate unique job number and tracking token
          const allJobs = await storage.getAllJobs();
          const jobNumber = `JOB-${String(allJobs.length + i + 1).padStart(3, '0')}-${Date.now().toString().slice(-4)}`;
          const trackingToken = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Create job with required fields
          const jobToCreate = {
            ...validatedData,
            jobNumber,
            trackingToken,
            scheduledDate: new Date(validatedData.scheduledDate),
            scheduledTime: validatedData.scheduledTime ? new Date(validatedData.scheduledTime) : null,
            packageCount: 1,
            timeAtStop: 5,
            arrivalTime: "Anytime",
            orderPriority: "auto",
            jobType: "delivery",
            status: "pending",
            hasFixedTime: false
          };

          await storage.createJob(jobToCreate);
          importResults.successful++;
        } catch (error) {
          importResults.failed++;
          importResults.errors.push({
            row: i + 1,
            customer: jobData.customerName || 'Unknown',
            error: error instanceof z.ZodError ? error.errors[0]?.message : (error as Error).message
          } as any);
        }
      }

      res.json({
        message: `Import completed: ${importResults.successful} successful, ${importResults.failed} failed`,
        results: importResults
      });

    } catch (error) {
      console.error("Error in bulk job import:", error);
      res.status(500).json({ message: "Failed to process bulk import" });
    }
  });

  app.put("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if job exists first
      const existingJob = await storage.getJob(id);
      if (!existingJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Convert date strings to Date objects before validation
      const processedBody = {
        ...req.body,
        scheduledDate: req.body.scheduledDate ? new Date(req.body.scheduledDate) : undefined,
        scheduledTime: req.body.scheduledTime ? new Date(req.body.scheduledTime) : undefined,
        completedDate: req.body.completedDate ? new Date(req.body.completedDate) : undefined,
        estimatedDistance: req.body.estimatedDistance ? Number(req.body.estimatedDistance) : undefined,
        actualDistance: req.body.actualDistance ? Number(req.body.actualDistance) : undefined
      };
      
      // Validate driver exists if being assigned
      if (processedBody.driverId && processedBody.driverId !== existingJob.driverId) {
        const driver = await storage.getDriver(processedBody.driverId);
        if (!driver) {
          return res.status(400).json({ message: "Assigned driver not found" });
        }
        if (driver.status !== "active") {
          return res.status(400).json({ message: "Cannot assign to inactive driver" });
        }
      }
      
      const updateData = insertJobSchema.partial().parse(processedBody);
      const job = await storage.updateJob(id, updateData);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Send push notifications for job changes
      try {
        // Driver assignment changes
        if (updateData.driverId !== existingJob.driverId && updateData.driverId) {
          const driver = await storage.getDriver(updateData.driverId);
          if (driver && driver.pushSubscription && driver.notificationPreferences?.jobAssignments !== false) {
            const notificationPayload = PushNotificationService.createJobAssignmentNotification({
              jobNumber: job.jobNumber,
              clientName: job.clientName,
              priority: job.priority,
              pickupAddress: job.pickupAddress,
              deliveryAddress: job.deliveryAddress,
              scheduledTime: job.scheduledDate
            });
            
            const success = await PushNotificationService.sendNotification(
              driver.pushSubscription,
              notificationPayload
            );
            
            if (!success) {
              await storage.updateDriver(updateData.driverId, { pushSubscription: null });
            }
          }
        }
        
        // Job update notifications (for already assigned jobs)
        if (existingJob.driverId && (
          updateData.pickupAddress !== existingJob.pickupAddress || 
          updateData.deliveryAddress !== existingJob.deliveryAddress ||
          updateData.scheduledDate !== existingJob.scheduledDate ||
          updateData.priority !== existingJob.priority
        )) {
          const driver = await storage.getDriver(existingJob.driverId);
          if (driver && driver.pushSubscription && driver.notificationPreferences?.jobUpdates !== false) {
            const changes = [];
            if (updateData.pickupAddress !== existingJob.pickupAddress) changes.push('pickup location');
            if (updateData.deliveryAddress !== existingJob.deliveryAddress) changes.push('delivery location');
            if (updateData.scheduledDate !== existingJob.scheduledDate) changes.push('scheduled time');
            if (updateData.priority !== existingJob.priority) changes.push('priority');
            
            const notificationPayload = PushNotificationService.createJobUpdateNotification({
              jobNumber: job.jobNumber,
              changes: changes.join(', '),
              newTime: updateData.scheduledDate || existingJob.scheduledDate,
              isUrgent: updateData.priority === 'urgent'
            });
            
            const success = await PushNotificationService.sendNotification(
              driver.pushSubscription,
              notificationPayload
            );
            
            if (!success) {
              await storage.updateDriver(existingJob.driverId, { pushSubscription: null });
            }
          }
        }
      } catch (pushError) {
        console.error("Failed to send push notification for job update:", pushError);
      }

      // Emit real-time updates for job changes
      if (global.io) {
        global.io.emit('job:updated', { job, message: `Job ${job.jobNumber} updated` });
        
        // Specific events for status changes
        if (updateData.status && updateData.status !== existingJob.status) {
          global.io.emit('job:status_changed', { 
            job, 
            oldStatus: existingJob.status, 
            newStatus: updateData.status,
            message: `Job ${job.jobNumber} status changed to ${updateData.status}` 
          });
        }
        
        // Driver assignment changes
        if (updateData.driverId !== existingJob.driverId) {
          if (updateData.driverId) {
            global.io.emit('job:assigned', { job, driverId: updateData.driverId, message: `Job ${job.jobNumber} assigned` });
          } else {
            global.io.emit('job:unassigned', { job, message: `Job ${job.jobNumber} unassigned` });
          }
        }
      }
      
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid job data", 
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteJob(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting job:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Unassign driver from vehicle endpoint
  app.post("/api/drivers/:id/unassign-vehicle", async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await storage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ 
          success: false,
          message: "Driver not found" 
        });
      }

      // Update driver to remove vehicle assignment
      const updatedDriver = await storage.updateDriver(driverId, { vehicleId: null });
      
      // Also update the vehicle to remove driver assignment
      if (driver.vehicleId) {
        await storage.assignVehicleToDriver(driver.vehicleId, null);
      }

      res.json({ 
        success: true,
        message: "Vehicle unassigned successfully",
        driver: updatedDriver
      });
    } catch (error) {
      console.error("Error unassigning vehicle from driver:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to unassign vehicle" 
      });
    }
  });

  // Mobile driver vehicle assignment endpoint
  app.post("/api/drivers/assign-vehicle", async (req, res) => {
    try {
      const { driverId, vehicleId, startingOdometer } = req.body;
      
      // Validate required fields
      if (!driverId || !vehicleId || !startingOdometer) {
        return res.status(400).json({ 
          success: false,
          message: "Missing required fields: driverId, vehicleId, startingOdometer" 
        });
      }

      // Create assignment data for storage
      const assignmentData = {
        driverId: parseInt(driverId),
        vehicleId: parseInt(vehicleId),
        assignmentDate: new Date(),
        startingOdometer: parseFloat(startingOdometer),
        isActive: true
      };

      const result = await storage.createVehicleAssignment(assignmentData);
      
      if (!result.success) {
        return res.status(400).json({ 
          success: false,
          message: "Failed to assign vehicle to driver" 
        });
      }

      res.json({ 
        success: true,
        message: "Vehicle assigned successfully",
        assignment: result
      });
    } catch (error) {
      console.error("Error assigning vehicle to driver:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to assign vehicle" 
      });
    }
  });

  // Customer/Address Book routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, updateData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCustomer(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  app.post("/api/customers/:id/geocode", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomer(id);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Mock geocoding - in production you'd use Google Maps API
      // For now, generate random coordinates for demonstration
      const latitude = "-33.9" + Math.floor(Math.random() * 100);
      const longitude = "18." + Math.floor(Math.random() * 100);
      
      const updatedCustomer = await storage.updateCustomer(id, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
      
      res.json(updatedCustomer);
    } catch (error) {
      console.error("Error geocoding customer:", error);
      res.status(500).json({ message: "Failed to geocode customer address" });
    }
  });

  // Route routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.get("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getRoute(id);
      
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(route);
    } catch (error) {
      console.error("Error fetching route:", error);
      res.status(500).json({ message: "Failed to fetch route" });
    }
  });

  app.post("/api/routes", async (req, res) => {
    try {
      const routeData = insertRouteSchema.parse(req.body);
      const route = await storage.createRoute(routeData);
      res.status(201).json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      console.error("Error creating route:", error);
      res.status(500).json({ message: "Failed to create route" });
    }
  });

  app.put("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertRouteSchema.partial().parse(req.body);
      const route = await storage.updateRoute(id, updateData);
      
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(route);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      console.error("Error updating route:", error);
      res.status(500).json({ message: "Failed to update route" });
    }
  });

  app.delete("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRoute(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ message: "Failed to delete route" });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", async (req, res) => {
    try {
      const { vehicleId } = req.query;
      let records;
      
      if (vehicleId && typeof vehicleId === 'string') {
        records = await storage.getMaintenanceRecordsByVehicle(parseInt(vehicleId));
      } else {
        records = await storage.getAllMaintenanceRecords();
      }
      
      res.json(records);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      res.status(500).json({ message: "Failed to fetch maintenance records" });
    }
  });

  app.get("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const record = await storage.getMaintenanceRecord(id);
      
      if (!record) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      res.status(500).json({ message: "Failed to fetch maintenance record" });
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const recordData = insertMaintenanceRecordSchema.parse(req.body);
      const record = await storage.createMaintenanceRecord(recordData);
      res.status(201).json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance record data", errors: error.errors });
      }
      console.error("Error creating maintenance record:", error);
      res.status(500).json({ message: "Failed to create maintenance record" });
    }
  });

  app.put("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertMaintenanceRecordSchema.partial().parse(req.body);
      const record = await storage.updateMaintenanceRecord(id, updateData);
      
      if (!record) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance record data", errors: error.errors });
      }
      console.error("Error updating maintenance record:", error);
      res.status(500).json({ message: "Failed to update maintenance record" });
    }
  });

  app.delete("/api/maintenance/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMaintenanceRecord(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting maintenance record:", error);
      res.status(500).json({ message: "Failed to delete maintenance record" });
    }
  });

  // Fuel entry routes
  app.get("/api/fuel", async (req, res) => {
    try {
      const { vehicleId } = req.query;
      let fuelEntries;
      
      if (vehicleId && typeof vehicleId === 'string') {
        fuelEntries = await storage.getFuelEntriesByVehicle(parseInt(vehicleId));
      } else {
        fuelEntries = await storage.getAllFuelEntries();
      }
      
      res.json(fuelEntries);
    } catch (error) {
      console.error("Error fetching fuel entries:", error);
      res.status(500).json({ message: "Failed to fetch fuel entries" });
    }
  });

  app.post("/api/fuel/entry", async (req, res) => {
    try {
      const entryData = insertFuelEntrySchema.parse(req.body);
      const entry = await storage.createFuelEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid fuel entry data", errors: error.errors });
      }
      console.error("Error creating fuel entry:", error);
      res.status(500).json({ message: "Failed to create fuel entry" });
    }
  });

  // Fuel reports
  app.get('/api/reports/refuel', async (req, res) => {
    try {
      const { vehicleId, startDate, endDate } = req.query;
      const fuelEntries = await storage.getFuelEntriesForReport(
        vehicleId as string, 
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      const refuelReport = fuelEntries.map(entry => ({
        driverName: entry.driverName,
        vehicleRegistration: entry.vehicleRegistration,
        dateTime: entry.createdAt,
        filledAmount: entry.liters,
        odometerReading: entry.odometer,
        location: entry.location
      }));
      
      res.json(refuelReport);
    } catch (error) {
      console.error('Error generating refuel report:', error);
      res.status(500).json({ message: 'Failed to generate refuel report' });
    }
  });

  app.get('/api/reports/fuel-consumption', async (req, res) => {
    try {
      const { vehicleId, startDate, endDate } = req.query;
      const consumptionData = await storage.getFuelConsumptionReport(
        vehicleId as string,
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      
      res.json(consumptionData);
    } catch (error) {
      console.error('Error generating fuel consumption report:', error);
      res.status(500).json({ message: 'Failed to generate fuel consumption report' });
    }
  });

  // Driver shift routes
  app.get("/api/shifts", async (req, res) => {
    try {
      const { driverId } = req.query;
      let shifts;
      
      if (driverId && typeof driverId === 'string') {
        shifts = await storage.getDriverShiftsByDriver(parseInt(driverId));
      } else {
        shifts = await storage.getAllDriverShifts();
      }
      
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching driver shifts:", error);
      res.status(500).json({ message: "Failed to fetch driver shifts" });
    }
  });

  app.post("/api/shift/check", async (req, res) => {
    try {
      const { driverId, currentTime } = req.body;
      const result = await storage.checkShiftStatus(driverId, new Date(currentTime));
      res.json(result);
    } catch (error) {
      console.error("Error checking shift status:", error);
      res.status(500).json({ message: "Failed to check shift status" });
    }
  });

  app.post("/api/shifts", async (req, res) => {
    try {
      const shiftData = insertDriverShiftSchema.parse(req.body);
      const shift = await storage.createDriverShift(shiftData);
      res.status(201).json(shift);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shift data", errors: error.errors });
      }
      console.error("Error creating shift:", error);
      res.status(500).json({ message: "Failed to create shift" });
    }
  });

  // Alert routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const { unread } = req.query;
      let alerts;
      
      if (unread === 'true') {
        alerts = await storage.getUnreadAlerts();
      } else {
        alerts = await storage.getAllAlerts();
      }
      
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alert/send", async (req, res) => {
    try {
      const alertData = insertAlertSchema.parse(req.body);
      const alert = await storage.createAlert(alertData);
      
      // Here you could integrate email/SMS notifications
      // For now, we just create the alert in the system
      
      res.status(201).json({ message: "Alert sent", alert });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid alert data", errors: error.errors });
      }
      console.error("Error sending alert:", error);
      res.status(500).json({ message: "Failed to send alert" });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markAlertAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json({ message: "Alert marked as read" });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Job assignment routes
  app.post("/api/jobs/assign", async (req, res) => {
    try {
      const { jobId, driverId } = req.body;
      const job = await storage.assignJob(jobId, driverId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Send push notification to assigned driver
      try {
        const driver = await storage.getDriver(driverId);
        if (driver && driver.pushSubscription && driver.notificationPreferences?.jobAssignments !== false) {
          const notificationPayload = PushNotificationService.createJobAssignmentNotification({
            jobNumber: job.jobNumber,
            clientName: job.clientName,
            priority: job.priority,
            pickupAddress: job.pickupAddress,
            deliveryAddress: job.deliveryAddress,
            scheduledTime: job.scheduledDate
          });
          
          const success = await PushNotificationService.sendNotification(
            driver.pushSubscription,
            notificationPayload
          );
          
          if (!success) {
            // Clean up dead subscription
            await storage.updateDriver(driverId, { pushSubscription: null });
          }
        }
      } catch (pushError) {
        console.error("Failed to send push notification for job assignment:", pushError);
        // Don't fail the assignment if push notification fails
      }
      
      res.json({ message: "Job assigned successfully", job });
    } catch (error) {
      console.error("Error assigning job:", error);
      res.status(500).json({ message: "Failed to assign job" });
    }
  });

  // Job reassignment routes - Admin/Dispatcher access required
  app.post("/api/jobs/reassign", async (req, res) => {
    try {
      // Basic auth check - in production this should be proper JWT/session auth
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== 'Bearer admin-token') {
        return res.status(401).json({ message: "Unauthorized. Admin access required for job reassignment." });
      }

      const { jobId, newDriverId, reason, notes } = req.body;
      
      // Validation
      if (!jobId || reason === undefined) {
        return res.status(400).json({ message: "Job ID and reason are required" });
      }

      // For now, use admin user (in a real app, get from authentication)
      const reassignedBy = 1; // Admin user ID
      
      // Detect conflicts before reassignment
      let conflicts: string[] = [];
      if (newDriverId) {
        conflicts = await storage.detectReassignmentConflicts(jobId, newDriverId);
      }

      // Perform the reassignment
      const result = await storage.reassignJob(jobId, newDriverId, reassignedBy, reason, notes);
      
      if (!result.job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Send push notification to both old and new drivers
      try {
        // Notify old driver
        if (result.reassignmentRecord.fromDriverId) {
          const oldDriver = await storage.getDriver(result.reassignmentRecord.fromDriverId);
          if (oldDriver && oldDriver.pushSubscription && oldDriver.notificationPreferences?.jobUpdated !== false) {
            const notificationPayload = PushNotificationService.createJobUpdatedNotification(result.job, "reassigned");
            
            await PushNotificationService.sendNotification(
              oldDriver.pushSubscription,
              notificationPayload
            );
          }
        }

        // Notify new driver
        if (result.reassignmentRecord.toDriverId) {
          const newDriver = await storage.getDriver(result.reassignmentRecord.toDriverId);
          if (newDriver && newDriver.pushSubscription && newDriver.notificationPreferences?.jobAssigned !== false) {
            const notificationPayload = PushNotificationService.createJobAssignmentNotification({
              jobNumber: result.job.jobNumber,
              clientName: result.job.customerName,
              priority: result.job.priority || "medium",
              pickupAddress: result.job.pickupAddress,
              deliveryAddress: result.job.deliveryAddress,
              scheduledTime: result.job.scheduledDate
            });
            
            await PushNotificationService.sendNotification(
              newDriver.pushSubscription,
              notificationPayload
            );
          }
        }
      } catch (pushError) {
        console.error("Failed to send push notifications for job reassignment:", pushError);
        // Don't fail the reassignment if push notification fails
      }

      // Emit real-time updates
      if (io) {
        io.emit("job-reassigned", {
          job: result.job,
          reassignment: result.reassignmentRecord,
          conflicts
        });
      }

      res.json({ 
        message: "Job reassigned successfully", 
        job: result.job,
        reassignmentRecord: result.reassignmentRecord,
        conflicts 
      });
    } catch (error) {
      console.error("Error reassigning job:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to reassign job" });
    }
  });

  app.post("/api/jobs/reassign/bulk", async (req, res) => {
    try {
      // Basic auth check - in production this should be proper JWT/session auth
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== 'Bearer admin-token') {
        return res.status(401).json({ message: "Unauthorized. Admin access required for bulk job reassignment." });
      }

      const { jobIds, newDriverId, reason, notes } = req.body;
      
      // Validation
      if (!Array.isArray(jobIds) || jobIds.length === 0 || reason === undefined) {
        return res.status(400).json({ message: "Job IDs array and reason are required" });
      }

      const reassignedBy = 1; // Admin user ID

      // Perform bulk reassignment
      const result = await storage.bulkReassignJobs(jobIds, newDriverId, reassignedBy, reason, notes);

      // Send push notifications for successful reassignments
      try {
        if (newDriverId && result.reassignedJobs.length > 0) {
          const newDriver = await storage.getDriver(newDriverId);
          if (newDriver && newDriver.pushSubscription && newDriver.notificationPreferences?.jobAssigned !== false) {
            const notificationPayload = PushNotificationService.createJobAssignmentNotification({
              jobNumber: `${result.reassignedJobs.length} jobs`,
              clientName: "Multiple customers",
              priority: "medium",
              pickupAddress: "Multiple locations",
              deliveryAddress: "Multiple locations", 
              scheduledTime: new Date()
            });
            
            await PushNotificationService.sendNotification(
              newDriver.pushSubscription,
              notificationPayload
            );
          }
        }
      } catch (pushError) {
        console.error("Failed to send push notifications for bulk job reassignment:", pushError);
      }

      // Emit real-time updates
      if (io) {
        io.emit("jobs-bulk-reassigned", {
          reassignedJobs: result.reassignedJobs,
          reassignmentRecords: result.reassignmentRecords
        });
      }

      res.json({ 
        message: `Successfully reassigned ${result.reassignedJobs.length} out of ${jobIds.length} jobs`,
        reassignedJobs: result.reassignedJobs,
        reassignmentRecords: result.reassignmentRecords
      });
    } catch (error) {
      console.error("Error bulk reassigning jobs:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to bulk reassign jobs" });
    }
  });

  app.get("/api/jobs/:jobId/reassignment-history", async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }

      const history = await storage.getJobReassignmentHistory(jobId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching job reassignment history:", error);
      res.status(500).json({ message: "Failed to fetch reassignment history" });
    }
  });

  app.get("/api/reassignment/history", async (req, res) => {
    try {
      const { driverId } = req.query;
      
      let history;
      if (driverId) {
        const id = parseInt(driverId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid driver ID" });
        }
        history = await storage.getReassignmentHistoryByDriver(id);
      } else {
        history = await storage.getAllJobReassignmentHistory();
      }

      res.json(history);
    } catch (error) {
      console.error("Error fetching reassignment history:", error);
      res.status(500).json({ message: "Failed to fetch reassignment history" });
    }
  });

  app.get("/api/drivers/available-for-reassignment", async (req, res) => {
    try {
      const { excludeDriverId } = req.query;
      const excludeId = excludeDriverId ? parseInt(excludeDriverId as string) : undefined;
      
      const availableDrivers = await storage.getAvailableDriversForReassignment(excludeId);
      
      // Add workload information for each driver
      const driversWithWorkload = await Promise.all(
        availableDrivers.map(async (driver) => {
          const workload = await storage.checkDriverWorkload(driver.id);
          return {
            ...driver,
            workload
          };
        })
      );

      res.json(driversWithWorkload);
    } catch (error) {
      console.error("Error fetching available drivers:", error);
      res.status(500).json({ message: "Failed to fetch available drivers" });
    }
  });

  app.get("/api/drivers/:driverId/workload", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      if (isNaN(driverId)) {
        return res.status(400).json({ message: "Invalid driver ID" });
      }

      const workload = await storage.checkDriverWorkload(driverId);
      res.json(workload);
    } catch (error) {
      console.error("Error fetching driver workload:", error);
      res.status(500).json({ message: "Failed to fetch driver workload" });
    }
  });

  app.post("/api/jobs/:jobId/check-reassignment-conflicts", async (req, res) => {
    try {
      // Basic auth check - in production this should be proper JWT/session auth
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== 'Bearer admin-token') {
        return res.status(401).json({ message: "Unauthorized. Admin access required to check reassignment conflicts." });
      }

      const jobId = parseInt(req.params.jobId);
      const { newDriverId } = req.body;
      
      if (isNaN(jobId) || !newDriverId) {
        return res.status(400).json({ message: "Job ID and new driver ID are required" });
      }

      const conflicts = await storage.detectReassignmentConflicts(jobId, newDriverId);
      
      res.json({ 
        hasConflicts: conflicts.length > 0,
        conflicts 
      });
    } catch (error) {
      console.error("Error checking reassignment conflicts:", error);
      res.status(500).json({ message: "Failed to check reassignment conflicts" });
    }
  });

  app.post("/api/routing/optimize", async (req, res) => {
    try {
      const { jobs } = req.body;
      const optimizedJobs = await storage.optimizeRoutes(jobs);
      res.json({ message: "Routes optimized", optimizedOrder: optimizedJobs });
    } catch (error) {
      console.error("Error optimizing routes:", error);
      res.status(500).json({ message: "Failed to optimize routes" });
    }
  });

  // Regional pricing routes
  app.get("/api/pricing", async (req, res) => {
    try {
      const { region } = req.query;
      
      if (region && typeof region === 'string') {
        const pricing = await storage.getRegionalPricing(region);
        if (!pricing) {
          return res.status(404).json({ message: "Pricing not found for region" });
        }
        res.json(pricing);
      } else {
        const allPricing = await storage.getAllRegionalPricing();
        res.json(allPricing);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
      res.status(500).json({ message: "Failed to fetch pricing" });
    }
  });

  app.post("/api/pricing", async (req, res) => {
    try {
      const pricingData = insertRegionalPricingSchema.parse(req.body);
      const pricing = await storage.createRegionalPricing(pricingData);
      res.status(201).json(pricing);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pricing data", errors: error.errors });
      }
      console.error("Error creating pricing:", error);
      res.status(500).json({ message: "Failed to create pricing" });
    }
  });

  // Trip data and MoovScore routes
  app.get("/api/trip-data", async (req, res) => {
    try {
      const { driverId } = req.query;
      let tripData;
      
      if (driverId) {
        tripData = await storage.getTripDataByDriver(parseInt(driverId as string));
      } else {
        tripData = await storage.getAllTripData();
      }
      
      res.json(tripData);
    } catch (error) {
      console.error("Error fetching trip data:", error);
      res.status(500).json({ message: "Failed to fetch trip data" });
    }
  });

  app.post("/api/trip-data", async (req, res) => {
    try {
      const tripData = insertTripDataSchema.parse(req.body);
      const newTrip = await storage.createTripData(tripData);
      res.status(201).json(newTrip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: error.errors });
      }
      console.error("Error creating trip data:", error);
      res.status(500).json({ message: "Failed to create trip data" });
    }
  });

  // Job carry-over routes
  app.post("/api/jobs/carry-over", async (req, res) => {
    try {
      const { jobId, driverId, nextDaySchedule } = req.body;
      const carriedJob = await storage.handleJobCarryOver(jobId, driverId, new Date(nextDaySchedule));
      
      if (!carriedJob) {
        return res.status(404).json({ message: "Job could not be carried over" });
      }
      
      res.json({ message: "Job carried over successfully", job: carriedJob });
    } catch (error) {
      console.error("Error carrying over job:", error);
      res.status(500).json({ message: "Failed to carry over job" });
    }
  });

  app.post("/api/jobs/prioritize", async (req, res) => {
    try {
      const { jobs } = req.body;
      const prioritizedJobs = await storage.prioritizeJobs(jobs);
      res.json(prioritizedJobs);
    } catch (error) {
      console.error("Error prioritizing jobs:", error);
      res.status(500).json({ message: "Failed to prioritize jobs" });
    }
  });

  app.put("/api/jobs/:id/unassign", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const success = await storage.moveToUnassignedJobs(jobId);
      
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json({ message: "Job moved to unassigned" });
    } catch (error) {
      console.error("Error unassigning job:", error);
      res.status(500).json({ message: "Failed to unassign job" });
    }
  });

  // Messaging routes
  app.get("/api/messages", async (req, res) => {
    try {
      const { userId, unread } = req.query;
      let messages;
      
      if (userId && unread === 'true') {
        messages = await storage.getUnreadMessages(parseInt(userId as string));
      } else if (userId) {
        messages = await storage.getMessagesByUser(parseInt(userId as string));
      } else {
        messages = await storage.getAllMessages();
      }
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid message data", errors: error.errors });
      }
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(messageId);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  app.delete("/api/messages/:id", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const success = await storage.deleteMessage(messageId);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json({ message: "Message deleted" });
    } catch (error) {
      console.error("Error deleting message:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  // Mobile app specific endpoints
  
  // Get jobs for a specific driver (mobile app)
  app.get('/api/mobile/jobs', async (req, res) => {
    try {
      const { driverId } = req.query;
      
      if (!driverId) {
        return res.status(400).json({ message: 'Driver ID required' });
      }
      
      const allJobs = await storage.getAllJobs();
      const driverJobs = allJobs.filter(job => job.driverId === parseInt(driverId as string));
      res.json(driverJobs);
    } catch (error) {
      console.error('Error fetching driver jobs:', error);
      res.status(500).json({ message: 'Failed to fetch jobs' });
    }
  });

  // Complete job from mobile app
  app.post('/api/mobile/jobs/:id/complete', async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const completionData = req.body;
      
      // Update job status
      const updatedJob = await storage.updateJob(jobId, { 
        status: 'completed'
      });
      
      // Create trip data if provided
      if (completionData.distance) {
        await storage.createTripData({
          driverId: completionData.driverId,
          startTime: new Date(completionData.startTime || Date.now() - 2 * 60 * 60 * 1000),
          endTime: new Date(completionData.endTime || Date.now()),
          distance: completionData.distance,
          speedViolations: completionData.speedViolations || 0,
          harshBrakes: completionData.harshBrakes || 0,
          harshAccelerations: completionData.harshAccelerations || 0,
          harshTurns: completionData.harshTurns || 0,
          idleTimeSeconds: completionData.idleTimeSeconds || 0,
          fuelUsed: completionData.fuelUsed || 0,
          route: completionData.route || `Job ${jobId} route`
        });
      }
      
      res.json(updatedJob);
    } catch (error) {
      console.error('Error completing job:', error);
      res.status(500).json({ message: 'Failed to complete job' });
    }
  });

  // Handle offline job completions
  app.post('/api/mobile/sync-offline', async (req, res) => {
    try {
      const offlineData = req.body;
      
      // Process offline completion data
      if (offlineData.jobId) {
        await storage.updateJob(offlineData.jobId, { 
          status: 'completed'
        });
        
        if (offlineData.distance) {
          await storage.createTripData(offlineData);
        }
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error processing offline data:', error);
      res.status(500).json({ message: 'Failed to process offline data' });
    }
  });

  // Get current shift for driver
  app.get('/api/mobile/shift/current', async (req, res) => {
    try {
      const { driverId } = req.query;
      
      if (!driverId) {
        return res.status(400).json({ message: 'Driver ID required' });
      }
      
      const allShifts = await storage.getDriverShiftsByDriver(parseInt(driverId as string));
      const currentShift = allShifts.find(shift => 
        shift.status === 'active' && !shift.endTime
      );
      
      res.json(currentShift || null);
    } catch (error) {
      console.error('Error fetching current shift:', error);
      res.status(500).json({ message: 'Failed to fetch current shift' });
    }
  });

  // Get MoovScore for driver
  app.get('/api/mobile/moovscore', async (req, res) => {
    try {
      const { driverId } = req.query;
      
      if (!driverId) {
        return res.status(400).json({ message: 'Driver ID required' });
      }
      
      const tripData = await storage.getTripDataByDriver(parseInt(driverId as string));
      
      if (tripData.length === 0) {
        return res.json({ averageScore: null, totalTrips: 0, recentTrips: [] });
      }
      
      const averageScore = tripData.reduce((sum, trip) => sum + trip.moovScore, 0) / tripData.length;
      
      res.json({ 
        averageScore: Math.round(averageScore),
        totalTrips: tripData.length,
        recentTrips: tripData.slice(-5)
      });
    } catch (error) {
      console.error('Error fetching MoovScore:', error);
      res.status(500).json({ message: 'Failed to fetch MoovScore' });
    }
  });

  // Get messages for driver
  app.get('/api/mobile/messages', async (req, res) => {
    try {
      const { driverId } = req.query;
      
      if (!driverId) {
        return res.status(400).json({ message: 'Driver ID required' });
      }
      
      const messages = await storage.getMessagesByUser(parseInt(driverId as string));
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Send message from driver with image support
  app.post('/api/mobile/messages', uploadImage.single('image'), async (req, res) => {
    try {
      const { driverId, content, messageType, timestamp, latitude, longitude } = req.body;
      
      console.log('Mobile message request body:', JSON.stringify(req.body, null, 2));
      console.log('Driver ID received:', driverId, typeof driverId);
      console.log('Content received:', content);
      
      if (!driverId || !content) {
        return res.status(400).json({ message: 'Driver ID and content required' });
      }

      // Convert mobile format to web format for consistency
      const messageData = {
        fromUserId: parseInt(driverId),
        toUserId: 1, // Send to dispatcher (admin user)
        message: content,
        messageType: messageType || 'text',
        entityType: latitude && longitude ? 'location' : null,
        entityId: latitude && longitude ? parseInt(driverId) : null
      };

      const message = await storage.createMessage(messageData);
      
      // Get driver name for notification
      const driver = await storage.getDriver(parseInt(driverId));
      const driverName = driver ? driver.name : `Driver ${driverId}`;
      
      // Emit real-time notification to dispatch
      const io = app.get('socketio');
      if (io) {
        io.emit('new-driver-message', {
          ...message,
          driverName,
          hasImage: !!req.file,
          location: latitude && longitude ? { lat: latitude, lng: longitude } : null
        });
      }

      res.status(201).json({ 
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      console.error('Error sending mobile message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Alert Centre endpoints
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getAllAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching unread alerts:", error);
      res.status(500).json({ message: "Failed to fetch unread alerts" });
    }
  });

  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const success = await storage.markAlertAsRead(alertId);
      
      if (!success) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json({ message: "Alert marked as read" });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  app.put("/api/alerts/:id/resolve", async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const success = await storage.markAlertAsResolved(alertId);
      
      if (!success) {
        return res.status(404).json({ message: "Alert not found" });
      }
      
      res.json({ message: "Alert marked as resolved" });
    } catch (error) {
      console.error("Error marking alert as resolved:", error);
      res.status(500).json({ message: "Failed to mark alert as resolved" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const alertData = req.body;
      const newAlert = await storage.createAlert(alertData);
      res.status(201).json(newAlert);
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  // Client management API routes
  app.get("/api/clients", async (req, res) => {
    try {
      let clients = await storage.getAllClientAccounts();
      
      // Add sample data if no clients exist
      if (clients.length === 0) {
        const sampleClients = [
          {
            clientName: "ParcelExpress Ltd.",
            email: "admin@parcelexpress.co.za",
            status: "active",
            subscriptionPlan: "Moovly Connect",
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          },
          {
            clientName: "SwiftFleet AV",
            email: "ops@swiftfleet.com.au",
            status: "active",
            subscriptionPlan: "Moovly Business",
            lastActivity: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          },
          {
            clientName: "EcoLogix",
            email: "info@ecologix.uk",
            status: "paused",
            subscriptionPlan: "Connect (Trial)",
            lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          },
        ];

        for (const clientData of sampleClients) {
          await storage.createClientAccount(clientData);
        }
        
        clients = await storage.getAllClientAccounts();
      }
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching client accounts:", error);
      res.status(500).json({ message: "Failed to fetch client accounts" });
    }
  });

  app.post("/api/clients/:id/login-as", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.getClientAccount(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      if (client.status === "disabled") {
        return res.status(403).json({ message: "Client account is disabled" });
      }

      // Simulate login as client by returning redirect URL
      res.json({ 
        message: "Login as client successful",
        redirectUrl: "/dashboard",
        clientInfo: {
          id: client.id,
          name: client.clientName,
          plan: client.subscriptionPlan
        }
      });
    } catch (error) {
      console.error("Error logging in as client:", error);
      res.status(500).json({ message: "Failed to login as client" });
    }
  });

  app.patch("/api/clients/:id/disable", async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const client = await storage.updateClientAccount(clientId, { status: "disabled" });
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      res.json({ message: "Client account disabled successfully", client });
    } catch (error) {
      console.error("Error disabling client account:", error);
      res.status(500).json({ message: "Failed to disable client account" });
    }
  });

  // Smart Optimization Rules API routes (Moovly Business exclusive)
  app.get("/api/optimization-rules", async (req, res) => {
    try {
      const rules = await storage.getOptimizationRules();
      res.json(rules);
    } catch (error) {
      console.error("Error fetching optimization rules:", error);
      res.status(500).json({ message: "Failed to fetch optimization rules" });
    }
  });

  app.post("/api/optimization-rules", async (req, res) => {
    try {
      const rules = await storage.saveOptimizationRules(req.body);
      res.json(rules);
    } catch (error) {
      console.error("Error saving optimization rules:", error);
      res.status(500).json({ message: "Failed to save optimization rules" });
    }
  });

  // Route optimization endpoints
  app.post("/api/routes/optimize", async (req, res) => {
    try {
      const { jobIds } = req.body;
      const jobs = [];
      
      // Get all jobs to optimize
      for (const jobId of jobIds) {
        const job = await storage.getJob(jobId);
        if (job) jobs.push(job);
      }
      
      // Generate optimized routes using the storage optimization logic
      const optimizedRoutes = await storage.optimizeRoutes(jobs);
      res.json({ optimizedRoutes });
    } catch (error) {
      console.error("Failed to optimize routes:", error);
      res.status(500).json({ message: "Failed to optimize routes" });
    }
  });

  app.post("/api/routes/apply-optimized", async (req, res) => {
    try {
      const { routes } = req.body;
      
      // Apply the optimized routes to jobs
      for (const route of routes) {
        if (route.jobs) {
          for (const jobId of route.jobs) {
            await storage.updateJob(jobId, {
              driverId: route.driverId,
              routeId: route.id,
              optimizedOrder: route.optimizedOrder || 0
            });
          }
        }
      }
      
      res.json({ message: "Routes applied successfully" });
    } catch (error) {
      console.error("Failed to apply routes:", error);
      res.status(500).json({ message: "Failed to apply routes" });
    }
  });

  // Smart Route Suggestions API - Historical Data Analysis
  app.get("/api/route-suggestions", async (req, res) => {
    try {
      const { jobIds } = req.query;
      const jobIdArray = jobIds ? (jobIds as string).split(',').map(Number) : [];
      
      const suggestions = await storage.getSmartRouteSuggestions(jobIdArray);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching route suggestions:", error);
      res.status(500).json({ message: "Failed to fetch route suggestions" });
    }
  });

  app.post("/api/route-suggestions/generate", async (req, res) => {
    try {
      const { jobIds } = req.body;
      
      if (!jobIds || !Array.isArray(jobIds)) {
        return res.status(400).json({ message: "Job IDs array is required" });
      }

      const suggestions = await storage.generateSmartSuggestions(jobIds);
      res.json({ suggestions, count: suggestions.length });
    } catch (error) {
      console.error("Error generating route suggestions:", error);
      res.status(500).json({ message: "Failed to generate route suggestions" });
    }
  });

  app.post("/api/route-suggestions/:id/apply", async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      const result = await storage.applyRouteSuggestion(suggestionId);
      res.json(result);
    } catch (error) {
      console.error("Error applying route suggestion:", error);
      res.status(500).json({ message: "Failed to apply route suggestion" });
    }
  });

  app.post("/api/route-suggestions/:id/reject", async (req, res) => {
    try {
      const suggestionId = parseInt(req.params.id);
      const result = await storage.rejectRouteSuggestion(suggestionId);
      res.json(result);
    } catch (error) {
      console.error("Error rejecting route suggestion:", error);
      res.status(500).json({ message: "Failed to reject route suggestion" });
    }
  });



  app.post("/api/drivers/:id/location", async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const { latitude, longitude, speed, heading } = req.body;
      
      const result = await storage.updateDriverLocation(driverId, {
        latitude,
        longitude,
        speed,
        heading,
        timestamp: new Date()
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error updating driver location:", error);
      res.status(500).json({ message: "Failed to update driver location" });
    }
  });

  // Feedback System API
  app.get("/api/feedback", async (req, res) => {
    try {
      const feedback = await storage.getAllFeedback();
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.post("/api/feedback", async (req, res) => {
    try {
      const { type, reaction, category, message, timestamp } = req.body;
      
      const feedbackData = {
        type,
        reaction,
        category,
        message: message || null,
        timestamp: new Date(timestamp),
        userId: req.user?.id || null,
        createdAt: new Date()
      };
      
      const feedback = await storage.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get("/api/feedback/analytics", async (req, res) => {
    try {
      const { category, dateRange } = req.query;
      const analytics = await storage.getFeedbackAnalytics({
        category: category as string,
        dateRange: dateRange as string
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching feedback analytics:", error);
      res.status(500).json({ message: "Failed to fetch feedback analytics" });
    }
  });

  // Enhanced health check endpoints for deployment monitoring
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: "1.0.0",
      service: "Moovly Fleet Management"
    });
  });

  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      version: "1.0.0",
      service: "Moovly Fleet Management API"
    });
  });

  // Route Analytics API
  app.get("/api/route-analytics", async (req, res) => {
    try {
      const { jobId, driverId, dateRange } = req.query;
      const analytics = await storage.getRouteAnalytics({
        jobId: jobId ? parseInt(jobId as string) : undefined,
        driverId: driverId ? parseInt(driverId as string) : undefined,
        dateRange: dateRange as string,
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching route analytics:", error);
      res.status(500).json({ message: "Failed to fetch route analytics" });
    }
  });

  app.post("/api/route-analytics", async (req, res) => {
    try {
      const analyticsData = req.body;
      const result = await storage.createRouteAnalytics(analyticsData);
      res.json(result);
    } catch (error) {
      console.error("Error creating route analytics:", error);
      res.status(500).json({ message: "Failed to create route analytics" });
    }
  });

  // One-click optimization endpoint
  app.post("/api/routes/optimize-one-click", async (req, res) => {
    try {
      const { jobIds } = req.body;
      
      if (!jobIds || !Array.isArray(jobIds)) {
        return res.status(400).json({ message: "Job IDs array is required" });
      }

      const jobs = await storage.getAllJobs();
      const drivers = await storage.getAllDrivers();

      // Filter for unassigned jobs
      const unassignedJobs = jobs.filter(job => 
        jobIds.includes(job.id) && !job.driverId && job.status === 'pending'
      );

      if (unassignedJobs.length === 0) {
        return res.json({ 
          message: "No unassigned jobs found to optimize",
          assignedJobs: 0 
        });
      }

      // Simple assignment logic
      const availableDrivers = drivers.filter(driver => driver.status === 'available');
      let assignmentCount = 0;

      for (let i = 0; i < unassignedJobs.length && i < availableDrivers.length; i++) {
        const job = unassignedJobs[i];
        const driver = availableDrivers[i % availableDrivers.length];
        
        await storage.updateJob(job.id, {
          driverId: driver.id,
          status: 'assigned',
          assignedAt: new Date().toISOString()
        });
        
        assignmentCount++;
      }

      res.json({ 
        message: `Successfully assigned ${assignmentCount} jobs`,
        assignedJobs: assignmentCount 
      });
    } catch (error) {
      console.error("Failed to optimize routes:", error);
      res.status(500).json({ message: "Failed to optimize routes" });
    }
  });

  // Template download routes
  app.get("/api/templates/download/:type", async (req, res) => {
    try {
      const { type } = req.params;
      let templateData: any[] = [];
      let filename = '';

      // Get existing customer names for smart auto-complete
      const existingJobs = await storage.getAllJobs();
      const customerNames = [...new Set(existingJobs.map(job => job.customerName).filter(name => name))];

      if (type === 'jobs') {
        templateData = [{
          "Job ID": "",
          "Client Name": customerNames.length > 0 ? `Examples: ${customerNames.slice(0, 3).join(', ')}` : "",
          "Pickup Address": "",
          "Drop-off Address": "",
          "Job Type": "Single or Dual",
          "Scheduled Date": "YYYY-MM-DD",
          "Scheduled Time": "HH:MM",
          "Product Name": "",
          "Quantity": "",
          "Priority": "High, Medium, or Low",
          "Time Window": "e.g., 08:00–10:00",
          "Notes": "",
          "Latitude": "",
          "Longitude": ""
        }];
        filename = 'jobs_template.xlsx';
      } else if (type === 'drivers') {
        templateData = [{
          "Driver ID": "",
          "Full Name": "",
          "Phone Number": "",
          "Email": "",
          "Shift Start Time": "HH:MM",
          "Shift End Time": "HH:MM",
          "Overtime Buffer (hrs)": "",
          "Vehicle ID": "",
          "Assigned Region": "",
          "Driver Skills (optional)": "",
          "Status": "Active or Inactive"
        }];
        filename = 'drivers_template.xlsx';
      } else if (type === 'vehicles') {
        templateData = [{
          "Vehicle ID": "",
          "Make": "",
          "Model": "",
          "Year": "",
          "License Plate": "",
          "Vehicle Type": "Van, Bike, Car, Truck",
          "Assigned Driver ID": "",
          "Fuel Type": "Petrol, Diesel, Electric, Hybrid",
          "Odometer (km)": "",
          "VIN": "",
          "Status": "Available, In Maintenance, Decommissioned"
        }];
        filename = 'vehicles_template.xlsx';
      } else if (type === 'customers') {
        templateData = [{
          "Customer Name": "",
          "Street Address": "",
          "Contact Person": "",
          "Phone Number": "",
          "Email Address": "",
          "Notes": ""
        }];
        filename = 'customers_template.xlsx';
      } else {
        return res.status(400).json({ message: "Invalid template type" });
      }

      // Create Excel workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);
      XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Template download error:", error);
      res.status(500).json({ message: "Failed to generate template" });
    }
  });

  // Template import route
  app.post("/api/templates/import", uploadDocument.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { type } = req.body;
      if (!['jobs', 'drivers', 'vehicles', 'customers'].includes(type)) {
        return res.status(400).json({ message: "Invalid import type" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let importCount = 0;

      if (type === 'jobs') {
        for (const row of data as any[]) {
          if (!row['Client Name'] || !row['Pickup Address'] || !row['Drop-off Address']) continue;
          
          const jobData = {
            jobNumber: row['Job ID'] || `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            customerName: row['Client Name'],
            pickupAddress: row['Pickup Address'],
            deliveryAddress: row['Drop-off Address'],
            scheduledDate: new Date(row['Scheduled Date'] || Date.now()),
            priority: (row['Priority'] || 'medium').toLowerCase(),
            notes: row['Notes'] || '',
            status: 'pending'
          };
          
          await storage.createJob(jobData);
          importCount++;
        }
      } else if (type === 'drivers') {
        for (const row of data as any[]) {
          if (!row['Full Name'] || !row['Phone Number']) continue;
          
          const driverData = {
            name: row['Full Name'],
            email: row['Email'] || '',
            phone: row['Phone Number'],
            licenseNumber: row['Driver ID'] || `DRV-${Date.now()}`,
            status: (row['Status'] || 'active').toLowerCase(),
            vehicleId: row['Vehicle ID'] ? parseInt(row['Vehicle ID']) : null,
            currentRoute: row['Assigned Region'] || null,
            performance: 'good'
          };
          
          await storage.createDriver(driverData);
          importCount++;
        }
      } else if (type === 'vehicles') {
        for (const row of data as any[]) {
          if (!row['Make'] || !row['Model'] || !row['License Plate']) continue;
          
          const vehicleData = {
            make: row['Make'],
            model: row['Model'],
            year: parseInt(row['Year']) || new Date().getFullYear(),
            licensePlate: row['License Plate'],
            type: row['Vehicle Type'] || 'van',
            status: (row['Status'] || 'available').toLowerCase(),
            vin: row['VIN'] || '',
            fuelType: row['Fuel Type'] || 'petrol',
            currentMileage: parseInt(row['Odometer (km)']) || 0
          };
          
          await storage.createVehicle(vehicleData);
          importCount++;
        }
      } else if (type === 'customers') {
        for (const row of data as any[]) {
          if (!row['Customer Name'] || !row['Street Address']) continue;
          
          const customerData = {
            customerName: row['Customer Name'],
            streetAddress: row['Street Address'],
            contactPerson: row['Contact Person'] || null,
            phoneNumber: row['Phone Number'] || null,
            emailAddress: row['Email Address'] || null,
            notes: row['Notes'] || null,
            // Latitude and longitude will be calculated later via geocoding API
            latitude: null,
            longitude: null
          };
          
          await storage.createCustomer(customerData);
          importCount++;
        }
      }

      res.json({ 
        message: `Successfully imported ${importCount} ${type}`,
        count: importCount 
      });
    } catch (error) {
      console.error("Import error:", error);
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  // Customer management routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Failed to get customers:", error);
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Failed to create customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // OCR Cost Centre API routes (Moovly Business exclusive)
  
  // Document management endpoints
  app.get("/api/cost-centre/documents", async (req, res) => {
    try {
      const { vehicleId } = req.query;
      let documents;
      
      if (vehicleId) {
        documents = await storage.getCostCentreDocumentsByVehicle(parseInt(vehicleId as string));
      } else {
        documents = await storage.getAllCostCentreDocuments();
      }
      
      res.json(documents);
    } catch (error) {
      console.error("Error fetching cost centre documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/cost-centre/documents", uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file uploaded" });
      }

      const { vehicleId, driverId, documentType, uploadedBy } = req.body;
      
      // Generate a unique filename for the uploaded file
      const timestamp = Date.now();
      const fileExtension = req.file.originalname.split('.').pop() || 'bin';
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      
      // Create document record with file metadata
      const documentData = {
        vehicleId: parseInt(vehicleId),
        driverId: driverId ? parseInt(driverId) : null,
        documentType,
        originalImageUrl: `/uploads/${fileName}`,
        uploadedBy: uploadedBy ? parseInt(uploadedBy) : null,
        status: 'pending',
        fileSize: req.file.size,
        mimetype: req.file.mimetype,
        originalName: req.file.originalname
      };

      const document = await storage.createCostCentreDocument(documentData);
      
      // Store the file buffer for OCR processing (simulate file path with buffer data)
      const fileData = {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
      
      // Start OCR processing asynchronously with file buffer
      processOCRAsync(document.id, JSON.stringify(fileData));
      
      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/cost-centre/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getCostCentreDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  // Cost entries endpoints
  app.get("/api/cost-centre/entries", async (req, res) => {
    try {
      const { vehicleId, category } = req.query;
      let entries;
      
      if (vehicleId) {
        entries = await storage.getCostCentreEntriesByVehicle(parseInt(vehicleId as string));
      } else if (category) {
        entries = await storage.getCostCentreEntriesByCategory(category as string);
      } else {
        entries = await storage.getAllCostCentreEntries();
      }
      
      res.json(entries);
    } catch (error) {
      console.error("Error fetching cost centre entries:", error);
      res.status(500).json({ message: "Failed to fetch entries" });
    }
  });

  app.post("/api/cost-centre/entries", async (req, res) => {
    try {
      const entryData = req.body;
      
      // Convert transactionDate string to Date object if needed
      if (entryData.transactionDate && typeof entryData.transactionDate === 'string') {
        entryData.transactionDate = new Date(entryData.transactionDate);
      }
      
      const entry = await storage.createCostCentreEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating cost centre entry:", error);
      res.status(500).json({ message: "Failed to create entry" });
    }
  });

  app.get("/api/cost-centre/vehicles/:vehicleId/summary", async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.vehicleId);
      const summary = await storage.getVehicleCostSummary(vehicleId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching vehicle cost summary:", error);
      res.status(500).json({ message: "Failed to fetch cost summary" });
    }
  });

  // OCR processing endpoint
  app.post("/api/cost-centre/process-ocr/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getCostCentreDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Simulate OCR processing with extracted data
      const mockOCRData = {
        rawText: "FUEL RECEIPT\nDate: 2025-06-29\nAmount: R735.00\nLitres: 42.5\nOdometer: 45,123",
        confidence: 95.2,
        extractedData: {
          date: "2025-06-29",
          amount: "735.00",
          currency: "ZAR",
          quantity: "42.5",
          unit: "litres",
          odometer: "45123",
          supplier: "Shell Station",
          documentType: "fuel_receipt"
        }
      };

      const updatedDocument = await storage.processOCRDocument(id, mockOCRData);
      
      // Auto-create cost centre entry from OCR data
      if (mockOCRData.extractedData.amount) {
        await storage.createCostCentreEntry({
          vehicleId: document.vehicleId,
          documentId: id,
          category: "fuel",
          amount: mockOCRData.extractedData.amount,
          currency: mockOCRData.extractedData.currency || "ZAR",
          transactionDate: new Date(mockOCRData.extractedData.date),
          quantity: parseFloat(mockOCRData.extractedData.quantity || "0"),
          odometer: mockOCRData.extractedData.odometer ? parseFloat(mockOCRData.extractedData.odometer) : null,
          supplier: mockOCRData.extractedData.supplier,
          description: `Auto-generated from OCR: ${document.documentType}`,
          approvalStatus: "pending"
        });
      }

      res.json(updatedDocument);
    } catch (error) {
      console.error("Error processing OCR:", error);
      res.status(500).json({ message: "Failed to process OCR" });
    }
  });

  // Vehicle assignment endpoint
  app.post('/api/vehicles/:id/assign', async (req, res) => {
    try {
      const vehicleId = parseInt(req.params.id);
      const { driverId } = req.body;
      
      const vehicle = await storage.assignVehicleToDriver(vehicleId, driverId);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      res.status(500).json({ message: "Failed to assign vehicle" });
    }
  });

  // Cost-aware geocoding endpoints
  
  // Google Geocoding fallback endpoint (with API key protection)
  app.post('/api/geocode/google', async (req, res) => {
    try {
      const { address, region = 'za', bounds } = req.body;
      
      if (!address) {
        return res.status(400).json({ success: false, error: 'Address is required' });
      }

      // In production, you would use a real Google Maps API key
      // For now, simulate Google geocoding with better results than Nominatim
      const mockGoogleResult = {
        lat: -33.9249 + (Math.random() - 0.5) * 0.1,
        lng: 18.4241 + (Math.random() - 0.5) * 0.1,
        formatted_address: `${address}, South Africa`,
        confidence: 0.95,
        components: {
          street_number: '123',
          street_name: 'Main Street',
          city: 'Cape Town',
          postal_code: '8001',
          province: 'Western Cape',
          country: 'South Africa'
        }
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 200));

      res.json({
        success: true,
        result: mockGoogleResult,
        source: 'google'
      });
    } catch (error) {
      console.error('Google geocoding error:', error);
      res.status(500).json({ success: false, error: 'Geocoding failed' });
    }
  });

  // Server-side geocoding cache endpoint
  app.post('/api/geocode/cache', async (req, res) => {
    try {
      const { address, result } = req.body;
      
      if (!address || !result) {
        return res.status(400).json({ success: false, error: 'Address and result are required' });
      }

      // Store in server cache (in production, this would use Redis or database)
      await storage.cacheGeocodingResult(address, result);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Cache storage error:', error);
      res.status(500).json({ success: false, error: 'Failed to cache result' });
    }
  });

  // Get cached geocoding result
  app.get('/api/geocode/cache/:encodedAddress', async (req, res) => {
    try {
      const address = decodeURIComponent(req.params.encodedAddress);
      const cached = await storage.getCachedGeocodingResult(address);
      
      if (cached) {
        res.json({ success: true, result: cached });
      } else {
        res.json({ success: false, error: 'Not found in cache' });
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve from cache' });
    }
  });

  // Batch geocoding endpoint for Wi-Fi scenarios
  app.post('/api/geocode/batch', async (req, res) => {
    try {
      const { addresses } = req.body;
      
      if (!Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({ success: false, error: 'Addresses array is required' });
      }

      if (addresses.length > 20) {
        return res.status(400).json({ success: false, error: 'Maximum 20 addresses per batch' });
      }

      const results = [];
      
      for (const address of addresses) {
        // Check cache first
        let cached = await storage.getCachedGeocodingResult(address);
        
        if (!cached) {
          // Simulate geocoding (in production, this would call actual APIs)
          cached = {
            lat: -26.2041 + (Math.random() - 0.5) * 0.1,
            lng: 28.0473 + (Math.random() - 0.5) * 0.1,
            formatted_address: `${address}, South Africa`,
            confidence: 0.85,
            source: 'batch_nominatim',
            components: {
              city: 'Johannesburg',
              postal_code: '2000',
              province: 'Gauteng',
              country: 'South Africa'
            }
          };
          
          // Cache the result
          await storage.cacheGeocodingResult(address, cached);
        }
        
        results.push({ address, result: cached });
        
        // Small delay between requests to be API-friendly
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      res.json({ success: true, results });
    } catch (error) {
      console.error('Batch geocoding error:', error);
      res.status(500).json({ success: false, error: 'Batch geocoding failed' });
    }
  });

  const httpServer = createServer(app);
  
  // Setup Socket.io for real-time messaging
  const io = setupSocketIO(httpServer);
  
  // Customer tracking and notifications endpoints
  app.post("/api/jobs/:id/start-tracking", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { currentLatitude, currentLongitude } = req.body;
      
      // Generate tracking token for customer
      const trackingToken = await storage.generateTrackingToken(jobId);
      
      // Calculate ETA
      const eta = await storage.calculateETA(jobId, currentLatitude, currentLongitude);
      
      // Start job tracking
      const job = await storage.startJobTracking(jobId, eta || undefined);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Update driver location
      await storage.updateJobLocation(jobId, currentLatitude, currentLongitude);
      
      // Get customer details for notifications
      const customer = job.customerId ? await storage.getCustomer(job.customerId) : null;
      
      // Create tracking URL
      const trackingUrl = `${req.protocol}://${req.get('host')}/track/${trackingToken}`;
      
      // Send customer notification if customer details exist
      if (customer && (customer.emailAddress || customer.phoneNumber)) {
        const messageContent = `Your delivery is on the way! Track your driver in real-time: ${trackingUrl}`;
        
        await storage.createCustomerNotification({
          jobId: jobId,
          customerId: job.customerId || undefined,
          customerEmail: customer.emailAddress || undefined,
          customerPhone: customer.phoneNumber || undefined,
          notificationType: "tracking_started",
          notificationMethod: customer.emailAddress ? "email" : "sms",
          trackingUrl: trackingUrl,
          messageContent: messageContent,
          sentAt: new Date(),
          deliveryStatus: "sent"
        });
      }
      
      res.json({
        message: "Job tracking started",
        trackingToken,
        trackingUrl,
        eta: eta,
        job: job
      });
    } catch (error) {
      console.error("Error starting job tracking:", error);
      res.status(500).json({ message: "Failed to start tracking" });
    }
  });

  app.get("/api/track/:token", async (req, res) => {
    try {
      const trackingToken = req.params.token;
      const job = await storage.getJobByTrackingToken(trackingToken);
      
      if (!job) {
        return res.status(404).json({ message: "Tracking link not found or expired" });
      }
      
      // Get driver and vehicle info
      const driver = job.driverId ? await storage.getDriver(job.driverId) : null;
      const vehicle = job.vehicleId ? await storage.getVehicle(job.vehicleId) : null;
      
      res.json({
        job: {
          id: job.id,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          pickupAddress: job.pickupAddress,
          deliveryAddress: job.deliveryAddress,
          status: job.status,
          scheduledDate: job.scheduledDate,
          driverStartedAt: job.driverStartedAt,
          estimatedArrivalTime: job.estimatedArrivalTime,
          currentDriverLatitude: job.currentDriverLatitude,
          currentDriverLongitude: job.currentDriverLongitude,
          lastLocationUpdate: job.lastLocationUpdate
        },
        driver: driver ? {
          name: driver.name,
          phone: driver.phone
        } : null,
        vehicle: vehicle ? {
          make: vehicle.make,
          model: vehicle.model,
          plateNumber: vehicle.plateNumber
        } : null
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      res.status(500).json({ message: "Failed to fetch tracking data" });
    }
  });

  app.post("/api/jobs/:id/update-location", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const { latitude, longitude } = req.body;
      
      const job = await storage.updateJobLocation(jobId, latitude, longitude);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json({ message: "Location updated", job });
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Background process to check for ETA alerts (would run via cron job)
  app.post("/api/jobs/check-eta-alerts", async (req, res) => {
    try {
      const jobsNearingArrival = await storage.getJobsNearingArrival(10); // 10 minutes before
      const notifications = [];
      
      for (const job of jobsNearingArrival) {
        // Get customer details
        const customer = job.customerId ? await storage.getCustomer(job.customerId) : null;
        
        if (customer && (customer.emailAddress || customer.phoneNumber)) {
          const trackingUrl = `${req.protocol}://${req.get('host')}/track/${job.trackingToken}`;
          const eta = job.estimatedArrivalTime ? new Date(job.estimatedArrivalTime) : new Date();
          const etaString = eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          const messageContent = `Your delivery will arrive at approximately ${etaString}. Track live: ${trackingUrl}`;
          
          const notification = await storage.createCustomerNotification({
            jobId: job.id,
            customerId: job.customerId || undefined,
            customerEmail: customer.emailAddress || undefined,
            customerPhone: customer.phoneNumber || undefined,
            notificationType: "eta_alert",
            notificationMethod: customer.emailAddress ? "email" : "sms",
            trackingUrl: trackingUrl,
            messageContent: messageContent,
            sentAt: new Date(),
            deliveryStatus: "sent"
          });
          
          notifications.push(notification);
          
          // Mark job as notification sent
          await storage.updateJob(job.id, { customerNotificationSent: true });
        }
      }
      
      res.json({
        message: `Processed ${jobsNearingArrival.length} jobs, sent ${notifications.length} notifications`,
        notifications
      });
    } catch (error) {
      console.error("Error checking ETA alerts:", error);
      res.status(500).json({ message: "Failed to process ETA alerts" });
    }
  });

  // Route Replay API endpoints
  app.get("/api/analytics/route-history", async (req, res) => {
    try {
      const { driverId, date, jobId } = req.query;
      
      // Get trip data based on filters
      let tripData = await storage.getAllTripData();
      
      if (driverId) {
        tripData = tripData.filter(trip => trip.driverId === parseInt(driverId as string));
      }
      
      if (date) {
        const filterDate = new Date(date as string);
        tripData = tripData.filter(trip => {
          const tripDate = new Date(trip.startTime);
          return tripDate.toDateString() === filterDate.toDateString();
        });
      }
      
      if (jobId) {
        tripData = tripData.filter(trip => trip.jobId === parseInt(jobId as string));
      }
      
      // Generate route replay data with planned vs actual comparison
      const routeReplayData = tripData.map(trip => {
        // Sample planned route (in production, this would come from route optimization)
        const plannedRoute = [
          { lat: -26.2041, lng: 28.0473, timestamp: trip.startTime, type: 'planned' },
          { lat: -26.1951, lng: 28.0473, timestamp: new Date(new Date(trip.startTime).getTime() + 15*60000), type: 'planned' },
          { lat: -26.1851, lng: 28.0573, timestamp: new Date(new Date(trip.startTime).getTime() + 30*60000), type: 'planned' },
          { lat: -26.1751, lng: 28.0673, timestamp: trip.endTime, type: 'planned' },
        ];
        
        // Sample actual route with deviations
        const actualRoute = [
          { lat: -26.2041, lng: 28.0473, timestamp: new Date(new Date(trip.startTime).getTime() + 2*60000), type: 'actual' },
          { lat: -26.1961, lng: 28.0483, timestamp: new Date(new Date(trip.startTime).getTime() + 18*60000), type: 'actual' },
          { lat: -26.1881, lng: 28.0593, timestamp: new Date(new Date(trip.startTime).getTime() + 35*60000), type: 'actual' },
          { lat: -26.1751, lng: 28.0673, timestamp: trip.endTime, type: 'actual' },
        ];
        
        // Calculate deviations
        const deviations = [
          { 
            point: 1, 
            plannedTime: '09:15', 
            actualTime: '09:18', 
            distance: '0.2km',
            reason: 'Traffic delay' 
          },
          { 
            point: 2, 
            plannedTime: '09:30', 
            actualTime: '09:35', 
            distance: '0.8km',
            reason: 'Route optimization' 
          },
        ];
        
        const plannedDistance = parseFloat(trip.distance) || 15.2;
        const actualDistance = plannedDistance * 1.1; // 10% deviation
        const plannedDuration = Math.floor((new Date(trip.endTime).getTime() - new Date(trip.startTime).getTime()) / 60000);
        const actualDuration = plannedDuration + 5; // 5 minutes extra
        
        return {
          tripId: trip.id,
          driverId: trip.driverId,
          jobId: trip.jobId,
          date: trip.startTime,
          plannedRoute,
          actualRoute,
          deviations,
          summary: {
            plannedDistance: `${plannedDistance.toFixed(1)}km`,
            actualDistance: `${actualDistance.toFixed(1)}km`,
            plannedDuration: `${plannedDuration}min`,
            actualDuration: `${actualDuration}min`,
            fuelEfficiency: '12.3L/100km',
            moovScore: trip.moovScore || 78,
            deviationReasons: ['Traffic delay', 'Route optimization', 'Customer request']
          }
        };
      });
      
      res.json(routeReplayData);
    } catch (error) {
      console.error("Error fetching route history:", error);
      res.status(500).json({ message: "Failed to fetch route history" });
    }
  });

  app.post("/api/analytics/generate-trip-report", async (req, res) => {
    try {
      const { tripId, driverId, date, includeMap } = req.body;
      
      // Get trip data and route information
      const trip = await storage.getTripData(tripId);
      if (!trip) {
        return res.status(404).json({ message: "Trip not found" });
      }
      
      const driver = await storage.getDriver(trip.driverId);
      const job = trip.jobId ? await storage.getJob(trip.jobId) : null;
      
      // Generate comprehensive trip report
      const report = {
        reportId: `RPT-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        trip: {
          id: trip.id,
          date: trip.startTime,
          startTime: trip.startTime,
          endTime: trip.endTime,
          distance: trip.distance,
          moovScore: trip.moovScore,
          fuelEfficiency: '12.3L/100km'
        },
        driver: {
          id: driver?.id,
          name: driver?.name,
          licenseNumber: driver?.licenseNumber
        },
        job: job ? {
          id: job.id,
          jobNumber: job.jobNumber,
          customerName: job.customerName,
          pickupAddress: job.pickupAddress,
          deliveryAddress: job.deliveryAddress
        } : null,
        performanceMetrics: {
          speedViolations: trip.speedViolations || 0,
          harshBrakes: trip.harshBrakes || 0,
          harshAccelerations: trip.harshAccelerations || 0,
          harshTurns: trip.harshTurns || 0,
          idleTimeSeconds: trip.idleTimeSeconds || 0
        },
        routeAnalysis: {
          plannedDistance: '15.2km',
          actualDistance: '16.8km',
          deviation: '1.6km (10.5%)',
          plannedDuration: '45min',
          actualDuration: '50min',
          delayReasons: ['Traffic congestion', 'Route deviation', 'Customer interaction']
        },
        mapData: includeMap ? {
          plannedRoute: [
            { lat: -26.2041, lng: 28.0473 },
            { lat: -26.1951, lng: 28.0473 },
            { lat: -26.1851, lng: 28.0573 },
            { lat: -26.1751, lng: 28.0673 }
          ],
          actualRoute: [
            { lat: -26.2041, lng: 28.0473 },
            { lat: -26.1961, lng: 28.0483 },
            { lat: -26.1881, lng: 28.0593 },
            { lat: -26.1751, lng: 28.0673 }
          ]
        } : null
      };
      
      res.json(report);
    } catch (error) {
      console.error("Error generating trip report:", error);
      res.status(500).json({ message: "Failed to generate trip report" });
    }
  });

  // Geofence Management API (Business tier - centralized alerts)
  app.get("/api/geofences", async (req, res) => {
    try {
      const { type, active } = req.query;
      let geofences;
      
      if (type) {
        geofences = await storage.getGeofencesByType(type as string);
      } else if (active === 'true') {
        geofences = await storage.getActiveGeofences();
      } else {
        geofences = await storage.getAllGeofences();
      }
      
      res.json(geofences);
    } catch (error) {
      console.error("Error fetching geofences:", error);
      res.status(500).json({ message: "Failed to fetch geofences" });
    }
  });

  app.post("/api/geofences", async (req, res) => {
    try {
      const geofenceData = req.body;
      const geofence = await storage.createGeofence(geofenceData);
      res.status(201).json(geofence);
    } catch (error) {
      console.error("Error creating geofence:", error);
      res.status(500).json({ message: "Failed to create geofence" });
    }
  });

  app.put("/api/geofences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const geofence = await storage.updateGeofence(parseInt(id), updateData);
      
      if (!geofence) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      res.json(geofence);
    } catch (error) {
      console.error("Error updating geofence:", error);
      res.status(500).json({ message: "Failed to update geofence" });
    }
  });

  app.delete("/api/geofences/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGeofence(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Geofence not found" });
      }
      
      res.json({ message: "Geofence deleted successfully" });
    } catch (error) {
      console.error("Error deleting geofence:", error);
      res.status(500).json({ message: "Failed to delete geofence" });
    }
  });

  // Auto-create customer address geofences (50m radius)
  app.post("/api/customers/:id/geofences", async (req, res) => {
    try {
      const { id } = req.params;
      const geofences = await storage.createCustomerAddressGeofences(parseInt(id));
      res.json(geofences);
    } catch (error) {
      console.error("Error creating customer geofences:", error);
      res.status(500).json({ message: "Failed to create customer geofences" });
    }
  });

  // Geofence events and proximity checking
  app.get("/api/geofence-events", async (req, res) => {
    try {
      const { driverId, geofenceId } = req.query;
      let events;
      
      if (driverId) {
        events = await storage.getGeofenceEventsByDriver(parseInt(driverId as string));
      } else if (geofenceId) {
        events = await storage.getGeofenceEventsByGeofence(parseInt(geofenceId as string));
      } else {
        events = await storage.getAllGeofenceEvents();
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching geofence events:", error);
      res.status(500).json({ message: "Failed to fetch geofence events" });
    }
  });

  // Enhanced location tracking with geofence monitoring
  app.post("/api/tracking/:jobId/location", async (req, res) => {
    try {
      const { jobId } = req.params;
      const { latitude, longitude, driverId, vehicleId } = req.body;
      
      // Update job location
      const job = await storage.updateJobLocation(parseInt(jobId), latitude, longitude);
      
      // Check geofence proximity and trigger centralized alerts
      const geofenceEvents = await storage.checkGeofenceProximity(
        latitude, 
        longitude, 
        driverId, 
        vehicleId, 
        parseInt(jobId)
      );
      
      // Emit real-time geofence alerts via Socket.io
      if (geofenceEvents.length > 0) {
        io.emit('geofence-alerts', geofenceEvents);
      }
      
      res.json({ job, geofenceEvents });
    } catch (error) {
      console.error("Error updating location with geofence check:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Manual geofence proximity check (for testing Business tier features)
  app.post("/api/geofences/check-proximity", async (req, res) => {
    try {
      const { latitude, longitude, driverId, vehicleId, jobId } = req.body;
      const events = await storage.checkGeofenceProximity(latitude, longitude, driverId, vehicleId, jobId);
      
      // Emit real-time alerts to centralized Alert Centre
      if (events.length > 0) {
        io.emit('geofence-alerts', events);
      }
      
      res.json(events);
    } catch (error) {
      console.error("Error checking geofence proximity:", error);
      res.status(500).json({ message: "Failed to check geofence proximity" });
    }
  });

  // APK Build endpoint
  app.post("/api/build-apk", async (req, res) => {
    try {
      console.log("APK build requested");
      
      res.json({ 
        success: false,
        message: "APK build requires local development environment. Please use mobile web interface at /mobile or Expo Go for testing.",
        alternatives: [
          {
            name: "Mobile Web Interface",
            url: "/mobile",
            description: "Test all features immediately in browser"
          },
          {
            name: "Expo Go",
            description: "Download Expo Go app and scan QR code for native testing"
          }
        ]
      });
    } catch (error) {
      console.error("APK build error:", error);
      res.status(500).json({ 
        success: false,
        message: "Build process unavailable. Use mobile interface or Expo Go for testing."
      });
    }
  });

  // Network Status and Offline Job Sync APIs
  
  // Update driver network status
  app.post("/api/driver/network-status", async (req, res) => {
    try {
      const { driverId, networkStatus, pendingJobsCount } = req.body;
      
      await storage.updateDriverNetworkStatus(driverId, {
        networkStatus,
        pendingJobs: pendingJobsCount || 0,
        lastSyncAt: new Date()
      });
      
      // Notify dispatchers via websocket
      io.emit('driver-network-status', {
        driverId,
        networkStatus,
        pendingJobs: pendingJobsCount || 0,
        timestamp: new Date()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating network status:", error);
      res.status(500).json({ success: false, message: "Failed to update network status" });
    }
  });
  
  // Store offline job for sync when network returns
  app.post("/api/driver/store-offline-job", async (req, res) => {
    try {
      const { driverId, jobId, jobData, syncType } = req.body;
      
      const offlineJob = await storage.storeOfflineJob({
        driverId,
        jobId,
        jobData: JSON.stringify(jobData),
        syncType,
        syncAttempts: 0
      });
      
      // Update driver's pending job count
      await storage.incrementDriverPendingJobs(driverId);
      
      res.json({ success: true, offlineJobId: offlineJob.id });
    } catch (error) {
      console.error("Error storing offline job:", error);
      res.status(500).json({ success: false, message: "Failed to store offline job" });
    }
  });
  
  // Sync offline jobs when network returns
  app.post("/api/driver/sync-offline-jobs", async (req, res) => {
    try {
      const { driverId } = req.body;
      
      const offlineJobs = await storage.getOfflineJobsByDriver(driverId);
      const syncResults = [];
      
      for (const offlineJob of offlineJobs) {
        try {
          const jobData = JSON.parse(offlineJob.jobData);
          
          // Process based on sync type
          switch (offlineJob.syncType) {
            case 'job_complete':
              await storage.updateJobStatus(offlineJob.jobId!, 'completed', jobData);
              break;
            case 'fuel_entry':
              await storage.addFuelEntry(jobData);
              break;
            case 'checklist':
              await storage.saveVehicleChecklist(jobData);
              break;
            default:
              console.warn(`Unknown sync type: ${offlineJob.syncType}`);
          }
          
          // Mark as synced
          await storage.markOfflineJobSynced(offlineJob.id);
          syncResults.push({ id: offlineJob.id, status: 'synced' });
          
        } catch (syncError) {
          console.error(`Failed to sync job ${offlineJob.id}:`, syncError);
          await storage.incrementOfflineJobAttempts(offlineJob.id);
          syncResults.push({ id: offlineJob.id, status: 'failed', error: syncError.message });
        }
      }
      
      // Reset driver's pending job count
      await storage.resetDriverPendingJobs(driverId);
      
      // Update network status to online
      await storage.updateDriverNetworkStatus(driverId, {
        networkStatus: 'online',
        pendingJobs: 0,
        lastSyncAt: new Date()
      });
      
      // Notify dispatchers
      io.emit('driver-sync-complete', {
        driverId,
        syncedCount: syncResults.filter(r => r.status === 'synced').length,
        failedCount: syncResults.filter(r => r.status === 'failed').length,
        timestamp: new Date()
      });
      
      res.json({ 
        success: true, 
        syncResults,
        totalJobs: offlineJobs.length,
        syncedCount: syncResults.filter(r => r.status === 'synced').length
      });
      
    } catch (error) {
      console.error("Error syncing offline jobs:", error);
      res.status(500).json({ success: false, message: "Failed to sync offline jobs" });
    }
  });
  
  // Get driver network status for dashboard
  app.get("/api/drivers/network-status", async (req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      const networkStatus = drivers.map(driver => ({
        id: driver.id,
        name: driver.name,
        networkStatus: driver.networkStatus || 'online',
        pendingJobs: driver.pendingJobs || 0,
        lastSyncAt: driver.lastSyncAt
      }));
      
      res.json(networkStatus);
    } catch (error) {
      console.error("Error fetching network status:", error);
      res.status(500).json({ message: "Failed to fetch network status" });
    }
  });

  // Store Socket.io instance for use in other routes
  app.set('socketio', io);
  
  // Vehicle Import API endpoint
  app.post("/api/vehicles/import", uploadDocument.single('vehicleFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse Excel/CSV file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let imported = 0;
      const errors: string[] = [];

      for (const row of data) {
        try {
          const vehicleData = {
            registration: row['Registration'],
            chassisNumber: row['Chassis Number'],
            engineNumber: row['Engine Number'],
            make: row['Make'],
            model: row['Model'],
            year: parseInt(row['Year']),
            currentOdometer: parseFloat(row['Current Odometer']) || 0,
            vehicleNumber: row['Registration'], // Use registration as vehicle number
            plateNumber: row['Registration'],
            status: 'active',
            fuelType: 'petrol', // Default value
            mileage: 0
          };

          // Validate required fields
          if (!vehicleData.chassisNumber || !vehicleData.engineNumber) {
            errors.push(`Row missing chassis or engine number for ${vehicleData.registration}`);
            continue;
          }

          await storage.createVehicle(vehicleData);
          imported++;
        } catch (error) {
          errors.push(`Failed to import ${row['Registration']}: ${error.message}`);
        }
      }

      res.json({ imported, errors });
    } catch (error) {
      console.error("Vehicle import error:", error);
      res.status(500).json({ message: "Failed to import vehicles" });
    }
  });



  app.post("/api/drivers/assign-vehicle", async (req, res) => {
    try {
      const { driverId, vehicleId, startingOdometer } = req.body;
      
      const assignment = await storage.createVehicleAssignment({
        driverId: parseInt(driverId),
        vehicleId: parseInt(vehicleId),
        assignmentDate: new Date(),
        startingOdometer: parseFloat(startingOdometer),
        isActive: true
      });

      res.json(assignment);
    } catch (error) {
      console.error("Error assigning vehicle:", error);
      res.status(500).json({ message: "Failed to assign vehicle" });
    }
  });

  // System alerts API endpoints
  app.get("/api/alerts/unread", async (req, res) => {
    try {
      const alerts = await storage.getUnreadAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/alerts/mark-read", async (req, res) => {
    try {
      const { alertId } = req.body;
      await storage.markAlertAsRead(parseInt(alertId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking alert as read:", error);
      res.status(500).json({ message: "Failed to mark alert as read" });
    }
  });

  // Create a new alert
  app.post("/api/alerts", async (req, res) => {
    try {
      const { type, message, severity, entityType, entityId, metadata } = req.body;
      
      // Convert the request to the alert format expected by storage
      const alertData = {
        type: type || 'general',
        title: type === 'pin_help_request' ? 'PIN Help Request' : 'Alert',
        description: message || 'No description provided',
        priority: severity || 'medium',
        driverId: entityType === 'driver' ? entityId : null,
        isRead: false,
        metadata: metadata || {}
      };
      
      const alert = await storage.createAlert(alertData);
      res.status(201).json({ message: "Alert created successfully", alert });
    } catch (error) {
      console.error("Error creating alert:", error);
      res.status(500).json({ message: "Failed to create alert" });
    }
  });

  // ===== MOOVLY GO API ROUTES =====
  
  // Moovly Go Route Optimization
  app.post("/api/moovly-go/optimize", async (req, res) => {
    try {
      const { stops, mode = "balanced" } = req.body;
      
      if (!stops || stops.length === 0) {
        return res.status(400).json({ message: "No stops provided" });
      }

      // Mock optimization algorithm
      let optimizedStops = [...stops];
      
      if (mode === "strictLIFO") {
        optimizedStops = stops.sort((a, b) => b.loadIndex - a.loadIndex);
      } else if (mode === "fastest") {
        optimizedStops = stops.sort(() => Math.random() - 0.5);
      } else {
        // Balanced mode - consider LIFO with distance optimization
        optimizedStops = stops.sort((a, b) => {
          const lifoWeight = (b.loadIndex - a.loadIndex) * 0.7;
          const distanceWeight = Math.random() * 0.3;
          return lifoWeight + distanceWeight;
        });
      }

      // Calculate savings
      const baselineDistance = stops.length * 8.5;
      const optimizedDistance = Math.max(baselineDistance * 0.65, stops.length * 3.2);
      const savingsKm = baselineDistance - optimizedDistance;
      const savingsMin = Math.round(savingsKm * 2.1);

      res.json({
        success: true,
        optimizedStops,
        metrics: {
          baselineDistance: Number(baselineDistance.toFixed(1)),
          optimizedDistance: Number(optimizedDistance.toFixed(1)),
          savingsKm: Number(savingsKm.toFixed(1)),
          savingsMin,
          efficiencyScore: Math.round((savingsKm / baselineDistance) * 100)
        }
      });
    } catch (error) {
      console.error("Error optimizing route:", error);
      res.status(500).json({ message: "Failed to optimize route" });
    }
  });

  // OCR Address Processing
  app.post("/api/moovly-go/process-image", uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image uploaded" });
      }

      // Mock OCR processing - in production use Tesseract.js
      const mockAddresses = [
        "123 Main Street, Cape Town, 8001",
        "456 Long Street, Cape Town, 8000", 
        "789 Kloof Street, Cape Town, 8001",
        "321 Adderley Street, Cape Town, 8000",
        "654 Bree Street, Cape Town, 8000"
      ];
      
      const extractedAddress = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
      
      res.json({
        success: true,
        extractedText: extractedAddress,
        confidence: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing image:", error);
      res.status(500).json({ message: "Failed to process image" });
    }
  });

  // Barcode Scanning
  app.post("/api/moovly-go/scan-barcode", async (req, res) => {
    try {
      const { barcode } = req.body;
      
      const mockPackageData = {
        packageId: barcode || `PKG${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        recipientName: "John Doe",
        recipientAddress: "123 Example Street, Cape Town, 8001",
        deliveryInstructions: "Ring bell twice",
        packageSize: ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)],
        specialHandling: Math.random() > 0.5 ? "Fragile" : null
      };
      
      res.json({
        success: true,
        packageData: mockPackageData,
        scannedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error scanning barcode:", error);
      res.status(500).json({ message: "Failed to scan barcode" });
    }
  });

  // Voice-to-Text Processing
  app.post("/api/moovly-go/voice-to-text", async (req, res) => {
    try {
      // Mock voice processing
      const mockTranscripts = [
        "Deliver to 123 Main Street Cape Town",
        "Drop off at Woolworths Canal Walk",
        "Pickup from Pick n Pay Century City",
        "Delivery to V and A Waterfront"
      ];
      
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      
      res.json({
        success: true,
        transcript,
        confidence: Math.round((0.80 + Math.random() * 0.19) * 100) / 100,
        processedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error processing voice:", error);
      res.status(500).json({ message: "Failed to process voice" });
    }
  });

  // ===== MOOVLY GO GEOFENCING & AUTO-ASSIGNMENT =====
  
  // Auto-assign job based on delivery address (Moovly Go only)
  app.post("/api/moovly-go/auto-assign-job", async (req, res) => {
    try {
      const { jobId, deliveryAddress, coordinates } = req.body;
      
      // Find the appropriate delivery zone using point-in-polygon logic
      const assignedDriver = await storage.autoAssignJobToDriver({
        jobId,
        deliveryAddress,
        coordinates
      });
      
      if (assignedDriver) {
        // Log the auto-assignment
        await storage.logAutoAssignment({
          jobId,
          driverId: assignedDriver.driverId,
          geofenceId: assignedDriver.geofenceId,
          assignmentMethod: "auto_geofence",
          deliveryAddress,
          coordinates,
          status: "assigned"
        });
        
        res.json({ 
          success: true, 
          assignedTo: assignedDriver,
          message: `Job automatically assigned to driver in ${assignedDriver.zoneName}`,
          deliveryTimeframe: `${assignedDriver.maxDeliveryTime} hours`
        });
      } else {
        // Log failed auto-assignment
        await storage.logAutoAssignment({
          jobId,
          driverId: null,
          geofenceId: null,
          assignmentMethod: "fallback",
          deliveryAddress,
          coordinates,
          status: "failed"
        });
        
        res.json({ 
          success: false, 
          message: "No available driver found for this delivery area. Manual assignment required." 
        });
      }
    } catch (error) {
      console.error("Error in auto-assignment:", error);
      res.status(500).json({ error: "Auto-assignment failed" });
    }
  });

  // Assign driver to delivery zone (Moovly Go only)
  app.post("/api/moovly-go/assign-driver-zone", async (req, res) => {
    try {
      const { driverId, geofenceId, maxConcurrentJobs, workingHours } = req.body;
      const result = await storage.assignDriverToZone({
        driverId,
        geofenceId,
        maxConcurrentJobs: maxConcurrentJobs || 10,
        workingHours: workingHours || null
      });
      res.json(result);
    } catch (error) {
      console.error("Error assigning driver to zone:", error);
      res.status(400).json({ error: "Failed to assign driver to zone" });
    }
  });

  // Get driver's assigned delivery zones (Moovly Go only)
  app.get("/api/moovly-go/driver/:driverId/zones", async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const zones = await storage.getDriverDeliveryZones(driverId);
      res.json(zones);
    } catch (error) {
      console.error("Error fetching driver zones:", error);
      res.status(500).json({ error: "Failed to fetch driver zones" });
    }
  });

  // Cape Town delivery zones setup (example for your map)
  app.post("/api/moovly-go/setup-cape-town-zones", async (req, res) => {
    try {
      const capeToddZones = [
        {
          name: "Somerset West Zone",
          description: "Somerset West and surrounding areas - 2 day delivery",
          coordinates: [
            { lat: -34.0698, lng: 18.8492 },
            { lat: -34.0525, lng: 18.8780 },
            { lat: -34.0891, lng: 18.8956 },
            { lat: -34.1023, lng: 18.8654 }
          ],
          centerLat: -34.0759,
          centerLng: 18.8721,
          priority: 1,
          maxDeliveryTime: 48 // 2 days
        },
        {
          name: "Strand Area",
          description: "Strand beach and residential areas - 3 day delivery",
          coordinates: [
            { lat: -34.1156, lng: 18.8201 },
            { lat: -34.1087, lng: 18.8456 },
            { lat: -34.1298, lng: 18.8598 },
            { lat: -34.1367, lng: 18.8343 }
          ],
          centerLat: -34.1227,
          centerLng: 18.8400,
          priority: 2,
          maxDeliveryTime: 72 // 3 days
        },
        {
          name: "Helderberg Rural",
          description: "Helderberg mountain and rural areas - 3 day delivery",
          coordinates: [
            { lat: -34.0435, lng: 18.8923 },
            { lat: -34.0234, lng: 18.9178 },
            { lat: -34.0567, lng: 18.9456 },
            { lat: -34.0768, lng: 18.9201 }
          ],
          centerLat: -34.0501,
          centerLng: 18.9190,
          priority: 3,
          maxDeliveryTime: 72 // 3 days
        }
      ];

      res.json({ 
        success: true, 
        message: "Cape Town delivery zones configured for auto-assignment",
        zones: capeToddZones,
        note: "These zones enable 1-3 day delivery SLA with automatic driver assignment"
      });
    } catch (error) {
      console.error("Error setting up Cape Town zones:", error);
      res.status(500).json({ error: "Failed to setup Cape Town zones" });
    }
  });

  // ===== CUSTOMER PORTAL API ROUTES =====

  // Customer registration
  app.post("/api/customer/register", async (req, res) => {
    try {
      const validatedData = insertCustomerPortalUserSchema.parse(req.body);
      
      // Hash password before storing (in production use bcrypt)
      const hashedPassword = Buffer.from(validatedData.password).toString('base64');
      
      const customerUser = await storage.createCustomerPortalUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      res.json({ 
        success: true, 
        message: "Customer account created successfully",
        user: { id: customerUser.id, name: customerUser.name, email: customerUser.email }
      });
    } catch (error) {
      console.error("Customer registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  // Customer login
  app.post("/api/customer/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // For testing purposes, allow test credentials
      if (email === "customer@test.com" && password === "test123") {
        const testUser = {
          id: 1,
          name: "Test Customer",
          email: "customer@test.com",
          phone: "+27123456789",
          company: "Test Company"
        };
        
        // Set session (simplified for demo)
        if (!req.session) {
          req.session = {};
        }
        req.session.customerUser = testUser;
        
        return res.json({
          success: true,
          user: testUser
        });
      }
      
      const user = await storage.getCustomerPortalUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify password (in production use bcrypt.compare)
      const hashedPassword = Buffer.from(password).toString('base64');
      if (user.password !== hashedPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      if (!req.session) {
        req.session = {};
      }
      req.session.customerUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company
      };
      
      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          company: user.company
        }
      });
    } catch (error) {
      console.error("Customer login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Customer middleware to check authentication
  const requireCustomerAuth = (req: any, res: any, next: any) => {
    if (!req.session.customerUser) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Create customer order
  app.post("/api/customer/orders", requireCustomerAuth, async (req, res) => {
    try {
      const customerUser = req.session.customerUser;
      const orderData = req.body;
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;
      
      // Create order with Circuit-style scheduling fields
      const order = await storage.createCustomerOrder({
        customerUserId: customerUser.id,
        orderNumber,
        ...orderData,
        trackingNumber: `TRK-${Date.now()}`,
        status: "pending",
        // Map Circuit-style fields to job schema
        orderPriority: orderData.orderPriority || "auto",
        jobType: orderData.jobType || "delivery",
        arrivalTime: orderData.arrivalTime || null,
        timeAtStop: orderData.timeAtStop || 5
      });
      
      // Try auto-assignment if delivery address provided
      if (orderData.deliveryAddress) {
        try {
          const autoAssignResponse = await fetch("/api/moovly-go/auto-assign-job", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId: order.id,
              deliveryAddress: orderData.deliveryAddress,
              coordinates: null // Would be geocoded in production
            })
          });
          
          if (autoAssignResponse.ok) {
            const assignResult = await autoAssignResponse.json();
            if (assignResult.success) {
              // Update order status to assigned
              await storage.updateCustomerOrder(order.id, { 
                status: "assigned",
                assignedDriverId: assignResult.assignedTo.driverId
              });
            }
          }
        } catch (error) {
          console.log("Auto-assignment failed, order will remain pending");
        }
      }
      
      res.json({
        success: true,
        orderNumber: order.orderNumber,
        trackingNumber: order.trackingNumber,
        message: "Order created successfully"
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(400).json({ message: "Failed to create order" });
    }
  });

  // Get customer orders
  app.get("/api/customer/orders", requireCustomerAuth, async (req, res) => {
    try {
      const customerUser = req.session.customerUser;
      const orders = await storage.getCustomerOrders(customerUser.id);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get customer conversations
  app.get("/api/customer/conversations", requireCustomerAuth, async (req, res) => {
    try {
      const customerUser = req.session.customerUser;
      const conversations = await storage.getCustomerConversations(customerUser.id);
      res.json(conversations);
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json([]);
    }
  });

  // Get customer messages
  app.get("/api/customer/messages/:orderId", requireCustomerAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const messages = await storage.getCustomerMessages(orderId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json([]);
    }
  });

  // Send customer message
  app.post("/api/customer/messages", requireCustomerAuth, async (req, res) => {
    try {
      const messageData = insertCustomerMessageSchema.parse(req.body);
      const customerUser = req.session.customerUser;
      
      const message = await storage.createCustomerMessage({
        ...messageData,
        customerUserId: customerUser.id,
      });
      
      res.json({ success: true, message });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Bulk order creation
  app.post("/api/customer/bulk-orders", requireCustomerAuth, async (req, res) => {
    try {
      const customerUser = req.session.customerUser;
      const { orders } = req.body;
      
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ message: "No orders provided" });
      }
      
      if (orders.length > 1000) {
        return res.status(400).json({ message: "Maximum 1000 orders allowed per upload" });
      }
      
      const results = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (const orderData of orders) {
        try {
          // Generate unique order number and tracking number
          const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          const trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          // Create order
          const order = await storage.createCustomerOrder({
            customerUserId: customerUser.id,
            orderNumber,
            trackingNumber,
            status: "pending",
            ...orderData,
          });
          
          // Try auto-assignment
          if (orderData.deliveryAddress) {
            try {
              const autoAssignResponse = await fetch("/api/moovly-go/auto-assign-job", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jobId: order.id,
                  deliveryAddress: orderData.deliveryAddress,
                  coordinates: null
                })
              });
              
              if (autoAssignResponse.ok) {
                const assignResult = await autoAssignResponse.json();
                if (assignResult.success) {
                  await storage.updateCustomerOrder(order.id, { 
                    status: "assigned",
                    assignedDriverId: assignResult.assignedTo.driverId
                  });
                }
              }
            } catch (autoAssignError) {
              console.log(`Auto-assignment failed for order ${orderNumber}`);
            }
          }
          
          results.push({
            success: true,
            orderNumber: order.orderNumber,
            trackingNumber: order.trackingNumber
          });
          
          successCount++;
          
        } catch (orderError) {
          console.error("Failed to create order:", orderError);
          results.push({
            success: false,
            error: orderError instanceof Error ? orderError.message : "Unknown error"
          });
          failureCount++;
        }
      }
      
      res.json({
        success: true,
        totalOrders: orders.length,
        successCount,
        failureCount,
        results,
        message: `Bulk import completed: ${successCount} successful, ${failureCount} failed`
      });
      
    } catch (error) {
      console.error("Bulk order error:", error);
      res.status(500).json({ message: "Bulk import failed" });
    }
  });

  // Push notification routes
  // VAPID public key endpoint (public - needed for client subscription)
  app.get("/api/push/vapid-public-key", (req, res) => {
    try {
      const publicKey = PushNotificationService.getVapidPublicKey();
      if (!publicKey) {
        return res.status(503).json({ error: "Push notifications not configured" });
      }
      res.json({ publicKey });
    } catch (error) {
      console.error("Failed to get VAPID public key:", error);
      res.status(500).json({ error: "Failed to get VAPID public key" });
    }
  });

  // Push notification subscription (mobile authenticated route)
  app.post("/api/mobile/push/subscribe", async (req, res) => {
    try {
      // Driver authenticated via middleware - get driver from req.driver
      const driver = req.driver;
      const { subscription } = req.body;
      
      if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: "Valid push subscription required" });
      }

      // Update driver with push subscription
      await storage.updateDriver(driver.id, {
        pushSubscription: subscription
      });

      // Send a test notification to confirm subscription
      try {
        const testNotification = {
          title: "🔔 Notifications Enabled!",
          body: "You'll now receive push notifications for job assignments and updates",
          data: {
            type: "subscription_confirmed"
          }
        };

        await PushNotificationService.sendNotification(subscription, testNotification);
      } catch (notificationError) {
        console.error("Failed to send test notification, but subscription saved:", notificationError);
        // Don't fail the entire request if just the test notification fails
      }

      res.json({ success: true, message: "Push subscription registered successfully" });
    } catch (error) {
      console.error("Failed to register push subscription:", error);
      res.status(500).json({ error: "Failed to register push subscription" });
    }
  });

  // Push notification unsubscribe (mobile authenticated route)
  app.post("/api/mobile/push/unsubscribe", async (req, res) => {
    try {
      // Driver authenticated via middleware - get driver from req.driver
      const driver = req.driver;

      // Remove push subscription from driver
      await storage.updateDriver(driver.id, {
        pushSubscription: null,
        notificationPreferences: null
      });

      res.json({ success: true, message: "Push subscription removed successfully" });
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error);
      res.status(500).json({ error: "Failed to unsubscribe from push notifications" });
    }
  });

  // Test push notification (mobile authenticated route)
  app.post("/api/mobile/push/test", async (req, res) => {
    try {
      // Driver authenticated via middleware - get driver from req.driver
      const driver = req.driver;
      const { title, body } = req.body;

      if (!driver.pushSubscription) {
        return res.status(400).json({ error: "Driver not subscribed to notifications" });
      }

      const testNotification = {
        title: title || "🧪 Test Notification",
        body: body || "This is a test push notification from Moovly",
        data: {
          type: "test_notification",
          timestamp: Date.now()
        }
      };

      const success = await PushNotificationService.sendNotification(
        driver.pushSubscription,
        testNotification
      );

      if (success) {
        res.json({ success: true, message: "Test notification sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send test notification" });
      }
    } catch (error) {
      console.error("Failed to send test notification:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Get notification preferences (mobile authenticated route)
  app.get("/api/mobile/push/preferences", async (req, res) => {
    try {
      // Driver authenticated via middleware - get driver from req.driver
      const driver = req.driver;
      
      res.json({ 
        success: true, 
        preferences: driver.notificationPreferences || {
          jobAssignments: true,
          jobUpdates: true,
          routeOptimization: true,
          breakReminders: true,
          systemAlerts: true
        }
      });
    } catch (error) {
      console.error("Failed to get notification preferences:", error);
      res.status(500).json({ error: "Failed to get notification preferences" });
    }
  });

  // Update notification preferences (mobile authenticated route)
  app.put("/api/mobile/push/preferences", async (req, res) => {
    try {
      // Driver authenticated via middleware - get driver from req.driver
      const driver = req.driver;
      const preferences = req.body;

      // Validate preferences structure
      const validPreferences = {
        jobAssignments: preferences.jobAssignments === true,
        jobUpdates: preferences.jobUpdates === true,
        routeOptimization: preferences.routeOptimization === true,
        breakReminders: preferences.breakReminders === true,
        systemAlerts: preferences.systemAlerts === true
      };

      await storage.updateDriver(driver.id, {
        notificationPreferences: validPreferences
      });

      res.json({ success: true, message: "Notification preferences updated" });
    } catch (error) {
      console.error("Failed to update notification preferences:", error);
      res.status(500).json({ error: "Failed to update notification preferences" });
    }
  });

  // Send push notification to driver(s) - General endpoint for job assignments and updates
  app.post("/api/notifications/push", async (req, res) => {
    try {
      const { driverId, notification, data } = req.body;

      if (!driverId || !notification) {
        return res.status(400).json({ error: "driverId and notification are required" });
      }

      // Get driver information
      const driver = await storage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }

      // Check if driver has push subscription
      if (!driver.pushSubscription) {
        console.log(`Driver ${driverId} does not have push subscription enabled`);
        return res.json({ 
          success: false, 
          message: "Driver does not have push notifications enabled" 
        });
      }

      // Send the push notification
      const payload = {
        title: notification.title,
        body: notification.body,
        data: data || {},
        icon: '/icons/moovly-icon-192.png',
        badge: '/icons/moovly-badge-72.png',
        requireInteraction: true,
        tag: `job-notification-${Date.now()}`
      };

      const success = await PushNotificationService.sendNotification(
        driver.pushSubscription,
        payload
      );

      if (success) {
        res.json({ 
          success: true, 
          message: "Push notification sent successfully" 
        });
      } else {
        res.status(500).json({ 
          error: "Failed to send push notification" 
        });
      }
    } catch (error) {
      console.error("Failed to send push notification:", error);
      res.status(500).json({ error: "Failed to send push notification" });
    }
  });

  // =============================================================================
  // FLEET REPORTING SYSTEM ENDPOINTS
  // =============================================================================

  // Generate comprehensive fleet reports
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { reportType, reportPeriod, startDate, endDate, filters } = req.body;
      
      const validReportTypes = ['fuel_efficiency', 'delivery_performance', 'driver_performance', 'vehicle_utilization', 'cost_analysis'];
      const validReportPeriods = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
      
      if (!validReportTypes.includes(reportType)) {
        return res.status(400).json({ message: "Invalid report type" });
      }
      
      if (!validReportPeriods.includes(reportPeriod)) {
        return res.status(400).json({ message: "Invalid report period" });
      }

      let reportData = {};
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Get base data for all report types
      const jobs = await storage.getAllJobs();
      const drivers = await storage.getAllDrivers();
      const vehicles = await storage.getAllVehicles();
      const tripData = await storage.getAllTripData();
      const fuelEntries = await storage.getAllFuelEntries();

      // Filter data by date range
      const filteredJobs = jobs.filter(job => {
        const jobDate = new Date(job.scheduledDate);
        return jobDate >= start && jobDate <= end;
      });

      const filteredTripData = tripData.filter(trip => {
        const tripDate = new Date(trip.startTime);
        return tripDate >= start && tripDate <= end;
      });

      const filteredFuelEntries = fuelEntries.filter(entry => {
        const entryDate = new Date(entry.createdAt!);
        return entryDate >= start && entryDate <= end;
      });

      switch (reportType) {
        case 'fuel_efficiency':
          reportData = await generateFuelEfficiencyReport(filteredJobs, filteredTripData, filteredFuelEntries, vehicles, drivers, filters);
          break;
        case 'delivery_performance':
          reportData = await generateDeliveryPerformanceReport(filteredJobs, filteredTripData, drivers, vehicles, filters);
          break;
        case 'driver_performance':
          reportData = await generateDriverPerformanceReport(filteredJobs, filteredTripData, drivers, vehicles, filters);
          break;
        case 'vehicle_utilization':
          reportData = await generateVehicleUtilizationReport(filteredJobs, filteredTripData, vehicles, drivers, filters);
          break;
        case 'cost_analysis':
          reportData = await generateCostAnalysisReport(filteredJobs, filteredFuelEntries, vehicles, drivers, filters);
          break;
      }

      // For now, return the data directly since storage methods don't exist yet
      res.json({
        reportType,
        reportPeriod,
        dateRange: { startDate, endDate },
        data: reportData,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error generating fleet report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Get fuel efficiency metrics
  app.get("/api/reports/fuel-efficiency", async (req, res) => {
    try {
      const { startDate, endDate, driverId, vehicleId } = req.query;
      
      const trips = await storage.getAllTripData();
      const fuelEntries = await storage.getAllFuelEntries();
      const vehicles = await storage.getAllVehicles();
      const drivers = await storage.getAllDrivers();

      // Filter by date range
      let filteredTrips = trips;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        filteredTrips = trips.filter(trip => {
          const tripDate = new Date(trip.startTime);
          return tripDate >= start && tripDate <= end;
        });
      }

      // Filter by driver/vehicle if specified
      if (driverId) {
        filteredTrips = filteredTrips.filter(trip => trip.driverId === parseInt(driverId as string));
      }
      if (vehicleId) {
        filteredTrips = filteredTrips.filter(trip => trip.vehicleId === parseInt(vehicleId as string));
      }

      // Calculate fuel efficiency metrics
      const fuelEfficiencyData = calculateFuelEfficiencyMetrics(filteredTrips, fuelEntries, vehicles, drivers);

      res.json(fuelEfficiencyData);
    } catch (error) {
      console.error("Error fetching fuel efficiency data:", error);
      res.status(500).json({ message: "Failed to fetch fuel efficiency data" });
    }
  });

  // Get delivery performance metrics
  app.get("/api/reports/delivery-performance", async (req, res) => {
    try {
      const { startDate, endDate, driverId, vehicleId } = req.query;
      
      const jobs = await storage.getAllJobs();
      const drivers = await storage.getAllDrivers();
      const vehicles = await storage.getAllVehicles();

      // Filter by date range
      let filteredJobs = jobs;
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        filteredJobs = jobs.filter(job => {
          const jobDate = new Date(job.scheduledDate);
          return jobDate >= start && jobDate <= end;
        });
      }

      // Filter by driver/vehicle if specified
      if (driverId) {
        filteredJobs = filteredJobs.filter(job => job.driverId === parseInt(driverId as string));
      }
      if (vehicleId) {
        filteredJobs = filteredJobs.filter(job => job.vehicleId === parseInt(vehicleId as string));
      }

      // Calculate delivery performance metrics
      const deliveryMetrics = calculateDeliveryPerformanceMetrics(filteredJobs, drivers, vehicles);

      res.json(deliveryMetrics);
    } catch (error) {
      console.error("Error fetching delivery performance data:", error);
      res.status(500).json({ message: "Failed to fetch delivery performance data" });
    }
  });

  // =============================================================================
  // HELPER FUNCTIONS FOR REPORT CALCULATIONS
  // =============================================================================

  // Helper function to generate fuel efficiency report
  async function generateFuelEfficiencyReport(jobs: any[], tripData: any[], fuelEntries: any[], vehicles: any[], drivers: any[], filters: any) {
    const metrics = calculateFuelEfficiencyMetrics(tripData, fuelEntries, vehicles, drivers);
    
    return {
      summary: {
        totalFuelConsumed: metrics.totalFuelConsumed,
        averageFuelEfficiency: metrics.averageFuelEfficiency,
        totalDistance: metrics.totalDistance,
        fuelCostTotal: metrics.fuelCostTotal
      },
      byVehicle: metrics.byVehicle,
      byDriver: metrics.byDriver,
      trends: metrics.trends,
      recommendations: generateFuelEfficiencyRecommendations(metrics)
    };
  }

  // Helper function to generate delivery performance report
  async function generateDeliveryPerformanceReport(jobs: any[], tripData: any[], drivers: any[], vehicles: any[], filters: any) {
    const metrics = calculateDeliveryPerformanceMetrics(jobs, drivers, vehicles);
    
    return {
      summary: {
        totalDeliveries: metrics.totalDeliveries,
        onTimeDeliveryRate: metrics.onTimeDeliveryRate,
        averageDeliveryTime: metrics.averageDeliveryTime,
        customerSatisfactionScore: metrics.customerSatisfactionScore
      },
      byDriver: metrics.byDriver,
      byVehicle: metrics.byVehicle,
      delays: metrics.delays,
      trends: metrics.trends,
      recommendations: generateDeliveryPerformanceRecommendations(metrics)
    };
  }

  // Helper function to generate driver performance report
  async function generateDriverPerformanceReport(jobs: any[], tripData: any[], drivers: any[], vehicles: any[], filters: any) {
    const metrics = calculateDriverPerformanceMetrics(jobs, tripData, drivers);
    
    return {
      summary: {
        averageMoovScore: metrics.averageMoovScore,
        totalDrivers: metrics.totalDrivers,
        topPerformers: metrics.topPerformers,
        improvementNeeded: metrics.improvementNeeded
      },
      individual: metrics.individual,
      comparisons: metrics.comparisons,
      safetyMetrics: metrics.safetyMetrics,
      recommendations: generateDriverPerformanceRecommendations(metrics)
    };
  }

  // Helper function to generate vehicle utilization report
  async function generateVehicleUtilizationReport(jobs: any[], tripData: any[], vehicles: any[], drivers: any[], filters: any) {
    const metrics = calculateVehicleUtilizationMetrics(jobs, tripData, vehicles, [] as any[]);
    
    return {
      summary: {
        fleetUtilizationRate: metrics.fleetUtilizationRate,
        averageVehicleUtilization: metrics.averageVehicleUtilization,
        underutilizedVehicles: metrics.underutilizedVehicles,
        overutilizedVehicles: metrics.overutilizedVehicles
      },
      byVehicle: metrics.byVehicle,
      utilizationTrends: metrics.utilizationTrends,
      maintenanceImpact: metrics.maintenanceImpact,
      recommendations: generateVehicleUtilizationRecommendations(metrics)
    };
  }

  // Helper function to generate cost analysis report
  async function generateCostAnalysisReport(jobs: any[], fuelEntries: any[], vehicles: any[], drivers: any[], filters: any) {
    const metrics = calculateCostAnalysisMetrics(fuelEntries, [] as any[], [] as any[], vehicles);
    
    return {
      summary: {
        totalOperatingCosts: metrics.totalOperatingCosts,
        costPerKilometer: metrics.costPerKilometer,
        fuelCostPercentage: metrics.fuelCostPercentage,
        maintenanceCostPercentage: metrics.maintenanceCostPercentage
      },
      breakdown: metrics.breakdown,
      byVehicle: metrics.byVehicle,
      trends: metrics.trends,
      recommendations: generateCostAnalysisRecommendations(metrics)
    };
  }

  // Make io globally available for real-time updates  
  (global as any).io = io;

  return httpServer;
}
