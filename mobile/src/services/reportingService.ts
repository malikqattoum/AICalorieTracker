import {
  Report,
  ReportType,
  ReportFormat,
  ReportSchedule,
  ReportTemplate,
  ReportData,
  ReportAnalytics,
  ReportExport,
  ReportSubscription,
  ReportNotification
} from '../types/reporting';

// Reporting Service Types
export type ReportingFeature = 'nutrition' | 'fitness' | 'health' | 'progress' | 'compliance' | 'custom';

export type ReportingRequest = {
  feature: ReportingFeature;
  userId: string;
  data: any;
  context?: any;
};

export type ReportingResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    version: string;
  };
};

export type CreateReportRequest = {
  userId: string;
  title: string;
  description: string;
  type: ReportType;
  format: ReportFormat;
  templateId?: string;
  data: ReportData;
  schedule?: ReportSchedule;
  settings: {
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
    dateRange: {
      start: Date;
      end: Date;
    };
    filters: {
      meals?: boolean;
      workouts?: boolean;
      sleep?: boolean;
      weight?: boolean;
      vitals?: boolean;
      medications?: boolean;
      mood?: boolean;
    };
  };
  recipients?: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  permissions: {
    view: string[];
    edit: string[];
    share: string[];
    delete: string[];
  };
};

export type CreateReportResponse = {
  report: Report;
  analytics: ReportAnalytics;
  exportUrl?: string;
  shareUrl?: string;
};

export type GenerateReportRequest = {
  reportId: string;
  format: ReportFormat;
  includeCharts: boolean;
  includeImages: boolean;
  includeRawData: boolean;
  includeRecommendations: boolean;
  includeComparisons: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: {
    meals?: boolean;
    workouts?: boolean;
    sleep?: boolean;
    weight?: boolean;
    vitals?: boolean;
    medications?: boolean;
    mood?: boolean;
  };
};

export type GenerateReportResponse = {
  report: Report;
  analytics: ReportAnalytics;
  exportUrl: string;
  shareUrl: string;
  downloadUrl: string;
  qrCode?: string;
};

export type ScheduleReportRequest = {
  reportId: string;
  schedule: ReportSchedule;
  recipients?: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  settings: {
    format: ReportFormat;
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
  };
};

export type ScheduleReportResponse = {
  success: boolean;
  schedule: ReportSchedule;
  nextRun: Date;
  lastRun?: Date;
  runCount: number;
};

export type GetReportsRequest = {
  userId: string;
  type?: ReportType;
  format?: ReportFormat;
  status?: 'draft' | 'generating' | 'completed' | 'scheduled' | 'failed';
  limit: number;
  offset: number;
  sortBy?: 'created' | 'updated' | 'title' | 'type';
  sortOrder?: 'asc' | 'desc';
};

export type GetReportsResponse = {
  reports: Report[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
  templates: ReportTemplate[];
};

export type GetReportAnalyticsRequest = {
  reportId: string;
  userId: string;
  metrics: Array<{
    type: string;
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target?: number;
  }>;
};

export type GetReportAnalyticsResponse = {
  analytics: ReportAnalytics;
  insights: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    action: string;
    impact: 'low' | 'medium' | 'high';
  }>;
};

export type ExportReportRequest = {
  reportId: string;
  format: ReportFormat;
  includeCharts: boolean;
  includeImages: boolean;
  includeRawData: boolean;
  includeRecommendations: boolean;
  includeComparisons: boolean;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: {
    meals?: boolean;
    workouts?: boolean;
    sleep?: boolean;
    weight?: boolean;
    vitals?: boolean;
    medications?: boolean;
    mood?: boolean;
  };
};

export type ExportReportResponse = {
  export: ReportExport;
  downloadUrl: string;
  shareUrl: string;
  qrCode?: string;
  expiresAt: Date;
};

export type ShareReportRequest = {
  reportId: string;
  recipients: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  message?: string;
  settings: {
    allowView: boolean;
    allowEdit: boolean;
    allowShare: boolean;
    allowDownload: boolean;
    expiresAt?: Date;
  };
};

export type ShareReportResponse = {
  success: boolean;
  shareUrl: string;
  qrCode?: string;
  recipients: Array<{
    email: string;
    name: string;
    status: 'sent' | 'delivered' | 'opened' | 'failed';
    sentAt: Date;
    openedAt?: Date;
  }>;
};

