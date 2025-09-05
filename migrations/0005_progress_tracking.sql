-- Progress tracking migration
-- Adds progress tracking functionality for user goals and achievements

-- Create progress_entries table for tracking daily progress
CREATE TABLE IF NOT EXISTS progress_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  weight DECIMAL(5,2),
  calories_consumed INT DEFAULT 0,
  calories_burned INT DEFAULT 0,
  water_intake_ml INT DEFAULT 0,
  steps_count INT DEFAULT 0,
  sleep_hours DECIMAL(4,2),
  mood_rating TINYINT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, date)
);

-- Create goal_progress table for tracking goal achievements
CREATE TABLE IF NOT EXISTS goal_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  goal_type VARCHAR(50) NOT NULL,
  goal_id INTEGER,
  target_value DECIMAL(10,2) NOT NULL,
  current_value DECIMAL(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  status ENUM('active', 'completed', 'paused', 'cancelled') DEFAULT 'active',
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_progress_entries_user_date ON progress_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_progress_entries_date ON progress_entries(date);
CREATE INDEX IF NOT EXISTS idx_goal_progress_user_status ON goal_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goal_progress_target_date ON goal_progress(target_date);

-- Insert sample data for testing
INSERT IGNORE INTO progress_entries (user_id, date, calories_consumed, water_intake_ml, steps_count)
SELECT
  u.id,
  CURDATE(),
  1800,
  2000,
  8000
FROM users u
WHERE u.id = 1
LIMIT 1;

SELECT 'Progress tracking migration completed successfully!' as message;