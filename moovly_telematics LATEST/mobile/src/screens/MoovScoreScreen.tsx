import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../services/AuthContext';
import { apiService } from '../services/ApiService';

const { width } = Dimensions.get('window');

interface MoovScoreData {
  currentScore: number;
  weeklyAverage: number;
  monthlyAverage: number;
  speedingEvents: number;
  harshBraking: number;
  rapidAcceleration: number;
  smoothDriving: number;
  fuelEfficiency: number;
}

export default function MoovScoreScreen() {
  const [scoreData, setScoreData] = useState<MoovScoreData>({
    currentScore: 85,
    weeklyAverage: 82,
    monthlyAverage: 79,
    speedingEvents: 3,
    harshBraking: 2,
    rapidAcceleration: 1,
    smoothDriving: 92,
    fuelEfficiency: 88,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadMoovScore();
  }, []);

  const loadMoovScore = async () => {
    try {
      const response = await apiService.get(`/api/drivers/${user?.id}/moovscore`);
      if (response.success && response.data) {
        setScoreData(response.data);
      }
    } catch (error) {
      console.error('Failed to load MoovScore:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#16a34a'; // Green
    if (score >= 80) return '#ca8a04'; // Yellow
    if (score >= 70) return '#ea580c'; // Orange
    return '#dc2626'; // Red
  };

  const getScoreDescription = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Fair';
    return 'Needs Improvement';
  };

  const renderScoreCircle = (score: number, size: number = 120) => {
    const radius = size / 2 - 10;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <View style={[styles.scoreCircle, { width: size, height: size }]}>
        <View style={styles.scoreCircleInner}>
          <Text style={[styles.scoreNumber, { fontSize: size * 0.25 }]}>{score}</Text>
          <Text style={[styles.scoreLabel, { fontSize: size * 0.08 }]}>
            {getScoreDescription(score)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Current Score */}
      <Card style={styles.mainScoreCard}>
        <Card.Content style={styles.mainScoreContent}>
          <Text style={styles.mainScoreTitle}>Current MoovScore</Text>
          {renderScoreCircle(scoreData.currentScore, 140)}
          <Text style={styles.scoreSubtitle}>
            Drive safely to improve your score
          </Text>
        </Card.Content>
      </Card>

      {/* Score Trends */}
      <Card style={styles.trendsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Score Trends</Text>
          
          <View style={styles.trendRow}>
            <View style={styles.trendItem}>
              <Text style={styles.trendValue}>{scoreData.weeklyAverage}</Text>
              <Text style={styles.trendLabel}>Weekly Avg</Text>
            </View>
            <View style={styles.trendItem}>
              <Text style={styles.trendValue}>{scoreData.monthlyAverage}</Text>
              <Text style={styles.trendLabel}>Monthly Avg</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Driving Metrics */}
      <Card style={styles.metricsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Driving Metrics</Text>
          
          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Ionicons name="speedometer-outline" size={20} color="#dc2626" />
              <Text style={styles.metricTitle}>Smooth Driving</Text>
              <Text style={styles.metricValue}>{scoreData.smoothDriving}%</Text>
            </View>
            <ProgressBar 
              progress={scoreData.smoothDriving / 100}
              color={getScoreColor(scoreData.smoothDriving)}
              style={styles.progressBar}
            />
          </View>

          <View style={styles.metricItem}>
            <View style={styles.metricHeader}>
              <Ionicons name="leaf-outline" size={20} color="#16a34a" />
              <Text style={styles.metricTitle}>Fuel Efficiency</Text>
              <Text style={styles.metricValue}>{scoreData.fuelEfficiency}%</Text>
            </View>
            <ProgressBar 
              progress={scoreData.fuelEfficiency / 100}
              color={getScoreColor(scoreData.fuelEfficiency)}
              style={styles.progressBar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Incidents */}
      <Card style={styles.incidentsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Recent Incidents (This Week)</Text>
          
          <View style={styles.incidentRow}>
            <View style={styles.incidentItem}>
              <Ionicons name="warning-outline" size={24} color="#dc2626" />
              <Text style={styles.incidentNumber}>{scoreData.speedingEvents}</Text>
              <Text style={styles.incidentLabel}>Speeding</Text>
            </View>
            
            <View style={styles.incidentItem}>
              <Ionicons name="hand-left-outline" size={24} color="#ea580c" />
              <Text style={styles.incidentNumber}>{scoreData.harshBraking}</Text>
              <Text style={styles.incidentLabel}>Harsh Braking</Text>
            </View>
            
            <View style={styles.incidentItem}>
              <Ionicons name="flash-outline" size={24} color="#f59e0b" />
              <Text style={styles.incidentNumber}>{scoreData.rapidAcceleration}</Text>
              <Text style={styles.incidentLabel}>Rapid Acceleration</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Tips */}
      <Card style={styles.tipsCard}>
        <Card.Content>
          <Text style={styles.cardTitle}>Driving Tips</Text>
          
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.tipText}>Maintain steady speeds to improve fuel efficiency</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.tipText}>Allow extra following distance for smoother braking</Text>
          </View>
          
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.tipText}>Anticipate traffic to reduce sudden acceleration</Text>
          </View>
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
  mainScoreCard: {
    margin: 16,
    elevation: 4,
  },
  mainScoreContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  mainScoreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
  },
  scoreCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: '#f3f4f6',
    borderWidth: 8,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  scoreCircleInner: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  scoreLabel: {
    color: '#6b7280',
    fontWeight: '600',
  },
  scoreSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  trendsCard: {
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
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trendItem: {
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  trendLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  metricsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  metricItem: {
    marginBottom: 20,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  incidentsCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  incidentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  incidentItem: {
    alignItems: 'center',
    flex: 1,
  },
  incidentNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  incidentLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  tipsCard: {
    margin: 16,
    marginTop: 0,
    marginBottom: 32,
    elevation: 2,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
});