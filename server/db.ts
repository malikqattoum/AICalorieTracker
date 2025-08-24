import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as sharedSchema from '@shared/schema';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } from './config';
export const schema = sharedSchema;

// Create a MySQL connection pool
export const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create a drizzle ORM instance
export const db = drizzle(pool, { schema, mode: 'default' });
