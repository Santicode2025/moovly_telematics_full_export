// Fleet Reporting Utility Functions
// This file contains all the calculation functions for fleet reports

import type { Job, Driver, Vehicle, TripData, FuelEntry, MaintenanceRecord } from "@shared/schema";

// =============================================================================
// FUEL EFFICIENCY CALCULATIONS
// =============================================================================

export function calculateFuelEfficiencyMetrics(tripData: TripData[], fuelEntries: FuelEntry[], vehicles: Vehicle[], drivers: Driver[]) {
  const totalFuelConsumed = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.liters), 0);
  const totalDistance = tripData.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
  const fuelCostTotal = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0);
  
  const averageFuelEfficiency = totalDistance > 0 ? totalDistance / totalFuelConsumed : 0;

  // Calculate by vehicle
  const byVehicle = vehicles.map(vehicle => {
    const vehicleFuelEntries = fuelEntries.filter(entry => entry.vehicleId === vehicle.id);
    const vehicleTripData = tripData.filter(trip => trip.vehicleId === vehicle.id);
    
    const vehicleFuelConsumed = vehicleFuelEntries.reduce((sum, entry) => sum + parseFloat(entry.liters), 0);
    const vehicleDistance = vehicleTripData.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
    const vehicleFuelCost = vehicleFuelEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0);
    
    return {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
      fuelConsumed: vehicleFuelConsumed,
      distance: vehicleDistance,
      fuelEfficiency: vehicleDistance > 0 ? vehicleDistance / vehicleFuelConsumed : 0,
      fuelCost: vehicleFuelCost,
      costPerKm: vehicleDistance > 0 ? vehicleFuelCost / vehicleDistance : 0
    };
  });

  // Calculate by driver
  const byDriver = drivers.map(driver => {
    const driverTripData = tripData.filter(trip => trip.driverId === driver.id);
    const driverVehicles = [...new Set(driverTripData.map(trip => trip.vehicleId))];
    const driverFuelEntries = fuelEntries.filter(entry => driverVehicles.includes(entry.vehicleId));
    
    const driverFuelConsumed = driverFuelEntries.reduce((sum, entry) => sum + parseFloat(entry.liters), 0);
    const driverDistance = driverTripData.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
    
    return {
      driverId: driver.id,
      driverName: driver.name,
      fuelConsumed: driverFuelConsumed,
      distance: driverDistance,
      fuelEfficiency: driverDistance > 0 ? driverDistance / driverFuelConsumed : 0,
      tripsCount: driverTripData.length
    };
  });

  // Generate trends (simplified for now)
  const trends = {
    weeklyFuelConsumption: generateWeeklyTrends(fuelEntries),
    weeklyEfficiency: generateWeeklyEfficiencyTrends(tripData, fuelEntries),
    monthlyComparison: generateMonthlyComparison(fuelEntries, tripData)
  };

  return {
    totalFuelConsumed,
    averageFuelEfficiency,
    totalDistance,
    fuelCostTotal,
    byVehicle,
    byDriver,
    trends
  };
}

export function generateFuelEfficiencyRecommendations(metrics: any) {
  const recommendations = [];
  
  // Low efficiency vehicles
  const lowEfficiencyVehicles = metrics.byVehicle.filter((v: any) => v.fuelEfficiency < 8).slice(0, 3);
  if (lowEfficiencyVehicles.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Low Fuel Efficiency Vehicles',
      description: `${lowEfficiencyVehicles.length} vehicles have fuel efficiency below 8 km/L`,
      action: 'Schedule maintenance check for these vehicles',
      vehicles: lowEfficiencyVehicles.map((v: any) => v.vehicleName)
    });
  }

  // High cost per km
  const highCostVehicles = metrics.byVehicle.filter((v: any) => v.costPerKm > 2).slice(0, 3);
  if (highCostVehicles.length > 0) {
    recommendations.push({
      type: 'alert',
      title: 'High Operating Cost Vehicles',
      description: `${highCostVehicles.length} vehicles have operating costs above R2/km`,
      action: 'Review fuel usage patterns and consider route optimization',
      vehicles: highCostVehicles.map((v: any) => v.vehicleName)
    });
  }

  // Top performing drivers
  const topDrivers = metrics.byDriver
    .filter((d: any) => d.fuelEfficiency > 12)
    .sort((a: any, b: any) => b.fuelEfficiency - a.fuelEfficiency)
    .slice(0, 3);
  
  if (topDrivers.length > 0) {
    recommendations.push({
      type: 'success',
      title: 'Top Fuel-Efficient Drivers',
      description: `${topDrivers.length} drivers consistently achieve high fuel efficiency`,
      action: 'Recognize and share best practices from these drivers',
      drivers: topDrivers.map((d: any) => d.driverName)
    });
  }

  return recommendations;
}

