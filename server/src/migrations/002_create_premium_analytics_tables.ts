import { sql } from 'drizzle-orm';
import { mysqlTable, int, varchar, decimal, date, timestamp, text, boolean, json } from 'drizzle-orm/mysql-core';
import { users } from '@shared/schema';

// Health Scores Table for personalized health scoring
export const healthScores = mysqlTable('health_scores', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  score_type: varchar('score_type', { length: 50 }).notNull().$type<
    'nutrition' | 'fitness' | 'recovery' | 'consistency' | 'overall'
  >(),
  score_value: decimal('score_value', { precision: 5, scale: 2 }).notNull(),
  max_score: decimal('max_score', { precision: 5, scale: 2 }).default('100.00').notNull(),
  calculation_date: date('calculation_date').notNull(),
  score_details: json('score_details'),
  trend_direction: varchar('trend_direction', { length: 20 }).default('stable').$type<
    'improving' | 'stable' | 'declining'
  >(),
  confidence_level: decimal('confidence_level', { precision: 3, scale: 2 }),
  metadata: json('metadata'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
});

// Health Predictions Table for predictive analytics
export const healthPredictions = mysqlTable('health_predictions', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  prediction_type: varchar('prediction_type', { length: 50 }).notNull().$type<
    'weight_projection' | 'goal_achievement' | 'health_risk' | 'performance_optimization'
  >(),
  target_date: date('target_date').notNull(),
  prediction_value: decimal('prediction_value', { precision: 10, scale: 2 }).notNull(),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }).notNull(),
  model_version: varchar('model_version', { length: 50 }),
  input_data: json('input_data'),
  prediction_details: json('prediction_details'),
  recommendations: json('recommendations'),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
});

