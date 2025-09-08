import db, { db as drizzleDb } from '../db';
import { UserProfile } from '../models/userProfile';
import { weeklyStats, mealAnalyses } from '@shared/schema';
import { eq, gte, lt, and, sql } from 'drizzle-orm';
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

      // Calculate current week starting (Sunday)
      const now = new Date();
      const currentWeekStart = new Date(now);
      currentWeekStart.setDate(now.getDate() - now.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      // Fetch weekly stats for current week
      let [stats] = await drizzleDb.select()
        .from(weeklyStats)
        .where(and(
          eq(weeklyStats.userId, userId),
          eq(weeklyStats.weekStarting, currentWeekStart)
        ));
      console.log('[DEBUG] Database query result for user stats:', stats ? 'found' : 'null');

      // If no stats exist for current week, try to find the most recent week with data
      if (!stats) {
        console.log(`[DEBUG] No weekly stats found for user ${userId} in current week, looking for most recent week with data`);

        // Find the most recent week with data
        const [recentStats] = await drizzleDb.select()
          .from(weeklyStats)
          .where(eq(weeklyStats.userId, userId))
          .orderBy(sql`${weeklyStats.weekStarting} DESC`)
          .limit(1);

        if (recentStats) {
          console.log(`[DEBUG] Found recent stats from week starting: ${recentStats.weekStarting}`);
          stats = recentStats;
        } else {
          // No stored stats, calculate from meal data for current week
          console.log(`[DEBUG] No stored weekly stats found for user ${userId}, calculating from meal data`);
          const calculatedStats = await this.calculateWeeklyStatsFromMeals(userId);
          stats = {
            id: calculatedStats.id,
            userId: calculatedStats.userId,
            averageCalories: calculatedStats.averageCalories,
            mealsTracked: calculatedStats.mealsTracked,
            averageProtein: calculatedStats.averageProtein,
            healthiestDay: calculatedStats.healthiestDay,
            weekStarting: calculatedStats.weekStarting,
            caloriesByDay: JSON.stringify(calculatedStats.caloriesByDay),
            macrosByDay: JSON.stringify(calculatedStats.macrosByDay),
            caloriesBurned: null,
            createdAt: null,
            updatedAt: null
          };
        }
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
  },

  async calculateWeeklyStatsFromMeals(userId: number): Promise<WeeklyStats> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Fetch meal analyses for the current week
    const meals = await drizzleDb.select()
      .from(mealAnalyses)
      .where(and(
        eq(mealAnalyses.userId, userId),
        gte(mealAnalyses.analysisTimestamp, startOfWeek),
        lt(mealAnalyses.analysisTimestamp, endOfWeek)
      ));

    // Initialize data structures
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const caloriesByDay: Record<string, number> = {};
    const macrosByDay: Record<string, { protein: number; carbs: number; fat: number }> = {};

    days.forEach(day => {
      caloriesByDay[day] = 0;
      macrosByDay[day] = { protein: 0, carbs: 0, fat: 0 };
    });

    // Aggregate data by day
    meals.forEach(meal => {
      if (!meal.analysisTimestamp) return;
      const dayIndex = meal.analysisTimestamp.getDay(); // 0=Sunday, 1=Monday, etc.
      const dayName = days[dayIndex];

      caloriesByDay[dayName] += meal.estimatedCalories || 0;
      macrosByDay[dayName].protein += parseFloat(meal.estimatedProtein as string) || 0;
      macrosByDay[dayName].carbs += parseFloat(meal.estimatedCarbs as string) || 0;
      macrosByDay[dayName].fat += parseFloat(meal.estimatedFat as string) || 0;
    });

    // Calculate totals and averages
    const totalCalories = Object.values(caloriesByDay).reduce((sum, cal) => sum + cal, 0);
    const totalProtein = Object.values(macrosByDay).reduce((sum, day) => sum + day.protein, 0);
    const totalCarbs = Object.values(macrosByDay).reduce((sum, day) => sum + day.carbs, 0);
    const totalFat = Object.values(macrosByDay).reduce((sum, day) => sum + day.fat, 0);

    const averageCalories = Math.round(totalCalories / 7);
    const averageProtein = Math.round(totalProtein / 7);
    const mealsTracked = meals.length;

    // Determine healthiest day (day with lowest calories, or Sunday if all zero)
    let healthiestDay = 'Sunday';
    let minCalories = Infinity;
    for (const [day, calories] of Object.entries(caloriesByDay)) {
      if (calories < minCalories && calories > 0) {
        minCalories = calories;
        healthiestDay = day;
      }
    }
    if (minCalories === Infinity) healthiestDay = 'Sunday'; // All zero

    const weeklyStatsData = {
      userId,
      averageCalories,
      mealsTracked,
      averageProtein,
      healthiestDay,
      weekStarting: startOfWeek,
      caloriesByDay,
      macrosByDay
    };

    // Check if stats already exist for this week
    const [existingStats] = await drizzleDb.select()
      .from(weeklyStats)
      .where(and(
        eq(weeklyStats.userId, userId),
        eq(weeklyStats.weekStarting, startOfWeek)
      ));

    if (existingStats) {
      // Update existing
      await drizzleDb.update(weeklyStats)
        .set({
          ...weeklyStatsData,
          caloriesByDay: JSON.stringify(caloriesByDay),
          macrosByDay: JSON.stringify(macrosByDay),
          updatedAt: new Date()
        })
        .where(eq(weeklyStats.id, existingStats.id));
      return { ...existingStats, ...weeklyStatsData };
    } else {
      // Insert new
      const result = await drizzleDb.insert(weeklyStats).values({
        ...weeklyStatsData,
        caloriesByDay: JSON.stringify(caloriesByDay),
        macrosByDay: JSON.stringify(macrosByDay)
      });
      // @ts-ignore
      const insertId = result.insertId || result[0]?.insertId;
      const [stats] = await drizzleDb.select().from(weeklyStats).where(eq(weeklyStats.id, insertId));
      return {
        ...stats,
        caloriesByDay: typeof stats.caloriesByDay === 'string' ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
        macrosByDay: stats.macrosByDay ? (typeof stats.macrosByDay === 'string' ? JSON.parse(stats.macrosByDay) : stats.macrosByDay) : undefined
      };
    }
  }
};