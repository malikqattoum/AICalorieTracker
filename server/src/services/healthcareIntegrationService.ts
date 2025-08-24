import { db } from '../db';
import {
  healthcareIntegration,
  healthReports,
  healthScores,
  healthPredictions,
  realTimeMonitoring
} from '../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc, sql, count, avg, sum, isNotNull } from 'drizzle-orm';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';
import { healthcareProviderService } from './healthcareProviderService';

export interface HealthcareProvider {
  id: string;
  name: string;
  type: 'doctor' | 'nutritionist' | 'fitness_coach' | 'therapist';
  specialty: string;
  practiceName?: string;
  email?: string;
  phone?: string;
  address?: string;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
}

export interface HealthcareIntegrationInput {
  userId: number;
  professionalId: string;
  professionalName: string;
  professionalType: 'doctor' | 'nutritionist' | 'fitness_coach' | 'therapist';
  practiceName?: string;
  accessLevel: 'read_only' | 'read_write' | 'full_access';
  dataSharingConsent: boolean;
  dataExpirationDate?: Date;
  sharedData?: any;
  notes?: string;
}

export interface DataSharingConfig {
  id: number;
  userId: number;
  professionalId: string;
  dataType: 'health_scores' | 'real_time_metrics' | 'predictions' | 'reports' | 'all';
  accessLevel: 'read_only' | 'read_write' | 'full_access';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  metadata?: any;
}

