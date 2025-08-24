import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { premiumAnalyticsController } from '../controllers/premiumAnalyticsController';
import ValidationService from '../services/validation';

const router = Router();

// All premium analytics routes require authentication
router.use(authenticate);

// Health Scores Endpoints
// GET /api/premium-analytics/health-scores
router.get('/health-scores', 
  ValidationService.validate({
    scoreTypes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false },
    limit: { type: 'number', required: false, min: 1 }
  }),
  premiumAnalyticsController.getHealthScores
);

// POST /api/premium-analytics/health-scores/calculate
router.post('/health-scores/calculate',
  ValidationService.validate({
    includeNutrition: { type: 'boolean', required: false },
    includeFitness: { type: 'boolean', required: false },
    includeRecovery: { type: 'boolean', required: false },
    includeConsistency: { type: 'boolean', required: false },
    calculationDate: { type: 'string', required: false }
  }),
  premiumAnalyticsController.calculateHealthScores
);

// Health Predictions Endpoints
// GET /api/premium-analytics/predictions
router.get('/predictions',
  ValidationService.validate({
    predictionTypes: { type: 'string', required: false },
    isActive: { type: 'boolean', required: false },
    limit: { type: 'number', required: false, min: 1 }
  }),
  premiumAnalyticsController.getPredictions
);

// POST /api/premium-analytics/predictions/generate
router.post('/predictions/generate',
  ValidationService.validate({
    predictionType: { type: 'string', required: true },
    targetDate: { type: 'string', required: true },
    modelVersion: { type: 'string', required: false }
  }),
  premiumAnalyticsController.generateHealthPrediction
);

