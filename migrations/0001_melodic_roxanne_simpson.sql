ALTER TABLE `users` ADD `nutrition_goals` longtext;
--> statement-breakpoint
ALTER TABLE `weekly_stats` ADD COLUMN `macros_by_day` longtext;