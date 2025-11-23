import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Card, Button, Checkbox, List } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/ApiService';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  checked: boolean;
  required: boolean;
}

export default function ChecklistScreen({ navigation }: any) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // Engine & Fluids
    { id: 'engine_oil', category: 'Engine & Fluids', item: 'Engine oil level', checked: false, required: true },
    { id: 'coolant', category: 'Engine & Fluids', item: 'Coolant level', checked: false, required: true },
    { id: 'brake_fluid', category: 'Engine & Fluids', item: 'Brake fluid level', checked: false, required: true },
    { id: 'windshield_fluid', category: 'Engine & Fluids', item: 'Windshield washer fluid', checked: false, required: false },
    
    // Lights & Electrical
    { id: 'headlights', category: 'Lights & Electrical', item: 'Headlights working', checked: false, required: true },
    { id: 'taillights', category: 'Lights & Electrical', item: 'Taillights working', checked: false, required: true },
    { id: 'indicators', category: 'Lights & Electrical', item: 'Turn indicators working', checked: false, required: true },
    { id: 'hazards', category: 'Lights & Electrical', item: 'Hazard lights working', checked: false, required: true },
    
    // Tyres & Wheels
    { id: 'tyre_pressure', category: 'Tyres & Wheels', item: 'Tyre pressure adequate', checked: false, required: true },
    { id: 'tyre_condition', category: 'Tyres & Wheels', item: 'Tyre condition good', checked: false, required: true },
    { id: 'spare_tyre', category: 'Tyres & Wheels', item: 'Spare tyre available', checked: false, required: false },
    
    // Interior & Safety
    { id: 'seatbelts', category: 'Interior & Safety', item: 'Seatbelts functional', checked: false, required: true },
    { id: 'mirrors', category: 'Interior & Safety', item: 'Mirrors clean and adjusted', checked: false, required: true },
    { id: 'first_aid', category: 'Interior & Safety', item: 'First aid kit present', checked: false, required: false },
    { id: 'fire_extinguisher', category: 'Interior & Safety', item: 'Fire extinguisher present', checked: false, required: false },
    
    // Exterior
    { id: 'windshield', category: 'Exterior', item: 'Windshield clean and undamaged', checked: false, required: true },
    { id: 'wipers', category: 'Exterior', item: 'Windshield wipers working', checked: false, required: true },
    { id: 'body_damage', category: 'Exterior', item: 'No new body damage', checked: false, required: true },
  ]);
  
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const getCompletionStats = () => {
    const total = checklist.length;
    const completed = checklist.filter(item => item.checked).length;
    const requiredTotal = checklist.filter(item => item.required).length;
    const requiredCompleted = checklist.filter(item => item.required && item.checked).length;
    
    return {
      total,
      completed,
      requiredTotal,
      requiredCompleted,
      completionRate: Math.round((completed / total) * 100),
      requiredRate: Math.round((requiredCompleted / requiredTotal) * 100)
    };
  };

  const submitChecklist = async () => {
    const stats = getCompletionStats();
    
    if (stats.requiredCompleted < stats.requiredTotal) {
      Alert.alert(
        'Incomplete Checklist',
        `Please complete all required items (${stats.requiredCompleted}/${stats.requiredTotal} completed).`
      );
      return;
    }

    setSubmitting(true);

    try {
      const checklistData = {
        driverId: user?.id,
        vehicleId: user?.vehicleId,
        timestamp: new Date().toISOString(),
        items: checklist,
        completionRate: stats.completionRate,
        requiredCompleted: stats.requiredCompleted,
        totalItems: stats.total
      };

      const response = await apiService.post('/api/vehicle-checklist', checklistData);

      if (response.success) {
        Alert.alert(
          'Checklist Submitted',
          'Vehicle checklist completed successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        // Save offline if network fails
        await apiService.saveOfflineData('checklist', checklistData);
        Alert.alert(
          'Saved Offline',
          'Checklist saved offline and will sync when connected.'
        );
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit checklist');
    } finally {
      setSubmitting(false);
    }
  };

  const renderChecklistSection = (category: string) => {
    const categoryItems = checklist.filter(item => item.category === category);
    const completedItems = categoryItems.filter(item => item.checked).length;
    
    return (
      <Card key={category} style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{category}</Text>
            <Text style={styles.sectionProgress}>
              {completedItems}/{categoryItems.length}
            </Text>
          </View>
          
          {categoryItems.map(item => (
            <List.Item
              key={item.id}
              title={item.item}
              titleStyle={[
                styles.itemTitle,
                item.checked && styles.itemCompleted
              ]}
              left={() => (
                <Checkbox
                  status={item.checked ? 'checked' : 'unchecked'}
                  onPress={() => toggleChecklistItem(item.id)}
                />
              )}
              right={() => (
                item.required && (
                  <View style={styles.requiredBadge}>
                    <Text style={styles.requiredText}>Required</Text>
                  </View>
                )
              )}
              onPress={() => toggleChecklistItem(item.id)}
              style={styles.checklistItem}
            />
          ))}
        </Card.Content>
      </Card>
    );
  };

  const stats = getCompletionStats();
  const categories = [...new Set(checklist.map(item => item.category))];

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <Card style={styles.progressCard}>
        <Card.Content>
          <Text style={styles.progressTitle}>Vehicle Checklist Progress</Text>
          
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>of {stats.total} completed</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[
                styles.statNumber,
                { color: stats.requiredCompleted === stats.requiredTotal ? '#16a34a' : '#dc2626' }
              ]}>
                {stats.requiredCompleted}
              </Text>
              <Text style={styles.statLabel}>of {stats.requiredTotal} required</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${stats.completionRate}%` }
                ]}
              />
            </View>
            <Text style={styles.progressPercent}>{stats.completionRate}%</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Checklist Sections */}
      <ScrollView style={styles.checklistContainer}>
        {categories.map(category => renderChecklistSection(category))}
        
        <View style={styles.submitContainer}>
          <Button
            mode="contained"
            onPress={submitChecklist}
            loading={submitting}
            disabled={submitting || stats.requiredCompleted < stats.requiredTotal}
            style={[
              styles.submitButton,
              { opacity: stats.requiredCompleted === stats.requiredTotal ? 1 : 0.6 }
            ]}
            contentStyle={styles.submitButtonContent}
          >
            {submitting ? 'Submitting...' : 'Submit Checklist'}
          </Button>
          
          {stats.requiredCompleted < stats.requiredTotal && (
            <Text style={styles.submitWarning}>
              Complete all required items to submit
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  progressCard: {
    margin: 16,
    elevation: 4,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1e3a8a',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  checklistContainer: {
    flex: 1,
  },
  sectionCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  sectionProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  checklistItem: {
    paddingVertical: 4,
  },
  itemTitle: {
    fontSize: 14,
    color: '#374151',
  },
  itemCompleted: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  requiredBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  requiredText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '600',
  },
  submitContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#1e3a8a',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  submitWarning: {
    fontSize: 12,
    color: '#dc2626',
    textAlign: 'center',
    marginTop: 8,
  },
});