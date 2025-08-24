import { Router } from 'express';
import { z } from 'zod';
import db from '../../db';
import { 
  healthcareIntegration, 
  healthReports,
  healthScores,
  healthPredictions,
  realTimeMonitoring
} from '../../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { HealthcareIntegrationService } from '../../services/healthcareIntegrationService';
import { authenticate } from '../../middleware/auth';
// import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const healthcareService = new HealthcareIntegrationService();

// Schema for creating healthcare integration
const createIntegrationSchema = z.object({
  professionalId: z.string(),
  professionalName: z.string(),
  professionalType: z.enum(['doctor', 'nutritionist', 'fitness_coach', 'therapist']),
  practiceName: z.string().optional(),
  accessLevel: z.enum(['read_only', 'read_write', 'full_access']),
  dataSharingConsent: z.boolean(),
  dataExpirationDate: z.string().optional(),
  sharedData: z.any().optional(),
  notes: z.string().optional()
});

// Schema for updating healthcare integration
const updateIntegrationSchema = z.object({
  accessLevel: z.enum(['read_only', 'read_write', 'full_access']).optional(),
  dataSharingConsent: z.boolean().optional(),
  dataExpirationDate: z.string().optional(),
  sharedData: z.any().optional(),
  notes: z.string().optional()
});

// Schema for creating healthcare session
const createSessionSchema = z.object({
  professionalId: z.string(),
  sessionType: z.enum(['consultation', 'follow_up', 'emergency', 'routine_check']),
  sessionDate: z.string(),
  duration: z.number(),
  notes: z.string().optional(),
  recommendations: z.array(z.string()).optional(),
  sharedData: z.any().optional()
});

// Schema for creating healthcare alert
const createAlertSchema = z.object({
  professionalId: z.string(),
  alertType: z.enum(['health_risk', 'metric_anomaly', 'goal_milestone', 'emergency']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  data: z.any().optional()
});

// Get user's healthcare integrations
router.get('/integrations', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrations = await healthcareService.getUserIntegrations(userId);

    res.json({ success: true, data: integrations });
  } catch (error) {
    console.error('Error getting healthcare integrations:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare integrations' });
  }
});

// Create healthcare integration
router.post('/integrations', authenticate, validateRequest(createIntegrationSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationData = {
      ...req.body,
      userId
    };

    const integration = await healthcareService.createHealthcareIntegration(integrationData);

    res.json({ success: true, data: integration, message: 'Healthcare integration created successfully' });
  } catch (error) {
    console.error('Error creating healthcare integration:', error);
    res.status(500).json({ success: false, message: 'Failed to create healthcare integration' });
  }
});

// Get healthcare integration by ID
router.get('/integrations/:integrationId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationId = parseInt(req.params.integrationId);

    if (isNaN(integrationId)) {
      return res.status(400).json({ success: false, message: 'Invalid integration ID' });
    }

    const integration = await healthcareService.getIntegrationById(integrationId, userId);

    if (!integration) {
      return res.status(404).json({ success: false, message: 'Healthcare integration not found' });
    }

    res.json({ success: true, data: integration });
  } catch (error) {
    console.error('Error getting healthcare integration:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare integration' });
  }
});

// Update healthcare integration
router.put('/integrations/:integrationId', authenticate, validateRequest(updateIntegrationSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationId = parseInt(req.params.integrationId);

    if (isNaN(integrationId)) {
      return res.status(400).json({ success: false, message: 'Invalid integration ID' });
    }

    const integration = await healthcareService.updateHealthcareIntegration(integrationId, userId, req.body);

    if (!integration) {
      return res.status(404).json({ success: false, message: 'Healthcare integration not found' });
    }

    res.json({ success: true, data: integration, message: 'Healthcare integration updated successfully' });
  } catch (error) {
    console.error('Error updating healthcare integration:', error);
    res.status(500).json({ success: false, message: 'Failed to update healthcare integration' });
  }
});

