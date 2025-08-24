-- Add indexes for better query performance

-- Indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- Indexes for meal_analyses table
CREATE INDEX idx_meal_analyses_user_id ON meal_analyses(user_id);
CREATE INDEX idx_meal_analyses_timestamp ON meal_analyses(timestamp);

-- Indexes for weekly_stats table
CREATE INDEX idx_weekly_stats_user_id ON weekly_stats(user_id);
CREATE INDEX idx_weekly_stats_week_starting ON weekly_stats(week_starting);

-- Indexes for nutrition_goals table
CREATE INDEX idx_nutrition_goals_user_id ON nutrition_goals(user_id);

-- Indexes for planned_meals table
CREATE INDEX idx_planned_meals_user_id ON planned_meals(user_id);
CREATE INDEX idx_planned_meals_date ON planned_meals(date);

-- Indexes for favorite_meals table
CREATE INDEX idx_favorite_meals_user_id ON favorite_meals(user_id);

-- Indexes for imported_recipes table
CREATE INDEX idx_imported_recipes_user_id ON imported_recipes(user_id);

-- Indexes for referral_commissions table
CREATE INDEX idx_referral_commissions_referrer_id ON referral_commissions(referrer_id);
CREATE INDEX idx_referral_commissions_referee_id ON referral_commissions(referee_id);
CREATE INDEX idx_referral_commissions_status ON referral_commissions(status);

-- Indexes for workouts table
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(date);

-- Indexes for wearable_data table
CREATE INDEX idx_wearable_data_user_id ON wearable_data(user_id);
CREATE INDEX idx_wearable_data_date ON wearable_data(date);

-- Indexes for ai_config table
CREATE INDEX idx_ai_config_is_active ON ai_config(is_active);
CREATE INDEX idx_ai_config_provider ON ai_config(provider);