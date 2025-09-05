-- Create premium analytics tables
CREATE TABLE IF NOT EXISTS health_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    score_type VARCHAR(50) NOT NULL,
    score_value DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100.00,
    calculation_date VARCHAR(10) NOT NULL,
    score_details JSON,
    trend_direction VARCHAR(20) DEFAULT 'stable',
    confidence_level DECIMAL(3,2),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_score_type (user_id, score_type),
    INDEX idx_calculation_date (calculation_date)
);

CREATE TABLE IF NOT EXISTS health_predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    target_date VARCHAR(10) NOT NULL,
    prediction_value DECIMAL(10,2) NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL,
    model_version VARCHAR(100),
    input_data JSON,
    prediction_details JSON,
    recommendations JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_prediction_type (user_id, prediction_type),
    INDEX idx_target_date (target_date),
    INDEX idx_is_active (is_active)
);

CREATE TABLE IF NOT EXISTS pattern_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    analysis_period VARCHAR(20) NOT NULL,
    start_date VARCHAR(10) NOT NULL,
    end_date VARCHAR(10) NOT NULL,
    correlation_score DECIMAL(3,2) NOT NULL,
    significance_level DECIMAL(3,2),
    pattern_strength VARCHAR(20) DEFAULT 'moderate',
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
    INDEX idx_date_range (start_date, end_date)
);

CREATE TABLE IF NOT EXISTS health_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    report_type VARCHAR(20) NOT NULL,
    report_period_start VARCHAR(10) NOT NULL,
    report_period_end VARCHAR(10) NOT NULL,
    report_status VARCHAR(20) DEFAULT 'draft',
    report_data JSON NOT NULL,
    summary_text TEXT,
    key_findings JSON,
    recommendations JSON,
    generated_at DATETIME DEFAULT NULL,
    delivered_at DATETIME DEFAULT NULL,
    archived_at DATETIME DEFAULT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_report_type (user_id, report_type),
    INDEX idx_report_period (report_period_start, report_period_end),
    INDEX idx_access_level (report_status)
);

CREATE TABLE IF NOT EXISTS real_time_monitoring (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_alert BOOLEAN DEFAULT FALSE,
    alert_level VARCHAR(20) DEFAULT 'low',
    alert_message TEXT,
    action_taken VARCHAR(100),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_metric_type (user_id, metric_type),
    INDEX idx_timestamp (timestamp),
    INDEX idx_is_alert (is_alert)
);

CREATE TABLE IF NOT EXISTS healthcare_integration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    professional_id VARCHAR(100) NOT NULL,
    professional_type VARCHAR(50) NOT NULL,
    professional_name VARCHAR(100) NOT NULL,
    practice_name VARCHAR(100),
    access_level VARCHAR(20) DEFAULT 'read_only',
    data_sharing_consent BOOLEAN DEFAULT FALSE,
    consent_date VARCHAR(10),
    data_expiration_date VARCHAR(10),
    shared_data JSON,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_professional_type (user_id, professional_type),
    INDEX idx_status (is_active),
    INDEX idx_data_expiration (data_expiration_date)
);

CREATE TABLE IF NOT EXISTS health_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    goal_type VARCHAR(50) NOT NULL,
    goal_title VARCHAR(100) NOT NULL,
    goal_description TEXT,
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    start_date VARCHAR(10) NOT NULL,
    target_date VARCHAR(10) NOT NULL,
    deadline_date VARCHAR(10),
    status VARCHAR(20) DEFAULT 'active',
    priority VARCHAR(20) DEFAULT 'medium',
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    achievement_probability DECIMAL(5,2) DEFAULT 0,
    milestones JSON,
    achievements JSON,
    obstacles JSON,
    strategies JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goal_type (user_id, goal_type),
    INDEX idx_status_priority (status, priority),
    INDEX idx_target_date (target_date),
    INDEX idx_deadline_date (deadline_date)
);

CREATE TABLE IF NOT EXISTS health_insights (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    insight_type VARCHAR(50) NOT NULL,
    insight_category VARCHAR(20) DEFAULT 'neutral',
    insight_title VARCHAR(100) NOT NULL,
    insight_description TEXT NOT NULL,
    insight_data JSON,
    confidence_score DECIMAL(3,2) NOT NULL,
    action_items JSON,
    related_metrics JSON,
    is_actioned BOOLEAN DEFAULT FALSE,
    actioned_at DATETIME DEFAULT NULL,
    action_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_insight_type (user_id, insight_type),
    INDEX idx_priority (insight_category),
    INDEX idx_is_read (is_actioned),
    INDEX idx_is_bookmarked (is_actioned),
    INDEX idx_created_at (created_at)
);

