-- Create referral settings table
CREATE TABLE referral_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create initial settings record
INSERT INTO referral_settings (commission_percent, is_recurring) VALUES (10.00, false);

-- Create referral commissions table
CREATE TABLE referral_commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INTEGER NOT NULL,
  referee_id INTEGER NOT NULL,
  subscription_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  is_recurring BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referee_id) REFERENCES users(id)
);

-- Add referral_code to users table
ALTER TABLE users ADD COLUMN referral_code VARCHAR(255);
ALTER TABLE users ADD COLUMN referred_by INTEGER;
ALTER TABLE users ADD CONSTRAINT fk_referred_by FOREIGN KEY (referred_by) REFERENCES users(id);

-- Create index for referral code lookups
CREATE UNIQUE INDEX idx_users_referral_code ON users(referral_code);