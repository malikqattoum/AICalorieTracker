CREATE TABLE `imported_recipes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`source_url` varchar(2048),
	`source_image_url` varchar(2048),
	`raw_image_data` text,
	`recipe_name` varchar(255) NOT NULL,
	`ingredients` json,
	`instructions` text,
	`parsed_nutrition` json,
	`notes` text,
	`created_at` datetime DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `imported_recipes_id` PRIMARY KEY(`id`)
);
