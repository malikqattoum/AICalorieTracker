import { db } from './db';
import { users, mealAnalyses, weeklyStats } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Creating database tables...');

  try {
    // Check if tables exist
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    `);
    
    const tableNames = (tables as any).map((row: any) => row.table_name || row.TABLE_NAME);
    console.log('Existing tables:', tableNames);

    // Create users table if it doesn't exist
    if (!tableNames.includes('users')) {
      console.log('Creating users table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(255) NOT NULL,
          last_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          stripe_customer_id VARCHAR(255),
          stripe_subscription_id VARCHAR(255),
          subscription_type VARCHAR(255),
          subscription_status VARCHAR(255),
          subscription_end_date TIMESTAMP,
          is_premium BOOLEAN DEFAULT false
        )
      `);
      console.log('Users table created!');
    } else {
      console.log('Users table already exists.');
    }

    // Create meal_analyses table if it doesn't exist
    if (!tableNames.includes('meal_analyses')) {
      console.log('Creating meal_analyses table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS meal_analyses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          food_name VARCHAR(255) NOT NULL,
          calories INTEGER NOT NULL,
          protein INTEGER NOT NULL,
          carbs INTEGER NOT NULL,
          fat INTEGER NOT NULL,
          fiber INTEGER NOT NULL,
          image_data TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        )
      `);
      console.log('Meal analyses table created!');
    } else {
      console.log('Meal analyses table already exists.');
    }

    // Create weekly_stats table if it doesn't exist
    if (!tableNames.includes('weekly_stats')) {
      console.log('Creating weekly_stats table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS weekly_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          average_calories INTEGER NOT NULL,
          meals_tracked INTEGER NOT NULL,
          average_protein INTEGER NOT NULL,
          healthiest_day VARCHAR(255) NOT NULL,
          week_starting TIMESTAMP NOT NULL,
          calories_by_day JSON NOT NULL
        )
      `);
      console.log('Weekly stats table created!');
    } else {
      console.log('Weekly stats table already exists.');
    }

    console.log('Database initialization complete!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the connection pool
    await db.execute(sql`SELECT 1`).catch(console.error);
    process.exit(0);
  }
}

main();