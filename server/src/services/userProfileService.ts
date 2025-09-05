import db, { db as drizzleDb } from '../db';
import { UserProfile } from '../models/userProfile';
import { weeklyStats } from '@shared/schema';
import { eq } from 'drizzle-orm';
import type { WeeklyStats } from '@shared/schema';

interface UserSettings {
  theme?: string;
  language?: string;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  measurementSystem?: string;
  dietaryRestrictions?: any;
  allergies?: any;
}

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
    return profiles.length ? profiles[0] : { user_id: userId };
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
  },

  async getUserStats(userId: number): Promise<WeeklyStats> {
    try {
      console.log('[DEBUG] getUserStats called for userId:', userId);

      // Fetch weekly stats from database
      let [stats] = await drizzleDb.select()
        .from(weeklyStats)
        .where(eq(weeklyStats.userId, userId));
      console.log('[DEBUG] Database query result for user stats:', stats ? 'found' : 'null');

      // If no stats exist, create default stats
      if (!stats) {
        console.log(`[DEBUG] No weekly stats found for user ${userId}, creating default stats`);
        stats = await this.createDefaultWeeklyStats(userId);
      }

      // Parse JSON fields to correct types
      const parsedStats: WeeklyStats = {
        ...stats,
        caloriesByDay: typeof stats.caloriesByDay === 'string' ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
        macrosByDay: stats.macrosByDay ? (typeof stats.macrosByDay === 'string' ? JSON.parse(stats.macrosByDay) : stats.macrosByDay) : undefined
      };

      // Ensure macrosByDay is always present
      if (!parsedStats.macrosByDay) {
        parsedStats.macrosByDay = {
          Sunday: { protein: 0, carbs: 0, fat: 0 },
          Monday: { protein: 0, carbs: 0, fat: 0 },
          Tuesday: { protein: 0, carbs: 0, fat: 0 },
          Wednesday: { protein: 0, carbs: 0, fat: 0 },
          Thursday: { protein: 0, carbs: 0, fat: 0 },
          Friday: { protein: 0, carbs: 0, fat: 0 },
          Saturday: { protein: 0, carbs: 0, fat: 0 }
        };
      }

      console.log('DEBUG: getUserStats returning:', JSON.stringify(parsedStats, null, 2));
      return parsedStats;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      throw new Error('Failed to fetch user statistics');
    }
  },

  async createDefaultWeeklyStats(userId: number): Promise<any> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const defaultStats = {
      userId,
      averageCalories: 0,
      mealsTracked: 0,
      averageProtein: 0,
      healthiestDay: 'Sunday',
      weekStarting: startOfWeek,
      caloriesByDay: {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0
      },
      macrosByDay: {
        Sunday: { protein: 0, carbs: 0, fat: 0 },
        Monday: { protein: 0, carbs: 0, fat: 0 },
        Tuesday: { protein: 0, carbs: 0, fat: 0 },
        Wednesday: { protein: 0, carbs: 0, fat: 0 },
        Thursday: { protein: 0, carbs: 0, fat: 0 },
        Friday: { protein: 0, carbs: 0, fat: 0 },
        Saturday: { protein: 0, carbs: 0, fat: 0 }
      }
    };

    const result = await drizzleDb.insert(weeklyStats).values({
      ...defaultStats,
      caloriesByDay: JSON.stringify(defaultStats.caloriesByDay),
      macrosByDay: JSON.stringify(defaultStats.macrosByDay)
    });
    // @ts-ignore drizzle-orm/mysql2 returns insertId
    const insertId = result.insertId || result[0]?.insertId;
    if (!insertId) throw new Error('Failed to get inserted weekly stats id');

    const [stats] = await drizzleDb.select().from(weeklyStats).where(eq(weeklyStats.id, insertId));
    return stats;
  }
};