-- Create indexes for better performance
CREATE INDEX idx_health_scores_user_date ON health_scores(user_id, calculation_date);
CREATE INDEX idx_health_predictions_user_target ON health_predictions(user_id, target_date);
CREATE INDEX idx_pattern_analysis_user_dates ON pattern_analysis(user_id, start_date, end_date);
CREATE INDEX idx_real_time_monitoring_user_metric ON real_time_monitoring(user_id, metric_type, timestamp);
CREATE INDEX idx_health_goals_user_status ON health_goals(user_id, status);
CREATE INDEX idx_health_insights_user_created ON health_insights(user_id, created_at);

-- Create triggers for automatic data cleanup
DELIMITER //
CREATE TRIGGER cleanup_old_predictions 
BEFORE DELETE ON health_predictions
FOR EACH ROW
BEGIN
    -- Delete related insights
    DELETE FROM health_insights WHERE user_id = OLD.user_id AND insight_type = 'warning';
END//
DELIMITER ;

DELIMITER //
CREATE TRIGGER cleanup_old_monitoring_data 
BEFORE DELETE ON real_time_monitoring
FOR EACH ROW
BEGIN
    -- Delete related alerts
    DELETE FROM health_insights WHERE user_id = OLD.user_id AND insight_type = 'warning' AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END//
DELIMITER ;

-- Create view for comprehensive user analytics
CREATE OR REPLACE VIEW user_comprehensive_analytics AS
SELECT 
    u.id as user_id,
    u.email,
    u.created_at as user_created_at,
    COUNT(DISTINCT hs.id) as total_health_scores,
    AVG(CASE WHEN hs.score_type = 'overall' THEN hs.score_value END) as avg_overall_score,
    COUNT(DISTINCT hp.id) as total_predictions,
    COUNT(DISTINCT hr.id) as total_reports,
    COUNT(DISTINCT hg.id) as total_goals,
    COUNT(DISTINCT hi.id) as total_insights,
    COUNT(DISTINCT him.id) as total_monitoring_records,
    COUNT(DISTINCT hci.id) as total_healthcare_connections,
    MAX(hs.calculation_date) as latest_score_date,
    MAX(hp.target_date) as latest_prediction_date,
    MAX(hr.report_period_end) as latest_report_date
FROM users u
LEFT JOIN health_scores hs ON u.id = hs.user_id
LEFT JOIN health_predictions hp ON u.id = hp.user_id
LEFT JOIN health_reports hr ON u.id = hr.user_id
LEFT JOIN health_goals hg ON u.id = hg.user_id
LEFT JOIN health_insights hi ON u.id = hi.user_id
LEFT JOIN real_time_monitoring him ON u.id = him.user_id
LEFT JOIN healthcare_integration hci ON u.id = hci.user_id
GROUP BY u.id, u.email, u.created_at;

