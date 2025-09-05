-- Fixed referral program migration for MariaDB/MySQL compatibility
-- This migration creates the referral system tables without CHECK constraints

-- Create referral settings table
CREATE TABLE IF NOT EXISTS referral_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create initial settings record
INSERT INTO referral_settings (commission_percent, is_recurring) VALUES (10.00, FALSE)
ON DUPLICATE KEY UPDATE commission_percent = VALUES(commission_percent);

-- Create referral commissions table (MariaDB compatible)
CREATE TABLE IF NOT EXISTS referral_commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referee_id INTEGER NOT NULL,
  subscription_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status ENUM('pending', 'paid', 'cancelled') NOT NULL DEFAULT 'pending',
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Add referral_code to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER;
ALTER TABLE users ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for referral code lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- Create indexes for referral_commissions table
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referee_id ON referral_commissions(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_created_at ON referral_commissions(created_at);

-- Add calories_burned column to weekly_stats table if it doesn't exist
ALTER TABLE weekly_stats ADD COLUMN IF NOT EXISTS calories_burned INT DEFAULT 0;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_weekly_stats_calories_burned ON weekly_stats(calories_burned);

SELECT 'Referral program and weekly_stats fixes migration completed successfully!' as message;