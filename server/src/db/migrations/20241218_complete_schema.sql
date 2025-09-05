-- Complete Database Schema Migration for AICalorieTracker
-- This migration creates all missing tables and aligns the schema with MySQL syntax

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Core User and Authentication Tables
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    referred_by INT,
    referral_code VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_type VARCHAR(255),
    subscription_status VARCHAR(255),
    subscription_end_date DATETIME,
    is_premium BOOLEAN DEFAULT FALSE,
    nutrition_goals JSON,
    role VARCHAR(50) DEFAULT 'user',
    -- Onboarding fields
    age INT,
    gender VARCHAR(20),
    height INT, -- in cm
    weight INT, -- in kg
    activity_level VARCHAR(50),
    primary_goal VARCHAR(100),
    target_weight INT, -- in kg
    timeline VARCHAR(50),
    dietary_preferences JSON,
    allergies JSON,
    ai_meal_suggestions BOOLEAN DEFAULT TRUE,
    ai_chat_assistant_name VARCHAR(100),
    notifications_enabled BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_completed_at DATETIME,
    -- Core user fields
    daily_calorie_target INT DEFAULT 2000,
    protein_target DECIMAL(5,2) DEFAULT 150.00,
    carbs_target DECIMAL(5,2) DEFAULT 250.00,
    fat_target DECIMAL(5,2) DEFAULT 67.00,
    measurement_system VARCHAR(10) DEFAULT 'metric',
    profile_image_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires_at DATETIME,
    last_login_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    notifications_enabled BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    measurement_system VARCHAR(10) DEFAULT 'metric',
    dietary_restrictions JSON,
    allergies JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Weekly Stats Table
CREATE TABLE IF NOT EXISTS weekly_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    average_calories INT NOT NULL,
    meals_tracked INT NOT NULL,
    average_protein INT NOT NULL,
    healthiest_day VARCHAR(255) NOT NULL,
    week_starting DATE NOT NULL,
    calories_by_day JSON NOT NULL,
    macros_by_day JSON,
    calories_burned INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_week_starting (week_starting),
    INDEX idx_average_calories (average_calories),
    INDEX idx_meals_tracked (meals_tracked)
);

-- Site Content Table
CREATE TABLE IF NOT EXISTS site_content (
    key VARCHAR(64) PRIMARY KEY,
    value TEXT NOT NULL
);

-- App Config Table
CREATE TABLE IF NOT EXISTS app_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_id (id),
    INDEX idx_key (key),
    INDEX idx_type (type)
);

-- Planned Meals Table
CREATE TABLE IF NOT EXISTS planned_meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL,
    meal_name VARCHAR(255) NOT NULL,
    calories INT DEFAULT 0,
    protein INT DEFAULT 0,
    carbs INT DEFAULT 0,
    fat INT DEFAULT 0,
    recipe TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date),
    INDEX idx_meal_type (meal_type),
    INDEX idx_user_date (user_id, date)
);

-- Nutrition Goals Table
CREATE TABLE IF NOT EXISTS nutrition_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    calories INT NOT NULL,
    protein INT NOT NULL,
    carbs INT NOT NULL,
    fat INT NOT NULL,
    daily_calories INT,
    weekly_workouts INT,
    water_intake INT,
    weight INT,
    body_fat_percentage INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_calories (calories),
    INDEX idx_protein (protein),
    INDEX idx_carbs (carbs),
    INDEX idx_fat (fat)
);

-- Meal and Nutrition Tables
CREATE TABLE IF NOT EXISTS meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
    calories INT NOT NULL,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    fiber DECIMAL(5,2),
    sugar DECIMAL(5,2),
    sodium INT,
    meal_date DATE NOT NULL,
    meal_time TIME NOT NULL,
    notes TEXT,
    is_manual BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_meal_date (meal_date),
    INDEX idx_meal_type (type)
);

CREATE TABLE IF NOT EXISTS meal_analyses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_id INT NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    confidence_score DECIMAL(5,4),
    analysis_details JSON,
    ai_insights TEXT,
    suggested_portion_size VARCHAR(100),
    estimated_calories INT,
    estimated_protein DECIMAL(5,2),
    estimated_carbs DECIMAL(5,2),
    estimated_fat DECIMAL(5,2),
    image_url VARCHAR(500),
    image_hash VARCHAR(64),
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_analysis_timestamp (analysis_timestamp),
    INDEX idx_image_hash (image_hash)
);

