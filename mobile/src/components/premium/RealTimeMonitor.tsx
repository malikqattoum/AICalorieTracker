import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface MonitoringData {
  id: number;
  metricType: string;
  metricValue: number;
  unit: string;
  timestamp: string;
  metadata?: any;
  isAlert?: boolean;
}

interface RealTimeMonitorProps {
  data: MonitoringData[];
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ data }) => {
  const { colors } = useTheme();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [latestData, setLatestData] = useState<MonitoringData[]>([]);

  useEffect(() => {
    // Filter latest data for each metric type
    const latestByType = new Map<string, MonitoringData>();
    
    data.forEach(item => {
      const existing = latestByType.get(item.metricType);
      if (!existing || new Date(item.timestamp) > new Date(existing.timestamp)) {
        latestByType.set(item.metricType, item);
      }
    });

    setLatestData(Array.from(latestByType.values()));
  }, [data]);

  const getMetricIcon = (metricType: string) => {
    switch (metricType) {
      case 'heart_rate':
        return 'heart-outline';
      case 'blood_pressure':
        return 'pulse-outline';
      case 'blood_oxygen':
        return 'water-outline';
      case 'sleep_quality':
        return 'moon-outline';
      case 'stress_level':
        return 'fitness-outline';
      case 'activity_level':
        return 'walk-outline';
      default:
        return 'analytics-outline';
    }
  };

  const getMetricColor = (metricType: string, value?: number) => {
    if (value !== undefined) {
      // Check if this is an alert
      if (metricType === 'heart_rate' && (value < 50 || value > 100)) {
        return '#EF4444';
      }
      if (metricType === 'blood_pressure' && value > 140) {
        return '#EF4444';
      }
      if (metricType === 'blood_oxygen' && value < 95) {
        return '#EF4444';
      }
      if (metricType === 'sleep_quality' && value < 60) {
        return '#F59E0B';
      }
      if (metricType === 'stress_level' && value > 70) {
        return '#EF4444';
      }
    }

    switch (metricType) {
      case 'heart_rate':
        return '#EF4444';
      case 'blood_pressure':
        return '#F59E0B';
      case 'blood_oxygen':
        return '#3B82F6';
      case 'sleep_quality':
        return '#8B5CF6';
      case 'stress_level':
        return '#EF4444';
      case 'activity_level':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getMetricLabel = (metricType: string) => {
    switch (metricType) {
      case 'heart_rate':
        return 'Heart Rate';
      case 'blood_pressure':
        return 'Blood Pressure';
      case 'blood_oxygen':
        return 'Blood Oxygen';
      case 'sleep_quality':
        return 'Sleep Quality';
      case 'stress_level':
        return 'Stress Level';
      case 'activity_level':
        return 'Activity Level';
      default:
        return metricType;
    }
  };

  const formatMetricValue = (metricType: string, value: number, unit: string) => {
    switch (metricType) {
      case 'heart_rate':
        return `${Math.round(value)} ${unit}`;
      case 'blood_pressure':
        return `${Math.round(value)} ${unit}`;
      case 'blood_oxygen':
        return `${Math.round(value)}%`;
      case 'sleep_quality':
        return `${Math.round(value)}%`;
      case 'stress_level':
        return `${Math.round(value)}%`;
      case 'activity_level':
        return `${Math.round(value)} ${unit}`;
      default:
        return `${value} ${unit}`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleMetricPress = (metric: MonitoringData) => {
    Alert.alert(
      getMetricLabel(metric.metricType),
      `Value: ${formatMetricValue(metric.metricType, metric.metricValue, metric.unit)}\n` +
      `Time: ${formatTimestamp(metric.timestamp)}\n` +
      `Status: ${metric.isAlert ? 'Alert' : 'Normal'}`,
      [
        { text: 'OK', style: 'default' },
        { text: 'View Details', style: 'default' }
      ]
    );
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    Alert.alert(
      isMonitoring ? 'Monitoring Paused' : 'Monitoring Started',
      isMonitoring ? 'Real-time monitoring has been paused.' : 'Real-time monitoring is now active.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Live Monitoring
          </Text>
          <View style={styles.monitoringStatus}>
            <View style={[
              statusIndicator,
              { backgroundColor: isMonitoring ? '#10B981' : '#EF4444' }
            ]} />
            <Text style={[styles.statusText, { color: isMonitoring ? '#10B981' : '#EF4444' }]}>
              {isMonitoring ? 'Active' : 'Paused'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.monitoringButton, { backgroundColor: colors.primary }]}
          onPress={toggleMonitoring}
        >
          <Ionicons 
            name={isMonitoring ? 'pause-outline' : 'play-outline'} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.metricsContainer}>
        {latestData.map((metric) => (
          <TouchableOpacity
            key={metric.id}
            style={[styles.metricCard, { 
              backgroundColor: colors.card, 
              borderColor: colors.border,
              borderLeftWidth: 4,
              borderLeftColor: getMetricColor(metric.metricType, metric.metricValue)
            }]}
            onPress={() => handleMetricPress(metric)}
          >
            <View style={styles.metricHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${getMetricColor(metric.metricType)}20` }]}>
                <Ionicons 
                  name={getMetricIcon(metric.metricType) as any} 
                  size={20} 
                  color={getMetricColor(metric.metricType, metric.metricValue)} 
                />
              </View>
              <View style={styles.metricInfo}>
                <Text style={[styles.metricLabel, { color: colors.text }]}>
                  {getMetricLabel(metric.metricType)}
                </Text>
                <Text style={[styles.metricTime, { color: colors.gray }]}>
                  {formatTimestamp(metric.timestamp)}
                </Text>
              </View>
              {metric.isAlert && (
                <View style={styles.alertBadge}>
                  <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                </View>
              )}
            </View>
            
            <Text style={[styles.metricValue, { color: getMetricColor(metric.metricType, metric.metricValue) }]}>
              {formatMetricValue(metric.metricType, metric.metricValue, metric.unit)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {latestData.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            No monitoring data available
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  monitoringStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  monitoringButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsContainer: {
    gap: 8,
  },
  metricCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  metricTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  alertBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});