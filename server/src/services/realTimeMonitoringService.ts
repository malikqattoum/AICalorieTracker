import { db } from '../db';
import { 
  realTimeMonitoring, 
  healthScores, 
  healthPredictions,
  users 
} from '../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc, sql, count, avg } from 'drizzle-orm';
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
      const metricData = await db.insert(realTimeMonitoring).values({
        userId: metric.userId,
        metricType: metric.metricType,
        metricValue: metric.metricValue,
        unit: metric.unit,
        timestamp: metric.timestamp || new Date(),
        metadata: metric.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Check for alerts
      await this.checkForAlerts(metric.userId, metric.metricType, metric.metricValue);

      return metricData[0];
    } catch (error) {
      console.error('Error adding real-time metric:', error);
      throw new Error(`Failed to add real-time metric: ${error.message}`);
    }
  }

  /**
   * Get real-time metrics for a user
   */
  async getUserMetrics(userId: number, metricType?: string, timeRange?: 'hour' | 'day' | 'week' | 'month') {
    try {
      let query = db.select().from(realTimeMonitoring).where(eq(realTimeMonitoring.userId, userId));
      
      if (metricType) {
        query = query.where(eq(realTimeMonitoring.metricType, metricType));
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
        
        query = query.where(gte(realTimeMonitoring.timestamp, startDate));
      }

      const metrics = await query.orderBy(desc(realTimeMonitoring.timestamp));
      return metrics;
    } catch (error) {
      console.error('Error getting user metrics:', error);
      throw new Error(`Failed to get user metrics: ${error.message}`);
    }
  }

  /**
   * Get latest metrics for a user
   */
  async getLatestMetrics(userId: number) {
    try {
      const latestMetrics = await db
        .select({
          metricType: realTimeMonitoring.metricType,
          metricValue: realTimeMonitoring.metricValue,
          unit: realTimeMonitoring.unit,
          timestamp: realTimeMonitoring.timestamp
        })
        .from(realTimeMonitoring)
        .where(eq(realTimeMonitoring.userId, userId))
        .groupBy(realTimeMonitoring.metricType)
        .orderBy(desc(realTimeMonitoring.timestamp));

      return latestMetrics;
    } catch (error) {
      console.error('Error getting latest metrics:', error);
      throw new Error(`Failed to get latest metrics: ${error.message}`);
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
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }

  /**
   * Create monitoring session
   */
  async createSession(session: Omit<MonitoringSession, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const newSession = await db.insert(realTimeMonitoring).values({
        ...session,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return newSession[0];
    } catch (error) {
      console.error('Error creating monitoring session:', error);
      throw new Error(`Failed to create monitoring session: ${error.message}`);
    }
  }

  /**
   * Update monitoring session
   */
  async updateSession(sessionId: number, updates: Partial<MonitoringSession>) {
    try {
      const updatedSession = await db
        .update(realTimeMonitoring)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(realTimeMonitoring.id, sessionId))
        .returning();

      return updatedSession[0] || null;
    } catch (error) {
      console.error('Error updating monitoring session:', error);
      throw new Error(`Failed to update monitoring session: ${error.message}`);
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
          eq(realTimeMonitoring.userId, userId),
          eq(realTimeMonitoring.status, 'active')
        ))
        .orderBy(desc(realTimeMonitoring.startTime));

      return sessions;
    } catch (error) {
      console.error('Error getting active sessions:', error);
      throw new Error(`Failed to get active sessions: ${error.message}`);
    }
  }

  /**
   * Create alert configuration
   */
  async createAlertConfig(alertConfig: AlertConfig) {
    try {
      const config = await db.insert(realTimeMonitoring).values({
        ...alertConfig,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return config[0];
    } catch (error) {
      console.error('Error creating alert config:', error);
      throw new Error(`Failed to create alert config: ${error.message}`);
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
        .where(eq(realTimeMonitoring.userId, userId))
        .orderBy(desc(realTimeMonitoring.createdAt));

      return configs;
    } catch (error) {
      console.error('Error getting alert configs:', error);
      throw new Error(`Failed to get alert configs: ${error.message}`);
    }
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(configId: number, userId: number, updates: Partial<AlertConfig>) {
    try {
      const updated = await db
        .update(realTimeMonitoring)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(and(
          eq(realTimeMonitoring.id, configId),
          eq(realTimeMonitoring.userId, userId)
        ))
        .returning();

      return updated[0] || null;
    } catch (error) {
      console.error('Error updating alert config:', error);
      throw new Error(`Failed to update alert config: ${error.message}`);
    }
  }

  /**
   * Delete alert configuration
   */
  async deleteAlertConfig(configId: number, userId: number) {
    try {
      const deleted = await db
        .delete(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.id, configId),
          eq(realTimeMonitoring.userId, userId)
        ))
        .returning();

      return deleted.length > 0;
    } catch (error) {
      console.error('Error deleting alert config:', error);
      throw new Error(`Failed to delete alert config: ${error.message}`);
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
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(userId: number, config: AlertConfig, metricValue: number) {
    try {
      // Create alert record
      await db.insert(realTimeMonitoring).values({
        userId,
        metricType: config.metricType,
        metricValue,
        unit: 'alert',
        timestamp: new Date(),
        metadata: {
          alertConfig: config,
          triggeredAt: new Date().toISOString(),
          message: `Alert triggered: ${config.name}`
        },
        createdAt: new Date(),
        updatedAt: new Date()
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
          eq(realTimeMonitoring.userId, userId),
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
          eq(healthScores.userId, userId),
          gte(healthScores.calculationDate, subDays(new Date(), 7))
        ))
        .orderBy(desc(healthScores.calculationDate));

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
          eq(healthPredictions.userId, userId),
          gte(healthPredictions.createdAt, subDays(new Date(), 7))
        ))
        .orderBy(desc(healthPredictions.createdAt));

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
          avg: avg(realTimeMonitoring.metricValue),
          min: sql`MIN(${realTimeMonitoring.metricValue})`,
          max: sql`MAX(${realTimeMonitoring.metricValue})`
        })
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.userId, userId),
          eq(realTimeMonitoring.metricType, metricType),
          gte(realTimeMonitoring.timestamp, startDate)
        }));

      return metrics[0] || { count: 0, avg: 0, min: 0, max: 0 };
    } catch (error) {
      console.error('Error getting metric statistics:', error);
      throw new Error(`Failed to get metric statistics: ${error.message}`);
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
          metricType: realTimeMonitoring.metricType,
          timestamp: realTimeMonitoring.timestamp,
          metricValue: realTimeMonitoring.metricValue
        })
        .from(realTimeMonitoring)
        .where(and(
          eq(realTimeMonitoring.userId, userId),
          sql`${realTimeMonitoring.metricType} IN (${metricTypes.join(',')})`,
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
      throw new Error(`Failed to get real-time trends: ${error.message}`);
    }
  }
}