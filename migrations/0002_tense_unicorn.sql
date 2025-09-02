CREATE TABLE IF NOT EXISTS `nutrition_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`daily_calories` int NOT NULL,
	`daily_protein` int NOT NULL,
	`daily_carbs` int NOT NULL,
	`daily_fat` int NOT NULL,
	`weekly_workouts` int DEFAULT 0,
	`water_intake` int DEFAULT 2000,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `nutrition_goals_id` PRIMARY KEY(`id`),
	CONSTRAINT `nutrition_goals_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `planned_meals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`date` datetime NOT NULL,
	`meal_type` varchar(50) NOT NULL,
	`meal_name` varchar(255) NOT NULL,
	`calories` int NOT NULL,
	`protein` int NOT NULL,
	`carbs` int NOT NULL,
	`fat` int NOT NULL,
	`recipe` text,
	`notes` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `planned_meals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `workouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`duration` int NOT NULL,
	`calories_burned` int NOT NULL,
	`date` datetime NOT NULL,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `workouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `meal_analyses` MODIFY COLUMN `timestamp` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_stats` MODIFY COLUMN `week_starting` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `weekly_stats` ADD `calories_burned` int DEFAULT 0;