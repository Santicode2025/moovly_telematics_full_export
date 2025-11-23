import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Card, Button, Badge, FAB, Portal, Modal } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/ApiService';

interface Job {
  id: number;
  jobNumber: string;
  customerName?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  status: string;
  priority: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  notes?: string;
}

export default function JobsScreen({ navigation }: any) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [breakMode, setBreakMode] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadJobs();
    loadBreakStatus();
  }, []);

  const loadJobs = async () => {
    try {
      const response = await apiService.get('/api/jobs');
      if (response.success && response.data) {
        // Filter jobs assigned to current driver
        const driverJobs = response.data.filter((job: Job) => 
          job.status === 'assigned' || job.status === 'in_progress'
        );
        setJobs(driverJobs);
      } else {
        // Try to load offline jobs
        const offlineJobs = await apiService.getOfflineData('jobs');
        if (offlineJobs) {
          setJobs(offlineJobs);
        }
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBreakStatus = async () => {
    try {
      const response = await apiService.get(`/api/drivers/${user?.id}/break-status`);
      if (response.success) {
        setBreakMode(response.data?.onBreak || false);
      }
    } catch (error) {
      console.error('Failed to load break status:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    await loadBreakStatus();
    setRefreshing(false);
  };

  const toggleBreakMode = async () => {
    try {
      const response = await apiService.post('/api/drivers/break-mode', {
        driverId: user?.id,
        onBreak: !breakMode,
      });

      if (response.success) {
        setBreakMode(!breakMode);
        Alert.alert(
          'Break Mode',
          !breakMode ? 'You are now on break' : 'Break mode disabled'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update break mode');
    }
  };

  const startJob = async (job: Job) => {
    try {
      const response = await apiService.post(`/api/jobs/${job.id}/start`, {
        driverId: user?.id,
      });

      if (response.success) {
        Alert.alert('Job Started', `Job ${job.jobNumber} has been started`);
        await loadJobs();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start job');
    }
  };

  const completeJob = async (job: Job) => {
    Alert.alert(
      'Complete Job',
      `Mark job ${job.jobNumber} as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const response = await apiService.post(`/api/jobs/${job.id}/complete`);
              if (response.success) {
                Alert.alert('Job Completed', `Job ${job.jobNumber} completed successfully`);
                await loadJobs();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to complete job');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      default: return '#16a34a';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      assigned: '#3b82f6',
      in_progress: '#f59e0b',
      completed: '#10b981',
      cancelled: '#ef4444',
    };

    return (
      <Badge 
        style={{ backgroundColor: colors[status as keyof typeof colors] || '#6b7280' }}
        size={20}
      >
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const renderJobCard = ({ item: job }: { item: Job }) => (
    <Card style={styles.jobCard} onPress={() => {
      setSelectedJob(job);
      setModalVisible(true);
    }}>
      <Card.Content>
        <View style={styles.jobHeader}>
          <Text style={styles.jobNumber}>{job.jobNumber}</Text>
          {getStatusBadge(job.status)}
        </View>
        
        <View style={styles.priorityRow}>
          <Badge 
            style={{ backgroundColor: getPriorityColor(job.priority) }}
            size={16}
          >
            {job.priority?.toUpperCase() || 'NORMAL'}
          </Badge>
        </View>

        <Text style={styles.customerName}>{job.customerName || 'Customer Name'}</Text>
        
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color="#6b7280" />
          <Text style={styles.address} numberOfLines={1}>
            {job.deliveryAddress || 'Delivery address'}
          </Text>
        </View>

        {job.scheduledTime && (
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.scheduledTime}>
              {new Date(job.scheduledTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}

        <View style={styles.jobActions}>
          {job.status === 'assigned' && (
            <Button 
              mode="contained" 
              onPress={() => startJob(job)}
              style={[styles.actionButton, { backgroundColor: '#16a34a' }]}
              labelStyle={styles.actionButtonText}
            >
              Start Job
            </Button>
          )}
          
          {job.status === 'in_progress' && (
            <Button 
              mode="contained" 
              onPress={() => completeJob(job)}
              style={[styles.actionButton, { backgroundColor: '#2563eb' }]}
              labelStyle={styles.actionButtonText}
            >
              Complete
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  const JobDetailModal = () => (
    <Portal>
      <Modal 
        visible={modalVisible} 
        onDismiss={() => setModalVisible(false)}
        contentContainerStyle={styles.modalContent}
      >
        {selectedJob && (
          <View>
            <Text style={styles.modalTitle}>{selectedJob.jobNumber}</Text>
            <Text style={styles.modalCustomer}>{selectedJob.customerName}</Text>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Pickup Address</Text>
              <Text style={styles.modalAddress}>{selectedJob.pickupAddress || 'Not specified'}</Text>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Delivery Address</Text>
              <Text style={styles.modalAddress}>{selectedJob.deliveryAddress || 'Not specified'}</Text>
            </View>

            {selectedJob.notes && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Notes</Text>
                <Text style={styles.modalNotes}>{selectedJob.notes}</Text>
              </View>
            )}

            <Button 
              mode="contained" 
              onPress={() => setModalVisible(false)}
              style={styles.modalCloseButton}
            >
              Close
            </Button>
          </View>
        )}
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity 
          style={[styles.breakButton, breakMode && styles.breakButtonActive]}
          onPress={toggleBreakMode}
        >
          <Ionicons name="pause-circle" size={20} color={breakMode ? '#ffffff' : '#1e3a8a'} />
          <Text style={[styles.breakButtonText, breakMode && styles.breakButtonTextActive]}>
            {breakMode ? 'On Break' : 'Break'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.jobsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No jobs assigned</Text>
            <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
          </View>
        }
      />

      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        color="#ffffff"
      />

      <JobDetailModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  breakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e3a8a',
    backgroundColor: '#ffffff',
  },
  breakButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  breakButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  breakButtonTextActive: {
    color: '#ffffff',
  },
  jobsList: {
    padding: 16,
  },
  jobCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  priorityRow: {
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduledTime: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  jobActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e3a8a',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#d1d5db',
    marginTop: 4,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalCustomer: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  modalAddress: {
    fontSize: 16,
    color: '#1f2937',
  },
  modalNotes: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#1e3a8a',
  },
});