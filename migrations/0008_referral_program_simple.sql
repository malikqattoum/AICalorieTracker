-- Simple referral program migration - only adds missing elements
-- This migration focuses on adding missing tables and columns without recreating existing constraints

-- Create referral settings table (if not exists)
CREATE TABLE IF NOT EXISTS referral_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create referral commissions table (if not exists)
CREATE TABLE IF NOT EXISTS referral_commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referee_id INTEGER NOT NULL,
  subscription_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL
);

-- Add foreign keys for referral_commissions (only if they don't exist)
SET @fk_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'referral_commissions'
    AND CONSTRAINT_NAME = 'fk_referral_commissions_referrer'
);

SET @sql_fk1 = IF(@fk_exists = 0,
    'ALTER TABLE referral_commissions ADD CONSTRAINT fk_referral_commissions_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT "Referrer foreign key already exists" as message'
);

PREPARE stmt_fk1 FROM @sql_fk1;
EXECUTE stmt_fk1;
DEALLOCATE PREPARE stmt_fk1;

SET @fk2_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'referral_commissions'
    AND CONSTRAINT_NAME = 'fk_referral_commissions_referee'
);

SET @sql_fk2 = IF(@fk2_exists = 0,
    'ALTER TABLE referral_commissions ADD CONSTRAINT fk_referral_commissions_referee FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT "Referee foreign key already exists" as message'
);

PREPARE stmt_fk2 FROM @sql_fk2;
EXECUTE stmt_fk2;
DEALLOCATE PREPARE stmt_fk2;

-- Add referral columns to users table (if they don't exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER;

-- Add calories_burned column to weekly_stats table (if it doesn't exist)
ALTER TABLE weekly_stats ADD COLUMN IF NOT EXISTS calories_burned INT DEFAULT 0;

-- Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referee_id ON referral_commissions(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_created_at ON referral_commissions(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_calories_burned ON weekly_stats(calories_burned);

-- Insert default referral settings (if not exists)
INSERT IGNORE INTO referral_settings (commission_percent, is_recurring) VALUES (10.00, FALSE);

SELECT 'Simple referral program migration completed successfully!' as message;