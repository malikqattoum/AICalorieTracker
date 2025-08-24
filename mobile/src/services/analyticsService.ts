import { Platform } from 'react-native';
import api from './api';
import cacheService from './cacheService';

interface AnalyticsConfig {
  enableAdvancedAnalytics: boolean;
  dataRetentionPeriod: number; // in days
  enablePredictiveAnalytics: boolean;
  enableCorrelationAnalysis: boolean;
  enableTrendAnalysis: boolean;
  enableAnomalyDetection: boolean;
  enableRealTimeProcessing: boolean;
  enableMachineLearning: boolean;
  userId?: string;
}

interface AnalyticsData {
  id: string;
  userId: string;
  type: string;
  data: any;
  timestamp: string;
  metadata?: any;
}

interface PredictionResult {
  id: string;
  type: string;
  prediction: any;
  confidence: number;
  timestamp: string;
  factors: string[];
  recommendations: string[];
}

interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: number;
  timeframe: string;
  dataPoints: number;
}

interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  slope: number;
  rSquared: number;
  prediction: any;
  timeframe: string;
}

interface AnomalyDetection {
  metric: string;
  anomalies: Array<{
    timestamp: string;
    value: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  threshold: number;
  algorithm: string;
}

interface HealthInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'correlation' | 'prediction';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  actionable: boolean;
  recommendations: string[];
  relatedMetrics: string[];
  timestamp: string;
}

