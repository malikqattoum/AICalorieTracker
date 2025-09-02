-- Complete missing tables from shared schema

-- Create favorite_meals table
CREATE TABLE IF NOT EXISTS `favorite_meals` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `meal_name` varchar(255) NOT NULL,
  `meal_id` int DEFAULT NULL,
  `meal_type` varchar(50) DEFAULT NULL,
  `ingredients` json DEFAULT NULL,
  `nutrition` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_favorite_meals_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create meal_images table for optimized image storage
CREATE TABLE IF NOT EXISTS `meal_images` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `meal_analysis_id` int NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `image_hash` varchar(64) UNIQUE,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  FOREIGN KEY (`meal_analysis_id`) REFERENCES `meal_analyses`(`id`) ON DELETE CASCADE,
  INDEX `idx_meal_images_meal_analysis_id` (`meal_analysis_id`),
  INDEX `idx_meal_images_image_hash` (`image_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create meal_image_archive table for old images
CREATE TABLE IF NOT EXISTS `meal_image_archive` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `meal_analysis_id` int NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `archived_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`meal_analysis_id`) REFERENCES `meal_analyses`(`id`) ON DELETE CASCADE,
  INDEX `idx_meal_image_archive_meal_analysis_id` (`meal_analysis_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create languages table
CREATE TABLE IF NOT EXISTS `languages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `code` varchar(10) NOT NULL UNIQUE,
  `name` varchar(100) NOT NULL,
  `is_default` boolean DEFAULT FALSE,
  `is_active` boolean DEFAULT TRUE,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_languages_code` (`code`),
  INDEX `idx_languages_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create translations table
CREATE TABLE IF NOT EXISTS `translations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `language_id` int NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text NOT NULL,
  `is_auto_translated` boolean DEFAULT FALSE,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`language_id`) REFERENCES `languages`(`id`) ON DELETE CASCADE,
  INDEX `idx_translations_language_id` (`language_id`),
  INDEX `idx_translations_key` (`key`),
  UNIQUE KEY `unique_translation_key` (`language_id`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create workouts table (updated schema)
CREATE TABLE IF NOT EXISTS `workouts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `duration` int NOT NULL COMMENT 'Duration in minutes',
  `calories_burned` int NOT NULL,
  `date` datetime NOT NULL,
  `notes` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_workouts_user_id` (`user_id`),
  INDEX `idx_workouts_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create referral_settings table (if not exists)
CREATE TABLE IF NOT EXISTS `referral_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `commission_percent` decimal(5,2) NOT NULL DEFAULT 10.00,
  `is_recurring` boolean NOT NULL DEFAULT FALSE,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create referral_commissions table (if not exists)
CREATE TABLE IF NOT EXISTS `referral_commissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `referrer_id` int NOT NULL,
  `referee_id` int NOT NULL,
  `subscription_id` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `is_recurring` boolean NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` datetime DEFAULT NULL,
  FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`),
  FOREIGN KEY (`referee_id`) REFERENCES `users`(`id`),
  INDEX `idx_referral_commissions_referrer_id` (`referrer_id`),
  INDEX `idx_referral_commissions_referee_id` (`referee_id`),
  INDEX `idx_referral_commissions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default language records
INSERT INTO `languages` (`code`, `name`, `is_default`, `is_active`) VALUES
('en', 'English', TRUE, TRUE),
('es', 'Spanish', FALSE, TRUE),
('fr', 'French', FALSE, TRUE),
('de', 'German', FALSE, TRUE),
('zh', 'Chinese', FALSE, TRUE),
('ja', 'Japanese', FALSE, TRUE),
('ko', 'Korean', FALSE, TRUE),
('pt', 'Portuguese', FALSE, TRUE),
('ru', 'Russian', FALSE, TRUE),
('ar', 'Arabic', FALSE, TRUE)
ON DUPLICATE KEY UPDATE `is_active` = VALUES(`is_active`);

-- Insert default referral settings if not exists
INSERT INTO `referral_settings` (`commission_percent`, `is_recurring`) 
VALUES (10.00, FALSE)
ON DUPLICATE KEY UPDATE `commission_percent` = VALUES(`commission_percent`),
                          `is_recurring` = VALUES(`is_recurring`);

-- Add missing columns to existing tables if they don't exist

-- Add missing columns to users table
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `referred_by` int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `referral_code` varchar(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `age` int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `gender` varchar(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `height` int DEFAULT NULL COMMENT 'Height in cm',
ADD COLUMN IF NOT EXISTS `weight` int DEFAULT NULL COMMENT 'Weight in kg',
ADD COLUMN IF NOT EXISTS `activity_level` varchar(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `primary_goal` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `target_weight` int DEFAULT NULL COMMENT 'Target weight in kg',
ADD COLUMN IF NOT EXISTS `timeline` varchar(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `dietary_preferences` json DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `allergies` json DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `ai_meal_suggestions` boolean DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS `ai_chat_assistant_name` varchar(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `notifications_enabled` boolean DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS `onboarding_completed` boolean DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS `onboarding_completed_at` datetime DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `role` text DEFAULT 'user' NOT NULL;

-- Add missing columns to nutrition_goals table
ALTER TABLE `nutrition_goals` 
ADD COLUMN IF NOT EXISTS `calories` int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `protein` int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `carbs` int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `fat` int NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS `water_intake` int DEFAULT 2000,
ADD COLUMN IF NOT EXISTS `weight` int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `body_fat_percentage` int DEFAULT NULL;

-- Add missing columns to meal_analyses table
ALTER TABLE `meal_analyses` 
ADD COLUMN IF NOT EXISTS `imageId` int DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `thumbnailPath` varchar(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `optimizedPath` varchar(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `originalPath` varchar(500) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `imageHash` varchar(64) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS `deleted_at` datetime DEFAULT NULL;

-- Add missing columns to weekly_stats table
ALTER TABLE `weekly_stats` 
ADD COLUMN IF NOT EXISTS `calories_burned` int DEFAULT 0;

-- Add missing columns to imported_recipes table
ALTER TABLE `imported_recipes` 
ADD COLUMN IF NOT EXISTS `userId` int NOT NULL DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_users_referred_by` ON `users`(`referred_by`);
CREATE INDEX IF NOT EXISTS `idx_users_referral_code` ON `users`(`referral_code`);
CREATE INDEX IF NOT EXISTS `idx_users_age` ON `users`(`age`);
CREATE INDEX IF NOT EXISTS `idx_users_gender` ON `users`(`gender`);
CREATE INDEX IF NOT EXISTS `idx_users_height` ON `users`(`height`);
CREATE INDEX IF NOT EXISTS `idx_users_weight` ON `users`(`weight`);
CREATE INDEX IF NOT EXISTS `idx_users_activity_level` ON `users`(`activity_level`);
CREATE INDEX IF NOT EXISTS `idx_users_primary_goal` ON `users`(`primary_goal`);
CREATE INDEX IF NOT EXISTS `idx_users_target_weight` ON `users`(`target_weight`);
CREATE INDEX IF NOT EXISTS `idx_users_timeline` ON `users`(`timeline`);
CREATE INDEX IF NOT EXISTS `idx_users_ai_meal_suggestions` ON `users`(`ai_meal_suggestions`);
CREATE INDEX IF NOT EXISTS `idx_users_notifications_enabled` ON `users`(`notifications_enabled`);
CREATE INDEX IF NOT EXISTS `idx_users_onboarding_completed` ON `users`(`onboarding_completed`);
CREATE INDEX IF NOT EXISTS `idx_users_onboarding_completed_at` ON `users`(`onboarding_completed_at`);
CREATE INDEX IF NOT EXISTS `idx_users_role` ON `users`(`role`);

CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_calories` ON `nutrition_goals`(`calories`);
CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_protein` ON `nutrition_goals`(`protein`);
CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_carbs` ON `nutrition_goals`(`carbs`);
CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_fat` ON `nutrition_goals`(`fat`);
CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_water_intake` ON `nutrition_goals`(`water_intake`);
CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_weight` ON `nutrition_goals`(`weight`);
CREATE INDEX IF NOT EXISTS `idx_nutrition_goals_body_fat_percentage` ON `nutrition_goals`(`body_fat_percentage`);

CREATE INDEX IF NOT EXISTS `idx_meal_analyses_image_id` ON `meal_analyses`(`imageId`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_thumbnail_path` ON `meal_analyses`(`thumbnailPath`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_optimized_path` ON `meal_analyses`(`optimizedPath`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_original_path` ON `meal_analyses`(`originalPath`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_image_hash` ON `meal_analyses`(`imageHash`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_created_at` ON `meal_analyses`(`created_at`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_updated_at` ON `meal_analyses`(`updated_at`);
CREATE INDEX IF NOT EXISTS `idx_meal_analyses_deleted_at` ON `meal_analyses`(`deleted_at`);

CREATE INDEX IF NOT EXISTS `idx_weekly_stats_calories_burned` ON `weekly_stats`(`calories_burned`);

CREATE INDEX IF NOT EXISTS `idx_imported_recipes_user_id` ON `imported_recipes`(`userId`);

-- Create foreign key constraints for new columns
ALTER TABLE `users` 
ADD CONSTRAINT `fk_users_referred_by` FOREIGN KEY (`referred_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- Create triggers for automatic timestamp updates
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_meal_analyses_update 
BEFORE UPDATE ON `meal_analyses` 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_users_update 
BEFORE UPDATE ON `users` 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_nutrition_goals_update 
BEFORE UPDATE ON `nutrition_goals` 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_imported_recipes_update 
BEFORE UPDATE ON `imported_recipes` 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Create stored procedure for cleaning up old meal images
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cleanup_old_meal_images(IN days_to_keep INT)
BEGIN
    DELETE FROM `meal_image_archive` 
    WHERE `archived_at` < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    SELECT ROW_COUNT() as deleted_rows;
END//
DELIMITER ;

-- Create stored procedure for generating user statistics
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_user_statistics(IN p_user_id INT)
BEGIN
    -- Generate weekly stats for the user
    INSERT INTO `weekly_stats` (`user_id`, `average_calories`, `meals_tracked`, `average_protein`, `healthiest_day`, `week_starting`, `calories_by_day`, `macros_by_day`)
    SELECT 
        u.id,
        COALESCE(AVG(m.calories), 0) as average_calories,
        COUNT(m.id) as meals_tracked,
        COALESCE(AVG(m.protein), 0) as average_protein,
        'Monday' as healthiest_day, -- This could be calculated based on actual data
        DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY) as week_starting,
        JSON_OBJECT(
            'Monday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 0 THEN m.calories ELSE 0 END), 0),
            'Tuesday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 1 THEN m.calories ELSE 0 END), 0),
            'Wednesday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 2 THEN m.calories ELSE 0 END), 0),
            'Thursday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 3 THEN m.calories ELSE 0 END), 0),
            'Friday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 4 THEN m.calories ELSE 0 END), 0),
            'Saturday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 5 THEN m.calories ELSE 0 END), 0),
            'Sunday', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 6 THEN m.calories ELSE 0 END), 0)
        ) as calories_by_day,
        JSON_OBJECT(
            'Monday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 0 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 0 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 0 THEN m.fat ELSE 0 END), 0)),
            'Tuesday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 1 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 1 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 1 THEN m.fat ELSE 0 END), 0)),
            'Wednesday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 2 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 2 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 2 THEN m.fat ELSE 0 END), 0)),
            'Thursday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 3 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 3 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 3 THEN m.fat ELSE 0 END), 0)),
            'Friday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 4 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 4 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 4 THEN m.fat ELSE 0 END), 0)),
            'Saturday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 5 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 5 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 5 THEN m.fat ELSE 0 END), 0)),
            'Sunday', JSON_OBJECT('protein', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 6 THEN m.protein ELSE 0 END), 0), 'carbs', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 6 THEN m.carbs ELSE 0 END), 0), 'fat', COALESCE(SUM(CASE WHEN WEEKDAY(m.timestamp) = 6 THEN m.fat ELSE 0 END), 0))
        ) as macros_by_day
    FROM users u
    LEFT JOIN meal_analyses m ON u.id = m.user_id 
        AND m.timestamp >= DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY)
        AND m.timestamp < DATE_SUB(CURRENT_DATE(), INTERVAL WEEKDAY(CURRENT_DATE()) DAY) + INTERVAL 7 DAY
    WHERE u.id = p_user_id
    GROUP BY u.id
    ON DUPLICATE KEY UPDATE
        average_calories = VALUES(average_calories),
        meals_tracked = VALUES(meals_tracked),
        average_protein = VALUES(average_protein),
        healthiest_day = VALUES(healthiest_day),
        week_starting = VALUES(week_starting),
        calories_by_day = VALUES(calories_by_day),
        macros_by_day = VALUES(macros_by_day);
END//
DELIMITER ;