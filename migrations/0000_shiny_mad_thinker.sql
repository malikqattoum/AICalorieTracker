CREATE TABLE `meal_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`food_name` varchar(255) NOT NULL,
	`calories` int NOT NULL,
	`protein` int NOT NULL,
	`carbs` int NOT NULL,
	`fat` int NOT NULL,
	`fiber` int NOT NULL,
	`image_data` text NOT NULL,
	`timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `meal_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_content` (
	`key` varchar(64) NOT NULL,
	`value` text NOT NULL,
	CONSTRAINT `site_content_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`first_name` varchar(255) NOT NULL,
	`last_name` varchar(255) NOT NULL,
	`email` varchar(255),
	`stripe_customer_id` varchar(255),
	`stripe_subscription_id` varchar(255),
	`subscription_type` varchar(255),
	`subscription_status` varchar(255),
	`subscription_end_date` datetime,
	`is_premium` boolean DEFAULT false,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `weekly_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`average_calories` int NOT NULL,
	`meals_tracked` int NOT NULL,
	`average_protein` int NOT NULL,
	`healthiest_day` varchar(255) NOT NULL,
	`week_starting` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`calories_by_day` json NOT NULL,
	`macros_by_day` json,
	CONSTRAINT `weekly_stats_id` PRIMARY KEY(`id`)
);
