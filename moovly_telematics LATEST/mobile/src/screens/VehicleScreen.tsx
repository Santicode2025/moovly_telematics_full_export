import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, List, Badge } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/ApiService';

export default function VehicleScreen({ navigation }: any) {
  const [vehicle, setVehicle] = useState({
    make: 'Mini',
    model: 'Cooper',
    year: '2023',
    registration: 'ABC 123 GP',
    mileage: '15,234 km',
    fuelLevel: 75,
    lastService: '2024-12-15',
    nextService: '2025-03-15',
  });
  const [fuelEntries, setFuelEntries] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    loadVehicleData();
    loadFuelEntries();
  }, []);

  const loadVehicleData = async () => {
    try {
      const response = await apiService.get(`/api/vehicles/${user?.vehicleId}`);
      if (response.success && response.data) {
        setVehicle(response.data);
      }
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
    }
  };

  const loadFuelEntries = async () => {
    try {
      const response = await apiService.get(`/api/fuel-entries/vehicle/${user?.vehicleId}`);
      if (response.success && response.data) {
        setFuelEntries(response.data.slice(0, 5)); // Show last 5 entries
      }
    } catch (error) {
      console.error('Failed to load fuel entries:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Vehicle Info */}
      <Card style={styles.vehicleCard}>
        <Card.Content>
          <View style={styles.vehicleHeader}>
            <Ionicons name="car" size={40} color="#1e3a8a" />
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleName}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.registration}>{vehicle.registration}</Text>
            </View>
          </View>
          
          <View style={styles.vehicleStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vehicle.mileage}</Text>
              <Text style={styles.statLabel}>Total Mileage</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vehicle.fuelLevel}%</Text>
              <Text style={styles.statLabel}>Fuel Level</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('FuelUpload')}
            >
              <Ionicons name="car" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>Add Fuel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Checklist')}
            >
              <Ionicons name="checkmark-done" size={24} color="#ffffff" />
              <Text style={styles.actionButtonText}>Checklist</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Fuel Entries */}
      <Card style={styles.fuelCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Recent Fuel Entries</Text>
          
          {fuelEntries.length > 0 ? (
            fuelEntries.map((entry: any, index) => (
              <List.Item
                key={index}
                title={`${entry.litres}L - R${entry.cost}`}
                description={new Date(entry.timestamp).toLocaleDateString()}
                left={(props) => <List.Icon {...props} icon="gas-station" />}
                right={(props) => (
                  <Badge {...props} style={styles.syncBadge}>
                    {entry.synced ? 'Synced' : 'Pending'}
                  </Badge>
                )}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="gas-station-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No fuel entries yet</Text>
              <Button 
                mode="outlined" 
                onPress={() => navigation.navigate('FuelUpload')}
                style={styles.addButton}
              >
                Add First Entry
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Maintenance Info */}
      <Card style={styles.maintenanceCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Maintenance</Text>
          
          <View style={styles.maintenanceItem}>
            <View style={styles.maintenanceHeader}>
              <Ionicons name="build-outline" size={20} color="#16a34a" />
              <Text style={styles.maintenanceTitle}>Last Service</Text>
            </View>
            <Text style={styles.maintenanceDate}>
              {new Date(vehicle.lastService).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.maintenanceItem}>
            <View style={styles.maintenanceHeader}>
              <Ionicons name="calendar-outline" size={20} color="#f59e0b" />
              <Text style={styles.maintenanceTitle}>Next Service</Text>
            </View>
            <Text style={styles.maintenanceDate}>
              {new Date(vehicle.nextService).toLocaleDateString()}
            </Text>
          </View>

          <Button 
            mode="outlined" 
            onPress={() => navigation.navigate('Checklist')}
            style={styles.checklistButton}
          >
            Complete Checklist
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  vehicleCard: {
    margin: 16,
    elevation: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  vehicleInfo: {
    marginLeft: 16,
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  registration: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  vehicleStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  actionsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    backgroundColor: '#1e3a8a',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  fuelCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  syncBadge: {
    backgroundColor: '#16a34a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 20,
  },
  addButton: {
    borderColor: '#1e3a8a',
  },
  maintenanceCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    elevation: 2,
  },
  maintenanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  maintenanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  maintenanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  maintenanceDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  checklistButton: {
    marginTop: 16,
    borderColor: '#1e3a8a',
  },
});