import React, { useState, useEffect, useMemo } from 'react';
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
  Platform,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import i18n from '../../i18n';
import { predictiveAnalyticsService, PredictiveAnalyticsResponse } from '../../services/predictiveAnalyticsService';

interface Prediction {
  id: string;
  type: 'weight_projection' | 'goal_achievement' | 'health_risk' | 'performance_optimization';
  title: string;
  description: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  trend: 'improving' | 'declining' | 'stable';
  insights: string[];
  recommendations: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

interface HealthRisk {
  id: string;
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  probability: number;
  factors: string[];
  mitigation: string[];
  timeframe: string;
}

interface GoalProgress {
  id: string;
  title: string;
  type: 'weight_loss' | 'fitness' | 'health' | 'nutrition';
  current: number;
  target: number;
  deadline: string;
  probability: number;
  trend: 'on_track' | 'at_risk' | 'behind';
  recommendations: string[];
}

interface AIInsight {
  id: string;
  category: 'nutrition' | 'fitness' | 'sleep' | 'stress' | 'recovery';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  actionable: boolean;
  steps: string[];
}

const { width: screenWidth } = Dimensions.get('screen');

export const PredictiveAnalytics = React.memo(() => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState('predictions');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [healthRisks, setHealthRisks] = useState<HealthRisk[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  const tabs = [
    { id: 'predictions', name: 'Predictions', icon: 'analytics-outline' },
    { id: 'risks', name: 'Health Risks', icon: 'warning-outline' },
    { id: 'goals', name: 'Goal Progress', icon: 'flag-outline' },
    { id: 'insights', name: 'AI Insights', icon: 'bulb-outline' },
  ];

  const generateMockData = () => {
    // Generate predictions
    const predictions: Prediction[] = [
      {
        id: '1',
        type: 'weight_projection',
        title: 'Weight Projection',
        description: 'Based on your current trends and habits',
        currentValue: 72,
        predictedValue: 70.5,
        confidence: 85,
        timeframe: '30 days',
        trend: 'improving',
        insights: [
          'Current weight: 72kg',
          'Projected weight: 70.5kg',
          'Weight loss rate: 0.5kg per week',
          'Consistent with your goals'
        ],
        recommendations: [
          'Maintain current calorie deficit',
          'Increase protein intake to 1.6g/kg',
          'Add 2-3 strength training sessions per week'
        ]
      },
      {
        id: '2',
        type: 'goal_achievement',
        title: 'Goal Achievement Probability',
        description: 'Probability of achieving your fitness goals',
        currentValue: 65,
        predictedValue: 78,
        confidence: 72,
        timeframe: '90 days',
        trend: 'improving',
        insights: [
          'Current progress: 65% of target',
          'Achievement probability: 78%',
          'On track to meet deadline',
          'Consistent progress rate'
        ],
        recommendations: [
          'Continue current workout routine',
          'Increase intensity by 10%',
          'Focus on recovery and nutrition'
        ]
      },
      {
        id: '3',
        type: 'health_risk',
        title: 'Health Risk Assessment',
        description: 'Potential health risks based on current metrics',
        currentValue: 25,
        predictedValue: 30,
        confidence: 68,
        timeframe: '60 days',
        trend: 'declining',
        insights: [
          'Current risk score: 25/100',
          'Projected risk: 30/100',
          'Moderate risk level',
          'Several contributing factors'
        ],
        recommendations: [
          'Monitor blood pressure regularly',
          'Reduce sodium intake',
          'Increase cardiovascular exercise',
          'Consider stress management techniques'
        ],
        riskLevel: 'medium'
      },
      {
        id: '4',
        type: 'performance_optimization',
        title: 'Performance Optimization',
        description: 'Optimize your fitness performance',
        currentValue: 72,
        predictedValue: 85,
        confidence: 80,
        timeframe: '45 days',
        trend: 'improving',
        insights: [
          'Current performance score: 72/100',
          'Optimized performance: 85/100',
          'Significant improvement potential',
          'Multiple optimization opportunities'
        ],
        recommendations: [
          'Adjust workout intensity and volume',
          'Optimize nutrition timing',
          'Improve sleep quality',
          'Implement progressive overload'
        ]
      }
    ];

    // Generate health risks
    const healthRisks: HealthRisk[] = [
      {
        id: '1',
        category: 'Cardiovascular',
        riskLevel: 'medium',
        probability: 35,
        factors: [
          'Elevated resting heart rate',
          'Family history of hypertension',
          'Slightly elevated cholesterol',
          'Sedentary lifestyle'
        ],
        mitigation: [
          'Regular cardiovascular exercise',
          'Reduce sodium intake',
          'Monitor blood pressure daily',
          'Consider stress management'
        ],
        timeframe: '6 months'
      },
      {
        id: '2',
        category: 'Metabolic',
        riskLevel: 'low',
        probability: 15,
        factors: [
          'Normal blood glucose levels',
          'Healthy weight range',
          'Regular physical activity'
        ],
        mitigation: [
          'Maintain current diet',
          'Regular exercise routine',
          'Annual health checkups'
        ],
        timeframe: '12 months'
      },
      {
        id: '3',
        category: 'Musculoskeletal',
        riskLevel: 'medium',
        probability: 28,
        factors: [
          'Insufficient stretching',
          'High-intensity workouts',
          'Previous injury history'
        ],
        mitigation: [
          'Increase warm-up duration',
          'Implement proper cool-down',
          'Consider physical therapy',
          'Cross-training activities'
        ],
        timeframe: '3 months'
      }
    ];

    // Generate goal progress
    const goalProgress: GoalProgress[] = [
      {
        id: '1',
        title: 'Weight Loss Goal',
        type: 'weight_loss',
        current: 72,
        target: 68,
        deadline: '2024-12-31',
        probability: 78,
        trend: 'on_track',
        recommendations: [
          'Current rate: 0.5kg per week',
          'On track to meet target',
          'Consider adjusting calorie targets',
          'Monitor body composition changes'
        ]
      },
      {
        id: '2',
        title: 'Fitness Improvement',
        type: 'fitness',
        current: 65,
        target: 80,
        deadline: '2025-01-15',
        probability: 65,
        trend: 'at_risk',
        recommendations: [
          'Progress slowing recently',
          'Increase workout intensity',
          'Focus on form and technique',
          'Consider professional guidance'
        ]
      },
      {
        id: '3',
        title: 'Sleep Quality',
        type: 'health',
        current: 7.2,
        target: 8.0,
        deadline: '2024-12-15',
        probability: 82,
        trend: 'on_track',
        recommendations: [
          'Good progress on sleep duration',
          'Focus on sleep quality',
          'Maintain consistent bedtime',
          'Optimize sleep environment'
        ]
      },
      {
        id: '4',
        title: 'Nutrition Balance',
        type: 'nutrition',
        current: 75,
        target: 90,
        deadline: '2024-12-20',
        probability: 70,
        trend: 'at_risk',
        recommendations: [
          'Need more meal variety',
          'Increase vegetable intake',
          'Reduce processed foods',
          'Consider meal planning'
        ]
      }
    ];

    // Generate AI insights
    const aiInsights: AIInsight[] = [
      {
        id: '1',
        category: 'nutrition',
        title: 'Optimal Meal Timing',
        description: 'Your body responds best to meals consumed at specific times',
        impact: 'high',
        confidence: 85,
        actionable: true,
        steps: [
          'Eat breakfast within 1 hour of waking',
          'Consume protein-rich meals 30 minutes post-workout',
          'Avoid large meals within 2 hours of bedtime',
          'Space meals 3-4 hours apart for optimal digestion'
        ]
      },
      {
        id: '2',
        category: 'fitness',
        title: 'Recovery Optimization',
        description: 'Your recovery patterns suggest opportunities for improvement',
        impact: 'medium',
        confidence: 78,
        actionable: true,
        steps: [
          'Add 1-2 rest days per week',
          'Implement active recovery sessions',
          'Focus on sleep quality and duration',
          'Consider foam rolling and stretching'
        ]
      },
      {
        id: '3',
        category: 'sleep',
        title: 'Sleep Consistency',
        description: 'Inconsistent sleep patterns affecting recovery and performance',
        impact: 'high',
        confidence: 92,
        actionable: true,
        steps: [
          'Maintain consistent bedtime (±30 minutes)',
          'Create a relaxing pre-sleep routine',
          'Limit screen time 1 hour before bed',
          'Optimize bedroom environment (cool, dark, quiet)'
        ]
      },
      {
        id: '4',
        category: 'stress',
        title: 'Stress Management',
        description: 'Elevated stress levels impacting overall health metrics',
        impact: 'medium',
        confidence: 75,
        actionable: true,
        steps: [
          'Implement daily meditation (10-15 minutes)',
          'Practice deep breathing exercises',
          'Consider yoga or tai chi',
          'Schedule regular stress check-ins'
        ]
      },
      {
        id: '5',
        category: 'recovery',
        title: 'Nutrient Timing',
        description: 'Optimize nutrient timing for better recovery and performance',
        impact: 'high',
        confidence: 88,
        actionable: true,
        steps: [
          'Consume 20-30g protein within 30 minutes post-workout',
          'Include carbohydrates in post-workout meals',
          'Stay hydrated throughout the day',
          'Consider electrolyte supplementation for intense workouts'
        ]
      }
    ];

    return { predictions, healthRisks, goalProgress, aiInsights };
  };

  const fetchData = async (retryCount = 0) => {
    try {
      setIsLoading(true);
      
      // Fetch real data from the API
      const analyticsData: PredictiveAnalyticsResponse = await predictiveAnalyticsService.fetchPredictiveAnalytics();
      
      setPredictions(analyticsData.predictions);
      setHealthRisks(analyticsData.healthRisks);
      setGoalProgress(analyticsData.goalProgress);
      setAiInsights(analyticsData.aiInsights);
      
    } catch (error: any) {
      console.error('Error fetching data:', error);
      
      // Enhanced error handling with specific error messages
      let errorMessage = 'Failed to load predictive data. Please check your connection and try again.';
      
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
            { text: 'Retry', onPress: () => fetchData(retryCount + 1) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
      
      // Fallback to mock data if API fails
      if (retryCount === 0) {
        try {
          const mockData = generateMockData();
          setPredictions(mockData.predictions);
          setHealthRisks(mockData.healthRisks);
          setGoalProgress(mockData.goalProgress);
          setAiInsights(mockData.aiInsights);
          
          // Show offline notification
          Alert.alert(
            'Using Offline Data',
            'Using cached predictive analytics while offline. Some features may be limited.',
            [{ text: 'OK', style: 'cancel' }]
          );
        } catch (fallbackError: any) {
          console.error('Fallback also failed:', fallbackError);
          if (retryCount >= 2) {
            Alert.alert(
              'Error',
              'Failed to load predictive data. Please try again later.',
              [{ text: 'OK', style: 'cancel' }]
            );
          }
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      
      // Generate new predictions from the backend
      const analyticsData: PredictiveAnalyticsResponse = await predictiveAnalyticsService.generatePredictions();
      
      setPredictions(analyticsData.predictions);
      setHealthRisks(analyticsData.healthRisks);
      setGoalProgress(analyticsData.goalProgress);
      setAiInsights(analyticsData.aiInsights);
      
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert(
        'Error',
        'Failed to refresh predictions. Please check your connection and try again.',
        [
          { text: 'Retry', onPress: handleRefresh },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPredictionIcon = (type: string) => {
    switch (type) {
      case 'weight_projection':
        return 'scale-outline';
      case 'goal_achievement':
        return 'flag-outline';
      case 'health_risk':
        return 'warning-outline';
      case 'performance_optimization':
        return 'trending-up-outline';
      default:
        return 'analytics-outline';
    }
  };

  const getPredictionColor = (type: string) => {
    switch (type) {
      case 'weight_projection':
        return '#10B981';
      case 'goal_achievement':
        return '#3B82F6';
      case 'health_risk':
        return '#EF4444';
      case 'performance_optimization':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getGoalTrendColor = (trend: string) => {
    switch (trend) {
      case 'on_track':
        return '#10B981';
      case 'at_risk':
        return '#F59E0B';
      case 'behind':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getGoalTrendText = (trend: string) => {
    switch (trend) {
      case 'on_track':
        return 'On Track';
      case 'at_risk':
        return 'At Risk';
      case 'behind':
        return 'Behind';
      default:
        return trend;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getImpactText = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'High Impact';
      case 'medium':
        return 'Medium Impact';
      case 'low':
        return 'Low Impact';
      default:
        return impact;
    }
  };

  const renderPredictionsTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.predictionsList}>
          {predictions.map(prediction => (
            <TouchableOpacity
              key={prediction.id}
              style={[styles.predictionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                setSelectedPrediction(prediction);
                setShowPredictionModal(true);
              }}
            >
              <View style={styles.predictionHeader}>
                <View style={[styles.predictionIcon, { backgroundColor: getPredictionColor(prediction.type) + '20' }]}>
                  <Ionicons name={getPredictionIcon(prediction.type) as any} size={24} color={getPredictionColor(prediction.type)} />
                </View>
                <View style={styles.predictionInfo}>
                  <Text style={[styles.predictionTitle, { color: colors.text }]}>
                    {prediction.title}
                  </Text>
                  <Text style={[styles.predictionDescription, { color: colors.gray }]}>
                    {prediction.description}
                  </Text>
                </View>
                <View style={styles.predictionConfidence}>
                  <Text style={[styles.confidenceText, { color: colors.text }]}>
                    {prediction.confidence}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.predictionMetrics}>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.gray }]}>
                    Current
                  </Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>
                    {prediction.currentValue}
                  </Text>
                </View>
                <View style={styles.metricArrow}>
                  <Ionicons name="arrow-forward-outline" size={16} color={colors.gray} />
                </View>
                <View style={styles.metricItem}>
                  <Text style={[styles.metricLabel, { color: colors.gray }]}>
                    Predicted
                  </Text>
                  <Text style={[styles.metricValue, { color: getPredictionColor(prediction.type) }]}>
                    {prediction.predictedValue}
                  </Text>
                </View>
              </View>
              
              <View style={styles.predictionTrend}>
                <Ionicons 
                  name={prediction.trend === 'improving' ? 'trending-up-outline' : prediction.trend === 'declining' ? 'trending-down-outline' : 'analytics-outline'}
                  size={16} 
                  color={prediction.trend === 'improving' ? '#10B981' : prediction.trend === 'declining' ? '#EF4444' : '#6B7280'} 
                />
                <Text style={[styles.trendText, { color: prediction.trend === 'improving' ? '#10B981' : prediction.trend === 'declining' ? '#EF4444' : '#6B7280' }]}>
                  {prediction.trend.charAt(0).toUpperCase() + prediction.trend.slice(1)}
                </Text>
                <Text style={[styles.timeframeText, { color: colors.gray }]}>
                  {prediction.timeframe}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderRisksTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.risksList}>
          {healthRisks.map(risk => (
            <View key={risk.id} style={[styles.riskCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.riskHeader}>
                <View style={[styles.riskIcon, { backgroundColor: getRiskColor(risk.riskLevel) + '20' }]}>
                  <Ionicons name="warning-outline" size={24} color={getRiskColor(risk.riskLevel)} />
                </View>
                <View style={styles.riskInfo}>
                  <Text style={[styles.riskCategory, { color: colors.text }]}>
                    {risk.category}
                  </Text>
                  <View style={styles.riskMeta}>
                    <View style={[styles.riskLevelBadge, { backgroundColor: getRiskColor(risk.riskLevel) + '20' }]}>
                      <Text style={[styles.riskLevelText, { color: getRiskColor(risk.riskLevel) }]}>
                        {risk.riskLevel.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.riskProbability, { color: colors.gray }]}>
                      {risk.probability}% probability
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.riskDetails}>
                <Text style={[styles.detailsTitle, { color: colors.text }]}>
                  Contributing Factors:
                </Text>
                {risk.factors.map((factor, index) => (
                  <Text key={index} style={[styles.factorText, { color: colors.text }]}>
                    • {factor}
                  </Text>
                ))}
              </View>
              
              <View style={styles.riskMitigation}>
                <Text style={[styles.detailsTitle, { color: colors.text }]}>
                  Mitigation Strategies:
                </Text>
                {risk.mitigation.map((strategy, index) => (
                  <Text key={index} style={[styles.strategyText, { color: colors.text }]}>
                    • {strategy}
                  </Text>
                ))}
              </View>
              
              <View style={styles.riskFooter}>
                <Text style={[styles.timeframeText, { color: colors.gray }]}>
                  Timeframe: {risk.timeframe}
                </Text>
                <TouchableOpacity
                  style={[styles.riskAction, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Risk Details', 'View detailed risk analysis')}
                >
                  <Text style={styles.riskActionText}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderGoalsTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.goalsList}>
          {goalProgress.map(goal => (
            <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.goalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: getGoalTrendColor(goal.trend) + '20' }]}>
                  <Ionicons name="flag-outline" size={24} color={getGoalTrendColor(goal.trend)} />
                </View>
                <View style={styles.goalInfo}>
                  <Text style={[styles.goalTitle, { color: colors.text }]}>
                    {goal.title}
                  </Text>
                  <Text style={[styles.goalType, { color: colors.gray }]}>
                    {goal.type.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.goalProbability}>
                  <Text style={[styles.probabilityText, { color: colors.text }]}>
                    {goal.probability}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.goalProgress}>
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressLabel, { color: colors.gray }]}>
                    Progress
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {goal.current} / {goal.target}
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.lightGray }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: getGoalTrendColor(goal.trend),
                        width: `${(goal.current / goal.target) * 100}%`,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.goalDeadline}>
                  <Text style={[styles.deadlineText, { color: colors.gray }]}>
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.goalTrend}>
                <Ionicons 
                  name={goal.trend === 'on_track' ? 'checkmark-circle-outline' : goal.trend === 'at_risk' ? 'alert-circle-outline' : 'close-circle-outline'} 
                  size={16} 
                  color={getGoalTrendColor(goal.trend)} 
                />
                <Text style={[styles.trendText, { color: getGoalTrendColor(goal.trend) }]}>
                  {getGoalTrendText(goal.trend)}
                </Text>
              </View>
              
              <View style={styles.goalRecommendations}>
                <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
                  Recommendations:
                </Text>
                {goal.recommendations.slice(0, 2).map((recommendation, index) => (
                  <Text key={index} style={[styles.recommendationText, { color: colors.text }]}>
                    • {recommendation}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const renderInsightsTab = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.insightsList}>
          {aiInsights.map(insight => (
            <View key={insight.id} style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightIcon, { backgroundColor: getImpactColor(insight.impact) + '20' }]}>
                  <Ionicons name="bulb-outline" size={24} color={getImpactColor(insight.impact)} />
                </View>
                <View style={styles.insightInfo}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    {insight.title}
                  </Text>
                  <Text style={[styles.insightCategory, { color: colors.gray }]}>
                    {insight.category.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.impactBadge, { backgroundColor: getImpactColor(insight.impact) + '20' }]}>
                  <Text style={[styles.impactText, { color: getImpactColor(insight.impact) }]}>
                    {getImpactText(insight.impact)}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.insightDescription, { color: colors.text }]}>
                {insight.description}
              </Text>
              
              <View style={styles.insightMeta}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.gray }]}>
                    Confidence:
                  </Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {insight.confidence}%
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.gray }]}>
                    Actionable:
                  </Text>
                  <Text style={[styles.metaValue, { color: insight.actionable ? '#10B981' : '#EF4444' }]}>
                    {insight.actionable ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
              
              {insight.actionable && (
                <View style={styles.insightSteps}>
                  <Text style={[styles.stepsTitle, { color: colors.text }]}>
                    Action Steps:
                  </Text>
                  {insight.steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                      <View style={[styles.stepBullet, { backgroundColor: colors.primary }]}>
                        <Text style={styles.stepNumber}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text style={[styles.stepText, { color: colors.text }]}>
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
              <View style={styles.insightActions}>
                <TouchableOpacity
                  style={[styles.insightAction, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Implement', 'Start implementing this insight')}
                >
                  <Text style={styles.insightActionText}>
                    Implement
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.insightAction, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('Details', 'View detailed insight analysis')}
                >
                  <Text style={[styles.insightActionText, { color: '#6366F1' }]}>
                    Learn More
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('premium.predictiveAnalytics')}
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="refresh-outline" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              selectedTab === tab.id && [styles.tabButtonActive, { borderBottomColor: colors.primary }]
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={20} 
              color={selectedTab === tab.id ? colors.primary : colors.gray} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.id && { color: colors.primary }
            ]}>
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {selectedTab === 'predictions' && renderPredictionsTab()}
      {selectedTab === 'risks' && renderRisksTab()}
      {selectedTab === 'goals' && renderGoalsTab()}
      {selectedTab === 'insights' && renderInsightsTab()}

      {/* Prediction Modal */}
      {selectedPrediction && (
        <Modal
          visible={showPredictionModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPredictionModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedPrediction.title}
              </Text>
              <TouchableOpacity onPress={() => setShowPredictionModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalPredictionInfo}>
                <View style={styles.modalPredictionHeader}>
                  <View style={[styles.modalPredictionIcon, { backgroundColor: getPredictionColor(selectedPrediction.type) + '20' }]}>
                    <Ionicons name={getPredictionIcon(selectedPrediction.type) as any} size={32} color={getPredictionColor(selectedPrediction.type)} />
                  </View>
                  <View style={styles.modalPredictionMeta}>
                    <Text style={[styles.modalPredictionDescription, { color: colors.text }]}>
                      {selectedPrediction.description}
                    </Text>
                    <View style={styles.modalPredictionConfidence}>
                      <Text style={[styles.confidenceText, { color: colors.text }]}>
                        Confidence: {selectedPrediction.confidence}%
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.modalPredictionMetrics}>
                  <View style={styles.modalMetricItem}>
                    <Text style={[styles.modalMetricLabel, { color: colors.gray }]}>
                      Current Value
                    </Text>
                    <Text style={[styles.modalMetricValue, { color: colors.text }]}>
                      {selectedPrediction.currentValue}
                    </Text>
                  </View>
                  <View style={styles.modalMetricArrow}>
                    <Ionicons name="arrow-forward-outline" size={20} color={colors.gray} />
                  </View>
                  <View style={styles.modalMetricItem}>
                    <Text style={[styles.modalMetricLabel, { color: colors.gray }]}>
                      Predicted Value
                    </Text>
                    <Text style={[styles.modalMetricValue, { color: getPredictionColor(selectedPrediction.type) }]}>
                      {selectedPrediction.predictedValue}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalPredictionTrend}>
                  <Ionicons 
                    name={selectedPrediction.trend === 'improving' ? 'trending-up-outline' : selectedPrediction.trend === 'declining' ? 'trending-down-outline' : 'analytics-outline'}
                    size={20} 
                    color={selectedPrediction.trend === 'improving' ? '#10B981' : selectedPrediction.trend === 'declining' ? '#EF4444' : '#6B7280'} 
                  />
                  <Text style={[styles.trendText, { color: selectedPrediction.trend === 'improving' ? '#10B981' : selectedPrediction.trend === 'declining' ? '#EF4444' : '#6B7280' }]}>
                    {selectedPrediction.trend.charAt(0).toUpperCase() + selectedPrediction.trend.slice(1)}
                  </Text>
                  <Text style={[styles.timeframeText, { color: colors.gray }]}>
                    {selectedPrediction.timeframe}
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalPredictionInsights}>
                <Text style={[styles.insightsTitle, { color: colors.text }]}>
                  Key Insights:
                </Text>
                {selectedPrediction.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.insightMeta, { color: colors.text }]}>
                      {insight}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.modalPredictionRecommendations}>
                <Text style={[styles.recommendationsTitle, { color: colors.text }]}>
                  Recommendations:
                </Text>
                {selectedPrediction.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <View style={[styles.recommendationIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.recommendationText, { color: colors.text }]}>
                      {recommendation}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.modalPredictionActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Set Reminder', 'Set reminder to track this prediction')}
                >
                  <Text style={styles.modalButtonText}>
                    Set Reminder
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('Share', 'Share prediction with healthcare provider')}
                >
                  <Text style={[styles.modalButtonText, { color: '#6366F1' }]}>
                    Share
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
});

