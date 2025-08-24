import db from '../db';
import { UserProfile } from '../models/userProfile';
import { UserSettings } from '../models/userSettings';

export default {
  async updateProfile(userId: number, updates: Partial<UserProfile>) {
    const fields = [];
    const params = [];
    
    for (const [field, value] of Object.entries(updates)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    
    params.push(userId);
    
    await db.execute(
      `UPDATE user_profiles SET ${fields.join(', ')} WHERE user_id = ?`,
      params
    );
    
    return this.getProfile(userId);
  },

  async getProfile(userId: number): Promise<UserProfile> {
    const [profiles] = await db.execute(
      'SELECT * FROM user_profiles WHERE user_id = ?',
      [userId]
    );
    return profiles.length ? profiles[0] : {};
  },

  async getSettings(userId: number): Promise<UserSettings> {
    const [settings] = await db.execute(
      'SELECT * FROM user_settings WHERE user_id = ?',
      [userId]
    );
    return settings.length ? settings[0] : {};
  },

  async updateSettings(userId: number, settings: Partial<UserSettings>) {
    const fields = [];
    const params = [];
    
    for (const [field, value] of Object.entries(settings)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    
    params.push(userId);
    
    await db.execute(
      `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
      params
    );
    
    return this.getSettings(userId);
  },

  async markOnboardingCompleted(userId: number) {
    await db.execute(
      'UPDATE users SET onboarding_completed = true WHERE id = ?',
      [userId]
    );
  }
};