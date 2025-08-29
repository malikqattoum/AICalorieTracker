import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import { pool } from '../../../db';
import { UserService } from '../user.service';

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret';

  static async generateTokens(payload: any): Promise<{ accessToken: string; refreshToken: string }> {
    console.log('[JWT] generateTokens called with payload:', {
      id: payload.id,
      idType: typeof payload.id,
      hasId: payload.hasOwnProperty('id'),
      payloadKeys: Object.keys(payload)
    });

    if (!payload || payload.id === undefined || payload.id === null || isNaN(payload.id)) {
      console.error('[JWT] ERROR: Invalid payload or user ID:', { payload, id: payload?.id, idType: typeof payload?.id });
      throw new Error(`Invalid user payload provided to generateTokens: ${JSON.stringify(payload)}`);
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });

    const refreshToken = jwt.sign(
      { userId: payload.id, tokenVersion: payload.tokenVersion || 1 },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    console.log('[JWT] Tokens generated:', {
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      refreshTokenDefined: refreshToken !== undefined
    });

    await this.storeRefreshToken(payload.id, refreshToken);

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

  private static async storeRefreshToken(userId: number, refreshToken: string): Promise<void> {
    console.log('[JWT] storeRefreshToken called with:', {
      userId,
      userIdType: typeof userId,
      userIdIsNumber: typeof userId === 'number',
      userIdIsNaN: isNaN(userId),
      refreshTokenLength: refreshToken?.length,
      refreshTokenDefined: refreshToken !== undefined,
      refreshTokenType: typeof refreshToken
    });

    if (userId === undefined || userId === null || isNaN(userId)) {
      console.error('[JWT] ERROR: userId is invalid:', { userId, type: typeof userId });
      throw new Error(`Invalid userId provided to storeRefreshToken: ${userId} (type: ${typeof userId})`);
    }

    if (!refreshToken || typeof refreshToken !== 'string') {
      console.error('[JWT] ERROR: refreshToken is invalid:', { refreshToken, type: typeof refreshToken });
      throw new Error(`Invalid refreshToken provided to storeRefreshToken: ${refreshToken} (type: ${typeof refreshToken})`);
    }

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    console.log('[JWT] About to execute SQL with:', {
      userId,
      userIdType: typeof userId,
      hashedTokenLength: hashedToken?.length,
      hashedTokenDefined: hashedToken !== undefined,
      hashedTokenType: typeof hashedToken,
      expiresAt,
      expiresAtType: typeof expiresAt,
      bindParams: [userId, hashedToken, expiresAt],
      bindTypes: [typeof userId, typeof hashedToken, typeof expiresAt]
    });

    try {
      await pool.execute(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, ?)`,
        [userId, hashedToken, expiresAt]
      );
      console.log('[JWT] Refresh token stored successfully');
    } catch (dbError) {
      console.error('[JWT] Database error storing refresh token:', dbError);
      throw dbError;
    }
  }

  private static async verifyRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
    const [tokens] = await pool.execute(
      'SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()',
      [userId]
    );

    if ((tokens as any[]).length === 0) return false;
    return bcrypt.compare(refreshToken, (tokens as any[])[0].token_hash);
  }

  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, this.REFRESH_TOKEN_SECRET) as any;
      await pool.execute(
        'DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?',
        [decoded.userId, await bcrypt.hash(refreshToken, 10)]
      );
    } catch (error) {
      // Ignore invalid tokens
    }
  }
}