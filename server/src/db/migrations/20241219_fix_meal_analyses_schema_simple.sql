-- Migration to fix meal_analyses table schema mismatch
-- This migration adds missing columns to match the Drizzle ORM schema

-- Add meal_id column if it doesn't exist
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS meal_id INT NOT NULL DEFAULT 0;

-- Add missing columns from the complete schema
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,4) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS analysis_details JSON DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS ai_insights TEXT DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS suggested_portion_size VARCHAR(100) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS estimated_calories INT DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS estimated_protein DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS estimated_carbs DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS estimated_fat DECIMAL(5,2) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS image_hash VARCHAR(64) DEFAULT NULL;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE meal_analyses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Add foreign key constraints (these will be skipped if they already exist)
ALTER TABLE meal_analyses ADD CONSTRAINT fk_meal_analyses_meal_id FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE;
ALTER TABLE meal_analyses ADD CONSTRAINT fk_meal_analyses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_analyses_user_id ON meal_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_meal_id ON meal_analyses(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_analysis_timestamp ON meal_analyses(analysis_timestamp);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_image_hash ON meal_analyses(image_hash);
CREATE INDEX IF NOT EXISTS idx_meal_analyses_confidence_score ON meal_analyses(confidence_score);

-- Update existing records to have proper timestamps if they are NULL
UPDATE meal_analyses SET
    analysis_timestamp = COALESCE(analysis_timestamp, timestamp),
    created_at = COALESCE(created_at, timestamp),
    updated_at = COALESCE(updated_at, timestamp)
WHERE analysis_timestamp IS NULL OR created_at IS NULL OR updated_at IS NULL;

-- Display completion message
SELECT 'Meal analyses table schema migration completed successfully!' as message;