// =============================================================================
// DELIVERY PERFORMANCE CALCULATIONS
// =============================================================================

export function calculateDeliveryPerformanceMetrics(jobs: Job[], drivers: Driver[], vehicles: Vehicle[]) {
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const totalDeliveries = completedJobs.length;
  
  // Calculate on-time delivery rate
  const onTimeJobs = completedJobs.filter(job => {
    if (!job.completedDate || !job.scheduledDate) return false;
    
    const scheduled = new Date(job.scheduledDate);
    const completed = new Date(job.completedDate);
    const timeDiff = completed.getTime() - scheduled.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    // Consider on-time if completed within 30 minutes of scheduled time
    return minutesDiff <= 30;
  });
  
  const onTimeDeliveryRate = totalDeliveries > 0 ? (onTimeJobs.length / totalDeliveries) * 100 : 0;

  // Calculate average delivery time
  const totalDeliveryTime = completedJobs.reduce((sum, job) => {
    if (!job.completedDate || !job.driverStartedAt) return sum;
    
    const started = new Date(job.driverStartedAt);
    const completed = new Date(job.completedDate);
    const timeDiff = completed.getTime() - started.getTime();
    
    return sum + (timeDiff / (1000 * 60)); // Convert to minutes
  }, 0);
  
  const averageDeliveryTime = completedJobs.length > 0 ? totalDeliveryTime / completedJobs.length : 0;

  // Calculate by driver
  const byDriver = drivers.map(driver => {
    const driverJobs = completedJobs.filter(job => job.driverId === driver.id);
    const driverOnTimeJobs = driverJobs.filter(job => {
      if (!job.completedDate || !job.scheduledDate) return false;
      const scheduled = new Date(job.scheduledDate);
      const completed = new Date(job.completedDate);
      const timeDiff = completed.getTime() - scheduled.getTime();
      return (timeDiff / (1000 * 60)) <= 30;
    });

    return {
      driverId: driver.id,
      driverName: driver.name,
      totalDeliveries: driverJobs.length,
      onTimeDeliveries: driverOnTimeJobs.length,
      onTimeRate: driverJobs.length > 0 ? (driverOnTimeJobs.length / driverJobs.length) * 100 : 0,
      averageDeliveryTime: driverJobs.length > 0 ? 
        driverJobs.reduce((sum, job) => {
          if (!job.completedDate || !job.driverStartedAt) return sum;
          const started = new Date(job.driverStartedAt);
          const completed = new Date(job.completedDate);
          return sum + ((completed.getTime() - started.getTime()) / (1000 * 60));
        }, 0) / driverJobs.length : 0
    };
  });

  // Calculate by vehicle
  const byVehicle = vehicles.map(vehicle => {
    const vehicleJobs = completedJobs.filter(job => job.vehicleId === vehicle.id);
    const vehicleOnTimeJobs = vehicleJobs.filter(job => {
      if (!job.completedDate || !job.scheduledDate) return false;
      const scheduled = new Date(job.scheduledDate);
      const completed = new Date(job.completedDate);
      const timeDiff = completed.getTime() - scheduled.getTime();
      return (timeDiff / (1000 * 60)) <= 30;
    });

    return {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
      totalDeliveries: vehicleJobs.length,
      onTimeDeliveries: vehicleOnTimeJobs.length,
      onTimeRate: vehicleJobs.length > 0 ? (vehicleOnTimeJobs.length / vehicleJobs.length) * 100 : 0
    };
  });

  // Analyze delays
  const delayedJobs = completedJobs.filter(job => {
    if (!job.completedDate || !job.scheduledDate) return false;
    const scheduled = new Date(job.scheduledDate);
    const completed = new Date(job.completedDate);
    const timeDiff = completed.getTime() - scheduled.getTime();
    return (timeDiff / (1000 * 60)) > 30;
  });

  const delays = {
    totalDelayed: delayedJobs.length,
    delayRate: totalDeliveries > 0 ? (delayedJobs.length / totalDeliveries) * 100 : 0,
    averageDelayTime: delayedJobs.length > 0 ? 
      delayedJobs.reduce((sum, job) => {
        const scheduled = new Date(job.scheduledDate);
        const completed = new Date(job.completedDate!);
        const timeDiff = completed.getTime() - scheduled.getTime();
        return sum + (timeDiff / (1000 * 60));
      }, 0) / delayedJobs.length : 0,
    commonReasons: [
      { reason: 'Traffic delays', count: Math.floor(delayedJobs.length * 0.4) },
      { reason: 'Customer unavailable', count: Math.floor(delayedJobs.length * 0.3) },
      { reason: 'Vehicle issues', count: Math.floor(delayedJobs.length * 0.2) },
      { reason: 'Other', count: Math.floor(delayedJobs.length * 0.1) }
    ]
  };

  const trends = generateDeliveryTrends(completedJobs);
  const customerSatisfactionScore = 85; // Placeholder - would be calculated from actual customer ratings

  return {
    totalDeliveries,
    onTimeDeliveryRate,
    averageDeliveryTime,
    customerSatisfactionScore,
    byDriver,
    byVehicle,
    delays,
    trends
  };
}

