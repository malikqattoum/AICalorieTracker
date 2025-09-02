ALTER TABLE `users` MODIFY COLUMN `nutrition_goals` longtext;
--> statement-breakpoint
ALTER TABLE `weekly_stats` MODIFY COLUMN `macros_by_day` longtext;