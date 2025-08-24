import { 
  WearableDevice, 
  HealthMetric, 
  DeviceStatus, 
  DataSource,
  WearableError,
  WearableErrorCode,
  DeviceInfo,
  DeviceSettings,
  SyncResult,
  SyncStatus,
  HealthDataQuery,
  CorrelationAnalysis,
  CorrelationQuery,
  MetricType,
  DeviceType
} from '../types/wearable';

// Healthcare Provider Types
export type HealthcareProvider = 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'medtronic' | 'omron' | 'withings' | 'oura';

export interface HealthcareProviderConfig {
  id: string;
  name: string;
  type: HealthcareProvider;
  baseUrl: string;
  authEndpoint: string;
  scopes: string[];
  supportedMetrics: MetricType[];
  isPremium: boolean;
  subscriptionRequired: boolean;
}

export interface HealthcareConnection {
  id: string;
  userId: string;
  provider: HealthcareProvider;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  isActive: boolean;
  lastSyncAt?: Date;
  settings: DeviceSettings;
  metadata: Record<string, any>;
}

export interface HealthcareData {
  id: string;
  connectionId: string;
  metricType: MetricType;
  value: number;
  unit: string;
  timestamp: Date;
  recordedAt: Date;
  source: DataSource;
  confidence?: number;
  metadata?: Record<string, any>;
  provider: HealthcareProvider;
}

export interface HealthcareInsight {
  id: string;
  type: 'warning' | 'recommendation' | 'achievement' | 'alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metricType: MetricType;
  value: number;
  threshold?: number;
  recommendation?: string;
  createdAt: Date;
  acknowledged: boolean;
}

export interface HealthcareReport {
  id: string;
  userId: string;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalSteps: number;
    totalDistance: number;
    totalCalories: number;
    averageHeartRate: number;
    totalSleepDuration: number;
    currentWeight: number;
    currentBMI: number;
    totalWorkouts: number;
  };
  insights: HealthcareInsight[];
  trends: Record<string, any>;
  recommendations: string[];
  generatedAt: Date;
}