CREATE TABLE IF NOT EXISTS meal_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_analysis_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INT,
    height INT,
    image_hash VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (meal_analysis_id) REFERENCES meal_analyses(id) ON DELETE CASCADE,
    INDEX idx_meal_analysis_id (meal_analysis_id),
    INDEX idx_image_hash (image_hash)
);

CREATE TABLE IF NOT EXISTS meal_image_archive (
    id INT AUTO_INCREMENT PRIMARY KEY,
    meal_analysis_id INT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_analysis_id) REFERENCES meal_analyses(id) ON DELETE CASCADE,
    INDEX idx_meal_analysis_id (meal_analysis_id)
);

-- Health and Fitness Tables
CREATE TABLE IF NOT EXISTS health_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score_type ENUM('nutrition', 'fitness', 'recovery', 'consistency', 'overall') NOT NULL,
    score_value DECIMAL(5,2) NOT NULL,
    calculation_date DATE NOT NULL,
    score_details JSON,
    trend_direction ENUM('improving', 'stable', 'declining') DEFAULT 'stable',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_score_type (score_type),
    INDEX idx_calculation_date (calculation_date)
);

CREATE TABLE IF NOT EXISTS health_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type ENUM('weight', 'steps', 'calories', 'sleep', 'exercise') NOT NULL,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    deadline DATE,
    is_achieved BOOLEAN DEFAULT FALSE,
    achieved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_goal_type (goal_type)
);

CREATE TABLE IF NOT EXISTS health_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    insight_type ENUM('warning', 'recommendation', 'achievement', 'alert') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    metric_type VARCHAR(50),
    value DECIMAL(10,2),
    threshold DECIMAL(10,2),
    recommendation TEXT,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_insight_type (insight_type),
    INDEX idx_priority (priority)
);

CREATE TABLE IF NOT EXISTS workouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration INT NOT NULL, -- in minutes
    calories_burned INT NOT NULL,
    workout_type VARCHAR(50),
    intensity ENUM('low', 'medium', 'high'),
    date DATE NOT NULL,
    notes TEXT,
    consistency_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date (date)
);

-- Real-time Monitoring Tables
CREATE TABLE IF NOT EXISTS real_time_monitoring (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(5,4),
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_metric_type (metric_type),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS pattern_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSON NOT NULL,
    confidence_score DECIMAL(5,4),
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_pattern_type (pattern_type)
);

CREATE TABLE IF NOT EXISTS health_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type ENUM('weekly', 'monthly', 'quarterly', 'annual') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary JSON,
    insights JSON,
    recommendations JSON,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_report_type (report_type),
    INDEX idx_period (period_start, period_end)
);

-- Wearable Device Integration Tables
CREATE TABLE IF NOT EXISTS wearable_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    device_id VARCHAR(100),
    metric_type VARCHAR(50) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source ENUM('automatic', 'manual', 'api') DEFAULT 'automatic',
    confidence_score DECIMAL(5,4),
    metadata JSON,
    synced_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_device_type (device_type),
    INDEX idx_metric_type (metric_type),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS healthcare_integration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_type ENUM('apple_health', 'google_fit', 'fitbit', 'garmin', 'medtronic', 'omron', 'withings', 'oura') NOT NULL,
    provider_id VARCHAR(100),
    access_token TEXT,
    refresh_token TEXT,
    expires_at DATETIME,
    scopes JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_provider_type (provider_type)
);

-- User Content Tables
CREATE TABLE IF NOT EXISTS favorite_meals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    meal_name VARCHAR(255) NOT NULL,
    meal_id INT,
    meal_type VARCHAR(50),
    ingredients JSON,
    nutrition JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_meal_name (meal_name)
);

CREATE TABLE IF NOT EXISTS imported_recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    ingredients JSON,
    instructions TEXT,
    parsed_nutrition JSON,
    notes TEXT,
    source_url VARCHAR(500),
    source_image_url VARCHAR(500),
    raw_image_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_recipe_name (recipe_name)
);

