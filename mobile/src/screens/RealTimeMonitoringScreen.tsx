import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Platform,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import realTimeMonitoringService, {
  MonitoringSession,
  RealTimeAlert,
  RealTimeMetric,
  MonitoringDashboard,
  AlertType,
  AlertCategory
} from '../services/realTimeMonitoringService';
import axios from 'axios';
import i18n from '../i18n';

type MetricCardProps = {
  metric: RealTimeMetric;
  onPress: () => void;
};

const MetricCard: React.FC<MetricCardProps> = React.memo(({ metric, onPress }) => {
  const { colors } = useTheme();

  const getMetricIcon = () => {
    switch (metric.metricType) {
      case 'heart_rate':
        return <Ionicons name="heart" size={24} color="#EF4444" />;
      case 'steps':
        return <Ionicons name="walk" size={24} color="#10B981" />;
      case 'calories_burned':
        return <Ionicons name="flame" size={24} color="#F59E0B" />;
      case 'sleep_duration':
        return <Ionicons name="moon" size={24} color="#3B82F6" />;
      case 'blood_pressure':
        return <Ionicons name="pulse" size={24} color="#8B5CF6" />;
      case 'weight':
        return <Ionicons name="fitness" size={24} color="#6366F1" />;
      case 'blood_oxygen':
        return <Ionicons name="fitness" size={24} color="#06B6D4" />;
      case 'activity_minutes':
        return <Ionicons name="timer" size={24} color="#F97316" />;
      default:
        return <Ionicons name="analytics" size={24} color={colors.primary} />;
    }
  };

  const getQualityColor = () => {
    switch (metric.quality) {
      case 'excellent':
        return '#10B981';
      case 'good':
        return '#3B82F6';
      case 'fair':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  const getQualityText = () => {
    switch (metric.quality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'fair':
        return 'Fair';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.metricCard,
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border,
          borderWidth: 1
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.metricHeader}>
        {getMetricIcon()}
        <View style={styles.metricInfo}>
          <Text style={[styles.metricName, { color: colors.text }]}>
            {metric.metricType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {metric.value} {metric.unit}
          </Text>
        </View>
        <View style={[styles.qualityBadge, { backgroundColor: getQualityColor() + '20' }]}>
          <Text style={[styles.qualityText, { color: getQualityColor() }]}>
            {getQualityText()}
          </Text>
        </View>
      </View>
      
      <View style={styles.metricFooter}>
        <Text style={[styles.metricTime, { color: colors.gray }]}>
          {new Date(metric.timestamp).toLocaleTimeString()}
        </Text>
        <Text style={[styles.metricConfidence, { color: colors.gray }]}>
          {Math.round(metric.confidence * 100)}% confidence
        </Text>
      </View>
    </TouchableOpacity>
  );
});

MetricCard.displayName = 'MetricCard';

type AlertCardProps = {
  alert: RealTimeAlert;
  onAcknowledge: () => void;
};

const AlertCard: React.FC<AlertCardProps> = React.memo(({ alert, onAcknowledge }) => {
  const { colors } = useTheme();

  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical':
        return <Ionicons name="warning" size={20} color="#DC2626" />;
      case 'warning':
        return <Ionicons name="alert-circle" size={20} color="#F59E0B" />;
      case 'info':
        return <Ionicons name="information-circle" size={20} color="#3B82F6" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      default:
        return <Ionicons name="alert" size={20} color={colors.primary} />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  return (
    <View style={[
      styles.alertCard,
      { 
        backgroundColor: colors.card, 
        borderColor: colors.border,
        borderWidth: 1,
        opacity: alert.acknowledged ? 0.6 : 1
      }
    ]}>
      <View style={styles.alertHeader}>
        {getAlertIcon()}
        <View style={styles.alertInfo}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>
            {alert.title}
          </Text>
          <View style={styles.alertMeta}>
            <Text style={[styles.alertCategory, { color: colors.gray }]}>
              {alert.category}
            </Text>
            <Text style={[styles.alertSeverity, { color: getSeverityColor() }]}>
              {alert.severity.toUpperCase()}
            </Text>
          </View>
        </View>
        {alert.acknowledged && (
          <View style={styles.acknowledgedBadge}>
            <Text style={styles.acknowledgedText}>Acknowledged</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.alertMessage, { color: colors.text }]}>
        {alert.message}
      </Text>
      
      <Text style={[styles.alertTime, { color: colors.gray }]}>
        {new Date(alert.timestamp).toLocaleString()}
      </Text>
      
      {!alert.acknowledged && (
        <TouchableOpacity
          style={[styles.acknowledgeButton, { backgroundColor: colors.primary }]}
          onPress={onAcknowledge}
        >
          <Text style={styles.acknowledgeButtonText}>
            Acknowledge
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

AlertCard.displayName = 'AlertCard';

export const RealTimeMonitoringScreen = React.memo(() => {
  RealTimeMonitoringScreen.displayName = 'RealTimeMonitoringScreen';
  const { colors } = useTheme();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [sessions, setSessions] = useState<MonitoringSession[]>([]);
  const [alerts, setAlerts] = useState<RealTimeAlert[]>([]);
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<MonitoringSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionSettings, setSessionSettings] = useState({
    samplingRate: 10000,
    enabledMetrics: ['heart_rate', 'steps', 'calories_burned'] as string[],
    dataRetention: 24
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (dashboard) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [dashboard]);

  const loadDashboard = async (retryCount = 0) => {
    try {
      if (!user?.id) return;
      
      setIsLoading(true);
      
      // Fetch real dashboard data from API
      const [dashboardResponse, sessionsResponse, alertsResponse, metricsResponse] = await Promise.all([
        axios.get(`/api/monitoring/dashboard/${user.id}`),
        axios.get(`/api/monitoring/sessions/${user.id}`),
        axios.get(`/api/monitoring/alerts/${user.id}`),
        axios.get(`/api/monitoring/metrics/${user.id}`)
      ]);
      
      const dashboardData = dashboardResponse.data;
      const sessionsData = sessionsResponse.data;
      const alertsData = alertsResponse.data;
      const metricsData = metricsResponse.data;
      
      // Validate API response data
      if (!dashboardData || typeof dashboardData !== 'object') {
        throw new Error('Invalid dashboard data received');
      }
      
      if (!Array.isArray(sessionsData)) {
        throw new Error('Invalid sessions data received');
      }
      
      if (!Array.isArray(alertsData)) {
        throw new Error('Invalid alerts data received');
      }
      
      if (!Array.isArray(metricsData)) {
        throw new Error('Invalid metrics data received');
      }
      
      setDashboard(dashboardData);
      setSessions(sessionsData);
      setAlerts(alertsData);
      setMetrics(metricsData);
      
    } catch (error: any) {
      console.error('Error loading dashboard:', error);
      
      // Enhanced error handling with specific error messages
      let errorMessage = 'Failed to load monitoring data. Please check your connection and try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      // Show error message only after 2 failed attempts
      if (retryCount >= 2) {
        Alert.alert(
          'Connection Error',
          errorMessage,
          [
            { text: 'Retry', onPress: () => loadDashboard(retryCount + 1) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
      
      // Fallback to service data if API fails
      try {
        if (user?.id) {
          const dashboardData = realTimeMonitoringService.getMonitoringDashboard(user.id);
          setDashboard(dashboardData);
          setSessions(dashboardData.activeSessions);
          setAlerts(dashboardData.activeAlerts);
          setMetrics(dashboardData.recentMetrics);
          
          // Show offline notification after fallback
          if (retryCount === 0) {
            Alert.alert(
              'Using Offline Data',
              'Using cached monitoring data while offline. Some features may be limited.',
              [{ text: 'OK', style: 'cancel' }]
            );
          }
        }
      } catch (fallbackError: any) {
        console.error('Fallback also failed:', fallbackError);
        if (retryCount >= 2) {
          Alert.alert(
            'Error',
            'Failed to load monitoring data. Please try again later.',
            [{ text: 'OK', style: 'cancel' }]
          );
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboard();
    setIsRefreshing(false);
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      // Try real API first
      await axios.post(`/api/monitoring/alerts/${alertId}/acknowledge`);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Error acknowledging alert via API:', error);
      // Fallback to service
      try {
        await realTimeMonitoringService.acknowledgeAlert(alertId);
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      } catch (fallbackError) {
        console.error('Fallback alert acknowledgment failed:', fallbackError);
        Alert.alert('Error', 'Failed to acknowledge alert. Please try again.');
      }
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!user?.id) return;
      
      // Try real API first
      const sessionResponse = await axios.post('/api/monitoring/sessions', {
        userId: user.id!,
        deviceId: 'user_device_' + Date.now(), // Generate device ID
        settings: {
          samplingRate: sessionSettings.samplingRate,
          enabledMetrics: sessionSettings.enabledMetrics,
          dataRetention: sessionSettings.dataRetention
        }
      });
      
      const session = sessionResponse.data;
      setSessions(prev => [...prev, session]);
      setShowCreateSession(false);
      setShowSessionModal(false);
      
    } catch (error) {
      console.error('Error creating session:', error);
      // Fallback to service
      try {
        if (user?.id) {
          const session = await realTimeMonitoringService.createMonitoringSession(
            user.id,
            'mock_device_id',
            {
              samplingRate: sessionSettings.samplingRate,
              enabledMetrics: sessionSettings.enabledMetrics as any,
              dataRetention: sessionSettings.dataRetention
            }
          );
        
          setSessions(prev => [...prev, session]);
          setShowCreateSession(false);
          setShowSessionModal(false);
        }
      } catch (fallbackError) {
        console.error('Fallback session creation failed:', fallbackError);
        Alert.alert('Error', 'Failed to create monitoring session. Please try again.');
      }
    }
  };

  const handleStopSession = async (sessionId: string) => {
    try {
      await realTimeMonitoringService.stopMonitoringSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const renderMetricCard = ({ item }: { item: RealTimeMetric }) => (
    <MetricCard
      metric={item}
      onPress={() => console.log('Pressed metric:', item)}
    />
  );

  const renderAlertCard = ({ item }: { item: RealTimeAlert }) => (
    <AlertCard
      alert={item}
      onAcknowledge={() => handleAcknowledgeAlert(item.id)}
    />
  );

  if (isLoading && !dashboard) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Real-Time Monitoring
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateSession(true)}
            >
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: colors.card }]}
              onPress={handleRefresh}
            >
              <Ionicons name="refresh" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      {dashboard && (
        <ScrollView
          style={styles.summaryContainer}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryContent}
        >
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="hardware-chip" size={24} color="#10B981" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {dashboard.summary.totalDevices}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>
              Total Devices
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="pulse" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {dashboard.summary.activeDevices}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>
              Active Devices
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#F59E0B20' }]}>
              <Ionicons name="analytics" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {dashboard.summary.totalMetrics}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>
              Total Metrics
            </Text>
          </View>
          
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="warning" size={24} color="#EF4444" />
            </View>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {dashboard.summary.criticalAlerts}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.gray }]}>
              Critical Alerts
            </Text>
          </View>
        </ScrollView>
      )}

      {/* Active Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Sessions
          </Text>
          <TouchableOpacity onPress={() => setShowSessionModal(true)}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        
        {sessions.length > 0 ? (
          <FlatList
            data={sessions.slice(0, 3)}
            renderItem={({ item }) => (
              <View style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sessionHeader}>
                  <View style={[styles.sessionIcon, { backgroundColor: '#6366F120' }]}>
                    <Ionicons name="pulse" size={20} color="#6366F1" />
                  </View>
                  <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionName, { color: colors.text }]}>
                      Session {item.id.slice(-6)}
                    </Text>
                    <Text style={[styles.sessionDevice, { color: colors.gray }]}>
                      Device: {item.deviceId}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stopButton, { backgroundColor: '#EF444420' }]}
                    onPress={() => handleStopSession(item.id)}
                  >
                    <Ionicons name="stop" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.sessionStats}>
                  <Text style={[styles.sessionMetrics, { color: colors.text }]}>
                    {item.settings.enabledMetrics.length} metrics
                  </Text>
                  <Text style={[styles.sessionTime, { color: colors.gray }]}>
                    Started {new Date(item.startTime).toLocaleTimeString()}
                  </Text>
                </View>
                
                <Text style={[styles.sessionStatus, { color: '#10B981' }]}>
                  Active
                </Text>
              </View>
            )}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pulse-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No Active Sessions
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.gray }]}>
              Start monitoring your health metrics in real-time
            </Text>
          </View>
        )}
      </View>

      {/* Recent Metrics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Metrics
          </Text>
          <TouchableOpacity onPress={() => console.log('View all metrics')}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        
        {metrics.length > 0 ? (
          <FlatList
            data={metrics.slice(0, 5)}
            renderItem={renderMetricCard}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No Recent Metrics
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.gray }]}>
              Start a monitoring session to see real-time data
            </Text>
          </View>
        )}
      </View>

      {/* Active Alerts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Alerts
          </Text>
          <TouchableOpacity onPress={() => console.log('View all alerts')}>
            <Text style={[styles.sectionLink, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        
        {alerts.length > 0 ? (
          <FlatList
            data={alerts}
            renderItem={renderAlertCard}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No Active Alerts
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.gray }]}>
              All health metrics are within normal ranges
            </Text>
          </View>
        )}
      </View>

      {/* Create Session Modal */}
      <Modal
        visible={showCreateSession}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Create Monitoring Session
            </Text>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setShowCreateSession(false)}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <Text style={[styles.modalDescription, { color: colors.text }]}>
              Configure your real-time monitoring session to track specific health metrics.
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Sampling Rate (ms)
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={sessionSettings.samplingRate.toString()}
                onChangeText={(text) => setSessionSettings(prev => ({ ...prev, samplingRate: parseInt(text) || 10000 }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Data Retention (hours)
              </Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                value={sessionSettings.dataRetention.toString()}
                onChangeText={(text) => setSessionSettings(prev => ({ ...prev, dataRetention: parseInt(text) || 24 }))}
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.text }]}>
                Enabled Metrics
              </Text>
              <ScrollView style={styles.metricsList}>
                {['heart_rate', 'steps', 'calories_burned', 'sleep_duration', 'blood_pressure', 'weight', 'blood_oxygen', 'activity_minutes'].map(metric => (
                  <TouchableOpacity
                    key={metric}
                    style={[styles.metricItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => {
                      const enabled = [...sessionSettings.enabledMetrics];
                      const index = enabled.indexOf(metric);
                      if (index > -1) {
                        enabled.splice(index, 1);
                      } else {
                        enabled.push(metric);
                      }
                      setSessionSettings(prev => ({ ...prev, enabledMetrics: enabled }));
                    }}
                  >
                    <View style={styles.metricItemContent}>
                      <Text style={[styles.metricItemText, { color: colors.text }]}>
                        {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Text>
                      <Switch
                        value={sessionSettings.enabledMetrics.includes(metric)}
                        trackColor={{ false: '#767577', true: colors.primary }}
                        thumbColor="white"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateSession}
            >
              <Text style={styles.createButtonText}>
                Create Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContainer: {
    maxHeight: 120,
    borderBottomWidth: 1,
  },
  summaryContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  sectionLink: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  sessionDevice: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionMetrics: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  sessionTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sessionStatus: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    alignSelf: 'flex-end',
  },
  metricCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricInfo: {
    flex: 1,
    marginLeft: 12,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  metricFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  metricConfidence: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  acknowledgedBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acknowledgedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: 'Inter-Regular',
  },
  alertTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  acknowledgeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  metricsList: {
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#E5E7EB',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  metricItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItemText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
});