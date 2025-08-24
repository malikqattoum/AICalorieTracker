import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { defaultPerformanceMonitor as performanceMonitor } from '../utils/performanceMonitor';
import { errorTrackingService } from '../services/errorTrackingService';
import { Logger } from '../utils/logger';

const router = Router();
const logger = new Logger('Analytics');

// All analytics routes require authentication
router.use(authenticate);

// System Performance Analytics
// GET /api/analytics/performance
router.get('/performance', async (req, res) => {
  try {
    const stats = await performanceMonitor.getPerformanceStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get performance stats', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/performance/slow-endpoints
router.get('/performance/slow-endpoints', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 1000; // 1 second default
    const slowEndpoints = await performanceMonitor.getSlowEndpoints(threshold);
    
    res.json({
      success: true,
      data: {
        threshold,
        endpoints: slowEndpoints,
        count: slowEndpoints.length
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get slow endpoints', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve slow endpoints analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Database Analytics
// GET /api/analytics/database
router.get('/database', async (req, res) => {
  try {
    const stats = await performanceMonitor.getDatabaseStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get database stats', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// External API Analytics
// GET /api/analytics/external-apis
router.get('/external-apis', async (req, res) => {
  try {
    const stats = await performanceMonitor.getExternalApiStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get external API stats', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve external API analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// AI Service Analytics
// GET /api/analytics/ai-services
router.get('/ai-services', async (req, res) => {
  try {
    const stats = await performanceMonitor.getAiServiceStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get AI service stats', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI service analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Error Analytics
// GET /api/analytics/errors
router.get('/errors', async (req, res) => {
  try {
    const errorStats = errorTrackingService.getStats();
    res.json({
      success: true,
      data: errorStats,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get error stats', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve error analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// System Health Check
// GET /api/analytics/health
router.get('/health', async (req, res) => {
  try {
    const healthMetrics = {
      timestamp: new Date(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      environment: process.env.NODE_ENV,
      version: process.version,
      platform: process.platform
    };

    res.json({
      success: true,
      data: healthMetrics,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get health metrics', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve health metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User Activity Analytics
// GET /api/analytics/user-activity
router.get('/user-activity', async (req, res) => {
  try {
    const { userId, startDate, endDate, limit } = req.query;
    
    // This would typically query the database for user activity
    // For now, we'll return mock data
    const activityData = {
      userId,
      startDate,
      endDate,
      limit,
      activities: [
        {
          id: 1,
          type: 'meal_logged',
          timestamp: new Date(),
          details: { mealType: 'breakfast', calories: 350 }
        },
        {
          id: 2,
          type: 'workout_completed',
          timestamp: new Date(),
          details: { workoutType: 'running', duration: 30, caloriesBurned: 300 }
        }
      ]
    };

    res.json({
      success: true,
      data: activityData,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get user activity analytics', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user activity analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Dashboard Overview
// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [performanceStats, errorStats, healthMetrics] = await Promise.all([
      performanceMonitor.getPerformanceStats(),
      errorTrackingService.getStats(),
      {
        timestamp: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    ]);

    const dashboardData = {
      performance: performanceStats,
      errors: errorStats,
      health: healthMetrics,
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to get dashboard analytics', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear Analytics Data (Admin only)
// DELETE /api/analytics/clear
router.delete('/clear', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Clear performance metrics
    performanceMonitor.clearMetrics();
    
    // Clear error tracking data
    errorTrackingService.clearQueue();

    logger.info('Analytics data cleared by admin', { userId: req.user.id });
    
    res.json({
      success: true,
      message: 'Analytics data cleared successfully',
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Failed to clear analytics data', error);
    errorTrackingService.trackError(error as Error, {
      timestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to clear analytics data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;