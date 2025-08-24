import { sql } from 'drizzle-orm';
import { mysqlTable, varchar, int, boolean, timestamp, json, mysqlEnum, real } from 'drizzle-orm/mysql-core';

export const wearableDevices = mysqlTable('wearable_devices', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceType: mysqlEnum('device_type', ['apple_health', 'google_fit', 'fitbit', 'garmin', 'apple_watch']).notNull(),
  deviceName: varchar('device_name', { length: 255 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).notNull().unique(),
  isConnected: boolean('is_connected').default(false).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  batteryLevel: int('battery_level'),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  signalStrength: real('signal_strength'),
  capabilities: json('capabilities').default(sql`'[]'`).notNull(),
  settings: json('settings').default(sql`'{}'`).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

export const healthMetrics = mysqlTable('health_metrics', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  metricType: mysqlEnum('metric_type', [
    'steps', 'distance', 'calories_burned', 'heart_rate', 'sleep_duration', 'sleep_quality',
    'activity_minutes', 'resting_heart_rate', 'blood_pressure', 'weight', 'body_fat', 'water_intake',
    'workout_duration', 'blood_oxygen', 'respiratory_rate', 'skin_temperature', 'heart_rate_variability',
    'vo2_max', 'fitness_age', 'stress_level', 'recovery_score', 'training_load', 'readiness_score',
    'sleep_score', 'activity_score', 'move_minutes', 'exercise_minutes', 'stand_hours', 'active_calories',
    'resting_calories', 'total_calories', 'basal_metabolic_rate', 'body_mass_index', 'body_water',
    'bone_mass', 'muscle_mass', 'visceral_fat', 'waist_circumference', 'hip_circumference',
    'waist_to_hip_ratio', 'waist_to_height_ratio'
  ]).notNull(),
  value: real('value').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  recordedAt: timestamp('recorded_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  confidence: real('confidence'),
  metadata: json('metadata'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const syncLogs = mysqlTable('sync_logs', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  syncType: mysqlEnum('sync_type', ['pull', 'push', 'both']).notNull(),
  status: mysqlEnum('status', ['success', 'failed', 'partial', 'conflict']).notNull(),
  recordsProcessed: int('records_processed').default(0).notNull(),
  recordsAdded: int('records_added').default(0).notNull(),
  recordsUpdated: int('records_updated').default(0).notNull(),
  recordsFailed: int('records_failed').default(0).notNull(),
  errorMessage: varchar('error_message', { length: 1000 }),
  startedAt: timestamp('started_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp('completed_at'),
  duration: int('duration'),
  metadata: json('metadata'),
});

export const conflictResolutions = mysqlTable('conflict_resolutions', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  metricId: varchar('metric_id', { length: 36 }),
  conflictType: mysqlEnum('conflict_type', ['timestamp', 'value', 'source']).notNull(),
  resolution: mysqlEnum('resolution', ['server_wins', 'client_wins', 'merged', 'manual']).notNull(),
  oldValue: json('old_value'),
  newValue: json('new_value'),
  resolvedAt: timestamp('resolved_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  resolvedBy: mysqlEnum('resolved_by', ['system', 'user', 'manual']).default('system'),
});

export const correlationAnalyses = mysqlTable('correlation_analyses', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  correlationType: mysqlEnum('correlation_type', ['sleep_nutrition', 'heart_rate_nutrition', 'activity_nutrition']).notNull(),
  analysisDate: varchar('analysis_date', { length: 20 }).notNull(),
  correlationScore: real('correlation_score').notNull(),
  confidenceLevel: real('confidence_level').notNull(),
  insights: json('insights').notNull(),
  recommendations: json('recommendations').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

export const wearableUserSettings = mysqlTable('wearable_user_settings', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  defaultSyncConfig: json('default_sync_config').notNull(),
  deviceSettings: json('device_settings').notNull(),
  privacySettings: json('privacy_settings').notNull(),
  notificationSettings: json('notification_settings').notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

export const syncSchedules = mysqlTable('sync_schedules', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  syncFrequencyMinutes: int('sync_frequency_minutes').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  nextSyncAt: timestamp('next_sync_at'),
  syncType: mysqlEnum('sync_type', ['pull', 'push', 'both']).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

export const deviceAuth = mysqlTable('device_auth', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  accessToken: varchar('access_token', { length: 1000 }),
  refreshToken: varchar('refresh_token', { length: 1000 }),
  tokenType: varchar('token_type', { length: 50 }),
  scope: varchar('scope', { length: 500 }),
  expiresAt: timestamp('expires_at'),
  lastRefreshedAt: timestamp('last_refreshed_at'),
  scopes: json('scopes').default(sql`'[]'`).notNull(),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull(),
});

export const deviceActivities = mysqlTable('device_activities', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  intensity: mysqlEnum('intensity', ['low', 'medium', 'high']).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: int('duration'),
  calories: real('calories'),
  distance: real('distance'),
  steps: int('steps'),
  heartRate: real('heartRate'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWorkouts = mysqlTable('device_workouts', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  workoutType: varchar('workout_type', { length: 100 }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: int('duration'),
  calories: real('calories'),
  distance: real('distance'),
  steps: int('steps'),
  heartRate: real('heartRate'),
  averageHeartRate: real('average_heart_rate'),
  maxHeartRate: real('max_heart_rate'),
  minHeartRate: real('min_heart_rate'),
  elevationGain: real('elevation_gain'),
  elevationLoss: real('elevation_loss'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceSleepData = mysqlTable('device_sleep_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  sleepType: mysqlEnum('sleep_type', ['deep', 'light', 'rem', 'awake']).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  duration: int('duration').notNull(),
  quality: real('quality'),
  confidence: real('confidence'),
  stages: json('stages').notNull(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceHeartRateData = mysqlTable('device_heart_rate_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  heartRate: real('heart_rate').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceStepsData = mysqlTable('device_steps_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  steps: int('steps').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceCaloriesData = mysqlTable('device_calories_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  calories: real('calories').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWeightData = mysqlTable('device_weight_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  weight: real('weight').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBloodPressureData = mysqlTable('device_blood_pressure_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  systolic: real('systolic').notNull(),
  diastolic: real('diastolic').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWaterIntakeData = mysqlTable('device_water_intake_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  amount: real('amount').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBodyFatData = mysqlTable('device_body_fat_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  bodyFat: real('body_fat').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceDistanceData = mysqlTable('device_distance_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  distance: real('distance').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceActivityMinutesData = mysqlTable('device_activity_minutes_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  minutes: int('minutes').notNull(),
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWorkoutDurationData = mysqlTable('device_workout_duration_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  duration: int('duration').notNull(),
  workoutType: varchar('workout_type', { length: 100 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceRestingHeartRateData = mysqlTable('device_resting_heart_rate_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  heartRate: real('heart_rate').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceSleepQualityData = mysqlTable('device_sleep_quality_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  quality: real('quality').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceSleepDurationData = mysqlTable('device_sleep_duration_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  duration: int('duration').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBloodOxygenData = mysqlTable('device_blood_oxygen_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  oxygen: real('oxygen').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceRespiratoryRateData = mysqlTable('device_respiratory_rate_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  rate: real('rate').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceSkinTemperatureData = mysqlTable('device_skin_temperature_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  temperature: real('temperature').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceHeartRateVariabilityData = mysqlTable('device_heart_rate_variability_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  hrv: real('hrv').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceVo2MaxData = mysqlTable('device_vo2_max_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  vo2Max: real('vo2_max').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceFitnessAgeData = mysqlTable('device_fitness_age_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  fitnessAge: int('fitness_age').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceStressLevelData = mysqlTable('device_stress_level_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  stressLevel: real('stress_level').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceRecoveryScoreData = mysqlTable('device_recovery_score_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  recoveryScore: real('recovery_score').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceTrainingLoadData = mysqlTable('device_training_load_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  trainingLoad: real('training_load').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceReadinessScoreData = mysqlTable('device_readiness_score_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  readinessScore: real('readiness_score').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceSleepScoreData = mysqlTable('device_sleep_score_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  sleepScore: real('sleep_score').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceActivityScoreData = mysqlTable('device_activity_score_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  activityScore: real('activity_score').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceMoveMinutesData = mysqlTable('device_move_minutes_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  minutes: int('minutes').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceExerciseMinutesData = mysqlTable('device_exercise_minutes_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  minutes: int('minutes').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceStandHoursData = mysqlTable('device_stand_hours_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  hours: real('hours').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceActiveCaloriesData = mysqlTable('device_active_calories_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  calories: real('calories').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceRestingCaloriesData = mysqlTable('device_resting_calories_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  calories: real('calories').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceTotalCaloriesData = mysqlTable('device_total_calories_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  calories: real('calories').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBasalMetabolicRateData = mysqlTable('device_basal_metabolic_rate_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  bmr: real('bmr').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBodyMassIndexData = mysqlTable('device_body_mass_index_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  bmi: real('bmi').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBodyWaterData = mysqlTable('device_body_water_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  water: real('water').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBoneMassData = mysqlTable('device_bone_mass_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  boneMass: real('bone_mass').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceMuscleMassData = mysqlTable('device_muscle_mass_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  muscleMass: real('muscle_mass').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceVisceralFatData = mysqlTable('device_visceral_fat_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  visceralFat: real('visceral_fat').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWaistCircumferenceData = mysqlTable('device_waist_circumference_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  circumference: real('circumference').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceHipCircumferenceData = mysqlTable('device_hip_circumference_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  circumference: real('circumference').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWaistToHipRatioData = mysqlTable('device_waist_to_hip_ratio_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  ratio: real('ratio').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWaistToHeightRatioData = mysqlTable('device_waist_to_height_ratio_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  ratio: real('ratio').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceBodyCompositionData = mysqlTable('device_body_composition_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  weight: real('weight').notNull(),
  bodyFat: real('body_fat').notNull(),
  muscleMass: real('muscle_mass').notNull(),
  boneMass: real('bone_mass').notNull(),
  bodyWater: real('body_water').notNull(),
  visceralFat: real('visceral_fat').notNull(),
  bmi: real('bmi').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic']).default('automatic'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const devicePhysicalActivityData = mysqlTable('device_physical_activity_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  activityType: varchar('activity_type', { length: 100 }).notNull(),
  intensity: mysqlEnum('intensity', ['low', 'medium', 'high']).notNull(),
  duration: int('duration').notNull(),
  calories: real('calories'),
  distance: real('distance'),
  steps: int('steps'),
  heartRate: real('heartRate'),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceExerciseData = mysqlTable('device_exercise_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  exerciseType: varchar('exercise_type', { length: 100 }).notNull(),
  duration: int('duration').notNull(),
  calories: real('calories'),
  distance: real('distance'),
  steps: int('steps'),
  heartRate: real('heartRate'),
  averageHeartRate: real('average_heart_rate'),
  maxHeartRate: real('max_heart_rate'),
  minHeartRate: real('min_heart_rate'),
  elevationGain: real('elevation_gain'),
  elevationLoss: real('elevation_loss'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deviceWorkoutData = mysqlTable('device_workout_data', {
  id: varchar('id', { length: 36 }).default(sql`UUID()`).primaryKey(),
  userId: varchar('user_id', { length: 36 }).notNull(),
  deviceId: varchar('device_id', { length: 36 }),
  workoutType: varchar('workout_type', { length: 100 }).notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  duration: int('duration'),
  calories: real('calories'),
  distance: real('distance'),
  steps: int('steps'),
  heartRate: real('heartRate'),
  averageHeartRate: real('average_heart_rate'),
  maxHeartRate: real('max_heart_rate'),
  minHeartRate: real('min_heart_rate'),
  elevationGain: real('elevation_gain'),
  elevationLoss: real('elevation_loss'),
  activities: json('activities'),
  exercises: json('exercises'),
  timestamp: timestamp('timestamp').notNull(),
  confidence: real('confidence'),
  source: mysqlEnum('source', ['manual', 'automatic', 'workout']).default('automatic'),
  workoutId: varchar('workout_id', { length: 36 }),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});