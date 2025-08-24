import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from '../../db';
import { UserService } from '../user.service';

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';

  static async generateTokens(payload: any): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId, tokenVersion: payload.tokenVersion || 1 },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    await this.storeRefreshToken(payload.userId, refreshToken);

    return { accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as any;
      const isValid = await this.verifyRefreshToken(decoded.userId, refreshToken);
      
      if (!isValid) return null;

      const user = await UserService.getUserById(decoded.userId);
      if (!user) return null;

      return jwt.sign(
        { userId: user.id, email: user.email, tokenVersion: user.token_version },
        process.env.JWT_SECRET!,
        { expiresIn: this.ACCESS_TOKEN_EXPIRY }
      );
    } catch (error) {
      return null;
    }
  }

  private static async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await db.execute(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [userId, hashedToken]
    );
  }

  private static async verifyRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const [tokens] = await db.execute(
      'SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()',
      [userId]
    );

    if (tokens.length === 0) return false;
    return bcrypt.compare(refreshToken, tokens[0].token_hash);
  }

  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as any;
      await db.execute(
        'DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?',
        [decoded.userId, await bcrypt.hash(refreshToken, 10)]
      );
    } catch (error) {
      // Ignore invalid tokens
    }
  }
}