-- Referral System Tables
CREATE TABLE IF NOT EXISTS referral_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referral_commissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    referrer_id INT NOT NULL,
    referee_id INT NOT NULL,
    subscription_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
    is_recurring BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_referrer_id (referrer_id),
    INDEX idx_referee_id (referee_id),
    INDEX idx_status (status)
);

-- Localization Tables
CREATE TABLE IF NOT EXISTS languages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    language_id INT NOT NULL,
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    is_auto_translated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE,
    INDEX idx_language_id (language_id),
    INDEX idx_key (key)
);

-- System and Analytics Tables
CREATE TABLE IF NOT EXISTS user_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE IF NOT EXISTS analytics_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INT,
    session_id VARCHAR(100),
    event_data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(45),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp)
);

-- Create default admin user
INSERT INTO users (email, password_hash, first_name, last_name, is_premium, is_active) 
VALUES ('admin@aicalorietracker.com', '$2b$10$example_hash_here', 'Admin', 'User', TRUE, TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email);

-- Create default language
INSERT INTO languages (code, name, is_default, is_active) 
VALUES ('en', 'English', TRUE, TRUE)
ON DUPLICATE KEY UPDATE code = VALUES(code);

-- Create default referral settings
INSERT INTO referral_settings (commission_percent, is_recurring) 
VALUES (10.00, FALSE)
ON DUPLICATE KEY UPDATE commission_percent = VALUES(commission_percent);

-- Create default translations
INSERT INTO translations (language_id, key, value) 
SELECT l.id, 'app.title', 'AICalorieTracker' 
FROM languages l WHERE l.code = 'en'
ON DUPLICATE KEY UPDATE key = VALUES(key);

INSERT INTO translations (language_id, key, value) 
SELECT l.id, 'welcome.message', 'Welcome to AICalorieTracker!' 
FROM languages l WHERE l.code = 'en'
ON DUPLICATE KEY UPDATE key = VALUES(key);

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create stored procedures for health score calculation
DELIMITER //

CREATE PROCEDURE CalculateHealthScores(IN p_user_id INT, IN p_calculation_date DATE)
BEGIN
    -- Nutrition Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'nutrition',
        -- Calculate nutrition score based on calorie targets and macronutrient balance
        CASE 
            WHEN COUNT(m.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 40 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.protein >= u.protein_target * 0.9 THEN 30 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.carbs >= u.carbs_target * 0.9 THEN 20 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.fat >= u.fat_target * 0.9 THEN 10 ELSE 0 END) / COUNT(m.id))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'avg_calories', AVG(m.calories),
            'avg_protein', AVG(m.protein),
            'avg_carbs', AVG(m.carbs),
            'avg_fat', AVG(m.fat),
            'calorie_consistency', (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 1 ELSE 0 END) / COUNT(m.id)) * 100
        ),
        'stable'
    FROM users u
    LEFT JOIN meals m ON u.id = m.user_id AND DATE(m.meal_date) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Fitness Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'fitness',
        -- Calculate fitness score based on workout frequency and intensity
        CASE 
            WHEN COUNT(w.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (MIN(100, (COUNT(w.id) / 7) * 100) * 0.4) + -- Workout frequency (40%)
                    (AVG(w.calories_burned) / 500 * 100 * 0.3) + -- Calorie burn (30%)
                    (MIN(100, AVG(w.duration) / 60 * 100) * 0.3) -- Workout duration (30%)
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'workout_count', COUNT(w.id),
            'avg_duration', AVG(w.duration),
            'avg_calories_burned', AVG(w.calories_burned),
            'high_intensity_ratio', (SUM(CASE WHEN w.intensity = 'high' THEN 1 ELSE 0 END) / COUNT(w.id)) * 100,
            'consistency_score', AVG(w.consistency_score)
        ),
        'stable'
    FROM users u
    LEFT JOIN workouts w ON u.id = w.user_id AND DATE(w.date) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Overall Health Score (weighted average)
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'overall',
        -- Weighted average: Nutrition (30%), Fitness (25%), Recovery (25%), Consistency (20%)
        CASE 
            WHEN (COUNT(n.id) + COUNT(f.id)) = 0 THEN 0
            ELSE 
                (SUM(n.score_value * 0.3) + SUM(f.score_value * 0.25)) / 
                (COUNT(n.id) + COUNT(f.id))
        END,
        p_calculation_date,
        JSON_OBJECT(
            'nutrition_score', COALESCE(AVG(n.score_value), 0),
            'fitness_score', COALESCE(AVG(f.score_value), 0),
            'weighted_average', 
                (COALESCE(AVG(n.score_value), 0) * 0.3) + 
                (COALESCE(AVG(f.score_value), 0) * 0.25)
        ),
        'stable'
    FROM users u
    LEFT JOIN health_scores n ON u.id = n.user_id AND n.score_type = 'nutrition' AND n.calculation_date = p_calculation_date
    LEFT JOIN health_scores f ON u.id = f.user_id AND f.score_type = 'fitness' AND f.calculation_date = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