// Delete healthcare integration
router.delete('/integrations/:integrationId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationId = parseInt(req.params.integrationId);

    if (isNaN(integrationId)) {
      return res.status(400).json({ success: false, message: 'Invalid integration ID' });
    }

    const integration = await healthcareService.deleteHealthcareIntegration(integrationId, userId);

    if (!integration) {
      return res.status(404).json({ success: false, message: 'Healthcare integration not found' });
    }

    res.json({ success: true, message: 'Healthcare integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting healthcare integration:', error);
    res.status(500).json({ success: false, message: 'Failed to delete healthcare integration' });
  }
});

// Get available healthcare providers
router.get('/providers', authenticate, async (req, res) => {
  try {
    const { search, type } = req.query;
    const providers = await healthcareService.getAvailableProviders(
      search as string,
      type as string
    );

    res.json({ success: true, data: providers });
  } catch (error) {
    console.error('Error getting healthcare providers:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare providers' });
  }
});

// Get healthcare provider details
router.get('/providers/:providerId', authenticate, async (req, res) => {
  try {
    const providerId = req.params.providerId;
    const provider = await healthcareService.getProviderById(providerId);

    if (!provider) {
      return res.status(404).json({ success: false, message: 'Healthcare provider not found' });
    }

    res.json({ success: true, data: provider });
  } catch (error) {
    console.error('Error getting healthcare provider:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare provider' });
  }
});

// Check if user has active integration with provider
router.get('/integrations/check/:professionalId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const professionalId = req.params.professionalId;

    const hasActiveIntegration = await healthcareService.hasActiveIntegration(userId, professionalId);

    res.json({ success: true, data: { hasActiveIntegration } });
  } catch (error) {
    console.error('Error checking active integration:', error);
    res.status(500).json({ success: false, message: 'Failed to check active integration' });
  }
});

// Get shared data for professional
router.get('/shared-data/:professionalId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const professionalId = req.params.professionalId;
    const { dataType } = req.query;

    const sharedData = await healthcareService.getSharedDataForProfessional(
      userId,
      professionalId,
      dataType as string
    );

    res.json({ success: true, data: sharedData });
  } catch (error) {
    console.error('Error getting shared data:', error);
    res.status(500).json({ success: false, message: 'Failed to get shared data' });
  }
});

// Update shared data
router.put('/shared-data/:professionalId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const professionalId = req.params.professionalId;
    const { dataType } = req.query;

    if (!dataType) {
      return res.status(400).json({ success: false, message: 'Data type is required' });
    }

    const updatedIntegration = await healthcareService.updateSharedData(
      userId,
      professionalId,
      dataType as string,
      req.body
    );

    res.json({ success: true, data: updatedIntegration, message: 'Shared data updated successfully' });
  } catch (error) {
    console.error('Error updating shared data:', error);
    res.status(500).json({ success: false, message: 'Failed to update shared data' });
  }
});

// Get healthcare sessions
router.get('/sessions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const sessions = await healthcareService.getUserSessions(userId);

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error getting healthcare sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare sessions' });
  }
});

// Create healthcare session
router.post('/sessions', authenticate, validateRequest(createSessionSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const sessionData = {
      ...req.body,
      userId,
      status: 'scheduled' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const session = await healthcareService.createHealthcareSession(sessionData);

    res.json({ success: true, data: session, message: 'Healthcare session created successfully' });
  } catch (error) {
    console.error('Error creating healthcare session:', error);
    res.status(500).json({ success: false, message: 'Failed to create healthcare session' });
  }
});

// Get healthcare alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const alerts = await healthcareService.getUserAlerts(userId);

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error getting healthcare alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare alerts' });
  }
});

// Create healthcare alert
router.post('/alerts', authenticate, validateRequest(createAlertSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const alertData = {
      ...req.body,
      userId,
      acknowledged: false,
      createdAt: new Date()
    };

    const alert = await healthcareService.createHealthcareAlert(alertData);

    res.json({ success: true, data: alert, message: 'Healthcare alert created successfully' });
  } catch (error) {
    console.error('Error creating healthcare alert:', error);
    res.status(500).json({ success: false, message: 'Failed to create healthcare alert' });
  }
});

