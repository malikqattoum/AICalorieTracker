import 'dotenv/config';
import { db } from './db';
import { sql } from 'drizzle-orm';

async function migrateDatabase() {
  console.log('Starting database migration...');

  try {
    // Check if all required tables exist and create missing ones
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'calorie_tracker'
      AND table_type = 'BASE TABLE'
    `);
    
    const tableNames = (tables as any).map((row: any) => row.table_name || row.TABLE_NAME);
    console.log('Existing tables:', tableNames);

    // Create missing tables that are referenced in the application
    const requiredTables = [
      'users', 'meal_analyses', 'weekly_stats', 'site_content',
      'nutrition_goals', 'ai_config', 'planned_meals', 'favorite_meals',
      'imported_recipes', 'languages', 'translations', 'workouts',
      'wearable_data', 'app_config', 'coach_answers'
    ];

    for (const tableName of requiredTables) {
      if (!tableNames.includes(tableName)) {
        console.log(`Creating ${tableName} table...`);
        await createTable(tableName);
      }
    }

    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Error during database migration:', error);
  }
}

async function createTable(tableName: string) {
  switch (tableName) {
    case 'planned_meals':
      await db.execute(sql`
        CREATE TABLE planned_meals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          date DATETIME NOT NULL,
          meal_type VARCHAR(50) NOT NULL,
          meal_name VARCHAR(255) NOT NULL,
          calories INT NOT NULL DEFAULT 0,
          protein INT NOT NULL DEFAULT 0,
          carbs INT NOT NULL DEFAULT 0,
          fat INT NOT NULL DEFAULT 0,
          recipe TEXT,
          notes TEXT
        )
      `);
      break;

    case 'favorite_meals':
      await db.execute(sql`
        CREATE TABLE favorite_meals (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          meal_name VARCHAR(255) NOT NULL,
          meal_id INT,
          meal_type VARCHAR(50),
          ingredients JSON,
          nutrition JSON,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'imported_recipes':
      await db.execute(sql`
        CREATE TABLE imported_recipes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          recipe_name VARCHAR(255) NOT NULL,
          ingredients JSON,
          instructions TEXT,
          parsed_nutrition JSON,
          notes TEXT,
          source_url VARCHAR(500),
          source_image_url VARCHAR(500),
          raw_image_data TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'languages':
      await db.execute(sql`
        CREATE TABLE languages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          code VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          is_default BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'translations':
      await db.execute(sql`
        CREATE TABLE translations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          language_id INT NOT NULL,
          \`key\` VARCHAR(255) NOT NULL,
          value TEXT NOT NULL,
          is_auto_translated BOOLEAN DEFAULT FALSE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'workouts':
      await db.execute(sql`
        CREATE TABLE workouts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          duration INT NOT NULL,
          calories_burned INT NOT NULL,
          date DATETIME NOT NULL,
          notes TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'wearable_data':
      await db.execute(sql`
        CREATE TABLE wearable_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          device_type VARCHAR(50) NOT NULL,
          steps INT,
          heart_rate INT,
          calories_burned INT,
          sleep_hours INT,
          date DATETIME NOT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'app_config':
      await db.execute(sql`
        CREATE TABLE app_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          \`key\` VARCHAR(255) NOT NULL UNIQUE,
          value TEXT,
          description TEXT,
          type VARCHAR(50) NOT NULL DEFAULT 'string',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      break;

    case 'coach_answers':
      await db.execute(sql`
        CREATE TABLE coach_answers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          rating INT,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at)
        )
      `);
      break;

    default:
      console.log(`No creation script for table: ${tableName}`);
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDatabase().then(() => process.exit(0));
}

export { migrateDatabase };