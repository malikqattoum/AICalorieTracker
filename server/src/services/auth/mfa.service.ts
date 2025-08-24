import speakeasy from 'speakeasy';
import bcrypt from 'bcrypt';
import db from '../../../src/db';
import { UserService } from '../user.service';

export class MFAService {
  private static readonly TOTP_SECRET = process.env.TOTP_SECRET || 'your-secret-key';
  private static readonly QR_CODE_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=';

  static async generateTOTP(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `AI Calorie Tracker (${userId})`,
      issuer: 'AI Calorie Tracker'
    });

    const qrCode = `${this.QR_CODE_URL}${encodeURIComponent(secret.base32!)}`;
    await this.storeUserSecret(userId, secret.base32!);

    return { secret: secret.base32!, qrCode };
  }

  static async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.getUserSecret(userId);
    if (!secret) return false;

    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2,
      step: 30
    });
  }

  static async enableMFA(userId: string, token: string): Promise<boolean> {
    const isValid = await this.verifyTOTP(userId, token);
    if (isValid) {
      await this.markMFAEnabled(userId);
      return true;
    }
    return false;
  }

  private static async storeUserSecret(userId: string, secret: string): Promise<void> {
    await db.execute(
      'UPDATE users SET mfa_secret = ?, mfa_enabled = 1 WHERE id = ?',
      [this.encryptSecret(secret), userId]
    );
  }

  private static async getUserSecret(userId: string): Promise<string | null> {
    const [users] = await db.execute('SELECT mfa_secret FROM users WHERE id = ?', [userId]);
    return users[0]?.mfa_secret ? this.decryptSecret(users[0].mfa_secret) : null;
  }

  private static encryptSecret(secret: string): string {
    return Buffer.from(secret).toString('base64');
  }

  private static decryptSecret(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString();
  }

  private static async markMFAEnabled(userId: string): Promise<void> {
    await db.execute(
      'UPDATE users SET mfa_enabled = 1, mfa_enabled_at = NOW() WHERE id = ?',
      [userId]
    );
  }
}