export class HealthcareService {
  private connections: Map<string, HealthcareConnection> = new Map();
  private providers: Map<HealthcareProvider, HealthcareProviderConfig> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize healthcare providers
   */
  private initializeProviders(): void {
    const providers: HealthcareProviderConfig[] = [
      {
        id: 'apple_health',
        name: 'Apple Health',
        type: 'apple_health',
        baseUrl: 'https://health.apple.com',
        authEndpoint: '/auth',
        scopes: ['health', 'fitness', 'workout'],
        supportedMetrics: [
          'steps', 'distance', 'calories_burned', 'heart_rate', 'sleep_duration',
          'sleep_quality', 'weight', 'body_fat', 'blood_pressure', 'blood_oxygen',
          'respiratory_rate', 'skin_temperature', 'heart_rate_variability'
        ],
        isPremium: false,
        subscriptionRequired: false
      },
      {
        id: 'google_fit',
        name: 'Google Fit',
        type: 'google_fit',
        baseUrl: 'https://www.googleapis.com',
        authEndpoint: '/oauth2/v4/token',
        scopes: ['fitness.activity.read', 'fitness.body.read', 'fitness.location.read'],
        supportedMetrics: [
          'steps', 'distance', 'calories_burned', 'heart_rate', 'activity_minutes',
          'weight', 'body_fat', 'blood_pressure', 'blood_oxygen'
        ],
        isPremium: false,
        subscriptionRequired: false
      },
      {
        id: 'fitbit',
        name: 'Fitbit',
        type: 'fitbit',
        baseUrl: 'https://api.fitbit.com',
        authEndpoint: '/oauth2/token',
        scopes: ['activity', 'heartrate', 'sleep', 'weight', 'food-log', 'profile'],
        supportedMetrics: [
          'steps', 'distance', 'calories_burned', 'heart_rate', 'sleep_duration',
          'sleep_quality', 'weight', 'body_fat', 'blood_pressure', 'blood_oxygen',
          'activity_minutes', 'resting_heart_rate'
        ],
        isPremium: true,
        subscriptionRequired: true
      },
      {
        id: 'garmin',
        name: 'Garmin',
        type: 'garmin',
        baseUrl: 'https://connect.garmin.com',
        authEndpoint: '/oauth2/token',
        scopes: ['user:read', 'user:write', 'activity:read', 'activity:write'],
        supportedMetrics: [
          'steps', 'distance', 'calories_burned', 'heart_rate', 'sleep_duration',
          'sleep_quality', 'weight', 'body_fat', 'blood_pressure', 'blood_oxygen',
          'activity_minutes', 'resting_heart_rate', 'vo2_max', 'fitness_age'
        ],
        isPremium: true,
        subscriptionRequired: true
      },
      {
        id: 'medtronic',
        name: 'Medtronic',
        type: 'medtronic',
        baseUrl: 'https://carelink.medtronic.com',
        authEndpoint: '/oauth2/token',
        scopes: ['glucose', 'insulin', 'activity'],
        supportedMetrics: [
          'blood_glucose', 'insulin_dose', 'carbohydrates', 'activity_minutes'
        ],
        isPremium: true,
        subscriptionRequired: true
      },
      {
        id: 'omron',
        name: 'Omron',
        type: 'omron',
        baseUrl: 'https://api.omronhealthcare.com',
        authEndpoint: '/oauth2/token',
        scopes: ['blood_pressure', 'heart_rate', 'weight'],
        supportedMetrics: [
          'blood_pressure', 'heart_rate', 'weight', 'body_fat'
        ],
        isPremium: false,
        subscriptionRequired: false
      },
      {
        id: 'withings',
        name: 'Withings',
        type: 'withings',
        baseUrl: 'https://wbsapi.withings.net',
        authEndpoint: '/oauth2/token',
        scopes: ['user', 'activity', 'sleep', 'weight', 'heart'],
        supportedMetrics: [
          'steps', 'distance', 'calories_burned', 'heart_rate', 'sleep_duration',
          'sleep_quality', 'weight', 'body_fat', 'blood_pressure', 'blood_oxygen',
          'activity_minutes', 'resting_heart_rate'
        ],
        isPremium: true,
        subscriptionRequired: true
      },
      {
        id: 'oura',
        name: 'Oura Ring',
        type: 'oura',
        baseUrl: 'https://api.ouraring.com',
        authEndpoint: '/oauth2/token',
        scopes: ['user', 'sleep', 'activity', 'heartrate'],
        supportedMetrics: [
          'sleep_duration', 'sleep_quality', 'heart_rate', 'resting_heart_rate',
          'blood_oxygen', 'activity_minutes', 'calories_burned'
        ],
        isPremium: true,
        subscriptionRequired: true
      }
    ];

    providers.forEach(provider => {
      this.providers.set(provider.type, provider);
    });
  }

