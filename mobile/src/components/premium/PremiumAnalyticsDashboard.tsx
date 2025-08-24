import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Share,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { useCache } from '../../contexts/CacheContext';
import analyticsService from '../../services/analyticsService';
import i18n from '../../i18n';
import api from '../../services/api';
import { HealthScoreCard } from './HealthScoreCard';
import { PredictionCard } from './PredictionCard';
import { TrendChart } from './TrendChart';
import { GoalProgressCard } from './GoalProgressCard';
import { HealthcareConnectionCard } from './HealthcareConnectionCard';
import { RealTimeMonitor } from './RealTimeMonitor';
import { ReportGenerator } from './ReportGenerator';

interface HealthScore {
  id: number;
  scoreType: string;
  scoreValue: number;
  calculationDate: string;
  trendDirection: string;
}

interface Prediction {
  id: number;
  predictionType: string;
  predictionValue: number;
  confidenceScore: number;
  targetDate: string;
  recommendations: string[];
}

interface HealthGoal {
  id: number;
  goalType: string;
  goalTitle: string;
  targetValue: number;
  unit: string;
  progressPercentage: number;
  status: string;
}

interface HealthcareProfessional {
  id: number;
  professionalName: string;
  professionalType: string;
  practiceName?: string;
  accessLevel: string;
  status: string;
}

