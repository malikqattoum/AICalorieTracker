-- Database Schema Optimization Migration
-- This migration addresses performance, data integrity, and maintenance issues

-- Add foreign key constraints for data integrity
ALTER TABLE meal_analyses 
ADD CONSTRAINT fk_meal_analyses_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE weekly_stats 
ADD CONSTRAINT fk_weekly_stats_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE planned_meals 
ADD CONSTRAINT fk_planned_meals_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE nutrition_goals 
ADD CONSTRAINT fk_nutrition_goals_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE favorite_meals 
ADD CONSTRAINT fk_favorite_meals_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE imported_recipes 
ADD CONSTRAINT fk_imported_recipes_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE referral_commissions 
ADD CONSTRAINT fk_referral_commissions_referrer 
FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_referral_commissions_referee 
FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE workouts 
ADD CONSTRAINT fk_workouts_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE wearable_data 
ADD CONSTRAINT fk_wearable_data_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add check constraints for data validation
ALTER TABLE users 
ADD CONSTRAINT chk_age CHECK (age IS NULL OR (age >= 13 AND age <= 120)),
ADD CONSTRAINT chk_height CHECK (height IS NULL OR (height >= 100 AND height <= 250)),
ADD CONSTRAINT chk_weight CHECK (weight IS NULL OR (weight >= 30 AND weight <= 300)),
ADD CONSTRAINT chk_email CHECK (email IS NULL OR email LIKE '%_@_%._%');

ALTER TABLE meal_analyses 
ADD CONSTRAINT chk_nutrition_values CHECK (
    calories >= 0 AND 
    protein >= 0 AND 
    carbs >= 0 AND 
    fat >= 0 AND 
    fiber >= 0
);

ALTER TABLE nutrition_goals 
ADD CONSTRAINT chk_nutrition_goals CHECK (
    calories >= 0 AND 
    protein >= 0 AND 
    carbs >= 0 AND 
    fat >= 0 AND 
    dailyCalories >= 0
);

-- Add indexes for frequently queried fields
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_meal_analyses_user_id ON meal_analyses(user_id);
CREATE INDEX idx_meal_analyses_timestamp ON meal_analyses(timestamp);
CREATE INDEX idx_meal_analyses_user_timestamp ON meal_analyses(user_id, timestamp);

CREATE INDEX idx_weekly_stats_user_id ON weekly_stats(user_id);
CREATE INDEX idx_weekly_stats_week_starting ON weekly_stats(week_starting);
CREATE INDEX idx_weekly_stats_user_week ON weekly_stats(user_id, week_starting);

CREATE INDEX idx_planned_meals_user_id ON planned_meals(user_id);
CREATE INDEX idx_planned_meals_date ON planned_meals(date);
CREATE INDEX idx_planned_meals_user_date ON planned_meals(user_id, date);
CREATE INDEX idx_planned_meals_meal_type ON planned_meals(meal_type);

CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);
CREATE INDEX idx_nutrition_goals_created_at ON nutrition_goals(created_at);

CREATE INDEX idx_favorite_meals_user_id ON favorite_meals(user_id);
CREATE INDEX idx_favorite_meals_meal_name ON favorite_meals(meal_name);

CREATE INDEX idx_imported_recipes_user_id ON imported_recipes(user_id);
CREATE INDEX idx_imported_recipes_created_at ON imported_recipes(created_at);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);

CREATE INDEX idx_wearable_data_user_id ON wearable_data(user_id);
CREATE INDEX idx_wearable_data_date ON wearable_data(date);
CREATE INDEX idx_wearable_data_user_date ON wearable_data(user_id, date);

CREATE INDEX idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX idx_referral_commissions_referee_id ON referral_commissions(referee_id);
CREATE INDEX idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX idx_referral_commissions_created_at ON referral_commissions(created_at);

-- Add audit fields to all tables
ALTER TABLE users 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE meal_analyses 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE weekly_stats 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE site_content 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE app_config 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE planned_meals 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE nutrition_goals 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE favorite_meals 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE imported_recipes 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE referral_settings 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE referral_commissions 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE languages 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE translations 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE workouts 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE wearable_data 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