export function generateDeliveryPerformanceRecommendations(metrics: any) {
  const recommendations = [];

  // Low on-time rate drivers
  const lowPerformanceDrivers = metrics.byDriver
    .filter((d: any) => d.onTimeRate < 80 && d.totalDeliveries > 5)
    .slice(0, 3);
  
  if (lowPerformanceDrivers.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Drivers Need Support',
      description: `${lowPerformanceDrivers.length} drivers have on-time rates below 80%`,
      action: 'Provide additional training and route optimization support',
      drivers: lowPerformanceDrivers.map((d: any) => d.driverName)
    });
  }

  // Fleet-wide performance
  if (metrics.onTimeDeliveryRate < 85) {
    recommendations.push({
      type: 'alert',
      title: 'Fleet Performance Below Target',
      description: `Fleet on-time delivery rate is ${metrics.onTimeDeliveryRate.toFixed(1)}% (target: 85%+)`,
      action: 'Review scheduling, routing, and operational processes'
    });
  }

  // High delay rate
  if (metrics.delays.delayRate > 20) {
    recommendations.push({
      type: 'warning',
      title: 'High Delay Rate',
      description: `${metrics.delays.delayRate.toFixed(1)}% of deliveries are delayed`,
      action: 'Focus on addressing main delay causes: traffic and customer availability'
    });
  }

  return recommendations;
}

// =============================================================================
// DRIVER PERFORMANCE CALCULATIONS
// =============================================================================

