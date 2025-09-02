import { sql } from 'drizzle-orm';
import { int, varchar, decimal, timestamp, datetime, boolean, json, text, mysqlTable } from 'drizzle-orm/mysql-core';

// Health Scores Table
export const healthScores = mysqlTable('health_scores', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  scoreType: varchar('score_type', { length: 50 }).notNull(),
  scoreValue: decimal('score_value', { precision: 5, scale: 2 }).notNull(),
  maxScore: decimal('max_score', { precision: 5, scale: 2 }).default('100.00'),
  calculationDate: varchar('calculation_date', { length: 10 }).notNull(),
  scoreDetails: json('score_details'),
  trendDirection: varchar('trend_direction', { length: 20 }).default('stable'),
  confidenceLevel: decimal('confidence_level', { precision: 3, scale: 2 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Health Predictions Table
export const healthPredictions = mysqlTable('health_predictions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  predictionType: varchar('prediction_type', { length: 50 }).notNull(),
  targetDate: varchar('target_date', { length: 10 }).notNull(),
  predictionValue: decimal('prediction_value', { precision: 10, scale: 2 }).notNull(),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }).notNull(),
  modelVersion: varchar('model_version', { length: 100 }),
  inputData: json('input_data'),
  predictionDetails: json('prediction_details'),
  recommendations: json('recommendations'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Pattern Analysis Table
export const patternAnalysis = mysqlTable('pattern_analysis', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  patternType: varchar('pattern_type', { length: 50 }).notNull(),
  analysisPeriod: varchar('analysis_period', { length: 20 }).notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  correlationScore: decimal('correlation_score', { precision: 3, scale: 2 }).notNull(),
  significanceLevel: decimal('significance_level', { precision: 3, scale: 2 }),
  patternStrength: varchar('pattern_strength', { length: 20 }).default('moderate'),
  insights: json('insights'),
  triggers: json('triggers'),
  interventions: json('interventions'),
  recommendations: json('recommendations'),
  isValidated: boolean('is_validated').default(false),
  validatedBy: varchar('validated_by', { length: 100 }),
  validationNotes: text('validation_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Health Reports Table
export const healthReports = mysqlTable('health_reports', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  reportType: varchar('report_type', { length: 20 }).notNull(),
  reportPeriodStart: varchar('report_period_start', { length: 10 }).notNull(),
  reportPeriodEnd: varchar('report_period_end', { length: 10 }).notNull(),
  reportStatus: varchar('report_status', { length: 20 }).default('draft'),
  reportData: json('report_data').notNull(),
  summaryText: text('summary_text'),
  keyFindings: json('key_findings'),
  recommendations: json('recommendations'),
  generatedAt: datetime('generated_at').default(null),
  deliveredAt: datetime('delivered_at').default(null),
  archivedAt: datetime('archived_at').default(null),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Real-time Monitoring Table
export const realTimeMonitoring = mysqlTable('real_time_monitoring', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  metricType: varchar('metric_type', { length: 50 }).notNull(),
  metricValue: decimal('metric_value', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
  isAlert: boolean('is_alert').default(false),
  alertLevel: varchar('alert_level', { length: 20 }).default('low'),
  alertMessage: text('alert_message'),
  actionTaken: varchar('action_taken', { length: 100 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Healthcare Integration Table
export const healthcareIntegration = mysqlTable('healthcare_integration', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  professionalId: varchar('professional_id', { length: 100 }).notNull(),
  professionalType: varchar('professional_type', { length: 50 }).notNull(),
  professionalName: varchar('professional_name', { length: 100 }).notNull(),
  practiceName: varchar('practice_name', { length: 100 }),
  accessLevel: varchar('access_level', { length: 20 }).default('read_only'),
  dataSharingConsent: boolean('data_sharing_consent').default(false),
  consentDate: varchar('consent_date', { length: 10 }),
  dataExpirationDate: varchar('data_expiration_date', { length: 10 }),
  sharedData: json('shared_data'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Health Goals Table
export const healthGoals = mysqlTable('health_goals', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  goalType: varchar('goal_type', { length: 50 }).notNull(),
  goalTitle: varchar('goal_title', { length: 100 }).notNull(),
  goalDescription: text('goal_description'),
  targetValue: decimal('target_value', { precision: 10, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }).default('0.00'),
  unit: varchar('unit', { length: 20 }).notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  targetDate: varchar('target_date', { length: 10 }).notNull(),
  deadlineDate: varchar('deadline_date', { length: 10 }),
  status: varchar('status', { length: 20 }).default('active'),
  priority: varchar('priority', { length: 20 }).default('medium'),
  progressPercentage: decimal('progress_percentage', { precision: 5, scale: 2 }).default('0.00'),
  achievementProbability: decimal('achievement_probability', { precision: 5, scale: 2 }).default('0.00'),
  milestones: json('milestones'),
  achievements: json('achievements'),
  obstacles: json('obstacles'),
  strategies: json('strategies'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: datetime('completed_at').default(null),
});

// Health Insights Table
export const healthInsights = mysqlTable('health_insights', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  insightType: varchar('insight_type', { length: 50 }).notNull(),
  insightCategory: varchar('insight_category', { length: 20 }).default('neutral'),
  insightTitle: varchar('insight_title', { length: 100 }).notNull(),
  insightDescription: text('insight_description').notNull(),
  insightData: json('insight_data'),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }).notNull(),
  actionItems: json('action_items'),
  relatedMetrics: json('related_metrics'),
  isActioned: boolean('is_actioned').default(false),
  actionedAt: datetime('actioned_at').default(null),
  actionNotes: text('action_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: datetime('expires_at').default(null),
});

// Create indexes for better performance
export const healthAnalyticsIndexes = {
  healthScores_userId: sql`CREATE INDEX IF NOT EXISTS health_scores_user_id_idx ON health_scores(user_id)`,
  healthScores_scoreType: sql`CREATE INDEX IF NOT EXISTS health_scores_score_type_idx ON health_scores(score_type)`,
  healthScores_calculationDate: sql`CREATE INDEX IF NOT EXISTS health_scores_calculation_date_idx ON health_scores(calculation_date)`,
  healthScores_scoreValue: sql`CREATE INDEX IF NOT EXISTS health_scores_score_value_idx ON health_scores(score_value)`,
  healthScores_userDate: sql`CREATE INDEX IF NOT EXISTS health_scores_user_date_idx ON health_scores(user_id, calculation_date)`,
  
  healthPredictions_userId: sql`CREATE INDEX IF NOT EXISTS health_predictions_user_id_idx ON health_predictions(user_id)`,
  healthPredictions_predictionType: sql`CREATE INDEX IF NOT EXISTS health_predictions_prediction_type_idx ON health_predictions(prediction_type)`,
  healthPredictions_targetDate: sql`CREATE INDEX IF NOT EXISTS health_predictions_target_date_idx ON health_predictions(target_date)`,
  healthPredictions_confidenceScore: sql`CREATE INDEX IF NOT EXISTS health_predictions_confidence_score_idx ON health_predictions(confidence_score)`,
  healthPredictions_userDate: sql`CREATE INDEX IF NOT EXISTS health_predictions_user_date_idx ON health_predictions(user_id, target_date)`,
  
  patternAnalysis_userId: sql`CREATE INDEX IF NOT EXISTS pattern_analysis_user_id_idx ON pattern_analysis(user_id)`,
  patternAnalysis_patternType: sql`CREATE INDEX IF NOT EXISTS pattern_analysis_pattern_type_idx ON pattern_analysis(pattern_type)`,
  patternAnalysis_analysisPeriod: sql`CREATE INDEX IF NOT EXISTS pattern_analysis_analysis_period_idx ON pattern_analysis(analysis_period)`,
  patternAnalysis_correlationScore: sql`CREATE INDEX IF NOT EXISTS pattern_analysis_correlation_score_idx ON pattern_analysis(correlation_score)`,
  patternAnalysis_userDate: sql`CREATE INDEX IF NOT EXISTS pattern_analysis_user_date_idx ON pattern_analysis(user_id, start_date, end_date)`,
  
  healthReports_userId: sql`CREATE INDEX IF NOT EXISTS health_reports_user_id_idx ON health_reports(user_id)`,
  healthReports_reportType: sql`CREATE INDEX IF NOT EXISTS health_reports_report_type_idx ON health_reports(report_type)`,
  healthReports_reportPeriod: sql`CREATE INDEX IF NOT EXISTS health_reports_report_period_idx ON health_reports(report_period_start, report_period_end)`,
  healthReports_reportStatus: sql`CREATE INDEX IF NOT EXISTS health_reports_report_status_idx ON health_reports(report_status)`,
  healthReports_userPeriod: sql`CREATE INDEX IF NOT EXISTS health_reports_user_period_idx ON health_reports(user_id, report_period_start, report_period_end)`,
  
  realTimeMonitoring_userId: sql`CREATE INDEX IF NOT EXISTS real_time_monitoring_user_id_idx ON real_time_monitoring(user_id)`,
  realTimeMonitoring_metricType: sql`CREATE INDEX IF NOT EXISTS real_time_monitoring_metric_type_idx ON real_time_monitoring(metric_type)`,
  realTimeMonitoring_timestamp: sql`CREATE INDEX IF NOT EXISTS real_time_monitoring_timestamp_idx ON real_time_monitoring(timestamp)`,
  realTimeMonitoring_isAlert: sql`CREATE INDEX IF NOT EXISTS real_time_monitoring_is_alert_idx ON real_time_monitoring(is_alert)`,
  realTimeMonitoring_alertLevel: sql`CREATE INDEX IF NOT EXISTS real_time_monitoring_alert_level_idx ON real_time_monitoring(alert_level)`,
  realTimeMonitoring_userTime: sql`CREATE INDEX IF NOT EXISTS real_time_monitoring_user_time_idx ON real_time_monitoring(user_id, timestamp)`,
  
  healthcareIntegration_userId: sql`CREATE INDEX IF NOT EXISTS healthcare_integration_user_id_idx ON healthcare_integration(user_id)`,
  healthcareIntegration_professionalId: sql`CREATE INDEX IF NOT EXISTS healthcare_integration_professional_id_idx ON healthcare_integration(professional_id)`,
  healthcareIntegration_professionalType: sql`CREATE INDEX IF NOT EXISTS healthcare_integration_professional_type_idx ON healthcare_integration(professional_type)`,
  healthcareIntegration_accessLevel: sql`CREATE INDEX IF NOT EXISTS healthcare_integration_access_level_idx ON healthcare_integration(access_level)`,
  healthcareIntegration_isActive: sql`CREATE INDEX IF NOT EXISTS healthcare_integration_is_active_idx ON healthcare_integration(is_active)`,
  
  healthGoals_userId: sql`CREATE INDEX IF NOT EXISTS health_goals_user_id_idx ON health_goals(user_id)`,
  healthGoals_goalType: sql`CREATE INDEX IF NOT EXISTS health_goals_goal_type_idx ON health_goals(goal_type)`,
  healthGoals_status: sql`CREATE INDEX IF NOT EXISTS health_goals_status_idx ON health_goals(status)`,
  healthGoals_priority: sql`CREATE INDEX IF NOT EXISTS health_goals_priority_idx ON health_goals(priority)`,
  healthGoals_targetDate: sql`CREATE INDEX IF NOT EXISTS health_goals_target_date_idx ON health_goals(target_date)`,
  healthGoals_progressPercentage: sql`CREATE INDEX IF NOT EXISTS health_goals_progress_percentage_idx ON health_goals(progress_percentage)`,
  healthGoals_achievementProbability: sql`CREATE INDEX IF NOT EXISTS health_goals_achievement_probability_idx ON health_goals(achievement_probability)`,
  healthGoals_userStatus: sql`CREATE INDEX IF NOT EXISTS health_goals_user_status_idx ON health_goals(user_id, status)`,
  
  healthInsights_userId: sql`CREATE INDEX IF NOT EXISTS health_insights_user_id_idx ON health_insights(user_id)`,
  healthInsights_insightType: sql`CREATE INDEX IF NOT EXISTS health_insights_insight_type_idx ON health_insights(insight_type)`,
  healthInsights_insightCategory: sql`CREATE INDEX IF NOT EXISTS health_insights_insight_category_idx ON health_insights(insight_category)`,
  healthInsights_confidenceScore: sql`CREATE INDEX IF NOT EXISTS health_insights_confidence_score_idx ON health_insights(confidence_score)`,
  healthInsights_isActioned: sql`CREATE INDEX IF NOT EXISTS health_insights_is_actioned_idx ON health_insights(is_actioned)`,
  healthInsights_createdAt: sql`CREATE INDEX IF NOT EXISTS health_insights_created_at_idx ON health_insights(created_at)`,
  healthInsights_expiresAt: sql`CREATE INDEX IF NOT EXISTS health_insights_expires_at_idx ON health_insights(expires_at)`,
  healthInsights_userCreated: sql`CREATE INDEX IF NOT EXISTS health_insights_user_created_idx ON health_insights(user_id, created_at)`,
};