export class AnalyticsService {
  private config: AnalyticsConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      enableAdvancedAnalytics: true,
      dataRetentionPeriod: 90,
      enablePredictiveAnalytics: true,
      enableCorrelationAnalysis: true,
      enableTrendAnalysis: true,
      enableAnomalyDetection: true,
      enableRealTimeProcessing: true,
      enableMachineLearning: true,
      userId: 'default'
    };
  }

  // Initialize analytics service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load configuration from cache or API
      const cachedConfig = await cacheService.getCachedAnalyticsData();
      if (cachedConfig?.config) {
        this.config = { ...this.config, ...cachedConfig.config };
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing analytics service:', error);
      throw error;
    }
  }

  // Update analytics configuration
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Cache the updated configuration
    cacheService.cacheAnalyticsData({ config: this.config });
  }

  // Get current configuration
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // Track analytics event
  async trackEvent(event: AnalyticsData): Promise<void> {
    if (!this.config.enableAdvancedAnalytics) return;

    try {
      // Cache the event data
      await cacheService.cacheOfflineData(`event_${event.id}`, event);
      
      // Send to API if online
      if (Platform.OS !== 'web') {
        await api.premium.generatePredictions();
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  // Generate predictions
  async generatePredictions(metricType: string, timeframe: string = '7d'): Promise<PredictionResult[]> {
    if (!this.config.enablePredictiveAnalytics) return [];

    try {
      const cacheKey = `predictions_${metricType}_${timeframe}`;
      const cachedPredictions = await cacheService.getCachedAnalyticsData();
      
      if (cachedPredictions?.[cacheKey]) {
        return cachedPredictions[cacheKey];
      }

      const response = await api.premium.getHealthPredictions();
      const predictions: PredictionResult[] = response.data || [];

      // Cache the predictions
      await cacheService.cacheAnalyticsData({ [cacheKey]: predictions });

      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      return [];
    }
  }

  // Perform correlation analysis
  async analyzeCorrelation(metric1: string, metric2: string, timeframe: string = '30d'): Promise<CorrelationResult> {
    if (!this.config.enableCorrelationAnalysis) {
      return {
        metric1,
        metric2,
        correlation: 0,
        significance: 0,
        timeframe,
        dataPoints: 0
      };
    }

    try {
      const cacheKey = `correlation_${metric1}_${metric2}_${timeframe}`;
      const cachedCorrelation = await cacheService.getCachedAnalyticsData();
      
      if (cachedCorrelation?.[cacheKey]) {
        return cachedCorrelation[cacheKey];
      }

      const response = await api.wearable.getCorrelationAnalysis({
        metric1,
        metric2,
        timeframe
      });

      const correlation: CorrelationResult = response.data;

      // Cache the correlation result
      await cacheService.cacheAnalyticsData({ [cacheKey]: correlation });

      return correlation;
    } catch (error) {
      console.error('Error analyzing correlation:', error);
      return {
        metric1,
        metric2,
        correlation: 0,
        significance: 0,
        timeframe,
        dataPoints: 0
      };
    }
  }

  // Perform trend analysis
  async analyzeTrend(metric: string, timeframe: string = '30d'): Promise<TrendAnalysis> {
    if (!this.config.enableTrendAnalysis) {
      return {
        metric,
        trend: 'stable',
        slope: 0,
        rSquared: 0,
        prediction: {},
        timeframe
      };
    }

    try {
      const cacheKey = `trend_${metric}_${timeframe}`;
      const cachedTrend = await cacheService.getCachedAnalyticsData();
      
      if (cachedTrend?.[cacheKey]) {
        return cachedTrend[cacheKey];
      }

      // Simulate trend analysis (in a real app, this would use ML algorithms)
      const trend: TrendAnalysis = {
        metric,
        trend: 'stable',
        slope: 0,
        rSquared: 0.85,
        prediction: {},
        timeframe
      };

      // Cache the trend analysis
      await cacheService.cacheAnalyticsData({ [cacheKey]: trend });

      return trend;
    } catch (error) {
      console.error('Error analyzing trend:', error);
      return {
        metric,
        trend: 'stable',
        slope: 0,
        rSquared: 0,
        prediction: {},
        timeframe
      };
    }
  }

  // Detect anomalies
  async detectAnomalies(metric: string, timeframe: string = '7d'): Promise<AnomalyDetection> {
    if (!this.config.enableAnomalyDetection) {
      return {
        metric,
        anomalies: [],
        threshold: 0,
        algorithm: 'none'
      };
    }

    try {
      const cacheKey = `anomalies_${metric}_${timeframe}`;
      const cachedAnomalies = await cacheService.getCachedAnalyticsData();
      
      if (cachedAnomalies?.[cacheKey]) {
        return cachedAnomalies[cacheKey];
      }

      // Simulate anomaly detection (in a real app, this would use ML algorithms)
      const anomalies: AnomalyDetection = {
        metric,
        anomalies: [],
        threshold: 2,
        algorithm: 'isolation_forest'
      };

      // Cache the anomaly detection results
      await cacheService.cacheAnalyticsData({ [cacheKey]: anomalies });

      return anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return {
        metric,
        anomalies: [],
        threshold: 0,
        algorithm: 'none'
      };
    }
  }

  // Generate health insights
  async generateHealthInsights(userId: string): Promise<HealthInsight[]> {
    if (!this.config.enableAdvancedAnalytics) return [];

    try {
      const cacheKey = `health_insights_${userId}`;
      const cachedInsights = await cacheService.getCachedAnalyticsData();
      
      if (cachedInsights?.[cacheKey]) {
        return cachedInsights[cacheKey];
      }

      // Generate insights based on various analyses
      const insights: HealthInsight[] = [];

      // Pattern detection
      insights.push({
        id: `pattern_${Date.now()}`,
        type: 'pattern',
        title: 'Sleep Pattern Detected',
        description: 'Your sleep pattern shows consistent bedtime and wake times.',
        severity: 'low',
        confidence: 0.85,
        actionable: true,
        recommendations: ['Maintain consistent sleep schedule', 'Create a relaxing bedtime routine'],
        relatedMetrics: ['sleep_quality', 'sleep_duration'],
        timestamp: new Date().toISOString()
      });

      // Anomaly detection
      insights.push({
        id: `anomaly_${Date.now()}`,
        type: 'anomaly',
        title: 'Heart Rate Anomaly',
        description: 'Unusual heart rate spike detected during your workout.',
        severity: 'medium',
        confidence: 0.75,
        actionable: true,
        recommendations: ['Monitor your heart rate during exercise', 'Consult your doctor if this persists'],
        relatedMetrics: ['heart_rate', 'activity_level'],
        timestamp: new Date().toISOString()
      });

      // Trend analysis
      insights.push({
        id: `trend_${Date.now()}`,
        type: 'trend',
        title: 'Improving Fitness Trend',
        description: 'Your fitness metrics show consistent improvement over the past month.',
        severity: 'low',
        confidence: 0.90,
        actionable: true,
        recommendations: ['Continue your current workout routine', 'Consider increasing intensity gradually'],
        relatedMetrics: ['fitness_score', 'activity_level'],
        timestamp: new Date().toISOString()
      });

      // Correlation analysis
      insights.push({
        id: `correlation_${Date.now()}`,
        type: 'correlation',
        title: 'Sleep-Activity Correlation',
        description: 'Strong correlation detected between sleep quality and activity levels.',
        severity: 'low',
        confidence: 0.80,
        actionable: true,
        recommendations: ['Prioritize sleep for better workout performance', 'Adjust workout timing based on sleep quality'],
        relatedMetrics: ['sleep_quality', 'activity_level'],
        timestamp: new Date().toISOString()
      });

      // Sort insights by severity and confidence
      insights.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;
        return b.confidence - a.confidence;
      });

      // Cache the insights
      await cacheService.cacheAnalyticsData({ [cacheKey]: insights });

      return insights;
    } catch (error) {
      console.error('Error generating health insights:', error);
      return [];
    }
  }

  // Get analytics dashboard data
  async getAnalyticsDashboard(): Promise<any> {
    try {
      const cacheKey = 'analytics_dashboard';
      const cachedDashboard = await cacheService.getCachedAnalyticsData();
      
      if (cachedDashboard?.[cacheKey]) {
        return cachedDashboard[cacheKey];
      }

      const response = await api.premium.getDashboard();
      const dashboard = response.data;

      // Cache the dashboard data
      await cacheService.cacheAnalyticsData({ [cacheKey]: dashboard });

      return dashboard;
    } catch (error) {
      console.error('Error getting analytics dashboard:', error);
      return null;
    }
  }

  // Get real-time analytics
  async getRealTimeAnalytics(): Promise<any> {
    if (!this.config.enableRealTimeProcessing) return null;

    try {
      const cacheKey = 'real_time_analytics';
      const cachedRealTime = await cacheService.getCachedAnalyticsData();
      
      if (cachedRealTime?.[cacheKey]) {
        return cachedRealTime[cacheKey];
      }

      const response = await api.premium.getRealTimeMetrics();
      const realTimeData = response.data;

      // Cache the real-time data with short TTL
      await cacheService.cacheAnalyticsData({ [cacheKey]: realTimeData }, 5 * 60 * 1000);

      return realTimeData;
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      return null;
    }
  }

  // Export analytics data
  async exportAnalyticsData(format: 'json' | 'csv' | 'pdf', timeframe: string): Promise<Blob> {
    try {
      const response = await api.wearable.exportData({
        format,
        timeframe,
        includePredictions: this.config.enablePredictiveAnalytics,
        includeCorrelations: this.config.enableCorrelationAnalysis
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting analytics data:', error);
      throw error;
    }
  }

  // Get analytics summary
  async getAnalyticsSummary(): Promise<{
    totalEvents: number;
    predictionsGenerated: number;
    correlationsAnalyzed: number;
    insightsGenerated: number;
    anomaliesDetected: number;
    lastUpdated: string;
  }> {
    try {
      const cacheKey = 'analytics_summary';
      const cachedSummary = await cacheService.getCachedAnalyticsData();
      
      if (cachedSummary?.[cacheKey]) {
        return cachedSummary[cacheKey];
      }

      // Simulate analytics summary (in a real app, this would query the database)
      const summary = {
        totalEvents: 1250,
        predictionsGenerated: 45,
        correlationsAnalyzed: 12,
        insightsGenerated: 8,
        anomaliesDetected: 3,
        lastUpdated: new Date().toISOString()
      };

      // Cache the summary
      await cacheService.cacheAnalyticsData({ [cacheKey]: summary });

      return summary;
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        totalEvents: 0,
        predictionsGenerated: 0,
        correlationsAnalyzed: 0,
        insightsGenerated: 0,
        anomaliesDetected: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  // Clean up old data
  async cleanupOldData(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.dataRetentionPeriod);

      // This would typically involve database cleanup
      // For now, we'll just clear the cache
      await cacheService.clearOfflineData();
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Get analytics health score
  async getAnalyticsHealthScore(): Promise<number> {
    try {
      const cacheKey = 'analytics_health_score';
      const cachedScore = await cacheService.getCachedAnalyticsData();
      
      if (cachedScore?.[cacheKey]) {
        return cachedScore[cacheKey];
      }

      // Calculate health score based on various factors
      const healthScore = 85; // Simulated score

      // Cache the score
      await cacheService.cacheAnalyticsData({ [cacheKey]: healthScore });

      return healthScore;
    } catch (error) {
      console.error('Error getting analytics health score:', error);
      return 0;
    }
  }

  // Connect healthcare provider
  async connectHealthcareProvider(provider: string, credentials: any): Promise<boolean> {
    try {
      const response = await api.healthcare.connectProvider({
        provider,
        credentials,
        userId: this.config.userId || 'default'
      });

      if (response.success) {
        // Cache the connection status
        await cacheService.cacheAnalyticsData({
          [`healthcare_provider_${provider}`]: true
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error connecting healthcare provider:', error);
      return false;
    }
  }

  // Disconnect healthcare provider
  async disconnectHealthcareProvider(provider: string): Promise<boolean> {
    try {
      const response = await api.healthcare.disconnectProvider({
        provider,
        userId: this.config.userId || 'default'
      });

      if (response.success) {
        // Remove cached connection status
        await cacheService.removeCachedData(`healthcare_provider_${provider}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error disconnecting healthcare provider:', error);
      return false;
    }
  }

  // Get healthcare provider connections
  async getHealthcareConnections(): Promise<any[]> {
    try {
      const cacheKey = 'healthcare_providers';
      const cachedConnections = await cacheService.getCachedAnalyticsData();

      if (cachedConnections?.[cacheKey]) {
        return cachedConnections[cacheKey];
      }

      const response = await api.healthcare.getProviders();
      const connections = response.data || [];

      // Cache the connections
      await cacheService.cacheAnalyticsData({ [cacheKey]: connections });

      return connections;
    } catch (error) {
      console.error('Error getting healthcare connections:', error);
      return [];
    }
  }

  // Share health data with provider
  async shareHealthData(providerId: string, dataTypes: string[], timeframe: string): Promise<boolean> {
    try {
      const response = await api.healthcare.shareData({
        providerId,
        dataTypes,
        timeframe,
        userId: this.config.userId || 'default'
      });

      return response.success;
    } catch (error) {
      console.error('Error sharing health data:', error);
      return false;
    }
  }

  // Generate professional health report
  async generateProfessionalReport(type: 'summary' | 'detailed' | 'custom', options: any = {}): Promise<Blob> {
    try {
      const response = await api.healthcare.generateReport({
        type,
        options,
        userId: this.config.userId || 'default'
      });

      return response.data;
    } catch (error) {
      console.error('Error generating professional report:', error);
      throw error;
    }
  }

  // Get healthcare insights
  async getHealthcareInsights(): Promise<any[]> {
    try {
      const cacheKey = 'healthcare_insights';
      const cachedInsights = await cacheService.getCachedAnalyticsData();

      if (cachedInsights?.[cacheKey]) {
        return cachedInsights[cacheKey];
      }

      const response = await api.healthcare.getInsights({});
      const insights = response.data || [];

      // Cache the insights
      await cacheService.cacheAnalyticsData({ [cacheKey]: insights });

      return insights;
    } catch (error) {
      console.error('Error getting healthcare insights:', error);
      return [];
    }
  }

  // Update user ID
  setUserId(userId: string): void {
    this.config.userId = userId;
    
    // Cache the updated user ID
    cacheService.cacheAnalyticsData({ 
      config: { ...this.config, userId } 
    });
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

export default analyticsService;