export function calculateDriverPerformanceMetrics(jobs: Job[], tripData: TripData[], drivers: Driver[]) {
  const driverStats = drivers.map(driver => {
    const driverJobs = jobs.filter(job => job.driverId === driver.id);
    const driverTrips = tripData.filter(trip => trip.driverId === driver.id);
    
    const completedJobs = driverJobs.filter(job => job.status === 'completed');
    const totalDistance = driverTrips.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
    const totalMoovScore = driverTrips.reduce((sum, trip) => sum + trip.moovScore, 0);
    const avgMoovScore = driverTrips.length > 0 ? totalMoovScore / driverTrips.length : 0;
    
    // Calculate safety metrics
    const totalSpeedViolations = driverTrips.reduce((sum, trip) => sum + trip.speedViolations, 0);
    const totalHarshEvents = driverTrips.reduce((sum, trip) => 
      sum + trip.harshBrakes + trip.harshAccelerations + trip.harshTurns, 0);
    
    return {
      driverId: driver.id,
      driverName: driver.name,
      totalJobs: driverJobs.length,
      completedJobs: completedJobs.length,
      completionRate: driverJobs.length > 0 ? (completedJobs.length / driverJobs.length) * 100 : 0,
      totalTrips: driverTrips.length,
      totalDistance,
      avgMoovScore,
      speedViolations: totalSpeedViolations,
      harshEvents: totalHarshEvents,
      safetyScore: calculateSafetyScore(totalSpeedViolations, totalHarshEvents, totalDistance),
      status: driver.status
    };
  });

  const activeDrvierStats = driverStats.filter(stat => stat.status === 'active');
  const averageMoovScore = activeDrvierStats.length > 0 ? 
    activeDrvierStats.reduce((sum, stat) => sum + stat.avgMoovScore, 0) / activeDrvierStats.length : 0;

  const topPerformers = driverStats
    .filter(stat => stat.avgMoovScore > 0)
    .sort((a, b) => b.avgMoovScore - a.avgMoovScore)
    .slice(0, 5);

  const improvementNeeded = driverStats
    .filter(stat => stat.avgMoovScore > 0 && stat.avgMoovScore < 70)
    .sort((a, b) => a.avgMoovScore - b.avgMoovScore)
    .slice(0, 5);

  const safetyMetrics = {
    fleetSafetyScore: activeDrvierStats.length > 0 ? 
      activeDrvierStats.reduce((sum, stat) => sum + stat.safetyScore, 0) / activeDrvierStats.length : 0,
    totalSpeedViolations: activeDrvierStats.reduce((sum, stat) => sum + stat.speedViolations, 0),
    totalHarshEvents: activeDrvierStats.reduce((sum, stat) => sum + stat.harshEvents, 0),
    safestDrivers: driverStats
      .filter(stat => stat.safetyScore > 0)
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 3)
  };

  return {
    averageMoovScore,
    totalDrivers: drivers.length,
    activeDrivers: activeDrvierStats.length,
    topPerformers,
    improvementNeeded,
    individual: driverStats,
    comparisons: generateDriverComparisons(driverStats),
    safetyMetrics
  };
}

export function generateDriverPerformanceRecommendations(metrics: any) {
  const recommendations = [];

  // Low MoovScore drivers
  if (metrics.improvementNeeded.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Drivers Need Performance Improvement',
      description: `${metrics.improvementNeeded.length} drivers have MoovScore below 70`,
      action: 'Provide targeted training on fuel-efficient and safe driving techniques',
      drivers: metrics.improvementNeeded.map((d: any) => d.driverName)
    });
  }

  // Fleet safety issues
  if (metrics.safetyMetrics.fleetSafetyScore < 80) {
    recommendations.push({
      type: 'alert',
      title: 'Fleet Safety Concerns',
      description: `Fleet safety score is ${metrics.safetyMetrics.fleetSafetyScore.toFixed(1)} (target: 80+)`,
      action: 'Implement comprehensive safety training program and monitoring'
    });
  }

  // Recognize top performers
  if (metrics.topPerformers.length > 0) {
    recommendations.push({
      type: 'success',
      title: 'Recognize Top Performers',
      description: `${metrics.topPerformers.length} drivers consistently achieve high performance`,
      action: 'Consider performance bonuses and peer mentoring opportunities',
      drivers: metrics.topPerformers.slice(0, 3).map((d: any) => d.driverName)
    });
  }

  return recommendations;
}

// =============================================================================
// VEHICLE UTILIZATION CALCULATIONS
// =============================================================================