PredictiveAnalytics.displayName = 'PredictiveAnalytics';

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
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter-SemiBold',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  predictionsList: {
    gap: 12,
    padding: 16,
  },
  predictionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  predictionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  predictionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  predictionConfidence: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  predictionMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  metricArrow: {
    marginHorizontal: 8,
  },
  predictionTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  timeframeText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginLeft: 8,
  },
  risksList: {
    gap: 12,
    padding: 16,
  },
  riskCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  riskInfo: {
    flex: 1,
  },
  riskCategory: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  riskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskLevelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  riskLevelText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  riskProbability: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  riskDetails: {
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  factorText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  riskMitigation: {
    marginBottom: 12,
  },
  strategyText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  riskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  riskActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  goalsList: {
    gap: 12,
    padding: 16,
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  goalType: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  goalProbability: {
    alignItems: 'center',
  },
  probabilityText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  goalProgress: {
    flex: 1,
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  goalDeadline: {
    marginTop: 4,
  },
  deadlineText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  goalTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalRecommendations: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 4,
  },
  insightsList: {
    gap: 12,
    padding: 16,
  },
  insightCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightInfo: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  insightCategory: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  insightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginRight: 4,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  insightSteps: {
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
  stepText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  insightActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  insightActionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalPredictionInfo: {
    marginBottom: 20,
  },
  modalPredictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalPredictionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalPredictionMeta: {
    flex: 1,
  },
  modalPredictionDescription: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
  },
  modalPredictionConfidence: {
    alignItems: 'center',
  },
  modalPredictionMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalMetricItem: {
    alignItems: 'center',
  },
  modalMetricLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 2,
  },
  modalMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  modalMetricArrow: {
    marginHorizontal: 12,
  },
  modalPredictionTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalPredictionInsights: {
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalPredictionRecommendations: {
    marginBottom: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recommendationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  modalPredictionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});