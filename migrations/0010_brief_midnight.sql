-- Custom SQL migration file, put your code below! --

-- Change JSON columns to LONGTEXT for MariaDB compatibility

-- Users table
ALTER TABLE users MODIFY COLUMN nutrition_goals LONGTEXT;
ALTER TABLE users MODIFY COLUMN dietary_preferences LONGTEXT;
ALTER TABLE users MODIFY COLUMN allergies LONGTEXT;

-- User preferences table
ALTER TABLE user_preferences MODIFY COLUMN dietary_restrictions LONGTEXT;
ALTER TABLE user_preferences MODIFY COLUMN allergies LONGTEXT;

-- Weekly stats table
ALTER TABLE weekly_stats MODIFY COLUMN calories_by_day LONGTEXT;
ALTER TABLE weekly_stats MODIFY COLUMN macros_by_day LONGTEXT;