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

  async authenticate(identifier: string, password: string): Promise<User | null> {
    try {
      // Check if identifier is an email (contains @) or username
      const isEmail = identifier.includes('@');
      const queryField = isEmail ? 'email' : 'username';

      console.log('[USER SERVICE] Authenticating user', {
        identifier,
        isEmail,
        queryField
      });

      const [users] = await db.execute(`SELECT * FROM users WHERE ${queryField} = ?`, [identifier]);
      if (!users.length) {
        console.log('[USER SERVICE] No user found with identifier:', identifier);
        return null;
      }

      const user = users[0];
      const isValid = await bcrypt.compare(password, user.password);

      console.log('[USER SERVICE] Authentication result', {
        userId: user.id,
        isValid,
        identifier
      });

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
      
      return {
        id: result.insertId,
        email,
        username,
        firstName: username.split(' ')[0] || 'User',
        lastName: username.split(' ')[1] || 'Account'
      };
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
    const [users] = await db.execute(`
      SELECT id, username, email, first_name as firstName, last_name as lastName, created_at as createdAt, updated_at as updatedAt
      FROM users
      WHERE id = ? AND is_active = true`,
      [id]
    );
    
    if (!users.length) return null;
    
    const user = users[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt)
    };
  }
};