-- Create stored procedure for calculating daily health scores
DELIMITER //
CREATE PROCEDURE CalculateDailyHealthScores(IN p_user_id INT, IN p_calculation_date DATE)
BEGIN
    DECLARE nutrition_score DECIMAL(5,2);
    DECLARE fitness_score DECIMAL(5,2);
    DECLARE recovery_score DECIMAL(5,2);
    DECLARE consistency_score DECIMAL(5,2);
    DECLARE overall_score DECIMAL(5,2);
    
    -- Calculate nutrition score
    SELECT AVG(CASE 
        WHEN ABS(calories - 2000) <= 200 THEN 100
        ELSE 0 
    END) INTO nutrition_score
    FROM meals 
    WHERE user_id = p_user_id 
    AND DATE(created_at) = p_calculation_date;
    
    -- Calculate fitness score
    SELECT AVG(CASE 
        WHEN duration >= 30 THEN 100
        ELSE (duration / 30) * 100 
    END) INTO fitness_score
    FROM workouts 
    WHERE user_id = p_user_id 
    AND DATE(created_at) = p_calculation_date;
    
    -- Calculate recovery score
    SELECT AVG(CASE 
        WHEN duration >= 7 THEN 100
        ELSE (duration / 7) * 100 
    END) INTO recovery_score
    FROM sleep_data 
    WHERE user_id = p_user_id 
    AND DATE(created_at) = p_calculation_date;
    
    -- Calculate consistency score
    SELECT AVG(CASE 
        WHEN ABS(calories - 2000) <= 200 AND duration >= 30 AND sleep_duration >= 7 THEN 100
        ELSE 0 
    END) INTO consistency_score
    FROM (
        SELECT m.calories, w.duration, s.duration as sleep_duration
        FROM meals m
        LEFT JOIN workouts w ON m.user_id = w.user_id AND DATE(m.created_at) = DATE(w.created_at)
        LEFT JOIN sleep_data s ON m.user_id = s.user_id AND DATE(m.created_at) = DATE(s.created_at)
        WHERE m.user_id = p_user_id AND DATE(m.created_at) = p_calculation_date
    ) combined_data;
    
    -- Calculate overall score
    SET overall_score = (nutrition_score * 0.3) + (fitness_score * 0.25) + (recovery_score * 0.25) + (consistency_score * 0.2);
    
    -- Insert or update health scores
    INSERT INTO health_scores (user_id, score_type, score_value, calculation_date, score_details, trend_direction, confidence_level)
    VALUES 
        (p_user_id, 'nutrition', nutrition_score, p_calculation_date, JSON_OBJECT('method', 'daily_calculation'), 'stable', 0.85),
        (p_user_id, 'fitness', fitness_score, p_calculation_date, JSON_OBJECT('method', 'daily_calculation'), 'stable', 0.85),
        (p_user_id, 'recovery', recovery_score, p_calculation_date, JSON_OBJECT('method', 'daily_calculation'), 'stable', 0.85),
        (p_user_id, 'consistency', consistency_score, p_calculation_date, JSON_OBJECT('method', 'daily_calculation'), 'stable', 0.85),
        (p_user_id, 'overall', overall_score, p_calculation_date, JSON_OBJECT('method', 'weighted_average'), 'stable', 0.85)
    ON DUPLICATE KEY UPDATE
        score_value = VALUES(score_value),
        updated_at = CURRENT_TIMESTAMP;
    
    -- Generate insights based on scores
    IF overall_score < 60 THEN
        INSERT INTO health_insights (user_id, insight_type, category, priority, title, description, insight_data, action_items)
        VALUES (p_user_id, 'warning', 'performance', 'high', 
            'Low Overall Health Score', 
            'Your overall health score is below 60. Consider reviewing your nutrition, fitness, and sleep habits.',
            JSON_OBJECT('overall_score', overall_score, 'threshold', 60),
            JSON_ARRAY('Review daily habits', 'Set small achievable goals', 'Consider consulting a professional'));
    END IF;
    
    IF nutrition_score < 70 THEN
        INSERT INTO health_insights (user_id, insight_type, category, priority, title, description, insight_data, action_items)
        VALUES (p_user_id, 'recommendation', 'nutrition', 'medium',
            'Nutrition Score Improvement',
            'Your nutrition score could be improved. Focus on balanced meals and proper calorie intake.',
            JSON_OBJECT('nutrition_score', nutrition_score, 'threshold', 70),
            JSON_ARRAY('Track meals consistently', 'Ensure balanced macronutrients', 'Stay hydrated'));
    END IF;
END//
DELIMITER ;

