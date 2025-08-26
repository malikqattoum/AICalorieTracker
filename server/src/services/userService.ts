import bcrypt from 'bcrypt';
import db from '../db';
import { User } from '../models/user';

export default {
  async testDatabaseConnection(): Promise<boolean> {
    try {
      console.log('[USER SERVICE] Testing database connection...');
      console.log('[USER SERVICE] DB config:', {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
      });
      
      const [result] = await db.execute('SELECT 1 as test');
      console.log('[USER SERVICE] Database connection test successful:', result);
      return true;
    } catch (error) {
      console.error('[USER SERVICE] Database connection test failed:', error);
      console.error('[USER SERVICE] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  },

  async authenticate(email: string, password: string): Promise<User | null> {
    try {
      const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (!users.length) return null;
      
      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);
      return isValid ? user : null;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  },

  async createUser(email: string, password: string, username: string): Promise<User> {
    try {
      // Check if user already exists
      const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
      if (existingUsers.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Check users table structure - handle missing required fields
      const [result] = await db.execute(
        'INSERT INTO users (email, password, username, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, username, username.split(' ')[0] || 'User', username.split(' ')[1] || 'Account']
      );
      
      return { id: result.insertId, email, username };
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  },

  async initiatePasswordReset(email: string): Promise<void> {
    // In real implementation: generate token, send email, store token with expiration
  },

  async completePasswordReset(token: string, newPassword: string): Promise<void> {
    // In real implementation: verify token, update password
  },

  async getUserById(id: number): Promise<User | null> {
    const [users] = await db.execute('SELECT id, email, username FROM users WHERE id = ?', [id]);
    return users.length ? users[0] : null;
  }
};
