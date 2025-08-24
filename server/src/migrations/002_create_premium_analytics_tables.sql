-- Create premium analytics tables for advanced health data processing

-- Create health scores table for personalized health scoring
CREATE TABLE IF NOT EXISTS health_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score_type ENUM('nutrition', 'fitness', 'recovery', 'consistency', 'overall') NOT NULL,
    score_value DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100.00,
    calculation_date DATE NOT NULL,
    score_details JSON,
    trend_direction ENUM('improving', 'stable', 'declining') DEFAULT 'stable',
    confidence_level DECIMAL(3,2),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_score_type (user_id, score_type),
    INDEX idx_calculation_date (calculation_date),
    INDEX idx_score_value (score_value),
    UNIQUE KEY unique_user_date_type (user_id, calculation_date, score_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create health predictions table for predictive analytics
CREATE TABLE IF NOT EXISTS health_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    prediction_type ENUM('weight_projection', 'goal_achievement', 'health_risk', 'performance_optimization') NOT NULL,
    target_date DATE NOT NULL,
    prediction_value DECIMAL(10,2) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    model_version VARCHAR(50),
    input_data JSON,
    prediction_details JSON,
    recommendations JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_prediction_type (user_id, prediction_type),
    INDEX idx_target_date (target_date),
    INDEX idx_confidence_score (confidence_score),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create pattern analysis table for AI-powered pattern recognition
CREATE TABLE IF NOT EXISTS pattern_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pattern_type ENUM('sleep_nutrition', 'exercise_nutrition', 'stress_eating', 'metabolic_rate') NOT NULL,
    analysis_period ENUM('daily', 'weekly', 'monthly') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    correlation_score DECIMAL(3,2) NOT NULL,
    significance_level DECIMAL(3,2),
    pattern_strength ENUM('weak', 'moderate', 'strong', 'very_strong') DEFAULT 'moderate',
    insights JSON,
    triggers JSON,
    interventions JSON,
    recommendations JSON,
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by VARCHAR(100),
    validation_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_pattern_type (user_id, pattern_type),
    INDEX idx_analysis_period (analysis_period),
    INDEX idx_correlation_score (correlation_score),
    INDEX idx_pattern_strength (pattern_strength),
    UNIQUE KEY unique_user_period_type (user_id, start_date, end_date, pattern_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create health reports table for professional health reports
CREATE TABLE IF NOT EXISTS health_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type ENUM('weekly_summary', 'monthly_progress', 'quarterly_review', 'annual_journey') NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    report_status ENUM('draft', 'generated', 'delivered', 'archived') DEFAULT 'draft',
    report_data JSON NOT NULL,
    summary_text TEXT,
    key_findings JSON,
    recommendations JSON,
    generated_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    archived_at TIMESTAMP NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_report_type (user_id, report_type),
    INDEX idx_report_period (report_period_start, report_period_end),
    INDEX idx_report_status (report_status),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create real-time monitoring table for continuous health tracking
CREATE TABLE IF NOT EXISTS real_time_monitoring (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type ENUM('heart_rate', 'blood_pressure', 'blood_oxygen', 'sleep_quality', 'stress_level', 'activity_level') NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    is_alert BOOLEAN DEFAULT FALSE,
    alert_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    alert_message TEXT,
    action_taken TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_metric_type (user_id, metric_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_is_alert (is_alert),
    INDEX idx_alert_level (alert_level),
    INDEX idx_metric_value (metric_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create healthcare integration table for professional collaboration
CREATE TABLE IF NOT EXISTS healthcare_integration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    professional_id VARCHAR(100) NOT NULL,
    professional_type ENUM('doctor', 'nutritionist', 'fitness_coach', 'therapist') NOT NULL,
    professional_name VARCHAR(200) NOT NULL,
    practice_name VARCHAR(200),
    access_level ENUM('read_only', 'read_write', 'full_access') DEFAULT 'read_only',
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    consent_date DATE,
    data_expiration_date DATE,
    shared_data JSON,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_professional (user_id, professional_id),
    INDEX idx_professional_type (professional_type),
    INDEX idx_access_level (access_level),
    INDEX idx_is_active (is_active),
    INDEX idx_consent_date (consent_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create health goals table for goal tracking and achievement forecasting
CREATE TABLE IF NOT EXISTS health_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type ENUM('weight_loss', 'weight_gain', 'muscle_gain', 'fitness_improvement', 'health_improvement') NOT NULL,
    goal_title VARCHAR(200) NOT NULL,
    goal_description TEXT,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0.00,
    unit VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    target_date DATE NOT NULL,
    deadline_date DATE,
    status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    achievement_probability DECIMAL(5,2) DEFAULT 0.00,
    milestones JSON,
    achievements JSON,
    obstacles JSON,
    strategies JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goal_type (user_id, goal_type),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_target_date (target_date),
    INDEX idx_progress_percentage (progress_percentage),
    INDEX idx_achievement_probability (achievement_probability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create health insights table for AI-generated insights
CREATE TABLE IF NOT EXISTS health_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    insight_type ENUM('nutrition', 'fitness', 'recovery', 'behavior', 'risk') NOT NULL,
    insight_category ENUM('positive', 'neutral', 'warning', 'critical') DEFAULT 'neutral',
    insight_title VARCHAR(200) NOT NULL,
    insight_description TEXT NOT NULL,
    insight_data JSON,
    confidence_score DECIMAL(3,2) NOT NULL,
    action_items JSON,
    related_metrics JSON,
    is_actioned BOOLEAN DEFAULT FALSE,
    actioned_at TIMESTAMP NULL,
    action_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_insight_type (user_id, insight_type),
    INDEX idx_insight_category (insight_category),
    INDEX idx_confidence_score (confidence_score),
    INDEX idx_is_actioned (is_actioned),
    INDEX idx_created_at (created_at),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_health_scores_user_date ON health_scores(user_id, calculation_date);
CREATE INDEX idx_health_predictions_user_date ON health_predictions(user_id, target_date);
CREATE INDEX idx_pattern_analysis_user_date ON pattern_analysis(user_id, start_date, end_date);
CREATE INDEX idx_health_reports_user_period ON health_reports(user_id, report_period_start, report_period_end);
CREATE INDEX idx_real_time_monitoring_user_time ON real_time_monitoring(user_id, timestamp);
CREATE INDEX idx_health_goals_user_status ON health_goals(user_id, status);
CREATE INDEX idx_health_insights_user_created ON health_insights(user_id, created_at);

-- Create triggers for automatic timestamp updates
DELIMITER //
CREATE TRIGGER before_health_scores_update 
BEFORE UPDATE ON health_scores 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_health_predictions_update 
BEFORE UPDATE ON health_predictions 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_pattern_analysis_update 
BEFORE UPDATE ON pattern_analysis 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_health_reports_update 
BEFORE UPDATE ON health_reports 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_healthcare_integration_update 
BEFORE UPDATE ON healthcare_integration 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_health_goals_update 
BEFORE UPDATE ON health_goals 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER before_health_insights_update 
BEFORE UPDATE ON health_insights 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Create stored procedure for cleaning up old real-time monitoring data
DELIMITER //
CREATE PROCEDURE cleanup_old_monitoring_data(IN days_to_keep INT)
BEGIN
    DELETE FROM real_time_monitoring 
    WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    SELECT ROW_COUNT() as deleted_rows;
END//
DELIMITER ;

-- Create stored procedure for generating health scores
DELIMITER //
CREATE PROCEDURE generate_health_scores(
    IN p_user_id INT,
    IN p_calculation_date DATE
)
BEGIN
    -- Nutrition Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'nutrition',
        -- Calculate nutrition score based on macronutrient balance and calorie consistency
        CASE 
            WHEN COUNT(m.id) = 0 THEN 0
            ELSE 
                -- Score based on protein intake (30% weight), carb balance (30%), fat balance (20%), 
                -- calorie consistency (20%), and micronutrient diversity (10%)
                LEAST(100, 
                    (SUM(CASE WHEN m.protein >= 0.8 * (u.weight * 2.2) * 0.4 THEN 30 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.carbs BETWEEN 45 AND 65 THEN 30 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN m.fat BETWEEN 20 AND 35 THEN 20 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 20 ELSE 0 END) / COUNT(m.id)) +
                    (SUM(CASE WHEN COUNT(DISTINCT m.food_category) >= 5 THEN 10 ELSE 0 END) / COUNT(m.id))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'total_meals', COUNT(m.id),
            'avg_calories', AVG(m.calories),
            'avg_protein', AVG(m.protein),
            'avg_carbs', AVG(m.carbs),
            'avg_fat', AVG(m.fat),
            'calorie_consistency', (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 1 ELSE 0 END) / COUNT(m.id)) * 100,
            'food_diversity', AVG(COUNT(DISTINCT m.food_category))
        ),
        'stable'
    FROM users u
    LEFT JOIN meals m ON u.id = m.user_id AND DATE(m.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Fitness Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'fitness',
        -- Calculate fitness score based on activity level and consistency
        CASE 
            WHEN COUNT(w.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (SUM(CASE WHEN w.duration >= 30 THEN 40 ELSE 0 END) / COUNT(w.id)) +
                    (SUM(CASE WHEN w.calories_burned >= 200 THEN 30 ELSE 0 END) / COUNT(w.id)) +
                    (SUM(CASE WHEN w.intensity = 'high' THEN 20 ELSE 0 END) / COUNT(w.id)) +
                    (SUM(CASE WHEN w.consistency_score >= 80 THEN 10 ELSE 0 END) / COUNT(w.id))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'total_workouts', COUNT(w.id),
            'avg_duration', AVG(w.duration),
            'avg_calories_burned', AVG(w.calories_burned),
            'high_intensity_ratio', (SUM(CASE WHEN w.intensity = 'high' THEN 1 ELSE 0 END) / COUNT(w.id)) * 100,
            'consistency_score', AVG(w.consistency_score)
        ),
        'stable'
    FROM users u
    LEFT JOIN workouts w ON u.id = w.user_id AND DATE(w.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Recovery Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'recovery',
        -- Calculate recovery score based on sleep quality and rest metrics
        CASE 
            WHEN COUNT(s.id) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (SUM(CASE WHEN s.duration >= 7 THEN 40 ELSE 0 END) / COUNT(s.id)) +
                    (SUM(CASE WHEN s.quality_score >= 80 THEN 30 ELSE 0 END) / COUNT(s.id)) +
                    (SUM(CASE WHEN s.deep_sleep_ratio >= 0.2 THEN 20 ELSE 0 END) / COUNT(s.id)) +
                    (SUM(CASE WHEN s.consistency >= 85 THEN 10 ELSE 0 END) / COUNT(s.id))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'avg_sleep_duration', AVG(s.duration),
            'avg_sleep_quality', AVG(s.quality_score),
            'avg_deep_sleep_ratio', AVG(s.deep_sleep_ratio),
            'sleep_consistency', AVG(s.consistency)
        ),
        'stable'
    FROM users u
    LEFT JOIN sleep_data s ON u.id = s.user_id AND DATE(s.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Consistency Score Calculation
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'consistency',
        -- Calculate consistency score across all health metrics
        CASE 
            WHEN (COUNT(m.id) + COUNT(w.id) + COUNT(s.id)) = 0 THEN 0
            ELSE 
                LEAST(100,
                    (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 33 ELSE 0 END) / 
                     (COUNT(m.id) + COUNT(w.id) + COUNT(s.id))) +
                    (SUM(CASE WHEN w.duration >= 30 THEN 33 ELSE 0 END) / 
                     (COUNT(m.id) + COUNT(w.id) + COUNT(s.id))) +
                    (SUM(CASE WHEN s.duration >= 7 THEN 34 ELSE 0 END) / 
                     (COUNT(m.id) + COUNT(w.id) + COUNT(s.id)))
                )
        END,
        p_calculation_date,
        JSON_OBJECT(
            'nutrition_consistency', (SUM(CASE WHEN ABS(m.calories - u.daily_calorie_target) <= u.daily_calorie_target * 0.1 THEN 1 ELSE 0 END) / COUNT(m.id)) * 100,
            'fitness_consistency', (SUM(CASE WHEN w.duration >= 30 THEN 1 ELSE 0 END) / COUNT(w.id)) * 100,
            'recovery_consistency', (SUM(CASE WHEN s.duration >= 7 THEN 1 ELSE 0 END) / COUNT(s.id)) * 100
        ),
        'stable'
    FROM users u
    LEFT JOIN meals m ON u.id = m.user_id AND DATE(m.created_at) = p_calculation_date
    LEFT JOIN workouts w ON u.id = w.user_id AND DATE(w.created_at) = p_calculation_date
    LEFT JOIN sleep_data s ON u.id = s.user_id AND DATE(s.created_at) = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
    
    -- Overall Health Score (weighted average)
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction)
    SELECT 
        u.id,
        'overall',
        -- Weighted average: Nutrition (30%), Fitness (25%), Recovery (25%), Consistency (20%)
        CASE 
            WHEN (COUNT(n.id) + COUNT(f.id) + COUNT(r.id) + COUNT(c.id)) = 0 THEN 0
            ELSE 
                (SUM(n.score_value * 0.3) + SUM(f.score_value * 0.25) + 
                 SUM(r.score_value * 0.25) + SUM(c.score_value * 0.2)) / 
                (COUNT(n.id) + COUNT(f.id) + COUNT(r.id) + COUNT(c.id))
        END,
        p_calculation_date,
        JSON_OBJECT(
            'nutrition_score', COALESCE(AVG(n.score_value), 0),
            'fitness_score', COALESCE(AVG(f.score_value), 0),
            'recovery_score', COALESCE(AVG(r.score_value), 0),
            'consistency_score', COALESCE(AVG(c.score_value), 0),
            'weighted_average', 
                (COALESCE(AVG(n.score_value), 0) * 0.3) + 
                (COALESCE(AVG(f.score_value), 0) * 0.25) + 
                (COALESCE(AVG(r.score_value), 0) * 0.25) + 
                (COALESCE(AVG(c.score_value), 0) * 0.2)
        ),
        'stable'
    FROM users u
    LEFT JOIN health_scores n ON u.id = n.user_id AND n.score_type = 'nutrition' AND n.calculation_date = p_calculation_date
    LEFT JOIN health_scores f ON u.id = f.user_id AND f.score_type = 'fitness' AND f.calculation_date = p_calculation_date
    LEFT JOIN health_scores r ON u.id = r.user_id AND r.score_type = 'recovery' AND r.calculation_date = p_calculation_date
    LEFT JOIN health_scores c ON u.id = c.user_id AND c.score_type = 'consistency' AND c.calculation_date = p_calculation_date
    WHERE u.id = p_user_id
    GROUP BY u.id;
END//
DELIMITER ;