ALTER TABLE ai_config 
ADD COLUMN created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN deleted_at datetime NULL;

-- Create indexes for audit fields
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_meal_analyses_deleted_at ON meal_analyses(deleted_at);
CREATE INDEX idx_weekly_stats_deleted_at ON weekly_stats(deleted_at);

-- Optimize JSON field queries by adding computed columns for common queries
ALTER TABLE weekly_stats 
ADD COLUMN total_calories_week int GENERATED ALWAYS AS (
    JSON_UNQUOTE(JSON_EXTRACT(calories_by_day, '$.total')) 
) STORED,
ADD COLUMN avg_calories_day int GENERATED ALWAYS AS (
    JSON_UNQUOTE(JSON_EXTRACT(calories_by_day, '$.average')) 
) STORED;

-- Add indexes for the new computed columns
CREATE INDEX idx_weekly_stats_total_calories ON weekly_stats(total_calories_week);
CREATE INDEX idx_weekly_stats_avg_calories ON weekly_stats(avg_calories_day);

-- Create a table for image file storage to optimize performance
CREATE TABLE meal_images (
    id int AUTO_INCREMENT PRIMARY KEY,
    meal_analysis_id int NOT NULL,
    file_path varchar(500) NOT NULL,
    file_size int NOT NULL,
    mime_type varchar(100) NOT NULL,
    width int,
    height int,
    created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_analysis_id) REFERENCES meal_analyses(id) ON DELETE CASCADE,
    INDEX idx_meal_images_meal_analysis_id (meal_analysis_id),
    INDEX idx_meal_images_created_at (created_at)
);

-- Add a trigger to move image data from meal_analyses to meal_images
DELIMITER //
CREATE TRIGGER before_meal_analyses_update
BEFORE UPDATE ON meal_analyses
FOR EACH ROW
BEGIN
    -- If image_data is being updated and not empty, move it to meal_images
    IF NEW.image_data IS NOT NULL AND NEW.image_data != '' AND (OLD.image_data IS NULL OR OLD.image_data != NEW.image_data) THEN
        INSERT INTO meal_images (meal_analysis_id, file_path, file_size, mime_type, width, height)
        VALUES (
            NEW.id,
            CONCAT('/uploads/meal_images/', NEW.id, '.jpg'),
            LENGTH(NEW.image_data),
            'image/jpeg',
            NULL, -- Would need to extract actual dimensions
            NULL  -- Would need to extract actual dimensions
        );
    END IF;
END //
DELIMITER ;

-- Create a maintenance procedure for database optimization
DELIMITER //
CREATE PROCEDURE optimize_database()
BEGIN
    -- Analyze tables to update statistics
    ANALYZE TABLE users, meal_analyses, weekly_stats, planned_meals, nutrition_goals;
    
    -- Optimize tables to reclaim space and defragment
    OPTIMIZE TABLE users, meal_analyses, weekly_stats, planned_meals, nutrition_goals;
    
    -- Clean up old soft-deleted records (older than 90 days)
    DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    DELETE FROM meal_analyses WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    DELETE FROM weekly_stats WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Archive old meal images to reduce storage
    INSERT INTO meal_image_archive (
        meal_analysis_id, file_path, file_size, mime_type, archived_at
    )
    SELECT 
        mi.meal_analysis_id, 
        mi.file_path, 
        mi.file_size, 
        mi.mime_type, 
        NOW()
    FROM meal_images mi
    JOIN meal_analyses ma ON mi.meal_analysis_id = ma.id
    WHERE ma.timestamp < DATE_SUB(NOW(), INTERVAL 180 DAY)
    ON DUPLICATE KEY UPDATE archived_at = NOW();
    
    -- Delete archived images from the main table
    DELETE mi FROM meal_images mi
    JOIN meal_image_archive mia ON mi.meal_analysis_id = mia.meal_analysis_id
    WHERE mia.archived_at IS NOT NULL;
    
    -- Create backup of important data
    CREATE TABLE IF NOT EXISTS weekly_stats_backup LIKE weekly_stats;
    INSERT INTO weekly_stats_backup
    SELECT * FROM weekly_stats 
    WHERE week_starting < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Add a log entry for the maintenance
    INSERT INTO app_config (key, value, description, type)
    VALUES ('database_last_maintenance', NOW(), 'Last database maintenance run', 'datetime')
    ON DUPLICATE KEY UPDATE value = NOW(), updated_at = NOW();
    
    SELECT 'Database optimization completed successfully' as message;