// Pattern Analysis Endpoints
// GET /api/premium-analytics/patterns
router.get('/patterns',
  ValidationService.validate({
    patternTypes: { type: 'string', required: false },
    analysisPeriod: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getPatternAnalysis
);

// POST /api/premium-analytics/patterns/analyze
router.post('/patterns/analyze',
  ValidationService.validate({
    patternType: { type: 'string', required: true },
    analysisPeriod: { type: 'string', required: true },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false }
  }),
  premiumAnalyticsController.analyzePatterns
);

// Health Reports Endpoints
// GET /api/premium-analytics/reports
router.get('/reports',
  ValidationService.validate({
    reportTypes: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false },
    accessLevel: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getHealthReports
);

// POST /api/premium-analytics/reports/generate
router.post('/reports/generate',
  ValidationService.validate({
    reportType: { type: 'string', required: true },
    reportPeriodStart: { type: 'string', required: true },
    reportPeriodEnd: { type: 'string', required: true },
    generatedBy: { type: 'string', required: false }
  }),
  premiumAnalyticsController.generateHealthReport
);

// GET /api/premium-analytics/reports/:id
router.get('/reports/:id',
  ValidationService.validate({
    id: { type: 'number', required: true }
  }),
  premiumAnalyticsController.getHealthReportById
);

// Real-time Monitoring Endpoints
// GET /api/premium-analytics/monitoring/live
router.get('/monitoring/live',
  ValidationService.validate({
    metricTypes: { type: 'string', required: false },
    limit: { type: 'number', required: false, min: 1 }
  }),
  premiumAnalyticsController.getLiveMonitoringData
);

// POST /api/premium-analytics/monitoring/record
router.post('/monitoring/record',
  ValidationService.validate({
    metricType: { type: 'string', required: true },
    metricValue: { type: 'number', required: true },
    unit: { type: 'string', required: true },
    timestamp: { type: 'string', required: false },
    metadata: { type: 'string', required: false }
  }),
  premiumAnalyticsController.recordMonitoringData
);

// GET /api/premium-analytics/monitoring/alerts
router.get('/monitoring/alerts',
  ValidationService.validate({
    isActive: { type: 'boolean', required: false },
    limit: { type: 'number', required: false, min: 1 }
  }),
  premiumAnalyticsController.getMonitoringAlerts
);

// Healthcare Integration Endpoints
// GET /api/premium-analytics/healthcare/professionals
router.get('/healthcare/professionals',
  ValidationService.validate({
    professionalTypes: { type: 'string', required: false },
    status: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getHealthcareProfessionals
);

// POST /api/premium-analytics/healthcare/professionals
router.post('/healthcare/professionals',
  ValidationService.validate({
    professionalId: { type: 'string', required: true },
    professionalType: { type: 'string', required: true },
    professionalName: { type: 'string', required: true },
    practiceName: { type: 'string', required: false },
    accessLevel: { type: 'string', required: true },
    dataSharingConsent: { type: 'boolean', required: true },
    dataExpirationDate: { type: 'string', required: false },
    sharedData: { type: 'string', required: false },
    notes: { type: 'string', required: false }
  }),
  premiumAnalyticsController.addHealthcareProfessional
);

// PUT /api/premium-analytics/healthcare/professionals/:id
router.put('/healthcare/professionals/:id',
  ValidationService.validate({
    id: { type: 'number', required: true },
    accessLevel: { type: 'string', required: false },
    dataSharingConsent: { type: 'boolean', required: false },
    dataExpirationDate: { type: 'string', required: false },
    sharedData: { type: 'string', required: false },
    notes: { type: 'string', required: false }
  }),
  premiumAnalyticsController.updateHealthcareProfessional
);

// DELETE /api/premium-analytics/healthcare/professionals/:id
router.delete('/healthcare/professionals/:id',
  ValidationService.validate({
    id: { type: 'number', required: true }
  }),
  premiumAnalyticsController.removeHealthcareProfessional
);

// Health Goals Endpoints
// GET /api/premium-analytics/goals
router.get('/goals',
  ValidationService.validate({
    goalTypes: { type: 'string', required: false },
    status: { type: 'string', required: false },
    priority: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getHealthGoals
);

// POST /api/premium-analytics/goals
router.post('/goals',
  ValidationService.validate({
    goalType: { type: 'string', required: true },
    goalTitle: { type: 'string', required: true },
    goalDescription: { type: 'string', required: false },
    targetValue: { type: 'number', required: true },
    unit: { type: 'string', required: true },
    targetDate: { type: 'string', required: true },
    deadlineDate: { type: 'string', required: false },
    priority: { type: 'string', required: false },
    milestones: { type: 'string', required: false }
  }),
  premiumAnalyticsController.createHealthGoal
);

// PUT /api/premium-analytics/goals/:id
router.put('/goals/:id',
  ValidationService.validate({
    id: { type: 'number', required: true },
    currentValue: { type: 'number', required: false },
    progressPercentage: { type: 'number', required: false, min: 0 },
    achievementProbability: { type: 'number', required: false, min: 0 },
    status: { type: 'string', required: false },
    milestones: { type: 'string', required: false }
  }),
  premiumAnalyticsController.updateHealthGoal
);

// DELETE /api/premium-analytics/goals/:id
router.delete('/goals/:id',
  ValidationService.validate({
    id: { type: 'number', required: true }
  }),
  premiumAnalyticsController.deleteHealthGoal
);

// Health Insights Endpoints
// GET /api/premium-analytics/insights
router.get('/insights',
  ValidationService.validate({
    insightTypes: { type: 'string', required: false },
    categories: { type: 'string', required: false },
    priorities: { type: 'string', required: false },
    isRead: { type: 'boolean', required: false },
    isBookmarked: { type: 'boolean', required: false },
    limit: { type: 'number', required: false, min: 1 }
  }),
  premiumAnalyticsController.getHealthInsights
);

// PUT /api/premium-analytics/insights/:id/read
router.put('/insights/:id/read',
  ValidationService.validate({
    id: { type: 'number', required: true }
  }),
  premiumAnalyticsController.markInsightAsRead
);

// PUT /api/premium-analytics/insights/:id/bookmark
router.put('/insights/:id/bookmark',
  ValidationService.validate({
    id: { type: 'number', required: true }
  }),
  premiumAnalyticsController.toggleInsightBookmark
);

// Advanced Analytics Dashboard
// GET /api/premium-analytics/dashboard/overview
router.get('/dashboard/overview',
  ValidationService.validate({
    dateRange: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getDashboardOverview
);

// GET /api/premium-analytics/dashboard/trends
router.get('/dashboard/trends',
  ValidationService.validate({
    metrics: { type: 'string', required: false },
    dateRange: { type: 'string', required: false },
    aggregation: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getTrendAnalysis
);

// GET /api/premium-analytics/dashboard/correlations
router.get('/dashboard/correlations',
  ValidationService.validate({
    metricPairs: { type: 'string', required: false },
    dateRange: { type: 'string', required: false }
  }),
  premiumAnalyticsController.getCorrelationAnalysis
);

// Export Data
// GET /api/premium-analytics/export
router.get('/export',
  ValidationService.validate({
    exportType: { type: 'string', required: true },
    format: { type: 'string', required: false },
    startDate: { type: 'string', required: false },
    endDate: { type: 'string', required: false }
  }),
  premiumAnalyticsController.exportUserData
);

export default router;