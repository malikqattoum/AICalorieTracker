ALTER TABLE `users` ADD `nutrition_goals` json;
ALTER TABLE `weekly_stats` ADD COLUMN `macros_by_day` json;