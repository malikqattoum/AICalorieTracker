CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`theme` varchar(20) DEFAULT 'light',
	`language` varchar(10) DEFAULT 'en',
	`notifications_enabled` boolean DEFAULT true,
	`email_notifications` boolean DEFAULT true,
	`push_notifications` boolean DEFAULT true,
	`measurement_system` varchar(10) DEFAULT 'metric',
	`dietary_restrictions` longtext,
	`allergies` longtext,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ai_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(50) NOT NULL DEFAULT 'openai',
	`api_key_encrypted` text,
	`model_name` varchar(100) DEFAULT 'gpt-4-vision-preview',
	`temperature` int DEFAULT 70,
	`max_tokens` int DEFAULT 1000,
	`prompt_template` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `ai_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `languages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`is_default` boolean DEFAULT false,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `languages_id` PRIMARY KEY(`id`),
	CONSTRAINT `languages_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `translations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`language_id` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`is_auto_translated` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `translations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commission_percent` decimal(5,2) NOT NULL DEFAULT 10.00,
	`is_recurring` boolean NOT NULL DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `referral_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referral_commissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_id` int NOT NULL,
	`referee_id` int NOT NULL,
	`subscription_id` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL DEFAULT 0.00,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`is_recurring` boolean NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`paid_at` datetime,
	CONSTRAINT `referral_commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`goal_type` varchar(50) NOT NULL,
	`goal_title` varchar(100) NOT NULL,
	`goal_description` text,
	`target_value` decimal(10,2) NOT NULL,
	`current_value` decimal(10,2) DEFAULT '0.00',
	`unit` varchar(20) NOT NULL,
	`start_date` varchar(10) NOT NULL,
	`target_date` varchar(10) NOT NULL,
	`deadline_date` varchar(10),
	`status` varchar(20) DEFAULT 'active',
	`priority` varchar(20) DEFAULT 'medium',
	`progress_percentage` decimal(5,2) DEFAULT '0.00',
	`achievement_probability` decimal(5,2) DEFAULT '0.00',
	`milestones` json,
	`achievements` json,
	`obstacles` json,
	`strategies` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	`completed_at` timestamp,
	CONSTRAINT `health_goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`insight_type` varchar(50) NOT NULL,
	`insight_category` varchar(20) DEFAULT 'neutral',
	`insight_title` varchar(100) NOT NULL,
	`insight_description` text NOT NULL,
	`insight_data` json,
	`confidence_score` decimal(3,2) NOT NULL,
	`action_items` json,
	`related_metrics` json,
	`is_actioned` boolean DEFAULT false,
	`actioned_at` timestamp,
	`action_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `health_insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_predictions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`prediction_type` varchar(50) NOT NULL,
	`target_date` varchar(10) NOT NULL,
	`prediction_value` decimal(10,2) NOT NULL,
	`confidence_score` decimal(3,2) NOT NULL,
	`model_version` varchar(100),
	`input_data` json,
	`prediction_details` json,
	`recommendations` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `health_predictions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`report_type` varchar(20) NOT NULL,
	`report_period_start` varchar(10) NOT NULL,
	`report_period_end` varchar(10) NOT NULL,
	`report_status` varchar(20) DEFAULT 'draft',
	`report_data` json NOT NULL,
	`summary_text` text,
	`key_findings` json,
	`recommendations` json,
	`generated_at` timestamp,
	`delivered_at` timestamp,
	`archived_at` timestamp,
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `health_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `health_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`score_type` varchar(50) NOT NULL,
	`score_value` decimal(5,2) NOT NULL,
	`max_score` decimal(5,2) DEFAULT '100.00',
	`calculation_date` varchar(10) NOT NULL,
	`score_details` json,
	`trend_direction` varchar(20) DEFAULT 'stable',
	`confidence_level` decimal(3,2),
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `health_scores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `healthcare_integration` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`professional_id` varchar(100) NOT NULL,
	`professional_type` varchar(50) NOT NULL,
	`professional_name` varchar(100) NOT NULL,
	`practice_name` varchar(100),
	`access_level` varchar(20) DEFAULT 'read_only',
	`data_sharing_consent` boolean DEFAULT false,
	`consent_date` varchar(10),
	`data_expiration_date` varchar(10),
	`shared_data` json,
	`notes` text,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `healthcare_integration_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pattern_analysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`pattern_type` varchar(50) NOT NULL,
	`analysis_period` varchar(20) NOT NULL,
	`start_date` varchar(10) NOT NULL,
	`end_date` varchar(10) NOT NULL,
	`correlation_score` decimal(3,2) NOT NULL,
	`significance_level` decimal(3,2),
	`pattern_strength` varchar(20) DEFAULT 'moderate',
	`insights` json,
	`triggers` json,
	`interventions` json,
	`recommendations` json,
	`is_validated` boolean DEFAULT false,
	`validated_by` varchar(100),
	`validation_notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `pattern_analysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `real_time_monitoring` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`metric_type` varchar(50) NOT NULL,
	`metric_value` decimal(10,2) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`timestamp` timestamp DEFAULT (now()),
	`is_alert` boolean DEFAULT false,
	`alert_level` varchar(20) DEFAULT 'low',
	`alert_message` text,
	`action_taken` varchar(100),
	`metadata` json,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `real_time_monitoring_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_album_items` (
	`id` varchar(255) NOT NULL,
	`album_id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`order` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_album_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_albums` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`cover_image_id` varchar(255),
	`is_public` boolean DEFAULT false,
	`is_deleted` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_analytics` (
	`id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`action` varchar(20) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`referrer` text,
	`timestamp` timestamp DEFAULT (now()),
	CONSTRAINT `image_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_cache` (
	`id` varchar(255) NOT NULL,
	`cache_key` varchar(255),
	`image_id` varchar(255) NOT NULL,
	`size` varchar(20) NOT NULL,
	`data` text NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`hit_count` int DEFAULT 0,
	`last_accessed` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `image_cache_cache_key_unique` UNIQUE(`cache_key`)
);
--> statement-breakpoint
CREATE TABLE `image_metadata` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`stored_filename` varchar(255) NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`width` int,
	`height` int,
	`file_size_compressed` int,
	`compression_ratio` decimal(5,2),
	`storage_type` varchar(20) DEFAULT 'local',
	`is_public` boolean DEFAULT false,
	`download_count` int DEFAULT 0,
	`last_accessed` timestamp,
	`expires_at` timestamp,
	`metadata` text,
	`tags` text,
	`category` varchar(50),
	`is_deleted` boolean DEFAULT false,
	`deleted_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_metadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_moderation` (
	`id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`moderated_by` int,
	`status` varchar(20) DEFAULT 'pending',
	`reason` text,
	`confidence_score` decimal(5,4),
	`moderation_data` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_moderation_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_processing_jobs` (
	`id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`job_type` varchar(20) NOT NULL,
	`status` varchar(20) DEFAULT 'pending',
	`progress` int DEFAULT 0,
	`error_message` text,
	`output_data` text,
	`priority` int DEFAULT 5,
	`started_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_processing_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_sharing` (
	`id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`shared_by` int NOT NULL,
	`shared_with` int,
	`access_type` varchar(20) DEFAULT 'view',
	`expires_at` timestamp,
	`is_revoked` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_sharing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `image_storage_quotas` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`total_quota` bigint DEFAULT 5368709120,
	`used_quota` int DEFAULT 0,
	`image_count` int DEFAULT 0,
	`last_updated` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_storage_quotas_id` PRIMARY KEY(`id`),
	CONSTRAINT `image_storage_quotas_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `image_thumbnails` (
	`id` varchar(255) NOT NULL,
	`image_id` varchar(255) NOT NULL,
	`size` varchar(20) NOT NULL,
	`width` int NOT NULL,
	`height` int NOT NULL,
	`file_size` int NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`storage_type` varchar(20) DEFAULT 'local',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `image_thumbnails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_image_archive` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal_analysis_id` int NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`archived_at` timestamp DEFAULT (now()),
	CONSTRAINT `meal_image_archive_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meal_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`meal_analysis_id` int NOT NULL,
	`file_path` varchar(500) NOT NULL,
	`file_size` int NOT NULL,
	`mime_type` varchar(100) NOT NULL,
	`width` int,
	`height` int,
	`image_hash` varchar(64),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `meal_images_id` PRIMARY KEY(`id`),
	CONSTRAINT `meal_images_image_hash_unique` UNIQUE(`image_hash`)
);
--> statement-breakpoint
CREATE TABLE `device_tokens` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`platform` varchar(20) NOT NULL,
	`is_active` boolean DEFAULT true,
	`last_used` timestamp DEFAULT (now()),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `device_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `device_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `notification_campaigns` (
	`id` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`type` varchar(20) NOT NULL,
	`target_audience` json,
	`template_id` varchar(255),
	`scheduled_for` timestamp,
	`status` varchar(20) DEFAULT 'draft',
	`total_sent` int DEFAULT 0,
	`total_delivered` int DEFAULT 0,
	`total_opened` int DEFAULT 0,
	`total_clicked` int DEFAULT 0,
	`total_failed` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `notification_campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_logs` (
	`id` varchar(255) NOT NULL,
	`notification_id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`device_token_id` varchar(255),
	`platform` varchar(20) NOT NULL,
	`status` varchar(20) NOT NULL,
	`response` json,
	`error_message` text,
	`retry_count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`categories` json,
	`channels` json,
	`frequency` json,
	`quiet_hours` json,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`meal_reminders` boolean DEFAULT true,
	`goal_achievements` boolean DEFAULT true,
	`health_alerts` boolean DEFAULT true,
	`system_notifications` boolean DEFAULT true,
	`marketing_notifications` boolean DEFAULT false,
	`email_notifications` boolean DEFAULT true,
	`push_notifications` boolean DEFAULT true,
	`quiet_hours_start` varchar(5),
	`quiet_hours_end` varchar(5),
	`frequency` varchar(20) DEFAULT 'immediate',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_settings_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_stats` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`total_sent` int DEFAULT 0,
	`total_delivered` int DEFAULT 0,
	`total_opened` int DEFAULT 0,
	`total_clicked` int DEFAULT 0,
	`total_failed` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `notification_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_templates` (
	`id` varchar(255) NOT NULL,
	`name` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`data` json,
	`type` varchar(50) NOT NULL,
	`is_active` boolean DEFAULT true,
	`is_default` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `notification_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_templates_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `push_notifications` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`data` json,
	`type` varchar(50) DEFAULT 'system',
	`priority` varchar(20) DEFAULT 'normal',
	`scheduled_for` timestamp,
	`sent_at` timestamp,
	`status` varchar(20) DEFAULT 'pending',
	`platform` varchar(20),
	`retry_count` int DEFAULT 0,
	`max_retries` int DEFAULT 3,
	`error_message` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `push_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`stripe_customer_id` varchar(255),
	`email` varchar(255),
	`name` varchar(255),
	`phone` varchar(50),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_user_id_unique` UNIQUE(`user_id`),
	CONSTRAINT `customers_stripe_customer_id_unique` UNIQUE(`stripe_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`subscription_id` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'usd',
	`status` varchar(50) DEFAULT 'open',
	`hosted_invoice_url` varchar(500),
	`invoice_pdf` varchar(500),
	`due_date` timestamp,
	`paid_at` timestamp,
	`stripe_invoice_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_intents` (
	`id` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'usd',
	`status` varchar(50) DEFAULT 'requires_payment_method',
	`client_secret` varchar(255) NOT NULL,
	`payment_method_id` varchar(255),
	`user_id` int NOT NULL,
	`metadata` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `payment_intents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`last4` varchar(4),
	`brand` varchar(50),
	`exp_month` int,
	`exp_year` int,
	`is_default` boolean DEFAULT false,
	`provider_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_webhooks` (
	`id` varchar(255) NOT NULL,
	`event_type` varchar(100) NOT NULL,
	`event_data` text NOT NULL,
	`processed` boolean DEFAULT false,
	`processed_at` timestamp,
	`error_message` text,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `payment_webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` varchar(255) NOT NULL,
	`transaction_id` varchar(255) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'usd',
	`status` varchar(50) DEFAULT 'pending',
	`reason` varchar(100),
	`description` text,
	`stripe_refund_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_items` (
	`id` varchar(255) NOT NULL,
	`subscription_id` varchar(255) NOT NULL,
	`price_id` varchar(255) NOT NULL,
	`quantity` int DEFAULT 1,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `subscription_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` varchar(50) NOT NULL,
	`status` varchar(50) DEFAULT 'incomplete',
	`current_period_start` timestamp NOT NULL,
	`current_period_end` timestamp NOT NULL,
	`trial_end` timestamp,
	`canceled_at` timestamp,
	`cancel_at_period_end` boolean DEFAULT false,
	`payment_method_id` varchar(255),
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'usd',
	`status` varchar(50) NOT NULL,
	`payment_intent_id` varchar(255) NOT NULL,
	`subscription_id` varchar(255),
	`description` varchar(500) NOT NULL,
	`metadata` text,
	`stripe_charge_id` varchar(255),
	`refunded_at` timestamp,
	`refund_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wearable_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`device_type` varchar(50) NOT NULL,
	`device_id` varchar(100),
	`metric_type` varchar(50) NOT NULL,
	`value` decimal(10,2) NOT NULL,
	`unit` varchar(20) NOT NULL,
	`timestamp` timestamp DEFAULT (now()),
	`source` varchar(20) DEFAULT 'automatic',
	`confidence_score` decimal(5,4),
	`metadata` json,
	`synced_at` timestamp,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()),
	`deleted_at` timestamp,
	CONSTRAINT `wearable_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `nutrition_goals` DROP INDEX `nutrition_goals_user_id_unique`;--> statement-breakpoint
ALTER TABLE `app_config` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `app_config` MODIFY COLUMN `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `favorite_meals` MODIFY COLUMN `meal_id` int;--> statement-breakpoint
ALTER TABLE `favorite_meals` MODIFY COLUMN `meal_type` varchar(50);--> statement-breakpoint
ALTER TABLE `favorite_meals` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `imported_recipes` MODIFY COLUMN `source_url` varchar(500);--> statement-breakpoint
ALTER TABLE `imported_recipes` MODIFY COLUMN `source_image_url` varchar(500);--> statement-breakpoint
ALTER TABLE `imported_recipes` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nutrition_goals` MODIFY COLUMN `daily_calories` int;--> statement-breakpoint
ALTER TABLE `nutrition_goals` MODIFY COLUMN `weekly_workouts` int;--> statement-breakpoint
ALTER TABLE `nutrition_goals` MODIFY COLUMN `water_intake` int;--> statement-breakpoint
ALTER TABLE `nutrition_goals` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `nutrition_goals` MODIFY COLUMN `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `date` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `calories` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `calories` int;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `protein` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `protein` int;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `carbs` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `carbs` int;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `fat` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `fat` int;--> statement-breakpoint
ALTER TABLE `planned_meals` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` varchar(50) DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `nutrition_goals` longtext;--> statement-breakpoint
ALTER TABLE `weekly_stats` MODIFY COLUMN `week_starting` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_stats` MODIFY COLUMN `calories_by_day` longtext NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_stats` MODIFY COLUMN `macros_by_day` longtext;--> statement-breakpoint
ALTER TABLE `workouts` MODIFY COLUMN `date` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `workouts` MODIFY COLUMN `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `favorite_meals` ADD `ingredients` json;--> statement-breakpoint
ALTER TABLE `favorite_meals` ADD `nutrition` json;--> statement-breakpoint
ALTER TABLE `favorite_meals` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `imported_recipes` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `meal_id` int NOT NULL;--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `confidence_score` decimal(5,4);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `analysis_details` json;--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `ai_insights` text;--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `suggested_portion_size` varchar(100);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `estimated_calories` int;--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `estimated_protein` decimal(5,2);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `estimated_carbs` decimal(5,2);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `estimated_fat` decimal(5,2);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `image_url` varchar(500);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `image_hash` varchar(64);--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `analysis_timestamp` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `meal_analyses` ADD `deleted_at` datetime;--> statement-breakpoint
ALTER TABLE `nutrition_goals` ADD `calories` int NOT NULL;--> statement-breakpoint
ALTER TABLE `nutrition_goals` ADD `protein` int NOT NULL;--> statement-breakpoint
ALTER TABLE `nutrition_goals` ADD `carbs` int NOT NULL;--> statement-breakpoint
ALTER TABLE `nutrition_goals` ADD `fat` int NOT NULL;--> statement-breakpoint
ALTER TABLE `nutrition_goals` ADD `weight` int;--> statement-breakpoint
ALTER TABLE `nutrition_goals` ADD `body_fat_percentage` int;--> statement-breakpoint
ALTER TABLE `planned_meals` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `referred_by` int;--> statement-breakpoint
ALTER TABLE `users` ADD `referral_code` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `gender` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `height` int;--> statement-breakpoint
ALTER TABLE `users` ADD `weight` int;--> statement-breakpoint
ALTER TABLE `users` ADD `activity_level` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `primary_goal` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `target_weight` int;--> statement-breakpoint
ALTER TABLE `users` ADD `timeline` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `dietary_preferences` longtext;--> statement-breakpoint
ALTER TABLE `users` ADD `allergies` longtext;--> statement-breakpoint
ALTER TABLE `users` ADD `ai_meal_suggestions` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `ai_chat_assistant_name` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `notifications_enabled` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_completed` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `onboarding_completed_at` datetime DEFAULT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `daily_calorie_target` int DEFAULT 2000;--> statement-breakpoint
ALTER TABLE `users` ADD `protein_target` decimal(5,2) DEFAULT 150.00;--> statement-breakpoint
ALTER TABLE `users` ADD `carbs_target` decimal(5,2) DEFAULT 250.00;--> statement-breakpoint
ALTER TABLE `users` ADD `fat_target` decimal(5,2) DEFAULT 67.00;--> statement-breakpoint
ALTER TABLE `users` ADD `measurement_system` varchar(10) DEFAULT 'metric';--> statement-breakpoint
ALTER TABLE `users` ADD `profile_image_url` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `email_verified` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `email_verification_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `reset_password_token` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `reset_password_expires_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` datetime;--> statement-breakpoint
ALTER TABLE `users` ADD `is_active` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `weekly_stats` ADD `created_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `weekly_stats` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `workouts` ADD `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `workouts` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `workouts` ADD `updated_at` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_referral_code_unique` UNIQUE(`referral_code`);--> statement-breakpoint
ALTER TABLE `image_album_items` ADD CONSTRAINT `image_album_items_album_id_image_albums_id_fk` FOREIGN KEY (`album_id`) REFERENCES `image_albums`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_album_items` ADD CONSTRAINT `image_album_items_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_albums` ADD CONSTRAINT `image_albums_cover_image_id_image_metadata_id_fk` FOREIGN KEY (`cover_image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_analytics` ADD CONSTRAINT `image_analytics_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_cache` ADD CONSTRAINT `image_cache_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_moderation` ADD CONSTRAINT `image_moderation_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_processing_jobs` ADD CONSTRAINT `image_processing_jobs_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_sharing` ADD CONSTRAINT `image_sharing_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `image_thumbnails` ADD CONSTRAINT `image_thumbnails_image_id_image_metadata_id_fk` FOREIGN KEY (`image_id`) REFERENCES `image_metadata`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_campaigns` ADD CONSTRAINT `notification_campaigns_template_id_notification_templates_id_fk` FOREIGN KEY (`template_id`) REFERENCES `notification_templates`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_notification_id_push_notifications_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `push_notifications`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notification_logs` ADD CONSTRAINT `notification_logs_device_token_id_device_tokens_id_fk` FOREIGN KEY (`device_token_id`) REFERENCES `device_tokens`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_items` ADD CONSTRAINT `subscription_items_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorite_meals` DROP COLUMN `calories`;--> statement-breakpoint
ALTER TABLE `favorite_meals` DROP COLUMN `protein`;--> statement-breakpoint
ALTER TABLE `favorite_meals` DROP COLUMN `carbs`;--> statement-breakpoint
ALTER TABLE `favorite_meals` DROP COLUMN `fat`;--> statement-breakpoint
ALTER TABLE `favorite_meals` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `favorite_meals` DROP COLUMN `tags`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `calories`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `protein`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `carbs`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `fat`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `fiber`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `image_data`;--> statement-breakpoint
ALTER TABLE `meal_analyses` DROP COLUMN `timestamp`;--> statement-breakpoint
ALTER TABLE `nutrition_goals` DROP COLUMN `daily_protein`;--> statement-breakpoint
ALTER TABLE `nutrition_goals` DROP COLUMN `daily_carbs`;--> statement-breakpoint
ALTER TABLE `nutrition_goals` DROP COLUMN `daily_fat`;--> statement-breakpoint
ALTER TABLE `workouts` DROP COLUMN `type`;