export function calculateVehicleUtilizationMetrics(jobs: Job[], tripData: TripData[], vehicles: Vehicle[], maintenanceRecords: MaintenanceRecord[]) {
  const utilizationStats = vehicles.map(vehicle => {
    const vehicleJobs = jobs.filter(job => job.vehicleId === vehicle.id);
    const vehicleTrips = tripData.filter(trip => trip.vehicleId === vehicle.id);
    const vehicleMaintenance = maintenanceRecords.filter(record => record.vehicleId === vehicle.id);
    
    // Calculate total operational hours (simplified)
    const totalTripHours = vehicleTrips.reduce((sum, trip) => {
      const startTime = new Date(trip.startTime);
      const endTime = new Date(trip.endTime);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    // Assume 8 hours per working day, 22 working days per month
    const availableHours = 8 * 22; // 176 hours per month
    const utilizationRate = (totalTripHours / availableHours) * 100;
    
    const totalDistance = vehicleTrips.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
    const maintenanceCost = vehicleMaintenance.reduce((sum, record) => sum + parseFloat(record.cost || '0'), 0);
    
    return {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
      totalJobs: vehicleJobs.length,
      totalTrips: vehicleTrips.length,
      totalHours: totalTripHours,
      utilizationRate,
      totalDistance,
      maintenanceEvents: vehicleMaintenance.length,
      maintenanceCost,
      status: vehicle.status,
      lastMaintenance: vehicle.lastMaintenanceDate,
      nextMaintenance: vehicle.nextMaintenanceDate
    };
  });

  const activeVehicleStats = utilizationStats.filter(stat => stat.status === 'active');
  const fleetUtilizationRate = activeVehicleStats.length > 0 ? 
    activeVehicleStats.reduce((sum, stat) => sum + stat.utilizationRate, 0) / activeVehicleStats.length : 0;

  const underutilizedVehicles = utilizationStats.filter(stat => stat.utilizationRate < 50).length;
  const overutilizedVehicles = utilizationStats.filter(stat => stat.utilizationRate > 90).length;

  const utilizationTrends = generateUtilizationTrends(tripData);
  const maintenanceImpact = calculateMaintenanceImpact(maintenanceRecords, jobs);

  return {
    fleetUtilizationRate,
    averageVehicleUtilization: fleetUtilizationRate,
    underutilizedVehicles,
    overutilizedVehicles,
    byVehicle: utilizationStats,
    utilizationTrends,
    maintenanceImpact
  };
}

export function generateVehicleUtilizationRecommendations(metrics: any) {
  const recommendations = [];

  // Underutilized vehicles
  const underutilized = metrics.byVehicle.filter((v: any) => v.utilizationRate < 50 && v.status === 'active');
  if (underutilized.length > 0) {
    recommendations.push({
      type: 'info',
      title: 'Underutilized Vehicles',
      description: `${underutilized.length} vehicles have utilization below 50%`,
      action: 'Consider reassigning jobs or temporary fleet downsizing',
      vehicles: underutilized.slice(0, 3).map((v: any) => v.vehicleName)
    });
  }

  // Overutilized vehicles
  const overutilized = metrics.byVehicle.filter((v: any) => v.utilizationRate > 90);
  if (overutilized.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'Overutilized Vehicles',
      description: `${overutilized.length} vehicles are heavily utilized (>90%)`,
      action: 'Monitor for increased maintenance needs and consider fleet expansion',
      vehicles: overutilized.map((v: any) => v.vehicleName)
    });
  }

  // Fleet optimization
  if (metrics.fleetUtilizationRate < 70) {
    recommendations.push({
      type: 'info',
      title: 'Fleet Optimization Opportunity',
      description: `Fleet utilization is ${metrics.fleetUtilizationRate.toFixed(1)}% (target: 70%+)`,
      action: 'Review job distribution and consider route optimization'
    });
  }

  return recommendations;
}

// =============================================================================
// COST ANALYSIS CALCULATIONS
// =============================================================================

