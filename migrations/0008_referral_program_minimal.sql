-- Minimal referral program migration
-- Only adds missing tables and columns, no complex logic

-- Create referral settings table
CREATE TABLE IF NOT EXISTS referral_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create referral commissions table
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

-- Add referral columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER;

-- Add calories_burned column to weekly_stats table
ALTER TABLE weekly_stats ADD COLUMN IF NOT EXISTS calories_burned INT DEFAULT 0;

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referee_id ON referral_commissions(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_weekly_stats_calories_burned ON weekly_stats(calories_burned);

-- Insert default referral settings
INSERT IGNORE INTO referral_settings (commission_percent, is_recurring) VALUES (10.00, FALSE);

SELECT 'Minimal referral program migration completed successfully!' as message;