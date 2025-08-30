import mysql, { RowDataPacket } from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from '@shared/schema';
import { wearableDevices, healthMetrics, syncLogs, correlationAnalysis } from '@migrations/001_create_wearable_tables';
import { healthScores, healthPredictions, patternAnalysis, healthReports, realTimeMonitoring, healthcareIntegration, healthGoals, healthInsights } from '@migrations/002_create_premium_analytics_tables';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'calorie_tracker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create Drizzle ORM instance with all schemas
export const db = drizzle(pool, {
  schema: {
    ...schema,
    wearableDevices,
    healthMetrics,
    syncLogs,
    correlationAnalysis,
    healthScores,
    healthPredictions,
    patternAnalysis,
    healthReports,
    realTimeMonitoring,
    healthcareIntegration,
    healthGoals,
    healthInsights,
  },
  mode: 'default'
});

// Legacy execute method for backward compatibility
export default {
  async execute(sql: string, params?: any[]): Promise<RowDataPacket[]> {
    const connection = await pool.getConnection();
    try {
      const [rows, fields] = await connection.execute(sql, params);
      return rows as RowDataPacket[];
    } finally {
      connection.release();
    }
  },
  // Export the drizzle instance for new code
  db
};