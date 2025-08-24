import { sql } from 'drizzle-orm';
import { int, varchar, timestamp, boolean, json, text, mysqlTable } from 'drizzle-orm/mysql-core';

// Device Tokens Table
export const deviceTokens = mysqlTable('device_tokens', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  token: varchar('token', { length: 500 }).notNull().unique(),
  platform: varchar('platform', { length: 20 }).notNull(), // 'ios', 'android', 'web'
  isActive: boolean('is_active').default(true),
  lastUsed: timestamp('last_used').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Push Notifications Table
export const pushNotifications = mysqlTable('push_notifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: json('data'), // JSON object for additional data
  type: varchar('type', { length: 50 }).default('system'), // 'meal_reminder', 'goal_achievement', 'health_alert', 'system', 'marketing'
  priority: varchar('priority', { length: 20 }).default('normal'), // 'high', 'normal', 'low'
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'sent', 'failed', 'cancelled'
  platform: varchar('platform', { length: 20 }), // 'ios', 'android', 'web'
  retryCount: int('retry_count').default(0),
  maxRetries: int('max_retries').default(3),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Settings Table
export const notificationSettings = mysqlTable('notification_settings', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').unique().notNull(),
  mealReminders: boolean('meal_reminders').default(true),
  goalAchievements: boolean('goal_achievements').default(true),
  healthAlerts: boolean('health_alerts').default(true),
  systemNotifications: boolean('system_notifications').default(true),
  marketingNotifications: boolean('marketing_notifications').default(false),
  emailNotifications: boolean('email_notifications').default(true),
  pushNotifications: boolean('push_notifications').default(true),
  quietHoursStart: varchar('quiet_hours_start', { length: 5 }), // HH:MM format
  quietHoursEnd: varchar('quiet_hours_end', { length: 5 }), // HH:MM format
  frequency: varchar('frequency', { length: 20 }).default('immediate'), // 'immediate', 'daily', 'weekly'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Templates Table
export const notificationTemplates = mysqlTable('notification_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  data: json('data'), // JSON object for template data
  type: varchar('type', { length: 50 }).notNull(), // 'meal_reminder', 'goal_achievement', 'health_alert', 'system', 'marketing'
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Statistics Table
export const notificationStats = mysqlTable('notification_stats', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').notNull(),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD format
  totalSent: int('total_sent').default(0),
  totalDelivered: int('total_delivered').default(0),
  totalOpened: int('total_opened').default(0),
  totalClicked: int('total_clicked').default(0),
  totalFailed: int('total_failed').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Campaigns Table
export const notificationCampaigns = mysqlTable('notification_campaigns', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).notNull(), // 'broadcast', 'segment', 'triggered'
  targetAudience: json('target_audience'), // JSON object for targeting criteria
  templateId: varchar('template_id', { length: 255 }).references(() => notificationTemplates.id),
  scheduledFor: timestamp('scheduled_for'),
  status: varchar('status', { length: 20 }).default('draft'), // 'draft', 'scheduled', 'running', 'completed', 'cancelled'
  totalSent: int('total_sent').default(0),
  totalDelivered: int('total_delivered').default(0),
  totalOpened: int('total_opened').default(0),
  totalClicked: int('total_clicked').default(0),
  totalFailed: int('total_failed').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notification Logs Table
export const notificationLogs = mysqlTable('notification_logs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  notificationId: varchar('notification_id', { length: 255 }).notNull().references(() => pushNotifications.id),
  userId: int('user_id').notNull(),
  deviceTokenId: varchar('device_token_id', { length: 255 }).references(() => deviceTokens.id),
  platform: varchar('platform', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'
  response: json('response'), // JSON object for provider response
  errorMessage: text('error_message'),
  retryCount: int('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Notification Preferences Table
export const notificationPreferences = mysqlTable('notification_preferences', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: int('user_id').unique().notNull(),
  categories: json('categories'), // JSON object with category preferences
  channels: json('channels'), // JSON object with channel preferences
  frequency: json('frequency'), // JSON object with frequency settings
  quietHours: json('quiet_hours'), // JSON object with quiet hours settings
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Create indexes for better performance
export const notificationIndexes = {
  deviceTokens_userId: sql`CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id)`,
  deviceTokens_token: sql`CREATE INDEX IF NOT EXISTS device_tokens_token_idx ON device_tokens(token)`,
  deviceTokens_platform: sql`CREATE INDEX IF NOT EXISTS device_tokens_platform_idx ON device_tokens(platform)`,
  deviceTokens_isActive: sql`CREATE INDEX IF NOT EXISTS device_tokens_is_active_idx ON device_tokens(is_active)`,
  pushNotifications_userId: sql`CREATE INDEX IF NOT EXISTS push_notifications_user_id_idx ON push_notifications(user_id)`,
  pushNotifications_status: sql`CREATE INDEX IF NOT EXISTS push_notifications_status_idx ON push_notifications(status)`,
  pushNotifications_type: sql`CREATE INDEX IF NOT EXISTS push_notifications_type_idx ON push_notifications(type)`,
  pushNotifications_scheduledFor: sql`CREATE INDEX IF NOT EXISTS push_notifications_scheduled_for_idx ON push_notifications(scheduled_for)`,
  pushNotifications_platform: sql`CREATE INDEX IF NOT EXISTS push_notifications_platform_idx ON push_notifications(platform)`,
  notificationSettings_userId: sql`CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id)`,
  notificationTemplates_type: sql`CREATE INDEX IF NOT EXISTS notification_templates_type_idx ON notification_templates(type)`,
  notificationTemplates_isActive: sql`CREATE INDEX IF NOT EXISTS notification_templates_is_active_idx ON notification_templates(is_active)`,
  notificationStats_userId: sql`CREATE INDEX IF NOT EXISTS notification_stats_user_id_idx ON notification_stats(user_id)`,
  notificationStats_date: sql`CREATE INDEX IF NOT EXISTS notification_stats_date_idx ON notification_stats(date)`,
  notificationCampaigns_type: sql`CREATE INDEX IF NOT EXISTS notification_campaigns_type_idx ON notification_campaigns(type)`,
  notificationCampaigns_status: sql`CREATE INDEX IF NOT EXISTS notification_campaigns_status_idx ON notification_campaigns(status)`,
  notificationLogs_notificationId: sql`CREATE INDEX IF NOT EXISTS notification_logs_notification_id_idx ON notification_logs(notification_id)`,
  notificationLogs_userId: sql`CREATE INDEX IF NOT EXISTS notification_logs_user_id_idx ON notification_logs(user_id)`,
  notificationLogs_deviceTokenId: sql`CREATE INDEX IF NOT EXISTS notification_logs_device_token_id_idx ON notification_logs(device_token_id)`,
  notificationLogs_status: sql`CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON notification_logs(status)`,
  notificationPreferences_userId: sql`CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON notification_preferences(user_id)`,
};