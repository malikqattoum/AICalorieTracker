import db from '../../../src/db';

export interface User {
  id: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  token_version: number;
  mfa_secret?: string | null;
  mfa_enabled?: boolean;
  // Add other fields as needed from your schema
}

export class UserService {
  static async getUserById(userId: string): Promise<User | null> {
    const [users] = await db.execute(
      'SELECT id, email, role, token_version FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0] as User;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const [users] = await db.execute(
      'SELECT id, email, role, token_version FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return null;
    }
    
    return users[0] as User;
  }

  static async incrementTokenVersion(userId: string): Promise<void> {
    await db.execute(
      'UPDATE users SET token_version = token_version + 1 WHERE id = ?',
      [userId]
    );
  }
}