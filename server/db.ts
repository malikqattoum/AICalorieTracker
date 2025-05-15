import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a MySQL connection pool
export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  // You can add more options here if needed (e.g., connectionLimit)
});

// Create a drizzle ORM instance
export const db = drizzle(pool, { schema, mode: 'default' });
