-- Create device-specific data tables for detailed health metrics
CREATE TABLE IF NOT EXISTS device_heart_rate_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    heart_rate DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_heart_rate (heart_rate)
);

CREATE TABLE IF NOT EXISTS device_steps_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    steps INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_steps (steps)
);

CREATE TABLE IF NOT EXISTS device_weight_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_weight (weight)
);

CREATE TABLE IF NOT EXISTS device_body_composition_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    bone_mass DECIMAL(5,2),
    metabolic_rate DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_body_fat (body_fat_percentage)
);

CREATE TABLE IF NOT EXISTS device_blood_pressure_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    systolic DECIMAL(5,2) NOT NULL,
    diastolic DECIMAL(5,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_blood_pressure (systolic, diastolic)
);

CREATE TABLE IF NOT EXISTS device_sleep_quality_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    duration DECIMAL(5,2) NOT NULL,
    quality_score DECIMAL(5,2) NOT NULL,
    deep_sleep_ratio DECIMAL(5,2),
    light_sleep_ratio DECIMAL(5,2),
    rem_sleep_ratio DECIMAL(5,2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_quality_score (quality_score)
);

CREATE TABLE IF NOT EXISTS device_active_calories_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    calories DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_calories (calories)
);

-- Create monitoring alerts table
CREATE TABLE IF NOT EXISTS monitoring_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    metric_type ENUM('heart_rate', 'blood_pressure', 'blood_oxygen', 'sleep_quality', 'stress_level', 'activity_level') NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    alert_level ENUM('info', 'warning', 'critical') NOT NULL,
    alert_message TEXT NOT NULL,
    threshold JSON,
    is_active BOOLEAN DEFAULT TRUE,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_metric_type (user_id, metric_type),
    INDEX idx_alert_level (alert_level),
    INDEX idx_is_active (is_active),
    INDEX idx_acknowledged (acknowledged)
);

-- Create indexes for better performance
CREATE INDEX idx_device_heart_rate_user_time ON device_heart_rate_data(user_id, timestamp);
CREATE INDEX idx_device_steps_user_time ON device_steps_data(user_id, timestamp);
CREATE INDEX idx_device_weight_user_time ON device_weight_data(user_id, timestamp);
CREATE INDEX idx_device_body_composition_user_time ON device_body_composition_data(user_id, timestamp);
CREATE INDEX idx_device_blood_pressure_user_time ON device_blood_pressure_data(user_id, timestamp);
CREATE INDEX idx_device_sleep_quality_user_time ON device_sleep_quality_data(user_id, timestamp);
CREATE INDEX idx_device_active_calories_user_time ON device_active_calories_data(user_id, timestamp);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON device_heart_rate_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON device_steps_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON device_weight_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON device_body_composition_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON device_blood_pressure_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON device_sleep_quality_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON device_active_calories_data TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON monitoring_alerts TO 'app_user'@'%';