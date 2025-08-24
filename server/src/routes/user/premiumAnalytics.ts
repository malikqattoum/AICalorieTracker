import { Router } from 'express';
import { premiumAnalyticsController } from '../controllers/premiumAnalyticsController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, query } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Health Scores Routes
router.get('/health-scores', 
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('scoreTypes').optional().isArray().withMessage('Score types must be an array'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  premiumAnalyticsController.getHealthScores
);

router.post('/health-scores/calculate',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('calculationDate').optional().isISO8601().withMessage('Calculation date must be a valid ISO date'),
  body('includeNutrition').optional().isBoolean().withMessage('Include nutrition must be a boolean'),
  body('includeFitness').optional().isBoolean().withMessage('Include fitness must be a boolean'),
  body('includeRecovery').optional().isBoolean().withMessage('Include recovery must be a boolean'),
  body('includeConsistency').optional().isBoolean().withMessage('Include consistency must be a boolean'),
  validateRequest,
  premiumAnalyticsController.calculateHealthScores
);

// Predictions Routes
router.get('/predictions',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('predictionTypes').optional().isArray().withMessage('Prediction types must be an array'),
  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  validateRequest,
  premiumAnalyticsController.getPredictions
);

router.post('/predictions/generate',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('predictionType').isIn(['weight_projection', 'goal_achievement', 'health_risk', 'performance_optimization']).withMessage('Invalid prediction type'),
  body('targetDate').isISO8601().withMessage('Target date must be a valid ISO date'),
  body('modelVersion').optional().isString().withMessage('Model version must be a string'),
  validateRequest,
  premiumAnalyticsController.generateHealthPrediction
);

// Pattern Analysis Routes
router.get('/pattern-analysis',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('patternTypes').optional().isArray().withMessage('Pattern types must be an array'),
  query('analysisPeriod').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid analysis period'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  validateRequest,
  premiumAnalyticsController.getPatternAnalysis
);

router.post('/pattern-analysis/analyze',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('patternType').isIn(['sleep_nutrition', 'exercise_nutrition', 'stress_eating', 'metabolic_rate']).withMessage('Invalid pattern type'),
  body('analysisPeriod').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid analysis period'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  validateRequest,
  premiumAnalyticsController.analyzePatterns
);

// Health Reports Routes
router.get('/health-reports',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('reportTypes').optional().isArray().withMessage('Report types must be an array'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('accessLevel').optional().isIn(['private', 'shared', 'public']).withMessage('Invalid access level'),
  validateRequest,
  premiumAnalyticsController.getHealthReports
);

router.post('/health-reports/generate',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('reportType').isIn(['weekly_summary', 'monthly_progress', 'quarterly_review', 'annual_journey']).withMessage('Invalid report type'),
  body('reportPeriodStart').isISO8601().withMessage('Report period start must be a valid ISO date'),
  body('reportPeriodEnd').isISO8601().withMessage('Report period end must be a valid ISO date'),
  body('generatedBy').optional().isIn(['user', 'system', 'professional']).withMessage('Invalid generated by value'),
  validateRequest,
  premiumAnalyticsController.generateHealthReport
);

router.get('/health-reports/:id',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  validateRequest,
  premiumAnalyticsController.getHealthReportById
);

// Real-time Monitoring Routes
router.get('/monitoring/data',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('metricTypes').optional().isArray().withMessage('Metric types must be an array'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  validateRequest,
  premiumAnalyticsController.getLiveMonitoringData
);

router.post('/monitoring/record',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('metricType').isIn(['heart_rate', 'blood_pressure', 'blood_oxygen', 'sleep_quality', 'stress_level', 'activity_level']).withMessage('Invalid metric type'),
  body('metricValue').isFloat().withMessage('Metric value must be a number'),
  body('unit').isString().withMessage('Unit must be a string'),
  body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid ISO date'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  validateRequest,
  premiumAnalyticsController.recordMonitoringData
);

router.get('/monitoring/alerts',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('isActive').optional().isBoolean().withMessage('Is active must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  premiumAnalyticsController.getMonitoringAlerts
);

// Healthcare Integration Routes
router.get('/healthcare-professionals',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('professionalTypes').optional().isArray().withMessage('Professional types must be an array'),
  query('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Invalid status'),
  validateRequest,
  premiumAnalyticsController.getHealthcareProfessionals
);

router.post('/healthcare-professionals',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('professionalId').isString().withMessage('Professional ID must be a string'),
  body('professionalType').isIn(['doctor', 'nutritionist', 'fitness_coach', 'therapist']).withMessage('Invalid professional type'),
  body('professionalName').isString().withMessage('Professional name must be a string'),
  body('practiceName').optional().isString().withMessage('Practice name must be a string'),
  body('accessLevel').optional().isIn(['read_only', 'read_write', 'full_access']).withMessage('Invalid access level'),
  body('dataSharingConsent').isBoolean().withMessage('Data sharing consent must be a boolean'),
  body('dataExpirationDate').optional().isISO8601().withMessage('Data expiration date must be a valid ISO date'),
  body('sharedData').optional().isObject().withMessage('Shared data must be an object'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  validateRequest,
  premiumAnalyticsController.addHealthcareProfessional
);

router.put('/healthcare-professionals/:id',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('accessLevel').optional().isIn(['read_only', 'read_write', 'full_access']).withMessage('Invalid access level'),
  body('dataSharingConsent').optional().isBoolean().withMessage('Data sharing consent must be a boolean'),
  body('dataExpirationDate').optional().isISO8601().withMessage('Data expiration date must be a valid ISO date'),
  body('sharedData').optional().isObject().withMessage('Shared data must be an object'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  validateRequest,
  premiumAnalyticsController.updateHealthcareProfessional
);

router.delete('/healthcare-professionals/:id',
  query('userId').isInt().withMessage('User ID must be an integer'),
  validateRequest,
  premiumAnalyticsController.removeHealthcareProfessional
);

// Health Goals Routes
router.get('/health-goals',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('goalTypes').optional().isArray().withMessage('Goal types must be an array'),
  query('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  validateRequest,
  premiumAnalyticsController.getHealthGoals
);

router.post('/health-goals',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('goalType').isIn(['weight_loss', 'weight_gain', 'muscle_gain', 'fitness_improvement', 'health_improvement']).withMessage('Invalid goal type'),
  body('goalTitle').isString().withMessage('Goal title must be a string'),
  body('goalDescription').optional().isString().withMessage('Goal description must be a string'),
  body('targetValue').isFloat().withMessage('Target value must be a number'),
  body('unit').isString().withMessage('Unit must be a string'),
  body('targetDate').isISO8601().withMessage('Target date must be a valid ISO date'),
  body('deadlineDate').optional().isISO8601().withMessage('Deadline date must be a valid ISO date'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('milestones').optional().isArray().withMessage('Milestones must be an array'),
  validateRequest,
  premiumAnalyticsController.createHealthGoal
);

router.put('/health-goals/:id',
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('currentValue').optional().isFloat().withMessage('Current value must be a number'),
  body('progressPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Progress percentage must be between 0 and 100'),
  body('achievementProbability').optional().isFloat({ min: 0, max: 100 }).withMessage('Achievement probability must be between 0 and 100'),
  body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
  body('milestones').optional().isArray().withMessage('Milestones must be an array'),
  validateRequest,
  premiumAnalyticsController.updateHealthGoal
);

router.delete('/health-goals/:id',
  query('userId').isInt().withMessage('User ID must be an integer'),
  validateRequest,
  premiumAnalyticsController.deleteHealthGoal
);

// Health Insights Routes
router.get('/health-insights',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('insightTypes').optional().isArray().withMessage('Insight types must be an array'),
  query('categories').optional().isArray().withMessage('Categories must be an array'),
  query('priorities').optional().isArray().withMessage('Priorities must be an array'),
  query('isRead').optional().isBoolean().withMessage('Is read must be a boolean'),
  query('isBookmarked').optional().isBoolean().withMessage('Is bookmarked must be a boolean'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validateRequest,
  premiumAnalyticsController.getHealthInsights
);

router.put('/health-insights/:id/read',
  query('userId').isInt().withMessage('User ID must be an integer'),
  validateRequest,
  premiumAnalyticsController.markInsightAsRead
);

router.put('/health-insights/:id/bookmark',
  query('userId').isInt().withMessage('User ID must be an integer'),
  validateRequest,
  premiumAnalyticsController.toggleInsightBookmark
);

// Dashboard and Analytics Routes
router.get('/dashboard/overview',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('dateRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid date range'),
  validateRequest,
  premiumAnalyticsController.getDashboardOverview
);

router.get('/trends/analysis',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('metrics').optional().isArray().withMessage('Metrics must be an array'),
  query('dateRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid date range'),
  query('aggregation').optional().isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid aggregation'),
  validateRequest,
  premiumAnalyticsController.getTrendAnalysis
);

router.get('/correlation/analysis',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('metricPairs').optional().isArray().withMessage('Metric pairs must be an array'),
  query('dateRange').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid date range'),
  validateRequest,
  premiumAnalyticsController.getCorrelationAnalysis
);

// Data Export Routes
router.get('/export/data',
  query('userId').optional().isInt().withMessage('User ID must be an integer'),
  query('exportType').optional().isIn(['health_scores', 'predictions', 'reports', 'goals', 'all']).withMessage('Invalid export type'),
  query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  validateRequest,
  premiumAnalyticsController.exportUserData
);

export default router;