import db from '../db';

export class UserService {
  static async getUserById(userId: string | number): Promise<any> {
    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);
    return users[0] || null;
  }

  static async markMFAEnabled(userId: string): Promise<void> {
    await db.execute(
      'UPDATE users SET mfa_enabled = 1, mfa_enabled_at = NOW() WHERE id = ?',
      [userId]
    );
  }
}