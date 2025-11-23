import { db } from "./db";
import { eq, and, count, isNull, isNotNull, gte, lt } from "drizzle-orm";
import {
  users, customers, drivers, vehicles, jobs, routes, maintenanceRecords, fuelEntries, driverShifts, alerts, regionalPricing, tripData, messages, clientAccounts, optimizationRules, costCentreDocuments, costCentreEntries, customerNotifications, geofences, geofenceEvents, offlineJobs, systemSettings,
  type User, type InsertUser,
  type Customer, type InsertCustomer,
  type Driver, type InsertDriver,
  type Vehicle, type InsertVehicle,
  type Job, type InsertJob,
  type Route, type InsertRoute,
  type MaintenanceRecord, type InsertMaintenanceRecord,
  type FuelEntry, type InsertFuelEntry,
  type DriverShift, type InsertDriverShift,
  type Alert, type InsertAlert,
  type RegionalPricing, type InsertRegionalPricing,
  type TripData, type InsertTripData,
  type Message, type InsertMessage,
  type ClientAccount, type InsertClientAccount,
  type OptimizationRules, type InsertOptimizationRules,
  type CostCentreDocument, type InsertCostCentreDocument,
  type CostCentreEntry, type InsertCostCentreEntry,
  type CustomerNotification, type InsertCustomerNotification,
  type Geofence, type InsertGeofence,
  type GeofenceEvent, type InsertGeofenceEvent,
  type OfflineJob, type InsertOfflineJob
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Customer operations
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: number, updateData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers)
      .set(updateData)
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Driver operations
  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async createDriver(driverData: InsertDriver): Promise<Driver> {
    const [driver] = await db.insert(drivers).values(driverData).returning();
    return driver;
  }

  async updateDriver(id: number, updateData: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return driver;
  }

  async deleteDriver(id: number): Promise<boolean> {
    const result = await db.delete(drivers).where(eq(drivers.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Vehicle operations
  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async createVehicle(vehicleData: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return vehicle;
  }

  async updateVehicle(id: number, updateData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const [vehicle] = await db.update(vehicles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    const result = await db.delete(vehicles).where(eq(vehicles.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Job operations
  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async createJob(jobData: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(jobData).returning();
    return job;
  }

  async updateJob(id: number, updateData: Partial<InsertJob>): Promise<Job | undefined> {
    const [job] = await db.update(jobs)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  }

  async deleteJob(id: number): Promise<boolean> {
    const result = await db.delete(jobs).where(eq(jobs.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getJobsByStatus(status: string): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, status));
  }

  // Route operations
  async getAllRoutes(): Promise<Route[]> {
    return await db.select().from(routes);
  }

  async getRoute(id: number): Promise<Route | undefined> {
    const [route] = await db.select().from(routes).where(eq(routes.id, id));
    return route;
  }

  async createRoute(routeData: InsertRoute): Promise<Route> {
    const [route] = await db.insert(routes).values(routeData).returning();
    return route;
  }

  async updateRoute(id: number, updateData: Partial<InsertRoute>): Promise<Route | undefined> {
    const [route] = await db.update(routes)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(routes.id, id))
      .returning();
    return route;
  }

  async deleteRoute(id: number): Promise<boolean> {
    const result = await db.delete(routes).where(eq(routes.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Maintenance operations
  async getAllMaintenanceRecords(): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords);
  }

  async getMaintenanceRecord(id: number): Promise<MaintenanceRecord | undefined> {
    const [record] = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    return record;
  }

  async getMaintenanceRecordsByVehicle(vehicleId: number): Promise<MaintenanceRecord[]> {
    return await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.vehicleId, vehicleId));
  }

  async createMaintenanceRecord(recordData: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const [record] = await db.insert(maintenanceRecords).values(recordData).returning();
    return record;
  }

  async updateMaintenanceRecord(id: number, updateData: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined> {
    const [record] = await db.update(maintenanceRecords)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return record;
  }

  async deleteMaintenanceRecord(id: number): Promise<boolean> {
    const result = await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Fuel entry operations
  async getAllFuelEntries(): Promise<FuelEntry[]> {
    return await db.select().from(fuelEntries);
  }

  async getFuelEntry(id: number): Promise<FuelEntry | undefined> {
    const [entry] = await db.select().from(fuelEntries).where(eq(fuelEntries.id, id));
    return entry;
  }

  async getFuelEntriesByVehicle(vehicleId: number): Promise<FuelEntry[]> {
    return await db.select().from(fuelEntries).where(eq(fuelEntries.vehicleId, vehicleId));
  }

  async createFuelEntry(entryData: InsertFuelEntry): Promise<FuelEntry> {
    const [entry] = await db.insert(fuelEntries).values(entryData).returning();
    return entry;
  }

  async updateFuelEntry(id: number, updateData: Partial<InsertFuelEntry>): Promise<FuelEntry | undefined> {
    const [entry] = await db.update(fuelEntries)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(fuelEntries.id, id))
      .returning();
    return entry;
  }

  async deleteFuelEntry(id: number): Promise<boolean> {
    const result = await db.delete(fuelEntries).where(eq(fuelEntries.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Driver shift operations
  async getAllDriverShifts(): Promise<DriverShift[]> {
    return await db.select().from(driverShifts);
  }

  async getDriverShift(id: number): Promise<DriverShift | undefined> {
    const [shift] = await db.select().from(driverShifts).where(eq(driverShifts.id, id));
    return shift;
  }

  async getDriverShiftsByDriver(driverId: number): Promise<DriverShift[]> {
    return await db.select().from(driverShifts).where(eq(driverShifts.driverId, driverId));
  }

  async createDriverShift(shiftData: InsertDriverShift): Promise<DriverShift> {
    const [shift] = await db.insert(driverShifts).values(shiftData).returning();
    return shift;
  }

  async updateDriverShift(id: number, updateData: Partial<InsertDriverShift>): Promise<DriverShift | undefined> {
    const [shift] = await db.update(driverShifts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(driverShifts.id, id))
      .returning();
    return shift;
  }

  async deleteDriverShift(id: number): Promise<boolean> {
    const result = await db.delete(driverShifts).where(eq(driverShifts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async checkShiftStatus(driverId: number, currentTime: Date): Promise<{ withinShift: boolean; reassignedJobs?: Job[] }> {
    const driverShifts = await this.getDriverShiftsByDriver(driverId);
    const now = currentTime.getTime();
    
    const currentShift = driverShifts.find(shift => {
      const start = shift.startTime.getTime();
      const end = shift.endTime.getTime();
      return now >= start && now <= end && shift.status === 'active';
    });
    
    if (currentShift) {
      return { withinShift: true };
    }
    
    // If driver is not within shift, reassign their jobs
    const activeJobs = await db.select().from(jobs).where(
      and(eq(jobs.driverId, driverId), eq(jobs.status, 'assigned'))
    );
    
    // Mark jobs as unassigned
    if (activeJobs.length > 0) {
      await db.update(jobs)
        .set({ driverId: null, status: 'pending' })
        .where(and(eq(jobs.driverId, driverId), eq(jobs.status, 'assigned')));
    }
    
    return {
      withinShift: false,
      reassignedJobs: activeJobs
    };
  }

  // Alert operations
  async getAllAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts);
  }

  async getAlert(id: number): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert;
  }

  async getUnreadAlerts(): Promise<Alert[]> {
    return await db.select().from(alerts).where(eq(alerts.isRead, false));
  }

  async createAlert(alertData: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(alertData).returning();
    return alert;
  }

  async updateAlert(id: number, updateData: Partial<InsertAlert>): Promise<Alert | undefined> {
    const [alert] = await db.update(alerts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(alerts.id, id))
      .returning();
    return alert;
  }

  async markAlertAsRead(id: number): Promise<boolean> {
    const result = await db.update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async markAlertAsResolved(id: number): Promise<boolean> {
    const result = await db.update(alerts)
      .set({ isResolved: true })
      .where(eq(alerts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async deleteAlert(id: number): Promise<boolean> {
    const result = await db.delete(alerts).where(eq(alerts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Regional pricing operations
  async getAllRegionalPricing(): Promise<RegionalPricing[]> {
    return await db.select().from(regionalPricing);
  }

  async getRegionalPricing(region: string): Promise<RegionalPricing | undefined> {
    const [pricing] = await db.select().from(regionalPricing).where(eq(regionalPricing.region, region));
    return pricing;
  }

  async createRegionalPricing(pricingData: InsertRegionalPricing): Promise<RegionalPricing> {
    const [pricing] = await db.insert(regionalPricing).values(pricingData).returning();
    return pricing;
  }

  async updateRegionalPricing(id: number, updateData: Partial<InsertRegionalPricing>): Promise<RegionalPricing | undefined> {
    const [pricing] = await db.update(regionalPricing)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(regionalPricing.id, id))
      .returning();
    return pricing;
  }

  // Job assignment operations
  async assignJob(jobId: number, driverId: number): Promise<Job | undefined> {
    // Check if driver is within shift
    const shiftStatus = await this.checkShiftStatus(driverId, new Date());
    
    if (!shiftStatus.withinShift) {
      throw new Error('Driver is not within scheduled shift hours');
    }
    
    const [job] = await db.update(jobs)
      .set({ driverId, status: 'assigned' })
      .where(eq(jobs.id, jobId))
      .returning();
    
    return job;
  }

  async optimizeRoutes(jobList: Job[]): Promise<Job[]> {
    // Simple optimization algorithm - sort by scheduled date and status
    // In a real application, you would use more sophisticated routing algorithms
    return jobList.sort((a, b) => {
      // Sort by scheduled date
      return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
    });
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    activeVehicles: number;
    activeDrivers: number;
    completedJobs: number;
    fuelSavings: number;
  }> {
    const [activeVehiclesResult] = await db.select({ count: count() }).from(vehicles).where(eq(vehicles.status, 'active'));
    const [activeDriversResult] = await db.select({ count: count() }).from(drivers).where(eq(drivers.status, 'active'));
    const [completedJobsResult] = await db.select({ count: count() }).from(jobs).where(eq(jobs.status, 'completed'));
    
    // Calculate fuel savings - this is a simplified calculation
    const totalFuelEntries = await db.select().from(fuelEntries);
    const fuelSavings = totalFuelEntries.reduce((total, entry) => {
      const cost = parseFloat(entry.cost);
      const liters = parseFloat(entry.liters);
      const efficiency = cost / liters; // Cost per liter
      return total + (efficiency * 0.1); // Assume 10% savings through optimization
    }, 0);
    
    return {
      activeVehicles: activeVehiclesResult.count,
      activeDrivers: activeDriversResult.count,
      completedJobs: completedJobsResult.count,
      fuelSavings: Math.round(fuelSavings * 100) / 100
    };
  }

  // Trip data operations for MoovScore
  async getAllTripData(): Promise<TripData[]> {
    return await db.select().from(tripData);
  }

  async getTripData(id: number): Promise<TripData | undefined> {
    const [trip] = await db.select().from(tripData).where(eq(tripData.id, id));
    return trip;
  }

  async getTripDataByDriver(driverId: number): Promise<TripData[]> {
    return await db.select().from(tripData).where(eq(tripData.driverId, driverId));
  }

  async createTripData(tripDataInput: InsertTripData): Promise<TripData> {
    const moovScore = await this.calculateMoovScore(tripDataInput);
    const [trip] = await db.insert(tripData).values({
      ...tripDataInput,
      moovScore
    }).returning();
    return trip;
  }

  async calculateMoovScore(tripDataInput: InsertTripData): Promise<number> {
    const MAX_SCORE = 100;
    let score = MAX_SCORE;

    const { speedViolations, harshBrakes, harshAccelerations, harshTurns, idleTimeSeconds } = tripDataInput;

    score -= (speedViolations || 0) * 2; // each violation reduces score
    score -= (harshBrakes || 0) * 1.5;
    score -= (harshAccelerations || 0) * 1.5;
    score -= (harshTurns || 0) * 1.5;
    score -= Math.floor((idleTimeSeconds || 0) / 60); // 1 point per idle minute

    return Math.max(score, 0);
  }

  // Job carry-over operations
  async handleJobCarryOver(jobId: number, driverId: number, nextDaySchedule: Date): Promise<Job | undefined> {
    const job = await this.getJob(jobId);
    if (!job || job.status === 'completed') {
      return undefined;
    }

    // Check if driver is scheduled for next day
    const driverShifts = await this.getDriverShiftsByDriver(driverId);
    const nextDayShift = driverShifts.find(shift => {
      const shiftDate = new Date(shift.startTime).toDateString();
      const scheduleDate = nextDaySchedule.toDateString();
      return shiftDate === scheduleDate;
    });

    if (nextDayShift) {
      // Carry over the job
      const updatedJob = await this.updateJob(jobId, {
        priority: 'high',
        scheduledDate: nextDaySchedule,
        isCarryOver: true,
        status: 'pending'
      });
      
      // Create notification alert
      await this.createAlert({
        message: `Job ${job.jobNumber} carried over for next shift.`,
        type: 'notification',
        severity: 'medium',
        entityType: 'job',
        entityId: jobId
      });
      
      return updatedJob;
    } else {
      // Move to unassigned jobs
      await this.moveToUnassignedJobs(jobId);
      
      // Create alert for dispatcher
      await this.createAlert({
        message: `Job ${job.jobNumber} was not completed and not carried over.`,
        type: 'alert',
        severity: 'high',
        entityType: 'job',
        entityId: jobId
      });
      
      return undefined;
    }
  }

  async moveToUnassignedJobs(jobId: number): Promise<boolean> {
    const result = await db.update(jobs)
      .set({ 
        driverId: null, 
        vehicleId: null, 
        status: 'pending',
        priority: 'high'
      })
      .where(eq(jobs.id, jobId));
    return (result.rowCount || 0) > 0;
  }

  async prioritizeJobs(jobsList: Job[]): Promise<Job[]> {
    const highPriority = jobsList.filter(job => job.priority === 'high');
    const mediumPriority = jobsList.filter(job => job.priority === 'medium');
    const lowPriority = jobsList.filter(job => job.priority === 'low');

    const timeBasedJobs = jobsList.filter(job => job.hasFixedTime);

    const sorted = [...timeBasedJobs, ...highPriority, ...mediumPriority, ...lowPriority].sort(
      (a, b) => {
        const aTime = a.scheduledTime ? new Date(a.scheduledTime).getTime() : new Date(a.scheduledDate).getTime();
        const bTime = b.scheduledTime ? new Date(b.scheduledTime).getTime() : new Date(b.scheduledDate).getTime();
        return aTime - bTime;
      }
    );

    return sorted;
  }

  // Messaging operations
  async getAllMessages(): Promise<Message[]> {
    return await db.select().from(messages);
  }

  async getMessagesByUser(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.toUserId, userId));
  }

  async getUnreadMessages(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(and(eq(messages.toUserId, userId), eq(messages.isRead, false)));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(messageData).returning();
    return message;
  }

  async markMessageAsRead(messageId: number): Promise<boolean> {
    const result = await db.update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, messageId));
    return (result.rowCount || 0) > 0;
  }

  async deleteMessage(messageId: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, messageId));
    return (result.rowCount || 0) > 0;
  }

  // Client account management operations
  async getAllClientAccounts(): Promise<ClientAccount[]> {
    return await db.select().from(clientAccounts);
  }

  async getClientAccount(id: number): Promise<ClientAccount | undefined> {
    const [client] = await db.select().from(clientAccounts).where(eq(clientAccounts.id, id));
    return client;
  }

  async createClientAccount(clientData: InsertClientAccount): Promise<ClientAccount> {
    const [client] = await db.insert(clientAccounts).values(clientData).returning();
    return client;
  }

  async updateClientAccount(id: number, updateData: Partial<InsertClientAccount>): Promise<ClientAccount | undefined> {
    const [client] = await db.update(clientAccounts)
      .set(updateData)
      .where(eq(clientAccounts.id, id))
      .returning();
    return client;
  }

  // Smart Optimization Rules operations (Moovly Business exclusive)
  async getOptimizationRules(): Promise<OptimizationRules | null> {
    const [rules] = await db.select().from(optimizationRules).limit(1);
    return rules || null;
  }

  async saveOptimizationRules(rulesData: InsertOptimizationRules): Promise<OptimizationRules> {
    // Check if rules already exist
    const existingRules = await this.getOptimizationRules();
    
    if (existingRules) {
      // Update existing rules
      const [rules] = await db.update(optimizationRules)
        .set({ ...rulesData, updatedAt: new Date() })
        .where(eq(optimizationRules.id, existingRules.id))
        .returning();
      return rules;
    } else {
      // Create new rules
      const [rules] = await db.insert(optimizationRules).values(rulesData).returning();
      return rules;
    }
  }

  // Cost Centre Document operations (Moovly Business exclusive)
  async getAllCostCentreDocuments(): Promise<CostCentreDocument[]> {
    return await db.select().from(costCentreDocuments);
  }

  async getCostCentreDocument(id: number): Promise<CostCentreDocument | undefined> {
    const [document] = await db.select().from(costCentreDocuments).where(eq(costCentreDocuments.id, id));
    return document;
  }

  async getCostCentreDocumentsByVehicle(vehicleId: number): Promise<CostCentreDocument[]> {
    return await db.select().from(costCentreDocuments).where(eq(costCentreDocuments.vehicleId, vehicleId));
  }

  async createCostCentreDocument(documentData: InsertCostCentreDocument): Promise<CostCentreDocument> {
    const [document] = await db.insert(costCentreDocuments).values(documentData).returning();
    return document;
  }

  async updateCostCentreDocument(id: number, updateData: Partial<InsertCostCentreDocument>): Promise<CostCentreDocument | undefined> {
    const [document] = await db.update(costCentreDocuments)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(costCentreDocuments.id, id))
      .returning();
    return document;
  }

  async deleteCostCentreDocument(id: number): Promise<boolean> {
    const result = await db.delete(costCentreDocuments).where(eq(costCentreDocuments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Cost Centre Entry operations (Moovly Business exclusive)
  async getAllCostCentreEntries(): Promise<CostCentreEntry[]> {
    return await db.select().from(costCentreEntries);
  }

  async getCostCentreEntry(id: number): Promise<CostCentreEntry | undefined> {
    const [entry] = await db.select().from(costCentreEntries).where(eq(costCentreEntries.id, id));
    return entry;
  }

  async getCostCentreEntriesByVehicle(vehicleId: number): Promise<CostCentreEntry[]> {
    return await db.select().from(costCentreEntries).where(eq(costCentreEntries.vehicleId, vehicleId));
  }

  async getCostCentreEntriesByCategory(category: string): Promise<CostCentreEntry[]> {
    return await db.select().from(costCentreEntries).where(eq(costCentreEntries.category, category));
  }

  async createCostCentreEntry(entryData: InsertCostCentreEntry): Promise<CostCentreEntry> {
    const [entry] = await db.insert(costCentreEntries).values(entryData).returning();
    return entry;
  }

  async updateCostCentreEntry(id: number, updateData: Partial<InsertCostCentreEntry>): Promise<CostCentreEntry | undefined> {
    const [entry] = await db.update(costCentreEntries)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(costCentreEntries.id, id))
      .returning();
    return entry;
  }

  async deleteCostCentreEntry(id: number): Promise<boolean> {
    const result = await db.delete(costCentreEntries).where(eq(costCentreEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // OCR Processing methods
  async processOCRDocument(id: number, ocrData: { rawText: string; confidence: number; extractedData: any }): Promise<CostCentreDocument | undefined> {
    const [document] = await db.update(costCentreDocuments)
      .set({
        ocrProcessed: true,
        ocrRawText: ocrData.rawText,
        ocrConfidence: ocrData.confidence.toString(),
        extractedData: JSON.stringify(ocrData.extractedData),
        status: 'completed',
        updatedAt: new Date()
      })
      .where(eq(costCentreDocuments.id, id))
      .returning();
    return document;
  }

  async getVehicleCostSummary(vehicleId: number): Promise<{
    totalCosts: number;
    fuelCosts: number;
    maintenanceCosts: number;
    tyreCosts: number;
    otherCosts: number;
    entriesCount: number;
  }> {
    const entries = await this.getCostCentreEntriesByVehicle(vehicleId);
    
    const summary = entries.reduce((acc, entry) => {
      const amount = parseFloat(entry.amount.toString());
      acc.totalCosts += amount;
      
      switch (entry.category) {
        case 'fuel':
          acc.fuelCosts += amount;
          break;
        case 'maintenance':
        case 'repairs':
          acc.maintenanceCosts += amount;
          break;
        case 'tyres':
          acc.tyreCosts += amount;
          break;
        default:
          acc.otherCosts += amount;
          break;
      }
      
      return acc;
    }, {
      totalCosts: 0,
      fuelCosts: 0,
      maintenanceCosts: 0,
      tyreCosts: 0,
      otherCosts: 0,
      entriesCount: entries.length
    });

    return summary;
  }

  // Customer Notification methods for tracking
  async createCustomerNotification(notificationData: InsertCustomerNotification): Promise<CustomerNotification> {
    const [notification] = await db.insert(customerNotifications).values(notificationData).returning();
    return notification;
  }

  async getCustomerNotifications(jobId: number): Promise<CustomerNotification[]> {
    return await db.select().from(customerNotifications).where(eq(customerNotifications.jobId, jobId));
  }

  async updateNotificationStatus(notificationId: number, status: string, errorMessage?: string): Promise<CustomerNotification | undefined> {
    const updateData: any = { deliveryStatus: status };
    if (errorMessage) {
      updateData.errorMessage = errorMessage;
    }
    
    const [notification] = await db.update(customerNotifications)
      .set(updateData)
      .where(eq(customerNotifications.id, notificationId))
      .returning();
    return notification;
  }

  // Job tracking methods
  async generateTrackingToken(jobId: number): Promise<string> {
    const trackingToken = `track_${jobId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.update(jobs)
      .set({ trackingToken })
      .where(eq(jobs.id, jobId));
    
    return trackingToken;
  }

  async getJobByTrackingToken(trackingToken: string): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.trackingToken, trackingToken));
    return job;
  }

  async updateJobLocation(jobId: number, latitude: number, longitude: number): Promise<Job | undefined> {
    const [job] = await db.update(jobs)
      .set({
        currentDriverLatitude: latitude.toString(),
        currentDriverLongitude: longitude.toString(),
        lastLocationUpdate: new Date()
      })
      .where(eq(jobs.id, jobId))
      .returning();
    return job;
  }

  async startJobTracking(jobId: number, estimatedArrivalTime?: Date): Promise<Job | undefined> {
    const updateData: any = {
      driverStartedAt: new Date(),
      status: 'in_progress'
    };
    
    if (estimatedArrivalTime) {
      updateData.estimatedArrivalTime = estimatedArrivalTime;
    }

    const [job] = await db.update(jobs)
      .set(updateData)
      .where(eq(jobs.id, jobId))
      .returning();
    return job;
  }

  async calculateETA(jobId: number, currentLatitude: number, currentLongitude: number): Promise<Date | null> {
    const job = await this.getJob(jobId);
    if (!job || !job.deliveryAddress) return null;

    // Simple ETA calculation - in production would use Google Maps API
    // For demo purposes, we'll estimate 15-30 minutes based on distance
    const estimatedMinutes = Math.floor(Math.random() * 15) + 15; // 15-30 minutes
    
    const eta = new Date();
    eta.setMinutes(eta.getMinutes() + estimatedMinutes);
    
    return eta;
  }

  async getJobsNearingArrival(minutesBefore: number = 10): Promise<Job[]> {
    // Get jobs that are in progress and have ETA within the specified minutes
    const targetTime = new Date();
    targetTime.setMinutes(targetTime.getMinutes() + minutesBefore);
    
    const jobsData = await db.select().from(jobs).where(
      and(
        eq(jobs.status, 'in_progress'),
        eq(jobs.customerNotificationSent, false)
      )
    );
    
    // Filter jobs that have estimated arrival time within the window
    return jobsData.filter(job => {
      if (!job.estimatedArrivalTime) return false;
      const eta = new Date(job.estimatedArrivalTime);
      return eta <= targetTime && eta > new Date();
    });
  }

  // Geofence Management Methods
  async getAllGeofences(): Promise<Geofence[]> {
    return await db.select().from(geofences).orderBy(geofences.createdAt);
  }

  async getGeofence(id: number): Promise<Geofence | undefined> {
    const [geofence] = await db.select().from(geofences).where(eq(geofences.id, id));
    return geofence;
  }

  async getGeofencesByType(type: string): Promise<Geofence[]> {
    return await db.select().from(geofences).where(eq(geofences.type, type));
  }

  async getActiveGeofences(): Promise<Geofence[]> {
    return await db.select().from(geofences).where(eq(geofences.isActive, true));
  }

  async createGeofence(geofenceData: InsertGeofence): Promise<Geofence> {
    const [geofence] = await db.insert(geofences).values(geofenceData).returning();
    return geofence;
  }

  async updateGeofence(id: number, updateData: Partial<InsertGeofence>): Promise<Geofence | undefined> {
    const [geofence] = await db
      .update(geofences)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(geofences.id, id))
      .returning();
    return geofence;
  }

  async deleteGeofence(id: number): Promise<boolean> {
    const result = await db.delete(geofences).where(eq(geofences.id, id));
    return result.rowCount! > 0;
  }

  // Auto-create geofences for customer addresses (50m radius)
  async createCustomerAddressGeofences(customerId: number): Promise<Geofence[]> {
    const customer = await this.getCustomer(customerId);
    if (!customer || !customer.latitude || !customer.longitude) {
      return [];
    }

    const existingGeofence = await db.select()
      .from(geofences)
      .where(and(
        eq(geofences.customerId, customerId),
        eq(geofences.type, 'customer_address')
      ));

    if (existingGeofence.length > 0) {
      return existingGeofence;
    }

    const geofenceData: InsertGeofence = {
      name: `${customer.customerName} - Delivery Address`,
      type: 'customer_address',
      latitude: customer.latitude,
      longitude: customer.longitude,
      radius: 50, // 50m radius as requested
      customerId: customerId,
      description: `Auto-generated geofence for customer delivery address`,
      alertOnEntry: true,
      alertOnExit: true,
      alertOnDwell: false,
    };

    const [newGeofence] = await db.insert(geofences).values(geofenceData).returning();
    return [newGeofence];
  }

  // Geofence Event Tracking
  async getAllGeofenceEvents(): Promise<GeofenceEvent[]> {
    return await db.select().from(geofenceEvents).orderBy(geofenceEvents.eventTime);
  }

  async getGeofenceEvent(id: number): Promise<GeofenceEvent | undefined> {
    const [event] = await db.select().from(geofenceEvents).where(eq(geofenceEvents.id, id));
    return event;
  }

  async getGeofenceEventsByDriver(driverId: number): Promise<GeofenceEvent[]> {
    return await db.select().from(geofenceEvents).where(eq(geofenceEvents.driverId, driverId));
  }

  async getGeofenceEventsByGeofence(geofenceId: number): Promise<GeofenceEvent[]> {
    return await db.select().from(geofenceEvents).where(eq(geofenceEvents.geofenceId, geofenceId));
  }

  async createGeofenceEvent(eventData: InsertGeofenceEvent): Promise<GeofenceEvent> {
    const [event] = await db.insert(geofenceEvents).values(eventData).returning();
    
    // Trigger alert if configured
    if (eventData.geofenceId) {
      await this.processGeofenceAlert(event);
    }
    
    return event;
  }

  // Check if location is within any active geofences
  async checkGeofenceProximity(latitude: number, longitude: number, driverId?: number, vehicleId?: number, jobId?: number): Promise<GeofenceEvent[]> {
    const activeGeofences = await this.getActiveGeofences();
    const triggeredEvents: GeofenceEvent[] = [];

    for (const geofence of activeGeofences) {
      const distance = this.calculateDistance(
        parseFloat(geofence.latitude),
        parseFloat(geofence.longitude),
        latitude,
        longitude
      );

      if (distance <= geofence.radius) {
        // Check if this is a new entry event
        const recentEvents = await db.select()
          .from(geofenceEvents)
          .where(and(
            eq(geofenceEvents.geofenceId, geofence.id),
            driverId ? eq(geofenceEvents.driverId, driverId) : isNull(geofenceEvents.driverId),
            gte(geofenceEvents.eventTime, new Date(Date.now() - 5 * 60 * 1000)) // Within last 5 minutes
          ));

        if (recentEvents.length === 0 && geofence.alertOnEntry) {
          const eventData: InsertGeofenceEvent = {
            geofenceId: geofence.id,
            driverId: driverId || null,
            vehicleId: vehicleId || null,
            jobId: jobId || null,
            eventType: 'entry',
            latitude: latitude.toString(),
            longitude: longitude.toString(),
          };

          const event = await this.createGeofenceEvent(eventData);
          triggeredEvents.push(event);
        }
      }
    }

    return triggeredEvents;
  }

  // Process geofence alerts (send notifications)
  private async processGeofenceAlert(event: GeofenceEvent): Promise<void> {
    const geofence = await this.getGeofence(event.geofenceId!);
    if (!geofence) return;

    let alertMessage = '';
    const eventTypeLabel = event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1);

    if (geofence.type === 'customer_address') {
      const customer = await this.getCustomer(geofence.customerId!);
      alertMessage = `Driver ${eventTypeLabel.toLowerCase()} ${customer?.customerName || 'customer'} delivery area`;
    } else {
      alertMessage = `Driver ${eventTypeLabel.toLowerCase()} geofence: ${geofence.name}`;
    }

    // Create system alert
    await this.createAlert({
      type: 'geofence_event',
      message: alertMessage,
      severity: geofence.type === 'restricted_area' ? 'urgent' : 'medium',
      entityType: 'driver',
      entityId: event.driverId,
      isRead: false,
      isResolved: false,
    });

    // Mark event as alert sent
    await db.update(geofenceEvents)
      .set({ alertSent: true })
      .where(eq(geofenceEvents.id, event.id!));
  }

  // Calculate distance between two points (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  // Network status and offline job operations
  async updateDriverNetworkStatus(driverId: number, statusData: { networkStatus: string; pendingJobs: number; lastSyncAt: Date }): Promise<void> {
    await db
      .update(drivers)
      .set(statusData)
      .where(eq(drivers.id, driverId));
  }

  async storeOfflineJob(offlineJob: InsertOfflineJob): Promise<OfflineJob> {
    const [result] = await db
      .insert(offlineJobs)
      .values(offlineJob)
      .returning();
    return result;
  }

  async getOfflineJobsByDriver(driverId: number): Promise<OfflineJob[]> {
    return await db
      .select()
      .from(offlineJobs)
      .where(and(eq(offlineJobs.driverId, driverId), isNull(offlineJobs.syncedAt)))
      .orderBy(offlineJobs.createdAt);
  }

  async markOfflineJobSynced(offlineJobId: number): Promise<void> {
    await db
      .update(offlineJobs)
      .set({ syncedAt: new Date() })
      .where(eq(offlineJobs.id, offlineJobId));
  }

  async incrementOfflineJobAttempts(offlineJobId: number): Promise<void> {
    await db
      .update(offlineJobs)
      .set({ syncAttempts: db.sql`${offlineJobs.syncAttempts} + 1` })
      .where(eq(offlineJobs.id, offlineJobId));
  }

  async incrementDriverPendingJobs(driverId: number): Promise<void> {
    await db
      .update(drivers)
      .set({ pendingJobs: db.sql`COALESCE(${drivers.pendingJobs}, 0) + 1` })
      .where(eq(drivers.id, driverId));
  }

  async resetDriverPendingJobs(driverId: number): Promise<void> {
    await db
      .update(drivers)
      .set({ pendingJobs: 0 })
      .where(eq(drivers.id, driverId));
  }

  async updateJobStatus(jobId: number, status: string, jobData: any): Promise<void> {
    await db
      .update(jobs)
      .set({ 
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
        notes: jobData.notes || null
      })
      .where(eq(jobs.id, jobId));
  }

  async addFuelEntry(fuelData: any): Promise<void> {
    await db
      .insert(fuelEntries)
      .values({
        vehicleId: fuelData.vehicleId,
        cost: fuelData.cost.toString(),
        liters: fuelData.liters.toString(),
        odometer: fuelData.odometer.toString(),
        photoUrl: fuelData.photoUrl || null,
        location: fuelData.location || null,
        fuelStationName: fuelData.fuelStationName || null
      });
  }

  async saveVehicleChecklist(checklistData: any): Promise<void> {
    // Store checklist data - this would typically go to a dedicated checklist table
    // For now, we'll create a maintenance record entry
    await db
      .insert(maintenanceRecords)
      .values({
        vehicleId: checklistData.vehicleId,
        type: 'checklist',
        description: `Vehicle checklist: ${JSON.stringify(checklistData.items)}`,
        performedDate: new Date(),
        status: 'completed',
        performedBy: `Driver ${checklistData.driverId}`
      });
  }

  // System Settings operations
  async getSystemSettings(): Promise<any[]> {
    return await db.select().from(systemSettings);
  }

  async getSystemSetting(key: string): Promise<any | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.settingKey, key));
    return setting;
  }

  async updateSystemSetting(key: string, value: string): Promise<any | undefined> {
    const [setting] = await db
      .update(systemSettings)
      .set({ 
        settingValue: value,
        updatedAt: new Date()
      })
      .where(eq(systemSettings.settingKey, key))
      .returning();
    return setting;
  }

  // Break time monitoring operations
  async getDriversOnLongBreak(alertMinutes: number): Promise<Driver[]> {
    const alertThreshold = new Date(Date.now() - alertMinutes * 60 * 1000);
    
    return await db
      .select()
      .from(drivers)
      .where(
        and(
          eq(drivers.isOnBreak, true),
          lt(drivers.breakStartTime, alertThreshold)
        )
      );
  }
}