-- Create stored procedure for generating weekly reports
DELIMITER //
CREATE PROCEDURE GenerateWeeklyReport(IN p_user_id INT, IN p_start_date DATE, IN p_end_date DATE)
BEGIN
    DECLARE total_meals INT;
    DECLARE avg_calories DECIMAL(10,2);
    DECLARE avg_protein DECIMAL(10,2);
    DECLARE avg_carbs DECIMAL(10,2);
    DECLARE avg_fat DECIMAL(10,2);
    DECLARE avg_sleep_duration DECIMAL(5,2);
    DECLARE avg_sleep_quality DECIMAL(5,2);
    DECLARE total_workouts INT;
    DECLARE avg_workout_duration DECIMAL(5,2);
    DECLARE avg_steps DECIMAL(10,2);
    DECLARE weight_trend VARCHAR(20);
    
    -- Calculate nutrition metrics
    SELECT COUNT(*) INTO total_meals
    FROM meals
    WHERE user_id = p_user_id AND created_at BETWEEN p_start_date AND p_end_date;
    
    SELECT AVG(calories), AVG(protein), AVG(carbs), AVG(fat)
    INTO avg_calories, avg_protein, avg_carbs, avg_fat
    FROM meals
    WHERE user_id = p_user_id AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate sleep metrics
    SELECT AVG(duration), AVG(quality_score)
    INTO avg_sleep_duration, avg_sleep_quality
    FROM sleep_data
    WHERE user_id = p_user_id AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate fitness metrics
    SELECT COUNT(*) INTO total_workouts
    FROM workouts
    WHERE user_id = p_user_id AND created_at BETWEEN p_start_date AND p_end_date;
    
    SELECT AVG(duration)
    INTO avg_workout_duration
    FROM workouts
    WHERE user_id = p_user_id AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate activity metrics
    SELECT AVG(steps)
    INTO avg_steps
    FROM device_steps_data
    WHERE user_id = p_user_id AND timestamp BETWEEN p_start_date AND p_end_date;
    
    -- Determine weight trend
    SELECT CASE 
        WHEN COUNT(*) > 1 AND LAST(weight) > FIRST(weight) THEN 'increasing'
        WHEN COUNT(*) > 1 AND LAST(weight) < FIRST(weight) THEN 'decreasing'
        ELSE 'stable'
    END INTO weight_trend
    FROM device_weight_data
    WHERE user_id = p_user_id AND timestamp BETWEEN p_start_date AND p_end_date
    ORDER BY timestamp;
    
    -- Insert weekly report
    INSERT INTO health_reports (
        user_id, report_type, report_period_start, report_period_end,
        report_data, report_summary, key_findings, recommendations, generated_by
    ) VALUES (
        p_user_id, 'weekly_summary', p_start_date, p_end_date,
        JSON_OBJECT(
            'nutrition', JSON_OBJECT(
                'total_meals', total_meals,
                'avg_calories', avg_calories,
                'avg_protein', avg_protein,
                'avg_carbs', avg_carbs,
                'avg_fat', avg_fat
            ),
            'sleep', JSON_OBJECT(
                'avg_duration', avg_sleep_duration,
                'avg_quality', avg_sleep_quality
            ),
            'fitness', JSON_OBJECT(
                'total_workouts', total_workouts,
                'avg_duration', avg_workout_duration
            ),
            'activity', JSON_OBJECT(
                'avg_steps', avg_steps
            ),
            'weight_trend', weight_trend
        ),
        CONCAT('Weekly health report for period ', p_start_date, ' to ', p_end_date),
        JSON_OBJECT('weight_trend', weight_trend, 'nutrition_score', 
            CASE WHEN avg_calories BETWEEN 1800 AND 2200 THEN 'good' ELSE 'needs_improvement' END),
        JSON_ARRAY(
            'Continue tracking meals consistently',
            'Maintain regular sleep schedule',
            'Stay active with daily exercise'
        ),
        'system'
    );
    
    -- Generate insights based on weekly data
    IF avg_calories < 1500 OR avg_calories > 2500 THEN
        INSERT INTO health_insights (user_id, insight_type, category, priority, title, description, insight_data, action_items)
        VALUES (p_user_id, 'warning', 'nutrition', 'medium',
            'Calorie Intake Needs Attention',
            CONCAT('Your average calorie intake is ', ROUND(avg_calories), ' which is outside the recommended range.'),
            JSON_OBJECT('avg_calories', avg_calories, 'recommended_range', '1500-2500'),
            JSON_ARRAY('Adjust portion sizes', 'Consult nutritionist if needed', 'Use food tracking app'));
    END IF;
    
    IF avg_sleep_duration < 6 THEN
        INSERT INTO health_insights (user_id, insight_type, category, priority, title, description, insight_data, action_items)
        VALUES (p_user_id, 'warning', 'recovery', 'high',
            'Insufficient Sleep Duration',
            CONCAT('Your average sleep duration is ', ROUND(avg_sleep_duration, 1), ' hours, which is below recommended 7-9 hours.'),
            JSON_OBJECT('avg_sleep_duration', avg_sleep_duration, 'recommended_range', '7-9'),
            JSON_ARRAY('Establish consistent bedtime', 'Create relaxing bedtime routine', 'Limit screen time before bed'));
    END IF;
END//
DELIMITER ;

-- Create event for daily health score calculation
DELIMITER //
CREATE EVENT event_daily_health_scores
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_DATE + INTERVAL 1 DAY
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id INT;
    
    -- Cursor for all active users
    DECLARE user_cursor CURSOR FOR SELECT id FROM users WHERE is_active = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO user_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Calculate health scores for yesterday
        CALL CalculateDailyHealthScores(user_id, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));
    END LOOP;
    
    CLOSE user_cursor;
END//
DELIMITER ;

-- Create event for weekly report generation
DELIMITER //
CREATE EVENT event_weekly_reports
ON SCHEDULE EVERY 1 WEEK
STARTS DATE_ADD(DATE(CURRENT_DATE), INTERVAL 1 WEEK - DAYOFWEEK(CURRENT_DATE) + 1 DAY)
DO
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id INT;
    
    -- Cursor for all active users
    DECLARE user_cursor CURSOR FOR SELECT id FROM users WHERE is_active = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO user_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Generate weekly report for the past week
        CALL GenerateWeeklyReport(user_id, DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY));
    END LOOP;
    
    CLOSE user_cursor;
END//
DELIMITER ;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON health_scores TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON health_predictions TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON pattern_analysis TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON health_reports TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON real_time_monitoring TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON healthcare_integration TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON health_goals TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON health_insights TO 'app_user'@'%';
GRANT SELECT ON user_comprehensive_analytics TO 'app_user'@'%';
GRANT EXECUTE ON PROCEDURE CalculateDailyHealthScores TO 'app_user'@'%';
GRANT EXECUTE ON PROCEDURE GenerateWeeklyReport TO 'app_user'@'%';