export interface HealthcareSession {
  id: number;
  userId: number;
  professionalId: string;
  sessionType: 'consultation' | 'follow_up' | 'emergency' | 'routine_check';
  sessionDate: Date;
  duration: number;
  notes?: string;
  recommendations?: string[];
  sharedData?: any;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthcareAlert {
  id: number;
  userId: number;
  professionalId: string;
  alertType: 'health_risk' | 'metric_anomaly' | 'goal_milestone' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  data?: any;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  createdAt: Date;
}

export class HealthcareIntegrationService {
  /**
   * Create healthcare integration
   */
  async createHealthcareIntegration(input: HealthcareIntegrationInput) {
    try {
      const result = await db.execute(
        `INSERT INTO healthcare_integration
         (user_id, professional_id, professional_name, professional_type, practice_name, access_level, data_sharing_consent, data_expiration_date, shared_data, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          input.userId,
          input.professionalId,
          input.professionalName,
          input.professionalType,
          input.practiceName || null,
          input.accessLevel,
          input.dataSharingConsent,
          input.dataExpirationDate || null,
          input.sharedData ? JSON.stringify(input.sharedData) : null,
          input.notes || null,
          new Date(),
          new Date()
        ]
      );

      return { id: (result as any).insertId, ...input };
    } catch (error) {
      console.error('Error creating healthcare integration:', error);
      throw new Error(`Failed to create healthcare integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's healthcare integrations
   */
  async getUserIntegrations(userId: number) {
    try {
      const [integrations] = await db.execute(
        `SELECT * FROM healthcare_integration
         WHERE user_id = ${userId}
         ORDER BY created_at DESC`
      );

      return integrations;
    } catch (error) {
      console.error('Error getting user integrations:', error);
      throw new Error(`Failed to get user integrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get healthcare integration by ID
   */
  async getIntegrationById(integrationId: number, userId: number) {
    try {
      const [integration] = await db.execute(
        `SELECT * FROM healthcare_integration
         WHERE id = ${integrationId} AND user_id = ${userId}
         LIMIT 1`
      );

      return integration || null;
    } catch (error) {
      console.error('Error getting integration by ID:', error);
      throw new Error(`Failed to get integration by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update healthcare integration
   */
  async updateHealthcareIntegration(integrationId: number, userId: number, updates: Partial<HealthcareIntegrationInput>) {
    try {
      const updateFields = [];
      const updateValues = [];
      
      if (updates.professionalId) {
        updateFields.push('professional_id = ?');
        updateValues.push(updates.professionalId);
      }
      if (updates.professionalName) {
        updateFields.push('professional_name = ?');
        updateValues.push(updates.professionalName);
      }
      if (updates.professionalType) {
        updateFields.push('professional_type = ?');
        updateValues.push(updates.professionalType);
      }
      if (updates.practiceName !== undefined) {
        updateFields.push('practice_name = ?');
        updateValues.push(updates.practiceName);
      }
      if (updates.accessLevel) {
        updateFields.push('access_level = ?');
        updateValues.push(updates.accessLevel);
      }
      if (updates.dataSharingConsent !== undefined) {
        updateFields.push('data_sharing_consent = ?');
        updateValues.push(updates.dataSharingConsent);
      }
      if (updates.dataExpirationDate) {
        updateFields.push('data_expiration_date = ?');
        updateValues.push(updates.dataExpirationDate);
      }
      if (updates.sharedData !== undefined) {
        updateFields.push('shared_data = ?');
        updateValues.push(updates.sharedData ? JSON.stringify(updates.sharedData) : null);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(updates.notes);
      }
      
      updateFields.push('updated_at = ?');
      updateValues.push(new Date());
      updateValues.push(integrationId);
    updateValues.push(userId);

    await db.execute(
      `UPDATE healthcare_integration
       SET ${updateFields.join(', ')}
       WHERE id = ${integrationId} AND user_id = ${userId}`
    );

    // Return the updated integration
    const [updated] = await db.execute(`SELECT * FROM healthcare_integration WHERE id = ${integrationId} AND user_id = ${userId}`);
      return updated || null;
    } catch (error) {
      console.error('Error updating healthcare integration:', error);
      throw new Error(`Failed to update healthcare integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete healthcare integration
   */
  async deleteHealthcareIntegration(integrationId: number, userId: number) {
    try {
      await db.execute(
        `DELETE FROM healthcare_integration WHERE id = ${integrationId} AND user_id = ${userId}`
      );

      return { id: integrationId, deleted: true };
    } catch (error) {
      console.error('Error deleting healthcare integration:', error);
      throw new Error(`Failed to delete healthcare integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create data sharing configuration
   */
  async createDataSharingConfig(config: DataSharingConfig) {
    try {
      const result = await db.execute(
        `INSERT INTO healthcare_integration
         (user_id, professional_id, professional_type, professional_name, practice_name, access_level, data_sharing_consent, consent_date, data_expiration_date, shared_data, notes, is_active, acknowledged, acknowledged_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          config.userId,
          config.professionalId,
          config.professionalType,
          config.professionalName,
          config.practiceName || null,
          config.accessLevel,
          config.dataSharingConsent,
          config.consentDate || null,
          config.dataExpirationDate || null,
          config.sharedData ? JSON.stringify(config.sharedData) : null,
          config.notes || null,
          config.isActive,
          config.acknowledged,
          config.acknowledgedAt || null,
          new Date(),
          new Date()
        ]
      );

      return { id: (result as any).insertId, ...config };
    } catch (error) {
      console.error('Error creating data sharing config:', error);
      throw new Error(`Failed to create data sharing config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get data sharing configurations for a user
   */
  async getDataSharingConfigs(userId: number) {
    try {
      const configs = await db
        .select()
        .from(healthcareIntegration)
        .where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.data_sharing_consent, true)
        ))
        .orderBy(desc(healthcareIntegration.created_at));

      return configs;
    } catch (error) {
      console.error('Error getting data sharing configs:', error);
      throw new Error(`Failed to get data sharing configs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate health data for professional sharing
   */
  async generateProfessionalReport(userId: number, professionalId: string, reportType: string) {
    try {
      const [healthScoresData, realTimeMetrics, predictions, reports] = await Promise.all([
        this.getHealthScoresForProfessional(userId, professionalId),
        this.getRealTimeMetricsForProfessional(userId, professionalId),
        this.getPredictionsForProfessional(userId, professionalId),
        this.getReportsForProfessional(userId, professionalId)
      ]);

      const report = {
        userId,
        professionalId,
        reportType,
        generatedAt: new Date(),
        data: {
          healthScores: Array.isArray(healthScoresData) ? healthScoresData : [],
          realTimeMetrics: Array.isArray(realTimeMetrics) ? realTimeMetrics : [],
          predictions: Array.isArray(predictions) ? predictions : [],
          reports: Array.isArray(reports) ? reports : []
        },
        summary: this.generateProfessionalSummary(
          Array.isArray(healthScoresData) ? healthScoresData : [],
          Array.isArray(realTimeMetrics) ? realTimeMetrics : [],
          Array.isArray(predictions) ? predictions : [],
          Array.isArray(reports) ? reports : []
        )
      };

      return report;
    } catch (error) {
      console.error('Error generating professional report:', error);
      throw new Error(`Failed to generate professional report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create healthcare session
   */
  async createHealthcareSession(session: HealthcareSession) {
    try {
      const result = await db.execute(
        `INSERT INTO healthcare_integration
         (user_id, professional_id, professional_name, professional_type, practice_name, access_level, data_sharing_consent, shared_data, notes, is_active, acknowledged, created_at, updated_at)
         VALUES (${session.userId}, '${session.professionalId}', 'Healthcare Provider', 'doctor', ${session.practiceName || null}, 'read_only', true, '${JSON.stringify({
          sessionType: session.sessionType,
          duration: session.duration,
          status: session.status,
          sessionDate: session.sessionDate,
          notes: session.notes,
          recommendations: session.recommendations
        })}', ${session.notes || null}, true, false, '${new Date().toISOString()}', '${new Date().toISOString()}')`
      );

      return { id: (result as any).insertId, userId: session.userId, professionalId: session.professionalId, sessionType: session.sessionType, sessionDate: session.sessionDate, duration: session.duration, notes: session.notes, recommendations: session.recommendations, status: session.status, createdAt: session.createdAt, updatedAt: session.updatedAt };
    } catch (error) {
      console.error('Error creating healthcare session:', error);
      throw new Error(`Failed to create healthcare session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get healthcare sessions for a user
   */
  async getUserSessions(userId: number) {
    try {
      const sessions = await db
        .select()
        .from(healthcareIntegration)
        .where(eq(healthcareIntegration.user_id, userId))
        .orderBy(desc(healthcareIntegration.created_at));

      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create healthcare alert
   */
  async createHealthcareAlert(alert: HealthcareAlert) {
    try {
      const result = await db.execute(
        `INSERT INTO healthcare_integration
         (user_id, professional_id, professional_name, professional_type, practice_name, access_level, data_sharing_consent, shared_data, notes, is_active, acknowledged, created_at, updated_at)
         VALUES (${alert.userId}, '${alert.professionalId || 'system'}', 'Healthcare System', 'system', 'AI Calorie Tracker', 'read_only', false, '${JSON.stringify({
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          data: alert.data
        })}', '${alert.description}', true, ${alert.acknowledged}, '${alert.createdAt || new Date().toISOString()}', '${new Date().toISOString()}')`
      );

      return { id: (result as any).insertId, userId: alert.userId, professionalId: alert.professionalId, alertType: alert.alertType, severity: alert.severity, title: alert.title, description: alert.description, data: alert.data, acknowledged: alert.acknowledged, acknowledgedAt: alert.acknowledgedAt, createdAt: alert.createdAt };
    } catch (error) {
      console.error('Error creating healthcare alert:', error);
      throw new Error(`Failed to create healthcare alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get healthcare alerts for a user
   */
  async getUserAlerts(userId: number) {
    try {
      const alerts = await db
        .select()
        .from(healthcareIntegration)
        .where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.acknowledged, false)
        ))
        .orderBy(desc(healthcareIntegration.created_at));

      return alerts;
    } catch (error) {
      console.error('Error getting user alerts:', error);
      throw new Error(`Failed to get user alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Acknowledge healthcare alert
   */
  async acknowledgeAlert(alertId: number, userId: number) {
    try {
      await db.execute(
        `UPDATE healthcare_integration
         SET acknowledged = true,
             acknowledged_at = '${new Date().toISOString()}'
         WHERE id = ${alertId} AND user_id = ${userId}`
      );

      // Return the acknowledged alert
      const [alert] = await db.execute(`SELECT * FROM healthcare_integration WHERE id = ${alertId} AND user_id = ${userId}`);
      return alert || null;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error(`Failed to acknowledge alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available healthcare providers
   */
  async getAvailableProviders(searchTerm?: string, type?: string) {
    try {
      // Use the real healthcare provider service
      const searchOptions: any = {};
      if (searchTerm) searchOptions.searchTerm = searchTerm;
      if (type) searchOptions.type = type;

      const response = await healthcareProviderService.searchProviders(searchOptions);
      
      // Transform external API response to our format
      const providers: HealthcareProvider[] = response.providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        specialty: provider.specialty,
        practiceName: provider.practiceName,
        email: provider.email,
        phone: provider.phone,
        address: provider.address,
        verified: provider.verified,
        rating: provider.rating,
        reviewCount: provider.reviewCount
      }));

      return providers;
    } catch (error) {
      console.error('Error getting available providers:', error);
      // Fallback to mock data if API fails
      return await healthcareProviderService.getFallbackProviders(searchTerm, type);
    }
  }

  /**
   * Get provider details by ID
   */
  async getProviderById(providerId: string) {
    try {
      const provider = await healthcareProviderService.getProviderById(providerId);
      if (!provider) {
        return null;
      }

      // Transform external API response to our format
      return {
        id: provider.id,
        name: provider.name,
        type: provider.type,
        specialty: provider.specialty,
        practiceName: provider.practiceName,
        email: provider.email,
        phone: provider.phone,
        address: provider.address,
        verified: provider.verified,
        rating: provider.rating,
        reviewCount: provider.reviewCount
      };
    } catch (error) {
      console.error('Error getting provider by ID:', error);
      throw new Error(`Failed to get provider by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user has active integration with a provider
   */
  async hasActiveIntegration(userId: number, professionalId: string) {
    try {
      const integration = await db
        .select()
        .from(healthcareIntegration)
        .where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.professional_id, professionalId),
          eq(healthcareIntegration.data_sharing_consent, true)
        ))
        .limit(1);

      return integration.length > 0;
    } catch (error) {
      console.error('Error checking active integration:', error);
      throw new Error(`Failed to check active integration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get shared data for a professional
   */
  async getSharedDataForProfessional(userId: number, professionalId: string, dataType?: string) {
    try {
      const integration = await db
        .select()
        .from(healthcareIntegration)
        .where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.professional_id, professionalId),
          eq(healthcareIntegration.data_sharing_consent, true)
        ))
        .limit(1);

      if (!integration.length) {
        return null;
      }

      const sharedData = integration[0].shared_data || {};
      
      if (dataType) {
        return (sharedData as any)[dataType] || null;
      }

      return sharedData;
    } catch (error) {
      console.error('Error getting shared data:', error);
      throw new Error(`Failed to get shared data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update shared data
   */
  async updateSharedData(userId: number, professionalId: string, dataType: string, data: any) {
    try {
      const integration = await db
        .select()
        .from(healthcareIntegration)
        .where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.professional_id, professionalId),
          eq(healthcareIntegration.data_sharing_consent, true)
        ))
        .limit(1);

      if (!integration.length) {
        throw new Error('No active integration found');
      }

      const currentData = integration[0].shared_data || {};
      (currentData as any)[dataType] = data;

      await db.execute(
        `UPDATE healthcare_integration
         SET shared_data = '${JSON.stringify(currentData)}',
             updated_at = '${new Date().toISOString()}'
         WHERE user_id = ${userId} AND professional_id = '${professionalId}'`
      );

      // Return the updated integration
      const [updated] = await db.execute(`SELECT * FROM healthcare_integration WHERE user_id = ${userId} AND professional_id = '${professionalId}'`);
      return (updated as any)[0] || null;
    } catch (error) {
      console.error('Error updating shared data:', error);
      throw new Error(`Failed to update shared data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get integration statistics
   */
  async getIntegrationStats(userId: number) {
    try {
      const [totalIntegrations, activeIntegrations, sharedReports, totalAlerts] = await Promise.all([
        // Total integrations
        db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(eq(healthcareIntegration.user_id, userId)),
        
        // Active integrations
        db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.data_sharing_consent, true)
        )),
        
        // Shared reports
        db.execute(`SELECT COUNT(*) as count FROM health_reports WHERE user_id = ${userId} AND shared_at IS NOT NULL`),
        
        // Total alerts
        db.select({ count: sql`COUNT(*)` }).from(healthcareIntegration).where(and(
          eq(healthcareIntegration.user_id, userId),
          eq(healthcareIntegration.acknowledged, false)
        ))
      ]);

      return {
        totalIntegrations: (totalIntegrations as any)[0].count,
        activeIntegrations: (activeIntegrations as any)[0].count,
        sharedReports: (sharedReports as any)[0].count,
        pendingAlerts: (totalAlerts as any)[0].count,
        integrationRate: (activeIntegrations as any)[0].count > 0 ? (((activeIntegrations as any)[0].count / (totalIntegrations as any)[0].count) * 100).toFixed(1) : '0'
      };
    } catch (error) {
      console.error('Error getting integration stats:', error);
      throw new Error(`Failed to get integration stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper methods
   */
  private async getHealthScoresForProfessional(userId: number, professionalId: string) {
    const thirtyDaysAgo = subDays(new Date(), 30);
    
    const [scores] = await db.execute(
      `SELECT * FROM health_scores
       WHERE user_id = ${userId} AND calculation_date >= '${thirtyDaysAgo.toISOString()}'
       ORDER BY calculation_date`
    );
    return scores;
  }

  private async getRealTimeMetricsForProfessional(userId: number, professionalId: string) {
    const sevenDaysAgo = subDays(new Date(), 7);
    
    const [metrics] = await db.execute(
      `SELECT * FROM real_time_monitoring
       WHERE user_id = ${userId} AND timestamp >= '${sevenDaysAgo.toISOString()}'
       ORDER BY timestamp`
    );
    return metrics;
  }

  private async getPredictionsForProfessional(userId: number, professionalId: string) {
    const [predictions] = await db.execute(
      `SELECT * FROM health_predictions
       WHERE user_id = ${userId} AND is_active = true
       ORDER BY created_at`
    );
    return predictions;
  }

  private async getReportsForProfessional(userId: number, professionalId: string) {
    const [reports] = await db.execute(
      `SELECT * FROM health_reports
       WHERE user_id = ${userId} AND professional_id = '${professionalId}'
       ORDER BY generated_at`
    );
    return reports;
  }

  private generateProfessionalSummary(healthScores: any[], realTimeMetrics: any[], predictions: any[], reports: any[]): string {
    const avgOverallScore = healthScores.length > 0
      ? healthScores.filter(s => s.score_type === 'overall').reduce((sum, s) => sum + s.score_value, 0) / healthScores.filter(s => s.score_type === 'overall').length
      : 0;

    const totalMetrics = realTimeMetrics.length;
    const activePredictions = predictions.length;
    const sharedReports = reports.length;

    return `
This comprehensive health report summarizes the patient's health data over the past 30 days.
The overall health score averaged ${avgOverallScore.toFixed(1)} out of 100, with ${totalMetrics} real-time metrics tracked and ${activePredictions} active health predictions.
${sharedReports} reports have been shared with healthcare providers for professional review.
    `.trim();
  }
}