// Pattern Analysis Table for AI-powered pattern recognition
export const patternAnalysis = mysqlTable('pattern_analysis', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  pattern_type: varchar('pattern_type', { length: 50 }).notNull().$type<
    'sleep_nutrition' | 'exercise_nutrition' | 'stress_eating' | 'metabolic_rate'
  >(),
  analysis_period: varchar('analysis_period', { length: 20 }).notNull().$type<
    'daily' | 'weekly' | 'monthly'
  >(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  correlation_score: decimal('correlation_score', { precision: 3, scale: 2 }).notNull(),
  significance_level: decimal('significance_level', { precision: 3, scale: 2 }),
  pattern_strength: varchar('pattern_strength', { length: 20 }).default('moderate').$type<
    'weak' | 'moderate' | 'strong' | 'very_strong'
  >(),
  insights: json('insights'),
  triggers: json('triggers'),
  interventions: json('interventions'),
  recommendations: json('recommendations'),
  is_validated: boolean('is_validated').default(false).notNull(),
  validated_by: varchar('validated_by', { length: 100 }),
  validation_notes: text('validation_notes'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
});

// Health Reports Table for professional health reports
export const healthReports = mysqlTable('health_reports', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  report_type: varchar('report_type', { length: 50 }).notNull().$type<
    'weekly_summary' | 'monthly_progress' | 'quarterly_review' | 'annual_journey'
  >(),
  report_period_start: date('report_period_start').notNull(),
  report_period_end: date('report_period_end').notNull(),
  report_status: varchar('report_status', { length: 20 }).default('draft').$type<
    'draft' | 'generated' | 'delivered' | 'archived'
  >(),
  report_data: json('report_data').notNull(),
  summary_text: text('summary_text'),
  key_findings: json('key_findings'),
  recommendations: json('recommendations'),
  generated_at: timestamp('generated_at'),
  delivered_at: timestamp('delivered_at'),
  archived_at: timestamp('archived_at'),
  metadata: json('metadata'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
});

// Real-time Monitoring Table for continuous health tracking
export const realTimeMonitoring = mysqlTable('real_time_monitoring', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  metric_type: varchar('metric_type', { length: 50 }).notNull().$type<
    'heart_rate' | 'blood_pressure' | 'blood_oxygen' | 'sleep_quality' | 'stress_level' | 'activity_level'
  >(),
  metric_value: decimal('metric_value', { precision: 10, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  is_alert: boolean('is_alert').default(false).notNull(),
  alert_level: varchar('alert_level', { length: 20 }).default('low').$type<
    'low' | 'medium' | 'high' | 'critical'
  >(),
  alert_message: text('alert_message'),
  action_taken: text('action_taken'),
  metadata: json('metadata'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Healthcare Integration Table for professional collaboration
export const healthcareIntegration = mysqlTable('healthcare_integration', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  professional_id: varchar('professional_id', { length: 100 }).notNull(),
  professional_type: varchar('professional_type', { length: 50 }).notNull().$type<
    'doctor' | 'nutritionist' | 'fitness_coach' | 'therapist'
  >(),
  professional_name: varchar('professional_name', { length: 200 }).notNull(),
  practice_name: varchar('practice_name', { length: 200 }),
  access_level: varchar('access_level', { length: 20 }).default('read_only').$type<
    'read_only' | 'read_write' | 'full_access'
  >(),
  data_sharing_consent: boolean('data_sharing_consent').default(false).notNull(),
  consent_date: date('consent_date'),
  data_expiration_date: date('data_expiration_date'),
  shared_data: json('shared_data'),
  notes: text('notes'),
  is_active: boolean('is_active').default(true).notNull(),
  acknowledged: boolean('acknowledged').default(false).notNull(),
  acknowledged_at: timestamp('acknowledged_at'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
});

// Health Goals Table for goal tracking and achievement forecasting
export const healthGoals = mysqlTable('health_goals', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  goal_type: varchar('goal_type', { length: 50 }).notNull().$type<
    'weight_loss' | 'weight_gain' | 'muscle_gain' | 'fitness_improvement' | 'health_improvement'
  >(),
  goal_title: varchar('goal_title', { length: 200 }).notNull(),
  goal_description: text('goal_description'),
  target_value: decimal('target_value', { precision: 10, scale: 2 }).notNull(),
  current_value: decimal('current_value', { precision: 10, scale: 2 }).default('0.00').notNull(),
  unit: varchar('unit', { length: 20 }).notNull(),
  start_date: date('start_date').notNull(),
  target_date: date('target_date').notNull(),
  deadline_date: date('deadline_date'),
  status: varchar('status', { length: 20 }).default('active').$type<
    'active' | 'completed' | 'paused' | 'cancelled'
  >(),
  priority: varchar('priority', { length: 20 }).default('medium').$type<
    'low' | 'medium' | 'high'
  >(),
  progress_percentage: decimal('progress_percentage', { precision: 5, scale: 2 }).default('0.00').notNull(),
  achievement_probability: decimal('achievement_probability', { precision: 5, scale: 2 }).default('0.00').notNull(),
  milestones: json('milestones'),
  achievements: json('achievements'),
  obstacles: json('obstacles'),
  strategies: json('strategies'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updated_at: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
  completed_at: timestamp('completed_at'),
});

// Health Insights Table for AI-generated insights
export const healthInsights = mysqlTable('health_insights', {
  id: int('id').autoincrement().primaryKey(),
  user_id: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  insight_type: varchar('insight_type', { length: 50 }).notNull().$type<
    'nutrition' | 'fitness' | 'recovery' | 'behavior' | 'risk'
  >(),
  insight_category: varchar('insight_category', { length: 20 }).default('neutral').$type<
    'positive' | 'neutral' | 'warning' | 'critical'
  >(),
  insight_title: varchar('insight_title', { length: 200 }).notNull(),
  insight_description: text('insight_description').notNull(),
  insight_data: json('insight_data'),
  confidence_score: decimal('confidence_score', { precision: 3, scale: 2 }).notNull(),
  action_items: json('action_items'),
  related_metrics: json('related_metrics'),
  is_actioned: boolean('is_actioned').default(false).notNull(),
  actioned_at: timestamp('actioned_at'),
  action_notes: text('action_notes'),
  created_at: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  expires_at: timestamp('expires_at'),
});