// Acknowledge healthcare alert
router.put('/alerts/:alertId/acknowledge', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const alertId = parseInt(req.params.alertId);

    if (isNaN(alertId)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID' });
    }

    const alert = await healthcareService.acknowledgeAlert(alertId, userId);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Healthcare alert not found' });
    }

    res.json({ success: true, data: alert, message: 'Healthcare alert acknowledged' });
  } catch (error) {
    console.error('Error acknowledging healthcare alert:', error);
    res.status(500).json({ success: false, message: 'Failed to acknowledge healthcare alert' });
  }
});

// Generate professional report
router.post('/reports/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { professionalId, reportType } = req.body;

    if (!professionalId || !reportType) {
      return res.status(400).json({ success: false, message: 'Professional ID and report type are required' });
    }

    const report = await healthcareService.generateProfessionalReport(userId, professionalId, reportType);

    res.json({ success: true, data: report, message: 'Professional report generated successfully' });
  } catch (error) {
    console.error('Error generating professional report:', error);
    res.status(500).json({ success: false, message: 'Failed to generate professional report' });
  }
});

// Get healthcare integration statistics
router.get('/statistics', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await healthcareService.getIntegrationStats(userId);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error getting healthcare statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get healthcare statistics' });
  }
});

// Get data sharing configurations
router.get('/data-sharing', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const configs = await healthcareService.getDataSharingConfigs(userId);

    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error getting data sharing configs:', error);
    res.status(500).json({ success: false, message: 'Failed to get data sharing configurations' });
  }
});

// Create data sharing configuration
router.post('/data-sharing', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const configData = {
      ...req.body,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const config = await healthcareService.createDataSharingConfig(configData);

    res.json({ success: true, data: config, message: 'Data sharing configuration created successfully' });
  } catch (error) {
    console.error('Error creating data sharing config:', error);
    res.status(500).json({ success: false, message: 'Failed to create data sharing configuration' });
  }
});

// Get professional dashboard data
router.get('/professional/:professionalId/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const professionalId = req.params.professionalId;

    // Check if user has access to this professional's data
    const hasAccess = await healthcareService.hasActiveIntegration(userId, professionalId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [sharedData, reports, alerts] = await Promise.all([
      healthcareService.getSharedDataForProfessional(userId, professionalId),
      // healthcareService.getReportsForProfessional(userId, professionalId),
      healthcareService.getUserAlerts(userId)
    ]);

    const dashboard = {
      sharedData,
      reports,
      alerts,
      lastUpdated: new Date()
    };

    res.json({ success: true, data: dashboard });
  } catch (error) {
    console.error('Error getting professional dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to get professional dashboard' });
  }
});

// Export healthcare data
router.get('/export', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { format = 'json', professionalId } = req.query;

    const [integrations, healthScoresData, reports, sessions] = await Promise.all([
      healthcareService.getUserIntegrations(userId),
      db.select().from(healthScores).where(eq(healthScores.userId, userId)),
      db.select().from(healthReports).where(eq(healthReports.userId, userId)),
      healthcareService.getUserSessions(userId)
    ]);

    const healthScores = healthScoresData.map(score => ({
      ...score,
      userId: score.user_id // Fix property name mismatch
    }));

    const exportData = {
      integrations,
      healthScores,
      reports,
      sessions,
      exportDate: new Date(),
      userId
    };

    switch (format) {
      case 'json':
        res.json({ success: true, data: exportData });
        break;
      
      case 'pdf':
        // In a real implementation, you would generate a PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=healthcare-data-${userId}.pdf`);
        res.send('PDF content would be generated here');
        break;
      
      default:
        res.status(400).json({ success: false, message: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting healthcare data:', error);
    res.status(500).json({ success: false, message: 'Failed to export healthcare data' });
  }
});

export default router;