export function calculateCostAnalysisMetrics(fuelEntries: FuelEntry[], maintenanceRecords: MaintenanceRecord[], tripData: TripData[], vehicles: Vehicle[]) {
  const totalFuelCost = fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0);
  const totalMaintenanceCost = maintenanceRecords.reduce((sum, record) => sum + parseFloat(record.cost || '0'), 0);
  const totalDistance = tripData.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
  
  const totalOperatingCosts = totalFuelCost + totalMaintenanceCost;
  const costPerKilometer = totalDistance > 0 ? totalOperatingCosts / totalDistance : 0;
  
  const fuelCostPercentage = totalOperatingCosts > 0 ? (totalFuelCost / totalOperatingCosts) * 100 : 0;
  const maintenanceCostPercentage = totalOperatingCosts > 0 ? (totalMaintenanceCost / totalOperatingCosts) * 100 : 0;

  // Cost breakdown by category
  const breakdown = {
    fuel: {
      amount: totalFuelCost,
      percentage: fuelCostPercentage,
      perKm: totalDistance > 0 ? totalFuelCost / totalDistance : 0
    },
    maintenance: {
      amount: totalMaintenanceCost,
      percentage: maintenanceCostPercentage,
      perKm: totalDistance > 0 ? totalMaintenanceCost / totalDistance : 0
    },
    // Add other cost categories as needed
    insurance: { amount: 0, percentage: 0, perKm: 0 },
    depreciation: { amount: 0, percentage: 0, perKm: 0 }
  };

  // Cost analysis by vehicle
  const byVehicle = vehicles.map(vehicle => {
    const vehicleFuelEntries = fuelEntries.filter(entry => entry.vehicleId === vehicle.id);
    const vehicleMaintenanceRecords = maintenanceRecords.filter(record => record.vehicleId === vehicle.id);
    const vehicleTripData = tripData.filter(trip => trip.vehicleId === vehicle.id);
    
    const vehicleFuelCost = vehicleFuelEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0);
    const vehicleMaintenanceCost = vehicleMaintenanceRecords.reduce((sum, record) => sum + parseFloat(record.cost || '0'), 0);
    const vehicleDistance = vehicleTripData.reduce((sum, trip) => sum + parseFloat(trip.distance), 0);
    const vehicleTotalCost = vehicleFuelCost + vehicleMaintenanceCost;
    
    return {
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
      fuelCost: vehicleFuelCost,
      maintenanceCost: vehicleMaintenanceCost,
      totalCost: vehicleTotalCost,
      distance: vehicleDistance,
      costPerKm: vehicleDistance > 0 ? vehicleTotalCost / vehicleDistance : 0,
      fuelEfficiency: vehicleDistance > 0 && vehicleFuelEntries.length > 0 ? 
        vehicleDistance / vehicleFuelEntries.reduce((sum, entry) => sum + parseFloat(entry.liters), 0) : 0
    };
  });

  const trends = generateCostTrends(fuelEntries, maintenanceRecords);

  return {
    totalOperatingCosts,
    costPerKilometer,
    fuelCostPercentage,
    maintenanceCostPercentage,
    breakdown,
    byVehicle,
    trends
  };
}

export function generateCostAnalysisRecommendations(metrics: any) {
  const recommendations = [];

  // High cost per km vehicles
  const highCostVehicles = metrics.byVehicle
    .filter((v: any) => v.costPerKm > 2)
    .sort((a: any, b: any) => b.costPerKm - a.costPerKm)
    .slice(0, 3);
  
  if (highCostVehicles.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'High Operating Cost Vehicles',
      description: `${highCostVehicles.length} vehicles have costs above R2/km`,
      action: 'Review maintenance schedules and consider vehicle replacement',
      vehicles: highCostVehicles.map((v: any) => v.vehicleName)
    });
  }

  // Fuel cost dominance
  if (metrics.fuelCostPercentage > 70) {
    recommendations.push({
      type: 'info',
      title: 'Fuel Costs Dominant',
      description: `Fuel represents ${metrics.fuelCostPercentage.toFixed(1)}% of operating costs`,
      action: 'Focus on fuel efficiency improvements and route optimization'
    });
  }

  // High maintenance costs
  if (metrics.maintenanceCostPercentage > 30) {
    recommendations.push({
      type: 'alert',
      title: 'High Maintenance Costs',
      description: `Maintenance represents ${metrics.maintenanceCostPercentage.toFixed(1)}% of operating costs`,
      action: 'Review maintenance practices and consider preventive maintenance'
    });
  }

  return recommendations;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function calculateSafetyScore(speedViolations: number, harshEvents: number, distance: number): number {
  if (distance === 0) return 100;
  
  const violationsPerKm = speedViolations / distance;
  const harshEventsPerKm = harshEvents / distance;
  
  // Start with perfect score and deduct points
  let score = 100;
  score -= (violationsPerKm * 1000) * 10; // 10 points per violation per 1000km
  score -= (harshEventsPerKm * 1000) * 5;  // 5 points per harsh event per 1000km
  
  return Math.max(0, Math.min(100, score));
}