export type GetReportTemplatesRequest = {
  userId: string;
  type?: ReportType;
  category?: string;
  limit: number;
  offset: number;
};

export type GetReportTemplatesResponse = {
  templates: ReportTemplate[];
  categories: Array<{
    name: string;
    count: number;
  }>;
  popular: ReportTemplate[];
};

export type CreateReportTemplateRequest = {
  userId: string;
  name: string;
  description: string;
  type: ReportType;
  category: string;
  data: ReportData;
  settings: {
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
    dateRange: {
      start: Date;
      end: Date;
    };
    filters: {
      meals?: boolean;
      workouts?: boolean;
      sleep?: boolean;
      weight?: boolean;
      vitals?: boolean;
      medications?: boolean;
      mood?: boolean;
    };
  };
  permissions: {
    view: string[];
    edit: string[];
    share: string[];
    delete: string[];
  };
  isPublic: boolean;
  tags: string[];
};

export type CreateReportTemplateResponse = {
  template: ReportTemplate;
  isPublic: boolean;
  usageCount: number;
};

export type GetReportSubscriptionsRequest = {
  userId: string;
  type?: ReportType;
  status?: 'active' | 'paused' | 'cancelled';
  limit: number;
  offset: number;
};

export type GetReportSubscriptionsResponse = {
  subscriptions: ReportSubscription[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
  nextRun: Date;
  lastRun?: Date;
};

export type CreateReportSubscriptionRequest = {
  userId: string;
  templateId: string;
  schedule: ReportSchedule;
  recipients?: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  settings: {
    format: ReportFormat;
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
  };
  notifications: {
    beforeGeneration: boolean;
    afterGeneration: boolean;
    onDelivery: boolean;
    onView: boolean;
  };
};

export type CreateReportSubscriptionResponse = {
  subscription: ReportSubscription;
  nextRun: Date;
  lastRun?: Date;
  runCount: number;
};

export type UpdateReportSubscriptionRequest = {
  subscriptionId: string;
  schedule?: ReportSchedule;
  recipients?: Array<{
    email: string;
    name: string;
    role: string;
  }>;
  settings?: {
    format: ReportFormat;
    includeCharts: boolean;
    includeImages: boolean;
    includeRawData: boolean;
    includeRecommendations: boolean;
    includeComparisons: boolean;
  };
  notifications?: {
    beforeGeneration: boolean;
    afterGeneration: boolean;
    onDelivery: boolean;
    onView: boolean;
  };
};

export type UpdateReportSubscriptionResponse = {
  subscription: ReportSubscription;
  nextRun: Date;
  lastRun?: Date;
  runCount: number;
};

export type CancelReportSubscriptionRequest = {
  subscriptionId: string;
  reason?: string;
};

export type CancelReportSubscriptionResponse = {
  success: boolean;
  subscription: ReportSubscription;
  cancelledAt: Date;
  reason?: string;
};

export type GetReportNotificationsRequest = {
  userId: string;
  type?: 'generation' | 'delivery' | 'view' | 'error';
  limit: number;
  offset: number;
};

export type GetReportNotificationsResponse = {
  notifications: ReportNotification[];
  pagination: {
    total: number;
    hasMore: boolean;
    nextOffset: number;
  };
  unreadCount: number;
};

export type MarkReportNotificationsReadRequest = {
  userId: string;
  notificationIds: string[];
};

export type MarkReportNotificationsReadResponse = {
  success: boolean;
  readCount: number;
  unreadCount: number;
};

export class ReportingService {
  private isInitialized: boolean = false;
  private apiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Initialize the reporting service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate configuration
      if (!this.apiEndpoint || !this.apiKey) {
        throw new Error('Reporting service configuration is incomplete');
      }

      // Test connection
      await this.testConnection();
      
      this.isInitialized = true;
      console.log('Reporting service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize reporting service:', error);
      throw error;
    }
  }

  /**
   * Test connection to reporting service
   */
  private async testConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Reporting service health check failed: ${response.status}`);
      }

      const health = await response.json();
      console.log('Reporting service health:', health);
    } catch (error) {
      throw new Error(`Failed to connect to reporting service: ${error}`);
    }
  }

  /**
   * Create a report
   */
  async createReport(request: CreateReportRequest): Promise<ReportingResponse<CreateReportResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.report,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Generate a report
   */
  async generateReport(request: GenerateReportRequest): Promise<ReportingResponse<GenerateReportResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report generation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.report,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Schedule a report
   */
  async scheduleReport(request: ScheduleReportRequest): Promise<ReportingResponse<ScheduleReportResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report scheduling failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.schedule,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report scheduling error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get reports
   */
  async getReports(request: GetReportsRequest): Promise<ReportingResponse<GetReportsResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Reports retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.reports,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Reports retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get report analytics
   */
  async getReportAnalytics(request: GetReportAnalyticsRequest): Promise<ReportingResponse<GetReportAnalyticsResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/analytics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report analytics retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.analytics,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report analytics retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Export a report
   */
  async exportReport(request: ExportReportRequest): Promise<ReportingResponse<ExportReportResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report export failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.export,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Share a report
   */
  async shareReport(request: ShareReportRequest): Promise<ReportingResponse<ShareReportResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report sharing failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.share,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report sharing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get report templates
   */
  async getReportTemplates(request: GetReportTemplatesRequest): Promise<ReportingResponse<GetReportTemplatesResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report templates retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.templates,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report templates retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Create a report template
   */
  async createReportTemplate(request: CreateReportTemplateRequest): Promise<ReportingResponse<CreateReportTemplateResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report template creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.template,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report template creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get report subscriptions
   */
  async getReportSubscriptions(request: GetReportSubscriptionsRequest): Promise<ReportingResponse<GetReportSubscriptionsResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report subscriptions retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.subscriptions,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report subscriptions retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Create a report subscription
   */
  async createReportSubscription(request: CreateReportSubscriptionRequest): Promise<ReportingResponse<CreateReportSubscriptionResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report subscription creation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.subscription,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report subscription creation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Update a report subscription
   */
  async updateReportSubscription(request: UpdateReportSubscriptionRequest): Promise<ReportingResponse<UpdateReportSubscriptionResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/subscriptions/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report subscription update failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.subscription,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report subscription update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Cancel a report subscription
   */
  async cancelReportSubscription(request: CancelReportSubscriptionRequest): Promise<ReportingResponse<CancelReportSubscriptionResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report subscription cancellation failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.subscription,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report subscription cancellation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get report notifications
   */
  async getReportNotifications(request: GetReportNotificationsRequest): Promise<ReportingResponse<GetReportNotificationsResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Report notifications retrieval failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.notifications,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Report notifications retrieval error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Mark report notifications as read
   */
  async markReportNotificationsRead(request: MarkReportNotificationsReadRequest): Promise<ReportingResponse<MarkReportNotificationsReadResponse>> {
    try {
      const response = await fetch(`${this.apiEndpoint}/reports/notifications/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Mark report notifications read failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data.notifications,
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Mark report notifications read error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
        },
      };
    }
  }

  /**
   * Get reporting service status
   */
  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    responseTime: number;
    errorRate: number;
    lastChecked: Date;
  }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const status = await response.json();
      return {
        status: status.status,
        uptime: status.uptime,
        responseTime: status.responseTime,
        errorRate: status.errorRate,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        uptime: 0,
        responseTime: 0,
        errorRate: 100,
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Get reporting feature availability
   */
  getFeatureAvailability(): Record<ReportingFeature, boolean> {
    return {
      nutrition: true,
      fitness: true,
      health: true,
      progress: true,
      compliance: true,
      custom: true,
    };
  }

  /**
   * Cleanup reporting service
   */
  async cleanup(): Promise<void> {
    try {
      // Clear any cached data
      this.isInitialized = false;
      console.log('Reporting service cleaned up');
    } catch (error) {
      console.error('Error cleaning up reporting service:', error);
    }
  }
}

// Export singleton instance
export const reportingService = new ReportingService(
  process.env.REPORTING_API_ENDPOINT || 'https://api.reporting.example.com/v1',
  process.env.REPORTING_API_KEY || ''
);
export default reportingService;