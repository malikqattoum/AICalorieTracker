-- Create referral settings table
CREATE TABLE referral_settings (
  id SERIAL PRIMARY KEY,
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create initial settings record
INSERT INTO referral_settings (commission_percent, is_recurring) VALUES (10.00, false);

-- Create referral commissions table
CREATE TABLE referral_commissions (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER NOT NULL REFERENCES users(id),
  referee_id INTEGER NOT NULL REFERENCES users(id),
  subscription_id TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')) DEFAULT 'pending',
  is_recurring BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP
);

-- Add referral_code to users table
ALTER TABLE users ADD COLUMN referral_code TEXT;
ALTER TABLE users ADD COLUMN referred_by INTEGER REFERENCES users(id);

-- Create index for referral code lookups
CREATE UNIQUE INDEX idx_users_referral_code ON users(referral_code);