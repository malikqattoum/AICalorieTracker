import { Router } from 'express';
import { z } from 'zod';
import { db } from '../../db';
import { 
  realTimeMonitoring, 
  healthScores,
  healthPredictions
} from '../../migrations/002_create_premium_analytics_tables';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { RealTimeMonitoringService } from '../../services/realTimeMonitoringService';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const monitoringService = new RealTimeMonitoringService();

// Schema for adding real-time metric
const addMetricSchema = z.object({
  metricType: z.enum(['heart_rate', 'blood_pressure', 'blood_oxygen', 'sleep_quality', 'stress_level', 'activity_level']),
  metricValue: z.number(),
  unit: z.string(),
  timestamp: z.string().optional(),
  metadata: z.any().optional()
});

// Schema for creating alert configuration
const createAlertSchema = z.object({
  metricType: z.string(),
  condition: z.enum(['greater_than', 'less_than', 'equals', 'not_equals']),
  threshold: z.number(),
  operator: z.enum(['and', 'or']),
  action: z.enum(['notification', 'email', 'sms', 'emergency']),
  isActive: z.boolean(),
  name: z.string().min(1),
  description: z.string().optional()
});

// Schema for creating monitoring session
const createSessionSchema = z.object({
  sessionType: z.enum(['continuous', 'periodic', 'event_based']),
  startTime: z.string(),
  endTime: z.string().optional(),
  status: z.enum(['active', 'completed', 'paused', 'ended']),
  metrics: z.array(z.string()),
  alertConfigs: z.array(z.any()).optional(),
  metadata: z.any().optional()
});

// Add real-time metric
router.post('/metrics', authenticate, validateRequest(addMetricSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const { metricType, metricValue, unit, timestamp, metadata } = req.body;

    const metric = await monitoringService.addMetric({
      userId,
      metricType,
      metricValue,
      unit,
      timestamp: timestamp ? new Date(timestamp) : undefined,
      metadata
    });

    res.json({ success: true, data: metric });
  } catch (error) {
    console.error('Error adding real-time metric:', error);
    res.status(500).json({ success: false, message: 'Failed to add real-time metric' });
  }
});

// Get real-time metrics for the authenticated user
router.get('/metrics', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { metricType, timeRange } = req.query;

    const metrics = await monitoringService.getUserMetrics(
      userId,
      metricType as string,
      timeRange as 'hour' | 'day' | 'week' | 'month'
    );

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to get real-time metrics' });
  }
});

// Get latest metrics for the authenticated user
router.get('/metrics/latest', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const latestMetrics = await monitoringService.getLatestMetrics(userId);

    res.json({ success: true, data: latestMetrics });
  } catch (error) {
    console.error('Error getting latest metrics:', error);
    res.status(500).json({ success: false, message: 'Failed to get latest metrics' });
  }
});

// Get real-time dashboard data
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const dashboardData = await monitoringService.getDashboardData(userId);

    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ success: false, message: 'Failed to get dashboard data' });
  }
});

// Get metric statistics
router.get('/metrics/:metricType/statistics', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { metricType } = req.params;
    const { timeRange = 'day' } = req.query;

    const statistics = await monitoringService.getMetricStatistics(
      userId,
      metricType,
      timeRange as 'hour' | 'day' | 'week' | 'month'
    );

    res.json({ success: true, data: statistics });
  } catch (error) {
    console.error('Error getting metric statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to get metric statistics' });
  }
});

// Get real-time trends
router.get('/trends', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { metricTypes, timeRange = 'day' } = req.query;

    if (!metricTypes || typeof metricTypes !== 'string') {
      return res.status(400).json({ success: false, message: 'metricTypes parameter is required' });
    }

    const trends = await monitoringService.getRealTimeTrends(
      userId,
      metricTypes.split(','),
      timeRange as 'hour' | 'day' | 'week' | 'month'
    );

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error('Error getting real-time trends:', error);
    res.status(500).json({ success: false, message: 'Failed to get real-time trends' });
  }
});

// Create monitoring session
router.post('/sessions', authenticate, validateRequest(createSessionSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const sessionData = {
      ...req.body,
      userId,
      startTime: new Date(req.body.startTime),
      endTime: req.body.endTime ? new Date(req.body.endTime) : undefined
    };

    const session = await monitoringService.createSession(sessionData);

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error creating monitoring session:', error);
    res.status(500).json({ success: false, message: 'Failed to create monitoring session' });
  }
});