  /**
   * Initialize healthcare service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load existing connections from storage
      await this.loadConnections();
      this.isInitialized = true;
      console.log('Healthcare service initialized successfully');
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.UNKNOWN_ERROR,
        message: 'Failed to initialize healthcare service',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get all available healthcare providers
   */
  getAvailableProviders(): HealthcareProviderConfig[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider by type
   */
  getProvider(type: HealthcareProvider): HealthcareProviderConfig | undefined {
    return this.providers.get(type);
  }

  /**
   * Connect to a healthcare provider
   */
  async connectProvider(
    providerType: HealthcareProvider,
    authCode: string,
    userId: string
  ): Promise<HealthcareConnection> {
    try {
      const provider = this.getProvider(providerType);
      if (!provider) {
        throw new WearableError({
          code: WearableErrorCode.AUTH_FAILED,
          message: `Provider ${providerType} not found`,
          timestamp: new Date()
        });
      }

      // Exchange auth code for access token
      const tokens = await this.exchangeAuthCode(provider, authCode);
      
      // Create connection
      const connection: HealthcareConnection = {
        id: `conn_${Date.now()}`,
        userId,
        provider: providerType,
        providerId: `provider_${Date.now()}`,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: provider.scopes,
        isActive: true,
        settings: {
          autoSync: true,
          syncFrequency: 60, // minutes
          selectedMetrics: provider.supportedMetrics,
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: false,
            syncFailed: true,
            insights: true
          }
        },
        metadata: {
          connectedAt: new Date(),
          providerName: provider.name,
          providerType: providerType
        }
      };

      // Save connection
      this.connections.set(connection.id, connection);
      await this.saveConnections();

      console.log(`Connected to ${provider.name} successfully`);
      return connection;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.AUTH_FAILED,
        message: `Failed to connect to ${providerType}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Disconnect from a healthcare provider
   */
  async disconnectProvider(connectionId: string): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new WearableError({
          code: WearableErrorCode.DEVICE_NOT_CONNECTED,
          message: 'Connection not found',
          timestamp: new Date()
        });
      }

      // Revoke token from provider
      await this.revokeToken(connection.provider, connection.accessToken);

      // Remove connection
      this.connections.delete(connectionId);
      await this.saveConnections();

      console.log(`Disconnected from ${connection.provider} successfully`);
      return true;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.SYNC_FAILED,
        message: 'Failed to disconnect from provider',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get all active connections
   */
  getActiveConnections(userId: string): HealthcareConnection[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.userId === userId && conn.isActive);
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): HealthcareConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Update connection settings
   */
  async updateConnectionSettings(
    connectionId: string,
    settings: Partial<DeviceSettings>
  ): Promise<boolean> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new WearableError({
          code: WearableErrorCode.DEVICE_NOT_CONNECTED,
          message: 'Connection not found',
          timestamp: new Date()
        });
      }

      connection.settings = { ...connection.settings, ...settings };
      await this.saveConnections();

      return true;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.SYNC_FAILED,
        message: 'Failed to update connection settings',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Sync data from healthcare provider
   */
  async syncData(connectionId: string): Promise<HealthcareData[]> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        throw new WearableError({
          code: WearableErrorCode.DEVICE_NOT_CONNECTED,
          message: 'Connection not found',
          timestamp: new Date()
        });
      }

      // Check if token is expired and refresh if needed
      if (connection.expiresAt.getTime() < Date.now()) {
        await this.refreshToken(connection);
      }

      const provider = this.getProvider(connection.provider);
      if (!provider) {
        throw new WearableError({
          code: WearableErrorCode.DEVICE_NOT_CONNECTED,
          message: 'Provider not found',
          timestamp: new Date()
        });
      }

      // Fetch data from provider
      const data = await this.fetchProviderData(provider, connection);
      
      // Update last sync time
      connection.lastSyncAt = new Date();
      await this.saveConnections();

      console.log(`Synced ${data.length} data points from ${provider.name}`);
      return data;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.SYNC_FAILED,
        message: 'Failed to sync data from provider',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get healthcare data
   */
  async getHealthData(query: HealthDataQuery): Promise<HealthcareData[]> {
    try {
      const allData: HealthcareData[] = [];

      // Get data from all active connections
      const connections = this.getActiveConnections(query.userId);
      for (const connection of connections) {
        const providerData = await this.syncData(connection.id);
        allData.push(...providerData);
      }

      // Filter by query parameters
      let filteredData = allData;
      
      if (query.metricTypes && query.metricTypes.length > 0) {
        filteredData = filteredData.filter(data => 
          query.metricTypes!.includes(data.metricType)
        );
      }

      if (query.startDate) {
        filteredData = filteredData.filter(data => 
          data.timestamp >= query.startDate!
        );
      }

      if (query.endDate) {
        filteredData = filteredData.filter(data => 
          data.timestamp <= query.endDate!
        );
      }

      if (query.source) {
        filteredData = filteredData.filter(data => 
          data.source === query.source
        );
      }

      // Sort by timestamp (newest first)
      filteredData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      if (query.offset !== undefined && query.limit !== undefined) {
        filteredData = filteredData.slice(query.offset, query.offset + query.limit);
      }

      return filteredData;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to fetch healthcare data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Generate healthcare insights
   */
  async generateInsights(userId: string): Promise<HealthcareInsight[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      const data = await this.getHealthData({
        userId,
        startDate,
        endDate
      });

      const insights: HealthcareInsight[] = [];

      // Analyze steps
      const stepsData = data.filter(d => d.metricType === 'steps');
      if (stepsData.length > 0) {
        const avgSteps = stepsData.reduce((sum, d) => sum + d.value, 0) / stepsData.length;
        if (avgSteps < 5000) {
          insights.push({
            id: `insight_${Date.now()}_1`,
            type: 'recommendation',
            title: 'Low Step Count',
            message: `Your average daily steps is ${Math.round(avgSteps)}. Try to increase to at least 8,000 steps for better health.`,
            priority: 'medium',
            metricType: 'steps',
            value: avgSteps,
            threshold: 8000,
            recommendation: 'Take short walks throughout the day and consider using stairs instead of elevators.',
            createdAt: new Date(),
            acknowledged: false
          });
        }
      }

      // Analyze heart rate
      const heartRateData = data.filter(d => d.metricType === 'heart_rate');
      if (heartRateData.length > 0) {
        const avgHeartRate = heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length;
        if (avgHeartRate > 100) {
          insights.push({
            id: `insight_${Date.now()}_2`,
            type: 'warning',
            title: 'Elevated Heart Rate',
            message: `Your average heart rate is ${Math.round(avgHeartRate)} bpm, which is higher than normal.`,
            priority: 'high',
            metricType: 'heart_rate',
            value: avgHeartRate,
            threshold: 100,
            recommendation: 'Consider consulting a healthcare professional if this persists.',
            createdAt: new Date(),
            acknowledged: false
          });
        }
      }

      // Analyze sleep
      const sleepData = data.filter(d => d.metricType === 'sleep_duration');
      if (sleepData.length > 0) {
        const avgSleep = sleepData.reduce((sum, d) => sum + d.value, 0) / sleepData.length;
        if (avgSleep < 6) {
          insights.push({
            id: `insight_${Date.now()}_3`,
            type: 'warning',
            title: 'Insufficient Sleep',
            message: `Your average sleep duration is ${Math.round(avgSleep)} hours, which is less than recommended.`,
            priority: 'high',
            metricType: 'sleep_duration',
            value: avgSleep,
            threshold: 7,
            recommendation: 'Try to maintain a consistent sleep schedule and create a relaxing bedtime routine.',
            createdAt: new Date(),
            acknowledged: false
          });
        }
      }

      return insights;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to generate healthcare insights',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Generate healthcare report
   */
  async generateReport(
    userId: string,
    type: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  ): Promise<HealthcareReport> {
    try {
      const endDate = new Date();
      let startDate: Date;

      switch (type) {
        case 'weekly':
          startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'quarterly':
          startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'annual':
          startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }

      const data = await this.getHealthData({
        userId,
        startDate,
        endDate
      });

      const insights = await this.generateInsights(userId);

      // Calculate summary
      const summary = {
        totalSteps: data
          .filter(d => d.metricType === 'steps')
          .reduce((sum, d) => sum + d.value, 0),
        totalDistance: data
          .filter(d => d.metricType === 'distance')
          .reduce((sum, d) => sum + d.value, 0),
        totalCalories: data
          .filter(d => d.metricType === 'calories_burned')
          .reduce((sum, d) => sum + d.value, 0),
        averageHeartRate: data
          .filter(d => d.metricType === 'heart_rate')
          .reduce((sum, d, _, arr) => sum + d.value / arr.length, 0),
        totalSleepDuration: data
          .filter(d => d.metricType === 'sleep_duration')
          .reduce((sum, d) => sum + d.value, 0),
        currentWeight: data
          .filter(d => d.metricType === 'weight')
          .pop()?.value || 0,
        currentBMI: data
          .filter(d => d.metricType === 'body_mass_index')
          .pop()?.value || 0,
        totalWorkouts: data
          .filter(d => d.metricType === 'workout_duration')
          .length,
        totalActivities: data
          .filter(d => d.metricType === 'activity_minutes')
          .length,
      };

      // Generate recommendations
      const recommendations = insights
        .filter(i => i.recommendation)
        .map(i => i.recommendation!);

      const report: HealthcareReport = {
        id: `report_${Date.now()}`,
        userId,
        type,
        period: { start: startDate, end: endDate },
        summary,
        insights,
        trends: {}, // Would be populated with trend analysis
        recommendations,
        generatedAt: new Date()
      };

      return report;
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to generate healthcare report',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Export healthcare data
   */
  async exportData(
    userId: string,
    format: 'json' | 'csv' | 'pdf' = 'json',
    startDate?: Date,
    endDate?: Date
  ): Promise<string> {
    try {
      const query: HealthDataQuery = { userId };
      if (startDate) query.startDate = startDate;
      if (endDate) query.endDate = endDate;

      const data = await this.getHealthData(query);

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else if (format === 'csv') {
        const headers = Object.keys(data[0] || {});
        const csvHeaders = headers.join(',');
        const csvRows = data.map((row: any) => 
          headers.map(header => row[header]).join(',')
        );
        return [csvHeaders, ...csvRows].join('\n');
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      throw new WearableError({
        code: WearableErrorCode.DATA_INVALID,
        message: 'Failed to export healthcare data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  // Private helper methods

  private async loadConnections(): Promise<void> {
    // In a real implementation, this would load from secure storage
    // For now, we'll use mock data
    console.log('Loading healthcare connections...');
  }

  private async saveConnections(): Promise<void> {
    // In a real implementation, this would save to secure storage
    console.log('Saving healthcare connections...');
  }

  private async exchangeAuthCode(
    provider: HealthcareProviderConfig,
    authCode: string
  ): Promise<any> {
    // Mock implementation - in real app, this would make actual API calls
    return {
      access_token: `mock_access_token_${Date.now()}`,
      refresh_token: `mock_refresh_token_${Date.now()}`,
      expires_in: 3600 // 1 hour
    };
  }

  private async refreshToken(connection: HealthcareConnection): Promise<void> {
    // Mock implementation - in real app, this would make actual API calls
    connection.accessToken = `refreshed_access_token_${Date.now()}`;
    connection.expiresAt = new Date(Date.now() + 3600 * 1000);
  }

  private async revokeToken(provider: HealthcareProvider, token: string): Promise<void> {
    // Mock implementation - in real app, this would make actual API calls
    console.log(`Revoking token for ${provider}`);
  }

  private async fetchProviderData(
    provider: HealthcareProviderConfig,
    connection: HealthcareConnection
  ): Promise<HealthcareData[]> {
    // Mock implementation - in real app, this would make actual API calls
    const mockData: HealthcareData[] = [
      {
        id: `data_${Date.now()}_1`,
        connectionId: connection.id,
        metricType: 'steps',
        value: 8432,
        unit: 'steps',
        timestamp: new Date(),
        recordedAt: new Date(),
        source: 'automatic' as DataSource,
        provider: provider.type,
        confidence: 0.95
      },
      {
        id: `data_${Date.now()}_2`,
        connectionId: connection.id,
        metricType: 'heart_rate',
        value: 72,
        unit: 'bpm',
        timestamp: new Date(),
        recordedAt: new Date(),
        source: 'automatic' as DataSource,
        provider: provider.type,
        confidence: 0.98
      }
    ];

    return mockData;
  }
}

// Export singleton instance
export const healthcareService = new HealthcareService();
export default healthcareService;