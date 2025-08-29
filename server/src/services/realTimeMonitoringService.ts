import { db } from '../db';
import {
  realTimeMonitoring,
  healthScores,
  healthPredictions
} from '../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc, sql, count, avg, inArray } from 'drizzle-orm';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

export interface RealTimeMetric {
  userId: number;
  metricType: 'heart_rate' | 'blood_pressure' | 'blood_oxygen' | 'sleep_quality' | 'stress_level' | 'activity_level';
  metricValue: number;
  unit: string;
  timestamp?: Date;
  metadata?: any;
}

export interface AlertConfig {
  userId: number;
  metricType: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  operator: 'and' | 'or';
  action: 'notification' | 'email' | 'sms' | 'emergency';
  isActive: boolean;
  name: string;
  description?: string;
}

export interface MonitoringSession {
  id: number;
  userId: number;
  sessionType: 'continuous' | 'periodic' | 'event_based';
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'paused' | 'ended';
  metrics: string[];
  alertConfigs: AlertConfig[];
  metadata?: any;
}

export class RealTimeMonitoringService {
  /**
   * Add a real-time metric
   */
  async addMetric(metric: RealTimeMetric) {
    try {
      await db.insert(realTimeMonitoring).values({
        user_id: metric.userId,
        metric_type: metric.metricType as any,
        metric_value: metric.metricValue.toString(),
        unit: metric.unit,
        timestamp: metric.timestamp || new Date(),
        is_alert: false,
        alert_level: 'low' as any,
        metadata: metric.metadata || {},
        created_at: new Date()
      });

      // Check for alerts
      await this.checkForAlerts(metric.userId, metric.metricType, metric.metricValue);

      return { ...metric, id: 0 }; // Return a basic object since we can't get the inserted ID
    } catch (error) {
      console.error('Error adding real-time metric:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to add real-time metric: ${errorMessage}`);
    }
  }

  /**
   * Get real-time metrics for a user
   */
  async getUserMetrics(userId: number, metricType?: string, timeRange?: 'hour' | 'day' | 'week' | 'month') {
    try {
      let whereConditions = [eq(realTimeMonitoring.user_id, userId)];

      if (metricType) {
        whereConditions.push(eq(realTimeMonitoring.metric_type, metricType as any));
      }

      // Apply time range filter
      if (timeRange) {
        const now = new Date();
        let startDate: Date;

        switch (timeRange) {
          case 'hour':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case 'day':
            startDate = startOfDay(now);
            break;
          case 'week':
            startDate = subWeeks(now, 1);
            break;
          case 'month':
            startDate = subMonths(now, 1);
            break;
          default:
            startDate = subDays(now, 7);
        }

        whereConditions.push(gte(realTimeMonitoring.timestamp, startDate));
      }

      const metrics = await db
        .select()
        .from(realTimeMonitoring)
        .where(and(...whereConditions))
        .orderBy(desc(realTimeMonitoring.timestamp));

      return metrics;
    } catch (error) {
      console.error('Error getting user metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get user metrics: ${errorMessage}`);
    }
  }

  /**
   * Get latest metrics for a user
   */
  async getLatestMetrics(userId: number) {
    try {
      const latestMetrics = await db
        .select({
          metricType: realTimeMonitoring.metric_type,
          metricValue: realTimeMonitoring.metric_value,
          unit: realTimeMonitoring.unit,
          timestamp: realTimeMonitoring.timestamp
        })
        .from(realTimeMonitoring)
        .where(eq(realTimeMonitoring.user_id, userId))
        .groupBy(realTimeMonitoring.metric_type)
        .orderBy(desc(realTimeMonitoring.timestamp));

      return latestMetrics;
    } catch (error) {
      console.error('Error getting latest metrics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get latest metrics: ${errorMessage}`);
    }
  }

  /**
   * Get real-time dashboard data
   */
  async getDashboardData(userId: number) {
    try {
      const [latestMetrics, recentMetrics, healthScores, predictions] = await Promise.all([
        this.getLatestMetrics(userId),
        this.getUserMetrics(userId, undefined, 'hour'),
        this.getRecentHealthScores(userId),
        this.getRecentPredictions(userId)
      ]);

      const alerts = await this.getActiveAlerts(userId);

      return {
        latestMetrics,
        recentMetrics,
        healthScores,
        predictions,
        alerts,
        summary: {
          totalMetrics: recentMetrics.length,
          activeAlerts: alerts.length,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get dashboard data: ${errorMessage}`);
    }
  }

  /**
   * Create monitoring session (stored as metric with session metadata)
   */
  async createSession(session: Omit<MonitoringSession, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      await db.insert(realTimeMonitoring).values({
        user_id: session.userId,
        metric_type: 'session' as any,
        metric_value: '1',
        unit: 'session',
        timestamp: session.startTime,
        metadata: {
          sessionType: session.sessionType,
          status: session.status,
          endTime: session.endTime,
          metrics: session.metrics,
          alertConfigs: session.alertConfigs
        },
        created_at: new Date()
      });

      return { id: 0, ...session }; // Return with placeholder ID since we can't get the inserted ID
    } catch (error) {
      console.error('Error creating monitoring session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create monitoring session: ${errorMessage}`);
    }
  }

  /**
   * Update monitoring session
   */
  async updateSession(sessionId: number, updates: Partial<MonitoringSession>) {
    try {
      await db
        .update(realTimeMonitoring)
        .set({
          metadata: updates,
          timestamp: updates.startTime || new Date()
        })
        .where(eq(realTimeMonitoring.id, sessionId));

      return { id: sessionId, ...updates };
    } catch (error) {
      console.error('Error updating monitoring session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update monitoring session: ${errorMessage}`);
    }
  }

  /**
   * Get active monitoring sessions
   */
  async getActiveSessions(userId: number) {
    try {
      const sessions = await db
        .select()
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.user_id, userId),
          eq(realTimeMonitoring.metric_type, 'session' as any),
          sql`${realTimeMonitoring.metadata} LIKE ${'%active%'}`
        ))
        .orderBy(desc(realTimeMonitoring.timestamp));

      return sessions.map(session => ({
        id: session.id,
        userId: session.user_id,
        sessionType: (session.metadata as any)?.sessionType || 'continuous',
        startTime: session.timestamp,
        endTime: (session.metadata as any)?.endTime,
        status: (session.metadata as any)?.status || 'active',
        metrics: (session.metadata as any)?.metrics || [],
        alertConfigs: (session.metadata as any)?.alertConfigs || []
      }));
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw new Error(`Failed to get active sessions: ${(error as Error).message}`);
    }
  }

  /**
   * Create alert configuration (stored as metric with alert config metadata)
   */
  async createAlertConfig(alertConfig: AlertConfig) {
    try {
      await db.insert(realTimeMonitoring).values({
        user_id: alertConfig.userId,
        metric_type: 'alert_config' as any,
        metric_value: '1',
        unit: 'config',
        timestamp: new Date(),
        metadata: alertConfig,
        created_at: new Date()
      });

      return { id: 0, ...alertConfig }; // Return with placeholder ID since we can't get the inserted ID
    } catch (error) {
      console.error('Error creating alert config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create alert config: ${errorMessage}`);
    }
  }

  /**
   * Get alert configurations for a user
   */
  async getAlertConfigs(userId: number) {
    try {
      const configs = await db
        .select()
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.user_id, userId),
          eq(realTimeMonitoring.metric_type, 'alert_config' as any)
        ))
        .orderBy(desc(realTimeMonitoring.created_at));

      return configs.map(config => ({
        id: config.id,
        ...(config.metadata as AlertConfig)
      }));
    } catch (error) {
      console.error('Error getting alert configs:', error);
      throw new Error(`Failed to get alert configs: ${(error as Error).message}`);
    }
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(configId: number, userId: number, updates: Partial<AlertConfig>) {
    try {
      await db
        .update(realTimeMonitoring)
        .set({
          metadata: updates,
          timestamp: new Date()
        })
        .where(and(
          eq(realTimeMonitoring.id, configId),
          eq(realTimeMonitoring.user_id, userId)
        ));

      return { id: configId, ...updates };
    } catch (error) {
      console.error('Error updating alert config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to update alert config: ${errorMessage}`);
    }
  }

  /**
   * Delete alert configuration
   */
  async deleteAlertConfig(configId: number, userId: number) {
    try {
      await db
        .delete(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.id, configId),
          eq(realTimeMonitoring.user_id, userId)
        ));

      return true; // Assume successful deletion
    } catch (error) {
      console.error('Error deleting alert config:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to delete alert config: ${errorMessage}`);
    }
  }

  /**
   * Check for alerts based on metric values
   */
  private async checkForAlerts(userId: number, metricType: string, metricValue: number) {
    try {
      const alertConfigs = await this.getAlertConfigs(userId);
      
      for (const config of alertConfigs) {
        if (!config.isActive) continue;
        
        if (config.metricType === metricType) {
          let shouldTrigger = false;
          
          switch (config.condition) {
            case 'greater_than':
              shouldTrigger = metricValue > config.threshold;
              break;
            case 'less_than':
              shouldTrigger = metricValue < config.threshold;
              break;
            case 'equals':
              shouldTrigger = metricValue === config.threshold;
              break;
            case 'not_equals':
              shouldTrigger = metricValue !== config.threshold;
              break;
          }
          
          if (shouldTrigger) {
            await this.triggerAlert(userId, config, metricValue);
          }
        }
      }
    } catch (error) {
      console.error('Error checking for alerts:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Alert check failed: ${errorMessage}`);
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(userId: number, config: AlertConfig, metricValue: number) {
    try {
      // Create alert record
      await db.insert(realTimeMonitoring).values({
        user_id: userId,
        metric_type: 'alert' as any,
        metric_value: metricValue.toString(),
        unit: 'alert',
        timestamp: new Date(),
        metadata: {
          alertConfig: config,
          triggeredAt: new Date().toISOString(),
          message: `Alert triggered: ${config.name}`
        },
        created_at: new Date()
      });

      // Send notification based on action type
      switch (config.action) {
        case 'notification':
          await this.sendNotification(userId, config, metricValue);
          break;
        case 'email':
          await this.sendEmailAlert(userId, config, metricValue);
          break;
        case 'sms':
          await this.sendSMSAlert(userId, config, metricValue);
          break;
        case 'emergency':
          await this.sendEmergencyAlert(userId, config, metricValue);
          break;
      }
    } catch (error) {
      console.error('Error triggering alert:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Alert trigger failed: ${errorMessage}`);
    }
  }

  /**
   * Send notification
   */
  private async sendNotification(userId: number, config: AlertConfig, metricValue: number) {
    try {
      // In a real implementation, this would integrate with a push notification service
      console.log(`Sending notification to user ${userId}: ${config.name}`);
      console.log(`Metric: ${config.metricType} = ${metricValue} ${config.condition} ${config.threshold}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Notification failed: ${errorMessage}`);
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(userId: number, config: AlertConfig, metricValue: number) {
    try {
      // In a real implementation, this would integrate with an email service
      console.log(`Sending email alert to user ${userId}: ${config.name}`);
    } catch (error) {
      console.error('Error sending email alert:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Email alert failed: ${errorMessage}`);
    }
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(userId: number, config: AlertConfig, metricValue: number) {
    try {
      // In a real implementation, this would integrate with an SMS service
      console.log(`Sending SMS alert to user ${userId}: ${config.name}`);
    } catch (error) {
      console.error('Error sending SMS alert:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`SMS alert failed: ${errorMessage}`);
    }
  }

  /**
   * Send emergency alert
   */
  private async sendEmergencyAlert(userId: number, config: AlertConfig, metricValue: number) {
    try {
      // In a real implementation, this would integrate with emergency services
      console.log(`Sending emergency alert for user ${userId}: ${config.name}`);
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Emergency alert failed: ${errorMessage}`);
    }
  }

  /**
   * Get active alerts for a user
   */
  private async getActiveAlerts(userId: number) {
    try {
      const alerts = await db
        .select()
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.user_id, userId),
          sql`${realTimeMonitoring.metadata} LIKE ${'%alert%'}`,
          gte(realTimeMonitoring.timestamp, subDays(new Date(), 1))
        ))
        .orderBy(desc(realTimeMonitoring.timestamp));

      return alerts;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Get recent health scores
   */
  private async getRecentHealthScores(userId: number) {
    try {
      const scores = await db
        .select()
        .from(healthScores)
        .where(and(
          eq(healthScores.user_id, userId),
          gte(healthScores.calculation_date, subDays(new Date(), 7))
        ))
        .orderBy(desc(healthScores.calculation_date));

      return scores;
    } catch (error) {
      console.error('Error getting recent health scores:', error);
      return [];
    }
  }

  /**
   * Get recent predictions
   */
  private async getRecentPredictions(userId: number) {
    try {
      const predictions = await db
        .select()
        .from(healthPredictions)
        .where(and(
          eq(healthPredictions.user_id, userId),
          gte(healthPredictions.created_at, subDays(new Date(), 7))
        ))
        .orderBy(desc(healthPredictions.created_at));

      return predictions;
    } catch (error) {
      console.error('Error getting recent predictions:', error);
      return [];
    }
  }

  /**
   * Get metric statistics
   */
  async getMetricStatistics(userId: number, metricType: string, timeRange: 'hour' | 'day' | 'week' | 'month') {
    try {
      let startDate: Date;
      const now = new Date();
      
      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subWeeks(now, 1);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const metrics = await db
        .select({
          count: count(),
          avg: avg(realTimeMonitoring.metric_value),
          min: sql`MIN(${realTimeMonitoring.metric_value})`,
          max: sql`MAX(${realTimeMonitoring.metric_value})`
        })
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.user_id, userId),
          eq(realTimeMonitoring.metric_type, metricType as any),
          gte(realTimeMonitoring.timestamp, startDate)
        ));

      return metrics[0] || { count: 0, avg: 0, min: 0, max: 0 };
    } catch (error) {
      console.error('Error getting metric statistics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get metric statistics: ${errorMessage}`);
    }
  }

  /**
   * Get real-time trends
   */
  async getRealTimeTrends(userId: number, metricTypes: string[], timeRange: 'hour' | 'day' | 'week' | 'month') {
    try {
      let startDate: Date;
      const now = new Date();
      
      switch (timeRange) {
        case 'hour':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subWeeks(now, 1);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = subDays(now, 7);
      }

      const trends = await db
        .select({
          metricType: realTimeMonitoring.metric_type,
          timestamp: realTimeMonitoring.timestamp,
          metricValue: realTimeMonitoring.metric_value
        })
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.user_id, userId),
          inArray(realTimeMonitoring.metric_type, metricTypes as any),
          gte(realTimeMonitoring.timestamp, startDate)
        ))
        .orderBy(realTimeMonitoring.timestamp);

      // Group by metric type
      const groupedTrends: { [key: string]: any[] } = {};
      metricTypes.forEach(type => {
        groupedTrends[type] = [];
      });

      trends.forEach(trend => {
        if (groupedTrends[trend.metricType]) {
          groupedTrends[trend.metricType].push(trend);
        }
      });

      return groupedTrends;
    } catch (error) {
      console.error('Error getting real-time trends:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get real-time trends: ${errorMessage}`);
    }
  }
}