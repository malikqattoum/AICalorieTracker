import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FlatList } from 'react-native';
import {
  ChartData,
  HealthMetric,
  Correlation
} from '../../types/premiumTypes';
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
  Modal,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import i18n from '../../i18n';
import analyticsService from '../../services/analyticsService';
import api from '../../services/api';
import { useCache } from '../../contexts/CacheContext';

const { width: screenWidth } = Dimensions.get('screen');

export const DataVisualization: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { cache, isCacheLoaded } = useCache();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartAnimation] = useState(new Animated.Value(0));
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Initialize analytics service
  useEffect(() => {
    const initializeAnalytics = async () => {
      try {
        await analyticsService.initialize();
        // Track page view
        await analyticsService.trackEvent({
          id: `data_visualization_view_${Date.now()}`,
          userId: user?.id?.toString() || 'anonymous',
          type: 'page_view',
          data: { page: 'data_visualization' },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error initializing analytics:', error);
      }
    };
    
    initializeAnalytics();
  }, [user]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'home-outline' },
    { id: 'charts', name: 'Charts', icon: 'bar-chart-outline' },
    { id: 'metrics', name: 'Metrics', icon: 'analytics-outline' },
    { id: 'correlations', name: 'Correlations', icon: 'link-outline' },
  ];

  const generateMockData = () => {
    // Generate charts
    const charts: ChartData[] = [
      {
        id: '1',
        title: 'Calorie Intake Trend',
        type: 'line',
        data: [
          { date: '2024-11-01', value: 2100 },
          { date: '2024-11-02', value: 1950 },
          { date: '2024-11-03', value: 2200 },
          { date: '2024-11-04', value: 2050 },
          { date: '2024-11-05', value: 2300 },
          { date: '2024-11-06', value: 2150 },
          { date: '2024-11-07', value: 2000 },
        ],
        period: 'weekly',
        insights: [
          'Average calorie intake: 2,150 kcal',
          '5% increase from last week',
          'Consistent with target range'
        ],
        trend: 'stable',
        change: 2.5
      },
      {
        id: '2',
        title: 'Macronutrient Distribution',
        type: 'pie',
        data: [
          { name: 'Protein', value: 25, color: '#EF4444' },
          { name: 'Carbs', value: 45, color: '#3B82F6' },
          { name: 'Fat', value: 30, color: '#F59E0B' },
        ],
        period: 'daily',
        insights: [
          'Protein intake: 125g (25%)',
          'Carbohydrate intake: 225g (45%)',
          'Fat intake: 67g (30%)'
        ],
        trend: 'stable',
        change: 0
      },
      {
        id: '3',
        title: 'Exercise Duration',
        type: 'bar',
        data: [
          { day: 'Mon', value: 45 },
          { day: 'Tue', value: 30 },
          { day: 'Wed', value: 60 },
          { day: 'Thu', value: 40 },
          { day: 'Fri', value: 50 },
          { day: 'Sat', value: 75 },
          { day: 'Sun', value: 35 },
        ],
        period: 'weekly',
        insights: [
          'Average exercise: 48 minutes/day',
          '15% increase from last week',
          'Consistent with fitness goals'
        ],
        trend: 'up',
        change: 15
      },
      {
        id: '4',
        title: 'Sleep Quality',
        type: 'area',
        data: [
          { date: '2024-11-01', value: 75 },
          { date: '2024-11-02', value: 80 },
          { date: '2024-11-03', value: 72 },
          { date: '2024-11-04', value: 85 },
          { date: '2024-11-05', value: 78 },
          { date: '2024-11-06', value: 82 },
          { date: '2024-11-07', value: 79 },
        ],
        period: 'weekly',
        insights: [
          'Average sleep quality: 79%',
          'Improving sleep patterns',
          'Consistent bedtime routine'
        ],
        trend: 'up',
        change: 8
      }
    ];

    // Generate health metrics
    const healthMetrics: HealthMetric[] = [
      {
        id: '1',
        name: 'Heart Rate',
        value: 72,
        unit: 'bpm',
        target: 70,
        progress: 95,
        trend: 'stable',
        color: '#EF4444',
        icon: 'heart-outline'
      },
      {
        id: '2',
        name: 'Blood Pressure',
        value: 120,
        unit: 'mmHg',
        target: 120,
        progress: 100,
        trend: 'stable',
        color: '#3B82F6',
        icon: 'pulse-outline'
      },
      {
        id: '3',
        name: 'Weight',
        value: 72,
        unit: 'kg',
        target: 70,
        progress: 85,
        trend: 'improving',
        color: '#10B981',
        icon: 'scale-outline'
      },
      {
        id: '4',
        name: 'Sleep Duration',
        value: 7.2,
        unit: 'hours',
        target: 8,
        progress: 90,
        trend: 'stable',
        color: '#8B5CF6',
        icon: 'moon-outline'
      },
      {
        id: '5',
        name: 'Steps',
        value: 8500,
        unit: 'steps',
        target: 10000,
        progress: 85,
        trend: 'improving',
        color: '#F59E0B',
        icon: 'walk-outline'
      },
      {
        id: '6',
        name: 'Water Intake',
        value: 2.1,
        unit: 'L',
        target: 2.5,
        progress: 84,
        trend: 'declining',
        color: '#06B6D4',
        icon: 'water-outline'
      }
    ];

    // Generate correlations
    const correlations: Correlation[] = [
      {
        id: '1',
        metric1: 'Sleep Quality',
        metric2: 'Energy Levels',
        correlation: 0.78,
        strength: 'strong',
        direction: 'positive',
        insights: [
          'Strong positive correlation (0.78)',
          'Better sleep quality leads to higher energy levels',
          'Improving sleep could boost energy by 15%'
        ]
      },
      {
        id: '2',
        metric1: 'Exercise Duration',
        metric2: 'Sleep Quality',
        correlation: 0.65,
        strength: 'moderate',
        direction: 'positive',
        insights: [
          'Moderate positive correlation (0.65)',
          'Regular exercise improves sleep quality',
          '30+ minutes of exercise recommended'
        ]
      },
      {
        id: '3',
        metric1: 'Calorie Intake',
        metric2: 'Weight',
        correlation: 0.82,
        strength: 'strong',
        direction: 'positive',
        insights: [
          'Strong positive correlation (0.82)',
          'Calorie intake directly affects weight',
          '500 calorie deficit needed for weight loss'
        ]
      },
      {
        id: '4',
        metric1: 'Stress Levels',
        metric2: 'Sleep Quality',
        correlation: -0.71,
        strength: 'strong',
        direction: 'negative',
        insights: [
          'Strong negative correlation (-0.71)',
          'Higher stress leads to poorer sleep',
          'Stress management improves sleep quality'
        ]
      },
      {
        id: '5',
        metric1: 'Protein Intake',
        metric2: 'Muscle Recovery',
        correlation: 0.68,
        strength: 'moderate',
        direction: 'positive',
        insights: [
          'Moderate positive correlation (0.68)',
          'Adequate protein supports muscle recovery',
          '1.6-2.2g protein per kg recommended'
        ]
      }
    ];

    return { charts, healthMetrics, correlations };
  };

  const processChartData = useCallback((rawData: any[], type: string) => {
    // Advanced data processing for different chart types
    if (type === 'line' || type === 'area') {
      return rawData.map((point, index) => ({
        ...point,
        value: typeof point.value === 'number' ? point.value : Math.random() * 100,
        timestamp: point.date || point.timestamp || new Date(Date.now() - (rawData.length - index) * 24 * 60 * 60 * 1000).toISOString()
      }));
    } else if (type === 'bar') {
      return rawData.map((point, index) => ({
        ...point,
        value: typeof point.value === 'number' ? point.value : Math.random() * 100,
        label: point.day || point.label || `Day ${index + 1}`
      }));
    } else if (type === 'pie') {
      return rawData.map((point, index) => ({
        ...point,
        value: typeof point.value === 'number' ? point.value : Math.random() * 100,
        percentage: ((point.value || 0) / rawData.reduce((sum, p) => sum + (p.value || 0), 0) * 100).toFixed(1)
      }));
    }
    return rawData;
  }, []);

  const calculateTrend = useCallback((data: any[]) => {
    if (data.length < 2) return 'stable';
    
    const values = data.map(d => d.value || 0).filter(v => typeof v === 'number');
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }, []);

  const generateInsights = useCallback((chart: ChartData) => {
    const insights: string[] = [];
    
    if (chart.data.length > 0) {
      const values = chart.data.map(d => d.value || 0).filter(v => typeof v === 'number');
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);
      
      insights.push(`Average value: ${avg.toFixed(1)}`);
      insights.push(`Range: ${min.toFixed(1)} - ${max.toFixed(1)}`);
      
      if (chart.trend === 'up') {
        insights.push('Improving trend detected');
      } else if (chart.trend === 'down') {
        insights.push('Declining trend detected');
      }
    }
    
    return insights;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check cache first if available
      if (isCacheLoaded) {
        const cacheKey = `data_visualization_${timeRange}`;
        const cachedData = await cache.getCachedApiResponse(cacheKey);
        if (cachedData && typeof cachedData === 'object') {
          console.log('Loading data visualization from cache');
          setCharts((cachedData as any).charts || []);
          setHealthMetrics((cachedData as any).healthMetrics || []);
          setCorrelations((cachedData as any).correlations || []);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
      }
      
      // Try to fetch real data from API first
      try {
        const [chartsData, healthMetricsData, correlationsData] = await Promise.all([
          api.premium.getDashboard(),
          api.wearable.getHealthData({ timeRange }),
          api.wearable.getCorrelationAnalysis({ timeRange })
        ]);
        
        // Transform API data to match component interface with advanced processing
        const transformedCharts = chartsData.charts?.map((chart: any) => {
          const processedData = processChartData(chart.data || [], chart.type || 'line');
          const insights = generateInsights({
            ...chart,
            data: processedData
          });
          
          return {
            id: chart.id || `chart-${Date.now()}`,
            title: chart.title || 'Chart',
            type: chart.type || 'line',
            data: processedData,
            period: chart.period || 'weekly',
            insights: insights || [],
            trend: calculateTrend(processedData),
            change: chart.change || 0
          };
        }) || [];

        const transformedHealthMetrics = healthMetricsData.metrics?.map((metric: any) => ({
          id: metric.id || `metric-${Date.now()}`,
          name: metric.name || 'Metric',
          value: metric.value || 0,
          unit: metric.unit || '',
          target: metric.target || 100,
          progress: metric.progress || 0,
          trend: metric.trend || 'stable',
          color: metric.color || '#3B82F6',
          icon: metric.icon || 'analytics-outline'
        })) || [];

        const transformedCorrelations = correlationsData.correlations?.map((correlation: any) => ({
          id: correlation.id || `correlation-${Date.now()}`,
          metric1: correlation.metric1 || 'Metric 1',
          metric2: correlation.metric2 || 'Metric 2',
          correlation: correlation.correlation || 0,
          strength: correlation.strength || 'moderate',
          direction: correlation.direction || 'positive',
          insights: correlation.insights || []
        })) || [];
        
        const visualizationData = {
          charts: transformedCharts,
          healthMetrics: transformedHealthMetrics,
          correlations: transformedCorrelations,
          timestamp: Date.now()
        };
        
        // Cache the data
        const cacheKey = `data_visualization_${timeRange}`;
        await cache.cacheApiResponse(cacheKey, visualizationData, 15 * 60 * 1000); // 15 minutes TTL
        
        setCharts(transformedCharts);
        setHealthMetrics(transformedHealthMetrics);
        setCorrelations(transformedCorrelations);
        
        // Trigger chart animation
        Animated.timing(chartAnimation, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
        
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        
        // Try to load from cache as fallback
        if (isCacheLoaded) {
          const cacheKey = `data_visualization_${timeRange}`;
          const cachedData = await cache.getCachedApiResponse(cacheKey);
          if (cachedData && typeof cachedData === 'object') {
            console.log('Loading data visualization from cache after API error');
            setCharts((cachedData as any).charts || []);
            setHealthMetrics((cachedData as any).healthMetrics || []);
            setCorrelations((cachedData as any).correlations || []);
            setIsLoading(false);
            setIsRefreshing(false);
            return;
          }
        }
        
        // Fallback to mock data if API fails
        const mockData = generateMockData();
        setCharts(mockData.charts);
        setHealthMetrics(mockData.healthMetrics);
        setCorrelations(mockData.correlations);
        
        // Cache mock data for offline use
        const cacheKey = `data_visualization_${timeRange}`;
        await cache.cacheApiResponse(cacheKey, mockData, 30 * 60 * 1000); // 30 minutes TTL
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Track API error
      await analyticsService.trackEvent({
        id: `data_visualization_api_error_${Date.now()}`,
        userId: user?.id?.toString() || 'anonymous',
        type: 'api_error',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
          dataType: 'data_visualization'
        },
        timestamp: new Date().toISOString()
      });
      
      Alert.alert('Error', 'Failed to load data. Please try again.');
      
      // Fallback to mock data if API fails
      const mockData = generateMockData();
      setCharts(mockData.charts);
      setHealthMetrics(mockData.healthMetrics);
      setCorrelations(mockData.correlations);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, processChartData, calculateTrend, generateInsights, chartAnimation, isCacheLoaded, cache]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Clear cache before refreshing to get fresh data
    const cacheKey = `data_visualization_${timeRange}`;
    await cache.removeCachedData(cacheKey);
    await fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up-outline';
      case 'down':
        return 'trending-down-outline';
      default:
        return 'trending-stable-outline';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return '#10B981';
      case 'down':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'Improving';
      case 'down':
        return 'Declining';
      default:
        return 'Stable';
    }
  };

  const getCorrelationStrength = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'Strong';
      case 'moderate':
        return 'Moderate';
      case 'weak':
        return 'Weak';
      default:
        return strength;
    }
  };

  const getCorrelationDirection = (direction: string) => {
    switch (direction) {
      case 'positive':
        return 'Positive';
      case 'negative':
        return 'Negative';
      default:
        return direction;
    }
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line':
        return 'bar-chart-outline';
      case 'bar':
        return 'bar-chart-outline';
      case 'pie':
        return 'pie-chart-outline';
      case 'area':
        return 'bar-chart-outline';
      case 'scatter':
        return 'bar-chart-outline';
      default:
        return 'bar-chart-outline';
    }
  };

  const renderAdvancedFilters = () => (
    <View style={[styles.advancedFilters, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.advancedFiltersHeader}
        onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
      >
        <Text style={[styles.advancedFiltersTitle, { color: colors.text }]}>
          Advanced Filters
        </Text>
        <Ionicons
          name={showAdvancedFilters ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={20}
          color={colors.primary}
        />
      </TouchableOpacity>
      
      {showAdvancedFilters && (
        <Animated.View style={styles.advancedFiltersContent}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              Metric Type
            </Text>
            <View style={styles.filterOptions}>
              {['All', 'Health', 'Fitness', 'Nutrition'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterOption,
                    selectedMetric === option && [styles.filterOptionActive, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => setSelectedMetric(option === 'All' ? null : option)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedMetric === option && { color: 'white' }
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              Data Quality
            </Text>
            <View style={styles.filterOptions}>
              {['High', 'Medium', 'Low'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.filterOption}
                  onPress={() => Alert.alert('Filter', `Filter by ${option} quality`)}
                >
                  <Text style={styles.filterOptionText}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );

  const renderChartVisualization = (chart: ChartData) => {
    const chartStyle = {
      transform: [
        {
          scale: chartAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View style={[styles.chartVisualization, chartStyle]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {chart.title}
          </Text>
          <View style={styles.chartMeta}>
            <View style={styles.chartTrend}>
              <Ionicons
                name={getTrendIcon(chart.trend) as any}
                size={14}
                color={getTrendColor(chart.trend)}
              />
              <Text style={[styles.trendText, { color: getTrendColor(chart.trend) }]}>
                {chart.change > 0 ? '+' : ''}{chart.change}%
              </Text>
            </View>
            <Text style={[styles.chartPeriod, { color: colors.gray }]}>
              {chart.period}
            </Text>
          </View>
        </View>
        
        <View style={styles.chartContent}>
          {chart.type === 'line' && (
            <View style={styles.lineChart}>
              <View style={styles.chartGrid}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <View key={i} style={styles.gridLine}>
                    <View style={[styles.gridLineHorizontal, { top: `${i * 25}%` }]} />
                  </View>
                ))}
              </View>
              <View style={styles.lineChartContent}>
                {chart.data.map((point, index) => (
                  <View key={index} style={styles.dataPoint}>
                    <View
                      style={[
                        styles.point,
                        {
                          backgroundColor: colors.primary,
                          left: `${(index / (chart.data.length - 1)) * 100}%`,
                          top: `${100 - (point.value / Math.max(...chart.data.map(d => d.value))) * 100}%`
                        }
                      ]}
                    />
                    {index < chart.data.length - 1 && (
                      <View
                        style={[
                          styles.lineSegment,
                          {
                            backgroundColor: colors.primary,
                            left: `${(index / (chart.data.length - 1)) * 100}%`,
                            top: `${100 - (point.value / Math.max(...chart.data.map(d => d.value))) * 100}%`,
                            width: `${100 / (chart.data.length - 1)}%`,
                            height: 2
                          }
                        ]}
                      />
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {chart.type === 'bar' && (
            <View style={styles.barChart}>
              {chart.data.map((point, index) => (
                <View key={index} style={styles.barItem}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: colors.primary,
                        height: `${(point.value / Math.max(...chart.data.map(d => d.value))) * 100}%`
                      }
                    ]}
                  />
                  <Text style={[styles.barLabel, { color: colors.gray }]}>
                    {point.day || `D${index + 1}`}
                  </Text>
                </View>
              ))}
            </View>
          )}
          
          {chart.type === 'pie' && (
            <View style={styles.pieChart}>
              {chart.data.map((point, index) => (
                <View key={index} style={styles.pieSegment}>
                  <View
                    style={[
                      styles.pieSlice,
                      {
                        backgroundColor: point.color || colors.primary,
                        transform: `rotate(${(index / chart.data.length) * 360}deg)`
                      }
                    ]}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  const renderOverview = () => (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={fetchData} />
      }
    >
      {/* Advanced Filters */}
      {renderAdvancedFilters()}
      
      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={[styles.timeRangeTitle, { color: colors.text }]}>
          Time Range
        </Text>
        <View style={styles.timeRangeButtons}>
          {['7d', '30d', '90d', '1y'].map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.timeRangeButton,
                timeRange === range && [styles.timeRangeButtonActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setTimeRange(range as any)}
            >
              <Text style={[
                styles.timeRangeButtonText,
                timeRange === range && { color: 'white' }
              ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Key Metrics */}
      <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.metricsTitle, { color: colors.text }]}>
          Key Health Metrics
        </Text>
        
        <View style={styles.metricsGrid}>
          {healthMetrics.slice(0, 6).map(metric => (
            <View key={metric.id} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: metric.color + '20' }]}>
                <Ionicons name={metric.icon as any} size={20} color={metric.color} />
              </View>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {metric.value}{metric.unit}
              </Text>
              <Text style={[styles.metricName, { color: colors.gray }]}>
                {metric.name}
              </Text>
              <View style={styles.metricProgress}>
                <View style={[styles.progressTrack, { backgroundColor: colors.lightGray }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: metric.color,
                        width: `${metric.progress}%`,
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.gray }]}>
                  {metric.progress}%
                </Text>
              </View>
              <View style={styles.metricTrend}>
                <Ionicons 
                  name={getTrendIcon(metric.trend) as any} 
                  size={14} 
                  color={getTrendColor(metric.trend)} 
                />
                <Text style={[styles.trendText, { color: getTrendColor(metric.trend) }]}>
                  {getTrendText(metric.trend)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Charts */}
      <View style={[styles.chartsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.chartsTitle, { color: colors.text }]}>
          Recent Charts
        </Text>
        
        <View style={styles.chartsList}>
          {charts.slice(0, 3).map(chart => (
            <TouchableOpacity
              key={chart.id}
              style={styles.chartItem}
              onPress={() => {
                setSelectedChart(chart);
                setShowChartModal(true);
              }}
            >
              <View style={[styles.chartIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={getChartIcon(chart.type) as any} size={24} color={colors.primary} />
              </View>
              <View style={styles.chartInfo}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {chart.title}
                </Text>
                <View style={styles.chartMeta}>
                  <View style={styles.chartTrend}>
                    <Ionicons 
                      name={getTrendIcon(chart.trend) as any} 
                      size={14} 
                      color={getTrendColor(chart.trend)} 
                    />
                    <Text style={[styles.trendText, { color: getTrendColor(chart.trend) }]}>
                      {chart.change > 0 ? '+' : ''}{chart.change}%
                    </Text>
                  </View>
                  <Text style={[styles.chartPeriod, { color: colors.gray }]}>
                    {chart.period}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Top Insights */}
      <View style={[styles.insightsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.insightsTitle, { color: colors.text }]}>
          Top Insights
        </Text>
        
        <View style={styles.insightsList}>
          {charts.flatMap(chart => chart.insights).slice(0, 5).map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.insightText, { color: colors.text }]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderChartsTab = () => (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={charts}
          renderItem={({ item }) => (
            <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.chartCardHeader}>
                <View style={styles.chartCardInfo}>
                  <Text style={[styles.chartCardTitle, { color: colors.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.chartCardPeriod, { color: colors.gray }]}>
                    {item.period}
                  </Text>
                </View>
                <View style={styles.chartCardActions}>
                  <TouchableOpacity
                    style={[styles.chartAction, { backgroundColor: colors.primary + '20' }]}
                    onPress={() => {
                      setSelectedChart(item);
                      setShowChartModal(true);
                    }}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chartAction, { backgroundColor: '#6366F120' }]}
                    onPress={() => Alert.alert('Export', 'Export chart functionality')}
                  >
                    <Ionicons name="share-outline" size={16} color="#6366F1" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.chartCardContent}>
                {renderChartVisualization(item)}
              </View>
              
              <View style={styles.chartCardInsights}>
                <Text style={[styles.insightsTitle, { color: colors.text, fontSize: 14 }]}>
                  Key Insights:
                </Text>
                {item.insights.slice(0, 2).map((insight, index) => (
                  <Text key={index} style={[styles.insightText, { color: colors.text, fontSize: 12 }]}>
                    • {insight}
                  </Text>
                ))}
              </View>
              
              <View style={styles.chartCardFooter}>
                <View style={styles.chartTrend}>
                  <Ionicons
                    name={getTrendIcon(item.trend) as any}
                    size={14}
                    color={getTrendColor(item.trend)}
                  />
                  <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
                    {item.change > 0 ? '+' : ''}{item.change}% from last period
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.viewChartButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setSelectedChart(item);
                    setShowChartModal(true);
                  }}
                >
                  <Text style={styles.viewChartButtonText}>
                    View Chart
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderMetricsTab = () => (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={healthMetrics}
          renderItem={({ item }) => (
            <View style={[styles.metricDetailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.metricDetailHeader}>
                <View style={[styles.metricDetailIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.metricDetailInfo}>
                  <Text style={[styles.metricDetailName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.metricDetailValue, { color: colors.text }]}>
                    {item.value} {item.unit}
                  </Text>
                </View>
                <View style={styles.metricDetailTrend}>
                  <Ionicons 
                    name={getTrendIcon(item.trend) as any} 
                    size={16} 
                    color={getTrendColor(item.trend)} 
                  />
                  <Text style={[styles.trendText, { color: getTrendColor(item.trend) }]}>
                    {getTrendText(item.trend)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metricDetailProgress}>
                <View style={styles.progressInfo}>
                  <Text style={[styles.progressLabel, { color: colors.gray }]}>
                    Progress to Target
                  </Text>
                  <Text style={[styles.progressValue, { color: colors.text }]}>
                    {item.progress}%
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.lightGray }]}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: item.color,
                        width: `${item.progress}%`,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressTarget}>
                  <Text style={[styles.targetLabel, { color: colors.gray }]}>
                    Target: {item.target} {item.unit}
                  </Text>
                </View>
              </View>
              
              <View style={styles.metricDetailActions}>
                <TouchableOpacity
                  style={[styles.metricAction, { backgroundColor: colors.primary + '20' }]}
                  onPress={() => Alert.alert('History', 'View historical data')}
                >
                  <Text style={[styles.metricActionText, { color: colors.primary }]}>
                    View History
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.metricAction, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('Set Target', 'Update target value')}
                >
                  <Text style={[styles.metricActionText, { color: '#6366F1' }]}>
                    Set Target
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  const renderCorrelationsTab = () => (
    <View style={styles.tabContent}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={correlations}
          renderItem={({ item }) => (
            <View style={[styles.correlationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.correlationHeader}>
                <View style={styles.correlationMetrics}>
                  <Text style={[styles.correlationMetric1, { color: colors.text }]}>
                    {item.metric1}
                  </Text>
                  <View style={styles.correlationArrow}>
                    <Ionicons name="arrow-forward-outline" size={16} color={colors.gray} />
                  </View>
                  <Text style={[styles.correlationMetric2, { color: colors.text }]}>
                    {item.metric2}
                  </Text>
                </View>
                
                <View style={styles.correlationStats}>
                  <View style={[styles.correlationValue, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.correlationNumber, { color: colors.primary }]}>
                      {item.correlation}
                    </Text>
                  </View>
                  <View style={styles.correlationDetails}>
                    <Text style={[styles.correlationStrengthText, { color: colors.text }]}>
                      {getCorrelationStrength(item.strength)}
                    </Text>
                    <Text style={[styles.correlationDirectionText, { color: colors.gray }]}>
                      {getCorrelationDirection(item.direction)}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.correlationVisualization}>
                <View style={styles.correlationBar}>
                  <View 
                    style={[
                      styles.correlationFill, 
                      { 
                        backgroundColor: item.direction === 'positive' ? '#10B981' : '#EF4444',
                        width: `${Math.abs(item.correlation) * 100}%`,
                      }
                    ]} 
                  />
                </View>
                <View style={styles.correlationScale}>
                  <Text style={[styles.scaleText, { color: colors.gray }]}>0</Text>
                  <Text style={[styles.scaleText, { color: colors.gray }]}>0.5</Text>
                  <Text style={[styles.scaleText, { color: colors.gray }]}>1.0</Text>
                </View>
              </View>
              
              <View style={styles.correlationInsights}>
                <Text style={[styles.insightsTitle, { color: colors.text, fontSize: 14 }]}>
                  Insights:
                </Text>
                {item.insights.map((insight, index) => (
                  <Text key={index} style={[styles.insightText, { color: colors.text, fontSize: 12 }]}>
                    • {insight}
                  </Text>
                ))}
              </View>
              
              <View style={styles.correlationActions}>
                <TouchableOpacity
                  style={[styles.correlationAction, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Details', 'View detailed correlation analysis')}
                >
                  <Text style={styles.correlationActionText}>
                    View Analysis
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.correlationAction, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('Export', 'Export correlation data')}
                >
                  <Text style={[styles.correlationActionText, { color: '#6366F1' }]}>
                    Export Data
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {i18n.t('premium.dataVisualization')}
        </Text>
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
      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'charts' && renderChartsTab()}
      {selectedTab === 'metrics' && renderMetricsTab()}
      {selectedTab === 'correlations' && renderCorrelationsTab()}

      {/* Chart Modal */}
      {selectedChart && (
        <Modal
          visible={showChartModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowChartModal(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedChart.title}
              </Text>
              <TouchableOpacity onPress={() => setShowChartModal(false)}>
                <Ionicons name="close-outline" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.chartModalInfo}>
                <View style={styles.chartMeta}>
                  <Text style={[styles.chartPeriod, { color: colors.gray }]}>
                    {selectedChart.period}
                  </Text>
                  <View style={styles.chartTrend}>
                    <Ionicons 
                      name={getTrendIcon(selectedChart.trend) as any} 
                      size={14} 
                      color={getTrendColor(selectedChart.trend)} 
                    />
                    <Text style={[styles.trendText, { color: getTrendColor(selectedChart.trend) }]}>
                      {selectedChart.change > 0 ? '+' : ''}{selectedChart.change}%
                    </Text>
                  </View>
                </View>
                
                <View style={styles.chartPlaceholder}>
                  <Ionicons name={getChartIcon(selectedChart.type) as any} size={64} color={colors.primary} />
                  <Text style={[styles.chartPlaceholderText, { color: colors.gray }]}>
                    Interactive {selectedChart.type.charAt(0).toUpperCase() + selectedChart.type.slice(1)} Chart
                  </Text>
                </View>
              </View>
              
              <View style={styles.chartModalInsights}>
                <Text style={[styles.insightsTitle, { color: colors.text }]}>
                  Key Insights
                </Text>
                {selectedChart.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={[styles.insightText, { color: colors.text }]}>
                      {insight}
                    </Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.chartModalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => Alert.alert('Export', 'Export chart functionality')}
                >
                  <Text style={styles.modalButtonText}>
                    Export Chart
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#6366F120' }]}
                  onPress={() => Alert.alert('Share', 'Share chart functionality')}
                >
                  <Text style={[styles.modalButtonText, { color: '#6366F1' }]}>
                    Share Chart
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

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
  tabContent: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  timeRangeContainer: {
    marginBottom: 16,
  },
  timeRangeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  timeRangeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  timeRangeButtonActive: {
    backgroundColor: '#4F46E5',
  },
  timeRangeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    fontFamily: 'Inter-SemiBold',
  },
  metricsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  metricsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '33.33%',
    alignItems: 'center',
    padding: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  metricName: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  metricProgress: {
    width: '100%',
    marginBottom: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    textAlign: 'right',
    marginTop: 2,
  },
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginLeft: 4,
  },
  chartsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  chartsList: {
    gap: 12,
  },
  chartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  chartIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chartInfo: {
    flex: 1,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  chartMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginRight: 8,
  },
  chartTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    flex: 1,
  },
  chartCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartCardInfo: {
    flex: 1,
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  chartCardPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  chartCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chartAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCardContent: {
    marginBottom: 12,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  chartCardInsights: {
    marginBottom: 12,
  },
  chartCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Advanced Filters Styles
  advancedFilters: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  advancedFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  advancedFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  advancedFiltersContent: {
    gap: 16,
  },
  filterRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  filterOptionActive: {
    backgroundColor: '#4F46E5',
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  // Chart Visualization Styles
  chartVisualization: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chartContent: {
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  // Line Chart Styles
  lineChart: {
    flex: 1,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  lineChartContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  point: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lineSegment: {
    position: 'absolute',
    height: 2,
  },
  // Bar Chart Styles
  barChart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    padding: 16,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  // Pie Chart Styles
  pieChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  pieSegment: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 75,
  },
  viewChartButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewChartButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  metricDetailCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  metricDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricDetailInfo: {
    flex: 1,
  },
  metricDetailName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  metricDetailValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  metricDetailTrend: {
    alignItems: 'center',
  },
  metricDetailProgress: {
    marginBottom: 16,
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
  progressTarget: {
    marginTop: 4,
  },
  targetLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  metricDetailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricAction: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricActionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  correlationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  correlationHeader: {
    marginBottom: 16,
  },
  correlationMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  correlationMetric1: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  correlationArrow: {
    marginHorizontal: 8,
  },
  correlationMetric2: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  correlationStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correlationValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  correlationNumber: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  correlationDetails: {
    flex: 1,
  },
  correlationStrengthText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  correlationDirectionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  correlationVisualization: {
    marginBottom: 16,
  },
  correlationBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  correlationFill: {
    height: '100%',
    borderRadius: 4,
  },
  correlationScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleText: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
  },
  correlationInsights: {
    marginBottom: 16,
  },
  correlationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  correlationAction: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  correlationActionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
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
  modalFooter: {
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Inter-SemiBold',
  },
  chartModalInfo: {
    marginBottom: 20,
  },
  chartModalInsights: {
    marginBottom: 20,
  },
  chartModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});