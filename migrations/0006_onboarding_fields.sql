-- Add onboarding fields to users table
ALTER TABLE users 
ADD COLUMN age INT,
ADD COLUMN gender VARCHAR(20),
ADD COLUMN height INT COMMENT 'Height in cm',
ADD COLUMN weight INT COMMENT 'Weight in kg',
ADD COLUMN activity_level VARCHAR(50),
ADD COLUMN primary_goal VARCHAR(100),
ADD COLUMN target_weight INT COMMENT 'Target weight in kg',
ADD COLUMN timeline VARCHAR(50),
ADD COLUMN dietary_preferences JSON,
ADD COLUMN allergies JSON,
ADD COLUMN ai_meal_suggestions BOOLEAN DEFAULT TRUE,
ADD COLUMN ai_chat_assistant_name VARCHAR(100),
ADD COLUMN notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN onboarding_completed_at DATETIME;

-- Add AI configuration table for admin panel control
CREATE TABLE IF NOT EXISTS ai_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provider VARCHAR(50) NOT NULL DEFAULT 'openai' COMMENT 'AI provider: openai, gemini',
  api_key_encrypted TEXT,
  model_name VARCHAR(100) DEFAULT 'gpt-4-vision-preview',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INT DEFAULT 1000,
  prompt_template TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default AI configurations
INSERT INTO ai_config (provider, model_name, prompt_template, is_active) VALUES 
('openai', 'gpt-4-vision-preview', 'Analyze this food image and provide detailed nutritional information including calories, protein, carbs, fat, and fiber. Also identify the food items present.', TRUE),
('gemini', 'gemini-1.5-pro-vision-latest', 'Analyze this food image and provide detailed nutritional information including calories, protein, carbs, fat, and fiber. Also identify the food items present.', FALSE);