import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { join } from 'path';

describe('Database Migration Tests', () => {
  let connection: mysql.Connection;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // Create a separate test database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'calorie_tracker',
    });
    
    db = drizzle(connection, { schema, mode: 'default' });
  });

  afterAll(async () => {
    await connection.end();
  });

  it('should run all migrations successfully', async () => {
    // Run migrations
    await migrate(db, { migrationsFolder: join(__dirname, '../../../migrations') });
    
    // Verify that all tables exist
    const tables = await db.execute(`SHOW TABLES`);
    const tableNames = (tables as any).map((row: any) => Object.values(row)[0]);
    
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('meal_analyses');
    expect(tableNames).toContain('weekly_stats');
    expect(tableNames).toContain('site_content');
    expect(tableNames).toContain('app_config');
    expect(tableNames).toContain('planned_meals');
    expect(tableNames).toContain('nutrition_goals');
    expect(tableNames).toContain('favorite_meals');
    expect(tableNames).toContain('imported_recipes');
    expect(tableNames).toContain('referral_settings');
    expect(tableNames).toContain('referral_commissions');
    expect(tableNames).toContain('languages');
    expect(tableNames).toContain('translations');
    expect(tableNames).toContain('workouts');
    expect(tableNames).toContain('wearable_data');
    expect(tableNames).toContain('ai_config');
    expect(tableNames).toContain('reference_objects');
    expect(tableNames).toContain('wearable_data');
  });

  it('should have proper indexes on key tables', async () => {
    // Check indexes on users table
    const userIndexes = await db.execute(`SHOW INDEX FROM users`);
    const userIndexNames = (userIndexes as any).map((row: any) => row.Key_name);
    
    expect(userIndexNames).toContain('username');
    expect(userIndexNames).toContain('email');
    expect(userIndexNames).toContain('referred_by');
    expect(userIndexNames).toContain('referral_code');
    
    // Check indexes on meal_analyses table
    const mealAnalysisIndexes = await db.execute(`SHOW INDEX FROM meal_analyses`);
    const mealAnalysisIndexNames = (mealAnalysisIndexes as any).map((row: any) => row.Key_name);
    
    expect(mealAnalysisIndexNames).toContain('user_id');
    expect(mealAnalysisIndexNames).toContain('timestamp');
    
    // Check indexes on weekly_stats table
    const weeklyStatsIndexes = await db.execute(`SHOW INDEX FROM weekly_stats`);
    const weeklyStatsIndexNames = (weeklyStatsIndexes as any).map((row: any) => row.Key_name);
    
    expect(weeklyStatsIndexNames).toContain('user_id');
    expect(weeklyStatsIndexNames).toContain('week_starting');
  });

  it('should have proper foreign key constraints', async () => {
    // Check foreign key constraints on referral_commissions table
    const referralCommissionsConstraints = await db.execute(`
      SELECT
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_SCHEMA = DATABASE() AND
        TABLE_NAME = 'referral_commissions' AND
        REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    expect(referralCommissionsConstraints.length).toBeGreaterThan(0);
    
    const referrerConstraint = (referralCommissionsConstraints as any).find(
      (constraint: any) => constraint.COLUMN_NAME === 'referrer_id'
    );
    
    expect(referrerConstraint).toBeDefined();
    expect(referrerConstraint.REFERENCED_TABLE_NAME).toBe('users');
    expect(referrerConstraint.REFERENCED_COLUMN_NAME).toBe('id');
  });
});