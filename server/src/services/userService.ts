import bcrypt from 'bcrypt';
import db from '../db';
import { User } from '../models/user';

export default {
  async authenticate(email: string, password: string): Promise<User | null> {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return null;
    
    const user = users[0];
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  },

  async createUser(email: string, password: string, username: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username]
    );
    return { id: result.insertId, email, username };
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
