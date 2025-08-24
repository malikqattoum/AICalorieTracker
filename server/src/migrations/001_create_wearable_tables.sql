-- Create wearable_devices table
CREATE TABLE IF NOT EXISTS wearable_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_type ENUM('apple_health', 'google_fit', 'fitbit', 'garmin', 'apple_watch') NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_id VARCHAR(255) UNIQUE,
    is_connected BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMP NULL,
    sync_frequency_minutes INT DEFAULT 60,
    is_two_way_sync BOOLEAN DEFAULT TRUE,
    auth_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_device_type (user_id, device_type),
    INDEX idx_device_id (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create health_metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NULL,
    metric_type ENUM(
        'steps', 'distance', 'calories_burned', 'heart_rate', 
        'sleep_duration', 'sleep_quality', 'activity_minutes',
        'resting_heart_rate', 'blood_pressure', 'weight',
        'body_fat', 'water_intake', 'workout_duration'
    ) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    source_timestamp TIMESTAMP NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(3,2),
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES wearable_devices(id) ON DELETE SET NULL,
    INDEX idx_user_metric_type (user_id, metric_type),
    INDEX idx_source_timestamp (source_timestamp),
    INDEX idx_recorded_at (recorded_at),
    INDEX idx_device_metric (device_id, metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NULL,
    sync_type ENUM('pull', 'push', 'two_way') NOT NULL,
    status ENUM('success', 'failed', 'partial', 'conflict') NOT NULL,
    records_processed INT DEFAULT 0,
    records_added INT DEFAULT 0,
    records_updated INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    duration_seconds INT,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES wearable_devices(id) ON DELETE SET NULL,
    INDEX idx_user_sync_type (user_id, sync_type),
    INDEX idx_device_sync (device_id, sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create correlation_analysis table
CREATE TABLE IF NOT EXISTS correlation_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    correlation_type ENUM('sleep_nutrition', 'heart_rate_nutrition', 'activity_nutrition') NOT NULL,
    analysis_date DATE NOT NULL,
    correlation_score DECIMAL(3,2) NOT NULL,
    confidence_level DECIMAL(3,2) NOT NULL,
    insights JSON,
    recommendations JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_correlation_type (user_id, correlation_type),
    INDEX idx_analysis_date (analysis_date),
    UNIQUE KEY unique_user_date_type (user_id, analysis_date, correlation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_wearable_devices_user_connected ON wearable_devices(user_id, is_connected);
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, DATE(recorded_at));
CREATE INDEX idx_sync_logs_user_date ON sync_logs(user_id, DATE(started_at));
CREATE INDEX idx_correlation_analysis_user_date ON correlation_analysis(user_id, analysis_date);

-- Create triggers for automatic timestamp updates
DELIMITER //
CREATE TRIGGER before_wearable_devices_update 
BEFORE UPDATE ON wearable_devices 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END//
DELIMITER ;

-- Create stored procedure for cleanup old sync logs
DELIMITER //
CREATE PROCEDURE cleanup_old_sync_logs(IN days_to_keep INT)
BEGIN
    DELETE FROM sync_logs 
    WHERE started_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    SELECT ROW_COUNT() as deleted_rows;
END//
DELIMITER ;