END //

DELIMITER ;

-- Create trigger for updating timestamps
DELIMITER //
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP();
DELIMITER ;

-- Create trigger for generating health insights
DELIMITER //
CREATE TRIGGER generate_health_insights AFTER INSERT ON health_scores
FOR EACH ROW
BEGIN
    IF NEW.score_type = 'nutrition' AND NEW.score_value < 70 THEN
        INSERT INTO health_insights (user_id, insight_type, title, message, priority, metric_type, value, threshold, recommendation)
        VALUES (NEW.user_id, 'warning', 'Poor Nutrition Score', 
                CONCAT('Your nutrition score is ', ROUND(NEW.score_value), '. Consider improving your diet quality.'),
                'medium', 'nutrition', NEW.score_value, 70, 
                'Focus on balanced meals with proper macronutrient ratios.');
    END IF;
    
    IF NEW.score_type = 'fitness' AND NEW.score_value < 60 THEN
        INSERT INTO health_insights (user_id, insight_type, title, message, priority, metric_type, value, threshold, recommendation)
        VALUES (NEW.user_id, 'warning', 'Low Fitness Activity', 
                CONCAT('Your fitness score is ', ROUND(NEW.score_value), '. Increase your physical activity.'),
                'medium', 'fitness', NEW.score_value, 60,
                'Aim for at least 30 minutes of moderate exercise most days of the week.');
    END IF;
    
    IF NEW.score_type = 'overall' AND NEW.score_value < 65 THEN
        INSERT INTO health_insights (user_id, insight_type, title, message, priority, metric_type, value, threshold, recommendation)
        VALUES (NEW.user_id, 'warning', 'Overall Health Score Low', 
                CONCAT('Your overall health score is ', ROUND(NEW.score_value), '. Focus on improving key health areas.'),
                'high', 'overall', NEW.score_value, 65,
                'Review your nutrition, fitness, and recovery habits to improve your overall health score.');
    END IF;
END //
DELIMITER ;

-- Create view for user health summary
CREATE OR REPLACE VIEW user_health_summary AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    MAX(n.score_value) as nutrition_score,
    MAX(f.score_value) as fitness_score,
    MAX(o.score_value) as overall_score,
    COUNT(i.id) as active_insights,
    COUNT(m.id) as total_meals,
    COUNT(w.id) as total_workouts,
    DATE(MAX(m.meal_date)) as last_meal_date,
    DATE(MAX(w.date)) as last_workout_date
FROM users u
LEFT JOIN health_scores n ON u.id = n.user_id AND n.score_type = 'nutrition'
LEFT JOIN health_scores f ON u.id = f.user_id AND f.score_type = 'fitness'
LEFT JOIN health_scores o ON u.id = o.user_id AND o.score_type = 'overall'
LEFT JOIN health_insights i ON u.id = i.user_id AND i.is_acknowledged = FALSE
LEFT JOIN meals m ON u.id = m.user_id
LEFT JOIN workouts w ON u.id = w.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON aicalorietracker.* TO 'aicalorietracker_user'@'localhost';
FLUSH PRIVILEGES;

-- Display completion message
SELECT 'Database schema migration completed successfully!' as message;