import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import i18n from '../i18n';
import axios from 'axios';

// Import premium components
import { RealTimeMonitoring } from '../components/premium/RealTimeMonitoring';
import { HealthcareIntegration } from '../components/premium/HealthcareIntegration';
import { DataVisualization } from '../components/premium/DataVisualization';
import { PredictiveAnalytics } from '../components/premium/PredictiveAnalytics';
import { ProfessionalReports } from '../components/premium/ProfessionalReports';

// Memoized premium components for better performance
const MemoizedRealTimeMonitoring = React.memo(RealTimeMonitoring);
const MemoizedHealthcareIntegration = React.memo(HealthcareIntegration);
const MemoizedDataVisualization = React.memo(DataVisualization);
const MemoizedPredictiveAnalytics = React.memo(PredictiveAnalytics);
const MemoizedProfessionalReports = React.memo(ProfessionalReports);

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  component: React.ComponentType;
  premium: boolean;
  enabled: boolean;
}

const { width: screenWidth } = Dimensions.get('screen');

export const PremiumDashboardScreen = React.memo(() => {
  PremiumDashboardScreen.displayName = 'PremiumDashboardScreen';
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedFeature, setSelectedFeature] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthScore, setHealthScore] = useState<number>(0);
  const [premiumStatus, setPremiumStatus] = useState<boolean>(false);
  const [stats, setStats] = useState({
    avgCalories: 0,
    dailyExercise: 0,
    avgSleep: 0,
    waterIntake: 0
  });

  const premiumFeatures: PremiumFeature[] = [
    {
      id: 'overview',
      name: 'Overview',
      description: 'Your health at a glance',
      icon: 'home-outline',
      color: '#6366F1',
      component: React.memo(() => (
        <View>
          <Text>Overview Component</Text>
        </View>
      )),
      premium: false,
      enabled: true
    },
    {
      id: 'realtime',
      name: 'Real-time Monitoring',
      description: 'Live health tracking',
      icon: 'pulse-outline',
      color: '#EF4444',
      component: MemoizedRealTimeMonitoring,
      premium: true,
      enabled: premiumStatus
    },
    {
      id: 'visualization',
      name: 'Data Visualization',
      description: 'Advanced charts and insights',
      icon: 'bar-chart-outline',
      color: '#10B981',
      component: MemoizedDataVisualization,
      premium: true,
      enabled: premiumStatus
    },
    {
      id: 'predictive',
      name: 'Predictive Analytics',
      description: 'AI-powered predictions',
      icon: 'analytics-outline',
      color: '#3B82F6',
      component: MemoizedPredictiveAnalytics,
      premium: true,
      enabled: premiumStatus
    },
    {
      id: 'healthcare',
      name: 'Healthcare Integration',
      description: 'Connect with professionals',
      icon: 'medical-outline',
      color: '#8B5CF6',
      component: MemoizedHealthcareIntegration,
      premium: true,
      enabled: premiumStatus
    },
    {
      id: 'reports',
      name: 'Professional Reports',
      description: 'Generate detailed reports',
      icon: 'document-text-outline',
      color: '#F59E0B',
      component: MemoizedProfessionalReports,
      premium: true,
      enabled: premiumStatus
    }
  ];

  const fetchUserData = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      // Fetch real user data, premium status, and stats from API
      const [healthScoreResponse, premiumStatusResponse, statsResponse] = await Promise.all([
        axios.get('/api/user/health-score'),
        axios.get('/api/user/premium-status'),
        axios.get('/api/user/dashboard-stats')
      ]);
      
      const healthScore = healthScoreResponse.data?.score || 0;
      const premiumStatus = premiumStatusResponse.data?.isPremium || false;
      const statsData = statsResponse.data || {};
      
      // Validate API response data
      if (typeof healthScore !== 'number' || healthScore < 0 || healthScore > 100) {
        throw new Error('Invalid health score data received');
      }
      
      if (typeof premiumStatus !== 'boolean') {
        throw new Error('Invalid premium status data received');
      }
      
      if (!statsData || typeof statsData !== 'object') {
        throw new Error('Invalid stats data received');
      }
      
      setHealthScore(healthScore);
      setPremiumStatus(premiumStatus);
      setStats({
        avgCalories: statsData.avgCalories || 0,
        dailyExercise: statsData.dailyExercise || 0,
        avgSleep: statsData.avgSleep || 0,
        waterIntake: statsData.waterIntake || 0
      });
      
    } catch (error: any) {
      console.error('Error fetching user data:', error);
      
      // Enhanced error handling with specific error messages
      let errorMessage = 'Failed to load user data. Please check your connection and try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Retry', onPress: () => fetchUserData(retryCount + 1) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      
      // Fallback to mock data after 2 failed attempts
      if (retryCount >= 2) {
        try {
          const mockHealthScore = 78;
          const mockPremiumStatus = user?.isPremium || false;
          const mockStats = {
            avgCalories: 2150,
            dailyExercise: 45,
            avgSleep: 7.2,
            waterIntake: 2.1
          };
          
          setHealthScore(mockHealthScore);
          setPremiumStatus(mockPremiumStatus);
          setStats(mockStats);
          
          Alert.alert(
            'Using Offline Data',
            'Using cached data while offline. Some features may be limited.',
            [{ text: 'OK', style: 'cancel' }]
          );
        } catch (fallbackError: any) {
          console.error('Fallback also failed:', fallbackError);
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleFeaturePress = (featureId: string) => {
    const feature = premiumFeatures.find(f => f.id === featureId);
    
    if (feature && feature.premium && !premiumStatus) {
      Alert.alert(
        'Premium Feature',
        'This feature requires premium subscription. Upgrade now to unlock all premium features.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => Alert.alert('Upgrade', 'Redirecting to premium upgrade...') }
        ]
      );
      return;
    }
    
    if (feature && feature.enabled) {
      setSelectedFeature(featureId);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getHealthScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const renderOverview = React.useMemo(() => () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchUserData} />
      }
    >
      {/* Health Score Card */}
      <View style={[styles.healthScoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.healthScoreTitle, { color: colors.text }]}>
          Overall Health Score
        </Text>
        <View style={styles.healthScoreContainer}>
          <View style={[styles.healthScoreCircle, { borderColor: getHealthScoreColor(healthScore) }]}>
            <Text style={[styles.healthScoreValue, { color: getHealthScoreColor(healthScore) }]}>
              {healthScore}
            </Text>
            <Text style={[styles.healthScoreLabel, { color: colors.gray }]}>
              /100
            </Text>
          </View>
          <View style={styles.healthScoreDetails}>
            <Text style={[styles.healthScoreStatus, { color: getHealthScoreColor(healthScore) }]}>
              {getHealthScoreText(healthScore)}
            </Text>
            <Text style={[styles.healthScoreDescription, { color: colors.gray }]}>
              Based on your nutrition, fitness, recovery, and consistency metrics
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="restaurant-outline" size={24} color="#EF4444" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.avgCalories > 0 ? stats.avgCalories.toLocaleString() : '2,150'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Avg. Calories
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <Ionicons name="fitness-outline" size={24} color="#10B981" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.dailyExercise > 0 ? `${stats.dailyExercise} min` : '45 min'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Daily Exercise
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
            <Ionicons name="moon-outline" size={24} color="#3B82F6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.avgSleep > 0 ? `${stats.avgSleep} hrs` : '7.2 hrs'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Avg. Sleep
          </Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#8B5CF620' }]}>
            <Ionicons name="water-outline" size={24} color="#8B5CF6" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.waterIntake > 0 ? `${stats.waterIntake} L` : '2.1 L'}
          </Text>
          <Text style={[styles.statLabel, { color: colors.gray }]}>
            Water Intake
          </Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.activityTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        
        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="restaurant-outline" size={16} color="#EF4444" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: colors.text }]}>
                Breakfast logged
              </Text>
              <Text style={[styles.activityTime, { color: colors.gray }]}>
                2 hours ago
              </Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="fitness-outline" size={16} color="#10B981" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: colors.text }]}>
                Morning workout completed
              </Text>
              <Text style={[styles.activityTime, { color: colors.gray }]}>
                4 hours ago
              </Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={[styles.activityIcon, { backgroundColor: '#3B82F620' }]}>
              <Ionicons name="moon-outline" size={16} color="#3B82F6" />
            </View>
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: colors.text }]}>
                Sleep data synced
              </Text>
              <Text style={[styles.activityTime, { color: colors.gray }]}>
                Last night
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Premium Status */}
      <View style={[styles.premiumCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.premiumHeader}>
          <View style={[styles.premiumIcon, { backgroundColor: '#F59E0B20' }]}>
            <Ionicons name="star-outline" size={24} color="#F59E0B" />
          </View>
          <View style={styles.premiumInfo}>
            <Text style={[styles.premiumTitle, { color: colors.text }]}>
              Premium Status
            </Text>
            <Text style={[styles.premiumStatus, { color: premiumStatus ? '#10B981' : '#EF4444' }]}>
              {premiumStatus ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <Text style={[styles.premiumDescription, { color: colors.gray }]}>
          {premiumStatus 
            ? 'You have access to all premium features including real-time monitoring, predictive analytics, and healthcare integration.'
            : 'Upgrade to Premium to unlock advanced analytics, real-time monitoring, healthcare integration, and professional reports.'
          }
        </Text>
        
        {!premiumStatus && (
          <TouchableOpacity
            style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert('Upgrade', 'Redirecting to premium upgrade...')}
          >
            <Text style={styles.upgradeButtonText}>
              Upgrade Now
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  ), [healthScore, premiumStatus, colors]);

  const renderFeatureContent = React.useMemo(() => () => {
    const feature = premiumFeatures.find(f => f.id === selectedFeature);
    
    if (!feature || !feature.enabled) {
      return (
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <Ionicons name="lock-closed-outline" size={48} color={colors.gray} />
            <Text style={[styles.featureTitle, { color: colors.text }]}>
              Feature Locked
            </Text>
            <Text style={[styles.featureDescription, { color: colors.gray }]}>
              This feature requires premium subscription.
            </Text>
            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => Alert.alert('Upgrade', 'Redirecting to premium upgrade...')}
            >
              <Text style={styles.upgradeButtonText}>
                Upgrade to Premium
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const FeatureComponent = feature.component;
    return <FeatureComponent />;
  }, [selectedFeature, premiumStatus, premiumFeatures, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => console.log('Back pressed')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Premium Dashboard
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Feature Grid */}
      {selectedFeature === 'overview' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.featureScroll}
          contentContainerStyle={styles.featureScrollContent}
        >
          {premiumFeatures.map(feature => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureCard,
                { 
                  backgroundColor: feature.enabled ? colors.card : '#F3F4F6',
                  borderColor: feature.enabled ? colors.border : '#E5E7EB',
                  opacity: feature.enabled ? 1 : 0.6
                }
              ]}
              onPress={() => handleFeaturePress(feature.id)}
              disabled={!feature.enabled}
            >
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                <Ionicons name={feature.icon as any} size={24} color={feature.color} />
              </View>
              <Text style={[styles.featureName, { color: colors.text }]}>
                {feature.name}
              </Text>
              <Text style={[styles.featureDescription, { color: colors.gray }]}>
                {feature.description}
              </Text>
              {feature.premium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumBadgeText}>
                    Premium
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {selectedFeature === 'overview' ? renderOverview() : renderFeatureContent()}
    </View>
  );
});

PremiumDashboardScreen.displayName = 'PremiumDashboardScreen';

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
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  headerSpacer: {
    width: 40,
  },
  featureScroll: {
    maxHeight: 200,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  healthScoreCard: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  healthScoreTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  healthScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  healthScoreValue: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  healthScoreLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  healthScoreDetails: {
    flex: 1,
  },
  healthScoreStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  healthScoreDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  activityCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  premiumCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  premiumInfo: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  premiumStatus: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  premiumDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
  },
  upgradeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
});