END //
DELIMITER ;

-- Create a view for user statistics to optimize common queries
CREATE VIEW user_statistics AS
SELECT 
    u.id,
    u.username,
    u.email,
    COUNT(DISTINCT ma.id) as total_meals,
    SUM(ma.calories) as total_calories,
    AVG(ma.calories) as avg_meal_calories,
    COUNT(DISTINCT DATE(ma.timestamp)) as active_days,
    MAX(ma.timestamp) as last_meal_date,
    COUNT(DISTINCT ws.id) as weekly_stats_records,
    MAX(ws.week_starting) as last_week_stats
FROM users u
LEFT JOIN meal_analyses ma ON u.id = ma.user_id AND ma.deleted_at IS NULL
LEFT JOIN weekly_stats ws ON u.id = ws.user_id AND ws.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username, u.email;

-- Create indexes for the view
CREATE INDEX idx_user_statistics_total_meals ON user_statistics(total_meals);
CREATE INDEX idx_user_statistics_last_meal_date ON user_statistics(last_meal_date);

-- Add a trigger to automatically update updated_at timestamp
DELIMITER //
CREATE TRIGGER update_updated_at_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- Add similar triggers for other important tables
DELIMITER //
CREATE TRIGGER update_meal_analyses_updated_at
BEFORE UPDATE ON meal_analyses
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER update_weekly_stats_updated_at
BEFORE UPDATE ON weekly_stats
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //
DELIMITER ;

-- Create a table for database change tracking
CREATE TABLE database_changes (
    id int AUTO_INCREMENT PRIMARY KEY,
    table_name varchar(100) NOT NULL,
    operation_type varchar(20) NOT NULL, -- INSERT, UPDATE, DELETE
    record_id int NOT NULL,
    changed_by varchar(255) NOT NULL,
    changed_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_values json,
    new_values json,
    INDEX idx_database_changes_table (table_name),
    INDEX idx_database_changes_operation (operation_type),
    INDEX idx_database_changes_changed_at (changed_at)
);

-- Add triggers for change tracking
DELIMITER //
CREATE TRIGGER track_users_changes
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO database_changes (table_name, operation_type, record_id, changed_by, new_values)
    VALUES ('users', 'INSERT', NEW.id, CURRENT_USER(), JSON_OBJECT(
        'id', NEW.id,
        'username', NEW.username,
        'email', NEW.email,
        'created_at', NEW.created_at
    ));
END //

CREATE TRIGGER track_users_changes_after_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    INSERT INTO database_changes (table_name, operation_type, record_id, changed_by, old_values, new_values)
    VALUES ('users', 'UPDATE', NEW.id, CURRENT_USER(), JSON_OBJECT(
        'username', OLD.username,
        'email', OLD.email
    ), JSON_OBJECT(
        'username', NEW.username,
        'email', NEW.email
    ));
END //

CREATE TRIGGER track_users_changes_after_delete
AFTER DELETE ON users
FOR EACH ROW
BEGIN
    INSERT INTO database_changes (table_name, operation_type, record_id, changed_by, old_values)
    VALUES ('users', 'DELETE', OLD.id, CURRENT_USER(), JSON_OBJECT(
        'id', OLD.id,
        'username', OLD.username,
        'email', OLD.email,
        'deleted_at', OLD.deleted_at
    ));
END //
DELIMITER ;