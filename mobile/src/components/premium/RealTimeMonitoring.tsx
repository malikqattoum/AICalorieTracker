import React, { useState, useEffect, useRef, useCallback } from 'react';
import analyticsService from '../../services/analyticsService';
import api from '../../services/api';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
  Easing,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useCache } from '../../contexts/CacheContext';
import i18n from '../../i18n';


interface AlertConfig {
  id: number;
  userId: number;
  metricType: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  operator: 'and' | 'or';
  action: 'notification' | 'email' | 'sms' | 'emergency';
  isActive: boolean;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface HealthScore {
  id: number;
  userId: number;
  scoreType: 'nutrition' | 'fitness' | 'recovery' | 'consistency' | 'overall';
  scoreValue: number;
  calculationDate: string;
  scoreDetails: any;
  trendDirection: 'improving' | 'stable' | 'declining';
  confidenceLevel: number;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

interface HealthPrediction {
  id: number;
  userId: number;
  predictionType: 'weight_projection' | 'goal_achievement' | 'health_risk' | 'performance_optimization';
  targetDate: string;
  predictionValue: number;
  confidenceScore: number;
  modelVersion: string;
  predictionDetails: any;
  recommendations: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RealTimeMetric {
  id: number;
  userId: number;
  metricType: string;
  metricValue: number;
  unit: string;
  timestamp: string;
  metadata?: any;
  status: 'normal' | 'warning' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export const RealTimeMonitoring = React.memo(() => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    isConnected,
    connectionStatus,
    healthMetrics,
    realTimeAlerts,
    connect,
    disconnect,
    sendUserAction
  } = useWebSocket();
  const { cache, isCacheLoaded } = useCache();
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [predictions, setPredictions] = useState<HealthPrediction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('all');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analyticsService.initialize();
        // Track page view
        await analyticsService.trackEvent({
          id: `real_time_monitoring_view_${Date.now()}`,
          userId: user?.id?.toString() || 'anonymous',
          type: 'page_view',
          data: { page: 'real_time_monitoring' },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error initializing analytics:', error);
      }
    };
    
    initializeAnalytics();
  }, [user]);

  const metricTypes = [
    { id: 'all', name: 'All Metrics', icon: 'analytics-outline', color: '#6366F1' },
    { id: 'heart_rate', name: 'Heart Rate', icon: 'heart-outline', color: '#EF4444' },
    { id: 'blood_pressure', name: 'Blood Pressure', icon: 'pulse-outline', color: '#F59E0B' },
    { id: 'blood_oxygen', name: 'Blood Oxygen', icon: 'water-outline', color: '#3B82F6' },
    { id: 'sleep_quality', name: 'Sleep Quality', icon: 'moon-outline', color: '#8B5CF6' },
    { id: 'stress_level', name: 'Stress Level', icon: 'sentiment-outline', color: '#EC4899' },
    { id: 'activity_level', name: 'Activity Level', icon: 'fitness-outline', color: '#10B981' },
  ];

  const getMetricIcon = (metricType: string) => {
    const metric = metricTypes.find(m => m.id === metricType);
    return metric ? metric.icon : 'analytics-outline';
  };

  const getMetricColor = (metricType: string) => {
    const metric = metricTypes.find(m => m.id === metricType);
    return metric ? metric.color : '#6366F1';
  };

  const getMetricName = (metricType: string) => {
    const metric = metricTypes.find(m => m.id === metricType);
    return metric ? metric.name : metricType;
  };

  const getMetricUnit = (metricType: string) => {
    switch (metricType) {
      case 'heart_rate':
        return 'bpm';
      case 'blood_pressure':
        return 'mmHg';
      case 'blood_oxygen':
        return '%';
      case 'sleep_quality':
        return '/100';
      case 'stress_level':
        return '/100';
      case 'activity_level':
        return 'steps';
      default:
        return '';
    }
  };

  const getMetricStatus = (metricType: string, value: number) => {
    switch (metricType) {
      case 'heart_rate':
        if (value < 60) return { status: 'low', color: '#3B82F6' };
        if (value > 100) return { status: 'high', color: '#EF4444' };
        return { status: 'normal', color: '#10B981' };
      case 'blood_pressure':
        if (value > 140) return { status: 'high', color: '#EF4444' };
        if (value < 90) return { status: 'low', color: '#3B82F6' };
        return { status: 'normal', color: '#10B981' };
      case 'blood_oxygen':
        if (value < 95) return { status: 'low', color: '#EF4444' };
        return { status: 'normal', color: '#10B981' };
      case 'sleep_quality':
        if (value < 70) return { status: 'poor', color: '#EF4444' };
        if (value < 85) return { status: 'fair', color: '#F59E0B' };
        return { status: 'good', color: '#10B981' };
      case 'stress_level':
        if (value > 70) return { status: 'high', color: '#EF4444' };
        if (value > 40) return { status: 'moderate', color: '#F59E0B' };
        return { status: 'low', color: '#10B981' };
      case 'activity_level':
        if (value < 5000) return { status: 'low', color: '#EF4444' };
        if (value < 10000) return { status: 'moderate', color: '#F59E0B' };
        return { status: 'high', color: '#10B981' };
      default:
        return { status: 'normal', color: '#10B981' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'trending-up-outline';
      case 'declining':
        return 'trending-down-outline';
      default:
        return 'minus-outline';
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await api.premium.getRealTimeMetrics();
      setMetrics(response.data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchLatestMetrics = async () => {
    try {
      const response = await api.premium.getRealTimeMetrics();
      setMetrics(response.data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching latest metrics:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await api.premium.getAlerts();
      setAlerts(response.data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const fetchHealthScores = async () => {
    try {
      const response = await api.premium.getHealthScores();
      setHealthScores(response.data || []);
    } catch (error) {
      console.error('Error fetching health scores:', error);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await api.premium.getHealthPredictions();
      setPredictions(response.data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const simulateMetric = async (metricType: string) => {
    try {
      await api.wearable.saveHealthData([{
        metricType,
        metricValue: Math.floor(Math.random() * 100) + 50,
        unit: getMetricUnit(metricType),
        timestamp: new Date().toISOString()
      }]);
      fetchLatestMetrics();
    } catch (error) {
      console.error('Error simulating metric:', error);
    }
  };

  const startSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    const interval = setInterval(() => {
      const randomMetric = metricTypes[Math.floor(Math.random() * (metricTypes.length - 1)) + 1];
      simulateMetric(randomMetric.id);
      
      // Pulse animation for heart rate
      if (randomMetric.id === 'heart_rate') {
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, 3000);

    setSimulationInterval(interval);
    setIsMonitoring(true);
  };

  const stopSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setIsMonitoring(false);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Check cache first if available
      if (isCacheLoaded) {
        const cachedData = await cache.getCachedPremiumData();
        if (cachedData) {
          console.log('Loading real-time monitoring data from cache');
          setMetrics(cachedData.metrics || []);
          setAlerts(cachedData.alerts || []);
          setHealthScores(cachedData.healthScores || []);
          setPredictions(cachedData.predictions || []);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }
      
      await Promise.all([
        fetchMetrics(),
        fetchAlerts(),
        fetchHealthScores(),
        fetchPredictions()
      ]);
      
      // Cache the fetched data
      const monitoringData = {
        metrics,
        alerts,
        healthScores,
        predictions,
        timestamp: Date.now()
      };
      await cache.cachePremiumData(monitoringData, 5 * 60 * 1000); // 5 minutes TTL
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Try to load from cache as fallback
      if (isCacheLoaded) {
        try {
          const cachedData = await cache.getCachedPremiumData();
          if (cachedData) {
            console.log('Loading real-time monitoring data from cache after API error');
            setMetrics(cachedData.metrics || []);
            setAlerts(cachedData.alerts || []);
            setHealthScores(cachedData.healthScores || []);
            setPredictions(cachedData.predictions || []);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError);
        }
      }
      
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Connect to WebSocket when component mounts
    if (isConnected === false) {
      connect();
    }

    // Send user action when component mounts
    sendUserAction('view_real_time_monitoring');

    return () => {
      // Cleanup - disconnect when component unmounts
      disconnect();
    };
  }, [connect, disconnect, isConnected, sendUserAction]);

  useEffect(() => {
    // Update metrics when WebSocket receives new data
    if (healthMetrics.length > 0) {
      const latestMetrics = healthMetrics[healthMetrics.length - 1];
      setMetrics(prev => {
        const updated = [...prev];
        const existingIndex = updated.findIndex(m => m.metricType === latestMetrics.metricType);
        
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            metricValue: latestMetrics.metricValue,
            timestamp: latestMetrics.timestamp,
            status: 'normal'
          };
        } else {
          updated.push({
            id: Date.now(),
            userId: Number(user?.id) || 0,
            metricType: latestMetrics.metricType,
            metricValue: latestMetrics.metricValue,
            unit: latestMetrics.unit,
            timestamp: latestMetrics.timestamp,
            metadata: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'normal'
          });
        }
        
        return updated.slice(-10); // Keep only last 10 metrics
      });
    }
  }, [healthMetrics]);

  useEffect(() => {
    // Update alerts when WebSocket receives new alerts
    if (realTimeAlerts.length > 0) {
      const latestAlert = realTimeAlerts[realTimeAlerts.length - 1];
      setAlerts(prev => {
        const updated = [latestAlert, ...prev];
        return updated.slice(-5); // Keep only last 5 alerts
      });
    }
  }, [realTimeAlerts]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Clear cache before refreshing to get fresh data
    await cache.removeCachedData('premium_data');
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (simulationInterval) {
        clearInterval(simulationInterval);
      }
    };
  }, [simulationInterval]);

  const filteredMetrics = selectedMetric === 'all' 
    ? metrics 
    : metrics.filter(m => m.metricType === selectedMetric);

  const renderMetricCard = (metric: RealTimeMetric) => {
    const status = getMetricStatus(metric.metricType, metric.metricValue);
    const metricName = getMetricName(metric.metricType);
    const metricUnit = getMetricUnit(metric.metricType);
    const timestamp = new Date(metric.timestamp).toLocaleTimeString();

    return (
      <View 
        key={metric.id} 
        style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.metricHeader}>
          <View style={[styles.metricIcon, { backgroundColor: `${getMetricColor(metric.metricType)}20` }]}>
            <Ionicons 
              name={getMetricIcon(metric.metricType) as any} 
              size={20} 
              color={getMetricColor(metric.metricType)} 
            />
          </View>
          <View style={styles.metricInfo}>
            <Text style={[styles.metricName, { color: colors.text }]}>
              {metricName}
            </Text>
            <Text style={[styles.metricTime, { color: colors.gray }]}>
              {timestamp}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.metricValue}>
          <Text style={[styles.metricValueText, { color: colors.text }]}>
            {metric.metricValue}
            <Text style={[styles.metricUnit, { color: colors.gray }]}>
              {metricUnit}
            </Text>
          </Text>
        </View>
        
        <View style={styles.metricActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              // View metric details
            }}
          >
            <Text style={styles.actionButtonText}>Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#6366F120' }]}
            onPress={() => {
              // Share metric
            }}
          >
            <Text style={[styles.actionButtonText, { color: '#6366F1' }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHealthScore = (score: HealthScore) => {
    const scoreColor = getScoreColor(score.scoreValue);
    const trendIcon = getTrendIcon(score.trendDirection);

    return (
      <View 
        key={score.id} 
        style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.scoreHeader}>
          <View style={[styles.scoreIcon, { backgroundColor: `${scoreColor}20` }]}>
            <Ionicons 
              name={score.scoreType === 'overall' ? 'fitness-outline' :
                     score.scoreType === 'nutrition' ? 'restaurant-outline' :
                     score.scoreType === 'fitness' ? 'fitness-outline' :
                     score.scoreType === 'recovery' ? 'moon-outline' :
                     'calendar-outline'}
              size={20} 
              color={scoreColor} 
            />
          </View>
          <View style={styles.scoreInfo}>
            <Text style={[styles.scoreType, { color: colors.text }]}>
              {score.scoreType.charAt(0).toUpperCase() + score.scoreType.slice(1)}
            </Text>
            <Text style={[styles.scoreDate, { color: colors.gray }]}>
              {new Date(score.calculationDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.scoreValue}>
            <Text style={[styles.scoreValueText, { color: scoreColor }]}>
              {score.scoreValue}
            </Text>
          </View>
        </View>
        
        <View style={styles.scoreDetails}>
          <View style={styles.scoreTrend}>
            <Ionicons name={trendIcon as any} size={16} color={scoreColor} />
            <Text style={[styles.scoreTrendText, { color: colors.gray }]}>
              {score.trendDirection}
            </Text>
          </View>
          <View style={styles.scoreConfidence}>
            <Text style={[styles.scoreConfidenceText, { color: colors.gray }]}>
              Confidence: {Math.round(score.confidenceLevel * 100)}%
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPrediction = (prediction: HealthPrediction) => {
    const confidenceColor = prediction.confidenceScore >= 80 ? '#10B981' : 
                           prediction.confidenceScore >= 60 ? '#F59E0B' : '#EF4444';
    const targetDate = new Date(prediction.targetDate);
    const daysUntil = Math.ceil((targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <View 
        key={prediction.id} 
        style={[styles.predictionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.predictionHeader}>
          <View style={[styles.predictionIcon, { backgroundColor: `${getMetricColor(prediction.predictionType)}20` }]}>
            <Ionicons 
              name={getMetricIcon(prediction.predictionType) as any} 
              size={20} 
              color={getMetricColor(prediction.predictionType)} 
            />
          </View>
          <View style={styles.predictionInfo}>
            <Text style={[styles.predictionTitle, { color: colors.text }]}>
              {getMetricName(prediction.predictionType)}
            </Text>
            <Text style={[styles.predictionDate, { color: colors.gray }]}>
              {targetDate.toLocaleDateString()} ({daysUntil} days)
            </Text>
          </View>
          <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '20' }]}>
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {prediction.confidenceScore}%
            </Text>
          </View>
        </View>
        
        <View style={styles.predictionContent}>
          <Text style={[styles.predictionValue, { color: colors.text }]}>
            {prediction.predictionValue}
            {prediction.predictionType === 'weight_projection' && ' kg'}
            {prediction.predictionType === 'goal_achievement' && '%'}
            {prediction.predictionType === 'health_risk' && '/100'}
            {prediction.predictionType === 'performance_optimization' && '%'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('premium.realTimeMonitoring')}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.primary }]}
            onPress={() => fetchData()}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh-outline" size={20} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.monitoringButton, { backgroundColor: isMonitoring ? '#10B981' : colors.primary }]}
            onPress={isMonitoring ? stopSimulation : startSimulation}
          >
            <Ionicons 
              name={isMonitoring ? 'pause-outline' : 'play-outline'} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Last Updated */}
      <View style={[styles.lastUpdated, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.lastUpdatedText, { color: colors.gray }]}>
          Last updated: {lastUpdated || 'Never'}
        </Text>
      </View>

      {/* Metric Filters */}
      <View style={styles.metricFilters}>
        <FlatList
          data={metricTypes}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.filterButton,
                selectedMetric === item.id && [styles.filterButtonActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setSelectedMetric(item.id)}
            >
              <Ionicons name={item.icon as any} size={16} color={selectedMetric === item.id ? 'white' : colors.text} />
              <Text style={[
                styles.filterButtonText,
                selectedMetric === item.id && { color: 'white' }
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
        }
      >
        {/* Real-time Metrics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Real-time Metrics
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredMetrics.length > 0 ? (
            <FlatList
              data={filteredMetrics}
              renderItem={({ item }) => renderMetricCard(item)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                No metrics available. Start monitoring to see real-time data.
              </Text>
            </View>
          )}
        </View>

        {/* Health Scores */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Health Scores
          </Text>
          
          {healthScores.length > 0 ? (
            <FlatList
              data={healthScores}
              renderItem={({ item }) => renderHealthScore(item)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                No health scores available yet.
              </Text>
            </View>
          )}
        </View>

        {/* Predictions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Health Predictions
          </Text>
          
          {predictions.length > 0 ? (
            <FlatList
              data={predictions}
              renderItem={({ item }) => renderPrediction(item)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                No predictions available yet.
              </Text>
            </View>
          )}
        </View>

        {/* Active Alerts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Active Alerts
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.gray }]}>
                Loading alerts...
              </Text>
            </View>
          ) : alerts.length > 0 ? (
            <FlatList
              data={alerts}
              renderItem={({ item }) => (
                <View
                  key={item.id}
                  style={[styles.alertCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.alertHeader}>
                    <View style={[styles.alertIcon, { backgroundColor: '#EF444420' }]}>
                      <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.alertInfo}>
                      <Text style={[styles.alertName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.alertDescription, { color: colors.gray }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.alertDetails}>
                    <Text style={[styles.alertCondition, { color: colors.text }]}>
                      {item.condition} {item.threshold}
                    </Text>
                    <Text style={[styles.alertAction, { color: colors.gray }]}>
                      Action: {item.action}
                    </Text>
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.gray} />
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                No active alerts configured.
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={retryFetch}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

RealTimeMonitoring.displayName = 'RealTimeMonitoring';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monitoringButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastUpdated: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  lastUpdatedText: {
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  metricFilters: {
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  metricCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  metricTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  metricValue: {
    marginBottom: 12,
  },
  metricValueText: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  metricUnit: {
    fontSize: 16,
    fontWeight: '400',
    marginLeft: 4,
  },
  metricActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  scoreDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  scoreValue: {
    alignItems: 'flex-end',
  },
  scoreValueText: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  scoreDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTrendText: {
    fontSize: 14,
    marginLeft: 4,
    fontFamily: 'Inter-Regular',
  },
  scoreConfidence: {
    alignItems: 'flex-end',
  },
  scoreConfidenceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  predictionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  predictionInfo: {
    flex: 1,
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  predictionDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  predictionContent: {
    marginBottom: 12,
  },
  predictionValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  alertDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  alertDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertCondition: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  alertAction: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
});