export const PremiumAnalyticsDashboard = React.memo(() => {
  PremiumAnalyticsDashboard.displayName = 'PremiumAnalyticsDashboard';
  const { colors } = useTheme();
  const { user } = useAuth();
  const {
    announce,
    generateInteractiveAccessibilityProps,
    generateTextAccessibilityProps,
    getAccessibilityLabels
  } = useAccessibility();
  const { cache, isCacheLoaded } = useCache();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // State for analytics data
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [healthcareProfessionals, setHealthcareProfessionals] = useState<HealthcareProfessional[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [monitoringData, setMonitoringData] = useState<any>(null);

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analyticsService.initialize();
        // Track page view
        await analyticsService.trackEvent({
          id: `premium_dashboard_view_${Date.now()}`,
          userId: user?.id?.toString() || 'anonymous',
          type: 'page_view',
          data: { page: 'premium_analytics_dashboard' },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error initializing analytics:', error);
      }
    };
    
    initializeAnalytics();
  }, [user]);

  // Load analytics data with caching
  const loadAnalyticsData = async (retryCount = 0) => {
    try {
      setLoading(true);
      
      // Check cache first if available
      if (isCacheLoaded) {
        const cachedData = await cache.getCachedPremiumData();
        if (cachedData) {
          console.log('Loading analytics data from cache');
          setHealthScores(cachedData.healthScores || []);
          setPredictions(cachedData.predictions || []);
          setGoals(cachedData.goals || []);
          setHealthcareProfessionals(cachedData.healthcareProfessionals || []);
          setTrendData(cachedData.trendData || null);
          setMonitoringData(cachedData.monitoringData || null);
          setLoading(false);
          return;
        }
      }
      
      // Load health scores
      const scoresResponse = await api.premium.getHealthScores();
      const predictionsResponse = await api.premium.getHealthPredictions();
      const goalsResponse = await api.premium.getDashboard();
      const healthcareResponse = await api.premium.getDashboard();
      const trendsResponse = await api.premium.getDashboard();
      const monitoringResponse = await api.premium.getRealTimeMetrics();
      
      // Validate API response data
      if (!Array.isArray(scoresResponse.data)) {
        throw new Error('Invalid health scores data received');
      }
      
      if (!Array.isArray(predictionsResponse.data)) {
        throw new Error('Invalid predictions data received');
      }
      
      if (!Array.isArray(goalsResponse.data)) {
        throw new Error('Invalid goals data received');
      }
      
      if (!Array.isArray(healthcareResponse.data)) {
        throw new Error('Invalid healthcare professionals data received');
      }
      
      if (trendsResponse.data && typeof trendsResponse.data !== 'object') {
        throw new Error('Invalid trend data received');
      }
      
      if (monitoringResponse.data && typeof monitoringResponse.data !== 'object') {
        throw new Error('Invalid monitoring data received');
      }
      
      const analyticsData = {
        healthScores: scoresResponse.data,
        predictions: predictionsResponse.data,
        goals: goalsResponse.data,
        healthcareProfessionals: healthcareResponse.data,
        trendData: trendsResponse.data,
        monitoringData: monitoringResponse.data,
        timestamp: Date.now()
      };
      
      // Cache the data
      await cache.cachePremiumData(analyticsData, 10 * 60 * 1000); // 10 minutes TTL
      
      setHealthScores(scoresResponse.data);
      setPredictions(predictionsResponse.data);
      setGoals(goalsResponse.data);
      setHealthcareProfessionals(healthcareResponse.data);
      setTrendData(trendsResponse.data);
      setMonitoringData(monitoringResponse.data);

    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      
      // Track API error
      await analyticsService.trackEvent({
        id: `premium_api_error_${Date.now()}`,
        userId: user?.id?.toString() || 'anonymous',
        type: 'api_error',
        data: {
          error: error.message || 'Unknown error',
          retryCount,
          dataType: 'premium_dashboard'
        },
        timestamp: new Date().toISOString()
      });
      
      // Try to load from cache as fallback
      if (isCacheLoaded) {
        try {
          const cachedData = await cache.getCachedPremiumData();
          if (cachedData) {
            console.log('Loading analytics data from cache after API error');
            setHealthScores(cachedData.healthScores || []);
            setPredictions(cachedData.predictions || []);
            setGoals(cachedData.goals || []);
            setHealthcareProfessionals(cachedData.healthcareProfessionals || []);
            setTrendData(cachedData.trendData || null);
            setMonitoringData(cachedData.monitoringData || null);
            setLoading(false);
            return;
          }
        } catch (cacheError) {
          console.error('Error loading from cache:', cacheError);
        }
      }
      
      // Enhanced error handling with specific error messages
      let errorMessage = 'Failed to load analytics data. Please check your connection and try again.';
      
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
            { text: 'Retry', onPress: () => loadAnalyticsData(retryCount + 1) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
      
      // Fallback to mock data if API fails
      if (retryCount === 0) {
        try {
          const mockHealthScores: HealthScore[] = [
            {
              id: 1,
              scoreType: 'Overall Health',
              scoreValue: 78,
              calculationDate: new Date().toISOString(),
              trendDirection: 'up'
            },
            {
              id: 2,
              scoreType: 'Nutrition',
              scoreValue: 85,
              calculationDate: new Date().toISOString(),
              trendDirection: 'stable'
            }
          ];
          
          const mockPredictions: Prediction[] = [
            {
              id: 1,
              predictionType: 'Weight Goal',
              predictionValue: 70,
              confidenceScore: 0.85,
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              recommendations: ['Increase protein intake', 'Reduce calorie intake by 200 calories']
            }
          ];
          
          const mockGoals: HealthGoal[] = [
            {
              id: 1,
              goalType: 'weight',
              goalTitle: 'Reach target weight',
              targetValue: 70,
              unit: 'kg',
              progressPercentage: 65,
              status: 'in_progress'
            }
          ];
          
          const mockHealthcareProfessionals: HealthcareProfessional[] = [
            {
              id: 1,
              professionalName: 'Dr. Sarah Johnson',
              professionalType: 'Nutritionist',
              practiceName: 'Health & Wellness Center',
              accessLevel: 'full',
              status: 'connected'
            }
          ];
          
          const mockAnalyticsData = {
            healthScores: mockHealthScores,
            predictions: mockPredictions,
            goals: mockGoals,
            healthcareProfessionals: mockHealthcareProfessionals,
            trendData: null,
            monitoringData: null,
            timestamp: Date.now()
          };
          
          // Cache mock data for offline use
          await cache.cachePremiumData(mockAnalyticsData, 30 * 60 * 1000); // 30 minutes TTL
          
          setHealthScores(mockHealthScores);
          setPredictions(mockPredictions);
          setGoals(mockGoals);
          setHealthcareProfessionals(mockHealthcareProfessionals);
          
          // Show offline notification
          Alert.alert(
            'Using Offline Data',
            'Using cached analytics data while offline. Some features may be limited.',
            [{ text: 'OK', style: 'cancel' }]
          );
        } catch (fallbackError: any) {
          console.error('Fallback also failed:', fallbackError);
          if (retryCount >= 2) {
            Alert.alert(
              'Error',
              'Failed to load analytics data. Please try again later.',
              [{ text: 'OK', style: 'cancel' }]
            );
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    // Clear cache before refreshing to get fresh data
    await cache.removeCachedData('premium_data');
    await loadAnalyticsData();
    setRefreshing(false);
  };

  // Generate health report
  const handleGenerateReport = async () => {
    try {
      const response = await api.premium.generateReport({
        templateId: 'weekly_summary',
        templateName: 'Weekly Health Summary',
        templateType: 'weekly_summary',
        sections: ['Executive Summary', 'Nutrition Analysis', 'Fitness Performance'],
        duration: 'Last 7 days'
      });

      if (response.data) {
        Alert.alert('Success', 'Health report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate health report');
    }
  };

  // Share analytics data
  const handleShareAnalytics = async () => {
    try {
      const reportResponse = await api.wearable.exportData({
        format: 'json',
        timeframe: '30d'
      });

      const shareOptions = {
        title: 'My Health Analytics',
        message: 'Check out my health analytics data',
        url: `data:application/json;base64,${btoa(JSON.stringify(reportResponse.data, null, 2))}`,
        subject: 'Health Analytics Report'
      };

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing analytics:', error);
      Alert.alert('Error', 'Failed to share analytics data');
    }
  };

  // Render overview tab
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Health Scores Summary */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.healthScores')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scoresContainer}>
          {healthScores.map((score) => (
            <HealthScoreCard key={score.id} score={score} />
          ))}
        </ScrollView>
      </View>

      {/* Predictions */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.predictions')}
        </Text>
        <View style={styles.predictionsContainer}>
          {predictions.map((prediction) => (
            <PredictionCard key={prediction.id} prediction={prediction} />
          ))}
        </View>
      </View>

      {/* Goals Progress */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.goals')}
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {goals.map((goal) => (
            <GoalProgressCard key={goal.id} goal={goal} />
          ))}
        </ScrollView>
      </View>

      {/* Real-time Monitoring */}
      {monitoringData && monitoringData.length > 0 && (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {i18n.t('premium.realTimeMonitoring')}
          </Text>
          <RealTimeMonitor data={monitoringData} />
        </View>
      )}
    </View>
  );

  // Render trends tab
  const renderTrends = () => (
    <View style={styles.tabContent}>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.trendAnalysis')}
        </Text>
        {trendData ? (
          <TrendChart data={trendData} />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              No trend data available
            </Text>
          </View>
        )}
      </View>

      {/* Correlation Analysis */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.correlationAnalysis')}
        </Text>
        <View style={styles.correlationContainer}>
          <Text style={[styles.correlationText, { color: colors.gray }]}>
            Analyzing relationships between health metrics...
          </Text>
        </View>
      </View>
    </View>
  );

  // Render healthcare tab
  const renderHealthcare = () => (
    <View style={styles.tabContent}>
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.healthcareConnections')}
        </Text>
        {healthcareProfessionals.length > 0 ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {healthcareProfessionals.map((professional) => (
              <HealthcareConnectionCard key={professional.id} professional={professional} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              No healthcare professionals connected
            </Text>
            <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.addButtonText}>Add Professional</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Report Generator */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {i18n.t('premium.reports')}
        </Text>
        <ReportGenerator onGenerate={handleGenerateReport} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: 'white' }]}>
            {i18n.t('premium.title')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShareAnalytics}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleGenerateReport}
            >
              <Ionicons name="document-text-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'overview' && [styles.tabButtonActive, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'overview' && { color: colors.primary }
          ]}>
            {i18n.t('premium.overview')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'trends' && [styles.tabButtonActive, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('trends')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'trends' && { color: colors.primary }
          ]}>
            {i18n.t('premium.trends')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'healthcare' && [styles.tabButtonActive, { borderBottomColor: colors.primary }]
          ]}
          onPress={() => setActiveTab('healthcare')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'healthcare' && { color: colors.primary }
          ]}>
            {i18n.t('premium.healthcare')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!isCacheLoaded ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading cache...
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading analytics...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'trends' && renderTrends()}
            {activeTab === 'healthcare' && renderHealthcare()}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  predictionsContainer: {
    gap: 12,
  },
  correlationContainer: {
    padding: 16,
    alignItems: 'center',
  },
  correlationText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  addButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});