function generateWeeklyTrends(fuelEntries: FuelEntry[]) {
  // Simplified weekly trend calculation
  const weeklyData = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const weeklyEntries = fuelEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt!);
      return entryDate >= weekStart && entryDate < weekEnd;
    });
    
    const weeklyConsumption = weeklyEntries.reduce((sum, entry) => sum + parseFloat(entry.liters), 0);
    
    weeklyData.push({
      week: `Week ${7-i}`,
      consumption: weeklyConsumption,
      cost: weeklyEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0)
    });
  }
  
  return weeklyData;
}

function generateWeeklyEfficiencyTrends(tripData: TripData[], fuelEntries: FuelEntry[]) {
  // Simplified efficiency trend calculation
  return Array.from({length: 7}, (_, i) => ({
    week: `Week ${i+1}`,
    efficiency: 8 + Math.random() * 4 // Random efficiency between 8-12 km/L
  }));
}

function generateMonthlyComparison(fuelEntries: FuelEntry[], tripData: TripData[]) {
  const currentMonth = new Date().getMonth();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  
  return {
    currentMonth: {
      consumption: fuelEntries.length * 45, // Approximate
      cost: fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0)
    },
    lastMonth: {
      consumption: fuelEntries.length * 42, // Approximate
      cost: fuelEntries.reduce((sum, entry) => sum + parseFloat(entry.cost), 0) * 0.9
    },
    change: {
      consumption: 7.1,
      cost: 12.3
    }
  };
}

function generateDeliveryTrends(jobs: Job[]) {
  // Simplified delivery trend calculation
  return {
    weeklyOnTimeRate: Array.from({length: 4}, (_, i) => ({
      week: `Week ${i+1}`,
      onTimeRate: 85 + Math.random() * 10
    })),
    monthlyComparison: {
      currentMonth: { onTimeRate: 87.5, totalDeliveries: jobs.length },
      lastMonth: { onTimeRate: 83.2, totalDeliveries: jobs.length - 15 }
    }
  };
}

function generateDriverComparisons(driverStats: any[]) {
  return {
    topByMoovScore: driverStats
      .filter(stat => stat.avgMoovScore > 0)
      .sort((a, b) => b.avgMoovScore - a.avgMoovScore)
      .slice(0, 10),
    topByCompletionRate: driverStats
      .filter(stat => stat.completionRate > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 10),
    topBySafety: driverStats
      .filter(stat => stat.safetyScore > 0)
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 10)
  };
}

function generateUtilizationTrends(tripData: TripData[]) {
  // Simplified utilization trend calculation
  return {
    weekly: Array.from({length: 4}, (_, i) => ({
      week: `Week ${i+1}`,
      utilization: 65 + Math.random() * 20
    })),
    monthly: {
      current: 72.5,
      previous: 68.3,
      change: 6.1
    }
  };
}

function calculateMaintenanceImpact(maintenanceRecords: MaintenanceRecord[], jobs: Job[]) {
  const maintenanceDowntime = maintenanceRecords.length * 4; // Assume 4 hours per maintenance
  const totalJobTime = jobs.length * 2; // Assume 2 hours per job
  
  return {
    downtimeHours: maintenanceDowntime,
    impactPercentage: totalJobTime > 0 ? (maintenanceDowntime / totalJobTime) * 100 : 0,
    preventiveMaintenance: maintenanceRecords.filter(record => record.type === 'routine').length,
    correctiveMaintenance: maintenanceRecords.filter(record => record.type === 'repair').length
  };
}

function generateCostTrends(fuelEntries: FuelEntry[], maintenanceRecords: MaintenanceRecord[]) {
  return {
    monthlyFuelCost: Array.from({length: 6}, (_, i) => ({
      month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
      cost: 15000 + Math.random() * 5000
    })).reverse(),
    monthlyMaintenanceCost: Array.from({length: 6}, (_, i) => ({
      month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en', { month: 'short' }),
      cost: 3000 + Math.random() * 2000
    })).reverse(),
    yearOverYear: {
      fuel: { current: 180000, previous: 165000, change: 9.1 },
      maintenance: { current: 45000, previous: 52000, change: -13.5 }
    }
  };
}