// Get active monitoring sessions
router.get('/sessions/active', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const sessions = await monitoringService.getActiveSessions(userId);

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({ success: false, message: 'Failed to get active sessions' });
  }
});

// Update monitoring session
router.put('/sessions/:sessionId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const sessionId = parseInt(req.params.sessionId);

    if (isNaN(sessionId)) {
      return res.status(400).json({ success: false, message: 'Invalid session ID' });
    }

    const updates = {
      ...req.body,
      updatedAt: new Date()
    };

    const session = await monitoringService.updateSession(sessionId, updates);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Monitoring session not found' });
    }

    res.json({ success: true, data: session });
  } catch (error) {
    console.error('Error updating monitoring session:', error);
    res.status(500).json({ success: false, message: 'Failed to update monitoring session' });
  }
});

// Create alert configuration
router.post('/alerts', authenticate, validateRequest(createAlertSchema), async (req, res) => {
  try {
    const userId = req.user!.id;
    const alertConfig = {
      ...req.body,
      userId
    };

    const alert = await monitoringService.createAlertConfig(alertConfig);

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error creating alert configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to create alert configuration' });
  }
});

// Get alert configurations
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const alerts = await monitoringService.getAlertConfigs(userId);

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error getting alert configurations:', error);
    res.status(500).json({ success: false, message: 'Failed to get alert configurations' });
  }
});

// Update alert configuration
router.put('/alerts/:alertId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const alertId = parseInt(req.params.alertId);

    if (isNaN(alertId)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID' });
    }

    const alert = await monitoringService.updateAlertConfig(alertId, userId, req.body);

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert configuration not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error updating alert configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to update alert configuration' });
  }
});

// Delete alert configuration
router.delete('/alerts/:alertId', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const alertId = parseInt(req.params.alertId);

    if (isNaN(alertId)) {
      return res.status(400).json({ success: false, message: 'Invalid alert ID' });
    }

    const deleted = await monitoringService.deleteAlertConfig(alertId, userId);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Alert configuration not found' });
    }

    res.json({ success: true, message: 'Alert configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to delete alert configuration' });
  }
});

// Get active alerts
router.get('/alerts/active', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;

    const alerts = await monitoringService.getActiveAlerts(userId);

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    res.status(500).json({ success: false, message: 'Failed to get active alerts' });
  }
});

// Simulate real-time metric (for testing)
router.post('/simulate-metric', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { metricType, metricValue, unit } = req.body;

    // Generate random metric values for simulation
    const simulatedValue = metricValue || Math.floor(Math.random() * 100) + 50;
    const simulatedUnit = unit || 'bpm';

    const metric = await monitoringService.addMetric({
      userId,
      metricType,
      metricValue: simulatedValue,
      unit: simulatedUnit,
      timestamp: new Date(),
      metadata: {
        simulated: true,
        source: 'api_simulation'
      }
    });

    res.json({ success: true, data: metric, message: 'Metric simulated successfully' });
  } catch (error) {
    console.error('Error simulating metric:', error);
    res.status(500).json({ success: false, message: 'Failed to simulate metric' });
  }
});

// Get health scores for real-time context
router.get('/health-scores', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { timeRange = 'week' } = req.query;

    let startDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const healthScoresData = await db
      .select()
      .from(healthScores)
      .where(and(
        eq(healthScores.userId, userId),
        gte(healthScores.calculationDate, startDate)
      ))
      .orderBy(desc(healthScores.calculationDate));

    res.json({ success: true, data: healthScoresData });
  } catch (error) {
    console.error('Error getting health scores:', error);
    res.status(500).json({ success: false, message: 'Failed to get health scores' });
  }
});

// Get health predictions for real-time context
router.get('/health-predictions', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { timeRange = 'week' } = req.query;

    let startDate: Date;
    const now = new Date();
    
    switch (timeRange) {
      case 'hour':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const predictionsData = await db
      .select()
      .from(healthPredictions)
      .where(and(
        eq(healthPredictions.userId, userId),
        gte(healthPredictions.createdAt, startDate)
      ))
      .orderBy(desc(healthPredictions.createdAt));

    res.json({ success: true, data: predictionsData });
  } catch (error) {
    console.error('Error getting health predictions:', error);
    res.status(500).json({ success: false, message: 'Failed to get health predictions' });
  }
});

export default router;