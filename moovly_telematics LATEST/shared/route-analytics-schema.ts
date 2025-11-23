import { pgTable, text, varchar, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Route Analytics & Historical Data
export const routeAnalytics = pgTable("route_analytics", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  driverId: integer("driver_id").notNull(),
  vehicleId: integer("vehicle_id").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  plannedRoute: text("planned_route"), // JSON string of planned coordinates
  actualRoute: text("actual_route"), // JSON string of actual GPS coordinates
  plannedDistance: decimal("planned_distance", { precision: 8, scale: 2 }),
  actualDistance: decimal("actual_distance", { precision: 8, scale: 2 }),
  plannedDuration: integer("planned_duration_minutes"),
  actualDuration: integer("actual_duration_minutes"),
  fuelUsed: decimal("fuel_used", { precision: 6, scale: 2 }),
  trafficCondition: text("traffic_condition"), // light, moderate, heavy
  weatherCondition: text("weather_condition"), // clear, rain, fog, storm
  timeOfDay: text("time_of_day"), // morning, afternoon, evening, night
  dayOfWeek: text("day_of_week"), // monday, tuesday, etc.
  deviation: decimal("deviation_percentage", { precision: 5, scale: 2 }),
  efficiency: decimal("efficiency_score", { precision: 5, scale: 2 }), // 0-100
  customerRating: integer("customer_rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
});

// Route Patterns - Smart suggestions based on historical data
export const routePatterns = pgTable("route_patterns", {
  id: serial("id").primaryKey(),
  patternName: text("pattern_name").notNull(),
  geographicArea: text("geographic_area").notNull(), // Area identifier (e.g., "CBD", "Northern Suburbs")
  optimalSequence: text("optimal_sequence").notNull(), // JSON array of location types
  averageStops: integer("average_stops"),
  averageDuration: integer("average_duration_minutes"),
  averageDistance: decimal("average_distance", { precision: 8, scale: 2 }),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }), // Percentage of on-time deliveries
  bestTimeSlots: text("best_time_slots"), // JSON array of optimal time windows
  trafficAnalysis: text("traffic_analysis"), // JSON object with traffic insights
  seasonalFactors: text("seasonal_factors"), // JSON object with seasonal adjustments
  confidence: decimal("confidence_score", { precision: 5, scale: 2 }), // AI confidence level
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Smart Optimization Suggestions
export const optimizationSuggestions = pgTable("optimization_suggestions", {
  id: serial("id").primaryKey(),
  jobIds: text("job_ids").notNull(), // JSON array of job IDs being optimized
  suggestionType: text("suggestion_type").notNull(), // route_order, timing, driver_assignment, vehicle_selection
  currentState: text("current_state").notNull(), // JSON of current job assignments
  suggestedState: text("suggested_state").notNull(), // JSON of optimized assignments
  reasoning: text("reasoning").notNull(), // AI explanation of why this optimization is suggested
  historicalBasis: text("historical_basis"), // JSON array of similar historical routes
  predictedSavings: text("predicted_savings"), // JSON object with time, fuel, cost savings
  confidence: decimal("confidence_score", { precision: 5, scale: 2 }),
  priority: text("priority").notNull().default("medium"), // high, medium, low
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  createdBy: integer("created_by"), // User ID who requested optimization
  acceptedBy: integer("accepted_by"), // User ID who accepted suggestion
  acceptedAt: timestamp("accepted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertRouteAnalyticsSchema = createInsertSchema(routeAnalytics);
export const insertRoutePatternsSchema = createInsertSchema(routePatterns);
export const insertOptimizationSuggestionsSchema = createInsertSchema(optimizationSuggestions);

// Infer types
export type RouteAnalytics = typeof routeAnalytics.$inferSelect;
export type InsertRouteAnalytics = z.infer<typeof insertRouteAnalyticsSchema>;
export type RoutePatterns = typeof routePatterns.$inferSelect;
export type InsertRoutePatterns = z.infer<typeof insertRoutePatternsSchema>;
export type OptimizationSuggestions = typeof optimizationSuggestions.$inferSelect;
export type InsertOptimizationSuggestions = z.infer<typeof insertOptimizationSuggestionsSchema>;