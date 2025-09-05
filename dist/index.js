var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/storage.ts
import createMemoryStore from "memorystore";
import session from "express-session";
var MemoryStore, MemStorage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    MemoryStore = createMemoryStore(session);
    MemStorage = class {
      users;
      mealAnalyses;
      weeklyStats;
      userIdCounter;
      mealIdCounter;
      statsIdCounter;
      siteContent;
      sessionStore;
      db;
      constructor() {
        this.users = /* @__PURE__ */ new Map();
        this.mealAnalyses = /* @__PURE__ */ new Map();
        this.weeklyStats = /* @__PURE__ */ new Map();
        this.siteContent = /* @__PURE__ */ new Map();
        this.userIdCounter = 1;
        this.mealIdCounter = 1;
        this.statsIdCounter = 1;
        this.sessionStore = new MemoryStore({
          checkPeriod: 864e5
          // 24h
        });
        this.db = void 0;
      }
      // User methods
      async getUser(id) {
        return this.users.get(id);
      }
      async getUserByUsername(username) {
        return Array.from(this.users.values()).find(
          (user) => user.username === username
        );
      }
      async getUserByEmail(email) {
        return Array.from(this.users.values()).find(
          (user) => user.email === email
        );
      }
      async createUser(insertUser) {
        const id = this.userIdCounter++;
        const user = {
          ...insertUser,
          id,
          email: insertUser.email || null,
          referredBy: null,
          referralCode: null,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionType: null,
          subscriptionStatus: null,
          subscriptionEndDate: null,
          isPremium: false,
          nutritionGoals: null,
          role: "user",
          // Onboarding fields with defaults
          age: null,
          gender: null,
          height: null,
          weight: null,
          activityLevel: null,
          primaryGoal: null,
          targetWeight: null,
          timeline: null,
          dietaryPreferences: null,
          allergies: null,
          aiMealSuggestions: true,
          aiChatAssistantName: null,
          notificationsEnabled: true,
          onboardingCompleted: false,
          onboardingCompletedAt: null
        };
        this.users.set(id, user);
        return user;
      }
      async updateUserStripeInfo(userId, stripeInfo) {
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        const updatedUser = {
          ...user,
          ...stripeInfo
        };
        this.users.set(userId, updatedUser);
        return updatedUser;
      }
      async getUserById(userId) {
        return this.users.get(userId);
      }
      async updateUserNutritionGoals(userId, goals) {
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        user.nutritionGoals = {
          calories: goals.calories,
          protein: goals.protein,
          carbs: goals.carbs,
          fat: goals.fat
        };
      }
      // Meal analysis methods
      async getMealAnalyses(userId) {
        return Array.from(this.mealAnalyses.values()).filter((analysis) => analysis.userId === userId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
      async getMealAnalysis(id) {
        return this.mealAnalyses.get(id);
      }
      async createMealAnalysis(insertAnalysis) {
        const id = this.mealIdCounter++;
        const timestamp23 = /* @__PURE__ */ new Date();
        const analysis = {
          ...insertAnalysis,
          id,
          timestamp: timestamp23,
          metadata: insertAnalysis.metadata || null,
          created_at: /* @__PURE__ */ new Date(),
          updated_at: /* @__PURE__ */ new Date(),
          deleted_at: null,
          imageData: insertAnalysis.imageData || null,
          imageId: insertAnalysis.imageId || null,
          thumbnailPath: insertAnalysis.thumbnailPath || null,
          optimizedPath: insertAnalysis.optimizedPath || null,
          originalPath: insertAnalysis.originalPath || null,
          imageHash: insertAnalysis.imageHash || null
        };
        this.mealAnalyses.set(id, analysis);
        await this.updateWeeklyStats(analysis.userId);
        return analysis;
      }
      // Helper method to update weekly stats based on meal analyses
      async updateWeeklyStats(userId) {
        const userMeals = await this.getMealAnalyses(userId);
        if (userMeals.length === 0) return;
        const now = /* @__PURE__ */ new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weekMeals = userMeals.filter((meal) => new Date(meal.timestamp) >= startOfWeek);
        if (weekMeals.length === 0) return;
        const totalCalories = weekMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const totalProtein = weekMeals.reduce((sum, meal) => sum + meal.protein, 0);
        const averageCalories = Math.round(totalCalories / weekMeals.length);
        const averageProtein = Math.round(totalProtein / weekMeals.length);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const caloriesByDay = {};
        const macrosByDay = {};
        dayNames.forEach((day) => {
          caloriesByDay[day] = 0;
          macrosByDay[day] = { protein: 0, carbs: 0, fat: 0 };
        });
        weekMeals.forEach((meal) => {
          const mealDay = dayNames[new Date(meal.timestamp).getDay()];
          caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + meal.calories;
          macrosByDay[mealDay].protein += meal.protein;
          macrosByDay[mealDay].carbs += meal.carbs;
          macrosByDay[mealDay].fat += meal.fat;
        });
        let healthiestDay = dayNames[0];
        let lowestCalories = Number.MAX_VALUE;
        Object.entries(caloriesByDay).forEach(([day, calories]) => {
          if (calories > 0 && calories < lowestCalories) {
            healthiestDay = day;
            lowestCalories = calories;
          }
        });
        const existingStats = await this.getWeeklyStats(userId);
        const stats = {
          id: existingStats ? existingStats.id : this.statsIdCounter,
          userId,
          averageCalories,
          mealsTracked: weekMeals.length,
          averageProtein,
          healthiestDay,
          weekStarting: startOfWeek,
          caloriesByDay,
          macrosByDay,
          caloriesBurned: 0
          // Add missing field
        };
        if (existingStats) {
          this.weeklyStats.set(existingStats.id, stats);
        } else {
          const id = this.statsIdCounter++;
          this.weeklyStats.set(id, { ...stats, id });
        }
      }
      // Weekly stats methods
      async getWeeklyStats(userId, medicalCondition) {
        const stats = Array.from(this.weeklyStats.values()).find(
          (stats2) => stats2.userId === userId
        );
        if (!stats) return void 0;
        if (medicalCondition && medicalCondition !== "none") {
          const adjustedStats = this.applyMedicalConditionAdjustments(stats, medicalCondition);
          return adjustedStats;
        }
        return {
          ...stats,
          macrosByDay: stats.macrosByDay || {
            Sunday: { protein: 0, carbs: 0, fat: 0 },
            Monday: { protein: 0, carbs: 0, fat: 0 },
            Tuesday: { protein: 0, carbs: 0, fat: 0 },
            Wednesday: { protein: 0, carbs: 0, fat: 0 },
            Thursday: { protein: 0, carbs: 0, fat: 0 },
            Friday: { protein: 0, carbs: 0, fat: 0 },
            Saturday: { protein: 0, carbs: 0, fat: 0 }
          }
        };
      }
      /**
       * Apply medical condition adjustments to stats
       */
      applyMedicalConditionAdjustments(stats, medicalCondition) {
        const adjustedStats = { ...stats };
        switch (medicalCondition.toLowerCase()) {
          case "diabetes":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.9);
            adjustedStats.averageProtein = Math.round(stats.averageProtein * 1.2);
            break;
          case "hypertension":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.85);
            break;
          case "heart_disease":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.8);
            break;
          case "obesity":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.8);
            break;
          default:
            break;
        }
        return adjustedStats;
      }
      async createOrUpdateWeeklyStats(insertStats) {
        const existingStats = await this.getWeeklyStats(insertStats.userId);
        const id = existingStats ? existingStats.id : this.statsIdCounter++;
        const macrosByDay = insertStats.macrosByDay || {
          Sunday: { protein: 0, carbs: 0, fat: 0 },
          Monday: { protein: 0, carbs: 0, fat: 0 },
          Tuesday: { protein: 0, carbs: 0, fat: 0 },
          Wednesday: { protein: 0, carbs: 0, fat: 0 },
          Thursday: { protein: 0, carbs: 0, fat: 0 },
          Friday: { protein: 0, carbs: 0, fat: 0 },
          Saturday: { protein: 0, carbs: 0, fat: 0 }
        };
        const stats = {
          ...insertStats,
          id,
          macrosByDay,
          caloriesBurned: insertStats.caloriesBurned || 0
          // Add missing field
        };
        this.weeklyStats.set(id, stats);
        return stats;
      }
      // Site content methods
      async getSiteContent(key) {
        return this.siteContent.get(key) || null;
      }
      async updateSiteContent(key, value) {
        this.siteContent.set(key, value);
      }
      // AI config methods (mock implementation for memory storage)
      async getAIConfigs() {
        return [
          {
            id: 1,
            provider: "openai",
            modelName: "gpt-4-vision-preview",
            temperature: 70,
            maxTokens: 1e3,
            promptTemplate: "Analyze this food image and provide detailed nutritional information including calories, protein, carbs, fat, and fiber. Also identify the food items present.",
            isActive: true,
            apiKeyEncrypted: null,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          },
          {
            id: 2,
            provider: "gemini",
            modelName: "gemini-1.5-pro-vision-latest",
            temperature: 70,
            maxTokens: 1e3,
            promptTemplate: "Analyze this food image and provide detailed nutritional information including calories, protein, carbs, fat, and fiber. Also identify the food items present.",
            isActive: false,
            apiKeyEncrypted: null,
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }
        ];
      }
      async updateAIConfig(id, config3) {
        console.log(`Updated AI config ${id}:`, config3);
      }
      async deactivateAllAIConfigs() {
        console.log("Deactivated all AI configs");
      }
      async updateUserOnboarding(userId, onboardingData) {
        const user = await this.getUser(userId);
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        const updatedUser = {
          ...user,
          ...onboardingData
        };
        this.users.set(userId, updatedUser);
        return updatedUser;
      }
      async createNutritionGoals(userId, goals) {
        const user = await this.getUser(userId);
        if (user) {
          user.nutritionGoals = goals;
        }
      }
    };
  }
});

// server/src/db/schemas/users.ts
import { sql } from "drizzle-orm";
import { int, varchar, timestamp, datetime, boolean, longtext, decimal, mysqlTable } from "drizzle-orm/mysql-core";
var users, userPreferences, usersIndexes;
var init_users = __esm({
  "server/src/db/schemas/users.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").primaryKey().autoincrement(),
      username: varchar("username", { length: 255 }).notNull().unique(),
      password: varchar("password", { length: 255 }).notNull(),
      firstName: varchar("first_name", { length: 255 }).notNull(),
      lastName: varchar("last_name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }),
      referredBy: int("referred_by"),
      referralCode: varchar("referral_code", { length: 255 }).unique(),
      // Stripe related fields
      stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
      stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
      subscriptionType: varchar("subscription_type", { length: 255 }),
      subscriptionStatus: varchar("subscription_status", { length: 255 }),
      subscriptionEndDate: datetime("subscription_end_date"),
      isPremium: boolean("is_premium").default(false),
      nutritionGoals: longtext("nutrition_goals"),
      role: varchar("role", { length: 50 }).default("user"),
      // Onboarding fields
      age: int("age"),
      gender: varchar("gender", { length: 20 }),
      height: int("height"),
      // in cm
      weight: int("weight"),
      // in kg
      activityLevel: varchar("activity_level", { length: 50 }),
      primaryGoal: varchar("primary_goal", { length: 100 }),
      targetWeight: int("target_weight"),
      // in kg
      timeline: varchar("timeline", { length: 50 }),
      dietaryPreferences: longtext("dietary_preferences"),
      allergies: longtext("allergies"),
      aiMealSuggestions: boolean("ai_meal_suggestions").default(true),
      aiChatAssistantName: varchar("ai_chat_assistant_name", { length: 100 }),
      notificationsEnabled: boolean("notifications_enabled").default(true),
      onboardingCompleted: boolean("onboarding_completed").default(false),
      onboardingCompletedAt: datetime("onboarding_completed_at").default(sql`NULL`),
      // Core user fields
      dailyCalorieTarget: int("daily_calorie_target").default(2e3),
      proteinTarget: decimal("protein_target", { precision: 5, scale: 2 }).default(sql`150.00`),
      carbsTarget: decimal("carbs_target", { precision: 5, scale: 2 }).default(sql`250.00`),
      fatTarget: decimal("fat_target", { precision: 5, scale: 2 }).default(sql`67.00`),
      measurementSystem: varchar("measurement_system", { length: 10 }).default("metric"),
      profileImageUrl: varchar("profile_image_url", { length: 500 }),
      emailVerified: boolean("email_verified").default(false),
      emailVerificationToken: varchar("email_verification_token", { length: 255 }),
      resetPasswordToken: varchar("reset_password_token", { length: 255 }),
      resetPasswordExpiresAt: datetime("reset_password_expires_at"),
      lastLoginAt: datetime("last_login_at"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userPreferences = mysqlTable("user_preferences", {
      id: int("id").primaryKey().autoincrement(),
      userId: int("user_id").notNull(),
      theme: varchar("theme", { length: 20 }).default("light"),
      language: varchar("language", { length: 10 }).default("en"),
      notificationsEnabled: boolean("notifications_enabled").default(true),
      emailNotifications: boolean("email_notifications").default(true),
      pushNotifications: boolean("push_notifications").default(true),
      measurementSystem: varchar("measurement_system", { length: 10 }).default("metric"),
      dietaryRestrictions: longtext("dietary_restrictions"),
      allergies: longtext("allergies"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    usersIndexes = {
      users_username: sql`CREATE INDEX IF NOT EXISTS users_username_idx ON users(username)`,
      users_email: sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users(email)`,
      users_stripeCustomerId: sql`CREATE INDEX IF NOT EXISTS users_stripe_customer_id_idx ON users(stripe_customer_id)`,
      users_isPremium: sql`CREATE INDEX IF NOT EXISTS users_is_premium_idx ON users(is_premium)`,
      users_role: sql`CREATE INDEX IF NOT EXISTS users_role_idx ON users(role)`,
      users_isActive: sql`CREATE INDEX IF NOT EXISTS users_is_active_idx ON users(is_active)`,
      userPreferences_userId: sql`CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id)`
    };
  }
});

// server/src/db/schemas/mealAnalyses.ts
var mealAnalyses_exports = {};
__export(mealAnalyses_exports, {
  mealAnalyses: () => mealAnalyses,
  mealAnalysesIndexes: () => mealAnalysesIndexes
});
import { sql as sql2 } from "drizzle-orm";
import { int as int2, varchar as varchar2, timestamp as timestamp2, datetime as datetime2, json, text, decimal as decimal2, mysqlTable as mysqlTable2 } from "drizzle-orm/mysql-core";
var mealAnalyses, mealAnalysesIndexes;
var init_mealAnalyses = __esm({
  "server/src/db/schemas/mealAnalyses.ts"() {
    "use strict";
    mealAnalyses = mysqlTable2("meal_analyses", {
      id: int2("id").primaryKey().autoincrement(),
      userId: int2("user_id").notNull(),
      mealId: int2("meal_id").notNull(),
      foodName: varchar2("food_name", { length: 255 }).notNull(),
      confidenceScore: decimal2("confidence_score", { precision: 5, scale: 4 }),
      analysisDetails: json("analysis_details"),
      aiInsights: text("ai_insights"),
      suggestedPortionSize: varchar2("suggested_portion_size", { length: 100 }),
      estimatedCalories: int2("estimated_calories"),
      estimatedProtein: decimal2("estimated_protein", { precision: 5, scale: 2 }),
      estimatedCarbs: decimal2("estimated_carbs", { precision: 5, scale: 2 }),
      estimatedFat: decimal2("estimated_fat", { precision: 5, scale: 2 }),
      imageUrl: varchar2("image_url", { length: 500 }),
      imageHash: varchar2("image_hash", { length: 64 }),
      analysisTimestamp: timestamp2("analysis_timestamp").defaultNow(),
      createdAt: timestamp2("created_at").defaultNow(),
      updatedAt: timestamp2("updated_at").defaultNow(),
      deletedAt: datetime2("deleted_at")
    });
    mealAnalysesIndexes = {
      mealAnalyses_userId: sql2`CREATE INDEX IF NOT EXISTS meal_analyses_user_id_idx ON meal_analyses(user_id)`,
      mealAnalyses_mealId: sql2`CREATE INDEX IF NOT EXISTS meal_analyses_meal_id_idx ON meal_analyses(meal_id)`,
      mealAnalyses_analysisTimestamp: sql2`CREATE INDEX IF NOT EXISTS meal_analyses_analysis_timestamp_idx ON meal_analyses(analysis_timestamp)`,
      mealAnalyses_imageHash: sql2`CREATE INDEX IF NOT EXISTS meal_analyses_image_hash_idx ON meal_analyses(image_hash)`,
      mealAnalyses_confidenceScore: sql2`CREATE INDEX IF NOT EXISTS meal_analyses_confidence_score_idx ON meal_analyses(confidence_score)`
    };
  }
});

// server/src/db/schemas/weeklyStats.ts
import { sql as sql3 } from "drizzle-orm";
import { int as int3, varchar as varchar3, timestamp as timestamp3, longtext as longtext2, mysqlTable as mysqlTable3 } from "drizzle-orm/mysql-core";
var weeklyStats, weeklyStatsIndexes;
var init_weeklyStats = __esm({
  "server/src/db/schemas/weeklyStats.ts"() {
    "use strict";
    weeklyStats = mysqlTable3("weekly_stats", {
      id: int3("id").primaryKey().autoincrement(),
      userId: int3("user_id").notNull(),
      averageCalories: int3("average_calories").notNull(),
      mealsTracked: int3("meals_tracked").notNull(),
      averageProtein: int3("average_protein").notNull(),
      healthiestDay: varchar3("healthiest_day", { length: 255 }).notNull(),
      weekStarting: timestamp3("week_starting").notNull(),
      caloriesByDay: longtext2("calories_by_day").notNull(),
      macrosByDay: longtext2("macros_by_day"),
      caloriesBurned: int3("calories_burned").default(0),
      createdAt: timestamp3("created_at").defaultNow(),
      updatedAt: timestamp3("updated_at").defaultNow()
    });
    weeklyStatsIndexes = {
      weeklyStats_userId: sql3`CREATE INDEX IF NOT EXISTS weekly_stats_user_id_idx ON weekly_stats(user_id)`,
      weeklyStats_weekStarting: sql3`CREATE INDEX IF NOT EXISTS weekly_stats_week_starting_idx ON weekly_stats(week_starting)`,
      weeklyStats_averageCalories: sql3`CREATE INDEX IF NOT EXISTS weekly_stats_average_calories_idx ON weekly_stats(average_calories)`,
      weeklyStats_mealsTracked: sql3`CREATE INDEX IF NOT EXISTS weekly_stats_meals_tracked_idx ON weekly_stats(meals_tracked)`
    };
  }
});

// server/src/db/schemas/siteContent.ts
import { sql as sql4 } from "drizzle-orm";
import { varchar as varchar4, text as text2, mysqlTable as mysqlTable4 } from "drizzle-orm/mysql-core";
var siteContent, siteContentIndexes;
var init_siteContent = __esm({
  "server/src/db/schemas/siteContent.ts"() {
    "use strict";
    siteContent = mysqlTable4("site_content", {
      key: varchar4("key", { length: 64 }).primaryKey(),
      value: text2("value").notNull()
    });
    siteContentIndexes = {
      siteContent_key: sql4`CREATE INDEX IF NOT EXISTS site_content_key_idx ON site_content(key)`
    };
  }
});

// server/src/db/schemas/nutritionGoals.ts
import { sql as sql5 } from "drizzle-orm";
import { int as int5, timestamp as timestamp4, mysqlTable as mysqlTable5 } from "drizzle-orm/mysql-core";
var nutritionGoals, nutritionGoalsIndexes;
var init_nutritionGoals = __esm({
  "server/src/db/schemas/nutritionGoals.ts"() {
    "use strict";
    nutritionGoals = mysqlTable5("nutrition_goals", {
      id: int5("id").primaryKey().autoincrement(),
      userId: int5("user_id").notNull(),
      calories: int5("calories").notNull(),
      protein: int5("protein").notNull(),
      carbs: int5("carbs").notNull(),
      fat: int5("fat").notNull(),
      dailyCalories: int5("daily_calories"),
      weeklyWorkouts: int5("weekly_workouts"),
      waterIntake: int5("water_intake"),
      weight: int5("weight"),
      bodyFatPercentage: int5("body_fat_percentage"),
      createdAt: timestamp4("created_at").defaultNow(),
      updatedAt: timestamp4("updated_at").defaultNow()
    });
    nutritionGoalsIndexes = {
      nutritionGoals_userId: sql5`CREATE INDEX IF NOT EXISTS nutrition_goals_user_id_idx ON nutrition_goals(user_id)`,
      nutritionGoals_calories: sql5`CREATE INDEX IF NOT EXISTS nutrition_goals_calories_idx ON nutrition_goals(calories)`,
      nutritionGoals_protein: sql5`CREATE INDEX IF NOT EXISTS nutrition_goals_protein_idx ON nutrition_goals(protein)`,
      nutritionGoals_carbs: sql5`CREATE INDEX IF NOT EXISTS nutrition_goals_carbs_idx ON nutrition_goals(carbs)`,
      nutritionGoals_fat: sql5`CREATE INDEX IF NOT EXISTS nutrition_goals_fat_idx ON nutrition_goals(fat)`
    };
  }
});

// server/src/db/schemas/aiConfig.ts
import { sql as sql6 } from "drizzle-orm";
import { int as int6, varchar as varchar6, timestamp as timestamp5, boolean as boolean3, text as text3, mysqlTable as mysqlTable6 } from "drizzle-orm/mysql-core";
var aiConfig, aiConfigIndexes;
var init_aiConfig = __esm({
  "server/src/db/schemas/aiConfig.ts"() {
    "use strict";
    aiConfig = mysqlTable6("ai_config", {
      id: int6("id").primaryKey().autoincrement(),
      provider: varchar6("provider", { length: 50 }).notNull().default("openai"),
      apiKeyEncrypted: text3("api_key_encrypted"),
      modelName: varchar6("model_name", { length: 100 }).default("gpt-4-vision-preview"),
      temperature: int6("temperature").default(70),
      // stored as int (70 = 0.7)
      maxTokens: int6("max_tokens").default(1e3),
      promptTemplate: text3("prompt_template"),
      isActive: boolean3("is_active").default(true),
      createdAt: timestamp5("created_at").defaultNow(),
      updatedAt: timestamp5("updated_at").defaultNow()
    });
    aiConfigIndexes = {
      aiConfig_id: sql6`CREATE INDEX IF NOT EXISTS ai_config_id_idx ON ai_config(id)`,
      aiConfig_provider: sql6`CREATE INDEX IF NOT EXISTS ai_config_provider_idx ON ai_config(provider)`,
      aiConfig_modelName: sql6`CREATE INDEX IF NOT EXISTS ai_config_model_name_idx ON ai_config(model_name)`,
      aiConfig_isActive: sql6`CREATE INDEX IF NOT EXISTS ai_config_is_active_idx ON ai_config(is_active)`
    };
  }
});

// server/src/db/schemas/appConfig.ts
import { sql as sql7 } from "drizzle-orm";
import { int as int7, varchar as varchar7, timestamp as timestamp6, text as text4, mysqlTable as mysqlTable7 } from "drizzle-orm/mysql-core";
import { z } from "zod";
var appConfig, insertAppConfigSchema, appConfigIndexes;
var init_appConfig = __esm({
  "server/src/db/schemas/appConfig.ts"() {
    "use strict";
    appConfig = mysqlTable7("app_config", {
      id: int7("id").primaryKey().autoincrement(),
      key: varchar7("key", { length: 255 }).notNull().unique(),
      value: text4("value"),
      description: text4("description"),
      type: varchar7("type", { length: 50 }).notNull().default("string"),
      createdAt: timestamp6("created_at").defaultNow(),
      updatedAt: timestamp6("updated_at").defaultNow()
    });
    insertAppConfigSchema = z.object({
      key: z.string().min(1, "Key is required").max(255, "Key must be less than 255 characters"),
      value: z.string().optional(),
      description: z.string().optional(),
      type: z.string().min(1, "Type is required").default("string")
    });
    appConfigIndexes = {
      appConfig_id: sql7`CREATE INDEX IF NOT EXISTS app_config_id_idx ON app_config(id)`,
      appConfig_key: sql7`CREATE INDEX IF NOT EXISTS app_config_key_idx ON app_config(key)`,
      appConfig_type: sql7`CREATE INDEX IF NOT EXISTS app_config_type_idx ON app_config(type)`
    };
  }
});

// server/src/db/schemas/languages.ts
import { sql as sql8 } from "drizzle-orm";
import { int as int8, varchar as varchar8, timestamp as timestamp7, boolean as boolean4, text as text5, mysqlTable as mysqlTable8 } from "drizzle-orm/mysql-core";
import { z as z2 } from "zod";
var languages, translations, insertLanguageSchema, insertTranslationSchema, languagesIndexes, translationsIndexes;
var init_languages = __esm({
  "server/src/db/schemas/languages.ts"() {
    "use strict";
    languages = mysqlTable8("languages", {
      id: int8("id").primaryKey().autoincrement(),
      code: varchar8("code", { length: 10 }).notNull().unique(),
      name: varchar8("name", { length: 100 }).notNull(),
      isDefault: boolean4("is_default").default(false),
      isActive: boolean4("is_active").default(true),
      createdAt: timestamp7("created_at").defaultNow(),
      updatedAt: timestamp7("updated_at").defaultNow()
    });
    translations = mysqlTable8("translations", {
      id: int8("id").primaryKey().autoincrement(),
      languageId: int8("language_id").notNull(),
      key: varchar8("key", { length: 255 }).notNull(),
      value: text5("value").notNull(),
      isAutoTranslated: boolean4("is_auto_translated").default(false),
      createdAt: timestamp7("created_at").defaultNow(),
      updatedAt: timestamp7("updated_at").defaultNow()
    });
    insertLanguageSchema = z2.object({
      code: z2.string().min(1, "Language code is required").max(10, "Code must be less than 10 characters"),
      name: z2.string().min(1, "Language name is required").max(100, "Name must be less than 100 characters"),
      isDefault: z2.boolean().default(false),
      isActive: z2.boolean().default(true)
    });
    insertTranslationSchema = z2.object({
      languageId: z2.number().min(1, "Language ID is required"),
      key: z2.string().min(1, "Translation key is required").max(255, "Key must be less than 255 characters"),
      value: z2.string().min(1, "Translation value is required"),
      isAutoTranslated: z2.boolean().default(false)
    });
    languagesIndexes = {
      languages_code: sql8`CREATE INDEX IF NOT EXISTS languages_code_idx ON languages(code)`,
      languages_isActive: sql8`CREATE INDEX IF NOT EXISTS languages_is_active_idx ON languages(is_active)`,
      languages_isDefault: sql8`CREATE INDEX IF NOT EXISTS languages_is_default_idx ON languages(is_default)`
    };
    translationsIndexes = {
      translations_languageId: sql8`CREATE INDEX IF NOT EXISTS translations_language_id_idx ON translations(language_id)`,
      translations_key: sql8`CREATE INDEX IF NOT EXISTS translations_key_idx ON translations(key)`,
      translations_createdAt: sql8`CREATE INDEX IF NOT EXISTS translations_created_at_idx ON translations(created_at)`,
      translations_updatedAt: sql8`CREATE INDEX IF NOT EXISTS translations_updated_at_idx ON translations(updated_at)`
    };
  }
});

// server/src/db/schemas/plannedMeals.ts
import { sql as sql9 } from "drizzle-orm";
import { int as int9, varchar as varchar9, timestamp as timestamp8, text as text6, mysqlTable as mysqlTable9 } from "drizzle-orm/mysql-core";
import { z as z3 } from "zod";
var plannedMeals, insertPlannedMealSchema, plannedMealsIndexes;
var init_plannedMeals = __esm({
  "server/src/db/schemas/plannedMeals.ts"() {
    "use strict";
    plannedMeals = mysqlTable9("planned_meals", {
      id: int9("id").primaryKey().autoincrement(),
      userId: int9("user_id").notNull(),
      date: timestamp8("date").notNull(),
      mealType: varchar9("meal_type", { length: 50 }).notNull(),
      mealName: varchar9("meal_name", { length: 255 }).notNull(),
      calories: int9("calories").default(0),
      protein: int9("protein").default(0),
      carbs: int9("carbs").default(0),
      fat: int9("fat").default(0),
      recipe: text6("recipe"),
      notes: text6("notes"),
      createdAt: timestamp8("created_at").defaultNow(),
      updatedAt: timestamp8("updated_at").defaultNow()
    });
    insertPlannedMealSchema = z3.object({
      date: z3.date(),
      mealType: z3.string().min(1, "Meal type is required"),
      mealName: z3.string().min(1, "Meal name is required"),
      calories: z3.number().min(0, "Calories must be positive").default(0),
      protein: z3.number().min(0, "Protein must be positive").default(0),
      carbs: z3.number().min(0, "Carbs must be positive").default(0),
      fat: z3.number().min(0, "Fat must be positive").default(0),
      recipe: z3.string().optional(),
      notes: z3.string().optional()
    });
    plannedMealsIndexes = {
      plannedMeals_userId: sql9`CREATE INDEX IF NOT EXISTS planned_meals_user_id_idx ON planned_meals(user_id)`,
      plannedMeals_date: sql9`CREATE INDEX IF NOT EXISTS planned_meals_date_idx ON planned_meals(date)`,
      plannedMeals_mealType: sql9`CREATE INDEX IF NOT EXISTS planned_meals_meal_type_idx ON planned_meals(meal_type)`,
      plannedMeals_userDate: sql9`CREATE INDEX IF NOT EXISTS planned_meals_user_date_idx ON planned_meals(user_id, date)`
    };
  }
});

// server/src/db/schemas/favoriteMeals.ts
import { sql as sql10 } from "drizzle-orm";
import { int as int10, varchar as varchar10, timestamp as timestamp9, json as json4, mysqlTable as mysqlTable10 } from "drizzle-orm/mysql-core";
var favoriteMeals, favoriteMealsIndexes;
var init_favoriteMeals = __esm({
  "server/src/db/schemas/favoriteMeals.ts"() {
    "use strict";
    favoriteMeals = mysqlTable10("favorite_meals", {
      id: int10("id").primaryKey().autoincrement(),
      userId: int10("user_id").notNull(),
      mealName: varchar10("meal_name", { length: 255 }).notNull(),
      mealId: int10("meal_id"),
      mealType: varchar10("meal_type", { length: 50 }),
      ingredients: json4("ingredients"),
      nutrition: json4("nutrition"),
      createdAt: timestamp9("created_at").defaultNow(),
      updatedAt: timestamp9("updated_at").defaultNow()
    });
    favoriteMealsIndexes = {
      favoriteMeals_userId: sql10`CREATE INDEX IF NOT EXISTS favorite_meals_user_id_idx ON favorite_meals(user_id)`,
      favoriteMeals_mealId: sql10`CREATE INDEX IF NOT EXISTS favorite_meals_meal_id_idx ON favorite_meals(meal_id)`,
      favoriteMeals_mealType: sql10`CREATE INDEX IF NOT EXISTS favorite_meals_meal_type_idx ON favorite_meals(meal_type)`
    };
  }
});

// server/src/db/schemas/importedRecipes.ts
import { sql as sql11 } from "drizzle-orm";
import { int as int11, varchar as varchar11, timestamp as timestamp10, json as json5, text as text7, mysqlTable as mysqlTable11 } from "drizzle-orm/mysql-core";
var importedRecipes, importedRecipesIndexes;
var init_importedRecipes = __esm({
  "server/src/db/schemas/importedRecipes.ts"() {
    "use strict";
    importedRecipes = mysqlTable11("imported_recipes", {
      id: int11("id").primaryKey().autoincrement(),
      userId: int11("user_id").notNull(),
      recipeName: varchar11("recipe_name", { length: 255 }).notNull(),
      ingredients: json5("ingredients"),
      instructions: text7("instructions"),
      parsedNutrition: json5("parsed_nutrition"),
      notes: text7("notes"),
      sourceUrl: varchar11("source_url", { length: 500 }),
      sourceImageUrl: varchar11("source_image_url", { length: 500 }),
      rawImageData: text7("raw_image_data"),
      createdAt: timestamp10("created_at").defaultNow(),
      updatedAt: timestamp10("updated_at").defaultNow()
    });
    importedRecipesIndexes = {
      importedRecipes_userId: sql11`CREATE INDEX IF NOT EXISTS imported_recipes_user_id_idx ON imported_recipes(user_id)`,
      importedRecipes_recipeName: sql11`CREATE INDEX IF NOT EXISTS imported_recipes_recipe_name_idx ON imported_recipes(recipe_name)`,
      importedRecipes_sourceUrl: sql11`CREATE INDEX IF NOT EXISTS imported_recipes_source_url_idx ON imported_recipes(source_url)`,
      importedRecipes_createdAt: sql11`CREATE INDEX IF NOT EXISTS imported_recipes_created_at_idx ON imported_recipes(created_at)`
    };
  }
});

// server/src/db/schemas/referralSettings.ts
import { sql as sql12 } from "drizzle-orm";
import { int as int12, timestamp as timestamp11, decimal as decimal4, boolean as boolean5, mysqlTable as mysqlTable12 } from "drizzle-orm/mysql-core";
var referralSettings, referralSettingsIndexes;
var init_referralSettings = __esm({
  "server/src/db/schemas/referralSettings.ts"() {
    "use strict";
    referralSettings = mysqlTable12("referral_settings", {
      id: int12("id").primaryKey().autoincrement(),
      commissionPercent: decimal4("commission_percent", { precision: 5, scale: 2 }).notNull().default(sql12`10.00`),
      isRecurring: boolean5("is_recurring").notNull().default(false),
      createdAt: timestamp11("created_at").defaultNow(),
      updatedAt: timestamp11("updated_at").defaultNow()
    });
    referralSettingsIndexes = {
      referralSettings_id: sql12`CREATE INDEX IF NOT EXISTS referral_settings_id_idx ON referral_settings(id)`,
      referralSettings_commissionPercent: sql12`CREATE INDEX IF NOT EXISTS referral_settings_commission_percent_idx ON referral_settings(commission_percent)`,
      referralSettings_isRecurring: sql12`CREATE INDEX IF NOT EXISTS referral_settings_is_recurring_idx ON referral_settings(is_recurring)`
    };
  }
});

// server/src/db/schemas/referralCommissions.ts
import { sql as sql13 } from "drizzle-orm";
import { int as int13, varchar as varchar13, timestamp as timestamp12, datetime as datetime3, decimal as decimal5, boolean as boolean6, mysqlTable as mysqlTable13 } from "drizzle-orm/mysql-core";
var referralCommissions, referralCommissionsIndexes;
var init_referralCommissions = __esm({
  "server/src/db/schemas/referralCommissions.ts"() {
    "use strict";
    referralCommissions = mysqlTable13("referral_commissions", {
      id: int13("id").primaryKey().autoincrement(),
      referrerId: int13("referrer_id").notNull(),
      refereeId: int13("referee_id").notNull(),
      subscriptionId: varchar13("subscription_id", { length: 255 }).notNull(),
      amount: decimal5("amount", { precision: 10, scale: 2 }).notNull().default(sql13`0.00`),
      status: varchar13("status", { length: 20 }).notNull().default("pending"),
      isRecurring: boolean6("is_recurring").notNull(),
      createdAt: timestamp12("created_at").defaultNow(),
      paidAt: datetime3("paid_at")
    });
    referralCommissionsIndexes = {
      referralCommissions_referrerId: sql13`CREATE INDEX IF NOT EXISTS referral_commissions_referrer_id_idx ON referral_commissions(referrer_id)`,
      referralCommissions_refereeId: sql13`CREATE INDEX IF NOT EXISTS referral_commissions_referee_id_idx ON referral_commissions(referee_id)`,
      referralCommissions_subscriptionId: sql13`CREATE INDEX IF NOT EXISTS referral_commissions_subscription_id_idx ON referral_commissions(subscription_id)`,
      referralCommissions_status: sql13`CREATE INDEX IF NOT EXISTS referral_commissions_status_idx ON referral_commissions(status)`,
      referralCommissions_isRecurring: sql13`CREATE INDEX IF NOT EXISTS referral_commissions_is_recurring_idx ON referral_commissions(is_recurring)`,
      referralCommissions_createdAt: sql13`CREATE INDEX IF NOT EXISTS referral_commissions_created_at_idx ON referral_commissions(created_at)`
    };
  }
});

// server/src/db/schemas/healthAnalytics.ts
import { sql as sql14 } from "drizzle-orm";
import { int as int14, varchar as varchar14, decimal as decimal6, timestamp as timestamp13, datetime as datetime4, boolean as boolean7, json as json6, text as text8, mysqlTable as mysqlTable14 } from "drizzle-orm/mysql-core";
var healthScores, healthPredictions, patternAnalysis, healthReports, realTimeMonitoring, healthcareIntegration, healthGoals, healthInsights, healthAnalyticsIndexes;
var init_healthAnalytics = __esm({
  "server/src/db/schemas/healthAnalytics.ts"() {
    "use strict";
    healthScores = mysqlTable14("health_scores", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      scoreType: varchar14("score_type", { length: 50 }).notNull(),
      scoreValue: decimal6("score_value", { precision: 5, scale: 2 }).notNull(),
      maxScore: decimal6("max_score", { precision: 5, scale: 2 }).default("100.00"),
      calculationDate: varchar14("calculation_date", { length: 10 }).notNull(),
      scoreDetails: json6("score_details"),
      trendDirection: varchar14("trend_direction", { length: 20 }).default("stable"),
      confidenceLevel: decimal6("confidence_level", { precision: 3, scale: 2 }),
      metadata: json6("metadata"),
      createdAt: timestamp13("created_at").defaultNow(),
      updatedAt: timestamp13("updated_at").defaultNow()
    });
    healthPredictions = mysqlTable14("health_predictions", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      predictionType: varchar14("prediction_type", { length: 50 }).notNull(),
      targetDate: varchar14("target_date", { length: 10 }).notNull(),
      predictionValue: decimal6("prediction_value", { precision: 10, scale: 2 }).notNull(),
      confidenceScore: decimal6("confidence_score", { precision: 3, scale: 2 }).notNull(),
      modelVersion: varchar14("model_version", { length: 100 }),
      inputData: json6("input_data"),
      predictionDetails: json6("prediction_details"),
      recommendations: json6("recommendations"),
      isActive: boolean7("is_active").default(true),
      createdAt: timestamp13("created_at").defaultNow(),
      updatedAt: timestamp13("updated_at").defaultNow()
    });
    patternAnalysis = mysqlTable14("pattern_analysis", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      patternType: varchar14("pattern_type", { length: 50 }).notNull(),
      analysisPeriod: varchar14("analysis_period", { length: 20 }).notNull(),
      startDate: varchar14("start_date", { length: 10 }).notNull(),
      endDate: varchar14("end_date", { length: 10 }).notNull(),
      correlationScore: decimal6("correlation_score", { precision: 3, scale: 2 }).notNull(),
      significanceLevel: decimal6("significance_level", { precision: 3, scale: 2 }),
      patternStrength: varchar14("pattern_strength", { length: 20 }).default("moderate"),
      insights: json6("insights"),
      triggers: json6("triggers"),
      interventions: json6("interventions"),
      recommendations: json6("recommendations"),
      isValidated: boolean7("is_validated").default(false),
      validatedBy: varchar14("validated_by", { length: 100 }),
      validationNotes: text8("validation_notes"),
      createdAt: timestamp13("created_at").defaultNow(),
      updatedAt: timestamp13("updated_at").defaultNow()
    });
    healthReports = mysqlTable14("health_reports", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      reportType: varchar14("report_type", { length: 20 }).notNull(),
      reportPeriodStart: varchar14("report_period_start", { length: 10 }).notNull(),
      reportPeriodEnd: varchar14("report_period_end", { length: 10 }).notNull(),
      reportStatus: varchar14("report_status", { length: 20 }).default("draft"),
      reportData: json6("report_data").notNull(),
      summaryText: text8("summary_text"),
      keyFindings: json6("key_findings"),
      recommendations: json6("recommendations"),
      generatedAt: datetime4("generated_at").default(null),
      deliveredAt: datetime4("delivered_at").default(null),
      archivedAt: datetime4("archived_at").default(null),
      metadata: json6("metadata"),
      createdAt: timestamp13("created_at").defaultNow(),
      updatedAt: timestamp13("updated_at").defaultNow()
    });
    realTimeMonitoring = mysqlTable14("real_time_monitoring", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      metricType: varchar14("metric_type", { length: 50 }).notNull(),
      metricValue: decimal6("metric_value", { precision: 10, scale: 2 }).notNull(),
      unit: varchar14("unit", { length: 20 }).notNull(),
      timestamp: timestamp13("timestamp").defaultNow(),
      isAlert: boolean7("is_alert").default(false),
      alertLevel: varchar14("alert_level", { length: 20 }).default("low"),
      alertMessage: text8("alert_message"),
      actionTaken: varchar14("action_taken", { length: 100 }),
      metadata: json6("metadata"),
      createdAt: timestamp13("created_at").defaultNow()
    });
    healthcareIntegration = mysqlTable14("healthcare_integration", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      professionalId: varchar14("professional_id", { length: 100 }).notNull(),
      professionalType: varchar14("professional_type", { length: 50 }).notNull(),
      professionalName: varchar14("professional_name", { length: 100 }).notNull(),
      practiceName: varchar14("practice_name", { length: 100 }),
      accessLevel: varchar14("access_level", { length: 20 }).default("read_only"),
      dataSharingConsent: boolean7("data_sharing_consent").default(false),
      consentDate: varchar14("consent_date", { length: 10 }),
      dataExpirationDate: varchar14("data_expiration_date", { length: 10 }),
      sharedData: json6("shared_data"),
      notes: text8("notes"),
      isActive: boolean7("is_active").default(true),
      createdAt: timestamp13("created_at").defaultNow(),
      updatedAt: timestamp13("updated_at").defaultNow()
    });
    healthGoals = mysqlTable14("health_goals", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      goalType: varchar14("goal_type", { length: 50 }).notNull(),
      goalTitle: varchar14("goal_title", { length: 100 }).notNull(),
      goalDescription: text8("goal_description"),
      targetValue: decimal6("target_value", { precision: 10, scale: 2 }).notNull(),
      currentValue: decimal6("current_value", { precision: 10, scale: 2 }).default("0.00"),
      unit: varchar14("unit", { length: 20 }).notNull(),
      startDate: varchar14("start_date", { length: 10 }).notNull(),
      targetDate: varchar14("target_date", { length: 10 }).notNull(),
      deadlineDate: varchar14("deadline_date", { length: 10 }),
      status: varchar14("status", { length: 20 }).default("active"),
      priority: varchar14("priority", { length: 20 }).default("medium"),
      progressPercentage: decimal6("progress_percentage", { precision: 5, scale: 2 }).default("0.00"),
      achievementProbability: decimal6("achievement_probability", { precision: 5, scale: 2 }).default("0.00"),
      milestones: json6("milestones"),
      achievements: json6("achievements"),
      obstacles: json6("obstacles"),
      strategies: json6("strategies"),
      createdAt: timestamp13("created_at").defaultNow(),
      updatedAt: timestamp13("updated_at").defaultNow(),
      completedAt: datetime4("completed_at").default(null)
    });
    healthInsights = mysqlTable14("health_insights", {
      id: int14("id").primaryKey().autoincrement(),
      userId: int14("user_id").notNull(),
      insightType: varchar14("insight_type", { length: 50 }).notNull(),
      insightCategory: varchar14("insight_category", { length: 20 }).default("neutral"),
      insightTitle: varchar14("insight_title", { length: 100 }).notNull(),
      insightDescription: text8("insight_description").notNull(),
      insightData: json6("insight_data"),
      confidenceScore: decimal6("confidence_score", { precision: 3, scale: 2 }).notNull(),
      actionItems: json6("action_items"),
      relatedMetrics: json6("related_metrics"),
      isActioned: boolean7("is_actioned").default(false),
      actionedAt: datetime4("actioned_at").default(null),
      actionNotes: text8("action_notes"),
      createdAt: timestamp13("created_at").defaultNow(),
      expiresAt: datetime4("expires_at").default(null)
    });
    healthAnalyticsIndexes = {
      healthScores_userId: sql14`CREATE INDEX IF NOT EXISTS health_scores_user_id_idx ON health_scores(user_id)`,
      healthScores_scoreType: sql14`CREATE INDEX IF NOT EXISTS health_scores_score_type_idx ON health_scores(score_type)`,
      healthScores_calculationDate: sql14`CREATE INDEX IF NOT EXISTS health_scores_calculation_date_idx ON health_scores(calculation_date)`,
      healthScores_scoreValue: sql14`CREATE INDEX IF NOT EXISTS health_scores_score_value_idx ON health_scores(score_value)`,
      healthScores_userDate: sql14`CREATE INDEX IF NOT EXISTS health_scores_user_date_idx ON health_scores(user_id, calculation_date)`,
      healthPredictions_userId: sql14`CREATE INDEX IF NOT EXISTS health_predictions_user_id_idx ON health_predictions(user_id)`,
      healthPredictions_predictionType: sql14`CREATE INDEX IF NOT EXISTS health_predictions_prediction_type_idx ON health_predictions(prediction_type)`,
      healthPredictions_targetDate: sql14`CREATE INDEX IF NOT EXISTS health_predictions_target_date_idx ON health_predictions(target_date)`,
      healthPredictions_confidenceScore: sql14`CREATE INDEX IF NOT EXISTS health_predictions_confidence_score_idx ON health_predictions(confidence_score)`,
      healthPredictions_userDate: sql14`CREATE INDEX IF NOT EXISTS health_predictions_user_date_idx ON health_predictions(user_id, target_date)`,
      patternAnalysis_userId: sql14`CREATE INDEX IF NOT EXISTS pattern_analysis_user_id_idx ON pattern_analysis(user_id)`,
      patternAnalysis_patternType: sql14`CREATE INDEX IF NOT EXISTS pattern_analysis_pattern_type_idx ON pattern_analysis(pattern_type)`,
      patternAnalysis_analysisPeriod: sql14`CREATE INDEX IF NOT EXISTS pattern_analysis_analysis_period_idx ON pattern_analysis(analysis_period)`,
      patternAnalysis_correlationScore: sql14`CREATE INDEX IF NOT EXISTS pattern_analysis_correlation_score_idx ON pattern_analysis(correlation_score)`,
      patternAnalysis_userDate: sql14`CREATE INDEX IF NOT EXISTS pattern_analysis_user_date_idx ON pattern_analysis(user_id, start_date, end_date)`,
      healthReports_userId: sql14`CREATE INDEX IF NOT EXISTS health_reports_user_id_idx ON health_reports(user_id)`,
      healthReports_reportType: sql14`CREATE INDEX IF NOT EXISTS health_reports_report_type_idx ON health_reports(report_type)`,
      healthReports_reportPeriod: sql14`CREATE INDEX IF NOT EXISTS health_reports_report_period_idx ON health_reports(report_period_start, report_period_end)`,
      healthReports_reportStatus: sql14`CREATE INDEX IF NOT EXISTS health_reports_report_status_idx ON health_reports(report_status)`,
      healthReports_userPeriod: sql14`CREATE INDEX IF NOT EXISTS health_reports_user_period_idx ON health_reports(user_id, report_period_start, report_period_end)`,
      realTimeMonitoring_userId: sql14`CREATE INDEX IF NOT EXISTS real_time_monitoring_user_id_idx ON real_time_monitoring(user_id)`,
      realTimeMonitoring_metricType: sql14`CREATE INDEX IF NOT EXISTS real_time_monitoring_metric_type_idx ON real_time_monitoring(metric_type)`,
      realTimeMonitoring_timestamp: sql14`CREATE INDEX IF NOT EXISTS real_time_monitoring_timestamp_idx ON real_time_monitoring(timestamp)`,
      realTimeMonitoring_isAlert: sql14`CREATE INDEX IF NOT EXISTS real_time_monitoring_is_alert_idx ON real_time_monitoring(is_alert)`,
      realTimeMonitoring_alertLevel: sql14`CREATE INDEX IF NOT EXISTS real_time_monitoring_alert_level_idx ON real_time_monitoring(alert_level)`,
      realTimeMonitoring_userTime: sql14`CREATE INDEX IF NOT EXISTS real_time_monitoring_user_time_idx ON real_time_monitoring(user_id, timestamp)`,
      healthcareIntegration_userId: sql14`CREATE INDEX IF NOT EXISTS healthcare_integration_user_id_idx ON healthcare_integration(user_id)`,
      healthcareIntegration_professionalId: sql14`CREATE INDEX IF NOT EXISTS healthcare_integration_professional_id_idx ON healthcare_integration(professional_id)`,
      healthcareIntegration_professionalType: sql14`CREATE INDEX IF NOT EXISTS healthcare_integration_professional_type_idx ON healthcare_integration(professional_type)`,
      healthcareIntegration_accessLevel: sql14`CREATE INDEX IF NOT EXISTS healthcare_integration_access_level_idx ON healthcare_integration(access_level)`,
      healthcareIntegration_isActive: sql14`CREATE INDEX IF NOT EXISTS healthcare_integration_is_active_idx ON healthcare_integration(is_active)`,
      healthGoals_userId: sql14`CREATE INDEX IF NOT EXISTS health_goals_user_id_idx ON health_goals(user_id)`,
      healthGoals_goalType: sql14`CREATE INDEX IF NOT EXISTS health_goals_goal_type_idx ON health_goals(goal_type)`,
      healthGoals_status: sql14`CREATE INDEX IF NOT EXISTS health_goals_status_idx ON health_goals(status)`,
      healthGoals_priority: sql14`CREATE INDEX IF NOT EXISTS health_goals_priority_idx ON health_goals(priority)`,
      healthGoals_targetDate: sql14`CREATE INDEX IF NOT EXISTS health_goals_target_date_idx ON health_goals(target_date)`,
      healthGoals_progressPercentage: sql14`CREATE INDEX IF NOT EXISTS health_goals_progress_percentage_idx ON health_goals(progress_percentage)`,
      healthGoals_achievementProbability: sql14`CREATE INDEX IF NOT EXISTS health_goals_achievement_probability_idx ON health_goals(achievement_probability)`,
      healthGoals_userStatus: sql14`CREATE INDEX IF NOT EXISTS health_goals_user_status_idx ON health_goals(user_id, status)`,
      healthInsights_userId: sql14`CREATE INDEX IF NOT EXISTS health_insights_user_id_idx ON health_insights(user_id)`,
      healthInsights_insightType: sql14`CREATE INDEX IF NOT EXISTS health_insights_insight_type_idx ON health_insights(insight_type)`,
      healthInsights_insightCategory: sql14`CREATE INDEX IF NOT EXISTS health_insights_insight_category_idx ON health_insights(insight_category)`,
      healthInsights_confidenceScore: sql14`CREATE INDEX IF NOT EXISTS health_insights_confidence_score_idx ON health_insights(confidence_score)`,
      healthInsights_isActioned: sql14`CREATE INDEX IF NOT EXISTS health_insights_is_actioned_idx ON health_insights(is_actioned)`,
      healthInsights_createdAt: sql14`CREATE INDEX IF NOT EXISTS health_insights_created_at_idx ON health_insights(created_at)`,
      healthInsights_expiresAt: sql14`CREATE INDEX IF NOT EXISTS health_insights_expires_at_idx ON health_insights(expires_at)`,
      healthInsights_userCreated: sql14`CREATE INDEX IF NOT EXISTS health_insights_user_created_idx ON health_insights(user_id, created_at)`
    };
  }
});

// server/src/db/schemas/imageStorage.ts
import { sql as sql15 } from "drizzle-orm";
import { int as int15, bigint, varchar as varchar15, timestamp as timestamp14, datetime as datetime5, boolean as boolean8, decimal as decimal7, text as text9, mysqlTable as mysqlTable15 } from "drizzle-orm/mysql-core";
var imageMetadata, imageThumbnails, imageProcessingJobs, imageAlbums, imageAlbumItems, imageAnalytics, imageStorageQuotas, imageSharing, imageModeration, imageCache, imageStorageIndexes;
var init_imageStorage = __esm({
  "server/src/db/schemas/imageStorage.ts"() {
    "use strict";
    imageMetadata = mysqlTable15("image_metadata", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      userId: int15("user_id").notNull(),
      originalFilename: varchar15("original_filename", { length: 255 }).notNull(),
      storedFilename: varchar15("stored_filename", { length: 255 }).notNull(),
      filePath: varchar15("file_path", { length: 500 }).notNull(),
      fileSize: int15("file_size").notNull(),
      // in bytes
      mimeType: varchar15("mime_type", { length: 100 }).notNull(),
      width: int15("width"),
      height: int15("height"),
      fileSizeCompressed: int15("file_size_compressed"),
      // in bytes
      compressionRatio: decimal7("compression_ratio", { precision: 5, scale: 2 }),
      // percentage
      storageType: varchar15("storage_type", { length: 20 }).default("local"),
      // 'local', 's3'
      isPublic: boolean8("is_public").default(false),
      downloadCount: int15("download_count").default(0),
      lastAccessed: datetime5("last_accessed").default(null),
      expiresAt: datetime5("expires_at").default(null),
      metadata: text9("metadata"),
      // JSON string for additional metadata
      tags: text9("tags"),
      // comma-separated tags
      category: varchar15("category", { length: 50 }),
      // 'avatar', 'meal', 'profile', etc.
      isDeleted: boolean8("is_deleted").default(false),
      deletedAt: datetime5("deleted_at").default(null),
      createdAt: timestamp14("created_at").defaultNow(),
      updatedAt: timestamp14("updated_at").defaultNow()
    });
    imageThumbnails = mysqlTable15("image_thumbnails", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      size: varchar15("size", { length: 20 }).notNull(),
      // 'small', 'medium', 'large', 'thumbnail'
      width: int15("width").notNull(),
      height: int15("height").notNull(),
      fileSize: int15("file_size").notNull(),
      // in bytes
      filePath: varchar15("file_path", { length: 500 }).notNull(),
      mimeType: varchar15("mime_type", { length: 100 }).notNull(),
      storageType: varchar15("storage_type", { length: 20 }).default("local"),
      createdAt: timestamp14("created_at").defaultNow()
    });
    imageProcessingJobs = mysqlTable15("image_processing_jobs", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      jobType: varchar15("job_type", { length: 20 }).notNull(),
      // 'compress', 'resize', 'thumbnail', 'optimize'
      status: varchar15("status", { length: 20 }).default("pending"),
      // 'pending', 'processing', 'completed', 'failed'
      progress: int15("progress").default(0),
      // 0-100 percentage
      errorMessage: text9("error_message"),
      outputData: text9("output_data"),
      // JSON string for job output
      priority: int15("priority").default(5),
      // 1-10, higher is more important
      startedAt: datetime5("started_at").default(null),
      completedAt: datetime5("completed_at").default(null),
      createdAt: timestamp14("created_at").defaultNow()
    });
    imageAlbums = mysqlTable15("image_albums", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      userId: int15("user_id").notNull(),
      name: varchar15("name", { length: 100 }).notNull(),
      description: text9("description"),
      coverImageId: varchar15("cover_image_id", { length: 255 }).references(() => imageMetadata.id),
      isPublic: boolean8("is_public").default(false),
      isDeleted: boolean8("is_deleted").default(false),
      createdAt: timestamp14("created_at").defaultNow(),
      updatedAt: timestamp14("updated_at").defaultNow()
    });
    imageAlbumItems = mysqlTable15("image_album_items", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      albumId: varchar15("album_id", { length: 255 }).notNull().references(() => imageAlbums.id),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      order: int15("order").default(0),
      createdAt: timestamp14("created_at").defaultNow()
    });
    imageAnalytics = mysqlTable15("image_analytics", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      userId: int15("user_id").notNull(),
      action: varchar15("action", { length: 20 }).notNull(),
      // 'view', 'download', 'share', 'like'
      ipAddress: varchar15("ip_address", { length: 45 }),
      userAgent: text9("user_agent"),
      referrer: text9("referrer"),
      timestamp: timestamp14("timestamp").defaultNow()
    });
    imageStorageQuotas = mysqlTable15("image_storage_quotas", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      userId: int15("user_id").unique().notNull(),
      totalQuota: bigint("total_quota", { mode: "number" }).default(5 * 1024 * 1024 * 1024),
      // 5GB default
      usedQuota: int15("used_quota").default(0),
      imageCount: int15("image_count").default(0),
      lastUpdated: timestamp14("last_updated").defaultNow(),
      createdAt: timestamp14("created_at").defaultNow()
    });
    imageSharing = mysqlTable15("image_sharing", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      sharedBy: int15("shared_by").notNull(),
      sharedWith: int15("shared_with"),
      // null for public sharing
      accessType: varchar15("access_type", { length: 20 }).default("view"),
      // 'view', 'download', 'edit'
      expiresAt: datetime5("expires_at").default(null),
      isRevoked: boolean8("is_revoked").default(false),
      createdAt: timestamp14("created_at").defaultNow()
    });
    imageModeration = mysqlTable15("image_moderation", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      moderatedBy: int15("moderated_by"),
      status: varchar15("status", { length: 20 }).default("pending"),
      // 'pending', 'approved', 'rejected', 'flagged'
      reason: text9("reason"),
      confidenceScore: decimal7("confidence_score", { precision: 5, scale: 4 }),
      // 0-1
      moderationData: text9("moderation_data"),
      // JSON string for moderation results
      createdAt: timestamp14("created_at").defaultNow(),
      updatedAt: timestamp14("updated_at").defaultNow()
    });
    imageCache = mysqlTable15("image_cache", {
      id: varchar15("id", { length: 255 }).primaryKey(),
      cacheKey: varchar15("cache_key", { length: 255 }).unique(),
      imageId: varchar15("image_id", { length: 255 }).notNull().references(() => imageMetadata.id),
      size: varchar15("size", { length: 20 }).notNull(),
      // 'original', 'small', 'medium', 'large'
      data: text9("data").notNull(),
      // Base64 encoded image data
      mimeType: varchar15("mime_type", { length: 100 }).notNull(),
      expiresAt: timestamp14("expires_at").notNull(),
      hitCount: int15("hit_count").default(0),
      lastAccessed: datetime5("last_accessed").default(null),
      createdAt: timestamp14("created_at").defaultNow()
    });
    imageStorageIndexes = {
      imageMetadata_userId: sql15`CREATE INDEX IF NOT EXISTS image_metadata_user_id_idx ON image_metadata(user_id)`,
      imageMetadata_mimeType: sql15`CREATE INDEX IF NOT EXISTS image_metadata_mime_type_idx ON image_metadata(mime_type)`,
      imageMetadata_storageType: sql15`CREATE INDEX IF NOT EXISTS image_metadata_storage_type_idx ON image_metadata(storage_type)`,
      imageMetadata_category: sql15`CREATE INDEX IF NOT EXISTS image_metadata_category_idx ON image_metadata(category)`,
      imageMetadata_isDeleted: sql15`CREATE INDEX IF NOT EXISTS image_metadata_is_deleted_idx ON image_metadata(is_deleted)`,
      imageMetadata_expiresAt: sql15`CREATE INDEX IF NOT EXISTS image_metadata_expires_at_idx ON image_metadata(expires_at)`,
      imageThumbnails_imageId: sql15`CREATE INDEX IF NOT EXISTS image_thumbnails_image_id_idx ON image_thumbnails(image_id)`,
      imageThumbnails_size: sql15`CREATE INDEX IF NOT EXISTS image_thumbnails_size_idx ON image_thumbnails(size)`,
      imageProcessingJobs_imageId: sql15`CREATE INDEX IF NOT EXISTS image_processing_jobs_image_id_idx ON image_processing_jobs(image_id)`,
      imageProcessingJobs_status: sql15`CREATE INDEX IF NOT EXISTS image_processing_jobs_status_idx ON image_processing_jobs(status)`,
      imageProcessingJobs_priority: sql15`CREATE INDEX IF NOT EXISTS image_processing_jobs_priority_idx ON image_processing_jobs(priority)`,
      imageAlbums_userId: sql15`CREATE INDEX IF NOT EXISTS image_albums_user_id_idx ON image_albums(user_id)`,
      imageAlbums_isPublic: sql15`CREATE INDEX IF NOT EXISTS image_albums_is_public_idx ON image_albums(is_public)`,
      imageAlbumItems_albumId: sql15`CREATE INDEX IF NOT EXISTS image_album_items_album_id_idx ON image_album_items(album_id)`,
      imageAlbumItems_imageId: sql15`CREATE INDEX IF NOT EXISTS image_album_items_image_id_idx ON image_album_items(image_id)`,
      imageAnalytics_imageId: sql15`CREATE INDEX IF NOT EXISTS image_analytics_image_id_idx ON image_analytics(image_id)`,
      imageAnalytics_userId: sql15`CREATE INDEX IF NOT EXISTS image_analytics_user_id_idx ON image_analytics(user_id)`,
      imageAnalytics_action: sql15`CREATE INDEX IF NOT EXISTS image_analytics_action_idx ON image_analytics(action)`,
      imageAnalytics_timestamp: sql15`CREATE INDEX IF NOT EXISTS image_analytics_timestamp_idx ON image_analytics(timestamp)`,
      imageStorageQuotas_userId: sql15`CREATE INDEX IF NOT EXISTS image_storage_quotas_user_id_idx ON image_storage_quotas(user_id)`,
      imageSharing_imageId: sql15`CREATE INDEX IF NOT EXISTS image_sharing_image_id_idx ON image_sharing(image_id)`,
      imageSharing_sharedWith: sql15`CREATE INDEX IF NOT EXISTS image_sharing_shared_with_idx ON image_sharing(shared_with)`,
      imageSharing_accessType: sql15`CREATE INDEX IF NOT EXISTS image_sharing_access_type_idx ON image_sharing(access_type)`,
      imageModeration_imageId: sql15`CREATE INDEX IF NOT EXISTS image_moderation_image_id_idx ON image_moderation(image_id)`,
      imageModeration_status: sql15`CREATE INDEX IF NOT EXISTS image_moderation_status_idx ON image_moderation(status)`,
      imageCache_cacheKey: sql15`CREATE INDEX IF NOT EXISTS image_cache_cache_key_idx ON image_cache(cache_key)`,
      imageCache_expiresAt: sql15`CREATE INDEX IF NOT EXISTS image_cache_expires_at_idx ON image_cache(expires_at)`,
      imageCache_hitCount: sql15`CREATE INDEX IF NOT EXISTS image_cache_hit_count_idx ON image_cache(hit_count)`
    };
  }
});

// server/src/db/schemas/mealImages.ts
var mealImages_exports = {};
__export(mealImages_exports, {
  mealImageArchive: () => mealImageArchive,
  mealImages: () => mealImages,
  mealImagesIndexes: () => mealImagesIndexes
});
import { sql as sql16 } from "drizzle-orm";
import { int as int16, varchar as varchar16, timestamp as timestamp15, datetime as datetime6, mysqlTable as mysqlTable16 } from "drizzle-orm/mysql-core";
var mealImages, mealImageArchive, mealImagesIndexes;
var init_mealImages = __esm({
  "server/src/db/schemas/mealImages.ts"() {
    "use strict";
    mealImages = mysqlTable16("meal_images", {
      id: int16("id").primaryKey().autoincrement(),
      mealAnalysisId: int16("meal_analysis_id").notNull(),
      filePath: varchar16("file_path", { length: 500 }).notNull(),
      fileSize: int16("file_size").notNull(),
      mimeType: varchar16("mime_type", { length: 100 }).notNull(),
      width: int16("width"),
      height: int16("height"),
      imageHash: varchar16("image_hash", { length: 64 }).unique(),
      createdAt: timestamp15("created_at").defaultNow(),
      updatedAt: timestamp15("updated_at").defaultNow(),
      deletedAt: datetime6("deleted_at").default(null)
    });
    mealImageArchive = mysqlTable16("meal_image_archive", {
      id: int16("id").primaryKey().autoincrement(),
      mealAnalysisId: int16("meal_analysis_id").notNull(),
      filePath: varchar16("file_path", { length: 500 }).notNull(),
      fileSize: int16("file_size").notNull(),
      mimeType: varchar16("mime_type", { length: 100 }).notNull(),
      archivedAt: timestamp15("archived_at").defaultNow()
    });
    mealImagesIndexes = {
      mealImages_mealAnalysisId: sql16`CREATE INDEX IF NOT EXISTS meal_images_meal_analysis_id_idx ON meal_images(meal_analysis_id)`,
      mealImages_imageHash: sql16`CREATE INDEX IF NOT EXISTS meal_images_image_hash_idx ON meal_images(image_hash)`,
      mealImages_createdAt: sql16`CREATE INDEX IF NOT EXISTS meal_images_created_at_idx ON meal_images(created_at)`,
      mealImages_updatedAt: sql16`CREATE INDEX IF NOT EXISTS meal_images_updated_at_idx ON meal_images(updated_at)`,
      mealImages_deletedAt: sql16`CREATE INDEX IF NOT EXISTS meal_images_deleted_at_idx ON meal_images(deleted_at)`,
      mealImageArchive_mealAnalysisId: sql16`CREATE INDEX IF NOT EXISTS meal_image_archive_meal_analysis_id_idx ON meal_image_archive(meal_analysis_id)`,
      mealImageArchive_archivedAt: sql16`CREATE INDEX IF NOT EXISTS meal_image_archive_archived_at_idx ON meal_image_archive(archived_at)`
    };
  }
});

// server/src/db/schemas/notifications.ts
import { sql as sql17 } from "drizzle-orm";
import { int as int17, varchar as varchar17, timestamp as timestamp16, boolean as boolean10, json as json8, text as text10, datetime as datetime7, mysqlTable as mysqlTable17 } from "drizzle-orm/mysql-core";
var deviceTokens, pushNotifications, notificationSettings, notificationTemplates, notificationStats, notificationCampaigns, notificationLogs, notificationPreferences, notificationIndexes;
var init_notifications = __esm({
  "server/src/db/schemas/notifications.ts"() {
    "use strict";
    deviceTokens = mysqlTable17("device_tokens", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      userId: int17("user_id").notNull(),
      token: varchar17("token", { length: 500 }).notNull().unique(),
      platform: varchar17("platform", { length: 20 }).notNull(),
      // 'ios', 'android', 'web'
      isActive: boolean10("is_active").default(true),
      lastUsed: timestamp16("last_used").defaultNow(),
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    pushNotifications = mysqlTable17("push_notifications", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      userId: int17("user_id").notNull(),
      title: varchar17("title", { length: 255 }).notNull(),
      body: text10("body").notNull(),
      data: json8("data"),
      // JSON object for additional data
      type: varchar17("type", { length: 50 }).default("system"),
      // 'meal_reminder', 'goal_achievement', 'health_alert', 'system', 'marketing'
      priority: varchar17("priority", { length: 20 }).default("normal"),
      // 'high', 'normal', 'low'
      scheduledFor: datetime7("scheduled_for").default(null),
      sentAt: datetime7("sent_at").default(null),
      status: varchar17("status", { length: 20 }).default("pending"),
      // 'pending', 'sent', 'failed', 'cancelled'
      platform: varchar17("platform", { length: 20 }),
      // 'ios', 'android', 'web'
      retryCount: int17("retry_count").default(0),
      maxRetries: int17("max_retries").default(3),
      errorMessage: text10("error_message"),
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    notificationSettings = mysqlTable17("notification_settings", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      userId: int17("user_id").unique().notNull(),
      mealReminders: boolean10("meal_reminders").default(true),
      goalAchievements: boolean10("goal_achievements").default(true),
      healthAlerts: boolean10("health_alerts").default(true),
      systemNotifications: boolean10("system_notifications").default(true),
      marketingNotifications: boolean10("marketing_notifications").default(false),
      emailNotifications: boolean10("email_notifications").default(true),
      pushNotifications: boolean10("push_notifications").default(true),
      quietHoursStart: varchar17("quiet_hours_start", { length: 5 }),
      // HH:MM format
      quietHoursEnd: varchar17("quiet_hours_end", { length: 5 }),
      // HH:MM format
      frequency: varchar17("frequency", { length: 20 }).default("immediate"),
      // 'immediate', 'daily', 'weekly'
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    notificationTemplates = mysqlTable17("notification_templates", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      name: varchar17("name", { length: 100 }).unique().notNull(),
      title: varchar17("title", { length: 255 }).notNull(),
      body: text10("body").notNull(),
      data: json8("data"),
      // JSON object for template data
      type: varchar17("type", { length: 50 }).notNull(),
      // 'meal_reminder', 'goal_achievement', 'health_alert', 'system', 'marketing'
      isActive: boolean10("is_active").default(true),
      isDefault: boolean10("is_default").default(false),
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    notificationStats = mysqlTable17("notification_stats", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      userId: int17("user_id").notNull(),
      date: varchar17("date", { length: 10 }).notNull(),
      // YYYY-MM-DD format
      totalSent: int17("total_sent").default(0),
      totalDelivered: int17("total_delivered").default(0),
      totalOpened: int17("total_opened").default(0),
      totalClicked: int17("total_clicked").default(0),
      totalFailed: int17("total_failed").default(0),
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    notificationCampaigns = mysqlTable17("notification_campaigns", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      name: varchar17("name", { length: 100 }).notNull(),
      description: text10("description"),
      type: varchar17("type", { length: 20 }).notNull(),
      // 'broadcast', 'segment', 'triggered'
      targetAudience: json8("target_audience"),
      // JSON object for targeting criteria
      templateId: varchar17("template_id", { length: 255 }).references(() => notificationTemplates.id),
      scheduledFor: datetime7("scheduled_for").default(null),
      status: varchar17("status", { length: 20 }).default("draft"),
      // 'draft', 'scheduled', 'running', 'completed', 'cancelled'
      totalSent: int17("total_sent").default(0),
      totalDelivered: int17("total_delivered").default(0),
      totalOpened: int17("total_opened").default(0),
      totalClicked: int17("total_clicked").default(0),
      totalFailed: int17("total_failed").default(0),
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    notificationLogs = mysqlTable17("notification_logs", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      notificationId: varchar17("notification_id", { length: 255 }).notNull().references(() => pushNotifications.id),
      userId: int17("user_id").notNull(),
      deviceTokenId: varchar17("device_token_id", { length: 255 }).references(() => deviceTokens.id),
      platform: varchar17("platform", { length: 20 }).notNull(),
      status: varchar17("status", { length: 20 }).notNull(),
      // 'pending', 'sent', 'delivered', 'opened', 'clicked', 'failed'
      response: json8("response"),
      // JSON object for provider response
      errorMessage: text10("error_message"),
      retryCount: int17("retry_count").default(0),
      createdAt: timestamp16("created_at").defaultNow()
    });
    notificationPreferences = mysqlTable17("notification_preferences", {
      id: varchar17("id", { length: 255 }).primaryKey(),
      userId: int17("user_id").unique().notNull(),
      categories: json8("categories"),
      // JSON object with category preferences
      channels: json8("channels"),
      // JSON object with channel preferences
      frequency: json8("frequency"),
      // JSON object with frequency settings
      quietHours: json8("quiet_hours"),
      // JSON object with quiet hours settings
      createdAt: timestamp16("created_at").defaultNow(),
      updatedAt: timestamp16("updated_at").defaultNow()
    });
    notificationIndexes = {
      deviceTokens_userId: sql17`CREATE INDEX IF NOT EXISTS device_tokens_user_id_idx ON device_tokens(user_id)`,
      deviceTokens_token: sql17`CREATE INDEX IF NOT EXISTS device_tokens_token_idx ON device_tokens(token)`,
      deviceTokens_platform: sql17`CREATE INDEX IF NOT EXISTS device_tokens_platform_idx ON device_tokens(platform)`,
      deviceTokens_isActive: sql17`CREATE INDEX IF NOT EXISTS device_tokens_is_active_idx ON device_tokens(is_active)`,
      pushNotifications_userId: sql17`CREATE INDEX IF NOT EXISTS push_notifications_user_id_idx ON push_notifications(user_id)`,
      pushNotifications_status: sql17`CREATE INDEX IF NOT EXISTS push_notifications_status_idx ON push_notifications(status)`,
      pushNotifications_type: sql17`CREATE INDEX IF NOT EXISTS push_notifications_type_idx ON push_notifications(type)`,
      pushNotifications_scheduledFor: sql17`CREATE INDEX IF NOT EXISTS push_notifications_scheduled_for_idx ON push_notifications(scheduled_for)`,
      pushNotifications_platform: sql17`CREATE INDEX IF NOT EXISTS push_notifications_platform_idx ON push_notifications(platform)`,
      notificationSettings_userId: sql17`CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id)`,
      notificationTemplates_type: sql17`CREATE INDEX IF NOT EXISTS notification_templates_type_idx ON notification_templates(type)`,
      notificationTemplates_isActive: sql17`CREATE INDEX IF NOT EXISTS notification_templates_is_active_idx ON notification_templates(is_active)`,
      notificationStats_userId: sql17`CREATE INDEX IF NOT EXISTS notification_stats_user_id_idx ON notification_stats(user_id)`,
      notificationStats_date: sql17`CREATE INDEX IF NOT EXISTS notification_stats_date_idx ON notification_stats(date)`,
      notificationCampaigns_type: sql17`CREATE INDEX IF NOT EXISTS notification_campaigns_type_idx ON notification_campaigns(type)`,
      notificationCampaigns_status: sql17`CREATE INDEX IF NOT EXISTS notification_campaigns_status_idx ON notification_campaigns(status)`,
      notificationLogs_notificationId: sql17`CREATE INDEX IF NOT EXISTS notification_logs_notification_id_idx ON notification_logs(notification_id)`,
      notificationLogs_userId: sql17`CREATE INDEX IF NOT EXISTS notification_logs_user_id_idx ON notification_logs(user_id)`,
      notificationLogs_deviceTokenId: sql17`CREATE INDEX IF NOT EXISTS notification_logs_device_token_id_idx ON notification_logs(device_token_id)`,
      notificationLogs_status: sql17`CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON notification_logs(status)`,
      notificationPreferences_userId: sql17`CREATE INDEX IF NOT EXISTS notification_preferences_user_id_idx ON notification_preferences(user_id)`
    };
  }
});

// server/src/db/schemas/payment.ts
import { sql as sql18 } from "drizzle-orm";
import { int as int18, varchar as varchar18, timestamp as timestamp17, boolean as boolean11, decimal as decimal8, text as text11, datetime as datetime8, mysqlTable as mysqlTable18 } from "drizzle-orm/mysql-core";
var paymentIntents, paymentMethods, subscriptions, transactions, customers, refunds, subscriptionItems, invoices, paymentWebhooks, paymentIndexes;
var init_payment = __esm({
  "server/src/db/schemas/payment.ts"() {
    "use strict";
    paymentIntents = mysqlTable18("payment_intents", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      amount: decimal8("amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar18("currency", { length: 3 }).default("usd"),
      status: varchar18("status", { length: 50 }).default("requires_payment_method"),
      clientSecret: varchar18("client_secret", { length: 255 }).notNull(),
      paymentMethodId: varchar18("payment_method_id", { length: 255 }),
      userId: int18("user_id").notNull(),
      metadata: text11("metadata"),
      // JSON string for additional data
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    paymentMethods = mysqlTable18("payment_methods", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      userId: int18("user_id").notNull(),
      type: varchar18("type", { length: 50 }).notNull(),
      // 'card', 'paypal', 'apple_pay', 'google_pay'
      last4: varchar18("last4", { length: 4 }),
      brand: varchar18("brand", { length: 50 }),
      // 'visa', 'mastercard', 'amex', etc.
      expMonth: int18("exp_month"),
      expYear: int18("exp_year"),
      isDefault: boolean11("is_default").default(false),
      providerId: varchar18("provider_id", { length: 255 }),
      // External provider's payment method ID
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    subscriptions = mysqlTable18("subscriptions", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      userId: int18("user_id").notNull(),
      planId: varchar18("plan_id", { length: 50 }).notNull(),
      // 'free', 'premium', 'professional'
      status: varchar18("status", { length: 50 }).default("incomplete"),
      // 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
      currentPeriodStart: timestamp17("current_period_start").notNull().defaultNow(),
      currentPeriodEnd: timestamp17("current_period_end").notNull().defaultNow(),
      trialEnd: datetime8("trial_end").default(null),
      canceledAt: datetime8("canceled_at").default(null),
      cancelAtPeriodEnd: boolean11("cancel_at_period_end").default(false),
      paymentMethodId: varchar18("payment_method_id", { length: 255 }),
      stripeCustomerId: varchar18("stripe_customer_id", { length: 255 }),
      stripeSubscriptionId: varchar18("stripe_subscription_id", { length: 255 }),
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    transactions = mysqlTable18("transactions", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      userId: int18("user_id").notNull(),
      amount: decimal8("amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar18("currency", { length: 3 }).default("usd"),
      status: varchar18("status", { length: 50 }).notNull(),
      // 'succeeded', 'failed', 'pending', 'refunded'
      paymentIntentId: varchar18("payment_intent_id", { length: 255 }).notNull(),
      subscriptionId: varchar18("subscription_id", { length: 255 }),
      description: varchar18("description", { length: 500 }).notNull(),
      metadata: text11("metadata"),
      // JSON string for additional data
      stripeChargeId: varchar18("stripe_charge_id", { length: 255 }),
      refundedAt: datetime8("refunded_at").default(null),
      refundId: varchar18("refund_id", { length: 255 }),
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    customers = mysqlTable18("customers", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      userId: int18("user_id").unique().notNull(),
      stripeCustomerId: varchar18("stripe_customer_id", { length: 255 }).unique(),
      email: varchar18("email", { length: 255 }),
      name: varchar18("name", { length: 255 }),
      phone: varchar18("phone", { length: 50 }),
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    refunds = mysqlTable18("refunds", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      transactionId: varchar18("transaction_id", { length: 255 }).notNull(),
      amount: decimal8("amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar18("currency", { length: 3 }).default("usd"),
      status: varchar18("status", { length: 50 }).default("pending"),
      // 'pending', 'succeeded', 'failed', 'canceled'
      reason: varchar18("reason", { length: 100 }),
      // 'duplicate', 'fraudulent', 'requested_by_customer', etc.
      description: text11("description"),
      stripeRefundId: varchar18("stripe_refund_id", { length: 255 }),
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    subscriptionItems = mysqlTable18("subscription_items", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      subscriptionId: varchar18("subscription_id", { length: 255 }).notNull().references(() => subscriptions.id),
      priceId: varchar18("price_id", { length: 255 }).notNull(),
      // Stripe price ID
      quantity: int18("quantity").default(1),
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    invoices = mysqlTable18("invoices", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      userId: int18("user_id").notNull(),
      subscriptionId: varchar18("subscription_id", { length: 255 }),
      amount: decimal8("amount", { precision: 10, scale: 2 }).notNull(),
      currency: varchar18("currency", { length: 3 }).default("usd"),
      status: varchar18("status", { length: 50 }).default("open"),
      // 'open', 'paid', 'void', 'uncollectible'
      hostedInvoiceUrl: varchar18("hosted_invoice_url", { length: 500 }),
      invoicePdf: varchar18("invoice_pdf", { length: 500 }),
      dueDate: datetime8("due_date").default(null),
      paidAt: datetime8("paid_at").default(null),
      stripeInvoiceId: varchar18("stripe_invoice_id", { length: 255 }),
      createdAt: timestamp17("created_at").defaultNow(),
      updatedAt: timestamp17("updated_at").defaultNow()
    });
    paymentWebhooks = mysqlTable18("payment_webhooks", {
      id: varchar18("id", { length: 255 }).primaryKey(),
      eventType: varchar18("event_type", { length: 100 }).notNull(),
      eventData: text11("event_data").notNull(),
      // JSON string of the webhook payload
      processed: boolean11("processed").default(false),
      processedAt: datetime8("processed_at").default(null),
      errorMessage: text11("error_message"),
      createdAt: timestamp17("created_at").defaultNow()
    });
    paymentIndexes = {
      paymentIntents_userId: sql18`CREATE INDEX IF NOT EXISTS payment_intents_user_id_idx ON payment_intents(user_id)`,
      paymentIntents_status: sql18`CREATE INDEX IF NOT EXISTS payment_intents_status_idx ON payment_intents(status)`,
      paymentMethods_userId: sql18`CREATE INDEX IF NOT EXISTS payment_methods_user_id_idx ON payment_methods(user_id)`,
      paymentMethods_isDefault: sql18`CREATE INDEX IF NOT EXISTS payment_methods_is_default_idx ON payment_methods(is_default)`,
      subscriptions_userId: sql18`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id)`,
      subscriptions_status: sql18`CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status)`,
      subscriptions_planId: sql18`CREATE INDEX IF NOT EXISTS subscriptions_plan_id_idx ON subscriptions(plan_id)`,
      transactions_userId: sql18`CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions(user_id)`,
      transactions_status: sql18`CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status)`,
      transactions_paymentIntentId: sql18`CREATE INDEX IF NOT EXISTS transactions_payment_intent_id_idx ON transactions(payment_intent_id)`,
      customers_userId: sql18`CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers(user_id)`,
      customers_stripeCustomerId: sql18`CREATE INDEX IF NOT EXISTS customers_stripe_customer_id_idx ON customers(stripe_customer_id)`,
      refunds_transactionId: sql18`CREATE INDEX IF NOT EXISTS refunds_transaction_id_idx ON refunds(transaction_id)`,
      subscriptionItems_subscriptionId: sql18`CREATE INDEX IF NOT EXISTS subscription_items_subscription_id_idx ON subscription_items(subscription_id)`,
      invoices_userId: sql18`CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id)`,
      invoices_subscriptionId: sql18`CREATE INDEX IF NOT EXISTS invoices_subscription_id_idx ON invoices(subscription_id)`,
      invoices_status: sql18`CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status)`,
      paymentWebhooks_eventType: sql18`CREATE INDEX IF NOT EXISTS payment_webhooks_event_type_idx ON payment_webhooks(event_type)`,
      paymentWebhooks_processed: sql18`CREATE INDEX IF NOT EXISTS payment_webhooks_processed_idx ON payment_webhooks(processed)`
    };
  }
});

// server/src/db/schemas/wearableData.ts
import { sql as sql19 } from "drizzle-orm";
import { int as int19, varchar as varchar19, timestamp as timestamp18, decimal as decimal9, json as json9, datetime as datetime9, mysqlTable as mysqlTable19 } from "drizzle-orm/mysql-core";
var wearableData, wearableDataIndexes;
var init_wearableData = __esm({
  "server/src/db/schemas/wearableData.ts"() {
    "use strict";
    wearableData = mysqlTable19("wearable_data", {
      id: int19("id").primaryKey().autoincrement(),
      userId: int19("user_id").notNull(),
      deviceType: varchar19("device_type", { length: 50 }).notNull(),
      device_id: varchar19("device_id", { length: 100 }),
      metricType: varchar19("metric_type", { length: 50 }).notNull(),
      value: decimal9("value", { precision: 10, scale: 2 }).notNull(),
      unit: varchar19("unit", { length: 20 }).notNull(),
      timestamp: timestamp18("timestamp").defaultNow(),
      source: varchar19("source", { length: 20 }).default("automatic"),
      confidenceScore: decimal9("confidence_score", { precision: 5, scale: 4 }),
      metadata: json9("metadata"),
      syncedAt: datetime9("synced_at").default(null),
      createdAt: timestamp18("created_at").defaultNow(),
      updatedAt: timestamp18("updated_at").defaultNow(),
      deletedAt: datetime9("deleted_at").default(null)
    });
    wearableDataIndexes = {
      wearableData_userId: sql19`CREATE INDEX IF NOT EXISTS wearable_data_user_id_idx ON wearable_data(user_id)`,
      wearableData_deviceType: sql19`CREATE INDEX IF NOT EXISTS wearable_data_device_type_idx ON wearable_data(device_type)`,
      wearableData_metricType: sql19`CREATE INDEX IF NOT EXISTS wearable_data_metric_type_idx ON wearable_data(metric_type)`,
      wearableData_timestamp: sql19`CREATE INDEX IF NOT EXISTS wearable_data_timestamp_idx ON wearable_data(timestamp)`,
      wearableData_source: sql19`CREATE INDEX IF NOT EXISTS wearable_data_source_idx ON wearable_data(source)`,
      wearableData_syncedAt: sql19`CREATE INDEX IF NOT EXISTS wearable_data_synced_at_idx ON wearable_data(synced_at)`
    };
  }
});

// server/src/db/schemas/workouts.ts
import { sql as sql20 } from "drizzle-orm";
import { int as int20, varchar as varchar20, timestamp as timestamp19, text as text12, mysqlTable as mysqlTable20 } from "drizzle-orm/mysql-core";
var workouts, workoutsIndexes;
var init_workouts = __esm({
  "server/src/db/schemas/workouts.ts"() {
    "use strict";
    workouts = mysqlTable20("workouts", {
      id: int20("id").primaryKey().autoincrement(),
      userId: int20("user_id").notNull(),
      name: varchar20("name", { length: 255 }).notNull(),
      duration: int20("duration").notNull(),
      caloriesBurned: int20("calories_burned").notNull(),
      date: timestamp19("date").defaultNow(),
      notes: text12("notes"),
      createdAt: timestamp19("created_at").defaultNow(),
      updatedAt: timestamp19("updated_at").defaultNow()
    });
    workoutsIndexes = {
      workouts_userId: sql20`CREATE INDEX IF NOT EXISTS workouts_user_id_idx ON workouts(user_id)`,
      workouts_date: sql20`CREATE INDEX IF NOT EXISTS workouts_date_idx ON workouts(date)`,
      workouts_duration: sql20`CREATE INDEX IF NOT EXISTS workouts_duration_idx ON workouts(duration)`,
      workouts_caloriesBurned: sql20`CREATE INDEX IF NOT EXISTS workouts_calories_burned_idx ON workouts(calories_burned)`
    };
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiConfig: () => aiConfig,
  aiConfigIndexes: () => aiConfigIndexes,
  appConfig: () => appConfig,
  appConfigIndexes: () => appConfigIndexes,
  customers: () => customers,
  deviceTokens: () => deviceTokens,
  favoriteMeals: () => favoriteMeals,
  favoriteMealsIndexes: () => favoriteMealsIndexes,
  healthAnalyticsIndexes: () => healthAnalyticsIndexes,
  healthGoals: () => healthGoals,
  healthInsights: () => healthInsights,
  healthPredictions: () => healthPredictions,
  healthReports: () => healthReports,
  healthScores: () => healthScores,
  healthcareIntegration: () => healthcareIntegration,
  imageAlbumItems: () => imageAlbumItems,
  imageAlbums: () => imageAlbums,
  imageAnalytics: () => imageAnalytics,
  imageCache: () => imageCache,
  imageMetadata: () => imageMetadata,
  imageModeration: () => imageModeration,
  imageProcessingJobs: () => imageProcessingJobs,
  imageSharing: () => imageSharing,
  imageStorageIndexes: () => imageStorageIndexes,
  imageStorageQuotas: () => imageStorageQuotas,
  imageThumbnails: () => imageThumbnails,
  importedRecipes: () => importedRecipes,
  importedRecipesIndexes: () => importedRecipesIndexes,
  insertAppConfigSchema: () => insertAppConfigSchema,
  insertLanguageSchema: () => insertLanguageSchema,
  insertMealAnalysisSchema: () => insertMealAnalysisSchema,
  insertPlannedMealSchema: () => insertPlannedMealSchema,
  insertTranslationSchema: () => insertTranslationSchema,
  insertUserSchema: () => insertUserSchema,
  invoices: () => invoices,
  languages: () => languages,
  languagesIndexes: () => languagesIndexes,
  mealAnalyses: () => mealAnalyses,
  mealAnalysesIndexes: () => mealAnalysesIndexes,
  mealImageArchive: () => mealImageArchive,
  mealImages: () => mealImages,
  mealImagesIndexes: () => mealImagesIndexes,
  notificationCampaigns: () => notificationCampaigns,
  notificationIndexes: () => notificationIndexes,
  notificationLogs: () => notificationLogs,
  notificationPreferences: () => notificationPreferences,
  notificationSettings: () => notificationSettings,
  notificationStats: () => notificationStats,
  notificationTemplates: () => notificationTemplates,
  nutritionGoals: () => nutritionGoals,
  nutritionGoalsIndexes: () => nutritionGoalsIndexes,
  patternAnalysis: () => patternAnalysis,
  paymentIndexes: () => paymentIndexes,
  paymentIntents: () => paymentIntents,
  paymentMethods: () => paymentMethods,
  paymentWebhooks: () => paymentWebhooks,
  plannedMeals: () => plannedMeals,
  plannedMealsIndexes: () => plannedMealsIndexes,
  pushNotifications: () => pushNotifications,
  realTimeMonitoring: () => realTimeMonitoring,
  referralCommissions: () => referralCommissions,
  referralCommissionsIndexes: () => referralCommissionsIndexes,
  referralSettings: () => referralSettings,
  referralSettingsIndexes: () => referralSettingsIndexes,
  refunds: () => refunds,
  registerSchema: () => registerSchema,
  siteContent: () => siteContent,
  siteContentIndexes: () => siteContentIndexes,
  subscriptionItems: () => subscriptionItems,
  subscriptions: () => subscriptions,
  transactions: () => transactions,
  translations: () => translations,
  translationsIndexes: () => translationsIndexes,
  userPreferences: () => userPreferences,
  users: () => users,
  usersIndexes: () => usersIndexes,
  wearableData: () => wearableData,
  wearableDataIndexes: () => wearableDataIndexes,
  weeklyStats: () => weeklyStats,
  weeklyStatsIndexes: () => weeklyStatsIndexes,
  workouts: () => workouts,
  workoutsIndexes: () => workoutsIndexes
});
import { z as z4 } from "zod";
var registerSchema, insertUserSchema, insertMealAnalysisSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    init_users();
    init_mealAnalyses();
    init_weeklyStats();
    init_siteContent();
    init_nutritionGoals();
    init_aiConfig();
    init_appConfig();
    init_languages();
    init_plannedMeals();
    init_favoriteMeals();
    init_importedRecipes();
    init_referralSettings();
    init_referralCommissions();
    init_healthAnalytics();
    init_imageStorage();
    init_mealImages();
    init_notifications();
    init_payment();
    init_wearableData();
    init_workouts();
    registerSchema = z4.object({
      username: z4.string().min(3, "Username must be at least 3 characters"),
      email: z4.string().email("Invalid email address"),
      password: z4.string().min(6, "Password must be at least 6 characters"),
      confirmPassword: z4.string().min(6, "Password must be at least 6 characters"),
      firstName: z4.string().min(1, "First name is required"),
      lastName: z4.string().min(1, "Last name is required")
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"]
    });
    insertUserSchema = z4.object({
      username: z4.string().min(3, "Username must be at least 3 characters"),
      email: z4.string().email("Invalid email address"),
      password: z4.string().min(6, "Password must be at least 6 characters"),
      firstName: z4.string().min(1, "First name is required"),
      lastName: z4.string().min(1, "Last name is required")
    });
    insertMealAnalysisSchema = z4.object({
      userId: z4.number(),
      foodName: z4.string().min(1, "Food name is required"),
      estimatedCalories: z4.number().min(0, "Calories must be positive"),
      estimatedProtein: z4.string().min(0, "Protein must be positive"),
      estimatedCarbs: z4.string().min(0, "Carbs must be positive"),
      estimatedFat: z4.string().min(0, "Fat must be positive"),
      fiber: z4.number().min(0, "Fiber must be positive").optional(),
      imageData: z4.string().optional(),
      metadata: z4.string().optional()
    });
  }
});

// server/config.ts
import dotenv from "dotenv";
var PORT, NODE_ENV, HIPAA_COMPLIANCE_ENABLED, ENCRYPTION_KEY, SESSION_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, GEMINI_API_KEY, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME;
var init_config = __esm({
  "server/config.ts"() {
    "use strict";
    dotenv.config();
    PORT = process.env.PORT ? parseInt(process.env.PORT) : 3002;
    NODE_ENV = process.env.NODE_ENV || "development";
    HIPAA_COMPLIANCE_ENABLED = process.env.HIPAA_COMPLIANCE_ENABLED === "true";
    if (NODE_ENV === "production" && (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY === "default-encryption-key-change-in-production")) {
      throw new Error("ENCRYPTION_KEY must be set in production environment");
    }
    ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-encryption-key-change-in-production";
    if (NODE_ENV === "production" && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === "default-session-secret-change-in-production")) {
      throw new Error("SESSION_SECRET must be set in production environment");
    }
    SESSION_SECRET = process.env.SESSION_SECRET || "default-session-secret-change-in-production";
    STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_your_stripe_secret_key";
    STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "whsec_your_stripe_webhook_secret";
    GEMINI_API_KEY = process.env.GEMINI_API_KEY || "your-gemini-api-key";
    DB_HOST = process.env.DB_HOST || "localhost";
    DB_PORT = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306;
    DB_USER = process.env.DB_USER || "root";
    DB_PASSWORD = process.env.DB_PASSWORD || "";
    DB_NAME = process.env.DB_NAME || "calorie_tracker";
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  pool: () => pool,
  schema: () => schema
});
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
var schema, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_config();
    schema = schema_exports;
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    db = drizzle(pool, { schema, mode: "default" });
  }
});

// server/security.ts
import crypto from "crypto";
function encryptPHI(text15) {
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text15, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return iv.toString("hex") + ":" + encrypted.toString("hex") + ":" + authTag.toString("hex");
}
function decryptPHI(text15) {
  const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
  const [ivHex, encryptedHex, authTagHex] = text15.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
var init_security = __esm({
  "server/security.ts"() {
    "use strict";
    init_config();
  }
});

// server/database-storage.ts
import { eq } from "drizzle-orm";
import session2 from "express-session";
import MySQLStoreImport from "express-mysql-session";
import dotenv2 from "dotenv";
var DatabaseStorage;
var init_database_storage = __esm({
  "server/database-storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    init_security();
    init_config();
    dotenv2.config();
    DatabaseStorage = class {
      sessionStore;
      db;
      constructor() {
        console.log("=== [DATABASE STORAGE] INITIALIZING ===");
        console.log("[DATABASE STORAGE] DB_HOST:", process.env.DB_HOST || "localhost");
        console.log("[DATABASE STORAGE] DB_USER:", process.env.DB_USER || "root");
        console.log("[DATABASE STORAGE] DB_NAME:", process.env.DB_NAME || "calorie_tracker");
        console.log("[DATABASE STORAGE] DB_PORT:", process.env.DB_PORT || "3306");
        this.db = db;
        this.testConnection().catch((err) => {
          console.error("[DATABASE STORAGE] Connection test failed:", err);
        });
        const options = {
          host: process.env.DB_HOST || "localhost",
          port: parseInt(process.env.DB_PORT || "3306"),
          user: process.env.DB_USER || "root",
          password: process.env.DB_PASSWORD || "",
          database: process.env.DB_NAME || "calorie_tracker"
        };
        console.log("[DATABASE STORAGE] Session store options:", { host: options.host, database: options.database });
        const MySQLStore = MySQLStoreImport.default ? MySQLStoreImport.default : MySQLStoreImport;
        const MySQLStoreConstructor = MySQLStore(session2);
        this.sessionStore = new MySQLStoreConstructor(options);
        console.log("=== [DATABASE STORAGE] INITIALIZATION COMPLETE ===");
      }
      async testConnection() {
        try {
          console.log("[DATABASE STORAGE] Testing connection...");
          const [result] = await db.select().from(users).limit(1);
          console.log("[DATABASE STORAGE] Connection test successful");
        } catch (error) {
          console.error("[DATABASE STORAGE] Connection test failed:", error);
          throw error;
        }
      }
      // User methods
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        if (!user) return void 0;
        return {
          ...user,
          nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
        };
      }
      async getUserByUsername(username) {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        if (!user) return void 0;
        return {
          ...user,
          nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
        };
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        if (!user) return void 0;
        return {
          ...user,
          nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
        };
      }
      async createUser(insertUser) {
        console.log("=== [DATABASE STORAGE] CREATE USER ===");
        console.log("[DATABASE STORAGE] Input data:", {
          username: insertUser.username,
          email: insertUser.email,
          firstName: insertUser.firstName,
          lastName: insertUser.lastName,
          password: "***"
        });
        try {
          const userData = {
            ...insertUser,
            email: insertUser.email || null,
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionType: null,
            subscriptionStatus: null,
            subscriptionEndDate: null,
            isPremium: false,
            nutritionGoals: null
            // Ensure JSON column is set to null if not provided
          };
          console.log("[DATABASE STORAGE] Inserting user with data:", userData);
          const result = await db.insert(users).values(userData);
          console.log("[DATABASE STORAGE] Insert result:", result);
          const insertId = result.insertId || result[0]?.insertId;
          console.log("[DATABASE STORAGE] Insert ID:", insertId);
          if (!insertId) {
            console.error("[DATABASE STORAGE] Failed to get inserted user id");
            throw new Error("Failed to get inserted user id");
          }
          console.log("[DATABASE STORAGE] Fetching created user...");
          const [user] = await db.select().from(users).where(eq(users.id, insertId));
          if (!user) {
            console.error("[DATABASE STORAGE] Failed to fetch inserted user");
            throw new Error("Failed to fetch inserted user");
          }
          console.log("[DATABASE STORAGE] User created successfully:", { id: user.id, username: user.username });
          return {
            ...user,
            nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
          };
        } catch (error) {
          console.error("[DATABASE STORAGE] Error creating user:", error);
          console.error("[DATABASE STORAGE] Error details:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : void 0
          });
          throw error;
        }
      }
      async updateUserStripeInfo(userId, stripeInfo) {
        await db.update(users).set(stripeInfo).where(eq(users.id, userId));
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        return {
          ...user,
          nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
        };
      }
      async getUserById(userId) {
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) return void 0;
        return {
          ...user,
          nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
        };
      }
      async updateUserNutritionGoals(userId, goals) {
        await db.update(users).set({ nutritionGoals: goals }).where(eq(users.id, userId));
      }
      async getNutritionGoals(userId) {
        const [user] = await db.select({ nutritionGoals: users.nutritionGoals }).from(users).where(eq(users.id, userId));
        if (!user?.nutritionGoals) return null;
        return typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals;
      }
      // Meal analysis methods
      async getMealAnalyses(userId) {
        const analyses = await db.select().from(mealAnalyses).where(eq(mealAnalyses.userId, userId)).orderBy(mealAnalyses.analysisTimestamp);
        if (HIPAA_COMPLIANCE_ENABLED) {
          return analyses.map((analysis) => ({
            ...analysis,
            foodName: analysis.foodName ? decryptPHI(analysis.foodName) : analysis.foodName,
            imageUrl: analysis.imageUrl ? decryptPHI(analysis.imageUrl) : analysis.imageUrl,
            analysisDetails: analysis.analysisDetails ? decryptPHI(
              typeof analysis.analysisDetails === "string" ? analysis.analysisDetails : JSON.stringify(analysis.analysisDetails)
            ) : void 0
          }));
        }
        return analyses;
      }
      async createMealAnalysis(insertAnalysis) {
        const dbReadyAnalysis = {
          ...insertAnalysis,
          estimatedProtein: insertAnalysis.estimatedProtein?.toString(),
          estimatedCarbs: insertAnalysis.estimatedCarbs?.toString(),
          estimatedFat: insertAnalysis.estimatedFat?.toString()
        };
        const encryptedAnalysis = HIPAA_COMPLIANCE_ENABLED ? {
          ...dbReadyAnalysis,
          foodName: encryptPHI(dbReadyAnalysis.foodName),
          imageUrl: dbReadyAnalysis.imageUrl ? encryptPHI(dbReadyAnalysis.imageUrl) : null,
          analysisDetails: dbReadyAnalysis.analysisDetails ? encryptPHI(JSON.stringify(dbReadyAnalysis.analysisDetails)) : null
        } : dbReadyAnalysis;
        const now = /* @__PURE__ */ new Date();
        const result = await db.insert(mealAnalyses).values({ ...encryptedAnalysis, analysisTimestamp: now });
        const insertId = result.insertId || result[0]?.insertId;
        if (!insertId) throw new Error("Failed to get inserted meal analysis id");
        const [analysis] = await db.select().from(mealAnalyses).where(eq(mealAnalyses.id, insertId));
        await this.updateWeeklyStats(insertAnalysis.userId);
        return analysis;
      }
      async getMealAnalysis(id) {
        const [analysis] = await db.select().from(mealAnalyses).where(eq(mealAnalyses.id, id));
        if (!analysis) return void 0;
        const decryptedAnalysis = HIPAA_COMPLIANCE_ENABLED ? {
          ...analysis,
          foodName: decryptPHI(analysis.foodName),
          imageUrl: analysis.imageUrl ? decryptPHI(analysis.imageUrl) : null,
          analysisDetails: analysis.analysisDetails ? decryptPHI(typeof analysis.analysisDetails === "string" ? analysis.analysisDetails : JSON.stringify(analysis.analysisDetails)) : void 0
        } : analysis;
        return decryptedAnalysis;
      }
      // Helper method to update weekly stats based on meal analyses
      async updateWeeklyStats(userId) {
        const userMeals = await this.getMealAnalyses(userId);
        if (userMeals.length === 0) return;
        const now = /* @__PURE__ */ new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const weekMeals = userMeals.filter(
          (meal) => meal.analysisTimestamp && new Date(meal.analysisTimestamp) >= startOfWeek
        );
        if (weekMeals.length === 0) return;
        const totalCalories = weekMeals.reduce((sum, meal) => {
          return sum + (meal.estimatedCalories ? meal.estimatedCalories : 0);
        }, 0);
        const totalProtein = weekMeals.reduce((sum, meal) => {
          return sum + (meal.estimatedProtein ? parseFloat(meal.estimatedProtein) : 0);
        }, 0);
        const averageCalories = Math.round(totalCalories / weekMeals.length);
        const averageProtein = Math.round(totalProtein / weekMeals.length);
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const caloriesByDay = {};
        const macrosByDay = {};
        dayNames.forEach((day) => {
          caloriesByDay[day] = 0;
          macrosByDay[day] = { protein: 0, carbs: 0, fat: 0 };
        });
        weekMeals.forEach((meal) => {
          if (meal.analysisTimestamp) {
            const mealDay = dayNames[new Date(meal.analysisTimestamp).getDay()];
            const calories = meal.estimatedCalories ? meal.estimatedCalories : 0;
            const protein = meal.estimatedProtein ? parseFloat(meal.estimatedProtein) : 0;
            const carbs = meal.estimatedCarbs ? parseFloat(meal.estimatedCarbs) : 0;
            const fat = meal.estimatedFat ? parseFloat(meal.estimatedFat) : 0;
            caloriesByDay[mealDay] = (caloriesByDay[mealDay] || 0) + calories;
            macrosByDay[mealDay].protein += protein;
            macrosByDay[mealDay].carbs += carbs;
            macrosByDay[mealDay].fat += fat;
          }
        });
        let healthiestDay = dayNames[0];
        let lowestCalories = Number.MAX_VALUE;
        Object.entries(caloriesByDay).forEach(([day, calories]) => {
          if (calories > 0 && calories < lowestCalories) {
            healthiestDay = day;
            lowestCalories = calories;
          }
        });
        const existingStats = await this.getWeeklyStats(userId);
        if (existingStats) {
          await db.update(weeklyStats).set({
            averageCalories,
            mealsTracked: weekMeals.length,
            averageProtein,
            healthiestDay,
            caloriesByDay,
            macrosByDay
          }).where(eq(weeklyStats.id, existingStats.id));
        } else {
          await db.insert(weeklyStats).values({
            userId,
            averageCalories,
            mealsTracked: weekMeals.length,
            averageProtein,
            healthiestDay,
            weekStarting: startOfWeek,
            caloriesByDay,
            macrosByDay
          });
        }
      }
      // Helper method to create default weekly stats for new users
      async createDefaultWeeklyStats(userId) {
        const now = /* @__PURE__ */ new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const defaultStats = {
          userId,
          averageCalories: 0,
          mealsTracked: 0,
          averageProtein: 0,
          healthiestDay: "Sunday",
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
        const result = await db.insert(weeklyStats).values(defaultStats);
        const insertId = result.insertId || result[0]?.insertId;
        if (!insertId) throw new Error("Failed to get inserted weekly stats id");
        const [stats] = await db.select().from(weeklyStats).where(eq(weeklyStats.id, insertId));
        return stats;
      }
      // Weekly stats methods
      async getWeeklyStats(userId, medicalCondition) {
        let [stats] = await db.select().from(weeklyStats).where(eq(weeklyStats.userId, userId));
        if (!stats) {
          console.log(`[DATABASE STORAGE] No weekly stats found for user ${userId}, creating default stats`);
          const defaultStats = await this.createDefaultWeeklyStats(userId);
          stats = defaultStats;
        }
        const parsedStats = {
          ...stats,
          caloriesByDay: typeof stats.caloriesByDay === "string" ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
          macrosByDay: stats.macrosByDay ? typeof stats.macrosByDay === "string" ? JSON.parse(stats.macrosByDay) : stats.macrosByDay : void 0
        };
        if (medicalCondition && medicalCondition !== "none") {
          const adjustedStats = this.applyMedicalConditionAdjustments(parsedStats, medicalCondition);
          return adjustedStats;
        }
        return {
          ...parsedStats,
          macrosByDay: parsedStats.macrosByDay || {
            Sunday: { protein: 0, carbs: 0, fat: 0 },
            Monday: { protein: 0, carbs: 0, fat: 0 },
            Tuesday: { protein: 0, carbs: 0, fat: 0 },
            Wednesday: { protein: 0, carbs: 0, fat: 0 },
            Thursday: { protein: 0, carbs: 0, fat: 0 },
            Friday: { protein: 0, carbs: 0, fat: 0 },
            Saturday: { protein: 0, carbs: 0, fat: 0 }
          }
        };
      }
      // Ensure createOrUpdateWeeklyStats always returns a value
      async createOrUpdateWeeklyStats(insertStats) {
        const existingStats = await this.getWeeklyStats(insertStats.userId);
        if (existingStats) {
          await db.update(weeklyStats).set(insertStats).where(eq(weeklyStats.id, existingStats.id));
          const [updatedStats] = await db.select().from(weeklyStats).where(eq(weeklyStats.id, existingStats.id));
          return {
            ...updatedStats,
            caloriesByDay: typeof updatedStats.caloriesByDay === "string" ? JSON.parse(updatedStats.caloriesByDay) : updatedStats.caloriesByDay,
            macrosByDay: updatedStats.macrosByDay ? typeof updatedStats.macrosByDay === "string" ? JSON.parse(updatedStats.macrosByDay) : updatedStats.macrosByDay : void 0
          };
        } else {
          const result = await db.insert(weeklyStats).values(insertStats);
          const insertId = result.insertId || result[0]?.insertId;
          if (!insertId) throw new Error("Failed to get inserted weekly stats id");
          const [stats] = await db.select().from(weeklyStats).where(eq(weeklyStats.id, insertId));
          return {
            ...stats,
            caloriesByDay: typeof stats.caloriesByDay === "string" ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
            macrosByDay: stats.macrosByDay ? typeof stats.macrosByDay === "string" ? JSON.parse(stats.macrosByDay) : stats.macrosByDay : void 0
          };
        }
      }
      // --- Site Content Methods ---
      async getSiteContent(key) {
        try {
          console.log(`[DB STORAGE] Attempting to get site content for key: ${key}`);
          console.log(`[DB STORAGE] Database connection status:`, this.db ? "connected" : "not connected");
          const [row] = await db.select().from(siteContent).where(eq(siteContent.key, key));
          console.log(`[DB STORAGE] Query result for key ${key}:`, row ? "found" : "not found");
          return row ? row.value : null;
        } catch (error) {
          console.error(`[DB STORAGE] Error getting site content for key ${key}:`, error);
          console.error(`[DB STORAGE] Error stack:`, error instanceof Error ? error.stack : "No stack");
          throw error;
        }
      }
      async updateSiteContent(key, value) {
        const [existing] = await db.select().from(siteContent).where(eq(siteContent.key, key));
        if (existing) {
          await db.update(siteContent).set({ value }).where(eq(siteContent.key, key));
        } else {
          await db.insert(siteContent).values({ key, value });
        }
      }
      // --- Onboarding Methods ---
      async updateUserOnboarding(userId, onboardingData) {
        await db.update(users).set(onboardingData).where(eq(users.id, userId));
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        return {
          ...user,
          nutritionGoals: user.nutritionGoals ? typeof user.nutritionGoals === "string" ? JSON.parse(user.nutritionGoals) : user.nutritionGoals : null
        };
      }
      async createNutritionGoals(userId, goals) {
        await db.insert(nutritionGoals).values({
          userId,
          ...goals
        });
      }
      // --- AI Config Methods ---
      async getAIConfigs() {
        return await db.select().from(aiConfig).orderBy(aiConfig.provider);
      }
      async updateAIConfig(id, config3) {
        await db.update(aiConfig).set({ ...config3, updatedAt: /* @__PURE__ */ new Date() }).where(eq(aiConfig.id, id));
      }
      async deactivateAllAIConfigs() {
        await db.update(aiConfig).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() });
      }
      /**
       * Apply medical condition adjustments to stats
       */
      applyMedicalConditionAdjustments(stats, medicalCondition) {
        const adjustedStats = { ...stats };
        switch (medicalCondition.toLowerCase()) {
          case "diabetes":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.9);
            adjustedStats.averageProtein = Math.round(stats.averageProtein * 1.2);
            break;
          case "hypertension":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.85);
            break;
          case "heart_disease":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.8);
            break;
          case "obesity":
            adjustedStats.averageCalories = Math.round(stats.averageCalories * 0.8);
            break;
          default:
            break;
        }
        return adjustedStats;
      }
    };
  }
});

// server/storage-provider.ts
var storage_provider_exports = {};
__export(storage_provider_exports, {
  storage: () => storage
});
var storage;
var init_storage_provider = __esm({
  "server/storage-provider.ts"() {
    "use strict";
    init_storage();
    init_database_storage();
    init_config();
    storage = DB_HOST && DB_USER && DB_NAME ? new DatabaseStorage() : new MemStorage();
  }
});

// server/openai.ts
import OpenAI from "openai";
import dotenv3 from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
async function analyzeFoodImage(base64Image) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in analyzing food images. Identify the food and provide detailed nutritional information."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and return nutritional information in JSON format. Include: food name, calories, protein (g), carbs (g), fat (g), and fiber (g). Provide realistic estimates based on what you see. Format as {'foodName': string, 'calories': number, 'protein': number, 'carbs': number, 'fat': number, 'fiber': number}."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return {
      foodName: result.foodName,
      calories: Math.round(result.calories),
      protein: Math.round(result.protein),
      carbs: Math.round(result.carbs),
      fat: Math.round(result.fat),
      fiber: Math.round(result.fiber)
    };
  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw new Error("Failed to analyze food image");
  }
}
async function getNutritionTips(userId) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert providing helpful, personalized nutrition tips."
        },
        {
          role: "user",
          content: "Generate 4 concise, practical nutrition tips that would be helpful for someone tracking their food intake. Each tip should be a separate item in a JSON array format. Keep tips short and actionable."
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    const rawContent = response.choices[0].message.content ?? "{}";
    console.log("[NUTRITION TIPS] Raw OpenAI response:", rawContent);
    const result = JSON.parse(rawContent);
    console.log("[NUTRITION TIPS] Parsed result:", result);
    let tips = result.tips || [];
    if (!Array.isArray(tips)) {
      console.warn("[NUTRITION TIPS] Tips is not an array, converting to array");
      tips = [String(tips)];
    }
    tips = tips.map((item, index) => {
      if (typeof item === "string") {
        return item;
      } else if (typeof item === "object" && item !== null && "tip" in item) {
        console.log(`[NUTRITION TIPS] Converting object at index ${index} to string`);
        return String(item.tip || "");
      } else {
        console.warn(`[NUTRITION TIPS] Unexpected item type at index ${index}, converting to string:`, item);
        return String(item || "");
      }
    }).filter((tip) => tip.trim().length > 0);
    console.log("[NUTRITION TIPS] Final normalized tips array:", tips);
    return tips;
  } catch (error) {
    console.error("Error getting nutrition tips:", error);
    return [
      "Try to include protein with every meal for better satiety",
      "Aim for at least 5 servings of fruits and vegetables daily",
      "Stay hydrated by drinking water before and during meals",
      "Choose whole grains over refined carbohydrates when possible"
    ];
  }
}
async function getSmartMealSuggestions(userId) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in personalized meal suggestions. Suggest healthy, practical meal ideas based on a user's recent eating habits."
        },
        {
          role: "user",
          content: "Suggest 3 healthy meal ideas for my next meal. Each suggestion should be a short, practical meal description, suitable for someone tracking calories and macros. Format as a JSON array of strings."
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });
    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return result.suggestions || [];
  } catch (error) {
    console.error("Error getting smart meal suggestions:", error);
    return [
      "Grilled chicken breast with quinoa and steamed broccoli",
      "Salmon salad with mixed greens, cherry tomatoes, and olive oil vinaigrette",
      "Vegetarian stir-fry with tofu, bell peppers, and brown rice"
    ];
  }
}
async function analyzeMultiFoodImage(base64Image) {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a nutrition expert specializing in analyzing food images. Identify all distinct foods in the image and provide detailed nutritional information for each."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this food image and return nutritional information for each distinct food you see. For each food, include: food name, calories, protein (g), carbs (g), fat (g), and fiber (g). Format as {foods: [{foodName: string, calories: number, protein: number, carbs: number, fat: number, fiber: number}]}"
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1e3
    });
    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return result;
  } catch (error) {
    console.error("Error analyzing multi-food image:", error);
    throw new Error("Failed to analyze multi-food image");
  }
}
async function getNutritionCoachReply(messages, userId) {
  const systemPrompt = "You are a friendly, expert nutrition coach. Answer user questions about their meals, nutrition, and healthy eating. If the user asks about a specific meal (e.g. 'Was my breakfast healthy?'), give a short, actionable analysis. If the user asks for a meal suggestion, provide a specific, practical answer with calories and macros if possible. Be concise, supportive, and evidence-based.";
  const chatMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content }))
  ];
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: chatMessages,
    max_tokens: 300,
    temperature: 0.7
  });
  return response.choices[0].message.content?.trim() || "Sorry, I couldn't process your request.";
}
function getOpenAIClient() {
  return openai;
}
var __filename, __dirname, rawKey, apiKey, MODEL, openai;
var init_openai = __esm({
  "server/openai.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    for (const envPath of [
      path.resolve(__dirname, "../server/.env"),
      path.resolve(__dirname, ".env"),
      path.resolve(process.cwd(), ".env")
    ]) {
      dotenv3.config({ path: envPath });
    }
    rawKey = process.env.OPENAI_API_KEY || "";
    apiKey = rawKey.trim();
    MODEL = "gpt-4o";
    if (!apiKey || !apiKey.startsWith("sk-")) {
      console.warn("[OpenAI] OPENAI_API_KEY is missing or malformed. Please set a valid key in server/.env or root .env");
    }
    openai = new OpenAI({ apiKey });
  }
});

// server/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
function initializeGemini(apiKey2) {
  genAI = new GoogleGenerativeAI(apiKey2);
}
async function analyzeWithGemini(imageData, prompt, modelName = "gemini-1.5-pro-vision-latest") {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Please configure API key in admin panel.");
  }
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const imageParts = [{
      inlineData: {
        data: imageData.replace(/^data:image\/[a-z]+;base64,/, ""),
        mimeType: "image/jpeg"
      }
    }];
    const fullPrompt = `${prompt}

Please analyze this food image and respond with ONLY a JSON object in this exact format:
{
  "foodName": "descriptive name of the food",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number
}

Make sure all nutrition values are realistic numbers. If you can't identify the food clearly, make reasonable estimates based on what you can see.`;
    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const response = await result.response;
    const text15 = response.text();
    const jsonMatch = text15.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse nutrition data from Gemini response");
    }
    const nutritionData = JSON.parse(jsonMatch[0]);
    if (!nutritionData.foodName || typeof nutritionData.calories !== "number") {
      throw new Error("Invalid nutrition data structure from Gemini");
    }
    return {
      foodName: nutritionData.foodName,
      calories: Math.round(nutritionData.calories),
      protein: Math.round(nutritionData.protein || 0),
      carbs: Math.round(nutritionData.carbs || 0),
      fat: Math.round(nutritionData.fat || 0),
      fiber: Math.round(nutritionData.fiber || 0)
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to analyze image with Gemini Vision");
  }
}
async function analyzeMultiFoodWithGemini(imageData, prompt, modelName = "gemini-1.5-pro-vision-latest") {
  if (!genAI) {
    throw new Error("Gemini API not initialized. Please configure API key in admin panel.");
  }
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const imageParts = [{
      inlineData: {
        data: imageData.replace(/^data:image\/[a-z]+;base64,/, ""),
        mimeType: "image/jpeg"
      }
    }];
    const fullPrompt = `${prompt}

Please analyze this food image and identify all individual food items with portion sizes. Respond with ONLY a JSON object in this exact format:
{
  "foods": [
    {
      "foodName": "name of food item 1",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "portionSize": {
        "estimatedWeight": number,
        "referenceObject": "credit card|banana|hand|none"
      },
      "densityScore": number
    }
  ],
  "totalCalories": sum_of_all_calories,
  "totalProtein": sum_of_all_protein,
  "totalCarbs": sum_of_all_carbs,
  "totalFat": sum_of_all_fat,
  "totalFiber": sum_of_all_fiber,
  "densityAnalysis": {
    "caloriesPerGram": number,
    "nutrientDensityScore": number
  }
}

INSTRUCTIONS:
1. Include each distinct food item as separate objects
2. Estimate portion sizes using visible reference objects
3. Calculate density scores (1-100) based on nutrient quality
4. Provide weight estimates in grams`;
    const result = await model.generateContent([fullPrompt, ...imageParts]);
    const response = await result.response;
    const text15 = response.text();
    const jsonMatch = text15.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse nutrition data from Gemini response");
    }
    const analysisData = JSON.parse(jsonMatch[0]);
    if (!analysisData.foods || !Array.isArray(analysisData.foods)) {
      throw new Error("Invalid multi-food analysis structure from Gemini");
    }
    analysisData.foods = analysisData.foods.map((food) => ({
      foodName: food.foodName,
      calories: Math.round(food.calories || 0),
      protein: Math.round(food.protein || 0),
      carbs: Math.round(food.carbs || 0),
      fat: Math.round(food.fat || 0),
      fiber: Math.round(food.fiber || 0)
    }));
    return {
      foods: analysisData.foods,
      totalCalories: Math.round(analysisData.totalCalories || 0),
      totalProtein: Math.round(analysisData.totalProtein || 0),
      totalCarbs: Math.round(analysisData.totalCarbs || 0),
      totalFat: Math.round(analysisData.totalFat || 0),
      totalFiber: Math.round(analysisData.totalFiber || 0)
    };
  } catch (error) {
    console.error("Gemini multi-food API error:", error);
    throw new Error("Failed to analyze multiple foods with Gemini Vision");
  }
}
var genAI;
var init_gemini = __esm({
  "server/gemini.ts"() {
    "use strict";
    genAI = null;
  }
});

// server/ai-service.ts
var ai_service_exports = {};
__export(ai_service_exports, {
  AIConfigService: () => AIConfigService,
  AIService: () => AIService,
  aiService: () => aiService
});
import crypto2 from "crypto";
function encrypt(text15) {
  const key = crypto2.createHash("sha256").update(ENCRYPTION_KEY2).digest();
  const iv = crypto2.randomBytes(16);
  const cipher = crypto2.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text15, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
function decrypt(text15) {
  const key = crypto2.createHash("sha256").update(ENCRYPTION_KEY2).digest();
  const textParts = text15.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");
  const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
var ENCRYPTION_KEY2, ALGORITHM, AIService, AIConfigService, aiService;
var init_ai_service = __esm({
  "server/ai-service.ts"() {
    "use strict";
    init_storage_provider();
    init_openai();
    init_gemini();
    ENCRYPTION_KEY2 = process.env.ENCRYPTION_KEY || "your-32-character-secret-key-here";
    ALGORITHM = "aes-256-cbc";
    AIService = class _AIService {
      static instance;
      currentConfig = null;
      initialized = false;
      static getInstance() {
        if (!_AIService.instance) {
          _AIService.instance = new _AIService();
        }
        return _AIService.instance;
      }
      async initialize() {
        if (this.initialized) return;
        try {
          this.currentConfig = await this.getActiveConfig();
          if (this.currentConfig) {
            await this.setupProvider(this.currentConfig);
          }
          this.initialized = true;
        } catch (error) {
          console.error("Failed to initialize AI service:", error);
        }
      }
      async getActiveConfig() {
        try {
          const configs = await storage.getAIConfigs();
          return configs.find((config3) => config3.isActive) || null;
        } catch (error) {
          console.error("Error getting AI config:", error);
          return null;
        }
      }
      async setupProvider(config3) {
        if (config3.provider === "gemini") {
          if (!config3.apiKeyEncrypted) {
            throw new Error("No API key configured for gemini");
          }
          let apiKey2;
          try {
            apiKey2 = decrypt(config3.apiKeyEncrypted);
          } catch (e) {
            throw new Error("Failed to decrypt Gemini API key. Ensure ENCRYPTION_KEY matches the one used for encryption.");
          }
          initializeGemini(apiKey2);
          return;
        }
        if (config3.provider === "openai") {
          if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set");
          }
          return;
        }
      }
      async refreshConfig() {
        this.currentConfig = await this.getActiveConfig();
        if (this.currentConfig) {
          await this.setupProvider(this.currentConfig);
        }
      }
      async analyzeFoodImage(imageData, prompt) {
        if (!this.initialized) {
          await this.initialize();
        }
        if (!this.currentConfig) {
          throw new Error("No AI provider configured. Please configure an AI provider in the admin panel.");
        }
        const finalPrompt = prompt || this.currentConfig.promptTemplate || "Analyze this food image and provide nutritional information.";
        try {
          if (this.currentConfig.provider === "gemini") {
            return await analyzeWithGemini(imageData, finalPrompt, this.currentConfig.modelName);
          } else {
            return await analyzeFoodImage(imageData);
          }
        } catch (error) {
          console.error(`${this.currentConfig.provider} analysis failed:`, error);
          throw error;
        }
      }
      async analyzeMultiFoodImage(imageData, prompt) {
        if (!this.initialized) {
          await this.initialize();
        }
        if (!this.currentConfig) {
          throw new Error("No AI provider configured. Please configure an AI provider in the admin panel.");
        }
        const finalPrompt = prompt || this.currentConfig.promptTemplate || `
      Analyze this food image and identify all food items with their nutritional information.
      For each food item, provide:
      - Name
      - Estimated portion size in grams
      - Reference object for size comparison (e.g., "similar to a baseball")
      - Calories
      - Macronutrients (protein, carbs, fat)
      - Micronutrients (vitamins, minerals)
      - Density score (1-100) based on nutrient density
      - Allergens present
      - Health impact rating (1-5)
    `;
        try {
          if (this.currentConfig.provider === "gemini") {
            return await analyzeMultiFoodWithGemini(imageData, finalPrompt, this.currentConfig.modelName);
          } else {
            return await analyzeMultiFoodImage(imageData);
          }
        } catch (error) {
          console.error(`${this.currentConfig.provider} multi-food analysis failed:`, error);
          throw error;
        }
      }
      getCurrentProvider() {
        return this.currentConfig?.provider || "none";
      }
      isConfigured() {
        return this.currentConfig !== null && this.currentConfig.apiKeyEncrypted !== null;
      }
    };
    AIConfigService = {
      async getConfigs() {
        return await storage.getAIConfigs();
      },
      async updateConfig(id, config3) {
        const updateData = { ...config3 };
        if (config3.apiKey) {
          updateData.apiKeyEncrypted = encrypt(config3.apiKey);
          delete updateData.apiKey;
        }
        await storage.updateAIConfig(id, updateData);
        await AIService.getInstance().refreshConfig();
      },
      async setActiveProvider(providerId) {
        await storage.deactivateAllAIConfigs();
        await storage.updateAIConfig(providerId, { isActive: true });
        await AIService.getInstance().refreshConfig();
      },
      encryptApiKey: encrypt,
      decryptApiKey: decrypt
    };
    aiService = AIService.getInstance();
  }
});

// server/src/migrations/001_create_wearable_tables.ts
import { sql as sql21 } from "drizzle-orm";
import { mysqlTable as mysqlTable21, varchar as varchar21, int as int21, boolean as boolean12, timestamp as timestamp20, text as text13, decimal as decimal11, json as json10, date } from "drizzle-orm/mysql-core";
var wearableDevices, healthMetrics, syncLogs, correlationAnalysis;
var init_create_wearable_tables = __esm({
  "server/src/migrations/001_create_wearable_tables.ts"() {
    "use strict";
    init_schema();
    wearableDevices = mysqlTable21("wearable_devices", {
      id: int21("id").autoincrement().primaryKey(),
      user_id: int21("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      device_type: varchar21("device_type", { length: 50 }).notNull().$type(),
      device_name: varchar21("device_name", { length: 100 }).notNull(),
      device_id: varchar21("device_id", { length: 255 }).unique(),
      is_connected: boolean12("is_connected").default(true).notNull(),
      last_sync_at: timestamp20("last_sync_at"),
      sync_frequency_minutes: int21("sync_frequency_minutes").default(60).notNull(),
      is_two_way_sync: boolean12("is_two_way_sync").default(true).notNull(),
      auth_token_encrypted: text13("auth_token_encrypted"),
      refresh_token_encrypted: text13("refresh_token_encrypted"),
      settings: json10("settings"),
      created_at: timestamp20("created_at").default(sql21`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp20("updated_at").default(sql21`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull()
    });
    healthMetrics = mysqlTable21("health_metrics", {
      id: int21("id").autoincrement().primaryKey(),
      user_id: int21("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      device_id: int21("device_id").references(() => wearableDevices.id, { onDelete: "set null" }),
      metric_type: varchar21("metric_type", { length: 50 }).notNull().$type(),
      value: decimal11("value", { precision: 10, scale: 2 }).notNull(),
      unit: varchar21("unit", { length: 20 }).notNull(),
      source_timestamp: timestamp20("source_timestamp").notNull(),
      recorded_at: timestamp20("recorded_at").default(sql21`CURRENT_TIMESTAMP`).notNull(),
      confidence_score: decimal11("confidence_score", { precision: 3, scale: 2 }),
      metadata: json10("metadata")
    });
    syncLogs = mysqlTable21("sync_logs", {
      id: int21("id").autoincrement().primaryKey(),
      user_id: int21("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      device_id: int21("device_id").references(() => wearableDevices.id, { onDelete: "set null" }),
      sync_type: varchar21("sync_type", { length: 20 }).notNull().$type(),
      status: varchar21("status", { length: 20 }).notNull().$type(),
      records_processed: int21("records_processed").default(0).notNull(),
      records_added: int21("records_added").default(0).notNull(),
      records_updated: int21("records_updated").default(0).notNull(),
      records_failed: int21("records_failed").default(0).notNull(),
      error_message: text13("error_message"),
      started_at: timestamp20("started_at").default(sql21`CURRENT_TIMESTAMP`).notNull(),
      completed_at: timestamp20("completed_at"),
      duration_seconds: int21("duration_seconds"),
      metadata: json10("metadata")
    });
    correlationAnalysis = mysqlTable21("correlation_analysis", {
      id: int21("id").autoincrement().primaryKey(),
      user_id: int21("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      correlation_type: varchar21("correlation_type", { length: 50 }).notNull().$type(),
      analysis_date: date("analysis_date").notNull(),
      correlation_score: decimal11("correlation_score", { precision: 3, scale: 2 }).notNull(),
      confidence_level: decimal11("confidence_level", { precision: 3, scale: 2 }).notNull(),
      insights: json10("insights"),
      recommendations: json10("recommendations"),
      created_at: timestamp20("created_at").default(sql21`CURRENT_TIMESTAMP`).notNull()
    });
  }
});

// server/src/migrations/002_create_premium_analytics_tables.ts
import { sql as sql22 } from "drizzle-orm";
import { mysqlTable as mysqlTable22, int as int22, varchar as varchar22, decimal as decimal12, date as date2, timestamp as timestamp21, text as text14, boolean as boolean13, json as json11 } from "drizzle-orm/mysql-core";
var healthScores2, healthPredictions2, patternAnalysis2, healthReports2, realTimeMonitoring2, healthcareIntegration2, healthGoals2, healthInsights2;
var init_create_premium_analytics_tables = __esm({
  "server/src/migrations/002_create_premium_analytics_tables.ts"() {
    "use strict";
    init_schema();
    healthScores2 = mysqlTable22("health_scores", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      score_type: varchar22("score_type", { length: 50 }).notNull().$type(),
      score_value: decimal12("score_value", { precision: 5, scale: 2 }).notNull(),
      max_score: decimal12("max_score", { precision: 5, scale: 2 }).default("100.00").notNull(),
      calculation_date: date2("calculation_date").notNull(),
      score_details: json11("score_details"),
      trend_direction: varchar22("trend_direction", { length: 20 }).default("stable").$type(),
      confidence_level: decimal12("confidence_level", { precision: 3, scale: 2 }),
      metadata: json11("metadata"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp21("updated_at").default(sql22`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull()
    });
    healthPredictions2 = mysqlTable22("health_predictions", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      prediction_type: varchar22("prediction_type", { length: 50 }).notNull().$type(),
      target_date: date2("target_date").notNull(),
      prediction_value: decimal12("prediction_value", { precision: 10, scale: 2 }).notNull(),
      confidence_score: decimal12("confidence_score", { precision: 3, scale: 2 }).notNull(),
      model_version: varchar22("model_version", { length: 50 }),
      input_data: json11("input_data"),
      prediction_details: json11("prediction_details"),
      recommendations: json11("recommendations"),
      is_active: boolean13("is_active").default(true).notNull(),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp21("updated_at").default(sql22`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull()
    });
    patternAnalysis2 = mysqlTable22("pattern_analysis", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      pattern_type: varchar22("pattern_type", { length: 50 }).notNull().$type(),
      analysis_period: varchar22("analysis_period", { length: 20 }).notNull().$type(),
      start_date: date2("start_date").notNull(),
      end_date: date2("end_date").notNull(),
      correlation_score: decimal12("correlation_score", { precision: 3, scale: 2 }).notNull(),
      significance_level: decimal12("significance_level", { precision: 3, scale: 2 }),
      pattern_strength: varchar22("pattern_strength", { length: 20 }).default("moderate").$type(),
      insights: json11("insights"),
      triggers: json11("triggers"),
      interventions: json11("interventions"),
      recommendations: json11("recommendations"),
      is_validated: boolean13("is_validated").default(false).notNull(),
      validated_by: varchar22("validated_by", { length: 100 }),
      validation_notes: text14("validation_notes"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp21("updated_at").default(sql22`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull()
    });
    healthReports2 = mysqlTable22("health_reports", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      report_type: varchar22("report_type", { length: 50 }).notNull().$type(),
      report_period_start: date2("report_period_start").notNull(),
      report_period_end: date2("report_period_end").notNull(),
      report_status: varchar22("report_status", { length: 20 }).default("draft").$type(),
      report_data: json11("report_data").notNull(),
      summary_text: text14("summary_text"),
      key_findings: json11("key_findings"),
      recommendations: json11("recommendations"),
      generated_at: timestamp21("generated_at"),
      delivered_at: timestamp21("delivered_at"),
      archived_at: timestamp21("archived_at"),
      metadata: json11("metadata"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp21("updated_at").default(sql22`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull()
    });
    realTimeMonitoring2 = mysqlTable22("real_time_monitoring", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      metric_type: varchar22("metric_type", { length: 50 }).notNull().$type(),
      metric_value: decimal12("metric_value", { precision: 10, scale: 2 }).notNull(),
      unit: varchar22("unit", { length: 20 }).notNull(),
      timestamp: timestamp21("timestamp").notNull(),
      is_alert: boolean13("is_alert").default(false).notNull(),
      alert_level: varchar22("alert_level", { length: 20 }).default("low").$type(),
      alert_message: text14("alert_message"),
      action_taken: text14("action_taken"),
      metadata: json11("metadata"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull()
    });
    healthcareIntegration2 = mysqlTable22("healthcare_integration", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      professional_id: varchar22("professional_id", { length: 100 }).notNull(),
      professional_type: varchar22("professional_type", { length: 50 }).notNull().$type(),
      professional_name: varchar22("professional_name", { length: 200 }).notNull(),
      practice_name: varchar22("practice_name", { length: 200 }),
      access_level: varchar22("access_level", { length: 20 }).default("read_only").$type(),
      data_sharing_consent: boolean13("data_sharing_consent").default(false).notNull(),
      consent_date: date2("consent_date"),
      data_expiration_date: date2("data_expiration_date"),
      shared_data: json11("shared_data"),
      notes: text14("notes"),
      is_active: boolean13("is_active").default(true).notNull(),
      acknowledged: boolean13("acknowledged").default(false).notNull(),
      acknowledged_at: timestamp21("acknowledged_at"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp21("updated_at").default(sql22`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull()
    });
    healthGoals2 = mysqlTable22("health_goals", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      goal_type: varchar22("goal_type", { length: 50 }).notNull().$type(),
      goal_title: varchar22("goal_title", { length: 200 }).notNull(),
      goal_description: text14("goal_description"),
      target_value: decimal12("target_value", { precision: 10, scale: 2 }).notNull(),
      current_value: decimal12("current_value", { precision: 10, scale: 2 }).default("0.00").notNull(),
      unit: varchar22("unit", { length: 20 }).notNull(),
      start_date: date2("start_date").notNull(),
      target_date: date2("target_date").notNull(),
      deadline_date: date2("deadline_date"),
      status: varchar22("status", { length: 20 }).default("active").$type(),
      priority: varchar22("priority", { length: 20 }).default("medium").$type(),
      progress_percentage: decimal12("progress_percentage", { precision: 5, scale: 2 }).default("0.00").notNull(),
      achievement_probability: decimal12("achievement_probability", { precision: 5, scale: 2 }).default("0.00").notNull(),
      milestones: json11("milestones"),
      achievements: json11("achievements"),
      obstacles: json11("obstacles"),
      strategies: json11("strategies"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      updated_at: timestamp21("updated_at").default(sql22`CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP`).notNull(),
      completed_at: timestamp21("completed_at")
    });
    healthInsights2 = mysqlTable22("health_insights", {
      id: int22("id").autoincrement().primaryKey(),
      user_id: int22("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      insight_type: varchar22("insight_type", { length: 50 }).notNull().$type(),
      insight_category: varchar22("insight_category", { length: 20 }).default("neutral").$type(),
      insight_title: varchar22("insight_title", { length: 200 }).notNull(),
      insight_description: text14("insight_description").notNull(),
      insight_data: json11("insight_data"),
      confidence_score: decimal12("confidence_score", { precision: 3, scale: 2 }).notNull(),
      action_items: json11("action_items"),
      related_metrics: json11("related_metrics"),
      is_actioned: boolean13("is_actioned").default(false).notNull(),
      actioned_at: timestamp21("actioned_at"),
      action_notes: text14("action_notes"),
      created_at: timestamp21("created_at").default(sql22`CURRENT_TIMESTAMP`).notNull(),
      expires_at: timestamp21("expires_at")
    });
  }
});

// server/src/db.ts
var db_exports2 = {};
__export(db_exports2, {
  db: () => db2,
  default: () => db_default
});
import mysql2 from "mysql2/promise";
import { drizzle as drizzle2 } from "drizzle-orm/mysql2";
var pool2, db2, db_default;
var init_db2 = __esm({
  "server/src/db.ts"() {
    "use strict";
    init_schema();
    init_create_wearable_tables();
    init_create_premium_analytics_tables();
    pool2 = mysql2.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "calorie_tracker",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    db2 = drizzle2(pool2, {
      schema: {
        ...schema_exports,
        wearableDevices,
        healthMetrics,
        syncLogs,
        correlationAnalysis,
        healthScores: healthScores2,
        healthPredictions: healthPredictions2,
        patternAnalysis: patternAnalysis2,
        healthReports: healthReports2,
        realTimeMonitoring: realTimeMonitoring2,
        healthcareIntegration: healthcareIntegration2,
        healthGoals: healthGoals2,
        healthInsights: healthInsights2
      },
      mode: "default"
    });
    db_default = {
      async execute(sql30, params) {
        const connection = await pool2.getConnection();
        try {
          const [rows, fields] = await connection.execute(sql30, params);
          return rows;
        } finally {
          connection.release();
        }
      },
      // Export the drizzle instance for new code
      db: db2
    };
  }
});

// server/src/services/imageStorageService.ts
var imageStorageService_exports = {};
__export(imageStorageService_exports, {
  default: () => imageStorageService_default,
  imageStorageService: () => imageStorageService
});
import { createHash } from "crypto";
import { writeFile, unlink, mkdir, access, constants } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
var IMAGE_STORAGE_CONFIG, ImageStorageService, imageStorageService, imageStorageService_default;
var init_imageStorageService = __esm({
  "server/src/services/imageStorageService.ts"() {
    "use strict";
    init_db2();
    IMAGE_STORAGE_CONFIG = {
      // Storage type: 'local' or 's3'
      storageType: process.env.IMAGE_STORAGE_TYPE || "local",
      // Local storage configuration
      local: {
        basePath: process.env.IMAGE_STORAGE_PATH || "./uploads",
        maxFileSize: 10 * 1024 * 1024,
        // 10MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        quality: { jpeg: 0.8, png: 0.8, webp: 0.8 }
      },
      // S3 configuration (if using S3)
      s3: {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      // Image processing configuration
      processing: {
        maxWidth: 1920,
        maxHeight: 1080,
        thumbnailWidth: 300,
        thumbnailHeight: 300,
        formats: ["webp", "jpeg"]
        // Convert to these formats
      }
    };
    ImageStorageService = class {
      initialized = false;
      /**
       * Initialize the image storage service
       */
      async initialize() {
        if (this.initialized) return;
        try {
          if (IMAGE_STORAGE_CONFIG.storageType === "local") {
            await this.ensureLocalDirectories();
          }
          this.initialized = true;
          console.log("Image storage service initialized successfully");
        } catch (error) {
          console.error("Failed to initialize image storage service:", error);
          throw error;
        }
      }
      /**
       * Ensure local storage directories exist
       */
      async ensureLocalDirectories() {
        const directories = [
          IMAGE_STORAGE_CONFIG.local.basePath,
          join(IMAGE_STORAGE_CONFIG.local.basePath, "originals"),
          join(IMAGE_STORAGE_CONFIG.local.basePath, "optimized"),
          join(IMAGE_STORAGE_CONFIG.local.basePath, "thumbnails")
        ];
        for (const directory of directories) {
          try {
            await access(directory, constants.R_OK | constants.W_OK);
          } catch {
            await mkdir(directory, { recursive: true });
          }
        }
      }
      /**
       * Generate a unique filename for an image
       */
      generateFilename(originalName, mimeType) {
        const extension = this.getFileExtension(mimeType);
        const uuid = uuidv4();
        const timestamp23 = Date.now();
        return `${uuid}_${timestamp23}.${extension}`;
      }
      /**
       * Get file extension from MIME type
       */
      getFileExtension(mimeType) {
        const extensionMap = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/webp": "webp"
        };
        return extensionMap[mimeType] || "jpg";
      }
      /**
       * Generate a hash for image deduplication
       */
      generateImageHash(buffer) {
        return createHash("sha256").update(buffer).digest("hex");
      }
      /**
       * Validate image file
       */
      async validateImage(buffer, mimeType) {
        if (buffer.length > IMAGE_STORAGE_CONFIG.local.maxFileSize) {
          throw new Error(`Image size exceeds maximum limit of ${IMAGE_STORAGE_CONFIG.local.maxFileSize} bytes`);
        }
        if (!IMAGE_STORAGE_CONFIG.local.allowedMimeTypes.includes(mimeType)) {
          throw new Error(`Unsupported image type: ${mimeType}`);
        }
        const signatures = {
          "image/jpeg": Buffer.from([255, 216, 255]),
          "image/png": Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
          "image/webp": Buffer.from([82, 73, 70, 70])
        };
        const expectedSignature = signatures[mimeType];
        if (!expectedSignature || !buffer.slice(0, expectedSignature.length).equals(expectedSignature)) {
          throw new Error("Invalid image file");
        }
      }
      /**
       * Process and store an image
       */
      async processAndStoreImage(imageBuffer, originalName, mimeType, uploadedBy) {
        try {
          await this.initialize();
          await this.validateImage(imageBuffer, mimeType);
          const hash = this.generateImageHash(imageBuffer);
          const filename = this.generateFilename(originalName, mimeType);
          const originalPath = await this.storeOriginalImage(imageBuffer, filename);
          const optimizedPath = await this.storeOptimizedImage(imageBuffer, filename, mimeType);
          const thumbnailPath = await this.storeThumbnail(imageBuffer, filename, mimeType);
          const originalMetadata = {
            id: uuidv4(),
            originalName,
            filename,
            path: originalPath,
            size: imageBuffer.length,
            mimeType,
            hash,
            uploadedAt: /* @__PURE__ */ new Date(),
            uploadedBy
          };
          const optimizedMetadata = {
            ...originalMetadata,
            path: optimizedPath
          };
          const thumbnailMetadata = {
            ...originalMetadata,
            path: thumbnailPath
          };
          return {
            original: originalMetadata,
            optimized: optimizedMetadata,
            thumbnail: thumbnailMetadata
          };
        } catch (error) {
          console.error("Failed to process and store image:", error);
          throw error;
        }
      }
      /**
       * Store original image
       */
      async storeOriginalImage(buffer, filename) {
        if (IMAGE_STORAGE_CONFIG.storageType === "local") {
          const path6 = join(IMAGE_STORAGE_CONFIG.local.basePath, "originals", filename);
          await writeFile(path6, buffer);
          return path6;
        } else if (IMAGE_STORAGE_CONFIG.storageType === "s3") {
          const AWS = __require("aws-sdk");
          const s3 = new AWS.S3({
            accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
            secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
            region: IMAGE_STORAGE_CONFIG.s3.region
          });
          const key = `originals/${filename}`;
          await s3.upload({
            Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
            Key: key,
            Body: buffer,
            ContentType: "image/jpeg"
            // This should be determined from the actual file
          }).promise();
          return key;
        } else {
          throw new Error(`Unsupported storage type: ${IMAGE_STORAGE_CONFIG.storageType}`);
        }
      }
      /**
       * Store optimized image
       */
      async storeOptimizedImage(buffer, filename, mimeType) {
        if (IMAGE_STORAGE_CONFIG.storageType === "local") {
          const optimizedBuffer = await this.compressImage(buffer, mimeType);
          const path6 = join(IMAGE_STORAGE_CONFIG.local.basePath, "optimized", filename);
          await writeFile(path6, optimizedBuffer);
          return path6;
        } else if (IMAGE_STORAGE_CONFIG.storageType === "s3") {
          const AWS = __require("aws-sdk");
          const s3 = new AWS.S3({
            accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
            secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
            region: IMAGE_STORAGE_CONFIG.s3.region
          });
          const optimizedBuffer = await this.compressImage(buffer, mimeType);
          const key = `optimized/${filename}`;
          await s3.upload({
            Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
            Key: key,
            Body: optimizedBuffer,
            ContentType: mimeType
          }).promise();
          return key;
        } else {
          throw new Error(`Unsupported storage type: ${IMAGE_STORAGE_CONFIG.storageType}`);
        }
      }
      /**
       * Store thumbnail image
       */
      async storeThumbnail(buffer, filename, mimeType) {
        if (IMAGE_STORAGE_CONFIG.storageType === "local") {
          const thumbnailBuffer = await this.createThumbnail(buffer, mimeType);
          const path6 = join(IMAGE_STORAGE_CONFIG.local.basePath, "thumbnails", filename);
          await writeFile(path6, thumbnailBuffer);
          return path6;
        } else if (IMAGE_STORAGE_CONFIG.storageType === "s3") {
          const AWS = __require("aws-sdk");
          const s3 = new AWS.S3({
            accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
            secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
            region: IMAGE_STORAGE_CONFIG.s3.region
          });
          const thumbnailBuffer = await this.createThumbnail(buffer, mimeType);
          const key = `thumbnails/${filename}`;
          await s3.upload({
            Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
            Key: key,
            Body: thumbnailBuffer,
            ContentType: mimeType
          }).promise();
          return key;
        } else {
          throw new Error(`Unsupported storage type: ${IMAGE_STORAGE_CONFIG.storageType}`);
        }
      }
      /**
       * Compress image
       */
      async compressImage(buffer, mimeType) {
        if (mimeType === "image/jpeg") {
          return buffer.slice(0, Math.floor(buffer.length * 0.8));
        } else if (mimeType === "image/png") {
          return buffer.slice(0, Math.floor(buffer.length * 0.7));
        }
        return buffer;
      }
      /**
       * Create thumbnail
       */
      async createThumbnail(buffer, mimeType) {
        const thumbnailSize = 300;
        const aspectRatio = 1;
        if (buffer.length > 1024 * 1024) {
          return buffer.slice(0, 1024 * 500);
        }
        return buffer;
      }
      /**
       * Get image URL
       */
      getImageUrl(imagePath, size = "optimized") {
        if (IMAGE_STORAGE_CONFIG.storageType === "local") {
          const filename = imagePath.split("/").pop();
          return `/api/images/${size}/${filename}`;
        } else {
          return `https://${IMAGE_STORAGE_CONFIG.s3.bucket}.s3.${IMAGE_STORAGE_CONFIG.s3.region}.amazonaws.com/${imagePath}`;
        }
      }
      /**
       * Delete image files
       */
      async deleteImage(imageMetadata2) {
        try {
          if (IMAGE_STORAGE_CONFIG.storageType === "local") {
            const filesToDelete = [
              join(IMAGE_STORAGE_CONFIG.local.basePath, "originals", imageMetadata2.filename),
              join(IMAGE_STORAGE_CONFIG.local.basePath, "optimized", imageMetadata2.filename),
              join(IMAGE_STORAGE_CONFIG.local.basePath, "thumbnails", imageMetadata2.filename)
            ];
            for (const filePath of filesToDelete) {
              try {
                await unlink(filePath);
              } catch (error) {
                console.log(`File not found for deletion: ${filePath}`);
              }
            }
          } else if (IMAGE_STORAGE_CONFIG.storageType === "s3") {
            const AWS = __require("aws-sdk");
            const s3 = new AWS.S3({
              accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
              secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
              region: IMAGE_STORAGE_CONFIG.s3.region
            });
            const keysToDelete = [
              `originals/${imageMetadata2.filename}`,
              `optimized/${imageMetadata2.filename}`,
              `thumbnails/${imageMetadata2.filename}`
            ];
            for (const key of keysToDelete) {
              try {
                await s3.deleteObject({
                  Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
                  Key: key
                }).promise();
              } catch (error) {
                console.log(`File not found in S3 for deletion: ${key}`);
              }
            }
          }
          await db_default.execute(
            `DELETE FROM image_metadata WHERE hash = '${imageMetadata2.hash}'`
          );
          console.log(`Image deleted successfully: ${imageMetadata2.filename}`);
        } catch (error) {
          console.error("Failed to delete image:", error);
          throw error;
        }
      }
      /**
       * Get image by hash (for deduplication)
       */
      async getImageByHash(hash) {
        try {
          const images = await db_default.execute(
            `SELECT * FROM image_metadata WHERE hash = '${hash}' LIMIT 1`
          );
          return images.length ? images[0] : null;
        } catch (error) {
          console.error("Failed to get image by hash:", error);
          return null;
        }
      }
      /**
       * Clean up old or unused images
       */
      async cleanupOldImages(olderThanDays = 30) {
        try {
          const cutoffDate = /* @__PURE__ */ new Date();
          cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
          const oldImages = await db_default.execute(
            `SELECT * FROM image_metadata WHERE uploaded_at < '${cutoffDate.toISOString()}'`
          );
          let deletedCount = 0;
          for (const image of oldImages) {
            await this.deleteImage(image);
            deletedCount++;
          }
          console.log(`Image cleanup completed: ${deletedCount} images deleted`);
          return deletedCount;
        } catch (error) {
          console.error("Failed to cleanup old images:", error);
          throw error;
        }
      }
      /**
       * Get storage statistics
       */
      async getStorageStats() {
        try {
          const stats = await db_default.execute(
            `SELECT
          COUNT(*) as totalImages,
          SUM(size) as totalSize,
          SUM(CASE WHEN path LIKE '%originals%' THEN size ELSE 0 END) as originalSize,
          SUM(CASE WHEN path LIKE '%optimized%' THEN size ELSE 0 END) as optimizedSize,
          SUM(CASE WHEN path LIKE '%thumbnails%' THEN size ELSE 0 END) as thumbnailSize
         FROM image_metadata`
          );
          return {
            totalImages: Number(stats[0]?.totalImages || 0),
            totalSize: Number(stats[0]?.totalSize || 0),
            originalSize: Number(stats[0]?.originalSize || 0),
            optimizedSize: Number(stats[0]?.optimizedSize || 0),
            thumbnailSize: Number(stats[0]?.thumbnailSize || 0)
          };
        } catch (error) {
          console.error("Failed to get storage stats:", error);
          throw error;
        }
      }
    };
    imageStorageService = new ImageStorageService();
    imageStorageService_default = imageStorageService;
  }
});

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath as fileURLToPath2 } from "url";
import { dirname as dirname2 } from "path";
var __filename2, __dirname2, vite_config_default;
var init_vite_config = __esm({
  "vite.config.ts"() {
    "use strict";
    __filename2 = fileURLToPath2(import.meta.url);
    __dirname2 = dirname2(__filename2);
    vite_config_default = defineConfig({
      plugins: [
        react(),
        runtimeErrorOverlay()
      ],
      resolve: {
        alias: {
          "@": path2.resolve(__dirname2, "client", "src"),
          "@shared": path2.resolve(__dirname2, "shared"),
          "@assets": path2.resolve(__dirname2, "attached_assets")
        }
      },
      root: path2.resolve(__dirname2, "client"),
      build: {
        outDir: path2.resolve(__dirname2, "dist/public"),
        emptyOutDir: true
      }
    });
  }
});

// server/vite.ts
var vite_exports = {};
__export(vite_exports, {
  log: () => log,
  serveStatic: () => serveStatic,
  setupVite: () => setupVite
});
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { nanoid } from "nanoid";
import { fileURLToPath as fileURLToPath3 } from "url";
import { dirname as dirname3 } from "path";
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server }
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use((req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
      console.log("[VITE] Skipping API route:", req.originalUrl);
      return next();
    }
    console.log("[VITE] Handling non-API route:", req.originalUrl);
    vite.middlewares(req, res, next);
  });
  app2.use("*", async (req, res, next) => {
    console.log("[DEBUG] Request received for:", req.originalUrl);
    console.log("[DEBUG] User-Agent:", req.get("User-Agent"));
    if (req.originalUrl.startsWith("/api/")) {
      console.log("[DEBUG] Skipping API route");
      return next();
    }
    if (res.headersSent) {
      console.log("[DEBUG] Response already sent, skipping");
      return next();
    }
    try {
      const url = req.originalUrl;
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      console.log("[DEBUG] Attempting to serve client template from:", clientTemplate);
      if (!fs2.existsSync(clientTemplate)) {
        console.error("[ERROR] Client template not found:", clientTemplate);
        throw new Error("Client template not found");
      }
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      console.log("[DEBUG] Client template loaded, length:", template.length);
      template = template.replace(
        `src="./src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      console.log("[DEBUG] Transformed HTML, length:", page.length);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
      console.log("[DEBUG] Successfully served React app");
    } catch (e) {
      console.error("[ERROR] Failed to serve React app:", e);
      vite.ssrFixStacktrace(e);
      res.status(500).end(e.message);
    }
  });
}
function serveStatic(app2) {
  console.log("[SERVE-STATIC] Setting up static file serving...");
  const distPath = path3.resolve(__dirname3, "..", "dist", "public");
  if (!fs2.existsSync(distPath)) {
    console.error("[ERROR] Build directory not found:", distPath);
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  console.log("[SERVE-STATIC] Serving static files from:", distPath);
  app2.use(express.static(distPath));
  app2.use("*", (req, res, next) => {
    if (req.originalUrl.startsWith("/api/")) {
      console.log("[SERVE-STATIC] Skipping API route:", req.originalUrl);
      return next();
    }
    try {
      const url = req.originalUrl;
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "dist",
        "public",
        "index.html"
      );
      if (!fs2.existsSync(clientTemplate)) {
        console.error("[ERROR] Client template not found:", clientTemplate);
        return res.status(404).send("Client not built");
      }
      let template = fs2.readFileSync(clientTemplate, "utf-8");
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      console.error("[ERROR] Failed to serve static file:", e);
      next(e);
    }
  });
}
var __filename3, __dirname3, viteLogger;
var init_vite = __esm({
  "server/vite.ts"() {
    "use strict";
    init_vite_config();
    __filename3 = fileURLToPath3(import.meta.url);
    __dirname3 = dirname3(__filename3);
    viteLogger = createLogger();
  }
});

// server/index.ts
import * as dotenv6 from "dotenv";
import * as path5 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
import express3 from "express";

// server/routes.ts
init_storage_provider();
init_openai();
init_ai_service();
init_openai();
import { createServer } from "http";
import { z as z7 } from "zod";
import Stripe from "stripe";

// server/ai-cache.ts
var AICache = class {
  cache;
  ttl;
  // Time to live in milliseconds
  constructor(ttl = 30 * 60 * 1e3) {
    this.cache = /* @__PURE__ */ new Map();
    this.ttl = ttl;
  }
  // Generate a cache key from image data
  generateKey(imageData) {
    return imageData.substring(0, 32);
  }
  // Get cached data
  get(imageData) {
    const key = this.generateKey(imageData);
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }
  // Set cached data
  set(imageData, data) {
    const key = this.generateKey(imageData);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  // Clear expired entries
  clearExpired() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    });
  }
  // Get cache size
  size() {
    return this.cache.size;
  }
  // Clear all entries
  clear() {
    this.cache.clear();
  }
};
var aiCache = new AICache();

// server/routes.ts
init_db2();
init_schema();
import { eq as eq12, sql as sql28 } from "drizzle-orm";

// server/src/middleware/auth.ts
init_storage_provider();
import jwt from "jsonwebtoken";
var JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-here-1234567890123456";
var authenticate = async (req, res, next) => {
  try {
    console.log(`[AUTH] Authentication attempt for path: ${req.path}`);
    console.log(`[AUTH] JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
    console.log(`[AUTH] Headers present:`, Object.keys(req.headers));
    const authHeader = req.headers.authorization;
    console.log(`[AUTH] Authorization header present: ${!!authHeader}`);
    console.log(`[AUTH] Authorization header value: ${authHeader ? authHeader.substring(0, 50) + "..." : "null"}`);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log(`[AUTH] Missing or invalid authorization header - returning 401`);
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    console.log(`[AUTH] Token extracted, length: ${token.length}`);
    console.log(`[AUTH] Token first 20 chars: ${token.substring(0, 20)}...`);
    console.log(`[AUTH] Attempting to verify JWT token...`);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    console.log(`[AUTH] Token decoded successfully, userId: ${userId}`);
    console.log(`[AUTH] Decoded token payload:`, decoded);
    console.log(`[AUTH] Looking up user in database...`);
    const user = await storage.getUserById(userId);
    console.log(`[AUTH] User lookup result:`, user ? "found" : "not found");
    if (!user) {
      console.log(`[AUTH] User not found for userId: ${userId} - returning 401`);
      return res.status(401).json({ error: "Invalid token" });
    }
    console.log(`[AUTH] User authenticated successfully:`, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "user"
    });
    req.user = user;
    next();
  } catch (error) {
    console.error(`[AUTH] Authentication error:`, error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.log(`[AUTH] JWT verification failed - invalid token`);
      console.error(`[AUTH] JWT Error:`, error.message);
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      console.log(`[AUTH] JWT token expired`);
      console.error(`[AUTH] Token Expired Error:`, error.message);
      return res.status(401).json({ error: "Token expired" });
    }
    console.log(`[AUTH] Generic authentication failure`);
    console.error(`[AUTH] Generic Error:`, error instanceof Error ? error.message : String(error));
    res.status(401).json({ error: "Authentication failed" });
  }
};
var isAdmin = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: "Admin access required" });
  }
};
var isAuthenticated = authenticate;
var auth_default = {
  authenticate,
  isAdmin,
  isAuthenticated
};

// server/routes.ts
import * as fs3 from "fs";
import * as path4 from "path";
import multer from "multer";

// server/admin-auth.ts
var isAdmin2 = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
};

// server/src/routes/admin/dashboard.ts
import { Router } from "express";

// server/src/services/adminService.ts
init_db2();
var adminService_default = {
  async getSystemAnalytics() {
    return {
      activeUsers: 1e3,
      newUsers: 50,
      mealsTracked: 5e3,
      storageUsed: "1.5 GB"
    };
  },
  async listUsers() {
    const [users2] = await db_default.execute(
      "SELECT id, email, username, created_at FROM users"
    );
    return users2;
  },
  async updateUser(userId, updates) {
    const fields = [];
    const params = [];
    for (const [field, value] of Object.entries(updates)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    params.push(userId);
    await db_default.execute(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    return this.getUser(userId);
  },
  async getUser(userId) {
    const [users2] = await db_default.execute(
      "SELECT id, email, username FROM users WHERE id = ?",
      [userId]
    );
    return users2.length ? users2[0] : null;
  },
  async updateContent(content) {
    await db_default.execute(
      "INSERT INTO content (key, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?",
      [content.key, content.value, content.value]
    );
    return content;
  },
  async listBackups() {
    const [backups2] = await db_default.execute("SELECT * FROM backups");
    return backups2;
  },
  async createBackup() {
    const backup = {
      id: Date.now(),
      path: `/backups/backup-${Date.now()}.sql`,
      created_at: /* @__PURE__ */ new Date()
    };
    await db_default.execute(
      "INSERT INTO backups (path) VALUES (?)",
      [backup.path]
    );
    return backup;
  }
};

// server/src/controllers/adminController.ts
var adminController_default = {
  async getAnalytics(req, res) {
    try {
      const analytics = await adminService_default.getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get analytics" });
    }
  },
  async listUsers(req, res) {
    try {
      const users2 = await adminService_default.listUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ error: "Failed to list users" });
    }
  },
  async updateUser(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      const updatedUser = await adminService_default.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: "Failed to update user" });
    }
  },
  async updateContent(req, res) {
    try {
      const content = req.body;
      const result = await adminService_default.updateContent(content);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Failed to update content" });
    }
  },
  async listBackups(req, res) {
    try {
      const backups2 = await adminService_default.listBackups();
      res.json(backups2);
    } catch (error) {
      res.status(500).json({ error: "Failed to list backups" });
    }
  },
  async createBackup(req, res) {
    try {
      const backup = await adminService_default.createBackup();
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: "Failed to create backup" });
    }
  }
};

// server/src/middleware/roleCheck.ts
var requireRole = (requiredRole) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (user.role !== requiredRole) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
};

// server/src/routes/admin/dashboard.ts
var router = Router();
router.use(authenticate);
router.use(requireRole("admin"));
router.get("/analytics", adminController_default.getAnalytics);
router.get("/users", adminController_default.listUsers);
router.put("/users/:id", adminController_default.updateUser);
router.post("/content", adminController_default.updateContent);
router.get("/backups", adminController_default.listBackups);
router.post("/backups", adminController_default.createBackup);
var dashboard_default = router;

// server/src/routes/admin/users.ts
init_storage_provider();
import { Router as Router2 } from "express";
init_schema();
import { eq as eq2, like, or, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
var router2 = Router2();
router2.use(isAdmin);
router2.get("/", async (req, res) => {
  try {
    const allUsers = await storage.db.select().from(users);
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});
router2.put("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const { username, email, role, isPremium, firstName, lastName } = req.body;
    const updateData = {};
    if (username !== void 0) updateData.username = username;
    if (email !== void 0) updateData.email = email;
    if (role !== void 0) updateData.role = role;
    if (isPremium !== void 0) updateData.isPremium = isPremium;
    if (firstName !== void 0) updateData.firstName = firstName;
    if (lastName !== void 0) updateData.lastName = lastName;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    const updatedUser = await storage.db.update(users).set(updateData).where(eq2(users.id, userId)).returning();
    if (updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found or no changes made" });
    }
    res.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username or email already exists." });
    }
    res.status(500).json({ message: "Failed to update user" });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (req.user && req.user.id === userId) {
    }
    const deletedUser = await storage.db.delete(users).where(eq2(users.id, userId)).returning();
    if (deletedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});
router2.get("/advanced", async (req, res) => {
  try {
    const { search, role, premium, page = 1, limit = 50 } = req.query;
    let query = storage.db.select().from(users);
    const conditions = [];
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(users.username, searchTerm),
          like(users.email, searchTerm),
          like(users.firstName, searchTerm),
          like(users.lastName, searchTerm)
        )
      );
    }
    if (role && role !== "all") {
      conditions.push(eq2(users.role, role));
    }
    if (premium && premium !== "all") {
      conditions.push(eq2(users.isPremium, premium === "premium"));
    }
    const allUsers = await storage.db.select().from(users).orderBy(desc(users.id));
    const usersWithStats = allUsers.map((user) => ({
      ...user,
      stats: {
        totalMeals: Math.floor(Math.random() * 100) + 10,
        lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1e3).toISOString(),
        subscriptionStatus: user.isPremium ? "active" : "free",
        totalSpent: user.isPremium ? Math.floor(Math.random() * 200) + 50 : 0,
        registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1e3).toISOString()
      }
    }));
    let filteredUsers = usersWithStats;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) => user.username.toLowerCase().includes(searchLower) || user.email && user.email.toLowerCase().includes(searchLower) || user.firstName.toLowerCase().includes(searchLower) || user.lastName.toLowerCase().includes(searchLower)
      );
    }
    if (role && role !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === role);
    }
    if (premium && premium !== "all") {
      filteredUsers = filteredUsers.filter(
        (user) => premium === "premium" ? user.isPremium : !user.isPremium
      );
    }
    res.json(filteredUsers);
  } catch (error) {
    console.error("Error fetching advanced users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});
router2.get("/stats", async (req, res) => {
  try {
    const mockStats = {
      totalUsers: 1523,
      newUsersThisWeek: 45,
      newUsersThisMonth: 187,
      newUsersLastMonth: 156,
      growthRate: 19.9,
      activeToday: 89,
      dailyActiveUsers: 234,
      weeklyActiveUsers: 567,
      avgSessionDuration: "12m 34s",
      premiumUsers: 234,
      conversionRate: 15.4,
      avgRevenue: 12.99
    };
    res.json(mockStats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Failed to fetch user statistics" });
  }
});
router2.post("/", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, isPremium } = req.body;
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await storage.db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: role || "user",
      isPremium: isPremium || false
    }).returning();
    const { password: _, ...userResponse } = newUser[0];
    res.status(201).json(userResponse);
  } catch (error) {
    console.error("Error creating user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Username or email already exists" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
});
router2.post("/bulk", async (req, res) => {
  try {
    const { operation, userIds, data } = req.body;
    if (!operation || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "Invalid bulk operation request" });
    }
    let updateData = {};
    switch (operation) {
      case "make_premium":
        updateData = { isPremium: true };
        break;
      case "remove_premium":
        updateData = { isPremium: false };
        break;
      case "change_role":
        if (!data || !data.role) {
          return res.status(400).json({ message: "Role is required for role change operation" });
        }
        updateData = { role: data.role };
        break;
      case "send_email":
        console.log(`Sending email to users: ${userIds.join(", ")}`);
        return res.json({ success: true, message: `Email sent to ${userIds.length} users` });
      default:
        return res.status(400).json({ message: "Unknown bulk operation" });
    }
    for (const userId of userIds) {
      await storage.db.update(users).set(updateData).where(eq2(users.id, userId));
    }
    res.json({
      success: true,
      message: `Bulk operation '${operation}' completed for ${userIds.length} users`
    });
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    res.status(500).json({ message: "Failed to perform bulk operation" });
  }
});
router2.get("/:id/activity", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    const mockActivity = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 36e5).toISOString(),
        action: "LOGIN",
        details: "User logged in",
        ipAddress: "192.168.1.100"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 72e5).toISOString(),
        action: "AI_ANALYSIS",
        details: "Analyzed food image: burger.jpg",
        ipAddress: "192.168.1.100"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 108e5).toISOString(),
        action: "MEAL_LOGGED",
        details: "Logged breakfast: oatmeal with fruits",
        ipAddress: "192.168.1.100"
      }
    ];
    res.json(mockActivity);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Failed to fetch user activity" });
  }
});
var users_default = router2;

// server/src/routes/admin/system.ts
import { Router as Router3 } from "express";
import os from "os";
import { performance } from "perf_hooks";
import fs from "fs";
import { promisify } from "util";
var router3 = Router3();
var readFile = promisify(fs.readFile);
router3.use(isAdmin);
var systemAlerts = [
  {
    id: "alert_1",
    type: "performance",
    severity: "high",
    title: "High Memory Usage Detected",
    message: "System memory usage has exceeded 85% threshold",
    timestamp: new Date(Date.now() - 10 * 60 * 1e3).toISOString(),
    resolved: false
  },
  {
    id: "alert_2",
    type: "security",
    severity: "medium",
    title: "Multiple Failed Login Attempts",
    message: "Detected 15 failed login attempts from IP 192.168.1.100",
    timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
    resolved: false
  }
];
var systemLogs = [
  {
    id: "log_1",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: "info",
    service: "web-server",
    message: "Server started successfully on port 3000",
    metadata: { port: 3e3, env: "production" }
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 5 * 60 * 1e3).toISOString(),
    level: "warn",
    service: "database",
    message: "Database connection pool reached 80% capacity",
    metadata: { connections: 80, maxConnections: 100 }
  },
  {
    id: "log_3",
    timestamp: new Date(Date.now() - 10 * 60 * 1e3).toISOString(),
    level: "error",
    service: "ai-service",
    message: "OpenAI API rate limit exceeded",
    metadata: { provider: "openai", remainingQuota: 0 }
  }
];
router3.get("/stats", async (req, res) => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = Math.round(usedMemory / totalMemory * 100);
    const cpuUsage = Math.round(Math.random() * 100);
    const diskUsage = Math.round(Math.random() * 100);
    const uptime = os.uptime();
    const uptimeFormatted = formatUptime(uptime);
    const activeConnections = Math.floor(Math.random() * 50) + 10;
    const totalUsers = 150;
    const activeUsers = 45;
    const aiAnalysesCount = 2500;
    const stats = {
      totalUsers,
      activeUsers,
      totalMeals: 1200,
      // Mock data
      aiAnalysesCount,
      systemUptime: uptimeFormatted,
      memoryUsage,
      cpuUsage,
      diskUsage,
      activeConnections
    };
    res.json(stats);
  } catch (error) {
    console.error("Error fetching system stats:", error);
    res.status(500).json({ message: "Failed to fetch system statistics" });
  }
});
router3.get("/logs/errors", async (req, res) => {
  try {
    const mockErrorLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 36e5).toISOString(),
        level: "error",
        message: "AI service timeout: Request to OpenAI API failed",
        userId: 123
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 72e5).toISOString(),
        level: "warning",
        message: "High memory usage detected: 87%",
        userId: null
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 108e5).toISOString(),
        level: "error",
        message: "Database connection pool exhausted",
        userId: null
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 144e5).toISOString(),
        level: "info",
        message: "Scheduled backup completed successfully",
        userId: null
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 18e6).toISOString(),
        level: "warning",
        message: "Unusual number of failed login attempts detected",
        userId: 456
      }
    ];
    res.json(mockErrorLogs);
  } catch (error) {
    console.error("Error fetching error logs:", error);
    res.status(500).json({ message: "Failed to fetch error logs" });
  }
});
router3.get("/logs/activity", async (req, res) => {
  try {
    const mockActivityLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 3e5).toISOString(),
        userId: 123,
        action: "USER_LOGIN",
        details: "User logged in successfully",
        ipAddress: "192.168.1.100"
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 6e5).toISOString(),
        userId: 456,
        action: "AI_ANALYSIS",
        details: "Food image analyzed: burger.jpg",
        ipAddress: "192.168.1.101"
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 9e5).toISOString(),
        userId: 789,
        action: "SUBSCRIPTION_CREATED",
        details: "Premium subscription activated",
        ipAddress: "192.168.1.102"
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 12e5).toISOString(),
        userId: null,
        action: "SYSTEM_MAINTENANCE",
        details: "Database optimization completed",
        ipAddress: null
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 15e5).toISOString(),
        userId: 321,
        action: "PASSWORD_RESET",
        details: "Password reset request processed",
        ipAddress: "192.168.1.103"
      }
    ];
    res.json(mockActivityLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
});
router3.get("/health", async (req, res) => {
  try {
    const health = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      services: {
        database: "healthy",
        ai_service: "healthy",
        payment_service: "healthy",
        storage: "healthy"
      },
      version: process.env.npm_package_version || "1.0.0"
    };
    res.json(health);
  } catch (error) {
    console.error("Error checking system health:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});
router3.get("/performance", async (req, res) => {
  try {
    const startTime = performance.now();
    await new Promise((resolve2) => setTimeout(resolve2, 10));
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    const metrics = {
      responseTime: Math.round(responseTime * 100) / 100,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    };
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    res.status(500).json({ message: "Failed to fetch performance metrics" });
  }
});
router3.get("/metrics/detailed", async (req, res) => {
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const cachedMemory = Math.floor(Math.random() * (totalMemory * 0.2));
    const bufferMemory = Math.floor(Math.random() * (totalMemory * 0.1));
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const cpuSpeed = cpus[0]?.speed || 0;
    const metrics = {
      cpu: {
        usage: Math.floor(Math.random() * 60) + 20,
        // 20-80%
        cores: cpuCount,
        frequency: Math.round(cpuSpeed / 1e3 * 100) / 100,
        // Convert to GHz
        temperature: Math.floor(Math.random() * 20) + 45,
        // 45-65°C
        processes: Math.floor(Math.random() * 200) + 100
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        available: freeMemory,
        cached: cachedMemory,
        buffers: bufferMemory
      },
      disk: {
        used: Math.floor(Math.random() * 500) * 1024 * 1024 * 1024,
        // Random GB in bytes
        total: 1024 * 1024 * 1024 * 1024,
        // 1TB
        available: 500 * 1024 * 1024 * 1024,
        // 500GB
        readSpeed: Math.floor(Math.random() * 100) * 1024 * 1024,
        // MB/s
        writeSpeed: Math.floor(Math.random() * 80) * 1024 * 1024
        // MB/s
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1024 * 1024),
        // Random MB
        bytesOut: Math.floor(Math.random() * 1024 * 1024),
        packetsIn: Math.floor(Math.random() * 1e4),
        packetsOut: Math.floor(Math.random() * 1e4),
        connections: Math.floor(Math.random() * 100) + 50
      },
      database: {
        connections: Math.floor(Math.random() * 50) + 10,
        activeQueries: Math.floor(Math.random() * 20) + 1,
        queryTime: Math.floor(Math.random() * 50) + 5,
        cacheHitRate: Math.floor(Math.random() * 20) + 80,
        indexUsage: Math.floor(Math.random() * 15) + 85
      },
      application: {
        uptime: os.uptime(),
        responseTime: Math.floor(Math.random() * 100) + 50,
        requestsPerSecond: Math.floor(Math.random() * 1e3) + 100,
        errorRate: Math.random() * 0.05,
        userSessions: Math.floor(Math.random() * 500) + 100
      },
      ai: {
        apiCalls: Math.floor(Math.random() * 1e3) + 500,
        successRate: Math.random() * 5 + 95,
        averageLatency: Math.floor(Math.random() * 200) + 150,
        costPerHour: Math.random() * 50 + 10,
        queueLength: Math.floor(Math.random() * 20)
      }
    };
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching detailed metrics:", error);
    res.status(500).json({ message: "Failed to fetch detailed system metrics" });
  }
});
router3.get("/services/status", async (req, res) => {
  try {
    const services = [
      {
        name: "Web Server",
        status: "healthy",
        uptime: Math.floor(Math.random() * 86400) + 86400,
        // 1-2 days
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime: Math.floor(Math.random() * 50) + 10,
        dependencies: ["Database", "Redis"],
        endpoints: [
          { name: "Health Check", url: "/health", status: 200, responseTime: 25 },
          { name: "API Status", url: "/api/status", status: 200, responseTime: 15 }
        ]
      },
      {
        name: "Database",
        status: "healthy",
        uptime: Math.floor(Math.random() * 172800) + 172800,
        // 2-4 days
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime: Math.floor(Math.random() * 20) + 5,
        dependencies: [],
        endpoints: [
          { name: "Connection Pool", url: "internal", status: 200, responseTime: 5 }
        ]
      },
      {
        name: "AI Service",
        status: Math.random() > 0.1 ? "healthy" : "warning",
        uptime: Math.floor(Math.random() * 86400) + 43200,
        // 0.5-1.5 days
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime: Math.floor(Math.random() * 200) + 100,
        dependencies: ["External APIs"],
        endpoints: [
          { name: "OpenAI", url: "https://api.openai.com", status: 200, responseTime: 150 },
          { name: "Gemini", url: "https://generativelanguage.googleapis.com", status: 200, responseTime: 120 }
        ]
      },
      {
        name: "Payment Service",
        status: "healthy",
        uptime: Math.floor(Math.random() * 259200) + 259200,
        // 3-6 days
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime: Math.floor(Math.random() * 100) + 50,
        dependencies: ["Stripe API"],
        endpoints: [
          { name: "Stripe Webhook", url: "/api/stripe/webhook", status: 200, responseTime: 75 }
        ]
      },
      {
        name: "File Storage",
        status: "healthy",
        uptime: Math.floor(Math.random() * 432e3) + 432e3,
        // 5-10 days
        lastCheck: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime: Math.floor(Math.random() * 30) + 10,
        dependencies: ["AWS S3"],
        endpoints: [
          { name: "Upload Test", url: "internal", status: 200, responseTime: 25 }
        ]
      }
    ];
    res.json(services);
  } catch (error) {
    console.error("Error fetching service status:", error);
    res.status(500).json({ message: "Failed to fetch service status" });
  }
});
router3.get("/alerts", async (req, res) => {
  try {
    const { type, severity, resolved } = req.query;
    let filteredAlerts = [...systemAlerts];
    if (type && type !== "all") {
      filteredAlerts = filteredAlerts.filter((alert) => alert.type === type);
    }
    if (severity && severity !== "all") {
      filteredAlerts = filteredAlerts.filter((alert) => alert.severity === severity);
    }
    if (resolved && resolved !== "all") {
      const isResolved = resolved === "true";
      filteredAlerts = filteredAlerts.filter((alert) => alert.resolved === isResolved);
    }
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(filteredAlerts);
  } catch (error) {
    console.error("Error fetching system alerts:", error);
    res.status(500).json({ message: "Failed to fetch system alerts" });
  }
});
router3.post("/alerts/:alertId/resolve", async (req, res) => {
  try {
    const { alertId } = req.params;
    const alertIndex = systemAlerts.findIndex((alert) => alert.id === alertId);
    if (alertIndex === -1) {
      return res.status(404).json({ message: "Alert not found" });
    }
    systemAlerts[alertIndex].resolved = true;
    systemAlerts[alertIndex].resolvedBy = req.user?.email || "admin";
    systemAlerts[alertIndex].resolvedAt = (/* @__PURE__ */ new Date()).toISOString();
    res.json({
      success: true,
      message: "Alert resolved successfully",
      alert: systemAlerts[alertIndex]
    });
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ message: "Failed to resolve alert" });
  }
});
router3.get("/logs", async (req, res) => {
  try {
    const { limit = 100, level: level2, service } = req.query;
    let filteredLogs = [...systemLogs];
    if (level2) {
      filteredLogs = filteredLogs.filter((log3) => log3.level === level2);
    }
    if (service) {
      filteredLogs = filteredLogs.filter((log3) => log3.service === service);
    }
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    filteredLogs = filteredLogs.slice(0, parseInt(limit));
    res.json(filteredLogs);
  } catch (error) {
    console.error("Error fetching system logs:", error);
    res.status(500).json({ message: "Failed to fetch system logs" });
  }
});
router3.post("/services/:serviceName/restart", async (req, res) => {
  try {
    const { serviceName } = req.params;
    console.log(`Restarting service: ${serviceName}`);
    await new Promise((resolve2) => setTimeout(resolve2, 2e3));
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
      service: "system-admin",
      message: `Service ${serviceName} restarted by admin`,
      metadata: { serviceName, restartedBy: req.user?.email || "admin" }
    };
    systemLogs.unshift(logEntry);
    if (systemLogs.length > 1e3) {
      systemLogs = systemLogs.slice(0, 1e3);
    }
    res.json({
      success: true,
      message: `Service ${serviceName} restarted successfully`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error restarting service:", error);
    res.status(500).json({ message: "Failed to restart service" });
  }
});
router3.post("/maintenance", async (req, res) => {
  try {
    const { action, duration } = req.body;
    console.log(`Starting maintenance: ${action} for ${duration} minutes`);
    const logEntry = {
      id: `log_${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: "info",
      service: "system-admin",
      message: `Maintenance started: ${action}`,
      metadata: { action, duration, startedBy: req.user?.email || "admin" }
    };
    systemLogs.unshift(logEntry);
    res.json({
      success: true,
      message: "Maintenance started successfully",
      action,
      duration,
      startedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error starting maintenance:", error);
    res.status(500).json({ message: "Failed to start maintenance" });
  }
});
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
function generateRandomAlert() {
  const types = ["performance", "security", "error", "warning"];
  const severities = ["low", "medium", "high", "critical"];
  const messages = [
    "CPU usage exceeded threshold",
    "Memory usage is high",
    "Disk space running low",
    "Unusual network activity detected",
    "Database connection timeout",
    "AI service response time increased"
  ];
  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: types[Math.floor(Math.random() * types.length)],
    severity: severities[Math.floor(Math.random() * severities.length)],
    title: "System Alert",
    message: messages[Math.floor(Math.random() * messages.length)],
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    resolved: false
  };
}
setInterval(() => {
  if (Math.random() < 0.05) {
    const newAlert = generateRandomAlert();
    systemAlerts.unshift(newAlert);
    if (systemAlerts.length > 100) {
      systemAlerts = systemAlerts.slice(0, 100);
    }
  }
  if (Math.random() < 0.3) {
    const services = ["web-server", "database", "ai-service", "payment-service"];
    const levels2 = ["info", "warn", "error"];
    const messages = [
      "Request processed successfully",
      "Database query executed",
      "AI analysis completed",
      "Payment processed",
      "User session started",
      "Cache miss occurred"
    ];
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level: levels2[Math.floor(Math.random() * levels2.length)],
      service: services[Math.floor(Math.random() * services.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      metadata: { automated: true }
    };
    systemLogs.unshift(logEntry);
    if (systemLogs.length > 1e3) {
      systemLogs = systemLogs.slice(0, 1e3);
    }
  }
}, 6e4);
var system_default = router3;

// server/src/routes/admin/analytics.ts
import { Router as Router4 } from "express";
var router4 = Router4();
router4.use(isAdmin);
router4.get("/", async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;
    const analyticsData = generateAnalyticsData(timeRange);
    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
});
router4.get("/users", async (req, res) => {
  try {
    const userAnalytics = {
      totalUsers: 1523,
      newUsersThisWeek: 45,
      newUsersThisMonth: 187,
      newUsersLastMonth: 156,
      growthRate: 19.9,
      activeToday: 89,
      dailyActiveUsers: 234,
      weeklyActiveUsers: 567,
      avgSessionDuration: "12m 34s",
      premiumUsers: 234,
      conversionRate: 15.4,
      avgRevenue: 12.99
    };
    res.json(userAnalytics);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({ message: "Failed to fetch user analytics" });
  }
});
router4.get("/revenue", async (req, res) => {
  try {
    const revenueAnalytics = {
      totalRevenue: 18750.5,
      monthlyRevenue: 2340.25,
      yearlyRevenue: 15200.75,
      averageRevenuePerUser: 12.5,
      lifetimeValue: 89.4,
      churnRate: 5.2,
      monthlyRecurringRevenue: 2340.25,
      yearlyRecurringRevenue: 15200.75
    };
    res.json(revenueAnalytics);
  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    res.status(500).json({ message: "Failed to fetch revenue analytics" });
  }
});
router4.get("/features", async (req, res) => {
  try {
    const featureAnalytics = [
      { feature: "AI Food Analysis", usage: 3456, percentage: 45 },
      { feature: "Meal Planning", usage: 2134, percentage: 28 },
      { feature: "Nutrition Tracking", usage: 1567, percentage: 20 },
      { feature: "Recipe Import", usage: 432, percentage: 6 },
      { feature: "Goal Setting", usage: 89, percentage: 1 }
    ];
    res.json(featureAnalytics);
  } catch (error) {
    console.error("Error fetching feature analytics:", error);
    res.status(500).json({ message: "Failed to fetch feature analytics" });
  }
});
router4.get("/ai", async (req, res) => {
  try {
    const aiAnalytics = {
      totalAnalyses: 12456,
      averageResponseTime: 2.3,
      accuracyRate: 95.8,
      uptime: 99.2,
      costAnalysis: {
        totalCost: 234.56,
        costPerAnalysis: 0.0188,
        monthlyBudget: 500,
        budgetUsed: 46.9
      },
      providerStats: [
        { provider: "openai", usage: 8234, cost: 187.23 },
        { provider: "gemini", usage: 4222, cost: 47.33 }
      ]
    };
    res.json(aiAnalytics);
  } catch (error) {
    console.error("Error fetching AI analytics:", error);
    res.status(500).json({ message: "Failed to fetch AI analytics" });
  }
});
function generateAnalyticsData(timeRange) {
  const days = getTimeRangeDays(timeRange);
  const now = /* @__PURE__ */ new Date();
  const userGrowth = [];
  for (let i = days - 1; i >= 0; i--) {
    const date3 = new Date(now.getTime() - i * 24 * 60 * 60 * 1e3);
    userGrowth.push({
      date: date3.toISOString().split("T")[0],
      users: Math.floor(Math.random() * 50) + 100 + (days - i) * 2,
      premium: Math.floor(Math.random() * 15) + 20 + Math.floor((days - i) * 0.5)
    });
  }
  const mealAnalytics = [];
  for (let i = days - 1; i >= 0; i--) {
    const date3 = new Date(now.getTime() - i * 24 * 60 * 60 * 1e3);
    mealAnalytics.push({
      date: date3.toISOString().split("T")[0],
      analyses: Math.floor(Math.random() * 100) + 50,
      calories: Math.floor(Math.random() * 5e4) + 25e3
    });
  }
  const revenueData = [];
  for (let i = days - 1; i >= 0; i--) {
    const date3 = new Date(now.getTime() - i * 24 * 60 * 60 * 1e3);
    revenueData.push({
      date: date3.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 500) + 200,
      subscriptions: Math.floor(Math.random() * 20) + 5
    });
  }
  const featureUsage = [
    { feature: "AI Food Analysis", usage: 3456, percentage: 45 },
    { feature: "Meal Planning", usage: 2134, percentage: 28 },
    { feature: "Nutrition Tracking", usage: 1567, percentage: 20 },
    { feature: "Recipe Import", usage: 432, percentage: 6 },
    { feature: "Goal Setting", usage: 89, percentage: 1 }
  ];
  const aiProviderStats = [
    { provider: "openai", usage: 8234, cost: 187.23 },
    { provider: "gemini", usage: 4222, cost: 47.33 }
  ];
  const topFoods = [
    { food: "Burger", count: 456, calories: 520 },
    { food: "Pizza", count: 398, calories: 285 },
    { food: "Salad", count: 342, calories: 150 },
    { food: "Pasta", count: 298, calories: 220 },
    { food: "Chicken", count: 267, calories: 165 },
    { food: "Rice", count: 234, calories: 130 },
    { food: "Fish", count: 198, calories: 140 },
    { food: "Vegetables", count: 187, calories: 50 }
  ];
  const userRetention = [
    { cohort: "Jan 2024", retention: [100, 85, 72, 65, 58, 52, 48] },
    { cohort: "Feb 2024", retention: [100, 88, 75, 68, 61, 55, 51] },
    { cohort: "Mar 2024", retention: [100, 82, 70, 62, 56, 50, 46] },
    { cohort: "Apr 2024", retention: [100, 90, 78, 71, 64, 58, 54] }
  ];
  return {
    userGrowth,
    mealAnalytics,
    revenueData,
    featureUsage,
    aiProviderStats,
    topFoods,
    userRetention
  };
}
function getTimeRangeDays(timeRange) {
  switch (timeRange) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}
var analytics_default = router4;

// server/src/routes/admin/payments.ts
import { Router as Router5 } from "express";
var router5 = Router5();
router5.use(isAdmin);
router5.get("/metrics", async (req, res) => {
  try {
    const metrics = {
      totalRevenue: 24560.75,
      monthlyRevenue: 3240.5,
      yearlyRevenue: 18750.25,
      totalSubscriptions: 234,
      activeSubscriptions: 198,
      canceledSubscriptions: 36,
      churnRate: 5.2,
      averageRevenuePerUser: 12.5,
      lifetimeValue: 89.4
    };
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching payment metrics:", error);
    res.status(500).json({ message: "Failed to fetch payment metrics" });
  }
});
router5.get("/subscriptions", async (req, res) => {
  try {
    const { search, status } = req.query;
    let subscriptions2 = [
      {
        id: "sub_1ABC123",
        userId: 123,
        username: "john_doe",
        email: "john@example.com",
        status: "active",
        planId: "plan_monthly",
        planName: "Monthly Premium",
        amount: 9.99,
        currency: "usd",
        interval: "monthly",
        currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString(),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "sub_2DEF456",
        userId: 456,
        username: "jane_smith",
        email: "jane@example.com",
        status: "canceled",
        planId: "plan_yearly",
        planName: "Yearly Premium",
        amount: 99.99,
        currency: "usd",
        interval: "yearly",
        currentPeriodStart: new Date(Date.now() - 180 * 24 * 60 * 60 * 1e3).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 185 * 24 * 60 * 60 * 1e3).toISOString(),
        cancelAt: new Date(Date.now() + 185 * 24 * 60 * 60 * 1e3).toISOString(),
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1e3).toISOString()
      },
      {
        id: "sub_3GHI789",
        userId: 789,
        username: "bob_wilson",
        email: "bob@example.com",
        status: "past_due",
        planId: "plan_monthly",
        planName: "Monthly Premium",
        amount: 9.99,
        currency: "usd",
        interval: "monthly",
        currentPeriodStart: new Date(Date.now() - 45 * 24 * 60 * 60 * 1e3).toISOString(),
        currentPeriodEnd: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString()
      }
    ];
    if (search) {
      const searchLower = search.toLowerCase();
      subscriptions2 = subscriptions2.filter(
        (sub) => sub.username.toLowerCase().includes(searchLower) || sub.email.toLowerCase().includes(searchLower)
      );
    }
    if (status && status !== "all") {
      subscriptions2 = subscriptions2.filter((sub) => sub.status === status);
    }
    res.json(subscriptions2);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ message: "Failed to fetch subscriptions" });
  }
});
router5.post("/subscriptions/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Canceling subscription: ${id}`);
    res.json({
      success: true,
      message: "Subscription canceled successfully",
      canceledAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    res.status(500).json({ message: "Failed to cancel subscription" });
  }
});
router5.get("/transactions", async (req, res) => {
  try {
    const transactions2 = [
      {
        id: "pi_1ABC123",
        userId: 123,
        username: "john_doe",
        amount: 9.99,
        currency: "usd",
        status: "succeeded",
        description: "Monthly Premium Subscription",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
        subscriptionId: "sub_1ABC123"
      },
      {
        id: "pi_2DEF456",
        userId: 456,
        username: "jane_smith",
        amount: 99.99,
        currency: "usd",
        status: "succeeded",
        description: "Yearly Premium Subscription",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString(),
        subscriptionId: "sub_2DEF456"
      },
      {
        id: "pi_3GHI789",
        userId: 789,
        username: "bob_wilson",
        amount: 9.99,
        currency: "usd",
        status: "failed",
        description: "Monthly Premium Subscription",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
        subscriptionId: "sub_3GHI789"
      },
      {
        id: "pi_4JKL012",
        userId: 321,
        username: "alice_brown",
        amount: 9.99,
        currency: "usd",
        status: "pending",
        description: "Monthly Premium Subscription",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString()
      }
    ];
    res.json(transactions2);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});
router5.post("/refund", async (req, res) => {
  try {
    const { transactionId, amount, reason } = req.body;
    if (!transactionId || !amount || !reason) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    console.log(`Processing refund for transaction ${transactionId}: $${amount} - ${reason}`);
    res.json({
      success: true,
      message: "Refund processed successfully",
      refundId: `re_${Date.now()}`,
      amount,
      processedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({ message: "Failed to process refund" });
  }
});
router5.get("/methods", async (req, res) => {
  try {
    const paymentMethods2 = [
      {
        id: "pm_1ABC123",
        userId: 123,
        type: "card",
        brand: "visa",
        last4: "4242",
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      },
      {
        id: "pm_2DEF456",
        userId: 456,
        type: "card",
        brand: "mastercard",
        last4: "8888",
        expMonth: 8,
        expYear: 2026,
        isDefault: true
      },
      {
        id: "pm_3GHI789",
        userId: 789,
        type: "card",
        brand: "amex",
        last4: "0005",
        expMonth: 3,
        expYear: 2025,
        isDefault: false
      }
    ];
    res.json(paymentMethods2);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    res.status(500).json({ message: "Failed to fetch payment methods" });
  }
});
router5.get("/reports/revenue", async (req, res) => {
  try {
    const { period = "monthly" } = req.query;
    const report = generateRevenueReport(period);
    res.json(report);
  } catch (error) {
    console.error("Error generating revenue report:", error);
    res.status(500).json({ message: "Failed to generate revenue report" });
  }
});
router5.get("/analysis/churn", async (req, res) => {
  try {
    const churnAnalysis = {
      overallChurnRate: 5.2,
      monthlyChurnRate: 4.8,
      churnReasons: [
        { reason: "Price too high", percentage: 35 },
        { reason: "Not using enough", percentage: 28 },
        { reason: "Found alternative", percentage: 18 },
        { reason: "Technical issues", percentage: 12 },
        { reason: "Other", percentage: 7 }
      ],
      churnPrevention: {
        at_risk_users: 23,
        retention_campaigns: 5,
        win_back_rate: 15.3
      }
    };
    res.json(churnAnalysis);
  } catch (error) {
    console.error("Error fetching churn analysis:", error);
    res.status(500).json({ message: "Failed to fetch churn analysis" });
  }
});
function generateRevenueReport(period) {
  const now = /* @__PURE__ */ new Date();
  const data = [];
  const periods = period === "weekly" ? 12 : period === "yearly" ? 5 : 12;
  const timeUnit = period === "weekly" ? 7 : period === "yearly" ? 365 : 30;
  for (let i = periods - 1; i >= 0; i--) {
    const date3 = new Date(now.getTime() - i * timeUnit * 24 * 60 * 60 * 1e3);
    const revenue = Math.floor(Math.random() * 5e3) + 2e3;
    const subscriptions2 = Math.floor(Math.random() * 50) + 20;
    data.push({
      period: formatPeriod(date3, period),
      revenue,
      subscriptions: subscriptions2,
      averageRevenuePerUser: Math.round(revenue / subscriptions2 * 100) / 100
    });
  }
  return {
    period,
    data,
    totalRevenue: data.reduce((sum, item) => sum + item.revenue, 0),
    totalSubscriptions: data.reduce((sum, item) => sum + item.subscriptions, 0)
  };
}
function formatPeriod(date3, period) {
  if (period === "weekly") {
    return `Week of ${date3.toISOString().split("T")[0]}`;
  } else if (period === "yearly") {
    return date3.getFullYear().toString();
  } else {
    return date3.toISOString().slice(0, 7);
  }
}
var payments_default = router5;

// server/src/routes/admin/settings.ts
import { Router as Router6 } from "express";
var router6 = Router6();
router6.use(isAdmin);
var appSettings = {
  general: {
    siteName: "AI Calorie Tracker",
    siteDescription: "Advanced AI-powered food analysis and nutrition tracking",
    supportEmail: "support@aicalorietracker.com",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true
  },
  ai: {
    defaultProvider: "openai",
    maxAnalysesPerDay: 10,
    enableAutoAnalysis: true,
    analysisTimeout: 30
  },
  payment: {
    stripeEnabled: true,
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    trialDays: 7,
    currency: "usd"
  },
  email: {
    provider: "smtp",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",
    fromAddress: "noreply@aicalorietracker.com",
    fromName: "AI Calorie Tracker"
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 1440,
    // 24 hours in minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    // minutes
    twoFactorEnabled: false
  },
  notifications: {
    emailEnabled: true,
    pushEnabled: false,
    slackWebhook: "",
    discordWebhook: ""
  },
  storage: {
    provider: "local",
    maxFileSize: 10,
    // MB
    allowedTypes: ["jpg", "jpeg", "png", "gif", "webp"],
    retentionDays: 90
  },
  performance: {
    cacheEnabled: true,
    cacheTtl: 3600,
    // 1 hour
    compressionEnabled: true,
    rateLimitEnabled: true
  }
};
router6.get("/", async (req, res) => {
  try {
    const sanitizedSettings = {
      ...appSettings,
      email: {
        ...appSettings.email,
        smtpPassword: appSettings.email.smtpPassword ? "***CONFIGURED***" : ""
      }
    };
    res.json(sanitizedSettings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
});
router6.put("/:section", async (req, res) => {
  try {
    const section = req.params.section;
    const newSettings = req.body;
    if (!(section in appSettings)) {
      return res.status(400).json({ message: "Invalid settings section" });
    }
    appSettings = {
      ...appSettings,
      [section]: {
        ...appSettings[section],
        ...newSettings
      }
    };
    console.log(`Updated ${section} settings:`, newSettings);
    res.json({
      success: true,
      message: `${section} settings updated successfully`,
      settings: appSettings[section]
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(500).json({ message: "Failed to update settings" });
  }
});
router6.get("/:section", async (req, res) => {
  try {
    const section = req.params.section;
    if (!(section in appSettings)) {
      return res.status(400).json({ message: "Invalid settings section" });
    }
    let sectionData = appSettings[section];
    if (section === "email") {
      sectionData = {
        ...sectionData,
        smtpPassword: sectionData.smtpPassword ? "***CONFIGURED***" : ""
      };
    }
    res.json(sectionData);
  } catch (error) {
    console.error("Error fetching settings section:", error);
    res.status(500).json({ message: "Failed to fetch settings section" });
  }
});
router6.post("/test-email", async (req, res) => {
  try {
    console.log("Sending test email with settings:", {
      provider: appSettings.email.provider,
      host: appSettings.email.smtpHost,
      port: appSettings.email.smtpPort,
      from: appSettings.email.fromAddress
    });
    await new Promise((resolve2) => setTimeout(resolve2, 1e3));
    res.json({
      success: true,
      message: "Test email sent successfully",
      sentTo: appSettings.general.supportEmail
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    res.status(500).json({ message: "Failed to send test email" });
  }
});
router6.post("/:section/reset", async (req, res) => {
  try {
    const section = req.params.section;
    if (!(section in appSettings)) {
      return res.status(400).json({ message: "Invalid settings section" });
    }
    const defaultSettings = {
      general: {
        siteName: "AI Calorie Tracker",
        siteDescription: "Advanced AI-powered food analysis and nutrition tracking",
        supportEmail: "support@aicalorietracker.com",
        maintenanceMode: false,
        registrationEnabled: true,
        emailVerificationRequired: true
      },
      ai: {
        defaultProvider: "openai",
        maxAnalysesPerDay: 10,
        enableAutoAnalysis: true,
        analysisTimeout: 30
      },
      payment: {
        stripeEnabled: true,
        monthlyPrice: 9.99,
        yearlyPrice: 99.99,
        trialDays: 7,
        currency: "usd"
      },
      email: {
        provider: "smtp",
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        smtpUsername: "",
        smtpPassword: "",
        fromAddress: "noreply@aicalorietracker.com",
        fromName: "AI Calorie Tracker"
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 1440,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        twoFactorEnabled: false
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: false,
        slackWebhook: "",
        discordWebhook: ""
      },
      storage: {
        provider: "local",
        maxFileSize: 10,
        allowedTypes: ["jpg", "jpeg", "png", "gif", "webp"],
        retentionDays: 90
      },
      performance: {
        cacheEnabled: true,
        cacheTtl: 3600,
        compressionEnabled: true,
        rateLimitEnabled: true
      }
    };
    appSettings = {
      ...appSettings,
      [section]: defaultSettings[section]
    };
    res.json({
      success: true,
      message: `${section} settings reset to defaults`,
      settings: appSettings[section]
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ message: "Failed to reset settings" });
  }
});
router6.get("/export/backup", async (req, res) => {
  try {
    const backup = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0",
      settings: appSettings
    };
    res.setHeader("Content-Disposition", "attachment; filename=settings-backup.json");
    res.setHeader("Content-Type", "application/json");
    res.json(backup);
  } catch (error) {
    console.error("Error exporting settings:", error);
    res.status(500).json({ message: "Failed to export settings" });
  }
});
router6.post("/import/backup", async (req, res) => {
  try {
    const { settings, version } = req.body;
    if (!settings) {
      return res.status(400).json({ message: "Settings data is required" });
    }
    const requiredSections = ["general", "ai", "payment", "email", "security", "notifications", "storage", "performance"];
    for (const section of requiredSections) {
      if (!(section in settings)) {
        return res.status(400).json({ message: `Missing required section: ${section}` });
      }
    }
    appSettings = settings;
    console.log(`Settings imported from backup (version: ${version || "unknown"})`);
    res.json({
      success: true,
      message: "Settings imported successfully",
      importedVersion: version || "unknown"
    });
  } catch (error) {
    console.error("Error importing settings:", error);
    res.status(500).json({ message: "Failed to import settings" });
  }
});
router6.get("/system/info", async (req, res) => {
  try {
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      environment: process.env.NODE_ENV || "development",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    res.json(systemInfo);
  } catch (error) {
    console.error("Error fetching system info:", error);
    res.status(500).json({ message: "Failed to fetch system info" });
  }
});
var settings_default = router6;

// server/src/routes/admin/backup.ts
import { Router as Router7 } from "express";
var router7 = Router7();
router7.use(isAdmin);
var backups = [
  {
    id: "backup_1",
    name: "Weekly Full Backup",
    type: "full",
    size: "2.4 GB",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString(),
    status: "completed",
    downloadUrl: "/api/admin/backup/backup_1/download"
  },
  {
    id: "backup_2",
    name: "Settings Backup",
    type: "settings",
    size: "1.2 MB",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1e3).toISOString(),
    status: "completed",
    downloadUrl: "/api/admin/backup/backup_2/download"
  },
  {
    id: "backup_3",
    name: "Emergency Backup",
    type: "data",
    size: "1.8 GB",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
    status: "failed"
  }
];
router7.get("/stats", async (req, res) => {
  try {
    const completedBackups = backups.filter((b) => b.status === "completed");
    const lastBackupTimestamp = completedBackups.length > 0 ? Math.max(...completedBackups.map((b) => new Date(b.createdAt).getTime())) : null;
    const stats = {
      totalBackups: backups.length,
      totalSize: "4.2 GB",
      lastBackup: lastBackupTimestamp ? new Date(lastBackupTimestamp).toISOString() : null,
      nextScheduledBackup: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString(),
      storageUsed: 4200,
      // MB
      storageLimit: 10240
      // MB (10 GB)
    };
    res.json(stats);
  } catch (error) {
    console.error("Error fetching backup stats:", error);
    res.status(500).json({ message: "Failed to fetch backup statistics" });
  }
});
router7.get("/", async (req, res) => {
  try {
    const sortedBackups = [...backups].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(sortedBackups);
  } catch (error) {
    console.error("Error fetching backups:", error);
    res.status(500).json({ message: "Failed to fetch backups" });
  }
});
router7.post("/create", async (req, res) => {
  try {
    const { type, name } = req.body;
    if (!type || !name) {
      return res.status(400).json({ message: "Type and name are required" });
    }
    const backupId = `backup_${Date.now()}`;
    const newBackup = {
      id: backupId,
      name: name.trim(),
      type,
      size: generateRandomSize(type),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "completed",
      downloadUrl: `/api/admin/backup/${backupId}/download`
    };
    backups.push(newBackup);
    console.log(`Created backup: ${name} (${type})`);
    res.status(201).json({
      success: true,
      message: "Backup created successfully",
      backup: newBackup
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({ message: "Failed to create backup" });
  }
});
router7.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const backupIndex = backups.findIndex((b) => b.id === id);
    if (backupIndex === -1) {
      return res.status(404).json({ message: "Backup not found" });
    }
    const deletedBackup = backups.splice(backupIndex, 1)[0];
    console.log(`Deleted backup: ${deletedBackup.name}`);
    res.json({
      success: true,
      message: "Backup deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting backup:", error);
    res.status(500).json({ message: "Failed to delete backup" });
  }
});
router7.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;
    const backup = backups.find((b) => b.id === id);
    if (!backup) {
      return res.status(404).json({ message: "Backup not found" });
    }
    if (backup.status !== "completed") {
      return res.status(400).json({ message: "Backup is not ready for download" });
    }
    res.setHeader("Content-Disposition", `attachment; filename="${backup.name}.zip"`);
    res.setHeader("Content-Type", "application/zip");
    const mockContent = JSON.stringify({
      backupInfo: backup,
      data: "Mock backup content - in a real app, this would be actual backup data",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }, null, 2);
    res.send(mockContent);
  } catch (error) {
    console.error("Error downloading backup:", error);
    res.status(500).json({ message: "Failed to download backup" });
  }
});
router7.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    const backup = backups.find((b) => b.id === id);
    if (!backup) {
      return res.status(404).json({ message: "Backup not found" });
    }
    if (backup.status !== "completed") {
      return res.status(400).json({ message: "Cannot restore incomplete backup" });
    }
    console.log(`Restoring backup: ${backup.name}`);
    await new Promise((resolve2) => setTimeout(resolve2, 2e3));
    res.json({
      success: true,
      message: "Backup restored successfully",
      restoredBackup: backup
    });
  } catch (error) {
    console.error("Error restoring backup:", error);
    res.status(500).json({ message: "Failed to restore backup" });
  }
});
router7.get("/schedule", async (req, res) => {
  try {
    const schedule = {
      enabled: true,
      frequency: "weekly",
      time: "02:00",
      timezone: "UTC",
      retentionDays: 30,
      maxBackups: 10,
      autoCleanup: true,
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
    };
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching backup schedule:", error);
    res.status(500).json({ message: "Failed to fetch backup schedule" });
  }
});
router7.put("/schedule", async (req, res) => {
  try {
    const scheduleData = req.body;
    console.log("Updated backup schedule:", scheduleData);
    res.json({
      success: true,
      message: "Backup schedule updated successfully",
      schedule: scheduleData
    });
  } catch (error) {
    console.error("Error updating backup schedule:", error);
    res.status(500).json({ message: "Failed to update backup schedule" });
  }
});
router7.post("/export/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ["settings", "users", "logs", "ai-configs"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: "Invalid export type" });
    }
    let exportData;
    switch (type) {
      case "settings":
        exportData = {
          type: "settings",
          data: "Mock settings data",
          exportedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        break;
      case "users":
        exportData = {
          type: "users",
          data: "Mock user data",
          exportedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        break;
      case "logs":
        exportData = {
          type: "logs",
          data: "Mock log data",
          exportedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        break;
      case "ai-configs":
        exportData = {
          type: "ai-configs",
          data: "Mock AI configuration data",
          exportedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        break;
    }
    res.setHeader("Content-Disposition", `attachment; filename="${type}-export.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ message: "Failed to export data" });
  }
});
router7.post("/import", async (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData) {
      return res.status(400).json({ message: "Backup data is required" });
    }
    console.log("Importing backup data...");
    res.json({
      success: true,
      message: "Backup imported successfully",
      importedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error importing backup:", error);
    res.status(500).json({ message: "Failed to import backup" });
  }
});
function generateRandomSize(type) {
  const sizes = {
    full: () => `${(Math.random() * 3 + 1).toFixed(1)} GB`,
    settings: () => `${(Math.random() * 5 + 1).toFixed(1)} MB`,
    data: () => `${(Math.random() * 2 + 0.5).toFixed(1)} GB`,
    logs: () => `${(Math.random() * 100 + 50).toFixed(0)} MB`
  };
  return sizes[type]?.() || "1.0 MB";
}
var backup_default = router7;

// server/src/routes/admin/security.ts
import { Router as Router8 } from "express";
var router8 = Router8();
router8.use(isAdmin);
var securityEvents = [
  {
    id: "sec_1",
    type: "failed_login",
    severity: "medium",
    user: { id: "user_1", email: "john@example.com", name: "John Doe" },
    timestamp: new Date(Date.now() - 60 * 60 * 1e3).toISOString(),
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    location: "New York, US",
    details: "Multiple failed login attempts",
    status: "investigating"
  },
  {
    id: "sec_2",
    type: "suspicious_activity",
    severity: "high",
    user: { id: "user_2", email: "suspicious@example.com", name: "Suspicious User" },
    timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
    ipAddress: "10.0.0.50",
    userAgent: "curl/7.68.0",
    location: "Unknown",
    details: "Unusual API usage pattern detected",
    status: "pending"
  },
  {
    id: "sec_3",
    type: "api_abuse",
    severity: "critical",
    user: { id: "user_3", email: "bot@example.com", name: "Bot User" },
    timestamp: new Date(Date.now() - 15 * 60 * 1e3).toISOString(),
    ipAddress: "203.0.113.0",
    userAgent: "Python-urllib/3.9",
    location: "Singapore",
    details: "Rate limit exceeded by 1000%",
    status: "blocked"
  }
];
var blockedIPs = [
  {
    id: "blocked_1",
    ipAddress: "203.0.113.0",
    reason: "API abuse - rate limit exceeded",
    blockedAt: new Date(Date.now() - 15 * 60 * 1e3).toISOString(),
    blockedBy: "admin@system.com",
    attempts: 5e3,
    isActive: true
  },
  {
    id: "blocked_2",
    ipAddress: "198.51.100.0",
    reason: "Multiple failed login attempts",
    blockedAt: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
    blockedBy: "security-system",
    attempts: 25,
    isActive: true
  }
];
router8.get("/metrics", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const recentEvents = securityEvents.filter((e) => new Date(e.timestamp) >= last24h);
    const metrics = {
      totalEvents: securityEvents.length,
      criticalEvents: securityEvents.filter((e) => e.severity === "critical").length,
      blockedIPs: blockedIPs.filter((ip) => ip.isActive).length,
      failedLogins: securityEvents.filter((e) => e.type === "failed_login").length,
      suspiciousActivities: securityEvents.filter((e) => e.type === "suspicious_activity").length,
      activeThreats: securityEvents.filter((e) => e.status === "pending" || e.status === "investigating").length
    };
    res.json(metrics);
  } catch (error) {
    console.error("Error fetching security metrics:", error);
    res.status(500).json({ message: "Failed to fetch security metrics" });
  }
});
router8.get("/events", async (req, res) => {
  try {
    const { severity, timeRange } = req.query;
    let filteredEvents = [...securityEvents];
    if (severity && severity !== "all") {
      filteredEvents = filteredEvents.filter((e) => e.severity === severity);
    }
    if (timeRange) {
      const now = /* @__PURE__ */ new Date();
      let cutoffTime;
      switch (timeRange) {
        case "1h":
          cutoffTime = new Date(now.getTime() - 60 * 60 * 1e3);
          break;
        case "24h":
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
          break;
        case "7d":
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "30d":
          cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
          break;
        default:
          cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      }
      filteredEvents = filteredEvents.filter((e) => new Date(e.timestamp) >= cutoffTime);
    }
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(filteredEvents);
  } catch (error) {
    console.error("Error fetching security events:", error);
    res.status(500).json({ message: "Failed to fetch security events" });
  }
});
router8.post("/events/:eventId/resolve", async (req, res) => {
  try {
    const { eventId } = req.params;
    const eventIndex = securityEvents.findIndex((e) => e.id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ message: "Security event not found" });
    }
    securityEvents[eventIndex].status = "resolved";
    res.json({
      success: true,
      message: "Security event resolved successfully"
    });
  } catch (error) {
    console.error("Error resolving security event:", error);
    res.status(500).json({ message: "Failed to resolve security event" });
  }
});
router8.get("/blocked-ips", async (req, res) => {
  try {
    const sortedIPs = [...blockedIPs].sort(
      (a, b) => new Date(b.blockedAt).getTime() - new Date(a.blockedAt).getTime()
    );
    res.json(sortedIPs);
  } catch (error) {
    console.error("Error fetching blocked IPs:", error);
    res.status(500).json({ message: "Failed to fetch blocked IPs" });
  }
});
router8.post("/block-ip", async (req, res) => {
  try {
    const { ipAddress, reason } = req.body;
    if (!ipAddress || !reason) {
      return res.status(400).json({ message: "IP address and reason are required" });
    }
    const existingBlock = blockedIPs.find((ip) => ip.ipAddress === ipAddress && ip.isActive);
    if (existingBlock) {
      return res.status(400).json({ message: "IP address is already blocked" });
    }
    const newBlock = {
      id: `blocked_${Date.now()}`,
      ipAddress,
      reason,
      blockedAt: (/* @__PURE__ */ new Date()).toISOString(),
      blockedBy: req.user?.email || "admin",
      attempts: 1,
      isActive: true
    };
    blockedIPs.push(newBlock);
    console.log(`Blocked IP ${ipAddress}: ${reason}`);
    res.status(201).json({
      success: true,
      message: "IP address blocked successfully",
      blockedIP: newBlock
    });
  } catch (error) {
    console.error("Error blocking IP:", error);
    res.status(500).json({ message: "Failed to block IP address" });
  }
});
router8.delete("/unblock-ip/:ipId", async (req, res) => {
  try {
    const { ipId } = req.params;
    const ipIndex = blockedIPs.findIndex((ip) => ip.id === ipId);
    if (ipIndex === -1) {
      return res.status(404).json({ message: "Blocked IP not found" });
    }
    blockedIPs[ipIndex].isActive = false;
    console.log(`Unblocked IP ${blockedIPs[ipIndex].ipAddress}`);
    res.json({
      success: true,
      message: "IP address unblocked successfully"
    });
  } catch (error) {
    console.error("Error unblocking IP:", error);
    res.status(500).json({ message: "Failed to unblock IP address" });
  }
});
router8.get("/settings", async (req, res) => {
  try {
    const settings = {
      autoBlockSuspiciousIPs: true,
      rateLimitingEnabled: true,
      failedLoginMonitoring: true,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      // minutes
      emailAlertsEnabled: true,
      slackNotificationsEnabled: false,
      alertThreshold: "medium",
      adminEmail: "admin@aicalorietracker.com",
      twoFactorRequired: false,
      passwordMinLength: 8,
      sessionTimeout: 1440,
      // minutes (24 hours)
      requireStrongPasswords: true,
      allowPasswordReuse: false
    };
    res.json(settings);
  } catch (error) {
    console.error("Error fetching security settings:", error);
    res.status(500).json({ message: "Failed to fetch security settings" });
  }
});
router8.put("/settings", async (req, res) => {
  try {
    const settings = req.body;
    console.log("Updated security settings:", settings);
    res.json({
      success: true,
      message: "Security settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating security settings:", error);
    res.status(500).json({ message: "Failed to update security settings" });
  }
});
router8.get("/report", async (req, res) => {
  try {
    const { timeRange = "30d", format: format3 = "json" } = req.query;
    const now = /* @__PURE__ */ new Date();
    let cutoffTime;
    switch (timeRange) {
      case "7d":
        cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
        break;
      case "30d":
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
        break;
      case "90d":
        cutoffTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1e3);
        break;
      default:
        cutoffTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
    }
    const eventsInRange = securityEvents.filter((e) => new Date(e.timestamp) >= cutoffTime);
    const blocksInRange = blockedIPs.filter((ip) => new Date(ip.blockedAt) >= cutoffTime);
    const report = {
      reportGenerated: (/* @__PURE__ */ new Date()).toISOString(),
      timeRange,
      summary: {
        totalEvents: eventsInRange.length,
        eventsBySeverity: {
          critical: eventsInRange.filter((e) => e.severity === "critical").length,
          high: eventsInRange.filter((e) => e.severity === "high").length,
          medium: eventsInRange.filter((e) => e.severity === "medium").length,
          low: eventsInRange.filter((e) => e.severity === "low").length
        },
        eventsByType: {
          failed_login: eventsInRange.filter((e) => e.type === "failed_login").length,
          suspicious_activity: eventsInRange.filter((e) => e.type === "suspicious_activity").length,
          api_abuse: eventsInRange.filter((e) => e.type === "api_abuse").length,
          password_change: eventsInRange.filter((e) => e.type === "password_change").length,
          admin_action: eventsInRange.filter((e) => e.type === "admin_action").length
        },
        totalIPBlocks: blocksInRange.length,
        activeBlocks: blocksInRange.filter((ip) => ip.isActive).length
      },
      events: eventsInRange,
      blockedIPs: blocksInRange
    };
    if (format3 === "csv") {
      const csvData = convertToCSV(report);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=security-report-${timeRange}.csv`);
      res.send(csvData);
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=security-report-${timeRange}.json`);
      res.json(report);
    }
  } catch (error) {
    console.error("Error generating security report:", error);
    res.status(500).json({ message: "Failed to generate security report" });
  }
});
router8.post("/simulate-event", async (req, res) => {
  try {
    const { type, severity, userId, ipAddress } = req.body;
    const newEvent = {
      id: `sec_${Date.now()}`,
      type: type || "suspicious_activity",
      severity: severity || "medium",
      user: {
        id: userId || "unknown",
        email: "test@example.com",
        name: "Test User"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: "Test-Agent/1.0",
      location: "Test Location",
      details: `Simulated ${type} event`,
      status: "pending"
    };
    securityEvents.push(newEvent);
    res.status(201).json({
      success: true,
      message: "Security event simulated successfully",
      event: newEvent
    });
  } catch (error) {
    console.error("Error simulating security event:", error);
    res.status(500).json({ message: "Failed to simulate security event" });
  }
});
function convertToCSV(report) {
  const headers = ["Timestamp", "Type", "Severity", "User Email", "IP Address", "Details", "Status"];
  const csvRows = [headers.join(",")];
  report.events.forEach((event) => {
    const row = [
      event.timestamp,
      event.type,
      event.severity,
      event.user.email,
      event.ipAddress,
      `"${event.details}"`,
      event.status
    ];
    csvRows.push(row.join(","));
  });
  return csvRows.join("\n");
}
var security_default = router8;

// server/src/routes/admin/notifications.ts
import { Router as Router9 } from "express";
var router9 = Router9();
router9.use(isAdmin);
var notifications = [
  {
    id: "notif_1",
    title: "System Maintenance Scheduled",
    message: "Scheduled maintenance will occur tomorrow from 2 AM to 4 AM EST. All services will be temporarily unavailable.",
    type: "warning",
    priority: "high",
    status: "sent",
    channels: ["email", "push"],
    recipients: {
      type: "all",
      count: 1250
    },
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString(),
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1e3).toISOString(),
    createdBy: "admin@system.com",
    openRate: 78.5,
    clickRate: 12.3
  },
  {
    id: "notif_2",
    title: "Premium Feature Update",
    message: "New AI analysis features are now available for premium users. Upgrade today to access advanced nutrition insights!",
    type: "info",
    priority: "medium",
    status: "draft",
    channels: ["email"],
    recipients: {
      type: "free",
      count: 850
    },
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1e3).toISOString(),
    sentAt: "",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1e3).toISOString(),
    createdBy: "marketing@system.com",
    openRate: 0,
    clickRate: 0
  }
];
var templates = [
  {
    id: "template_1",
    name: "Welcome Email",
    subject: "Welcome to {{siteName}}!",
    content: "Hello {{userName}}, welcome to our platform!",
    type: "email",
    variables: ["siteName", "userName"],
    isActive: true
  },
  {
    id: "template_2",
    name: "Security Alert",
    subject: "Security Alert - {{alertType}}",
    content: "We detected {{alertType}} on your account from {{location}}.",
    type: "email",
    variables: ["alertType", "location"],
    isActive: true
  }
];
router9.get("/stats", async (req, res) => {
  try {
    const stats = {
      totalSent: notifications.filter((n) => n.status === "sent").length,
      totalScheduled: notifications.filter((n) => n.status === "scheduled").length,
      averageOpenRate: 65.2,
      averageClickRate: 8.7,
      failedDeliveries: 23,
      activeSubscribers: 1250
    };
    res.json(stats);
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({ message: "Failed to fetch notification statistics" });
  }
});
router9.get("/", async (req, res) => {
  try {
    const { type, status } = req.query;
    let filteredNotifications = [...notifications];
    if (type && type !== "all") {
      filteredNotifications = filteredNotifications.filter((n) => n.type === type);
    }
    if (status && status !== "all") {
      filteredNotifications = filteredNotifications.filter((n) => n.status === status);
    }
    filteredNotifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(filteredNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});
router9.post("/", async (req, res) => {
  try {
    const { title, message, type, priority, channels, recipients } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required" });
    }
    let recipientCount = 0;
    switch (recipients.type) {
      case "all":
        recipientCount = 1250;
        break;
      case "premium":
        recipientCount = 400;
        break;
      case "free":
        recipientCount = 850;
        break;
      case "custom":
        recipientCount = recipients.customList?.length || 0;
        break;
    }
    const newNotification = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type: type || "info",
      priority: priority || "medium",
      status: "draft",
      channels: channels || ["email"],
      recipients: {
        ...recipients,
        count: recipientCount
      },
      scheduledAt: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
      // Default to 1 hour from now
      sentAt: "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      createdBy: req.user?.email || "admin",
      openRate: 0,
      clickRate: 0
    };
    notifications.push(newNotification);
    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});
router9.post("/:id/send", async (req, res) => {
  try {
    const { id } = req.params;
    const notificationIndex = notifications.findIndex((n) => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Notification not found" });
    }
    const notification = notifications[notificationIndex];
    if (notification.status !== "draft" && notification.status !== "scheduled") {
      return res.status(400).json({ message: "Notification cannot be sent" });
    }
    notifications[notificationIndex] = {
      ...notification,
      status: "sent",
      sentAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log(`Sending notification: ${notification.title} to ${notification.recipients.count} recipients`);
    notification.channels.forEach((channel) => {
      console.log(`- Sending via ${channel}`);
    });
    res.json({
      success: true,
      message: "Notification sent successfully",
      notification: notifications[notificationIndex]
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
});
router9.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const notificationIndex = notifications.findIndex((n) => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Notification not found" });
    }
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...updateData
    };
    res.json({
      success: true,
      message: "Notification updated successfully",
      notification: notifications[notificationIndex]
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});
router9.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const notificationIndex = notifications.findIndex((n) => n.id === id);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: "Notification not found" });
    }
    const deletedNotification = notifications.splice(notificationIndex, 1)[0];
    res.json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});
router9.get("/templates", async (req, res) => {
  try {
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});
router9.post("/templates", async (req, res) => {
  try {
    const { name, subject, content, type, variables } = req.body;
    if (!name || !subject || !content) {
      return res.status(400).json({ message: "Name, subject, and content are required" });
    }
    const newTemplate = {
      id: `template_${Date.now()}`,
      name,
      subject,
      content,
      type: type || "email",
      variables: variables || [],
      isActive: true
    };
    templates.push(newTemplate);
    res.status(201).json({
      success: true,
      message: "Template created successfully",
      template: newTemplate
    });
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ message: "Failed to create template" });
  }
});
router9.put("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const templateIndex = templates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ message: "Template not found" });
    }
    templates[templateIndex] = {
      ...templates[templateIndex],
      ...updateData
    };
    res.json({
      success: true,
      message: "Template updated successfully",
      template: templates[templateIndex]
    });
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Failed to update template" });
  }
});
router9.delete("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const templateIndex = templates.findIndex((t) => t.id === id);
    if (templateIndex === -1) {
      return res.status(404).json({ message: "Template not found" });
    }
    templates.splice(templateIndex, 1);
    res.json({
      success: true,
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Failed to delete template" });
  }
});
router9.get("/settings", async (req, res) => {
  try {
    const settings = {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      slackEnabled: false,
      defaultSendTime: "09:00",
      maxDailyNotifications: 5,
      retryFailedDeliveries: 3,
      deliveryConfirmation: true,
      unsubscribeEnabled: true,
      personalizedContent: true
    };
    res.json(settings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ message: "Failed to fetch notification settings" });
  }
});
router9.put("/settings", async (req, res) => {
  try {
    const settings = req.body;
    console.log("Updated notification settings:", settings);
    res.json({
      success: true,
      message: "Notification settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ message: "Failed to update notification settings" });
  }
});
router9.post("/test", async (req, res) => {
  try {
    const { channel, recipient } = req.body;
    if (!channel || !recipient) {
      return res.status(400).json({ message: "Channel and recipient are required" });
    }
    console.log(`Sending test ${channel} notification to ${recipient}`);
    await new Promise((resolve2) => setTimeout(resolve2, 1e3));
    res.json({
      success: true,
      message: `Test ${channel} notification sent to ${recipient}`,
      sentAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Failed to send test notification" });
  }
});
router9.get("/analytics", async (req, res) => {
  try {
    const { timeRange = "30d" } = req.query;
    const analytics = {
      timeRange,
      deliveryMetrics: {
        emailDeliveryRate: 95.2,
        pushDeliveryRate: 87.8,
        smsDeliveryRate: 99.1,
        averageOpenRate: 24.3
      },
      engagementMetrics: {
        clickThroughRate: 3.2,
        unsubscribeRate: 0.8,
        bounceRate: 2.1,
        complaintRate: 0.1
      },
      channelPerformance: [
        { channel: "email", sent: 1250, delivered: 1190, opened: 289, clicked: 38 },
        { channel: "push", sent: 890, delivered: 782, opened: 234, clicked: 31 },
        { channel: "sms", sent: 450, delivered: 446, opened: 178, clicked: 12 }
      ],
      topPerformingNotifications: notifications.filter((n) => n.status === "sent").sort((a, b) => (b.openRate || 0) - (a.openRate || 0)).slice(0, 5)
    };
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching notification analytics:", error);
    res.status(500).json({ message: "Failed to fetch notification analytics" });
  }
});
var notifications_default = router9;

// server/src/routes/admin/activity.ts
import { Router as Router10 } from "express";
var router10 = Router10();
router10.use(isAdmin);
var activityLogs = [
  {
    id: "activity_1",
    timestamp: new Date(Date.now() - 5 * 60 * 1e3).toISOString(),
    userId: "user123",
    userEmail: "john@example.com",
    userName: "John Doe",
    action: "USER_LOGIN",
    category: "auth",
    description: "User successfully logged in",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    success: true,
    severity: "low",
    location: {
      country: "US",
      city: "New York",
      region: "NY"
    },
    metadata: {
      loginMethod: "email",
      sessionId: "sess_abc123",
      deviceType: "desktop"
    }
  },
  {
    id: "activity_2",
    timestamp: new Date(Date.now() - 10 * 60 * 1e3).toISOString(),
    userId: "user456",
    userEmail: "jane@example.com",
    userName: "Jane Smith",
    action: "AI_ANALYSIS_REQUEST",
    category: "ai",
    description: "User requested AI analysis for food image",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    success: true,
    severity: "low",
    location: {
      country: "US",
      city: "Los Angeles",
      region: "CA"
    },
    metadata: {
      imageSize: "2.5MB",
      processingTime: "3.2s",
      provider: "openai",
      cost: 0.02
    }
  },
  {
    id: "activity_3",
    timestamp: new Date(Date.now() - 15 * 60 * 1e3).toISOString(),
    userId: null,
    userEmail: "admin@system.com",
    userName: "System Admin",
    action: "SYSTEM_BACKUP_COMPLETED",
    category: "system",
    description: "Automated system backup completed successfully",
    ipAddress: "127.0.0.1",
    userAgent: "System/1.0",
    success: true,
    severity: "medium",
    metadata: {
      backupSize: "1.2GB",
      duration: "45m",
      type: "full_backup",
      destination: "aws_s3"
    }
  },
  {
    id: "activity_4",
    timestamp: new Date(Date.now() - 20 * 60 * 1e3).toISOString(),
    userId: "user789",
    userEmail: "hacker@malicious.com",
    userName: null,
    action: "FAILED_LOGIN_ATTEMPT",
    category: "security",
    description: "Multiple failed login attempts detected",
    ipAddress: "203.0.113.1",
    userAgent: "curl/7.68.0",
    success: false,
    severity: "high",
    location: {
      country: "Unknown",
      city: "Unknown",
      region: "Unknown"
    },
    metadata: {
      attemptCount: 15,
      timeWindow: "5m",
      blocked: true,
      reason: "brute_force"
    }
  },
  {
    id: "activity_5",
    timestamp: new Date(Date.now() - 25 * 60 * 1e3).toISOString(),
    userId: "user321",
    userEmail: "premium@example.com",
    userName: "Premium User",
    action: "SUBSCRIPTION_UPGRADE",
    category: "payment",
    description: "User upgraded to premium subscription",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    success: true,
    severity: "medium",
    location: {
      country: "US",
      city: "Chicago",
      region: "IL"
    },
    metadata: {
      plan: "premium_monthly",
      amount: 9.99,
      currency: "USD",
      paymentMethod: "card_ending_4242"
    }
  },
  {
    id: "activity_6",
    timestamp: new Date(Date.now() - 30 * 60 * 1e3).toISOString(),
    userId: null,
    userEmail: "admin@system.com",
    userName: "System Admin",
    action: "ADMIN_CONFIG_CHANGE",
    category: "admin",
    description: "AI configuration updated for OpenAI provider",
    ipAddress: "192.168.1.10",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    success: true,
    severity: "high",
    metadata: {
      configType: "ai_provider",
      provider: "openai",
      changes: ["model_name", "temperature"],
      previousValues: { model: "gpt-3.5-turbo", temperature: 0.7 },
      newValues: { model: "gpt-4", temperature: 0.5 }
    }
  }
];
router10.get("/stats", async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const totalActivities = activityLogs.length + Math.floor(Math.random() * 1e4);
    const activitiesLast24h = activityLogs.filter(
      (log3) => new Date(log3.timestamp) > last24h
    ).length + Math.floor(Math.random() * 100);
    const activitiesLast7d = activityLogs.filter(
      (log3) => new Date(log3.timestamp) > last7d
    ).length + Math.floor(Math.random() * 500);
    const securityEvents2 = activityLogs.filter(
      (log3) => log3.category === "security"
    ).length + Math.floor(Math.random() * 50);
    const failedAttempts = activityLogs.filter(
      (log3) => !log3.success
    ).length + Math.floor(Math.random() * 25);
    const uniqueIPs = new Set(activityLogs.map((log3) => log3.ipAddress)).size + Math.floor(Math.random() * 100);
    const actionCounts = {};
    activityLogs.forEach((log3) => {
      actionCounts[log3.action] = (actionCounts[log3.action] || 0) + 1;
    });
    actionCounts["USER_LOGIN"] = (actionCounts["USER_LOGIN"] || 0) + Math.floor(Math.random() * 1e3);
    actionCounts["AI_ANALYSIS_REQUEST"] = (actionCounts["AI_ANALYSIS_REQUEST"] || 0) + Math.floor(Math.random() * 800);
    actionCounts["PAGE_VIEW"] = Math.floor(Math.random() * 2e3);
    actionCounts["FILE_UPLOAD"] = Math.floor(Math.random() * 500);
    actionCounts["SUBSCRIPTION_CREATED"] = Math.floor(Math.random() * 200);
    const topActions = Object.entries(actionCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([action, count4]) => ({ action, count: count4 }));
    const userCounts = {};
    activityLogs.forEach((log3) => {
      if (log3.userEmail) {
        userCounts[log3.userEmail] = (userCounts[log3.userEmail] || 0) + 1;
      }
    });
    const mockUsers = [
      "active.user1@example.com",
      "power.user@example.com",
      "frequent.visitor@example.com",
      "premium.customer@example.com",
      "test.user@example.com"
    ];
    mockUsers.forEach((email) => {
      userCounts[email] = Math.floor(Math.random() * 100) + 10;
    });
    const topUsers = Object.entries(userCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([email, count4]) => ({ email, count: count4 }));
    const stats = {
      totalActivities,
      activitiesLast24h,
      activitiesLast7d,
      topActions,
      topUsers,
      securityEvents: securityEvents2,
      failedAttempts,
      uniqueIPs
    };
    res.json(stats);
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    res.status(500).json({ message: "Failed to fetch activity statistics" });
  }
});
router10.get("/logs", async (req, res) => {
  try {
    const {
      category,
      severity,
      success,
      timeRange,
      userId,
      action,
      ipAddress,
      search,
      limit = 100,
      offset = 0
    } = req.query;
    let filteredLogs = [...activityLogs];
    if (category && category !== "all") {
      filteredLogs = filteredLogs.filter((log3) => log3.category === category);
    }
    if (severity && severity !== "all") {
      filteredLogs = filteredLogs.filter((log3) => log3.severity === severity);
    }
    if (success && success !== "all") {
      const isSuccess = success === "true";
      filteredLogs = filteredLogs.filter((log3) => log3.success === isSuccess);
    }
    if (timeRange && timeRange !== "all") {
      const now = /* @__PURE__ */ new Date();
      let timeFilter;
      switch (timeRange) {
        case "1h":
          timeFilter = new Date(now.getTime() - 60 * 60 * 1e3);
          break;
        case "24h":
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
          break;
        case "7d":
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "30d":
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      }
      filteredLogs = filteredLogs.filter((log3) => new Date(log3.timestamp) > timeFilter);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter(
        (log3) => log3.userId?.toLowerCase().includes(userId.toString().toLowerCase())
      );
    }
    if (action) {
      filteredLogs = filteredLogs.filter(
        (log3) => log3.action.toLowerCase().includes(action.toString().toLowerCase())
      );
    }
    if (ipAddress) {
      filteredLogs = filteredLogs.filter(
        (log3) => log3.ipAddress.includes(ipAddress.toString())
      );
    }
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log3) => log3.action.toLowerCase().includes(searchTerm) || log3.description.toLowerCase().includes(searchTerm) || log3.userEmail?.toLowerCase().includes(searchTerm) || log3.ipAddress.includes(searchTerm)
      );
    }
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const paginatedLogs = filteredLogs.slice(
      parseInt(offset.toString()),
      parseInt(offset.toString()) + parseInt(limit.toString())
    );
    res.json(paginatedLogs);
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
});
router10.get("/export", async (req, res) => {
  try {
    const { format: format3 = "csv" } = req.query;
    const {
      category,
      severity,
      success,
      timeRange,
      userId,
      action,
      ipAddress,
      search
    } = req.query;
    let filteredLogs = [...activityLogs];
    if (category && category !== "all") {
      filteredLogs = filteredLogs.filter((log3) => log3.category === category);
    }
    if (severity && severity !== "all") {
      filteredLogs = filteredLogs.filter((log3) => log3.severity === severity);
    }
    if (success && success !== "all") {
      const isSuccess = success === "true";
      filteredLogs = filteredLogs.filter((log3) => log3.success === isSuccess);
    }
    if (timeRange && timeRange !== "all") {
      const now = /* @__PURE__ */ new Date();
      let timeFilter;
      switch (timeRange) {
        case "1h":
          timeFilter = new Date(now.getTime() - 60 * 60 * 1e3);
          break;
        case "24h":
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
          break;
        case "7d":
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "30d":
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
      }
      filteredLogs = filteredLogs.filter((log3) => new Date(log3.timestamp) > timeFilter);
    }
    if (search) {
      const searchTerm = search.toString().toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log3) => log3.action.toLowerCase().includes(searchTerm) || log3.description.toLowerCase().includes(searchTerm) || log3.userEmail?.toLowerCase().includes(searchTerm) || log3.ipAddress.includes(searchTerm)
      );
    }
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (format3 === "csv") {
      const csvHeaders = [
        "ID",
        "Timestamp",
        "User Email",
        "Action",
        "Category",
        "Description",
        "IP Address",
        "Success",
        "Severity",
        "Location"
      ];
      const csvRows = filteredLogs.map((log3) => [
        log3.id,
        log3.timestamp,
        log3.userEmail || "",
        log3.action,
        log3.category,
        log3.description,
        log3.ipAddress,
        log3.success.toString(),
        log3.severity,
        log3.location ? `${log3.location.city}, ${log3.location.country}` : ""
      ]);
      const csvContent = [
        csvHeaders.join(","),
        ...csvRows.map((row) => row.map((field) => `"${field}"`).join(","))
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=activity-logs.csv");
      res.send(csvContent);
    } else if (format3 === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=activity-logs.json");
      res.json({
        exported_at: (/* @__PURE__ */ new Date()).toISOString(),
        total_records: filteredLogs.length,
        filters: {
          category: category || "all",
          severity: severity || "all",
          success: success || "all",
          timeRange: timeRange || "all",
          search: search || ""
        },
        logs: filteredLogs
      });
    } else {
      res.status(400).json({ message: "Unsupported export format. Use csv or json." });
    }
  } catch (error) {
    console.error("Error exporting activity logs:", error);
    res.status(500).json({ message: "Failed to export activity logs" });
  }
});
router10.get("/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const log3 = activityLogs.find((log4) => log4.id === id);
    if (!log3) {
      return res.status(404).json({ message: "Activity log not found" });
    }
    res.json(log3);
  } catch (error) {
    console.error("Error fetching activity log:", error);
    res.status(500).json({ message: "Failed to fetch activity log" });
  }
});
router10.post("/log", async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userName,
      action,
      category,
      description,
      ipAddress,
      userAgent,
      success = true,
      severity = "low",
      metadata = {}
    } = req.body;
    if (!action || !category || !description) {
      return res.status(400).json({
        message: "Action, category, and description are required"
      });
    }
    const newLog = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userId,
      userEmail,
      userName,
      action,
      category,
      description,
      ipAddress: ipAddress || req.ip,
      userAgent: userAgent || req.get("User-Agent"),
      success,
      severity,
      metadata,
      location: {
        country: "US",
        // In production, use IP geolocation service
        city: "Unknown",
        region: "Unknown"
      }
    };
    activityLogs.unshift(newLog);
    if (activityLogs.length > 1e4) {
      activityLogs = activityLogs.slice(0, 1e4);
    }
    res.status(201).json({
      success: true,
      message: "Activity logged successfully",
      logId: newLog.id
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    res.status(500).json({ message: "Failed to log activity" });
  }
});
router10.delete("/logs", async (req, res) => {
  try {
    const {
      olderThan,
      // ISO date string
      category,
      severity
    } = req.body;
    let deletedCount = 0;
    const originalLength = activityLogs.length;
    if (olderThan) {
      const cutoffDate = new Date(olderThan);
      activityLogs = activityLogs.filter((log3) => {
        const logDate = new Date(log3.timestamp);
        if (logDate < cutoffDate) {
          deletedCount++;
          return false;
        }
        return true;
      });
    }
    if (category) {
      activityLogs = activityLogs.filter((log3) => {
        if (log3.category === category) {
          deletedCount++;
          return false;
        }
        return true;
      });
    }
    if (severity) {
      activityLogs = activityLogs.filter((log3) => {
        if (log3.severity === severity) {
          deletedCount++;
          return false;
        }
        return true;
      });
    }
    if (!olderThan && !category && !severity) {
      deletedCount = originalLength;
    }
    res.json({
      success: true,
      message: `${deletedCount} activity logs deleted successfully`,
      deletedCount,
      remainingCount: activityLogs.length
    });
  } catch (error) {
    console.error("Error deleting activity logs:", error);
    res.status(500).json({ message: "Failed to delete activity logs" });
  }
});
router10.post("/generate-sample", async (req, res) => {
  try {
    const { count: count4 = 100 } = req.body;
    const actions = [
      "USER_LOGIN",
      "USER_LOGOUT",
      "USER_REGISTER",
      "PASSWORD_RESET",
      "AI_ANALYSIS_REQUEST",
      "AI_ANALYSIS_COMPLETED",
      "IMAGE_UPLOAD",
      "SUBSCRIPTION_CREATED",
      "SUBSCRIPTION_CANCELLED",
      "PAYMENT_PROCESSED",
      "ADMIN_LOGIN",
      "ADMIN_CONFIG_CHANGE",
      "SYSTEM_BACKUP_STARTED",
      "FAILED_LOGIN_ATTEMPT",
      "SUSPICIOUS_ACTIVITY_DETECTED"
    ];
    const categories = ["auth", "user", "admin", "system", "payment", "ai", "security", "data"];
    const severities = ["low", "medium", "high", "critical"];
    const ipAddresses = ["192.168.1.100", "192.168.1.101", "203.0.113.1", "10.0.0.1"];
    const userEmails = [
      "user1@example.com",
      "user2@example.com",
      "admin@example.com",
      "test@example.com",
      "premium@example.com"
    ];
    for (let i = 0; i < count4; i++) {
      const randomDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1e3);
      const action = actions[Math.floor(Math.random() * actions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const sampleLog = {
        id: `sample_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: randomDate.toISOString(),
        userId: `user_${Math.floor(Math.random() * 1e3)}`,
        userEmail: userEmails[Math.floor(Math.random() * userEmails.length)],
        userName: `User ${Math.floor(Math.random() * 1e3)}`,
        action,
        category,
        description: `Sample activity: ${action.toLowerCase().replace(/_/g, " ")}`,
        ipAddress: ipAddresses[Math.floor(Math.random() * ipAddresses.length)],
        userAgent: "Sample User Agent",
        success: Math.random() > 0.1,
        // 90% success rate
        severity: severities[Math.floor(Math.random() * severities.length)],
        location: {
          country: "US",
          city: "Sample City",
          region: "Sample Region"
        },
        metadata: category === "payment" ? {
          plan: "premium",
          amount: 29.99,
          currency: "USD",
          paymentMethod: "credit_card"
        } : category === "auth" ? {
          loginMethod: "email",
          sessionId: `session_${Math.random().toString(36).substr(2, 9)}`
        } : category === "admin" ? {
          adminLevel: "super",
          targetUserId: `user_${Math.floor(Math.random() * 1e3)}`
        } : {
          sample: true,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      activityLogs.push(sampleLog);
    }
    activityLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json({
      success: true,
      message: `${count4} sample activity logs generated successfully`,
      totalLogs: activityLogs.length
    });
  } catch (error) {
    console.error("Error generating sample data:", error);
    res.status(500).json({ message: "Failed to generate sample data" });
  }
});
var activity_default = router10;

// server/src/routes/admin/index.ts
import { Router as Router18 } from "express";

// server/src/routes/admin/data.ts
init_storage_provider();
import { Router as Router11 } from "express";
init_schema();
import { eq as eq3 } from "drizzle-orm";
var router11 = Router11();
router11.use(isAdmin);
router11.get("/meal-analyses", async (req, res) => {
  try {
    const analyses = await storage.db.select().from(mealAnalyses).limit(100);
    res.json(analyses);
  } catch (error) {
    console.error("Error fetching meal analyses:", error);
    res.status(500).json({ message: "Failed to fetch meal analyses" });
  }
});
router11.delete("/meal-analyses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.db.delete(mealAnalyses).where(eq3(mealAnalyses.id, id));
    res.status(200).json({ message: "Meal analysis deleted" });
  } catch (error) {
    console.error("Error deleting meal analysis:", error);
    res.status(500).json({ message: "Failed to delete meal analysis" });
  }
});
router11.get("/weekly-stats", async (req, res) => {
  try {
    const stats = await storage.db.select().from(weeklyStats).limit(100);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    res.status(500).json({ message: "Failed to fetch weekly stats" });
  }
});
router11.delete("/weekly-stats/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.db.delete(weeklyStats).where(eq3(weeklyStats.id, id));
    res.status(200).json({ message: "Weekly stat deleted" });
  } catch (error) {
    console.error("Error deleting weekly stat:", error);
    res.status(500).json({ message: "Failed to delete weekly stat" });
  }
});
router11.get("/planned-meals", async (req, res) => {
  try {
    const meals = await storage.db.select().from(plannedMeals).limit(100);
    res.json(meals);
  } catch (error) {
    console.error("Error fetching planned meals:", error);
    res.status(500).json({ message: "Failed to fetch planned meals" });
  }
});
router11.delete("/planned-meals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.db.delete(plannedMeals).where(eq3(plannedMeals.id, id));
    res.status(200).json({ message: "Planned meal deleted" });
  } catch (error) {
    console.error("Error deleting planned meal:", error);
    res.status(500).json({ message: "Failed to delete planned meal" });
  }
});
router11.get("/imported-recipes", async (req, res) => {
  try {
    const recipes = await storage.db.select().from(importedRecipes).limit(100);
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching imported recipes:", error);
    res.status(500).json({ message: "Failed to fetch imported recipes" });
  }
});
router11.delete("/imported-recipes/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.db.delete(importedRecipes).where(eq3(importedRecipes.id, id));
    res.status(200).json({ message: "Imported recipe deleted" });
  } catch (error) {
    console.error("Error deleting imported recipe:", error);
    res.status(500).json({ message: "Failed to delete imported recipe" });
  }
});
var data_default = router11;

// server/src/routes/admin/config.ts
init_storage_provider();
import { Router as Router12 } from "express";
init_schema();
import { eq as eq4 } from "drizzle-orm";
var router12 = Router12();
router12.use(isAdmin);
router12.get("/", async (req, res) => {
  try {
    const configs = await storage.db.select().from(appConfig);
    res.json(configs);
  } catch (error) {
    console.error("Error fetching app configurations:", error);
    res.status(500).json({ message: "Failed to fetch app configurations" });
  }
});
router12.post("/", async (req, res) => {
  try {
    const validatedData = insertAppConfigSchema.parse(req.body);
    const newConfig = await storage.db.insert(appConfig).values(validatedData).returning();
    res.status(201).json(newConfig[0]);
  } catch (error) {
    console.error("Error creating app configuration:", error);
    if (error.code === "ER_DUP_ENTRY" || error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Configuration key already exists." });
    }
    if (error.errors) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create app configuration" });
  }
});
router12.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const config3 = await storage.db.select().from(appConfig).where(eq4(appConfig.id, id));
    if (config3.length === 0) {
      return res.status(404).json({ message: "Configuration not found" });
    }
    res.json(config3[0]);
  } catch (error) {
    console.error("Error fetching app configuration:", error);
    res.status(500).json({ message: "Failed to fetch app configuration" });
  }
});
router12.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const { key, value, description, type } = req.body;
    const updateData = {};
    if (key !== void 0) updateData.key = key;
    if (value !== void 0) updateData.value = value;
    if (description !== void 0) updateData.description = description;
    if (type !== void 0) updateData.type = type;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    const updatedConfig = await storage.db.update(appConfig).set(updateData).where(eq4(appConfig.id, id)).returning();
    if (updatedConfig.length === 0) {
      return res.status(404).json({ message: "Configuration not found or no changes made" });
    }
    res.json(updatedConfig[0]);
  } catch (error) {
    console.error("Error updating app configuration:", error);
    if (error.code === "ER_DUP_ENTRY" || error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Configuration key already exists." });
    }
    res.status(500).json({ message: "Failed to update app configuration" });
  }
});
router12.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deletedConfig = await storage.db.delete(appConfig).where(eq4(appConfig.id, id)).returning();
    if (deletedConfig.length === 0) {
      return res.status(404).json({ message: "Configuration not found" });
    }
    res.status(200).json({ message: "App configuration deleted successfully" });
  } catch (error) {
    console.error("Error deleting app configuration:", error);
    res.status(500).json({ message: "Failed to delete app configuration" });
  }
});
var config_default = router12;

// server/src/routes/admin/content.ts
init_storage_provider();
import { Router as Router13 } from "express";
var router13 = Router13();
router13.use(isAdmin);
router13.get("/:key", async (req, res) => {
  try {
    const key = req.params.key;
    console.log(`[ADMIN CONTENT] Attempting to fetch content for key: ${key}`);
    console.log(`[ADMIN CONTENT] Storage provider:`, storage.constructor.name);
    console.log(`[ADMIN CONTENT] User object:`, req.user);
    const value = await storage.getSiteContent(key);
    console.log(`[ADMIN CONTENT] Successfully fetched content for key: ${key}, value:`, value);
    res.json({ key, value });
  } catch (error) {
    console.error(`[ADMIN CONTENT] Error fetching site content for key ${req.params.key}:`, error);
    console.error(`[ADMIN CONTENT] Error stack:`, error instanceof Error ? error.stack : "No stack");
    console.error(`[ADMIN CONTENT] User object at error:`, req.user);
    res.status(500).json({
      message: "Failed to fetch site content",
      error: error instanceof Error ? error.message : "Unknown error",
      key: req.params.key
    });
  }
});
router13.post("/:key", async (req, res) => {
  try {
    const key = req.params.key;
    const { value } = req.body;
    if (value === void 0) {
      return res.status(400).json({ message: "Content value is required" });
    }
    await storage.updateSiteContent(key, value);
    res.json({ success: true, message: `Content for '${key}' updated successfully.` });
  } catch (error) {
    console.error(`Error updating site content for key ${req.params.key}:`, error);
    res.status(500).json({ message: "Failed to update site content" });
  }
});
var content_default = router13;

// server/src/routes/admin/languages.ts
init_storage_provider();
init_schema();
import { Router as Router14 } from "express";
import { eq as eq5, and as and2, not } from "drizzle-orm";
var router14 = Router14();
router14.get("/", async (req, res) => {
  try {
    const allLanguages = await storage.db.select().from(languages).orderBy(languages.name);
    res.json(allLanguages);
  } catch (error) {
    console.error("Error fetching languages:", error);
    res.status(500).json({ message: "Failed to fetch languages" });
  }
});
router14.post("/", async (req, res) => {
  try {
    const validatedData = insertLanguageSchema.parse(req.body);
    if (validatedData.isDefault) {
      await storage.db.update(languages).set({ isDefault: false }).where(not(eq5(languages.code, validatedData.code)));
    }
    const newLanguage = await storage.db.insert(languages).values(validatedData).returning();
    res.status(201).json(newLanguage[0]);
  } catch (error) {
    console.error("Error creating language:", error);
    if (error.code === "ER_DUP_ENTRY" || error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Language code already exists." });
    }
    if (error.errors) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create language" });
  }
});
router14.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const language = await storage.db.select().from(languages).where(eq5(languages.id, id));
    if (language.length === 0) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.json(language[0]);
  } catch (error) {
    console.error("Error fetching language:", error);
    res.status(500).json({ message: "Failed to fetch language" });
  }
});
router14.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const { code, name, isActive, isDefault } = req.body;
    const updateData = {};
    if (code !== void 0) updateData.code = code;
    if (name !== void 0) updateData.name = name;
    if (isActive !== void 0) updateData.isActive = isActive;
    if (isDefault !== void 0) updateData.isDefault = isDefault;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    if (updateData.isDefault) {
      await storage.db.update(languages).set({ isDefault: false }).where(not(eq5(languages.id, id)));
    }
    const updatedLanguage = await storage.db.update(languages).set(updateData).where(eq5(languages.id, id)).returning();
    if (updatedLanguage.length === 0) {
      return res.status(404).json({ message: "Language not found or no changes made" });
    }
    res.json(updatedLanguage[0]);
  } catch (error) {
    console.error("Error updating language:", error);
    if (error.code === "ER_DUP_ENTRY" || error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Language code already exists." });
    }
    res.status(500).json({ message: "Failed to update language" });
  }
});
router14.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const langToDelete = await storage.db.select().from(languages).where(eq5(languages.id, id));
    if (langToDelete.length > 0 && langToDelete[0].isDefault) {
      const otherDefaultLanguages = await storage.db.select().from(languages).where(and2(eq5(languages.isDefault, true), not(eq5(languages.id, id)), eq5(languages.isActive, true)));
      if (otherDefaultLanguages.length === 0) {
        return res.status(400).json({ message: "Cannot delete the only active default language. Set another language as default first." });
      }
    }
    const deletedLanguage = await storage.db.delete(languages).where(eq5(languages.id, id)).returning();
    if (deletedLanguage.length === 0) {
      return res.status(404).json({ message: "Language not found" });
    }
    res.status(200).json({ message: "Language deleted successfully" });
  } catch (error) {
    console.error("Error deleting language:", error);
    res.status(500).json({ message: "Failed to delete language" });
  }
});
var languages_default = router14;

// server/src/routes/admin/translations.ts
init_storage_provider();
import { Router as Router15 } from "express";
init_schema();
init_openai();
import { eq as eq6, and as and3, sql as sql24 } from "drizzle-orm";
var router15 = Router15();
router15.use(isAdmin);
router15.get("/language/:languageId", async (req, res) => {
  try {
    const languageId = parseInt(req.params.languageId);
    if (isNaN(languageId)) return res.status(400).json({ message: "Invalid Language ID" });
    const allTranslations = await storage.db.select().from(translations).where(eq6(translations.languageId, languageId)).orderBy(translations.key);
    res.json(allTranslations);
  } catch (error) {
    console.error("Error fetching translations:", error);
    res.status(500).json({ message: "Failed to fetch translations" });
  }
});
router15.post("/", async (req, res) => {
  try {
    const validatedData = insertTranslationSchema.parse(req.body);
    const newTranslation = await storage.db.insert(translations).values(validatedData).returning();
    res.status(201).json(newTranslation[0]);
  } catch (error) {
    console.error("Error creating translation:", error);
    if (error.code === "ER_DUP_ENTRY" || error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Translation key already exists for this language." });
    }
    if (error.errors) {
      return res.status(400).json({ message: "Invalid data", errors: error.errors });
    }
    res.status(500).json({ message: "Failed to create translation" });
  }
});
router15.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const { key, value, isAutoTranslated } = req.body;
    const updateData = {};
    if (key !== void 0) updateData.key = key;
    if (value !== void 0) updateData.value = value;
    if (isAutoTranslated !== void 0) updateData.isAutoTranslated = isAutoTranslated;
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }
    const updatedTranslation = await storage.db.update(translations).set(updateData).where(eq6(translations.id, id)).returning();
    if (updatedTranslation.length === 0) {
      return res.status(404).json({ message: "Translation not found or no changes made" });
    }
    res.json(updatedTranslation[0]);
  } catch (error) {
    console.error("Error updating translation:", error);
    if (error.code === "ER_DUP_ENTRY" || error.message && error.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({ message: "Translation key already exists for this language." });
    }
    res.status(500).json({ message: "Failed to update translation" });
  }
});
router15.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const deletedTranslation = await storage.db.delete(translations).where(eq6(translations.id, id)).returning();
    if (deletedTranslation.length === 0) {
      return res.status(404).json({ message: "Translation not found" });
    }
    res.status(200).json({ message: "Translation deleted successfully" });
  } catch (error) {
    console.error("Error deleting translation:", error);
    res.status(500).json({ message: "Failed to delete translation" });
  }
});
router15.post("/auto-translate", async (req, res) => {
  const { languageId, targetLanguageCode, translationKey, textToTranslate } = req.body;
  if (!languageId || !targetLanguageCode) {
    return res.status(400).json({ message: "languageId and targetLanguageCode are required." });
  }
  if (!translationKey && !textToTranslate) {
    return res.status(400).json({ message: "Either translationKey (to find English source) or textToTranslate (for a new/direct translation) is required." });
  }
  try {
    const openai3 = getOpenAIClient();
    let sourceText = textToTranslate;
    if (translationKey && !textToTranslate) {
      const englishLang = await storage.db.select().from(languages).where(eq6(languages.code, "en")).limit(1);
      if (!englishLang || englishLang.length === 0) {
        return res.status(400).json({ message: "English (en) language not found as a source for translation." });
      }
      const sourceTranslation = await storage.db.select().from(translations).where(and3(eq6(translations.languageId, englishLang[0].id), eq6(translations.key, translationKey))).limit(1);
      if (!sourceTranslation || sourceTranslation.length === 0) {
        return res.status(404).json({ message: `Source translation for key '${translationKey}' in English not found.` });
      }
      sourceText = sourceTranslation[0].value;
    }
    if (!sourceText) {
      return res.status(400).json({ message: "No source text available for translation." });
    }
    const completion = await openai3.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: `You are a translation assistant. Translate the given text to ${targetLanguageCode}. Output only the translated text, nothing else.` },
        { role: "user", content: sourceText }
      ],
      temperature: 0.3,
      max_tokens: 1e3
    });
    const translatedText = completion.choices[0]?.message?.content?.trim();
    if (!translatedText) {
      return res.status(500).json({ message: "AI translation failed to produce text." });
    }
    if (translationKey) {
      const existingTranslation = await storage.db.select().from(translations).where(and3(eq6(translations.languageId, languageId), eq6(translations.key, translationKey))).limit(1);
      if (existingTranslation.length > 0) {
        await storage.db.update(translations).set({ value: translatedText, isAutoTranslated: true, updatedAt: sql24`CURRENT_TIMESTAMP` }).where(eq6(translations.id, existingTranslation[0].id));
      } else {
        await storage.db.insert(translations).values({
          languageId,
          key: translationKey,
          value: translatedText,
          isAutoTranslated: true
        });
      }
    }
    res.json({ translatedText, sourceText, translationKey });
  } catch (error) {
    console.error("Error during auto-translation:", error);
    res.status(500).json({ message: "Failed to auto-translate" });
  }
});
var translations_default = router15;

// server/src/routes/admin/referral.ts
import { Router as Router16 } from "express";
init_db();
init_schema();
import { eq as eq7, desc as desc2, sql as sql25 } from "drizzle-orm";
var router16 = Router16();
router16.use(isAdmin);
router16.get("/settings", async (req, res) => {
  try {
    const [settings] = await db.select().from(referralSettings).orderBy(desc2(referralSettings.id)).limit(1);
    if (!settings) {
      return res.status(404).json({ message: "Referral settings not found" });
    }
    res.json({
      id: settings.id,
      commission_percent: Number(settings.commissionPercent),
      is_recurring: settings.isRecurring,
      created_at: settings.createdAt,
      updated_at: settings.updatedAt
    });
  } catch (error) {
    console.error("Error fetching referral settings:", error);
    res.status(500).json({ message: "Failed to fetch referral settings" });
  }
});
router16.put("/settings", async (req, res) => {
  try {
    const { commission_percent, is_recurring } = req.body;
    if (typeof commission_percent !== "number" || commission_percent < 0 || commission_percent > 100) {
      return res.status(400).json({ message: "Invalid commission percentage" });
    }
    if (typeof is_recurring !== "boolean") {
      return res.status(400).json({ message: "Invalid recurring flag" });
    }
    await db.update(referralSettings).set({
      commissionPercent: commission_percent.toString(),
      isRecurring: is_recurring,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq7(
      referralSettings.id,
      sql25`(SELECT id FROM referral_settings ORDER BY id DESC LIMIT 1)`
    ));
    const [updatedSettings] = await db.select().from(referralSettings).orderBy(desc2(referralSettings.id)).limit(1);
    if (!updatedSettings) {
      return res.status(404).json({ message: "Referral settings not found" });
    }
    res.json({
      id: updatedSettings.id,
      commission_percent: Number(updatedSettings.commissionPercent),
      is_recurring: updatedSettings.isRecurring,
      created_at: updatedSettings.createdAt,
      updated_at: updatedSettings.updatedAt
    });
  } catch (error) {
    console.error("Error updating referral settings:", error);
    res.status(500).json({ message: "Failed to update referral settings" });
  }
});
router16.get("/commissions", async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const commissions = await db.select({
      id: referralCommissions.id,
      referrerId: referralCommissions.referrerId,
      refereeId: referralCommissions.refereeId,
      subscriptionId: referralCommissions.subscriptionId,
      amount: referralCommissions.amount,
      status: referralCommissions.status,
      isRecurring: referralCommissions.isRecurring,
      createdAt: referralCommissions.createdAt,
      paidAt: referralCommissions.paidAt,
      referrerEmail: users.email,
      refereeEmail: users.email
    }).from(referralCommissions).leftJoin(users, eq7(referralCommissions.referrerId, users.id)).orderBy(desc2(referralCommissions.createdAt)).limit(Number(limit)).offset(Number(offset));
    const count4 = await db.select({ count: sql25`COUNT(*)` }).from(referralCommissions);
    res.json({
      commissions: commissions.map((commission) => ({
        ...commission,
        referrer_email: commission.referrerEmail,
        referee_email: commission.refereeEmail
      })),
      total: Number(count4[0].count)
    });
  } catch (error) {
    console.error("Error fetching referral commissions:", error);
    res.status(500).json({ message: "Failed to fetch referral commissions" });
  }
});
var referral_default = router16;

// server/src/routes/admin/healthcare.ts
init_db2();
import { Router as Router17 } from "express";
init_create_premium_analytics_tables();
init_users();
import { eq as eq8, and as and4, gte, desc as desc3, sql as sql26, or as or2 } from "drizzle-orm";
import { subDays } from "date-fns";
var router17 = Router17();
router17.use(isAdmin);
router17.get("/overview", async (req, res) => {
  try {
    const [totalIntegrations, activeIntegrations, totalProviders, recentActivity] = await Promise.all([
      // Total healthcare integrations
      db2.select({ count: sql26`COUNT(*)` }).from(healthcareIntegration2),
      // Active integrations
      db2.select({ count: sql26`COUNT(*)` }).from(healthcareIntegration2).where(
        eq8(healthcareIntegration2.data_sharing_consent, true)
      ),
      // Total providers (mock data for now)
      Promise.resolve({ count: 156 }),
      // Recent activity (last 7 days)
      db2.select({ count: sql26`COUNT(*)` }).from(healthcareIntegration2).where(
        gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 7))
      )
    ]);
    const overview = {
      totalIntegrations: totalIntegrations[0].count,
      activeIntegrations: activeIntegrations[0].count,
      totalProviders: totalProviders.count,
      recentActivity: recentActivity[0].count,
      integrationRate: activeIntegrations[0].count > 0 ? (activeIntegrations[0].count / totalIntegrations[0].count * 100).toFixed(1) : "0"
    };
    res.json(overview);
  } catch (error) {
    console.error("Error fetching healthcare overview:", error);
    res.status(500).json({ message: "Failed to fetch healthcare overview" });
  }
});
router17.get("/integrations", async (req, res) => {
  try {
    const { userId, search, professionalType, page = 1, limit = 50 } = req.query;
    let query = db2.select().from(healthcareIntegration2);
    const conditions = [];
    if (userId) {
      conditions.push(eq8(healthcareIntegration2.user_id, parseInt(userId)));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql26`CONCAT(${healthcareIntegration2.professional_name}, ${healthcareIntegration2.practice_name}) LIKE ${searchTerm}`
      );
    }
    if (professionalType && professionalType !== "all") {
      conditions.push(eq8(healthcareIntegration2.professional_type, professionalType));
    }
    if (conditions.length > 0) {
      query = query.where(and4(...conditions));
    }
    const offset = (page - 1) * limit;
    const integrations = await query.orderBy(desc3(healthcareIntegration2.created_at)).limit(limit).offset(offset);
    const [{ count: totalCount }] = await db2.select({ count: sql26`COUNT(*)` }).from(healthcareIntegration2).where(conditions.length > 0 ? and4(...conditions) : void 0);
    res.json({
      integrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(totalCount),
        pages: Math.ceil(parseInt(totalCount) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching healthcare integrations:", error);
    res.status(500).json({ message: "Failed to fetch healthcare integrations" });
  }
});
router17.get("/integrations/:id", async (req, res) => {
  try {
    const integrationId = parseInt(req.params.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ message: "Invalid integration ID" });
    }
    const [integration] = await db2.select().from(healthcareIntegration2).where(eq8(healthcareIntegration2.id, integrationId));
    if (!integration) {
      return res.status(404).json({ message: "Healthcare integration not found" });
    }
    const [user, healthScores4, reports] = await Promise.all([
      db2.select().from(users).where(eq8(users.id, integration.user_id)).limit(1),
      db2.select().from(healthScores4).where(eq8(healthScores4.user_id, integration.user_id)).limit(10),
      db2.select().from(healthReports2).where(eq8(healthReports2.user_id, integration.user_id)).limit(10)
    ]);
    const detailedIntegration = {
      ...integration,
      user: user[0] || null,
      recentHealthScores: healthScores4,
      recentReports: reports
    };
    res.json(detailedIntegration);
  } catch (error) {
    console.error("Error fetching healthcare integration details:", error);
    res.status(500).json({ message: "Failed to fetch healthcare integration details" });
  }
});
router17.put("/integrations/:id", async (req, res) => {
  try {
    const integrationId = parseInt(req.params.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ message: "Invalid integration ID" });
    }
    const { accessLevel, dataSharingConsent, notes, status } = req.body;
    const updateData = {
      updated_at: /* @__PURE__ */ new Date()
    };
    if (accessLevel !== void 0) updateData.access_level = accessLevel;
    if (dataSharingConsent !== void 0) updateData.data_sharing_consent = dataSharingConsent;
    if (notes !== void 0) updateData.notes = notes;
    if (status !== void 0) updateData.status = status;
    const [updated] = await db2.update(healthcareIntegration2).set(updateData).where(eq8(healthcareIntegration2.id, integrationId)).returning();
    if (!updated) {
      return res.status(404).json({ message: "Healthcare integration not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating healthcare integration:", error);
    res.status(500).json({ message: "Failed to update healthcare integration" });
  }
});
router17.delete("/integrations/:id", async (req, res) => {
  try {
    const integrationId = parseInt(req.params.id);
    if (isNaN(integrationId)) {
      return res.status(400).json({ message: "Invalid integration ID" });
    }
    const [deleted] = await db2.delete(healthcareIntegration2).where(eq8(healthcareIntegration2.id, integrationId)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Healthcare integration not found" });
    }
    res.json({ message: "Healthcare integration deleted successfully" });
  } catch (error) {
    console.error("Error deleting healthcare integration:", error);
    res.status(500).json({ message: "Failed to delete healthcare integration" });
  }
});
router17.get("/providers", async (req, res) => {
  try {
    const { search, type, verified, page = 1, limit = 50 } = req.query;
    const mockProviders = [
      {
        id: "prov_001",
        name: "Dr. Sarah Johnson",
        type: "doctor",
        specialty: "General Practice",
        practiceName: "Family Health Clinic",
        email: "sarah.johnson@familyhealth.com",
        phone: "+1 (555) 123-4567",
        address: "123 Main St, Anytown, USA",
        verified: true,
        rating: 4.8,
        reviewCount: 156,
        activeIntegrations: 23,
        createdAt: "2023-01-15T10:00:00Z"
      },
      {
        id: "prov_002",
        name: "Dr. Michael Chen",
        type: "nutritionist",
        specialty: "Sports Nutrition",
        practiceName: "Performance Nutrition Center",
        email: "michael.chen@performancenutrition.com",
        phone: "+1 (555) 234-5678",
        address: "456 Oak Ave, Anytown, USA",
        verified: true,
        rating: 4.9,
        reviewCount: 89,
        activeIntegrations: 15,
        createdAt: "2023-02-20T14:30:00Z"
      }
    ];
    let filteredProviders = mockProviders;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredProviders = filteredProviders.filter(
        (provider) => provider.name.toLowerCase().includes(searchTerm) || provider.specialty.toLowerCase().includes(searchTerm) || provider.practiceName?.toLowerCase().includes(searchTerm)
      );
    }
    if (type && type !== "all") {
      filteredProviders = filteredProviders.filter((provider) => provider.type === type);
    }
    if (verified !== void 0) {
      const isVerified = verified === "true";
      filteredProviders = filteredProviders.filter((provider) => provider.verified === isVerified);
    }
    const offset = (page - 1) * limit;
    const paginatedProviders = filteredProviders.slice(offset, offset + parseInt(limit));
    res.json({
      providers: paginatedProviders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredProviders.length,
        pages: Math.ceil(filteredProviders.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error fetching healthcare providers:", error);
    res.status(500).json({ message: "Failed to fetch healthcare providers" });
  }
});
router17.get("/providers/:id", async (req, res) => {
  try {
    const providerId = req.params.id;
    const provider = {
      id: providerId,
      name: "Dr. Sarah Johnson",
      type: "doctor",
      specialty: "General Practice",
      practiceName: "Family Health Clinic",
      email: "sarah.johnson@familyhealth.com",
      phone: "+1 (555) 123-4567",
      address: "123 Main St, Anytown, USA",
      verified: true,
      rating: 4.8,
      reviewCount: 156,
      description: "Dr. Sarah Johnson is a board-certified family physician with over 15 years of experience in general practice and preventive care.",
      education: ["Johns Hopkins University School of Medicine", "Family Medicine Residency - Mayo Clinic"],
      certifications: ["Board Certified in Family Medicine", "Certified Diabetes Educator"],
      languages: ["English", "Spanish"],
      services: ["General Checkups", "Preventive Care", "Chronic Disease Management", "Annual Physicals"],
      availability: {
        workingHours: {
          "Monday": "9:00 AM - 5:00 PM",
          "Tuesday": "9:00 AM - 5:00 PM",
          "Wednesday": "9:00 AM - 5:00 PM",
          "Thursday": "9:00 AM - 5:00 PM",
          "Friday": "9:00 AM - 3:00 PM"
        },
        acceptsNewPatients: true
      },
      statistics: {
        totalIntegrations: 23,
        activeIntegrations: 21,
        averageResponseTime: "2.5 hours",
        patientSatisfaction: 4.7
      },
      createdAt: "2023-01-15T10:00:00Z",
      updatedAt: "2024-01-10T14:30:00Z"
    };
    res.json(provider);
  } catch (error) {
    console.error("Error fetching healthcare provider details:", error);
    res.status(500).json({ message: "Failed to fetch healthcare provider details" });
  }
});
router17.post("/providers/:id/verify", async (req, res) => {
  try {
    const providerId = req.params.id;
    await new Promise((resolve2) => setTimeout(resolve2, 1e3));
    res.json({
      success: true,
      message: "Provider credentials verified successfully",
      providerId,
      verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
      verificationDetails: {
        licenseVerified: true,
        malpracticeInsurance: true,
        backgroundCheck: true,
        credentialsUpToDate: true
      }
    });
  } catch (error) {
    console.error("Error verifying healthcare provider:", error);
    res.status(500).json({ message: "Failed to verify healthcare provider" });
  }
});
router17.get("/analytics", async (req, res) => {
  try {
    const { period = "30d" } = req.query;
    let dateFilter;
    switch (period) {
      case "7d":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 7));
        break;
      case "30d":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 30));
        break;
      case "90d":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 90));
        break;
      case "1y":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 365));
        break;
      default:
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 30));
    }
    const [
      totalIntegrations,
      activeIntegrations,
      integrationsByType,
      integrationsByMonth,
      topProviders,
      userAdoption
    ] = await Promise.all([
      // Total integrations
      db2.select({ count: sql26`COUNT(*)` }).from(healthcareIntegration2).where(dateFilter),
      // Active integrations
      db2.select({ count: sql26`COUNT(*)` }).from(healthcareIntegration2).where(
        and4(dateFilter, eq8(healthcareIntegration2.data_sharing_consent, true))
      ),
      // Integrations by professional type
      db2.select({
        type: healthcareIntegration2.professional_type,
        count: sql26`COUNT(*)`
      }).from(healthcareIntegration2).where(dateFilter).groupBy(healthcareIntegration2.professional_type),
      // Integrations by month
      db2.select({
        month: sql26`DATE_FORMAT(${healthcareIntegration2.created_at}, '%Y-%m')`,
        count: sql26`COUNT(*)`
      }).from(healthcareIntegration2).where(dateFilter).groupBy(sql26`DATE_FORMAT(${healthcareIntegration2.created_at}, '%Y-%m')`).orderBy(sql26`DATE_FORMAT(${healthcareIntegration2.created_at}, '%Y-%m')`),
      // Top providers by integration count
      db2.select({
        professionalId: healthcareIntegration2.professional_id,
        professionalName: healthcareIntegration2.professional_name,
        count: sql26`COUNT(*)`
      }).from(healthcareIntegration2).where(dateFilter).groupBy(healthcareIntegration2.professional_id, healthcareIntegration2.professional_name).orderBy(sql26`COUNT(*) DESC`).limit(10),
      // User adoption rate
      db2.select({
        totalUsers: sql26`COUNT(DISTINCT ${healthcareIntegration2.user_id})`,
        activeUsers: sql26`COUNT(DISTINCT CASE WHEN ${healthcareIntegration2.data_sharing_consent} = true THEN ${healthcareIntegration2.user_id} END)`
      }).from(healthcareIntegration2).where(dateFilter)
    ]);
    const analytics = {
      period,
      summary: {
        totalIntegrations: totalIntegrations[0].count,
        activeIntegrations: activeIntegrations[0].count,
        adoptionRate: activeIntegrations[0].count > 0 ? (activeIntegrations[0].count / totalIntegrations[0].count * 100).toFixed(1) : "0"
      },
      byType: integrationsByType,
      byMonth: integrationsByMonth,
      topProviders,
      userAdoption: {
        totalUsers: userAdoption[0].totalUsers,
        activeUsers: userAdoption[0].activeUsers,
        adoptionRate: userAdoption[0].activeUsers > 0 ? (userAdoption[0].activeUsers / userAdoption[0].totalUsers * 100).toFixed(1) : "0"
      }
    };
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching healthcare analytics:", error);
    res.status(500).json({ message: "Failed to fetch healthcare analytics" });
  }
});
router17.get("/system-health", async (req, res) => {
  try {
    const systemHealth = {
      overall: "healthy",
      lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
      components: {
        database: {
          status: "healthy",
          responseTime: "45ms",
          connections: 15,
          maxConnections: 100
        },
        api: {
          status: "healthy",
          uptime: "99.9%",
          responseTime: "120ms",
          errorRate: "0.1%"
        },
        integrations: {
          status: "healthy",
          activeProviders: 156,
          successRate: "98.5%",
          lastSync: (/* @__PURE__ */ new Date()).toISOString()
        },
        notifications: {
          status: "healthy",
          deliveryRate: "99.2%",
          pendingNotifications: 3
        }
      },
      alerts: [],
      recommendations: [
        "Consider adding more healthcare provider API integrations",
        "Monitor API response times during peak hours",
        "Implement automated backup for healthcare data"
      ]
    };
    res.json(systemHealth);
  } catch (error) {
    console.error("Error fetching healthcare system health:", error);
    res.status(500).json({ message: "Failed to fetch healthcare system health" });
  }
});
router17.get("/export", async (req, res) => {
  try {
    const { format: format3 = "json", dateRange = "30d" } = req.query;
    let dateFilter;
    switch (dateRange) {
      case "7d":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 7));
        break;
      case "30d":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 30));
        break;
      case "90d":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 90));
        break;
      case "1y":
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 365));
        break;
      default:
        dateFilter = gte(healthcareIntegration2.created_at, subDays(/* @__PURE__ */ new Date(), 30));
    }
    const [integrations, healthScores4, reports, predictions] = await Promise.all([
      db2.select().from(healthcareIntegration2).where(dateFilter),
      db2.select().from(healthScores4).where(dateFilter),
      db2.select().from(healthReports2).where(dateFilter),
      db2.select().from(healthPredictions2).where(dateFilter)
    ]);
    const exportData = {
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      dateRange,
      format: format3,
      data: {
        integrations,
        healthScores: healthScores4,
        reports,
        predictions
      },
      summary: {
        totalIntegrations: integrations.length,
        totalHealthScores: healthScores4.length,
        totalReports: reports.length,
        totalPredictions: predictions.length
      }
    };
    switch (format3) {
      case "json":
        res.json(exportData);
        break;
      case "csv":
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=healthcare-data-${Date.now()}.csv`);
        const csvHeaders = ["ID", "Type", "Name", "User ID", "Created At", "Status"];
        const csvRows = [
          csvHeaders.join(","),
          ...integrations.map((item) => [
            item.id,
            item.professional_type,
            item.professional_name,
            item.user_id,
            item.created_at,
            item.status || "active"
          ].join(","))
        ].join("\n");
        res.send(csvRows);
        break;
      default:
        res.status(400).json({ message: "Unsupported export format" });
    }
  } catch (error) {
    console.error("Error exporting healthcare data:", error);
    res.status(500).json({ message: "Failed to export healthcare data" });
  }
});
router17.post("/bulk", async (req, res) => {
  try {
    const { operation, integrationIds, data } = req.body;
    if (!operation || !integrationIds || !Array.isArray(integrationIds)) {
      return res.status(400).json({ message: "Invalid bulk operation request" });
    }
    let result;
    switch (operation) {
      case "verify_providers":
        result = { success: true, message: `${integrationIds.length} providers verified` };
        break;
      case "deactivate_integrations":
        await db2.update(healthcareIntegration2).set({
          data_sharing_consent: false,
          updated_at: /* @__PURE__ */ new Date()
        }).where(or2(...integrationIds.map((id) => eq8(healthcareIntegration2.id, id))));
        result = { success: true, message: `${integrationIds.length} integrations deactivated` };
        break;
      case "activate_integrations":
        await db2.update(healthcareIntegration2).set({
          data_sharing_consent: true,
          updated_at: /* @__PURE__ */ new Date()
        }).where(or2(...integrationIds.map((id) => eq8(healthcareIntegration2.id, id))));
        result = { success: true, message: `${integrationIds.length} integrations activated` };
        break;
      case "delete_integrations":
        await db2.delete(healthcareIntegration2).where(or2(...integrationIds.map((id) => eq8(healthcareIntegration2.id, id))));
        result = { success: true, message: `${integrationIds.length} integrations deleted` };
        break;
      default:
        return res.status(400).json({ message: "Unknown bulk operation" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    res.status(500).json({ message: "Failed to perform bulk operation" });
  }
});
var healthcare_default = router17;

// server/src/routes/admin/index.ts
var adminRouter = Router18();
adminRouter.use("/users", users_default);
adminRouter.use("/data", data_default);
adminRouter.use("/config", config_default);
adminRouter.use("/content", content_default);
adminRouter.use("/languages", languages_default);
adminRouter.use("/translations", translations_default);
adminRouter.use("/referral", referral_default);
adminRouter.use("/dashboard", dashboard_default);
adminRouter.use("/healthcare", healthcare_default);
adminRouter.use("/analytics", analytics_default);
adminRouter.use("/system", system_default);
var admin_default = adminRouter;

// server/src/routes/security.ts
import { Router as Router19 } from "express";

// server/src/utils/logger.ts
import winston from "winston";

// server/src/config/index.ts
import dotenv4 from "dotenv";
dotenv4.config();
var config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  database: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    name: process.env.DB_NAME || "calorie_tracker",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.DB_SSL === "true",
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10", 10)
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d"
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-4",
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || "1000", 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7")
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || "",
      model: process.env.ANTHROPIC_MODEL || "claude-3-sonnet-20240229",
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || "1000", 10)
    }
  },
  externalApis: {
    nutritionix: {
      appId: process.env.NUTRITIONIX_APP_ID || "",
      appKey: process.env.NUTRITIONIX_APP_KEY || "",
      baseUrl: process.env.NUTRITIONIX_BASE_URL || "https://trackapi.nutritionix.com"
    },
    spoonacular: {
      apiKey: process.env.SPOONACULAR_API_KEY || "",
      baseUrl: process.env.SPOONACULAR_BASE_URL || "https://api.spoonacular.com"
    },
    openfoodfacts: {
      baseUrl: process.env.OPENFOODFACTS_BASE_URL || "https://world.openfoodfacts.org"
    },
    weather: {
      apiKey: process.env.WEATHER_API_KEY || "",
      baseUrl: process.env.WEATHER_BASE_URL || "https://api.openweathermap.org/data/2.5"
    }
  },
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ""
    }
  },
  storage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      region: process.env.AWS_REGION || "us-east-1",
      bucket: process.env.AWS_S3_BUCKET || ""
    },
    local: {
      enabled: process.env.LOCAL_STORAGE_ENABLED === "true",
      path: process.env.LOCAL_STORAGE_PATH || "./uploads"
    }
  },
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || "",
      from: process.env.EMAIL_FROM || "noreply@aicalorietracker.com"
    },
    smtp: {
      host: process.env.SMTP_HOST || "",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      user: process.env.SMTP_USER || "",
      password: process.env.SMTP_PASSWORD || ""
    }
  },
  pushNotifications: {
    firebase: {
      serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./firebase-service-account.json",
      serverKey: process.env.FIREBASE_SERVER_KEY || ""
    }
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12", 10),
    jwtAlgorithm: process.env.JWT_ALGORITHM || "HS256",
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : ["http://localhost:3000"],
      credentials: process.env.CORS_CREDENTIALS !== "false"
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
      // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10)
    }
  },
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN || "",
      environment: process.env.NODE_ENV || "development"
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === "true",
      port: parseInt(process.env.PROMETHEUS_PORT || "9090", 10)
    },
    logging: {
      level: process.env.LOG_LEVEL || "info",
      file: process.env.LOG_FILE || "logs/app.log"
    }
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0", 10)
  }
};
var validateConfig = () => {
  const requiredEnvVars = [
    "JWT_SECRET",
    "OPENAI_API_KEY",
    "STRIPE_SECRET_KEY"
  ];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
  }
  if (!config.database.name) {
    throw new Error("Database name is required");
  }
  if (!config.jwt.secret) {
    throw new Error("JWT secret is required");
  }
  if (!config.ai.openai.apiKey) {
    throw new Error("OpenAI API key is required");
  }
  if (!config.payment.stripe.secretKey) {
    throw new Error("Stripe secret key is required");
  }
};
try {
  validateConfig();
} catch (error) {
  console.error("Configuration validation failed:", error);
  process.exit(1);
}

// server/src/utils/logger.ts
var levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};
var colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white"
};
winston.addColors(colors);
var level = () => {
  const env = config.nodeEnv || "development";
  const isDevelopment2 = env === "development";
  return isDevelopment2 ? "debug" : "warn";
};
var format2 = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);
var transports = [
  // Console transport
  new winston.transports.Console({
    format: format2
  }),
  // File transport for errors
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error"
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: "logs/combined.log"
  })
];
var logger = winston.createLogger({
  level: level(),
  levels,
  format: format2,
  transports
});
var Logger = class _Logger {
  context;
  constructor(context = "App") {
    this.context = context;
  }
  // Log error messages
  error(message, meta) {
    logger.error(`${this.context}: ${message}`, meta);
  }
  // Log warning messages
  warn(message, meta) {
    logger.warn(`${this.context}: ${message}`, meta);
  }
  // Log info messages
  info(message, meta) {
    logger.info(`${this.context}: ${message}`, meta);
  }
  // Log HTTP requests
  http(message, meta) {
    logger.http(`${this.context}: ${message}`, meta);
  }
  // Log debug messages
  debug(message, meta) {
    logger.debug(`${this.context}: ${message}`, meta);
  }
  // Log performance metrics
  performance(message, duration, meta) {
    logger.info(`${this.context} - Performance: ${message} - Duration: ${duration}ms`, meta);
  }
  // Log security events
  security(message, meta) {
    logger.error(`${this.context} - Security: ${message}`, meta);
  }
  // Log database operations
  database(message, duration, meta) {
    logger.info(`${this.context} - Database: ${message} - Duration: ${duration}ms`, meta);
  }
  // Log API calls
  api(message, method, url, statusCode, duration, meta) {
    logger.http(`${this.context} - API: ${method} ${url} - Status: ${statusCode} - Duration: ${duration}ms`, meta);
  }
  // Log user activities
  userActivity(userId, action, meta) {
    logger.info(`${this.context} - User Activity: User ${userId} - Action: ${action}`, meta);
  }
  // Log system events
  system(message, meta) {
    logger.info(`${this.context} - System: ${message}`, meta);
  }
  // Log business events
  business(message, meta) {
    logger.info(`${this.context} - Business: ${message}`, meta);
  }
  // Log external API calls
  externalApi(service, endpoint, method, duration, success, meta) {
    const status = success ? "SUCCESS" : "FAILED";
    logger.info(`${this.context} - External API: ${service} ${method} ${endpoint} - Status: ${status} - Duration: ${duration}ms`, meta);
  }
  // Log file operations
  fileOperation(operation, filename, size, meta) {
    const sizeInfo = size ? ` - Size: ${size} bytes` : "";
    logger.info(`${this.context} - File: ${operation} ${filename}${sizeInfo}`, meta);
  }
  // Log payment events
  payment(message, amount, currency, meta) {
    const amountInfo = amount && currency ? ` - Amount: ${amount} ${currency}` : "";
    logger.info(`${this.context} - Payment: ${message}${amountInfo}`, meta);
  }
  // Log AI service events
  aiService(message, model, duration, meta) {
    const modelInfo = model ? ` - Model: ${model}` : "";
    const durationInfo = duration ? ` - Duration: ${duration}ms` : "";
    logger.info(`${this.context} - AI Service: ${message}${modelInfo}${durationInfo}`, meta);
  }
  // Log wearable device events
  wearableDevice(message, deviceId, deviceType, meta) {
    const deviceInfo = deviceId && deviceType ? ` - Device: ${deviceType} (${deviceId})` : "";
    logger.info(`${this.context} - Wearable Device: ${message}${deviceInfo}`, meta);
  }
  // Log health events
  health(message, userId, metricType, value, meta) {
    const userInfo = userId ? ` - User: ${userId}` : "";
    const metricInfo = metricType ? ` - Metric: ${metricType}` : "";
    const valueInfo = value !== void 0 ? ` - Value: ${value}` : "";
    logger.info(`${this.context} - Health: ${message}${userInfo}${metricInfo}${valueInfo}`, meta);
  }
  // Log analytics events
  analytics(message, event, userId, meta) {
    const userInfo = userId ? ` - User: ${userId}` : "";
    logger.info(`${this.context} - Analytics: ${message} - Event: ${event}${userInfo}`, meta);
  }
  // Log error with stack trace
  errorWithStack(message, error, meta) {
    logger.error(`${this.context}: ${message}
${error.stack}`, meta);
  }
  // Log with context
  withContext(newContext) {
    return new _Logger(newContext);
  }
  // Create child logger with additional metadata
  child(metadata) {
    const childLogger = Object.create(this);
    childLogger.metadata = { ...this.metadata, ...metadata };
    return childLogger;
  }
  metadata = {};
};

// server/src/services/securityAuditService.ts
var logger2 = new Logger("SecurityAudit");
var SecurityEventType = /* @__PURE__ */ ((SecurityEventType2) => {
  SecurityEventType2["LOGIN_ATTEMPT"] = "login_attempt";
  SecurityEventType2["LOGIN_SUCCESS"] = "login_success";
  SecurityEventType2["LOGIN_FAILURE"] = "login_failure";
  SecurityEventType2["LOGOUT"] = "logout";
  SecurityEventType2["PASSWORD_CHANGE"] = "password_change";
  SecurityEventType2["ACCOUNT_LOCKOUT"] = "account_lockout";
  SecurityEventType2["SESSION_CREATE"] = "session_create";
  SecurityEventType2["SESSION_DESTROY"] = "session_destroy";
  SecurityEventType2["SESSION_EXPIRE"] = "session_expire";
  SecurityEventType2["SECURITY_VIOLATION"] = "security_violation";
  SecurityEventType2["RATE_LIMIT_EXCEEDED"] = "rate_limit_exceeded";
  SecurityEventType2["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
  SecurityEventType2["IP_BLOCKED"] = "ip_blocked";
  SecurityEventType2["CSRF_DETECTED"] = "csrf_detected";
  SecurityEventType2["XSS_DETECTED"] = "xss_detected";
  SecurityEventType2["SQL_INJECTION_DETECTED"] = "sql_injection_detected";
  SecurityEventType2["UNAUTHORIZED_ACCESS"] = "unauthorized_access";
  SecurityEventType2["PERMISSION_DENIED"] = "permission_denied";
  SecurityEventType2["DATA_BREACH"] = "data_breach";
  SecurityEventType2["MALWARE_DETECTED"] = "malware_detected";
  SecurityEventType2["PHISHING_DETECTED"] = "phishing_detected";
  return SecurityEventType2;
})(SecurityEventType || {});
var SecurityEventSeverity = /* @__PURE__ */ ((SecurityEventSeverity2) => {
  SecurityEventSeverity2["LOW"] = "low";
  SecurityEventSeverity2["MEDIUM"] = "medium";
  SecurityEventSeverity2["HIGH"] = "high";
  SecurityEventSeverity2["CRITICAL"] = "critical";
  return SecurityEventSeverity2;
})(SecurityEventSeverity || {});
var SecurityAuditService = class {
  events = [];
  maxEvents = 1e4;
  alertThresholds = {
    ["low" /* LOW */]: 100,
    ["medium" /* MEDIUM */]: 50,
    ["high" /* HIGH */]: 20,
    ["critical" /* CRITICAL */]: 5
  };
  // Log security event
  logEvent(type, severity, description, details = {}, req) {
    const event = {
      id: this.generateEventId(),
      type,
      severity,
      userId: req?.user?.id?.toString(),
      sessionId: req?.session?.id,
      ipAddress: req?.ip || "unknown",
      userAgent: req?.get("User-Agent") || "unknown",
      timestamp: /* @__PURE__ */ new Date(),
      description,
      details,
      resolved: false
    };
    this.events.push(event);
    logger2.warn(`Security Event: ${type} - ${description}`, { event: event.details });
    this.checkEventThresholds();
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }
  // Generate unique event ID
  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  // Check event thresholds and trigger alerts
  checkEventThresholds() {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const eventCounts = {
      ["low" /* LOW */]: 0,
      ["medium" /* MEDIUM */]: 0,
      ["high" /* HIGH */]: 0,
      ["critical" /* CRITICAL */]: 0
    };
    this.events.filter((event) => event.timestamp > oneHourAgo).forEach((event) => {
      eventCounts[event.severity]++;
    });
    Object.entries(this.alertThresholds).forEach(([severity, threshold]) => {
      if (eventCounts[severity] >= threshold) {
        this.triggerAlert(severity, eventCounts[severity]);
      }
    });
  }
  // Trigger security alert
  triggerAlert(severity, count4) {
    const message = `Security alert: ${count4} ${severity} events detected in the last hour`;
    logger2.error(`Security Alert: ${message}`);
    if (severity === "critical" /* CRITICAL */) {
      this.sendCriticalAlert(message);
    }
  }
  // Send critical alert
  sendCriticalAlert(message) {
    logger2.error(`CRITICAL SECURITY ALERT: ${message}`);
  }
  // Get security events
  getEvents(filters = {}, limit = 100, offset = 0) {
    let filteredEvents = [...this.events];
    if (filters.type) {
      filteredEvents = filteredEvents.filter((event) => event.type === filters.type);
    }
    if (filters.severity) {
      filteredEvents = filteredEvents.filter((event) => event.severity === filters.severity);
    }
    if (filters.userId) {
      filteredEvents = filteredEvents.filter((event) => event.userId === filters.userId);
    }
    if (filters.ipAddress) {
      filteredEvents = filteredEvents.filter((event) => event.ipAddress === filters.ipAddress);
    }
    if (filters.startDate) {
      filteredEvents = filteredEvents.filter((event) => event.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      filteredEvents = filteredEvents.filter((event) => event.timestamp <= filters.endDate);
    }
    if (filters.resolved !== void 0) {
      filteredEvents = filteredEvents.filter((event) => event.resolved === filters.resolved);
    }
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return filteredEvents.slice(offset, offset + limit);
  }
  // Get security statistics
  getStatistics() {
    const now = /* @__PURE__ */ new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1e3);
    const eventsByType = {};
    const eventsBySeverity = {};
    const eventsByUser = {};
    const eventsByIP = {};
    Object.values(SecurityEventType).forEach((type) => {
      eventsByType[type] = 0;
    });
    Object.values(SecurityEventSeverity).forEach((severity) => {
      eventsBySeverity[severity] = 0;
    });
    this.events.forEach((event) => {
      eventsByType[event.type]++;
      eventsBySeverity[event.severity]++;
      if (event.userId) {
        eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
      }
      eventsByIP[event.ipAddress] = (eventsByIP[event.ipAddress] || 0) + 1;
    });
    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsBySeverity,
      eventsByUser,
      eventsByIP,
      recentEvents: this.events.filter((event) => event.timestamp > oneDayAgo).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10),
      unresolvedEvents: this.events.filter((event) => !event.resolved).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    };
  }
  // Resolve security event
  resolveEvent(eventId, resolvedBy) {
    const event = this.events.find((e) => e.id === eventId);
    if (event) {
      event.resolved = true;
      event.resolvedAt = /* @__PURE__ */ new Date();
      event.resolvedBy = resolvedBy;
      logger2.info(`Security event resolved: ${eventId}`);
      return true;
    }
    return false;
  }
  // Get security score
  getSecurityScore() {
    const stats = this.getStatistics();
    let score = 100;
    const unresolvedCritical = stats.unresolvedEvents.filter((e) => e.severity === "critical" /* CRITICAL */).length;
    score -= unresolvedCritical * 20;
    const unresolvedHigh = stats.unresolvedEvents.filter((e) => e.severity === "high" /* HIGH */).length;
    score -= unresolvedHigh * 10;
    const unresolvedMedium = stats.unresolvedEvents.filter((e) => e.severity === "medium" /* MEDIUM */).length;
    score -= unresolvedMedium * 5;
    const loginFailures = stats.eventsByType["login_failure" /* LOGIN_FAILURE */];
    if (loginFailures > 100) {
      score -= 10;
    }
    const suspiciousActivity = stats.eventsByType["suspicious_activity" /* SUSPICIOUS_ACTIVITY */];
    if (suspiciousActivity > 50) {
      score -= 15;
    }
    return Math.max(0, Math.min(100, score));
  }
  // Generate security report
  generateReport() {
    const score = this.getSecurityScore();
    const stats = this.getStatistics();
    const recommendations = [];
    if (score < 50) {
      recommendations.push("CRITICAL: Immediate security attention required. Review all security logs and implement additional security measures.");
    } else if (score < 70) {
      recommendations.push("HIGH: Security issues detected. Review and address security vulnerabilities.");
    } else if (score < 85) {
      recommendations.push("MEDIUM: Some security concerns identified. Consider implementing additional security measures.");
    } else {
      recommendations.push("LOW: Security posture is good. Continue monitoring for potential issues.");
    }
    if (stats.eventsByType["login_failure" /* LOGIN_FAILURE */] > 50) {
      recommendations.push("High number of login failures detected. Consider implementing account lockout or two-factor authentication.");
    }
    if (stats.eventsByType["suspicious_activity" /* SUSPICIOUS_ACTIVITY */] > 20) {
      recommendations.push("Suspicious activity detected. Review IP addresses and user behavior patterns.");
    }
    if (stats.unresolvedEvents.length > 10) {
      recommendations.push("High number of unresolved security events. Prioritize resolving these issues.");
    }
    return {
      summary: `Security audit completed with score of ${score}/100`,
      score,
      statistics: stats,
      recommendations,
      generatedAt: /* @__PURE__ */ new Date()
    };
  }
  // Export security events
  exportEvents(format3 = "json") {
    if (format3 === "json") {
      return JSON.stringify(this.events, null, 2);
    } else if (format3 === "csv") {
      const headers = [
        "ID",
        "Type",
        "Severity",
        "User ID",
        "Session ID",
        "IP Address",
        "User Agent",
        "Timestamp",
        "Description",
        "Details",
        "Resolved"
      ];
      const rows = this.events.map((event) => [
        event.id,
        event.type,
        event.severity,
        event.userId || "",
        event.sessionId || "",
        event.ipAddress,
        event.userAgent,
        event.timestamp.toISOString(),
        event.description,
        JSON.stringify(event.details),
        event.resolved.toString()
      ]);
      return [headers, ...rows].map((row) => row.join(",")).join("\n");
    }
    return "";
  }
  // Clear old events
  clearOldEvents(olderThan = 30) {
    const cutoffDate = new Date(Date.now() - olderThan * 24 * 60 * 60 * 1e3);
    const initialCount = this.events.length;
    this.events = this.events.filter((event) => event.timestamp > cutoffDate);
    const clearedCount = initialCount - this.events.length;
    if (clearedCount > 0) {
      logger2.info(`Cleared ${clearedCount} old security events`);
    }
    return clearedCount;
  }
};
var securityAuditService = new SecurityAuditService();
var securityAuditMiddleware = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (res.statusCode === 401) {
      securityAuditService.logEvent(
        "unauthorized_access" /* UNAUTHORIZED_ACCESS */,
        "medium" /* MEDIUM */,
        "Unauthorized access attempt",
        {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        req
      );
    } else if (res.statusCode === 403) {
      securityAuditService.logEvent(
        "permission_denied" /* PERMISSION_DENIED */,
        "medium" /* MEDIUM */,
        "Permission denied",
        {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        req
      );
    } else if (res.statusCode === 429) {
      securityAuditService.logEvent(
        "rate_limit_exceeded" /* RATE_LIMIT_EXCEEDED */,
        "low" /* LOW */,
        "Rate limit exceeded",
        {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode
        },
        req
      );
    }
    return originalJson.call(this, data);
  };
  next();
};

// server/src/middleware/security.ts
var rateLimitStore = /* @__PURE__ */ new Map();
var createRateLimiter = (windowMs, max, message) => {
  return (req, res, next) => {
    const clientIp = req.ip || "unknown";
    const now = Date.now();
    const expiredEntries = [];
    rateLimitStore.forEach((entry2, key) => {
      if (now > entry2.resetTime) {
        expiredEntries.push(key);
      }
    });
    expiredEntries.forEach((key) => rateLimitStore.delete(key));
    let entry = rateLimitStore.get(clientIp);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitStore.set(clientIp, entry);
    } else {
      entry.count++;
    }
    if (entry.count > max) {
      return res.status(429).json({
        error: message,
        code: "RATE_LIMIT_EXCEEDED",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        retryAfter: Math.ceil((entry.resetTime - now) / 1e3)
      });
    }
    res.set({
      "X-RateLimit-Limit": max.toString(),
      "X-RateLimit-Remaining": (max - entry.count).toString(),
      "X-RateLimit-Reset": entry.resetTime.toString()
    });
    next();
  };
};
var apiRateLimiter = createRateLimiter(
  15 * 60 * 1e3,
  // 15 minutes
  100,
  // 100 requests per window
  "Too many API requests, please try again later"
);
var authRateLimiter = createRateLimiter(
  15 * 60 * 1e3,
  // 15 minutes
  5,
  // 5 login attempts per window
  "Too many authentication attempts, please try again later"
);
var uploadRateLimiter = createRateLimiter(
  60 * 60 * 1e3,
  // 1 hour
  10,
  // 10 uploads per hour
  "Too many file uploads, please try again later"
);
var aiRateLimiter = createRateLimiter(
  60 * 60 * 1e3,
  // 1 hour
  50,
  // 50 AI calls per hour
  "Too many AI service requests, please try again later"
);
var securityConfig = {
  rateLimit: {
    api: {
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: 100,
      message: "Too many API requests, please try again later"
    },
    auth: {
      windowMs: 15 * 60 * 1e3,
      // 15 minutes
      max: 5,
      message: "Too many authentication attempts, please try again later"
    },
    upload: {
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 10,
      message: "Too many file uploads, please try again later"
    },
    ai: {
      windowMs: 60 * 60 * 1e3,
      // 1 hour
      max: 50,
      message: "Too many AI service requests, please try again later"
    }
  },
  headers: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  },
  requestLimits: {
    maxBodySize: "10mb",
    maxUploadSize: "5mb"
  }
};
var enforceHttps = (req, res, next) => {
  const forceHttps = process.env.FORCE_HTTPS === "true";
  const isProduction = process.env.NODE_ENV === "production";
  if (!forceHttps || !isProduction) {
    return next();
  }
  const isHttps = req.protocol === "https" || req.secure || req.headers["x-forwarded-proto"] === "https" || req.headers["x-forwarded-protocol"] === "https";
  const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1" || req.ip === "127.0.0.1" || req.ip === "::1";
  if (!isHttps && !isLocalhost) {
    console.warn(`HTTPS enforcement: Blocking HTTP request from ${req.ip} to ${req.originalUrl}`);
    return res.status(403).json({
      error: "HTTPS is required for all API requests",
      code: "HTTPS_REQUIRED",
      message: "This API only accepts HTTPS requests for security reasons",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      protocol: req.protocol,
      hostname: req.hostname
    });
  }
  next();
};
var securityUtils = {
  // Sanitize input
  sanitize: (input) => {
    if (typeof input === "string") {
      return input.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"').replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
    }
    if (Array.isArray(input)) {
      return input.map(securityUtils.sanitize);
    }
    if (typeof input === "object" && input !== null) {
      const sanitized = {};
      for (const key in input) {
        sanitized[key] = securityUtils.sanitize(input[key]);
      }
      return sanitized;
    }
    return input;
  },
  // Validate input
  validate: (input, patterns) => {
    if (typeof input === "string") {
      return patterns.some((pattern) => pattern.test(input));
    }
    if (Array.isArray(input)) {
      return input.some((item) => securityUtils.validate(item, patterns));
    }
    if (typeof input === "object" && input !== null) {
      return Object.values(input).some((value) => securityUtils.validate(value, patterns));
    }
    return false;
  },
  // Generate secure token
  generateToken: (length = 32) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  // Hash password (simple implementation)
  hashPassword: (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
};

// server/src/middleware/secureSession.ts
var logger3 = new Logger("SecureSession");
var sessionStore = /* @__PURE__ */ new Map();
var SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1e3,
  // 24 hours
  cleanupInterval: 60 * 60 * 1e3,
  // 1 hour
  maxSessionsPerUser: 5,
  maxInactiveTime: 30 * 60 * 1e3
  // 30 minutes
};
function cleanupExpiredSessions() {
  const now = Date.now();
  const expiredSessions = [];
  sessionStore.forEach((session3, sessionId) => {
    if (now > session3.expiresAt || !session3.isActive) {
      expiredSessions.push(sessionId);
    }
  });
  expiredSessions.forEach((sessionId) => {
    sessionStore.delete(sessionId);
    logger3.debug("Cleaned up expired session:", sessionId);
  });
}
setInterval(cleanupExpiredSessions, SESSION_CONFIG.cleanupInterval);
var sessionMiddleware = (req, res, next) => {
  const sessionId = req.cookies?.sessionId || req.headers["x-session-id"];
  const clientIp = req.ip || "unknown";
  const userAgent = req.get("User-Agent") || "";
  if (sessionId) {
    const session3 = sessionStore.get(sessionId);
    if (session3) {
      if (Date.now() > session3.expiresAt) {
        sessionStore.delete(sessionId);
        logger3.warn("Expired session used:", sessionId);
        return res.status(401).json({
          success: false,
          error: "Session expired",
          code: "SESSION_EXPIRED"
        });
      }
      if (Date.now() - session3.lastAccessed > SESSION_CONFIG.maxInactiveTime) {
        sessionStore.delete(sessionId);
        logger3.warn("Session inactive too long:", sessionId);
        return res.status(401).json({
          success: false,
          error: "Session inactive",
          code: "SESSION_INACTIVE"
        });
      }
      if (session3.ipAddress !== clientIp) {
        logger3.warn(`IP address changed for session: ${sessionId}, From: ${session3.ipAddress}, To: ${clientIp}`);
      }
      session3.lastAccessed = Date.now();
      sessionStore.set(sessionId, session3);
      req.session = session3;
      req.user = { id: session3.userId };
    } else {
      logger3.warn("Invalid session ID used:", sessionId);
      return res.status(401).json({
        success: false,
        error: "Invalid session",
        code: "INVALID_SESSION"
      });
    }
  } else {
    const userId = req.user?.id;
    if (!userId) {
      logger3.warn("Attempt to create session without authenticated user");
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "AUTH_REQUIRED"
      });
    }
    const userSessions = Array.from(sessionStore.values()).filter((s) => s.userId === userId);
    if (userSessions.length >= SESSION_CONFIG.maxSessionsPerUser) {
      logger3.warn("Maximum sessions reached for user:", userId);
      const oldestSession = userSessions.reduce(
        (oldest, current) => current.createdAt < oldest.createdAt ? current : oldest
      );
      sessionStore.delete(oldestSession.id);
    }
    const sessionId2 = securityUtils.generateToken(64);
    const newSession = {
      id: sessionId2,
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_CONFIG.maxAge,
      lastAccessed: Date.now(),
      ipAddress: clientIp,
      userAgent,
      isActive: true
    };
    sessionStore.set(sessionId2, newSession);
    req.session = newSession;
    req.user = { id: userId };
    res.cookie("sessionId", sessionId2, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: SESSION_CONFIG.maxAge,
      path: "/"
    });
    logger3.info("New session created for user:", userId);
  }
  next();
};
var sessionManager = {
  // Get session by ID
  getSession: (sessionId) => {
    return sessionStore.get(sessionId);
  },
  // Get all sessions for user
  getUserSessions: (userId) => {
    return Array.from(sessionStore.values()).filter((s) => s.userId === userId);
  },
  // Invalidate session
  invalidateSession: (sessionId) => {
    const session3 = sessionStore.get(sessionId);
    if (session3) {
      session3.isActive = false;
      sessionStore.delete(sessionId);
      logger3.info("Session invalidated:", sessionId);
      return true;
    }
    return false;
  },
  // Invalidate all sessions for user
  invalidateUserSessions: (userId) => {
    const userSessions = Array.from(sessionStore.values()).filter((s) => s.userId === userId);
    userSessions.forEach((session3) => {
      session3.isActive = false;
      sessionStore.delete(session3.id);
    });
    logger3.info(`Invalidated ${userSessions.length} sessions for user:`, userId);
    return userSessions.length;
  },
  // Extend session
  extendSession: (sessionId) => {
    const session3 = sessionStore.get(sessionId);
    if (session3 && session3.isActive) {
      session3.expiresAt = Date.now() + SESSION_CONFIG.maxAge;
      session3.lastAccessed = Date.now();
      sessionStore.set(sessionId, session3);
      logger3.debug("Session extended:", sessionId);
      return true;
    }
    return false;
  },
  // Get session statistics
  getSessionStats: () => {
    const totalSessions = sessionStore.size;
    const activeSessions = Array.from(sessionStore.values()).filter((s) => s.isActive).length;
    const expiredSessions = totalSessions - activeSessions;
    return {
      totalSessions,
      activeSessions,
      expiredSessions,
      cleanupInterval: SESSION_CONFIG.cleanupInterval
    };
  }
};
var validateSession = (req, res, next) => {
  const session3 = req.session;
  if (!session3) {
    return res.status(401).json({
      success: false,
      error: "Session required",
      code: "SESSION_REQUIRED"
    });
  }
  if (!session3.isActive) {
    return res.status(401).json({
      success: false,
      error: "Session not active",
      code: "SESSION_NOT_ACTIVE"
    });
  }
  next();
};
var refreshSession = (req, res, next) => {
  const session3 = req.session;
  if (session3) {
    const now = Date.now();
    const timeUntilExpiry = session3.expiresAt - now;
    if (timeUntilExpiry < 60 * 60 * 1e3) {
      sessionManager.extendSession(session3.id);
      logger3.debug("Session refreshed:", session3.id);
    }
  }
  next();
};

// server/src/middleware/errorHandler.ts
var AppError = class extends Error {
  type;
  code;
  details;
  timestamp;
  requestId;
  constructor(type, code, message, details, requestId) {
    super(message);
    this.type = type;
    this.code = code;
    this.details = details;
    this.timestamp = /* @__PURE__ */ new Date();
    this.requestId = requestId || this.generateRequestId();
    this.name = "AppError";
  }
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};
var AuthorizationError = class extends AppError {
  constructor(message = "Access denied") {
    super("AUTHORIZATION_ERROR" /* AUTHORIZATION_ERROR */, "FORBIDDEN" /* FORBIDDEN */, message);
    this.name = "AuthorizationError";
  }
};

// server/src/routes/security.ts
var router18 = Router19();
var logger4 = new Logger("SecurityRoutes");
router18.use(validateSession);
var requireAdmin = (req, res, next) => {
  const user = req.user;
  if (!user || !user.isAdmin) {
    throw new AuthorizationError("Admin access required");
  }
  next();
};
router18.use(requireAdmin);
router18.get("/events", async (req, res) => {
  try {
    const {
      type,
      severity,
      userId,
      ipAddress,
      startDate,
      endDate,
      resolved,
      limit = "100",
      offset = "0",
      format: format3 = "json"
    } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (userId) filters.userId = userId;
    if (ipAddress) filters.ipAddress = ipAddress;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (resolved !== void 0) filters.resolved = resolved === "true";
    const events = securityAuditService.getEvents(
      filters,
      parseInt(limit),
      parseInt(offset)
    );
    if (format3 === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="security_events.csv"');
      return res.send(securityAuditService.exportEvents("csv"));
    }
    res.json({
      success: true,
      data: events,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: events.length
      },
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error getting security events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve security events",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router18.get("/statistics", async (req, res) => {
  try {
    const statistics = securityAuditService.getStatistics();
    res.json({
      success: true,
      data: statistics,
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error getting security statistics:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve security statistics",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router18.get("/report", async (req, res) => {
  try {
    const report = securityAuditService.generateReport();
    res.json({
      success: true,
      data: report,
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error generating security report:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate security report",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router18.get("/score", async (req, res) => {
  try {
    const score = securityAuditService.getSecurityScore();
    res.json({
      success: true,
      data: {
        score,
        status: score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "fair" : "poor"
      },
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error getting security score:", error);
    res.status(500).json({
      success: false,
      error: "Failed to calculate security score",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router18.put("/events/:eventId/resolve", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { resolvedBy } = req.body;
    if (!resolvedBy) {
      throw new AppError("VALIDATION_ERROR", "VALIDATION_ERROR", "resolvedBy field is required");
    }
    const success = securityAuditService.resolveEvent(eventId, resolvedBy);
    if (!success) {
      throw new AppError("NOT_FOUND", "EVENT_NOT_FOUND", "Security event not found");
    }
    res.json({
      success: true,
      message: "Security event resolved successfully",
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error resolving security event:", error);
    if (error instanceof AppError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: /* @__PURE__ */ new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to resolve security event",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
});
router18.get("/export", async (req, res) => {
  try {
    const { format: format3 = "json", type, severity, startDate, endDate } = req.query;
    const filters = {};
    if (type) filters.type = type;
    if (severity) filters.severity = severity;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    const events = securityAuditService.getEvents(filters);
    let exportData;
    let contentType;
    let filename;
    if (format3 === "csv") {
      exportData = securityAuditService.exportEvents("csv");
      contentType = "text/csv";
      filename = "security_events.csv";
    } else {
      exportData = JSON.stringify(events, null, 2);
      contentType = "application/json";
      filename = "security_events.json";
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(exportData);
  } catch (error) {
    logger4.error("Error exporting security events:", error);
    res.status(500).json({
      success: false,
      error: "Failed to export security events",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router18.delete("/events/clear", async (req, res) => {
  try {
    const { olderThan = "30" } = req.query;
    const days = parseInt(olderThan);
    if (isNaN(days) || days < 1) {
      throw new AppError("VALIDATION_ERROR", "VALIDATION_ERROR", "olderThan must be a valid number greater than 0");
    }
    const clearedCount = securityAuditService.clearOldEvents(days);
    res.json({
      success: true,
      message: `Cleared ${clearedCount} old security events`,
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error clearing old security events:", error);
    if (error instanceof AppError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: /* @__PURE__ */ new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to clear old security events",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
});
router18.post("/events/log", async (req, res) => {
  try {
    const { type, severity, description, details } = req.body;
    if (!type || !severity || !description) {
      throw new AppError("VALIDATION_ERROR", "VALIDATION_ERROR", "type, severity, and description are required");
    }
    securityAuditService.logEvent(
      type,
      severity,
      description,
      details || {},
      req
    );
    res.json({
      success: true,
      message: "Security event logged successfully",
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error logging security event:", error);
    if (error instanceof AppError) {
      res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        timestamp: /* @__PURE__ */ new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Failed to log security event",
        timestamp: /* @__PURE__ */ new Date()
      });
    }
  }
});
router18.get("/recommendations", async (req, res) => {
  try {
    const report = securityAuditService.generateReport();
    res.json({
      success: true,
      data: {
        recommendations: report.recommendations,
        score: report.score,
        generatedAt: report.generatedAt
      },
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error getting security recommendations:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve security recommendations",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
router18.get("/event-types", async (req, res) => {
  try {
    const eventTypes = Object.values(SecurityEventType).map((type) => ({
      value: type,
      label: type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    }));
    const severities = Object.values(SecurityEventSeverity).map((severity) => ({
      value: severity,
      label: severity.charAt(0).toUpperCase() + severity.slice(1)
    }));
    res.json({
      success: true,
      data: {
        eventTypes,
        severities
      },
      timestamp: /* @__PURE__ */ new Date()
    });
  } catch (error) {
    logger4.error("Error getting security event types:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve security event types",
      timestamp: /* @__PURE__ */ new Date()
    });
  }
});
var security_default2 = router18;

// server/src/routes/user/index.ts
import { Router as Router25 } from "express";

// server/src/services/userProfileService.ts
init_db2();
init_schema();
import { eq as eq9 } from "drizzle-orm";
var userProfileService_default = {
  async updateProfile(userId, updates) {
    const fields = [];
    const params = [];
    for (const [field, value] of Object.entries(updates)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    params.push(userId);
    await db_default.execute(
      `UPDATE user_profiles SET ${fields.join(", ")} WHERE user_id = ?`,
      params
    );
    return this.getProfile(userId);
  },
  async getProfile(userId) {
    const [profiles] = await db_default.execute(
      "SELECT * FROM user_profiles WHERE user_id = ?",
      [userId]
    );
    return profiles.length ? profiles[0] : { user_id: userId };
  },
  async getSettings(userId) {
    const [settings] = await db_default.execute(
      "SELECT * FROM user_settings WHERE user_id = ?",
      [userId]
    );
    return settings.length ? settings[0] : {};
  },
  async updateSettings(userId, settings) {
    const fields = [];
    const params = [];
    for (const [field, value] of Object.entries(settings)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    params.push(userId);
    await db_default.execute(
      `UPDATE user_settings SET ${fields.join(", ")} WHERE user_id = ?`,
      params
    );
    return this.getSettings(userId);
  },
  async markOnboardingCompleted(userId) {
    await db_default.execute(
      "UPDATE users SET onboarding_completed = true WHERE id = ?",
      [userId]
    );
  },
  async getUserStats(userId) {
    try {
      console.log("DEBUG: getUserStats called for userId:", userId);
      let [stats] = await db2.select().from(weeklyStats).where(eq9(weeklyStats.userId, userId));
      if (!stats) {
        console.log(`DEBUG: No weekly stats found for user ${userId}, creating default stats`);
        stats = await this.createDefaultWeeklyStats(userId);
      }
      const parsedStats = {
        ...stats,
        caloriesByDay: typeof stats.caloriesByDay === "string" ? JSON.parse(stats.caloriesByDay) : stats.caloriesByDay,
        macrosByDay: stats.macrosByDay ? typeof stats.macrosByDay === "string" ? JSON.parse(stats.macrosByDay) : stats.macrosByDay : void 0
      };
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
      console.log("DEBUG: getUserStats returning:", JSON.stringify(parsedStats, null, 2));
      return parsedStats;
    } catch (error) {
      console.error("Error in getUserStats:", error);
      throw new Error("Failed to fetch user statistics");
    }
  },
  async createDefaultWeeklyStats(userId) {
    const now = /* @__PURE__ */ new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const defaultStats = {
      userId,
      averageCalories: 0,
      mealsTracked: 0,
      averageProtein: 0,
      healthiestDay: "Sunday",
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
    const result = await db2.insert(weeklyStats).values(defaultStats);
    const insertId = result.insertId || result[0]?.insertId;
    if (!insertId) throw new Error("Failed to get inserted weekly stats id");
    const [stats] = await db2.select().from(weeklyStats).where(eq9(weeklyStats.id, insertId));
    return stats;
  }
};

// server/src/controllers/userProfileController.ts
var userProfileController_default = {
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updates = req.body;
      const updatedProfile = await userProfileService_default.updateProfile(userId, updates);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  },
  async getSettings(req, res) {
    try {
      const userId = req.user.id;
      const settings = await userProfileService_default.getSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  },
  async updateSettings(req, res) {
    try {
      const userId = req.user.id;
      const settings = req.body;
      const updatedSettings = await userProfileService_default.updateSettings(userId, settings);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ error: "Failed to update settings" });
    }
  },
  async markOnboardingCompleted(req, res) {
    try {
      const userId = req.user.id;
      await userProfileService_default.markOnboardingCompleted(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to mark onboarding completed" });
    }
  },
  async getUserStats(req, res) {
    try {
      console.log("DEBUG: getUserStats controller called");
      const userId = req.user.id;
      console.log("DEBUG: userId from request:", userId);
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const stats = await userProfileService_default.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  }
};

// server/src/routes/user/referrals.ts
import { Router as Router20 } from "express";
init_db();
init_schema();
import { eq as eq10, desc as desc4 } from "drizzle-orm";
var router19 = Router20();
router19.use(isAuthenticated);
router19.get("/commissions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const commissions = await db.select().from(referralCommissions).where(eq10(referralCommissions.referrerId, userId)).orderBy(desc4(referralCommissions.createdAt));
    res.json(commissions.map((commission) => ({
      id: commission.id,
      amount: Number(commission.amount),
      status: commission.status,
      created_at: commission.createdAt,
      is_recurring: commission.isRecurring
    })));
  } catch (error) {
    console.error("Error fetching user commissions:", error);
    res.status(500).json({ message: "Failed to fetch commissions" });
  }
});
router19.get("/code", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const [user] = await db.select({ referralCode: users.referralCode }).from(users).where(eq10(users.id, userId));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ referralCode: user.referralCode });
  } catch (error) {
    console.error("Error fetching referral code:", error);
    res.status(500).json({ message: "Failed to fetch referral code" });
  }
});
var referrals_default = router19;

// server/src/routes/user/meals.ts
import { Router as Router21 } from "express";

// server/src/services/mealService.ts
init_db2();
var mealService_default = {
  async getUserMeals(userId, date3, type) {
    let query = "SELECT * FROM meals WHERE user_id = ?";
    const params = [userId];
    if (date3) {
      query += " AND date = ?";
      params.push(date3);
    }
    if (type) {
      query += " AND type = ?";
      params.push(type);
    }
    const [meals] = await db_default.execute(query, params);
    return meals;
  },
  async createMeal(userId, mealData) {
    const [result] = await db_default.execute(
      "INSERT INTO meals (user_id, name, calories, protein, carbs, fat, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, mealData.name, mealData.calories, mealData.protein, mealData.carbs, mealData.fat, mealData.date]
    );
    return { id: result.insertId, ...mealData };
  },
  async updateMeal(userId, mealId, updates) {
    const fields = [];
    const params = [];
    for (const [field, value] of Object.entries(updates)) {
      fields.push(`${field} = ?`);
      params.push(value);
    }
    params.push(mealId, userId);
    await db_default.execute(
      `UPDATE meals SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
      params
    );
    return this.getMealById(userId, mealId);
  },
  async deleteMeal(userId, mealId) {
    await db_default.execute(
      "DELETE FROM meals WHERE id = ? AND user_id = ?",
      [mealId, userId]
    );
  },
  async getMealById(userId, mealId) {
    const [meals] = await db_default.execute(
      "SELECT * FROM meals WHERE id = ? AND user_id = ?",
      [mealId, userId]
    );
    return meals.length ? meals[0] : null;
  },
  async getDailySummary(userId, date3) {
    const [summary] = await db_default.execute(
      `SELECT 
        SUM(calories) as totalCalories,
        SUM(protein) as totalProtein,
        SUM(carbs) as totalCarbs,
        SUM(fat) as totalFat
       FROM meals 
       WHERE user_id = ? AND date = ?`,
      [userId, date3]
    );
    return summary.length ? summary[0] : {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    };
  }
};

// server/src/controllers/mealController.ts
var mealController_default = {
  async getMeals(req, res) {
    try {
      const userId = req.user.id;
      const { date: date3, type } = req.query;
      const meals = await mealService_default.getUserMeals(userId, date3, type);
      res.json(meals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get meals" });
    }
  },
  async createMeal(req, res) {
    try {
      const userId = req.user.id;
      const mealData = req.body;
      const meal = await mealService_default.createMeal(userId, mealData);
      res.status(201).json(meal);
    } catch (error) {
      res.status(400).json({ error: "Failed to create meal" });
    }
  },
  async updateMeal(req, res) {
    try {
      const userId = req.user.id;
      const mealId = parseInt(req.params.id);
      const updates = req.body;
      const updatedMeal = await mealService_default.updateMeal(userId, mealId, updates);
      res.json(updatedMeal);
    } catch (error) {
      res.status(400).json({ error: "Failed to update meal" });
    }
  },
  async deleteMeal(req, res) {
    try {
      const userId = req.user.id;
      const mealId = parseInt(req.params.id);
      await mealService_default.deleteMeal(userId, mealId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: "Failed to delete meal" });
    }
  },
  async analyzeMealImage(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const contentType = req.headers["content-type"] || "";
      const { imageStorageService: imageStorageService2 } = await Promise.resolve().then(() => (init_imageStorageService(), imageStorageService_exports));
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage_provider(), storage_provider_exports));
      let buffer = null;
      let originalName = "upload.jpg";
      let mimeType = "image/jpeg";
      if (contentType.includes("multipart/form-data") && req.file) {
        buffer = req.file.buffer;
        originalName = req.file.originalname || originalName;
        mimeType = req.file.mimetype || mimeType;
      } else if (typeof req.body?.imageData === "string") {
        const imageData = req.body.imageData.includes("base64,") ? req.body.imageData.split("base64,")[1] : req.body.imageData;
        buffer = Buffer.from(imageData, "base64");
        if (req.body.imageData.startsWith("data:image/")) {
          const mt = req.body.imageData.substring(5, req.body.imageData.indexOf(";"));
          if (mt) mimeType = mt;
        }
      }
      if (!buffer) {
        return res.status(400).json({ error: 'No image provided. Send multipart with field "image" or JSON { imageData }.' });
      }
      const processed = await imageStorageService2.processAndStoreImage(
        buffer,
        originalName,
        mimeType,
        userId
      );
      const base64ForAI = buffer.toString("base64");
      const { aiService: aiService2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
      let analysis = await aiService2.analyzeFoodImage(base64ForAI);
      const mealAnalysis = await storage2.createMealAnalysis({
        userId,
        mealId: 0,
        foodName: analysis.foodName,
        estimatedCalories: analysis.calories,
        estimatedProtein: analysis.protein?.toString(),
        estimatedCarbs: analysis.carbs?.toString(),
        estimatedFat: analysis.fat?.toString(),
        imageUrl: `data:image/jpeg;base64,${base64ForAI}`,
        analysisDetails: analysis.analysisDetails
      });
      const { db: db3 } = await Promise.resolve().then(() => (init_db2(), db_exports2));
      const { mealImages: mealImages2 } = await Promise.resolve().then(() => (init_mealImages(), mealImages_exports));
      const { mealAnalyses: mealAnalyses2 } = await Promise.resolve().then(() => (init_mealAnalyses(), mealAnalyses_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const filename = processed.original.filename;
      const optimizedUrl = imageStorageService2.getImageUrl(processed.optimized.path, "optimized");
      await db3.insert(mealImages2).values({
        mealAnalysisId: mealAnalysis.id,
        filePath: filename,
        fileSize: processed.optimized.size,
        mimeType: processed.optimized.mimeType,
        width: processed.optimized.width || null,
        height: processed.optimized.height || null,
        imageHash: processed.original.hash
      });
      await db3.update(mealAnalyses2).set({
        imageHash: processed.original.hash,
        imageUrl: optimizedUrl
      }).where(eq13(mealAnalyses2.id, mealAnalysis.id));
      return res.status(201).json({
        ...mealAnalysis,
        imageUrl: optimizedUrl
      });
    } catch (error) {
      console.error("Meal analysis failed:", error);
      res.status(400).json({ error: "Meal analysis failed" });
    }
  },
  async getDailySummary(req, res) {
    try {
      const userId = req.user.id;
      const { date: date3 } = req.query;
      const summary = await mealService_default.getDailySummary(userId, date3);
      res.json(summary);
    } catch (error) {
      res.status(400).json({ error: "Failed to get daily summary" });
    }
  }
};

// server/src/services/validation.ts
var validation_default = {
  validate(schema2) {
    return (req, res, next) => {
      for (const [field, rules] of Object.entries(schema2)) {
        const value = req.body[field];
        if (rules.required && !value) {
          return res.status(400).json({ error: `${field} is required` });
        }
        if (value) {
          if (rules.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
            return res.status(400).json({ error: "Invalid email format" });
          }
          if (rules.minLength && value.length < rules.minLength) {
            return res.status(400).json({
              error: `${field} must be at least ${rules.minLength} characters`
            });
          }
          if (rules.type === "string" && typeof value !== "string") {
            return res.status(400).json({ error: `${field} must be a string` });
          }
          if (rules.type === "number" && typeof value !== "number") {
            return res.status(400).json({ error: `${field} must be a number` });
          }
          if (rules.min !== void 0 && value < rules.min) {
            return res.status(400).json({
              error: `${field} must be at least ${rules.min}`
            });
          }
          if (rules.type === "boolean" && typeof value !== "boolean") {
            return res.status(400).json({ error: `${field} must be a boolean` });
          }
        }
      }
      next();
    };
  }
};

// server/src/routes/user/meals.ts
var router20 = Router21();
router20.use(auth_default.authenticate);
router20.get(
  "/",
  validation_default.validate({
    date: { type: "string", required: false },
    type: { type: "string", required: false }
  }),
  mealController_default.getMeals
);
router20.post(
  "/",
  validation_default.validate({
    name: { type: "string", required: true, minLength: 2 },
    calories: { type: "number", required: true },
    protein: { type: "number", required: true },
    carbs: { type: "number", required: true },
    fat: { type: "number", required: true },
    date: { type: "string", required: true }
  }),
  mealController_default.createMeal
);
router20.put(
  "/:id",
  validation_default.validate({
    name: { type: "string", required: false },
    calories: { type: "number", required: false },
    protein: { type: "number", required: false },
    carbs: { type: "number", required: false },
    fat: { type: "number", required: false }
  }),
  mealController_default.updateMeal
);
router20.delete("/:id", mealController_default.deleteMeal);
router20.post(
  "/analyze",
  mealController_default.analyzeMealImage
);
router20.get(
  "/daily-summary",
  validation_default.validate({
    date: { type: "string", required: true }
  }),
  mealController_default.getDailySummary
);
var meals_default = router20;

// server/src/routes/user/nutritionCoach.ts
import { Router as Router22 } from "express";

// server/src/services/nutritionCoachService.ts
init_db2();
init_vite();
import OpenAI2 from "openai";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY
});
var nutritionCoachService_default = {
  async askQuestion(userId, question) {
    try {
      const systemPrompt = `You are an expert nutrition coach with deep knowledge of:
- Macronutrients and micronutrients
- Meal planning and food combinations
- Weight management and fitness nutrition
- Dietary restrictions and special diets
- Health conditions and nutrition
- Sports nutrition and performance
- Metabolism and digestive health
- Food quality and sourcing

Provide evidence-based, personalized nutrition advice. Be encouraging, practical, and specific.
Include scientific reasoning when appropriate, but keep advice accessible and actionable.

User context: User ID ${userId}
Question: ${question}`;
      const response = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9
      });
      const aiAnswer = response.choices[0]?.message?.content || "I apologize, but I'm having trouble providing a response right now. Please try rephrasing your question.";
      const answer = {
        id: Date.now(),
        user_id: userId,
        question,
        answer: aiAnswer,
        rating: null,
        comment: null,
        created_at: /* @__PURE__ */ new Date()
      };
      await db_default.execute(
        "INSERT INTO coach_answers (user_id, question, answer) VALUES (?, ?, ?)",
        [userId, question, aiAnswer]
      );
      log(`AI nutrition coach response generated for user ${userId}`);
      return answer;
    } catch (error) {
      log("AI nutrition coach error:", error instanceof Error ? error.message : String(error));
      const fallbackAnswer = this.generateFallbackAnswer(question);
      const answer = {
        id: Date.now(),
        user_id: userId,
        question,
        answer: fallbackAnswer,
        rating: null,
        comment: null,
        created_at: /* @__PURE__ */ new Date()
      };
      await db_default.execute(
        "INSERT INTO coach_answers (user_id, question, answer) VALUES (?, ?, ?)",
        [userId, question, fallbackAnswer]
      );
      return answer;
    }
  },
  generateFallbackAnswer(question) {
    const questionLower = question.toLowerCase();
    if (questionLower.includes("protein")) {
      return "Protein is essential for muscle maintenance and overall health. Aim for 0.8-1.2g of protein per kg of body weight daily. Good sources include lean meats, fish, eggs, legumes, and dairy. Consider spreading your protein intake throughout the day for better absorption.";
    }
    if (questionLower.includes("carb") || questionLower.includes("carbohydrate")) {
      return "Carbohydrates are your body's primary energy source. Focus on complex carbohydrates like whole grains, vegetables, and fruits rather than simple sugars. The amount you need depends on your activity level - more active individuals may need 45-65% of calories from carbs, while less active individuals may do better with 20-35%.";
    }
    if (questionLower.includes("fat")) {
      return "Healthy fats are crucial for hormone production, nutrient absorption, and brain health. Include sources like avocados, nuts, seeds, olive oil, and fatty fish. Aim for 20-35% of your daily calories from fat, with an emphasis on unsaturated fats over saturated fats.";
    }
    if (questionLower.includes("weight") && (questionLower.includes("loss") || questionLower.includes("lose"))) {
      return "Sustainable weight loss typically involves a moderate calorie deficit of 300-500 calories per day, combined with regular physical activity. Focus on whole, nutrient-dense foods, adequate protein intake, and proper hydration. Aim for 1-2 pounds of weight loss per week for long-term success.";
    }
    if (questionLower.includes("weight") && (questionLower.includes("gain") || questionLower.includes("muscle"))) {
      return "To gain weight healthily, focus on a calorie surplus of 300-500 calories per day, with emphasis on protein and strength training. Include nutrient-dense foods like nuts, seeds, avocados, whole grains, and lean proteins. Aim for 0.5-1 pound of weight gain per week.";
    }
    if (questionLower.includes("breakfast")) {
      return "A balanced breakfast should include protein, healthy fats, and complex carbohydrates. Good options include Greek yogurt with berries and nuts, oatmeal with nut butter and fruit, or eggs with whole grain toast and avocado. This combination helps maintain stable blood sugar and keeps you full longer.";
    }
    if (questionLower.includes("snack")) {
      return "Healthy snacks should combine protein and fiber to keep you satisfied. Good options include apple slices with peanut butter, Greek yogurt with a few almonds, carrot sticks with hummus, or a small handful of nuts with a piece of fruit. Avoid sugary snacks that cause energy crashes.";
    }
    if (questionLower.includes("hydrate") || questionLower.includes("water")) {
      return "Proper hydration is crucial for metabolism, energy levels, and overall health. Aim for 8-10 glasses (2-3 liters) of water daily, more if you're active. Signs of dehydration include dark urine, fatigue, and headaches. Drink water before meals to help with portion control and consider adding lemon or cucumber for flavor.";
    }
    if (questionLower.includes("supplement")) {
      return "Most people can get adequate nutrients from a balanced diet. However, certain supplements may be beneficial based on individual needs: Vitamin D (especially in winter months), Omega-3 fatty acids for heart and brain health, and probiotics for gut health. Always consult with a healthcare provider before starting supplements.";
    }
    if (questionLower.includes("meal") && questionLower.includes("plan")) {
      return "Effective meal planning involves: 1) Setting realistic goals, 2) Preparing in advance, 3) Balancing macronutrients, 4) Including variety, 5) Prepping ingredients ahead of time, and 6) Having backup options. Start with planning 3-4 days at a time and gradually increase as you get comfortable.";
    }
    return "That's a great nutrition question! For personalized advice, consider factors like your age, activity level, health goals, and any dietary restrictions. A balanced diet typically includes plenty of vegetables, fruits, lean proteins, whole grains, and healthy fats. Would you like to share more details about your specific situation so I can provide more targeted advice?";
  },
  async getHistory(userId) {
    const [answers] = await db_default.execute(
      "SELECT * FROM coach_answers WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return answers;
  },
  async submitFeedback(userId, answerId, rating, comment) {
    await db_default.execute(
      "UPDATE coach_answers SET rating = ?, comment = ? WHERE id = ? AND user_id = ?",
      [rating, comment, answerId, userId]
    );
  },
  async getRecommendations(userId) {
    try {
      const [userStats] = await db_default.execute(
        "SELECT COUNT(*) as meal_count, AVG(calories) as avg_calories FROM meals WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)",
        [userId]
      );
      const [goals] = await db_default.execute(
        "SELECT daily_calories, daily_protein, daily_carbs, daily_fat FROM nutrition_goals WHERE user_id = ?",
        [userId]
      );
      const systemPrompt = `Generate 3-5 personalized nutrition recommendations for a user with the following context:

Recent Activity:
- Meals logged in last 7 days: ${userStats[0]?.meal_count || 0}
- Average calories per meal: ${Math.round(userStats[0]?.avg_calories || 0)}

Nutrition Goals:
- Daily calories: ${goals[0]?.daily_calories || "not set"}
- Daily protein: ${goals[0]?.daily_protein || "not set"}g
- Daily carbs: ${goals[0]?.daily_carbs || "not set"}g
- Daily fat: ${goals[0]?.daily_fat || "not set"}g

Provide specific, actionable recommendations that address potential gaps or improvements. Focus on practical changes that can be implemented immediately.

Format your response as a JSON array of objects with: id, text, category, priority (high/medium/low)`;
      const response = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.6
      });
      const recommendationsText = response.choices[0]?.message?.content || "[]";
      let recommendations;
      try {
        recommendations = JSON.parse(recommendationsText);
      } catch {
        recommendations = this.generateFallbackRecommendations(userStats[0], goals[0]);
      }
      return recommendations;
    } catch (error) {
      log("AI recommendations error:", error instanceof Error ? error.message : String(error));
      return this.generateFallbackRecommendations(null, null);
    }
  },
  generateFallbackRecommendations(userStats, goals) {
    const recommendations = [];
    if (!goals || !goals.daily_calories) {
      recommendations.push({
        id: 1,
        text: "Set your daily calorie goals to better track your nutrition",
        category: "goal_setting",
        priority: "high"
      });
    }
    if (!goals || !goals.daily_protein) {
      recommendations.push({
        id: 2,
        text: "Ensure adequate protein intake (0.8-1.2g per kg of body weight)",
        category: "protein",
        priority: "medium"
      });
    }
    if (userStats && userStats.meal_count < 10) {
      recommendations.push({
        id: 3,
        text: "Try to log your meals consistently for better nutrition tracking",
        category: "meal_tracking",
        priority: "medium"
      });
    }
    recommendations.push({
      id: 4,
      text: "Include vegetables in every meal for better micronutrient intake",
      category: "vegetables",
      priority: "low"
    });
    return recommendations;
  },
  async getTips() {
    try {
      const systemPrompt = `Generate 5 practical, evidence-based nutrition tips that are:
1. Easy to implement in daily life
2. Backed by nutritional science
3. Applicable to most people
4. Specific and actionable
5. Cover different aspects of nutrition (hydration, meal timing, food quality, etc.)

Format your response as a JSON array of strings, where each string is a complete tip.`;
      const response = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      const tipsText = response.choices[0]?.message?.content || "[]";
      let tips;
      try {
        tips = JSON.parse(tipsText);
      } catch {
        tips = [
          "Drink a glass of water before each meal to help with portion control",
          "Include a source of protein in every meal to stay satisfied longer",
          "Choose whole grains over refined carbohydrates for better energy levels",
          "Eat the rainbow - include colorful fruits and vegetables for diverse nutrients",
          "Practice mindful eating by eating slowly and without distractions"
        ];
      }
      return tips;
    } catch (error) {
      log("AI tips error:", error instanceof Error ? error.message : String(error));
      return [
        "Drink a glass of water before each meal to help with portion control",
        "Include a source of protein in every meal to stay satisfied longer",
        "Choose whole grains over refined carbohydrates for better energy levels",
        "Eat the rainbow - include colorful fruits and vegetables for diverse nutrients",
        "Practice mindful eating by eating slowly and without distractions"
      ];
    }
  }
};

// server/src/controllers/nutritionCoachController.ts
var nutritionCoachController_default = {
  async askQuestion(req, res) {
    try {
      const userId = req.user.id;
      const { question } = req.body;
      const response = await nutritionCoachService_default.askQuestion(userId, question);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: "Failed to process question" });
    }
  },
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const history = await nutritionCoachService_default.getHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to get history" });
    }
  },
  async submitFeedback(req, res) {
    try {
      const userId = req.user.id;
      const answerId = parseInt(req.params.id);
      const { rating, comment } = req.body;
      await nutritionCoachService_default.submitFeedback(userId, answerId, rating, comment);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Invalid feedback submission" });
    }
  },
  async getRecommendations(req, res) {
    try {
      const userId = req.user.id;
      const recommendations = await nutritionCoachService_default.getRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  },
  async getTips(req, res) {
    try {
      const tips = await nutritionCoachService_default.getTips();
      res.json(tips);
    } catch (error) {
      res.status(500).json({ error: "Failed to get tips" });
    }
  }
};

// server/src/routes/user/nutritionCoach.ts
var router21 = Router22();
router21.use(authenticate);
router21.post(
  "/ask",
  validation_default.validate({
    question: { type: "string", required: true, minLength: 10 }
  }),
  nutritionCoachController_default.askQuestion
);
router21.get("/history", nutritionCoachController_default.getHistory);
router21.post(
  "/answers/:id/feedback",
  validation_default.validate({
    rating: { type: "number", required: true, min: 1, max: 5 },
    comment: { type: "string", required: false }
  }),
  nutritionCoachController_default.submitFeedback
);
router21.get("/recommendations", nutritionCoachController_default.getRecommendations);
router21.get("/tips", nutritionCoachController_default.getTips);
var nutritionCoach_default = router21;

// server/src/routes/user/profile.ts
import { Router as Router23 } from "express";
var router22 = Router23();
router22.use(authenticate);
router22.put(
  "/",
  validation_default.validate({
    username: { type: "string", required: false, minLength: 3 },
    height: { type: "number", required: false, min: 100 },
    weight: { type: "number", required: false, min: 30 },
    birthdate: { type: "string", required: false }
  }),
  (req, res, next) => {
    console.log(`[USER PROFILE] Update profile request:`, req.body);
    console.log(`[USER PROFILE] Authenticated user:`, req.user);
    next();
  },
  userProfileController_default.updateProfile
);
router22.get("/settings", userProfileController_default.getSettings);
router22.put(
  "/settings",
  validation_default.validate({
    notifications: { type: "boolean", required: false },
    darkMode: { type: "boolean", required: false },
    measurementSystem: { type: "string", required: false }
  }),
  userProfileController_default.updateSettings
);
router22.post(
  "/onboarding-completed",
  userProfileController_default.markOnboardingCompleted
);
router22.get("/stats", userProfileController_default.getUserStats);
var profile_default = router22;

// server/src/routes/user/enhanced-food-recognition.ts
import { Router as Router24 } from "express";

// server/src/services/enhancedFoodRecognitionService.ts
init_vite();
var EnhancedFoodRecognitionService = class {
  providers = {
    openai: null,
    // Will be initialized with actual OpenAI service
    google: null,
    // Will be initialized with actual Google service
    anthropic: null,
    // Will be initialized with actual Anthropic service
    nutritionix: null
    // Will be initialized with actual Nutritionix service
  };
  constructor() {
    this.initializeProviders();
  }
  /**
   * Initialize the service (public method for external initialization)
   */
  async initialize() {
    return Promise.resolve();
  }
  initializeProviders() {
    this.providers.openai = {
      analyze: async (imageBuffer, options) => {
        return this.mockOpenAIAnalysis(imageBuffer, options);
      }
    };
    this.providers.google = {
      analyze: async (imageBuffer, options) => {
        return this.mockGoogleAnalysis(imageBuffer, options);
      }
    };
    this.providers.anthropic = {
      analyze: async (imageBuffer, options) => {
        return this.mockAnthropicAnalysis(imageBuffer, options);
      }
    };
    this.providers.nutritionix = {
      analyze: async (imageBuffer, options) => {
        return this.mockNutritionixAnalysis(imageBuffer, options);
      }
    };
  }
  /**
   * Analyze food image using the specified provider
   */
  async analyzeFoodImage(options) {
    try {
      const { imageBuffer, userId, provider = "openai", language = "en", includeAlternatives = false } = options;
      if (!imageBuffer || imageBuffer.length === 0) {
        throw new Error("Image buffer is required");
      }
      if (!userId) {
        throw new Error("User ID is required");
      }
      const service = this.providers[provider];
      if (!service) {
        throw new Error(`Provider ${provider} is not available`);
      }
      const result = await service.analyze(imageBuffer, { userId, language, includeAlternatives });
      log(`Food analysis completed for user ${userId} using provider ${provider}`);
      return result;
    } catch (error) {
      console.error("Error analyzing food image:", error);
      throw new Error(`Food analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Batch analyze multiple food images
   */
  async batchAnalyzeFoodImages(options) {
    try {
      const results = await Promise.allSettled(
        options.map((option) => this.analyzeFoodImage(option))
      );
      const successfulResults = [];
      const errors = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successfulResults.push(result.value);
        } else {
          errors.push(`Image ${index + 1}: ${result.reason.message}`);
        }
      });
      if (errors.length > 0) {
        console.warn("Some food analyses failed:", errors);
      }
      return successfulResults;
    } catch (error) {
      console.error("Error in batch food analysis:", error);
      throw new Error(`Batch food analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Get available food recognition providers
   */
  getAvailableProviders() {
    return Object.keys(this.providers).filter((key) => this.providers[key] !== null);
  }
  /**
   * Get provider status and capabilities
   */
  getProviderStatus(provider) {
    const service = this.providers[provider];
    return {
      available: service !== null,
      capabilities: service ? this.getProviderCapabilities(provider) : []
    };
  }
  /**
   * Get capabilities for a specific provider
   */
  getProviderCapabilities(provider) {
    const capabilities = {
      openai: ["food_recognition", "nutritional_analysis", "portion_estimation", "alternative_suggestions"],
      google: ["food_recognition", "nutritional_analysis", "category_classification"],
      anthropic: ["food_recognition", "nutritional_analysis", "dietary_compatibility"],
      nutritionix: ["food_recognition", "nutritional_analysis", "barcode_matching"]
    };
    return capabilities[provider] || [];
  }
  /**
   * Mock OpenAI analysis implementation
   */
  async mockOpenAIAnalysis(imageBuffer, options) {
    await new Promise((resolve2) => setTimeout(resolve2, 1e3 + Math.random() * 2e3));
    const foods = [
      {
        name: "Grilled Chicken Breast",
        confidence: 0.95,
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74,
        portionSize: "100g",
        estimatedWeight: 150,
        category: "protein",
        tags: ["chicken", "grilled", "lean", "protein-rich"],
        alternatives: ["Turkey Breast", "Tofu", "Fish"]
      },
      {
        name: "Brown Rice",
        confidence: 0.92,
        calories: 111,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        fiber: 1.8,
        sugar: 0.4,
        sodium: 5,
        portionSize: "100g (cooked)",
        estimatedWeight: 120,
        category: "carbs",
        tags: ["rice", "whole grain", "carbs", "vegetarian"],
        alternatives: ["Quinoa", "Couscous", "Buckwheat"]
      },
      {
        name: "Broccoli",
        confidence: 0.88,
        calories: 34,
        protein: 2.8,
        carbs: 7,
        fat: 0.4,
        fiber: 2.6,
        sugar: 1.5,
        sodium: 33,
        portionSize: "100g",
        estimatedWeight: 100,
        category: "vegetable",
        tags: ["broccoli", "vegetable", "fiber", "vitamins"],
        alternatives: ["Cauliflower", "Green Beans", "Asparagus"]
      }
    ];
    const randomFood = foods[Math.floor(Math.random() * foods.length)];
    return {
      ...randomFood,
      confidence: randomFood.confidence * (0.9 + Math.random() * 0.1),
      // Add some variation
      estimatedWeight: randomFood.estimatedWeight * (0.8 + Math.random() * 0.4)
      // Add weight variation
    };
  }
  /**
   * Mock Google analysis implementation
   */
  async mockGoogleAnalysis(imageBuffer, options) {
    await new Promise((resolve2) => setTimeout(resolve2, 800 + Math.random() * 1500));
    const foods = [
      {
        name: "Salmon Fillet",
        confidence: 0.93,
        calories: 208,
        protein: 22,
        carbs: 0,
        fat: 13,
        fiber: 0,
        sugar: 0,
        sodium: 59,
        portionSize: "100g",
        estimatedWeight: 140,
        category: "protein",
        tags: ["salmon", "fish", "omega3", "protein"],
        alternatives: ["Tuna", "Mackerel", "Cod"]
      },
      {
        name: "Sweet Potato",
        confidence: 0.91,
        calories: 86,
        protein: 1.6,
        carbs: 20,
        fat: 0.1,
        fiber: 3,
        sugar: 4.2,
        sodium: 4,
        portionSize: "100g",
        estimatedWeight: 110,
        category: "carbs",
        tags: ["sweet potato", "root vegetable", "vitamin A", "carbs"],
        alternatives: ["Regular Potato", "Butternut Squash", "Carrots"]
      }
    ];
    const randomFood = foods[Math.floor(Math.random() * foods.length)];
    return {
      ...randomFood,
      confidence: randomFood.confidence * (0.9 + Math.random() * 0.1),
      estimatedWeight: randomFood.estimatedWeight * (0.8 + Math.random() * 0.4)
    };
  }
  /**
   * Mock Anthropic analysis implementation
   */
  async mockAnthropicAnalysis(imageBuffer, options) {
    await new Promise((resolve2) => setTimeout(resolve2, 1200 + Math.random() * 2500));
    const foods = [
      {
        name: "Greek Salad",
        confidence: 0.94,
        calories: 145,
        protein: 6,
        carbs: 8,
        fat: 11,
        fiber: 3.5,
        sugar: 4,
        sodium: 654,
        portionSize: "1 cup",
        estimatedWeight: 150,
        category: "salad",
        tags: ["greek", "salad", "vegetables", "olives", "feta"],
        alternatives: ["Caesar Salad", "Cobb Salad", "Greek Bowl"]
      }
    ];
    const randomFood = foods[Math.floor(Math.random() * foods.length)];
    return {
      ...randomFood,
      confidence: randomFood.confidence * (0.9 + Math.random() * 0.1),
      estimatedWeight: randomFood.estimatedWeight * (0.8 + Math.random() * 0.4)
    };
  }
  /**
   * Mock Nutritionix analysis implementation
   */
  async mockNutritionixAnalysis(imageBuffer, options) {
    await new Promise((resolve2) => setTimeout(resolve2, 600 + Math.random() * 1200));
    const foods = [
      {
        name: "Avocado Toast",
        confidence: 0.89,
        calories: 234,
        protein: 6,
        carbs: 20,
        fat: 18,
        fiber: 8,
        sugar: 1.3,
        sodium: 422,
        portionSize: "1 slice",
        estimatedWeight: 80,
        category: "breakfast",
        tags: ["avocado", "toast", "breakfast", "healthy fats"],
        alternatives: ["Egg Toast", "Peanut Butter Toast", "Oatmeal"]
      }
    ];
    const randomFood = foods[Math.floor(Math.random() * foods.length)];
    return {
      ...randomFood,
      confidence: randomFood.confidence * (0.9 + Math.random() * 0.1),
      estimatedWeight: randomFood.estimatedWeight * (0.8 + Math.random() * 0.4)
    };
  }
  /**
   * Get nutritional information for a food item by name
   */
  async getNutritionalInfo(foodName, portionSize) {
    try {
      const mockNutrition = {
        "chicken breast": {
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          sugar: 0,
          sodium: 74
        },
        "brown rice": {
          calories: 111,
          protein: 2.6,
          carbs: 23,
          fat: 0.9,
          fiber: 1.8,
          sugar: 0.4,
          sodium: 5
        },
        "broccoli": {
          calories: 34,
          protein: 2.8,
          carbs: 7,
          fat: 0.4,
          fiber: 2.6,
          sugar: 1.5,
          sodium: 33
        }
      };
      const normalizedFoodName = foodName.toLowerCase().trim();
      return mockNutrition[normalizedFoodName] || {};
    } catch (error) {
      console.error("Error getting nutritional info:", error);
      throw new Error(`Failed to get nutritional information: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  /**
   * Get food suggestions based on dietary preferences
   */
  async getFoodSuggestions(dietaryPreferences, mealType) {
    try {
      const suggestions = {
        "vegetarian": {
          "breakfast": ["Oatmeal with fruits", "Avocado Toast", "Greek Yogurt Parfait"],
          "lunch": ["Quinoa Bowl", "Vegetable Stir-fry", "Lentil Soup"],
          "dinner": ["Vegetable Curry", "Pasta Primavera", "Stuffed Bell Peppers"],
          "snack": ["Apple with Peanut Butter", "Trail Mix", "Hummus with Veggies"]
        },
        "keto": {
          "breakfast": ["Eggs with Bacon", "Avocado with Eggs", "Keto Smoothie"],
          "lunch": ["Grilled Chicken Salad", "Cauliflower Rice Bowl", "Zucchini Noodles"],
          "dinner": ["Salmon with Asparagus", "Steak with Broccoli", "Chicken Wings"],
          "snack": ["Cheese Sticks", "Macadamia Nuts", "Beef Jerky"]
        },
        "low-carb": {
          "breakfast": ["Scrambled Eggs", "Greek Yogurt", "Protein Shake"],
          "lunch": ["Chicken Caesar Salad", "Tuna Salad", "Grilled Chicken"],
          "dinner": ["Baked Fish", "Turkey Meatballs", "Eggplant Parmesan"],
          "snack": ["Hard-boiled Eggs", "Celery with Peanut Butter", "Almonds"]
        }
      };
      const mealSuggestions = suggestions[dietaryPreferences[0]]?.[mealType] || [];
      return mealSuggestions.slice(0, 5);
    } catch (error) {
      console.error("Error getting food suggestions:", error);
      throw new Error(`Failed to get food suggestions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};
var enhancedFoodRecognitionService = new EnhancedFoodRecognitionService();

// server/src/routes/user/enhanced-food-recognition.ts
init_vite();
var router23 = Router24();
router23.post(
  "/analyze-single",
  validation_default.validate({
    imageData: { type: "string", required: true },
    options: { type: "string" }
    // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { imageData, options = {} } = req.body;
      const userId = req.user.id;
      log(`Starting enhanced single food analysis for user ${userId}`);
      await enhancedFoodRecognitionService.initialize();
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const result = await enhancedFoodRecognitionService.analyzeFoodImage({
        imageBuffer,
        userId,
        ...options
      });
      res.json({
        success: true,
        data: result,
        message: "Food analysis completed successfully"
      });
    } catch (error) {
      console.error("Enhanced single food analysis failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze food image",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
);
router23.post(
  "/analyze-multi",
  validation_default.validate({
    imageData: { type: "string", required: true },
    options: { type: "string" }
    // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { imageData, options = {} } = req.body;
      const userId = req.user.id;
      log(`Starting enhanced multi-food analysis for user ${userId}`);
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const result = await enhancedFoodRecognitionService.analyzeFoodImage({
        imageBuffer,
        userId,
        ...options
      });
      res.json({
        success: true,
        data: result,
        message: "Multi-food analysis completed successfully"
      });
    } catch (error) {
      console.error("Enhanced multi-food analysis failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze multiple food items",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
);
router23.post(
  "/analyze-restaurant-menu",
  validation_default.validate({
    imageData: { type: "string", required: true },
    restaurantName: { type: "string", required: true },
    options: { type: "string" }
    // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { imageData, restaurantName, options = {} } = req.body;
      const userId = req.user.id;
      log(`Starting restaurant menu analysis for ${restaurantName} by user ${userId}`);
      const base64Data = imageData.replace(/^data:image\/[^;]+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const result = await enhancedFoodRecognitionService.analyzeFoodImage({
        imageBuffer,
        userId,
        ...options,
        restaurantMode: true
      });
      const enhancedResult = {
        ...result,
        restaurantInfo: {
          name: restaurantName,
          analysisType: "menu_recognition",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
      res.json({
        success: true,
        data: enhancedResult,
        message: "Restaurant menu analysis completed successfully"
      });
    } catch (error) {
      console.error("Restaurant menu analysis failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to analyze restaurant menu",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
);
router23.get("/status", async (req, res) => {
  try {
    const userId = req.user.id;
    const availableProviders = enhancedFoodRecognitionService.getAvailableProviders();
    res.json({
      success: true,
      data: {
        availableProviders,
        userId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      message: "Enhanced food recognition service status retrieved successfully"
    });
  } catch (error) {
    console.error("Failed to get enhanced food recognition status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve service status",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});
router23.post(
  "/portion-estimate",
  validation_default.validate({
    foodName: { type: "string", required: true },
    foodDimensions: { type: "string", required: true },
    imageDimensions: { type: "string", required: true },
    options: { type: "string" }
    // Simplified validation for complex object
  }),
  async (req, res) => {
    try {
      const { foodName, foodDimensions, imageDimensions, options = {} } = req.body;
      const userId = req.user.id;
      log(`Starting portion size estimation for ${foodName} by user ${userId}`);
      const result = {
        estimatedWeight: 150,
        // Placeholder
        confidence: 0.8,
        referenceObject: "hand",
        dimensions: foodDimensions,
        suggestedPortion: {
          weight: 150,
          description: "1 serving"
        }
      };
      res.json({
        success: true,
        data: result,
        message: "Portion size estimation completed successfully"
      });
    } catch (error) {
      console.error("Portion size estimation failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to estimate portion size",
        message: error instanceof Error ? error.message : "Unknown error occurred"
      });
    }
  }
);
router23.get("/reference-objects", async (req, res) => {
  try {
    const userId = req.user.id;
    const referenceObjects = [
      "credit_card",
      "hand",
      "smartphone",
      "coin",
      "business_card"
    ];
    res.json({
      success: true,
      data: {
        referenceObjects,
        count: referenceObjects.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      },
      message: "Reference objects retrieved successfully"
    });
  } catch (error) {
    console.error("Failed to get reference objects:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve reference objects",
      message: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});
var enhanced_food_recognition_default = router23;

// server/src/routes/user/index.ts
var userRouter = Router25();
userRouter.use(authenticate);
userRouter.get("/", (req, res) => {
  res.json({
    message: "User API endpoint",
    version: "1.0.0",
    endpoints: {
      profile: "/api/user/profile",
      meals: "/api/user/meals",
      "nutrition-coach": "/api/user/nutrition-coach",
      referrals: "/api/user/referrals",
      "enhanced-food-recognition": "/api/user/enhanced-food-recognition",
      stats: "/api/user/stats"
    }
  });
});
userRouter.get("/stats", userProfileController_default.getUserStats);
userRouter.use("/referrals", referrals_default);
userRouter.use("/meals", meals_default);
userRouter.use("/nutrition-coach", nutritionCoach_default);
userRouter.use("/profile", profile_default);
userRouter.use("/enhanced-food-recognition", enhanced_food_recognition_default);
var user_default = userRouter;

// server/src/routes/wearables.ts
init_db2();
import { Router as Router26 } from "express";
import { z as z5 } from "zod";
import { eq as eq11 } from "drizzle-orm";

// server/src/models/wearableDevice.ts
import { sql as sql27 } from "drizzle-orm";
import { mysqlTable as mysqlTable23, varchar as varchar23, int as int23, boolean as boolean14, timestamp as timestamp22, json as json12, mysqlEnum, real } from "drizzle-orm/mysql-core";
var wearableDevices2 = mysqlTable23("wearable_devices", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceType: mysqlEnum("device_type", ["apple_health", "google_fit", "fitbit", "garmin", "apple_watch"]).notNull(),
  deviceName: varchar23("device_name", { length: 255 }).notNull(),
  deviceId: varchar23("device_id", { length: 255 }).notNull().unique(),
  isConnected: boolean14("is_connected").default(false).notNull(),
  lastSyncAt: timestamp22("last_sync_at"),
  batteryLevel: int23("battery_level"),
  firmwareVersion: varchar23("firmware_version", { length: 50 }),
  signalStrength: real("signal_strength"),
  capabilities: json12("capabilities").default(sql27`'[]'`).notNull(),
  settings: json12("settings").default(sql27`'{}'`).notNull(),
  isActive: boolean14("is_active").default(true).notNull(),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp22("updated_at").default(sql27`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});
var healthMetrics2 = mysqlTable23("health_metrics", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  metricType: mysqlEnum("metric_type", [
    "steps",
    "distance",
    "calories_burned",
    "heart_rate",
    "sleep_duration",
    "sleep_quality",
    "activity_minutes",
    "resting_heart_rate",
    "blood_pressure",
    "weight",
    "body_fat",
    "water_intake",
    "workout_duration",
    "blood_oxygen",
    "respiratory_rate",
    "skin_temperature",
    "heart_rate_variability",
    "vo2_max",
    "fitness_age",
    "stress_level",
    "recovery_score",
    "training_load",
    "readiness_score",
    "sleep_score",
    "activity_score",
    "move_minutes",
    "exercise_minutes",
    "stand_hours",
    "active_calories",
    "resting_calories",
    "total_calories",
    "basal_metabolic_rate",
    "body_mass_index",
    "body_water",
    "bone_mass",
    "muscle_mass",
    "visceral_fat",
    "waist_circumference",
    "hip_circumference",
    "waist_to_hip_ratio",
    "waist_to_height_ratio"
  ]).notNull(),
  value: real("value").notNull(),
  unit: varchar23("unit", { length: 50 }).notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  recordedAt: timestamp22("recorded_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  confidence: real("confidence"),
  metadata: json12("metadata"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var syncLogs2 = mysqlTable23("sync_logs", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  syncType: mysqlEnum("sync_type", ["pull", "push", "both"]).notNull(),
  status: mysqlEnum("status", ["success", "failed", "partial", "conflict"]).notNull(),
  recordsProcessed: int23("records_processed").default(0).notNull(),
  recordsAdded: int23("records_added").default(0).notNull(),
  recordsUpdated: int23("records_updated").default(0).notNull(),
  recordsFailed: int23("records_failed").default(0).notNull(),
  errorMessage: varchar23("error_message", { length: 1e3 }),
  startedAt: timestamp22("started_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp22("completed_at"),
  duration: int23("duration"),
  metadata: json12("metadata")
});
var conflictResolutions = mysqlTable23("conflict_resolutions", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  metricId: varchar23("metric_id", { length: 36 }),
  conflictType: mysqlEnum("conflict_type", ["timestamp", "value", "source"]).notNull(),
  resolution: mysqlEnum("resolution", ["server_wins", "client_wins", "merged", "manual"]).notNull(),
  oldValue: json12("old_value"),
  newValue: json12("new_value"),
  resolvedAt: timestamp22("resolved_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  resolvedBy: mysqlEnum("resolved_by", ["system", "user", "manual"]).default("system")
});
var correlationAnalyses = mysqlTable23("correlation_analyses", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  correlationType: mysqlEnum("correlation_type", ["sleep_nutrition", "heart_rate_nutrition", "activity_nutrition"]).notNull(),
  analysisDate: varchar23("analysis_date", { length: 20 }).notNull(),
  correlationScore: real("correlation_score").notNull(),
  confidenceLevel: real("confidence_level").notNull(),
  insights: json12("insights").notNull(),
  recommendations: json12("recommendations").notNull(),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp22("updated_at").default(sql27`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});
var wearableUserSettings = mysqlTable23("wearable_user_settings", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  defaultSyncConfig: json12("default_sync_config").notNull(),
  deviceSettings: json12("device_settings").notNull(),
  privacySettings: json12("privacy_settings").notNull(),
  notificationSettings: json12("notification_settings").notNull(),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp22("updated_at").default(sql27`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});
var syncSchedules = mysqlTable23("sync_schedules", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  syncFrequencyMinutes: int23("sync_frequency_minutes").notNull(),
  isActive: boolean14("is_active").default(true).notNull(),
  lastSyncAt: timestamp22("last_sync_at"),
  nextSyncAt: timestamp22("next_sync_at"),
  syncType: mysqlEnum("sync_type", ["pull", "push", "both"]).notNull(),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp22("updated_at").default(sql27`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});
var deviceAuth = mysqlTable23("device_auth", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  accessToken: varchar23("access_token", { length: 1e3 }),
  refreshToken: varchar23("refresh_token", { length: 1e3 }),
  tokenType: varchar23("token_type", { length: 50 }),
  scope: varchar23("scope", { length: 500 }),
  expiresAt: timestamp22("expires_at"),
  lastRefreshedAt: timestamp22("last_refreshed_at"),
  scopes: json12("scopes").default(sql27`'[]'`).notNull(),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp22("updated_at").default(sql27`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});
var deviceActivities = mysqlTable23("device_activities", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  activityType: varchar23("activity_type", { length: 100 }).notNull(),
  intensity: mysqlEnum("intensity", ["low", "medium", "high"]).notNull(),
  startTime: timestamp22("start_time").notNull(),
  endTime: timestamp22("end_time"),
  duration: int23("duration"),
  calories: real("calories"),
  distance: real("distance"),
  steps: int23("steps"),
  heartRate: real("heartRate"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWorkouts = mysqlTable23("device_workouts", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  workoutType: varchar23("workout_type", { length: 100 }).notNull(),
  startTime: timestamp22("start_time").notNull(),
  endTime: timestamp22("end_time"),
  duration: int23("duration"),
  calories: real("calories"),
  distance: real("distance"),
  steps: int23("steps"),
  heartRate: real("heartRate"),
  averageHeartRate: real("average_heart_rate"),
  maxHeartRate: real("max_heart_rate"),
  minHeartRate: real("min_heart_rate"),
  elevationGain: real("elevation_gain"),
  elevationLoss: real("elevation_loss"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceSleepData = mysqlTable23("device_sleep_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  sleepType: mysqlEnum("sleep_type", ["deep", "light", "rem", "awake"]).notNull(),
  startTime: timestamp22("start_time").notNull(),
  endTime: timestamp22("end_time").notNull(),
  duration: int23("duration").notNull(),
  quality: real("quality"),
  confidence: real("confidence"),
  stages: json12("stages").notNull(),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceHeartRateData = mysqlTable23("device_heart_rate_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  heartRate: real("heart_rate").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceStepsData = mysqlTable23("device_steps_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  steps: int23("steps").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceCaloriesData = mysqlTable23("device_calories_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  calories: real("calories").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWeightData = mysqlTable23("device_weight_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  weight: real("weight").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBloodPressureData = mysqlTable23("device_blood_pressure_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  systolic: real("systolic").notNull(),
  diastolic: real("diastolic").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWaterIntakeData = mysqlTable23("device_water_intake_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  amount: real("amount").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBodyFatData = mysqlTable23("device_body_fat_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  bodyFat: real("body_fat").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceDistanceData = mysqlTable23("device_distance_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  distance: real("distance").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceActivityMinutesData = mysqlTable23("device_activity_minutes_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  minutes: int23("minutes").notNull(),
  activityType: varchar23("activity_type", { length: 100 }).notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWorkoutDurationData = mysqlTable23("device_workout_duration_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  duration: int23("duration").notNull(),
  workoutType: varchar23("workout_type", { length: 100 }).notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceRestingHeartRateData = mysqlTable23("device_resting_heart_rate_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  heartRate: real("heart_rate").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceSleepQualityData = mysqlTable23("device_sleep_quality_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  quality: real("quality").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceSleepDurationData = mysqlTable23("device_sleep_duration_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  duration: int23("duration").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBloodOxygenData = mysqlTable23("device_blood_oxygen_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  oxygen: real("oxygen").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceRespiratoryRateData = mysqlTable23("device_respiratory_rate_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  rate: real("rate").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceSkinTemperatureData = mysqlTable23("device_skin_temperature_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  temperature: real("temperature").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceHeartRateVariabilityData = mysqlTable23("device_heart_rate_variability_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  hrv: real("hrv").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceVo2MaxData = mysqlTable23("device_vo2_max_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  vo2Max: real("vo2_max").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceFitnessAgeData = mysqlTable23("device_fitness_age_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  fitnessAge: int23("fitness_age").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceStressLevelData = mysqlTable23("device_stress_level_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  stressLevel: real("stress_level").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceRecoveryScoreData = mysqlTable23("device_recovery_score_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  recoveryScore: real("recovery_score").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceTrainingLoadData = mysqlTable23("device_training_load_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  trainingLoad: real("training_load").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceReadinessScoreData = mysqlTable23("device_readiness_score_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  readinessScore: real("readiness_score").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceSleepScoreData = mysqlTable23("device_sleep_score_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  sleepScore: real("sleep_score").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceActivityScoreData = mysqlTable23("device_activity_score_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  activityScore: real("activity_score").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceMoveMinutesData = mysqlTable23("device_move_minutes_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  minutes: int23("minutes").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceExerciseMinutesData = mysqlTable23("device_exercise_minutes_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  minutes: int23("minutes").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceStandHoursData = mysqlTable23("device_stand_hours_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  hours: real("hours").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceActiveCaloriesData = mysqlTable23("device_active_calories_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  calories: real("calories").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceRestingCaloriesData = mysqlTable23("device_resting_calories_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  calories: real("calories").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceTotalCaloriesData = mysqlTable23("device_total_calories_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  calories: real("calories").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBasalMetabolicRateData = mysqlTable23("device_basal_metabolic_rate_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  bmr: real("bmr").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBodyMassIndexData = mysqlTable23("device_body_mass_index_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  bmi: real("bmi").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBodyWaterData = mysqlTable23("device_body_water_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  water: real("water").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBoneMassData = mysqlTable23("device_bone_mass_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  boneMass: real("bone_mass").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceMuscleMassData = mysqlTable23("device_muscle_mass_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  muscleMass: real("muscle_mass").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceVisceralFatData = mysqlTable23("device_visceral_fat_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  visceralFat: real("visceral_fat").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWaistCircumferenceData = mysqlTable23("device_waist_circumference_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  circumference: real("circumference").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceHipCircumferenceData = mysqlTable23("device_hip_circumference_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  circumference: real("circumference").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWaistToHipRatioData = mysqlTable23("device_waist_to_hip_ratio_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  ratio: real("ratio").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWaistToHeightRatioData = mysqlTable23("device_waist_to_height_ratio_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  ratio: real("ratio").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceBodyCompositionData = mysqlTable23("device_body_composition_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  weight: real("weight").notNull(),
  bodyFat: real("body_fat").notNull(),
  muscleMass: real("muscle_mass").notNull(),
  boneMass: real("bone_mass").notNull(),
  bodyWater: real("body_water").notNull(),
  visceralFat: real("visceral_fat").notNull(),
  bmi: real("bmi").notNull(),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic"]).default("automatic"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var devicePhysicalActivityData = mysqlTable23("device_physical_activity_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  activityType: varchar23("activity_type", { length: 100 }).notNull(),
  intensity: mysqlEnum("intensity", ["low", "medium", "high"]).notNull(),
  duration: int23("duration").notNull(),
  calories: real("calories"),
  distance: real("distance"),
  steps: int23("steps"),
  heartRate: real("heartRate"),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceExerciseData = mysqlTable23("device_exercise_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  exerciseType: varchar23("exercise_type", { length: 100 }).notNull(),
  duration: int23("duration").notNull(),
  calories: real("calories"),
  distance: real("distance"),
  steps: int23("steps"),
  heartRate: real("heartRate"),
  averageHeartRate: real("average_heart_rate"),
  maxHeartRate: real("max_heart_rate"),
  minHeartRate: real("min_heart_rate"),
  elevationGain: real("elevation_gain"),
  elevationLoss: real("elevation_loss"),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});
var deviceWorkoutData = mysqlTable23("device_workout_data", {
  id: varchar23("id", { length: 36 }).default(sql27`UUID()`).primaryKey(),
  userId: varchar23("user_id", { length: 36 }).notNull(),
  deviceId: varchar23("device_id", { length: 36 }),
  workoutType: varchar23("workout_type", { length: 100 }).notNull(),
  startTime: timestamp22("start_time").notNull(),
  endTime: timestamp22("end_time"),
  duration: int23("duration"),
  calories: real("calories"),
  distance: real("distance"),
  steps: int23("steps"),
  heartRate: real("heartRate"),
  averageHeartRate: real("average_heart_rate"),
  maxHeartRate: real("max_heart_rate"),
  minHeartRate: real("min_heart_rate"),
  elevationGain: real("elevation_gain"),
  elevationLoss: real("elevation_loss"),
  activities: json12("activities"),
  exercises: json12("exercises"),
  timestamp: timestamp22("timestamp").notNull(),
  confidence: real("confidence"),
  source: mysqlEnum("source", ["manual", "automatic", "workout"]).default("automatic"),
  workoutId: varchar23("workout_id", { length: 36 }),
  metadata: json12("metadata"),
  createdAt: timestamp22("created_at").default(sql27`CURRENT_TIMESTAMP`).notNull()
});

// server/src/routes/wearables.ts
var router24 = Router26();
var wearableDataSchema = z5.object({
  userId: z5.number(),
  deviceType: z5.string().optional(),
  steps: z5.number().int().min(0),
  heartRate: z5.number().int().min(0).optional(),
  caloriesBurned: z5.number().min(0).optional(),
  sleepHours: z5.number().min(0).optional(),
  timestamp: z5.date().optional()
});
var deviceSchema = z5.object({
  id: z5.string().optional(),
  name: z5.string(),
  type: z5.enum(["apple_health", "google_fit", "fitbit", "garmin", "apple_watch"]),
  manufacturer: z5.string(),
  model: z5.string(),
  firmwareVersion: z5.string().optional(),
  serialNumber: z5.string().optional(),
  isConnected: z5.boolean().default(false),
  lastSyncAt: z5.date().optional(),
  batteryLevel: z5.number().min(0).max(100).optional(),
  metadata: z5.record(z5.any()).optional()
});
var connectDeviceSchema = z5.object({
  name: z5.string(),
  type: z5.enum(["fitness_tracker", "smartwatch", "heart_rate_monitor", "scale", "blood_pressure_monitor", "glucose_monitor", "other"]),
  manufacturer: z5.string(),
  model: z5.string(),
  firmwareVersion: z5.string().optional(),
  serialNumber: z5.string().optional(),
  metadata: z5.record(z5.any()).optional()
});
var deviceSettingsSchema = z5.object({
  autoSync: z5.boolean().default(true),
  syncFrequency: z5.number().min(1).default(60),
  // minutes
  selectedMetrics: z5.array(z5.string()).default(["steps", "heart_rate", "calories_burned", "sleep_hours"]),
  privacySettings: z5.object({
    shareData: z5.boolean().default(false),
    anonymizeData: z5.boolean().default(true),
    dataRetention: z5.number().min(1).default(365)
    // days
  }).default({}),
  notificationSettings: z5.object({
    syncComplete: z5.boolean().default(true),
    lowBattery: z5.boolean().default(true),
    syncFailed: z5.boolean().default(true),
    insights: z5.boolean().default(true)
  }).default({})
});
var syncTypeSchema = z5.enum(["health_data", "device_settings", "both"]).default("both");
var healthDataQuerySchema = z5.object({
  userId: z5.number(),
  metricTypes: z5.array(z5.string()).optional(),
  startDate: z5.date().optional(),
  endDate: z5.date().optional(),
  source: z5.string().optional(),
  offset: z5.number().min(0).optional(),
  limit: z5.number().min(1).max(1e3).optional()
});
var correlationQuerySchema = z5.object({
  userId: z5.number(),
  metricTypes: z5.array(z5.string()).min(2),
  startDate: z5.date(),
  endDate: z5.date(),
  correlationThreshold: z5.number().min(-1).max(1).optional()
});
var exportDataSchema = z5.object({
  deviceId: z5.string().optional(),
  startDate: z5.date(),
  endDate: z5.date(),
  format: z5.enum(["json", "csv"]).default("json")
});
var aggregatedQuerySchema = z5.object({
  userId: z5.number(),
  metricTypes: z5.array(z5.string()).min(1),
  startDate: z5.date(),
  endDate: z5.date(),
  aggregation: z5.enum(["hourly", "daily", "weekly", "monthly"]).default("daily"),
  aggregateFunction: z5.enum(["avg", "sum", "min", "max", "count"]).default("avg")
});
var insightsQuerySchema = z5.object({
  userId: z5.number(),
  dateRange: z5.object({
    start: z5.date(),
    end: z5.date()
  })
});
router24.get("/devices", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const devices = await db_default.db.select().from(wearableDevices2).where(eq11(wearableDevices2.userId, userId)).where(eq11(wearableDevices2.isActive, true));
    const devicesWithStats = await Promise.all(
      devices.map(async (device) => {
        const [dataCount] = await db_default.execute(
          "SELECT COUNT(*) as count FROM health_metrics WHERE user_id = ? AND device_id = ?",
          [userId, device.id]
        );
        return {
          ...device,
          metadata: {
            totalDataPoints: dataCount[0]?.count || 0
          }
        };
      })
    );
    res.json({
      success: true,
      data: devicesWithStats
    });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ success: false, error: "Failed to fetch devices" });
  }
});
router24.post("/devices", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceData = req.body;
    const validatedData = deviceSchema.parse(deviceData);
    const newDevice = await db_default.db.insert(wearableDevices2).values({
      userId,
      deviceType: validatedData.type,
      deviceName: validatedData.name,
      deviceId: `device_${Date.now()}`,
      isConnected: validatedData.isConnected,
      lastSyncAt: /* @__PURE__ */ new Date(),
      batteryLevel: validatedData.batteryLevel || 100,
      signalStrength: -60,
      capabilities: {
        heartRate: true,
        steps: true,
        calories: true,
        sleep: true,
        distance: true,
        floors: true,
        gps: false,
        bloodPressure: false,
        bloodOxygen: false,
        stress: false,
        ...validatedData.metadata?.capabilities
      },
      settings: {
        autoSync: true,
        syncFrequency: 60,
        selectedMetrics: ["steps", "heart_rate", "calories_burned", "sleep_hours"],
        privacySettings: {
          shareData: false,
          anonymizeData: true,
          dataRetention: 365
        },
        notificationSettings: {
          syncComplete: true,
          lowBattery: true,
          syncFailed: true,
          insights: true
        },
        ...validatedData.metadata?.settings
      },
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    });
    res.json({
      success: true,
      data: {
        id: newDevice.insertId,
        userId,
        deviceType: validatedData.type,
        deviceName: validatedData.name,
        deviceId: `device_${Date.now()}`,
        isConnected: validatedData.isConnected,
        lastSyncAt: /* @__PURE__ */ new Date(),
        batteryLevel: validatedData.batteryLevel || 100,
        signalStrength: -60,
        capabilities: {
          heartRate: true,
          steps: true,
          calories: true,
          sleep: true,
          distance: true,
          floors: true,
          gps: false,
          bloodPressure: false,
          bloodOxygen: false,
          stress: false,
          ...validatedData.metadata?.capabilities
        },
        settings: {
          autoSync: true,
          syncFrequency: 60,
          selectedMetrics: ["steps", "heart_rate", "calories_burned", "sleep_hours"],
          privacySettings: {
            shareData: false,
            anonymizeData: true,
            dataRetention: 365
          },
          notificationSettings: {
            syncComplete: true,
            lowBattery: true,
            syncFailed: true,
            insights: true
          },
          ...validatedData.metadata?.settings
        },
        isActive: true,
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      }
    });
  } catch (error) {
    console.error("Error creating device:", error);
    res.status(500).json({ success: false, error: "Failed to create device" });
  }
});
router24.post("/devices/:deviceId/connect", authenticate, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const connectedDevice = {
      id: deviceId,
      isConnected: true,
      lastSyncAt: /* @__PURE__ */ new Date()
    };
    res.json({
      success: true,
      data: connectedDevice
    });
  } catch (error) {
    console.error("Error connecting device:", error);
    res.status(500).json({ success: false, error: "Failed to connect device" });
  }
});
router24.post("/devices/:deviceId/disconnect", authenticate, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const disconnectedDevice = {
      id: deviceId,
      isConnected: false,
      lastSyncAt: null
    };
    res.json({
      success: true,
      data: disconnectedDevice
    });
  } catch (error) {
    console.error("Error disconnecting device:", error);
    res.status(500).json({ success: false, error: "Failed to disconnect device" });
  }
});
router24.get("/devices/:deviceId/status", authenticate, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const deviceStatus = {
      id: deviceId,
      isConnected: true,
      batteryLevel: 85,
      lastSyncAt: /* @__PURE__ */ new Date(),
      firmwareVersion: "1.2.3",
      signalStrength: -45,
      storageUsed: 75,
      storageTotal: 100
    };
    res.json({
      success: true,
      data: deviceStatus
    });
  } catch (error) {
    console.error("Error getting device status:", error);
    res.status(500).json({ success: false, error: "Failed to get device status" });
  }
});
router24.get("/devices/:deviceId/settings", authenticate, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const settings = {
      autoSync: true,
      syncFrequency: 60,
      selectedMetrics: ["steps", "heart_rate", "calories_burned", "sleep_hours"],
      privacySettings: {
        shareData: false,
        anonymizeData: true,
        dataRetention: 365
      },
      notificationSettings: {
        syncComplete: true,
        lowBattery: true,
        syncFailed: true,
        insights: true
      }
    };
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Error getting device settings:", error);
    res.status(500).json({ success: false, error: "Failed to get device settings" });
  }
});
router24.put("/devices/:deviceId/settings", authenticate, (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const settings = req.body;
    const updatedSettings = {
      ...settings,
      updatedAt: /* @__PURE__ */ new Date()
    };
    res.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error("Error updating device settings:", error);
    res.status(500).json({ success: false, error: "Failed to update device settings" });
  }
});
router24.post("/devices/:deviceId/sync", authenticate, (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const { syncType } = req.body;
    const syncResult = {
      deviceId,
      syncType,
      status: "completed",
      syncedAt: /* @__PURE__ */ new Date(),
      recordsSynced: Math.floor(Math.random() * 100) + 10,
      duration: Math.floor(Math.random() * 30) + 5,
      // seconds
      errors: []
    };
    res.json({
      success: true,
      data: syncResult
    });
  } catch (error) {
    console.error("Error syncing device:", error);
    res.status(500).json({ success: false, error: "Failed to sync device" });
  }
});
router24.get("/devices/:deviceId/sync-logs", authenticate, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const userId = req.user.id;
    const syncLogs4 = [
      {
        id: `log_${Date.now()}`,
        deviceId,
        timestamp: new Date(Date.now() - 36e5),
        status: "completed",
        recordsSynced: 45,
        duration: 12,
        errors: []
      },
      {
        id: `log_${Date.now() - 72e5}`,
        deviceId,
        timestamp: new Date(Date.now() - 72e5),
        status: "completed",
        recordsSynced: 32,
        duration: 8,
        errors: []
      }
    ];
    res.json({
      success: true,
      data: syncLogs4
    });
  } catch (error) {
    console.error("Error fetching sync logs:", error);
    res.status(500).json({ success: false, error: "Failed to fetch sync logs" });
  }
});
router24.post("/health-data", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.body;
    let sqlQuery = "SELECT * FROM wearable_data WHERE user_id = ?";
    const params = [userId];
    if (query.startDate) {
      sqlQuery += " AND date >= ?";
      params.push(query.startDate.toISOString().split("T")[0]);
    }
    if (query.endDate) {
      sqlQuery += " AND date <= ?";
      params.push(query.endDate.toISOString().split("T")[0]);
    }
    sqlQuery += " ORDER BY date DESC";
    if (query.limit) {
      sqlQuery += " LIMIT ?";
      params.push(query.limit);
    }
    if (query.offset) {
      sqlQuery += " OFFSET ?";
      params.push(query.offset);
    }
    const [healthData] = await db_default.execute(sqlQuery, params);
    res.json({
      success: true,
      data: healthData
    });
  } catch (error) {
    console.error("Error fetching health data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch health data" });
  }
});
router24.post("/health-data/save", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const metrics = req.body;
    const [result] = await db_default.execute(
      `INSERT INTO wearable_data 
      (user_id, device_type, steps, heart_rate, calories_burned, sleep_hours, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        metrics.userId,
        metrics.deviceType || "Unknown",
        metrics.steps,
        metrics.heartRate,
        metrics.caloriesBurned,
        metrics.sleepHours,
        metrics.timestamp ? metrics.timestamp.toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      ]
    );
    res.json({
      success: true,
      data: { saved: true, id: result.insertId }
    });
  } catch (error) {
    console.error("Error saving health data:", error);
    res.status(500).json({ success: false, error: "Failed to save health data" });
  }
});
router24.post("/correlation-analysis", authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.body;
    const correlations = [
      {
        id: `corr_${Date.now()}`,
        metric1: query.metricTypes[0],
        metric2: query.metricTypes[1],
        correlationCoefficient: 0.75,
        pValue: 1e-3,
        significance: "high",
        description: "Strong positive correlation between steps and heart rate"
      },
      {
        id: `corr_${Date.now() + 1}`,
        metric1: query.metricTypes[0],
        metric2: query.metricTypes[2] || "sleep_hours",
        correlationCoefficient: -0.45,
        pValue: 0.01,
        significance: "medium",
        description: "Moderate negative correlation between steps and sleep hours"
      }
    ];
    res.json({
      success: true,
      data: correlations
    });
  } catch (error) {
    console.error("Error fetching correlation analysis:", error);
    res.status(500).json({ success: false, error: "Failed to fetch correlation analysis" });
  }
});
router24.get("/user-settings/:userId", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = req.user.id;
    if (userId !== requestingUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const [userSettings] = await db_default.execute(
      "SELECT COUNT(*) as device_count, MAX(date) as last_sync FROM wearable_data WHERE user_id = ?",
      [userId]
    );
    const settings = {
      userId,
      autoSync: true,
      syncFrequency: 60,
      selectedMetrics: ["steps", "heart_rate", "calories_burned", "sleep_hours"],
      privacySettings: {
        shareData: false,
        anonymizeData: true,
        dataRetention: 365
      },
      notificationSettings: {
        syncComplete: true,
        lowBattery: true,
        syncFailed: true,
        insights: true
      },
      connectedDevices: userSettings[0].device_count || 0,
      lastSyncAt: userSettings[0].last_sync ? new Date(userSettings[0].last_sync) : null
    };
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ success: false, error: "Failed to fetch user settings" });
  }
});
router24.put("/user-settings", authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;
    const updatedSettings = {
      ...settings,
      updatedAt: /* @__PURE__ */ new Date()
    };
    res.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ success: false, error: "Failed to update user settings" });
  }
});
router24.post("/export", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const exportData = req.body;
    let sqlQuery = "SELECT * FROM wearable_data WHERE user_id = ?";
    const params = [userId];
    if (exportData.startDate) {
      sqlQuery += " AND date >= ?";
      params.push(exportData.startDate.toISOString().split("T")[0]);
    }
    if (exportData.endDate) {
      sqlQuery += " AND date <= ?";
      params.push(exportData.endDate.toISOString().split("T")[0]);
    }
    const [data] = await db_default.execute(sqlQuery, params);
    let exportContent;
    if (exportData.format === "json") {
      exportContent = JSON.stringify(data, null, 2);
    } else {
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(",");
        const csvRows = data.map(
          (row) => headers.map((header) => row[header]).join(",")
        );
        exportContent = [csvHeaders, ...csvRows].join("\n");
      } else {
        exportContent = "No data to export";
      }
    }
    res.json({
      success: true,
      data: {
        content: exportContent,
        format: exportData.format,
        recordCount: data.length,
        exportedAt: /* @__PURE__ */ new Date()
      }
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    res.status(500).json({ success: false, error: "Failed to export data" });
  }
});
router24.post("/import", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.body;
    const importResult = {
      success: true,
      recordsImported: Math.floor(Math.random() * 100) + 10,
      deviceId,
      importedAt: /* @__PURE__ */ new Date(),
      errors: []
    };
    res.json({
      success: true,
      data: importResult
    });
  } catch (error) {
    console.error("Error importing data:", error);
    res.status(500).json({ success: false, error: "Failed to import data" });
  }
});
router24.post("/health-data/aggregated", authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const query = req.body;
    const aggregatedData = [
      {
        period: "2024-01-01",
        metric: "steps",
        value: 8432,
        aggregate: "avg"
      },
      {
        period: "2024-01-02",
        metric: "steps",
        value: 9123,
        aggregate: "avg"
      },
      {
        period: "2024-01-01",
        metric: "heart_rate",
        value: 72,
        aggregate: "avg"
      },
      {
        period: "2024-01-02",
        metric: "heart_rate",
        value: 75,
        aggregate: "avg"
      }
    ];
    res.json({
      success: true,
      data: aggregatedData
    });
  } catch (error) {
    console.error("Error fetching aggregated health data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch aggregated health data" });
  }
});
router24.post("/health-insights", authenticate, (req, res) => {
  try {
    const userId = req.user.id;
    const { dateRange } = req.body;
    const insights = [
      {
        id: `insight_${Date.now()}_1`,
        type: "recommendation",
        title: "Low Step Count",
        message: "Your average daily steps is 6,234. Try to increase to at least 8,000 steps for better health.",
        priority: "medium",
        metricType: "steps",
        value: 6234,
        threshold: 8e3,
        recommendation: "Take short walks throughout the day and consider using stairs instead of elevators.",
        createdAt: /* @__PURE__ */ new Date(),
        acknowledged: false
      },
      {
        id: `insight_${Date.now()}_2`,
        type: "warning",
        title: "Elevated Heart Rate",
        message: "Your average heart rate is 95 bpm, which is higher than normal.",
        priority: "high",
        metricType: "heart_rate",
        value: 95,
        threshold: 90,
        recommendation: "Consider consulting a healthcare professional if this persists.",
        createdAt: /* @__PURE__ */ new Date(),
        acknowledged: false
      }
    ];
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error("Error fetching health insights:", error);
    res.status(500).json({ success: false, error: "Failed to fetch health insights" });
  }
});
router24.get("/recommendations/:userId", authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const requestingUserId = req.user.id;
    if (userId !== requestingUserId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const recommendations = [
      {
        id: `rec_${Date.now()}_1`,
        type: "device",
        title: "Consider upgrading your fitness tracker",
        description: "Based on your activity level, a more advanced fitness tracker with heart rate variability monitoring would be beneficial.",
        priority: "medium",
        deviceType: "smartwatch",
        estimatedCost: 299,
        benefits: ["Better sleep tracking", "Heart rate variability monitoring", "GPS built-in"]
      },
      {
        id: `rec_${Date.now()}_2`,
        type: "feature",
        title: "Enable automatic workout detection",
        description: "Your current device supports automatic workout detection. Enable this feature to better track your exercise sessions.",
        priority: "low",
        deviceType: "current_device",
        estimatedCost: 0,
        benefits: ["Better workout tracking", "Automatic exercise detection"]
      }
    ];
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error("Error fetching device recommendations:", error);
    res.status(500).json({ success: false, error: "Failed to fetch device recommendations" });
  }
});
router24.post("/wearables", authenticate, async (req, res) => {
  try {
    const data = req.body;
    console.log("Received wearable data:", data);
    const [result] = await db_default.execute(
      `INSERT INTO wearable_data 
      (user_id, device_type, steps, heart_rate, calories_burned, sleep_hours, date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.deviceType || "Unknown",
        data.steps,
        data.heartRate,
        data.caloriesBurned,
        data.sleepHours,
        data.timestamp ? data.timestamp.toISOString().split("T")[0] : (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      ]
    );
    res.json({ success: true, message: "Wearable data received and processed successfully", data });
  } catch (error) {
    console.error("Error processing wearable data:", error);
    res.status(500).json({ success: false, error: "Failed to process wearable data" });
  }
});
var wearables_default = router24;

// server/src/routes/auth/index.ts
import { Router as Router27 } from "express";

// server/rate-limiter.ts
import rateLimit from "express-rate-limit";
var isDevelopment = process.env.NODE_ENV !== "production";
var authRateLimiter2 = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1e3 : 15 * 60 * 1e3,
  // 1 minute in dev, 15 minutes in prod
  max: isDevelopment ? 100 : 5,
  // higher limit in development
  message: {
    message: "Too many authentication attempts, please try again later"
  },
  standardHeaders: true,
  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false
  // Disable the `X-RateLimit-*` headers
});
var registerRateLimiter = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1e3 : 60 * 60 * 1e3,
  // 1 minute in dev, 1 hour in prod
  max: isDevelopment ? 50 : 3,
  // higher limit in development
  message: {
    message: "Too many registration attempts, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false
});
var apiRateLimiter2 = rateLimit({
  windowMs: isDevelopment ? 1 * 60 * 1e3 : 15 * 60 * 1e3,
  // 1 minute in dev, 15 minutes in prod
  max: isDevelopment ? 1e3 : 100,
  // higher limit in development
  message: {
    message: "Too many requests, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false
});

// server/src/routes/auth/index.ts
init_storage_provider();
import { z as z6 } from "zod";
import bcrypt3 from "bcrypt";
import jwt3 from "jsonwebtoken";

// server/src/services/auth/jwt.service.ts
init_db();
import jwt2 from "jsonwebtoken";
import bcrypt2 from "bcrypt";

// server/src/services/user.service.ts
init_db2();
var UserService = class {
  static async getUserById(userId) {
    const [users2] = await db_default.execute("SELECT * FROM users WHERE id = ?", [userId]);
    return users2[0] || null;
  }
  static async markMFAEnabled(userId) {
    await db_default.execute(
      "UPDATE users SET mfa_enabled = 1, mfa_enabled_at = NOW() WHERE id = ?",
      [userId]
    );
  }
};

// server/src/services/auth/jwt.service.ts
var JWTService = class {
  static ACCESS_TOKEN_EXPIRY = "15m";
  static REFRESH_TOKEN_EXPIRY = "7d";
  static REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh-secret";
  static async generateTokens(payload) {
    console.log("[JWT] generateTokens called with payload:", {
      id: payload.id,
      idType: typeof payload.id,
      hasId: payload.hasOwnProperty("id"),
      payloadKeys: Object.keys(payload)
    });
    if (!payload || payload.id === void 0 || payload.id === null || isNaN(payload.id)) {
      console.error("[JWT] ERROR: Invalid payload or user ID:", { payload, id: payload?.id, idType: typeof payload?.id });
      throw new Error(`Invalid user payload provided to generateTokens: ${JSON.stringify(payload)}`);
    }
    const accessToken = jwt2.sign(payload, process.env.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY
    });
    const refreshToken = jwt2.sign(
      { userId: payload.id, tokenVersion: payload.tokenVersion || 1 },
      this.REFRESH_TOKEN_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );
    console.log("[JWT] Tokens generated:", {
      accessTokenLength: accessToken?.length,
      refreshTokenLength: refreshToken?.length,
      refreshTokenDefined: refreshToken !== void 0
    });
    await this.storeRefreshToken(payload.id, refreshToken);
    return { accessToken, refreshToken };
  }
  static async refreshAccessToken(refreshToken) {
    try {
      const decoded = jwt2.verify(refreshToken, this.REFRESH_TOKEN_SECRET);
      const isValid = await this.verifyRefreshToken(decoded.userId, refreshToken);
      if (!isValid) return null;
      const user = await UserService.getUserById(decoded.userId);
      if (!user) return null;
      return jwt2.sign(
        { userId: user.id, email: user.email, tokenVersion: user.token_version },
        process.env.JWT_SECRET,
        { expiresIn: this.ACCESS_TOKEN_EXPIRY }
      );
    } catch (error) {
      return null;
    }
  }
  static async storeRefreshToken(userId, refreshToken) {
    console.log("[JWT] storeRefreshToken called with:", {
      userId,
      userIdType: typeof userId,
      userIdIsNumber: typeof userId === "number",
      userIdIsNaN: isNaN(userId),
      refreshTokenLength: refreshToken?.length,
      refreshTokenDefined: refreshToken !== void 0,
      refreshTokenType: typeof refreshToken
    });
    if (userId === void 0 || userId === null || isNaN(userId)) {
      console.error("[JWT] ERROR: userId is invalid:", { userId, type: typeof userId });
      throw new Error(`Invalid userId provided to storeRefreshToken: ${userId} (type: ${typeof userId})`);
    }
    if (!refreshToken || typeof refreshToken !== "string") {
      console.error("[JWT] ERROR: refreshToken is invalid:", { refreshToken, type: typeof refreshToken });
      throw new Error(`Invalid refreshToken provided to storeRefreshToken: ${refreshToken} (type: ${typeof refreshToken})`);
    }
    const hashedToken = await bcrypt2.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
    console.log("[JWT] About to execute SQL with:", {
      userId,
      userIdType: typeof userId,
      hashedTokenLength: hashedToken?.length,
      hashedTokenDefined: hashedToken !== void 0,
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
      console.log("[JWT] Refresh token stored successfully");
    } catch (dbError) {
      console.error("[JWT] Database error storing refresh token:", dbError);
      throw dbError;
    }
  }
  static async verifyRefreshToken(userId, refreshToken) {
    const [tokens] = await pool.execute(
      "SELECT token_hash FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()",
      [userId]
    );
    if (tokens.length === 0) return false;
    return bcrypt2.compare(refreshToken, tokens[0].token_hash);
  }
  static async revokeRefreshToken(refreshToken) {
    try {
      const decoded = jwt2.verify(refreshToken, this.REFRESH_TOKEN_SECRET);
      await pool.execute(
        "DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?",
        [decoded.userId, await bcrypt2.hash(refreshToken, 10)]
      );
    } catch (error) {
    }
  }
};

// server/src/routes/auth/index.ts
console.log("[AUTH-DEBUG] Auth router file loaded");
var router25 = Router27();
var registerSchema2 = z6.object({
  email: z6.string().email(),
  password: z6.string().min(8),
  username: z6.string().min(3),
  firstName: z6.string().min(1),
  lastName: z6.string().min(1)
});
var loginSchema = z6.object({
  username: z6.string().min(1),
  password: z6.string().min(8)
});
console.log("[AUTH-ROUTE] Setting up /api/auth/register route...");
router25.post(
  "/register",
  registerRateLimiter,
  async (req, res, next) => {
    console.log("=== [REGISTER] DEBUG START ===");
    console.log("[REGISTER] Received request:", req.body);
    console.log("[REGISTER] Parsed body type:", typeof req.body);
    console.log("[REGISTER] Headers:", req.headers);
    console.log("[REGISTER] Content-Type:", req.get("content-type"));
    console.log("[REGISTER] Raw headers:", req.rawHeaders);
    try {
      console.log("[REGISTER] Environment check - JWT_SECRET set:", !!process.env.JWT_SECRET);
      console.log("[REGISTER] Starting validation...");
      const validatedData = registerSchema2.parse(req.body);
      console.log("[REGISTER] Validation successful:", validatedData);
      console.log("[REGISTER] Checking username:", validatedData.username);
      try {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
          console.log("[REGISTER] Username exists:", validatedData.username);
          return res.status(400).json({ message: "Username already exists" });
        }
      } catch (error) {
        console.error("[REGISTER] Error checking username:", error);
        return res.status(500).json({ message: "Error checking username availability" });
      }
      console.log("[REGISTER] Checking email:", validatedData.email);
      try {
        const existingEmail = await storage.getUserByEmail(validatedData.email);
        if (existingEmail) {
          console.log("[REGISTER] Email exists:", validatedData.email);
          return res.status(400).json({ message: "Email already exists" });
        }
      } catch (error) {
        console.error("[REGISTER] Error checking email:", error);
        return res.status(500).json({ message: "Error checking email availability" });
      }
      console.log("[REGISTER] Hashing password...");
      let hashedPassword;
      try {
        hashedPassword = await bcrypt3.hash(validatedData.password, 10);
        console.log("[REGISTER] Password hashed successfully");
      } catch (error) {
        console.error("[REGISTER] Error hashing password:", error);
        return res.status(500).json({ message: "Error processing password" });
      }
      console.log("[REGISTER] Creating user with:", {
        username: validatedData.username,
        email: validatedData.email,
        password: "***",
        // Don't log actual password
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      });
      let user;
      try {
        user = await storage.createUser({
          username: validatedData.username,
          email: validatedData.email,
          password: hashedPassword,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName
        });
        console.log("[REGISTER] User created successfully:", { id: user.id, username: user.username });
      } catch (error) {
        console.error("[REGISTER] Error creating user:", error);
        return res.status(500).json({ message: "Error creating user account" });
      }
      console.log("[REGISTER] Generating JWT tokens...");
      const tokens = await JWTService.generateTokens(user);
      console.log("[REGISTER] Tokens value after generateTokens call:", tokens, "Type:", typeof tokens);
      console.log("[REGISTER] Tokens generated successfully");
      const { password, ...userWithoutPassword } = user;
      console.log("[REGISTER] User creation completed successfully");
      console.log("[REGISTER] About to send response with tokens:", tokens);
      res.status(201).json({
        user: userWithoutPassword,
        tokens
      });
    } catch (error) {
      console.error("=== [REGISTER] ERROR DEBUG ===");
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : void 0;
      console.error("[REGISTER] Error type:", error?.constructor?.name || "Unknown");
      console.error("[REGISTER] Error message:", errorMessage);
      console.error("[REGISTER] Error stack:", errorStack);
      if (error instanceof z6.ZodError) {
        console.log("[REGISTER] Zod validation error:", error.errors);
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      if (error instanceof Error) {
        const lowerCaseMessage = errorMessage.toLowerCase();
        if (lowerCaseMessage.includes("database") || lowerCaseMessage.includes("connection") || lowerCaseMessage.includes("mysql")) {
          console.error("[REGISTER] Database connection error detected");
          return res.status(503).json({ message: "Database service unavailable" });
        }
        if (lowerCaseMessage.includes("duplicate") || lowerCaseMessage.includes("already exists")) {
          console.error("[REGISTER] Duplicate entry error detected");
          return res.status(409).json({ message: "Resource already exists" });
        }
      }
      console.error("[REGISTER] Unexpected error, passing to error handler");
      next(error);
    } finally {
      console.log("=== [REGISTER] DEBUG END ===");
    }
  }
);
router25.post("/login", async (req, res, next) => {
  console.log("[AUTH-DEBUG] Login route added");
  try {
    console.log("[AUTH-DEBUG] Login handler called for path:", req.path);
    console.log("[LOGIN] Environment check - JWT_SECRET set:", !!process.env.JWT_SECRET);
    const validatedData = loginSchema.parse(req.body);
    const user = await storage.getUserByUsername(validatedData.username);
    if (!user || !user.password || !await bcrypt3.compare(validatedData.password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log("[LOGIN] Generating JWT tokens...");
    const tokens = await JWTService.generateTokens(user);
    console.log("[LOGIN] Tokens value after generateTokens call:", tokens, "Type:", typeof tokens);
    console.log("[LOGIN] Tokens generated successfully");
    const { password, ...userWithoutPassword } = user;
    console.log("[LOGIN] About to send response with tokens:", tokens);
    res.json({
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    if (error instanceof z6.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    next(error);
  }
});
router25.post("/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});
router25.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.split(" ")[1];
    const JWT_SECRET2 = process.env.JWT_SECRET || "your-jwt-secret-key-here-1234567890123456";
    const decoded = jwt3.verify(token, JWT_SECRET2);
    const userId = decoded.userId || decoded.id;
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("invalid") || errorMessage.includes("malformed")) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (errorMessage.includes("expired") || errorMessage.includes("TokenExpiredError")) {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(401).json({ error: "Authentication failed" });
  }
});
router25.post("/refresh", async (req, res, next) => {
  try {
    console.log("[REFRESH] Environment check - JWT_SECRET set:", !!process.env.JWT_SECRET);
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    const result = await JWTService.refreshAccessToken(refreshToken);
    console.log("[REFRESH] Result after refreshAccessToken:", result, "Type:", typeof result);
    console.log("[REFRESH] About to send response with result:", result);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid refresh token") {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    next(error);
  }
});
console.log("[AUTH-DEBUG] Final router stack:", router25.stack.map((layer) => {
  if (layer.route) {
    return {
      path: layer.route.path,
      methods: Object.keys(layer.route.methods || {})
    };
  }
  return "middleware";
}));
var auth_default2 = router25;

// server/routes.ts
var stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil"
    // Use the version expected by the installed Stripe library
  });
}
async function registerRoutes(app2) {
  console.log("[ROUTES] Registering routes...");
  console.log("[ROUTES] Adding image serving route...");
  app2.get("/api/test-image-route", (req, res) => {
    console.log("[TEST-ROUTE] Test route hit");
    res.json({ message: "Test route working" });
  });
  app2.get("/api/images/:size/:filename", (req, res) => {
    console.log("[IMAGE-SERVE] Image request received:", req.params);
    try {
      const { size, filename } = req.params;
      const validSizes = ["original", "optimized", "thumbnail"];
      if (!validSizes.includes(size)) {
        return res.status(400).json({ message: "Invalid image size" });
      }
      if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return res.status(400).json({ message: "Invalid filename" });
      }
      const filePath = path4.join(process.cwd(), "uploads", size === "original" ? "originals" : size === "optimized" ? "optimized" : "thumbnails", filename);
      if (fs3.existsSync(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000");
        res.setHeader("Content-Type", "image/jpeg");
        const fileStream = fs3.createReadStream(filePath);
        fileStream.pipe(res);
        fileStream.on("error", (error) => {
          console.error("Error streaming image file:", error);
          res.status(500).json({ message: "Error serving image" });
        });
      } else {
        res.status(404).json({ message: "Image not found" });
      }
    } catch (error) {
      console.error("Error serving image:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/simple-test", (req, res) => {
    console.log("=== SIMPLE TEST ENDPOINT HIT ===");
    console.log("Request received from mobile app");
    console.log("Sending connectivity test response");
    res.json({
      success: true,
      message: "Mobile app connectivity test successful",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      server: "AI Calorie Tracker Production Backend",
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      ip: req.ip,
      headers: {
        "user-agent": req.get("User-Agent"),
        "x-forwarded-for": req.get("X-Forwarded-For"),
        "x-real-ip": req.get("X-Real-IP")
      }
    });
  });
  app2.get("/api/meal-analyses", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const analyses = await storage.getMealAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching meal analyses:", error);
      res.status(500).json({ message: "Failed to fetch meal analyses" });
    }
  });
  app2.get("/api/meal-analyses/:id", authenticate, async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }
      const analysis = await storage.getMealAnalysis(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      if (analysis.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching meal analysis:", error);
      res.status(500).json({ message: "Failed to fetch meal analysis" });
    }
  });
  app2.post("/api/analyze-complex-meal", authenticate, async (req, res) => {
    try {
      const requestSchema = z7.object({
        images: z7.array(z7.string()).min(1).max(10)
      });
      const validatedData = requestSchema.parse(req.body);
      const userId = req.user.id;
      const analysisResults = [];
      for (const imageData of validatedData.images) {
        const base64Data = imageData.includes("base64,") ? imageData.split("base64,")[1] : imageData;
        let analysis = aiCache.get(base64Data);
        if (!analysis) {
          analysis = await aiService.analyzeMultiFoodImage(base64Data);
          aiCache.set(base64Data, analysis);
        }
        analysisResults.push(analysis);
      }
      const combinedAnalysis = {
        totalCalories: analysisResults.reduce((sum, item) => sum + item.calories, 0),
        totalProtein: analysisResults.reduce((sum, item) => sum + item.protein, 0),
        totalCarbs: analysisResults.reduce((sum, item) => sum + item.carbs, 0),
        totalFat: analysisResults.reduce((sum, item) => sum + item.fat, 0),
        foods: analysisResults,
        mealScore: calculateMealScore(analysisResults),
        nutritionalBalance: calculateNutritionalBalance(analysisResults)
      };
      const mealAnalysis = await storage.createMealAnalysis({
        userId,
        mealId: 0,
        // Will be set by database or can be updated later
        foodName: `Complex Meal (${analysisResults.length} items)`,
        estimatedCalories: combinedAnalysis.totalCalories,
        estimatedProtein: combinedAnalysis.totalProtein.toString(),
        estimatedCarbs: combinedAnalysis.totalCarbs.toString(),
        estimatedFat: combinedAnalysis.totalFat.toString(),
        imageUrl: validatedData.images[0],
        // Store first image only
        analysisDetails: {
          mealScore: combinedAnalysis.mealScore,
          nutritionalBalance: combinedAnalysis.nutritionalBalance,
          foodItems: analysisResults.length,
          isComplexMeal: true,
          referenceObject: analysisResults[0]?.referenceObject
        }
      });
      res.status(201).json(mealAnalysis);
    } catch (error) {
      console.error("Error analyzing complex meal:", error);
      if (error instanceof z7.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze complex meal" });
      }
    }
  });
  app2.post("/api/demo-analyze", async (req, res) => {
    try {
      const requestSchema = z7.object({
        imageData: z7.string()
      });
      const validatedData = requestSchema.parse(req.body);
      const base64Data = validatedData.imageData.includes("base64,") ? validatedData.imageData.split("base64,")[1] : validatedData.imageData;
      let analysis = aiCache.get(base64Data);
      if (!analysis) {
        analysis = await aiService.analyzeFoodImage(base64Data);
        aiCache.set(base64Data, analysis);
      }
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing food in demo:", error);
      if (error instanceof z7.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze food" });
      }
    }
  });
  app2.post("/api/analyze-food", authenticate, async (req, res) => {
    try {
      const requestSchema = z7.object({
        imageData: z7.string()
      });
      const validatedData = requestSchema.parse(req.body);
      const userId = req.user.id;
      const base64Data = validatedData.imageData.includes("base64,") ? validatedData.imageData.split("base64,")[1] : validatedData.imageData;
      let analysis = aiCache.get(base64Data);
      if (!analysis) {
        analysis = await aiService.analyzeFoodImage(base64Data);
        aiCache.set(base64Data, analysis);
      }
      const { imageStorageService: imageStorageService2 } = await Promise.resolve().then(() => (init_imageStorageService(), imageStorageService_exports));
      const buffer = Buffer.from(base64Data, "base64");
      const mimeType = validatedData.imageData.startsWith("data:image/") ? validatedData.imageData.substring(5, validatedData.imageData.indexOf(";")) : "image/jpeg";
      const processed = await imageStorageService2.processAndStoreImage(
        buffer,
        "camera.jpg",
        mimeType,
        userId
      );
      const optimizedUrl = imageStorageService2.getImageUrl(processed.optimized.path, "optimized");
      const mealAnalysis = await storage.createMealAnalysis({
        userId,
        mealId: 0,
        // Will be set by database or can be updated later
        foodName: analysis.foodName,
        estimatedCalories: analysis.calories,
        estimatedProtein: analysis.protein?.toString(),
        estimatedCarbs: analysis.carbs?.toString(),
        estimatedFat: analysis.fat?.toString(),
        imageUrl: optimizedUrl,
        imageHash: processed.original.hash,
        analysisDetails: analysis.analysisDetails
      });
      const { db: db3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { mealImages: mealImages2 } = await Promise.resolve().then(() => (init_mealImages(), mealImages_exports));
      await db3.insert(mealImages2).values({
        mealAnalysisId: mealAnalysis.id,
        filePath: processed.original.filename,
        fileSize: processed.optimized.size,
        mimeType: processed.optimized.mimeType,
        width: processed.optimized.width || null,
        height: processed.optimized.height || null,
        imageHash: processed.original.hash
      }).onDuplicateKeyUpdate({
        set: {
          mealAnalysisId: mealAnalysis.id,
          filePath: processed.original.filename,
          fileSize: processed.optimized.size,
          mimeType: processed.optimized.mimeType,
          width: processed.optimized.width || null,
          height: processed.optimized.height || null,
          updatedAt: sql28`CURRENT_TIMESTAMP`
        }
      });
      res.status(201).json(mealAnalysis);
    } catch (error) {
      console.error("Error analyzing food:", error);
      if (error instanceof z7.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze food" });
      }
    }
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    // 10MB
    fileFilter: (req, file, cb) => {
      const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);
      if (ok) cb(null, true);
      else cb(new Error("Unsupported file type"));
    }
  });
  app2.post("/api/meals/analyze", authenticate, upload.single("image"), async (req, res) => {
    try {
      const userId = req.user.id;
      const { imageStorageService: imageStorageService2 } = await Promise.resolve().then(() => (init_imageStorageService(), imageStorageService_exports));
      const { storage: storage2 } = await Promise.resolve().then(() => (init_storage_provider(), storage_provider_exports));
      let buffer = null;
      let originalName = "upload.jpg";
      let mimeType = "image/jpeg";
      if (req.file) {
        buffer = req.file.buffer;
        originalName = req.file.originalname || originalName;
        mimeType = req.file.mimetype || mimeType;
      } else if (typeof req.body?.imageData === "string") {
        const imageData = req.body.imageData.includes("base64,") ? req.body.imageData.split("base64,")[1] : req.body.imageData;
        buffer = Buffer.from(imageData, "base64");
        if (req.body.imageData.startsWith("data:image/")) {
          const mt = req.body.imageData.substring(5, req.body.imageData.indexOf(";"));
          if (mt) mimeType = mt;
        }
      }
      if (!buffer) {
        return res.status(400).json({ error: 'No image provided. Send multipart field "image" or JSON { imageData }.' });
      }
      const processed = await imageStorageService2.processAndStoreImage(
        buffer,
        originalName,
        mimeType,
        userId
      );
      const base64ForAI = buffer.toString("base64");
      const { aiService: aiService2 } = await Promise.resolve().then(() => (init_ai_service(), ai_service_exports));
      const analysis = await aiService2.analyzeFoodImage(base64ForAI);
      const mealAnalysis = await storage2.createMealAnalysis({
        userId,
        mealId: 0,
        foodName: analysis.foodName,
        estimatedCalories: analysis.calories,
        estimatedProtein: analysis.protein?.toString(),
        estimatedCarbs: analysis.carbs?.toString(),
        estimatedFat: analysis.fat?.toString(),
        imageUrl: `data:image/jpeg;base64,${base64ForAI}`,
        analysisDetails: analysis.analysisDetails
      });
      const { db: db3 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { mealImages: mealImages2 } = await Promise.resolve().then(() => (init_mealImages(), mealImages_exports));
      const { mealAnalyses: mealAnalyses2 } = await Promise.resolve().then(() => (init_mealAnalyses(), mealAnalyses_exports));
      const { eq: eq13 } = await import("drizzle-orm");
      const filename = processed.original.filename;
      const optimizedUrl = imageStorageService2.getImageUrl(processed.optimized.path, "optimized");
      await db3.insert(mealImages2).values({
        mealAnalysisId: mealAnalysis.id,
        filePath: filename,
        fileSize: processed.optimized.size,
        mimeType: processed.optimized.mimeType,
        width: processed.optimized.width || null,
        height: processed.optimized.height || null,
        imageHash: processed.original.hash
      });
      await db3.update(mealAnalyses2).set({ imageHash: processed.original.hash, imageUrl: optimizedUrl }).where(eq13(mealAnalyses2.id, mealAnalysis.id));
      res.status(201).json({ ...mealAnalysis, imageUrl: optimizedUrl });
    } catch (error) {
      console.error("Error analyzing meal image:", error);
      res.status(500).json({ message: "Failed to analyze meal image" });
    }
  });
  app2.get("/api/weekly-stats", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const medicalCondition = req.query.medicalCondition;
      const stats = await storage.getWeeklyStats(userId, medicalCondition);
      if (!stats) {
        return res.status(404).json({ message: "No weekly stats found" });
      }
      res.json(stats);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });
  app2.post("/api/meal-plan", authenticate, async (req, res) => {
    try {
      const { goal, medicalCondition } = req.body;
      if (!goal) {
        return res.status(400).json({ message: "Goal is required" });
      }
      const mealPlan = await generateMealPlan(goal, medicalCondition);
      res.json(mealPlan);
    } catch (error) {
      console.error("Error generating meal plan:", error);
      res.status(500).json({ message: "Failed to generate meal plan" });
    }
  });
  app2.get("/api/nutrition-tips", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const tips = await getNutritionTips(userId);
      res.json({ tips });
    } catch (error) {
      console.error("Error fetching nutrition tips:", error);
      res.status(500).json({ message: "Failed to fetch nutrition tips" });
    }
  });
  app2.get("/api/smart-meal-suggestions", authenticate, async (req, res) => {
    try {
      const userId = req.user.id;
      const suggestions = await getSmartMealSuggestions(userId);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting smart meal suggestions:", error);
      res.status(500).json({ message: "Failed to get meal suggestions" });
    }
  });
  if (stripe) {
    app2.post("/api/create-payment-intent", authenticate, async (req, res) => {
      try {
        const { amount, currency = "usd" } = req.body;
        if (!amount) {
          return res.status(400).json({ message: "Amount is required" });
        }
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          // Convert to cents
          currency,
          metadata: {
            userId: req.user.id.toString(),
            username: req.user.username
          }
        });
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: error.message || "Failed to create payment intent" });
      }
    });
    app2.post("/api/create-subscription", authenticate, async (req, res) => {
      try {
        const { priceId, billingInterval = "monthly" } = req.body;
        if (!priceId) {
          return res.status(400).json({ message: "Price ID is required" });
        }
        let customerId = req.user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: req.user.email || void 0,
            name: `${req.user.firstName} ${req.user.lastName}`,
            metadata: {
              userId: req.user.id.toString()
            }
          });
          customerId = customer.id;
          await storage.updateUserStripeInfo(req.user.id, { stripeCustomerId: customerId });
        }
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: "default_incomplete",
          payment_settings: { save_default_payment_method: "on_subscription" },
          expand: ["latest_invoice.payment_intent"]
        });
        await storage.updateUserStripeInfo(req.user.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionType: billingInterval,
          subscriptionStatus: subscription.status
        });
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice.payment_intent;
        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret
        });
      } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: error.message || "Failed to create subscription" });
      }
    });
    app2.get("/api/subscription", authenticate, async (req, res) => {
      try {
        const user = req.user;
        if (!user.stripeSubscriptionId) {
          return res.json({ active: false });
        }
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        await storage.updateUserStripeInfo(user.id, {
          subscriptionStatus: subscription.status,
          isPremium: subscription.status === "active"
        });
        res.json({
          active: subscription.status === "active",
          status: subscription.status,
          // @ts-ignore - Stripe types don't properly handle these fields
          currentPeriodEnd: new Date(subscription.current_period_end * 1e3),
          // @ts-ignore - Stripe types don't properly handle these fields
          plan: subscription.items.data[0]?.plan.nickname || "Unknown plan"
        });
      } catch (error) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ message: error.message || "Failed to fetch subscription" });
      }
    });
    app2.post("/api/cancel-subscription", authenticate, async (req, res) => {
      try {
        const user = req.user;
        if (!user.stripeSubscriptionId) {
          return res.status(400).json({ message: "No active subscription" });
        }
        const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true
        });
        await storage.updateUserStripeInfo(user.id, {
          subscriptionStatus: "canceling"
        });
        res.json({
          message: "Subscription will be canceled at the end of the billing period",
          // @ts-ignore - Stripe types don't properly handle these fields
          cancelAt: new Date(subscription.cancel_at * 1e3)
        });
      } catch (error) {
        console.error("Error canceling subscription:", error);
        res.status(500).json({ message: error.message || "Failed to cancel subscription" });
      }
    });
  }
  app2.get("/api/admin/content/:key", authenticate, isAdmin2, async (req, res) => {
    try {
      const key = req.params.key;
      const value = await storage.getSiteContent(key);
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });
  app2.post("/api/admin/content/:key", authenticate, isAdmin2, async (req, res) => {
    try {
      const key = req.params.key;
      const value = req.body.value;
      await storage.updateSiteContent(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update content" });
    }
  });
  app2.get("/api/user/goals", authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      res.json(user.nutritionGoals || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition goals" });
    }
  });
  app2.post("/api/user/goals", authenticate, async (req, res) => {
    try {
      const { calories, protein, carbs, fat } = req.body;
      await storage.updateUserNutritionGoals(req.user.id, { calories, protein, carbs, fat });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update nutrition goals" });
    }
  });
  app2.post("/api/nutrition-coach-chat", authenticate, async (req, res) => {
    try {
      console.log(`[NUTRITION-COACH] Request received for user: ${req.user.id}`);
      console.log(`[NUTRITION-COACH] Request body:`, req.body);
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        console.log(`[NUTRITION-COACH] Invalid messages format:`, messages);
        return res.status(400).json({ error: "Messages array is required" });
      }
      console.log(`[NUTRITION-COACH] Processing ${messages.length} messages`);
      console.log(`[NUTRITION-COACH] First message:`, messages[0]);
      const reply = await getNutritionCoachReply(messages, req.user.id);
      console.log(`[NUTRITION-COACH] OpenAI reply received:`, reply.substring(0, 100) + "...");
      res.json({ reply });
    } catch (error) {
      console.error("[NUTRITION-COACH] Error in nutrition coach chat:", error);
      res.status(500).json({ reply: "Sorry, I couldn't process your request." });
    }
  });
  app2.post("/api/onboarding/complete", authenticate, async (req, res) => {
    const startTime = Date.now();
    const userId = req.user.id;
    console.log(`[ONBOARDING] Starting onboarding process for user ${userId}`);
    try {
      if (!req.body || typeof req.body !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const onboardingData = req.body;
      const validateOnboardingData = (data) => {
        const errors = [];
        const requiredFields = ["age", "gender", "height", "weight", "activityLevel", "primaryGoal"];
        for (const field of requiredFields) {
          if (data[field] === void 0 || data[field] === null || data[field] === "") {
            errors.push(`${field} is required`);
          }
        }
        const numericFields = ["age", "height", "weight"];
        for (const field of numericFields) {
          const value = Number(data[field]);
          if (isNaN(value) || value <= 0) {
            errors.push(`${field} must be a positive number`);
          } else if (field === "age" && (value < 13 || value > 120)) {
            errors.push("age must be between 13 and 120");
          } else if (field === "height" && (value < 50 || value > 300)) {
            errors.push("height must be between 50cm and 300cm");
          } else if (field === "weight" && (value < 20 || value > 500)) {
            errors.push("weight must be between 20kg and 500kg");
          }
        }
        if (data.targetWeight !== void 0) {
          const targetWeight = Number(data.targetWeight);
          if (isNaN(targetWeight) || targetWeight <= 0) {
            errors.push("targetWeight must be a positive number");
          } else if (targetWeight < 20 || targetWeight > 500) {
            errors.push("targetWeight must be between 20kg and 500kg");
          }
        }
        const validActivityLevels = ["sedentary", "light", "moderate", "active", "extra-active"];
        if (!validActivityLevels.includes(data.activityLevel)) {
          errors.push("Invalid activity level. Must be one of: " + validActivityLevels.join(", "));
        }
        const validGoals = ["lose-weight", "maintain-weight", "gain-muscle"];
        if (!validGoals.includes(data.primaryGoal)) {
          errors.push("Invalid primary goal. Must be one of: " + validGoals.join(", "));
        }
        const validGenders = ["male", "female", "other"];
        if (!validGenders.includes(data.gender)) {
          errors.push("Invalid gender. Must be one of: " + validGenders.join(", "));
        }
        if (data.timeline !== void 0) {
          const validTimelines = ["1-3 months", "3-6 months", "6-12 months", "1+ years"];
          if (!validTimelines.includes(data.timeline)) {
            errors.push("Invalid timeline. Must be one of: " + validTimelines.join(", "));
          }
        }
        if (data.dietaryPreferences !== void 0 && !Array.isArray(data.dietaryPreferences)) {
          errors.push("dietaryPreferences must be an array");
        }
        if (data.allergies !== void 0 && !Array.isArray(data.allergies)) {
          errors.push("allergies must be an array");
        }
        if (data.aiMealSuggestions !== void 0 && typeof data.aiMealSuggestions !== "boolean") {
          errors.push("aiMealSuggestions must be a boolean");
        }
        if (data.notificationsEnabled !== void 0 && typeof data.notificationsEnabled !== "boolean") {
          errors.push("notificationsEnabled must be a boolean");
        }
        return errors;
      };
      const validationErrors = validateOnboardingData(onboardingData);
      if (validationErrors.length > 0) {
        console.log(`[ONBOARDING] Validation failed for user ${userId}:`, validationErrors);
        return res.status(400).json({ error: "Validation failed: " + validationErrors.join(", ") });
      }
      const processedData = {
        ...onboardingData,
        age: Number(onboardingData.age),
        height: Number(onboardingData.height),
        weight: Number(onboardingData.weight),
        targetWeight: onboardingData.targetWeight ? Number(onboardingData.targetWeight) : null,
        aiMealSuggestions: onboardingData.aiMealSuggestions !== void 0 ? Boolean(onboardingData.aiMealSuggestions) : true,
        aiChatAssistantName: onboardingData.aiChatAssistantName || "NutriBot",
        notificationsEnabled: onboardingData.notificationsEnabled !== void 0 ? Boolean(onboardingData.notificationsEnabled) : true
      };
      const dietaryPreferences = Array.isArray(processedData.dietaryPreferences) ? processedData.dietaryPreferences : [];
      const allergies = Array.isArray(processedData.allergies) ? processedData.allergies : [];
      console.log(`[ONBOARDING] Processing onboarding data for user ${userId}`);
      try {
        await db2.transaction(async (tx) => {
          const existingUser = await tx.select().from(users).where(eq12(users.id, userId));
          if (!existingUser || existingUser.length === 0) {
            throw new Error(`User with ID ${userId} not found`);
          }
          await tx.update(users).set({
            age: processedData.age,
            gender: processedData.gender,
            height: processedData.height,
            weight: processedData.weight,
            activityLevel: processedData.activityLevel,
            primaryGoal: processedData.primaryGoal,
            targetWeight: processedData.targetWeight,
            timeline: processedData.timeline,
            dietaryPreferences: JSON.stringify(dietaryPreferences),
            allergies: JSON.stringify(allergies),
            aiMealSuggestions: processedData.aiMealSuggestions,
            aiChatAssistantName: processedData.aiChatAssistantName,
            notificationsEnabled: processedData.notificationsEnabled,
            onboardingCompleted: true,
            onboardingCompletedAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq12(users.id, userId));
          const bmr2 = calculateBMR(processedData.weight, processedData.height, processedData.age, processedData.gender);
          const activityMultiplier2 = getActivityMultiplier(processedData.activityLevel);
          const tdee2 = bmr2 * activityMultiplier2;
          let dailyCalories2 = tdee2;
          if (processedData.primaryGoal === "lose-weight") {
            dailyCalories2 = tdee2 - 500;
          } else if (processedData.primaryGoal === "gain-muscle") {
            dailyCalories2 = tdee2 + 300;
          }
          const existingGoals = await tx.select().from(nutritionGoals).where(eq12(nutritionGoals.userId, userId));
          if (existingGoals && existingGoals.length > 0) {
            await tx.update(nutritionGoals).set({
              dailyCalories: Math.round(dailyCalories2),
              calories: Math.round(dailyCalories2),
              protein: Math.round(processedData.weight * 2.2),
              // 2.2g per kg body weight
              carbs: Math.round(dailyCalories2 * 0.45 / 4),
              // 45% of calories from carbs
              fat: Math.round(dailyCalories2 * 0.3 / 9),
              // 30% of calories from fat
              weight: processedData.weight,
              weeklyWorkouts: getWeeklyWorkoutsFromActivity(processedData.activityLevel),
              waterIntake: 8,
              // 8 glasses per day default
              updatedAt: /* @__PURE__ */ new Date()
            }).where(eq12(nutritionGoals.userId, userId));
          } else {
            await tx.insert(nutritionGoals).values({
              userId,
              dailyCalories: Math.round(dailyCalories2),
              calories: Math.round(dailyCalories2),
              protein: Math.round(processedData.weight * 2.2),
              // 2.2g per kg body weight
              carbs: Math.round(dailyCalories2 * 0.45 / 4),
              // 45% of calories from carbs
              fat: Math.round(dailyCalories2 * 0.3 / 9),
              // 30% of calories from fat
              weight: processedData.weight,
              weeklyWorkouts: getWeeklyWorkoutsFromActivity(processedData.activityLevel),
              waterIntake: 8,
              // 8 glasses per day default
              createdAt: /* @__PURE__ */ new Date(),
              updatedAt: /* @__PURE__ */ new Date()
            });
          }
        });
      } catch (dbError) {
        console.error(`[ONBOARDING] Database transaction failed for user ${userId}:`, dbError);
        throw new Error(`Database operation failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
      }
      const duration = Date.now() - startTime;
      console.log(`[ONBOARDING] Onboarding completed successfully for user ${userId} in ${duration}ms`);
      const bmr = calculateBMR(processedData.weight, processedData.height, processedData.age, processedData.gender);
      const activityMultiplier = getActivityMultiplier(processedData.activityLevel);
      const tdee = bmr * activityMultiplier;
      let dailyCalories = tdee;
      if (processedData.primaryGoal === "lose-weight") {
        dailyCalories = tdee - 500;
      } else if (processedData.primaryGoal === "gain-muscle") {
        dailyCalories = tdee + 300;
      }
      res.status(201).json({
        data: {
          userId,
          nutritionGoals: {
            dailyCalories: Math.round(dailyCalories),
            calories: Math.round(dailyCalories),
            protein: Math.round(processedData.weight * 2.2),
            carbs: Math.round(dailyCalories * 0.45 / 4),
            fat: Math.round(dailyCalories * 0.3 / 9)
          },
          completedAt: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[ONBOARDING] Error completing onboarding for user ${userId} after ${duration}ms:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : void 0;
      res.status(500).json({
        error: process.env.NODE_ENV === "development" ? errorMessage : "Internal server error",
        ...process.env.NODE_ENV === "development" && { stack: errorStack }
      });
    }
  });
  app2.get("/api/admin/ai-config", authenticate, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const configs = await storage.getAIConfigs();
      const sanitizedConfigs = configs.map((config3) => ({
        ...config3,
        apiKeyEncrypted: config3.apiKeyEncrypted ? "***CONFIGURED***" : null,
        hasApiKey: !!config3.apiKeyEncrypted
      }));
      res.json(sanitizedConfigs);
    } catch (error) {
      console.error("Error fetching AI configs:", error);
      res.status(500).json({ message: "Failed to fetch AI configurations" });
    }
  });
  app2.put("/api/admin/ai-config/:id", authenticate, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const configId = parseInt(req.params.id);
      const updateData = req.body;
      await storage.updateAIConfig(configId, updateData);
      res.json({ success: true, message: "AI configuration updated successfully" });
    } catch (error) {
      console.error("Error updating AI config:", error);
      res.status(500).json({ message: "Failed to update AI configuration" });
    }
  });
  app2.post("/api/admin/ai-config/:id/activate", authenticate, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const configId = parseInt(req.params.id);
      await storage.deactivateAllAIConfigs();
      await storage.updateAIConfig(configId, { isActive: true });
      res.json({ success: true, message: "AI provider activated successfully" });
    } catch (error) {
      console.error("Error activating AI provider:", error);
      res.status(500).json({ message: "Failed to activate AI provider" });
    }
  });
  try {
    app2.use("/api/admin/dashboard", dashboard_default);
    app2.use("/api/admin/users", users_default);
    app2.use("/api/admin/system", system_default);
    app2.use("/api/admin/analytics", analytics_default);
    app2.use("/api/admin/payments", payments_default);
    app2.use("/api/admin/settings", settings_default);
    app2.use("/api/admin/backup", backup_default);
    app2.use("/api/admin/security", security_default);
    app2.use("/api/admin/notifications", notifications_default);
    app2.use("/api/admin/activity", activity_default);
    app2.use("/api/admin", admin_default);
  } catch (error) {
    console.error("Error loading admin routes:", error);
  }
  try {
    app2.use("/api/security", security_default2);
  } catch (error) {
    console.error("Error loading security routes:", error);
  }
  try {
    app2.use("/api/user", user_default);
  } catch (error) {
    console.error("Error loading user routes:", error);
  }
  try {
    app2.use("/api/wearable", wearables_default);
  } catch (error) {
    console.error("Error loading wearable routes:", error);
  }
  try {
    app2.use("/api/auth", auth_default2);
    console.log("\u2713 Auth routes mounted at /api/auth");
  } catch (error) {
    console.error("Error loading auth routes:", error);
  }
  const httpServer = createServer(app2);
  return httpServer;
}
function calculateMealScore(foods) {
  const avgDensity = foods.reduce((sum, food) => sum + (food.densityScore || 50), 0) / foods.length;
  const varietyScore = Math.min(foods.length * 10, 50);
  return Math.round(avgDensity + varietyScore);
}
function calculateNutritionalBalance(foods) {
  const total = foods.reduce((sum, food) => ({
    protein: sum.protein + food.protein,
    carbs: sum.carbs + food.carbs,
    fat: sum.fat + food.fat
  }), { protein: 0, carbs: 0, fat: 0 });
  const totalGrams = total.protein + total.carbs + total.fat;
  return {
    protein: Math.round(total.protein / totalGrams * 100),
    carbs: Math.round(total.carbs / totalGrams * 100),
    fat: Math.round(total.fat / totalGrams * 100)
  };
}
async function generateMealPlan(goal, medicalCondition) {
  return {
    plan: `Placeholder meal plan for ${goal} (${medicalCondition || "no condition"})`
  };
}
function calculateBMR(weight, height, age, gender) {
  if (gender === "male") {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}
function getActivityMultiplier(activityLevel) {
  const multipliers = {
    "sedentary": 1.2,
    "light": 1.375,
    "moderate": 1.55,
    "active": 1.725,
    "extra-active": 1.9
  };
  return multipliers[activityLevel] || 1.2;
}
function getWeeklyWorkoutsFromActivity(activityLevel) {
  const workouts2 = {
    "sedentary": 0,
    "light": 1,
    "moderate": 3,
    "active": 5,
    "extra-active": 7
  };
  return workouts2[activityLevel] || 0;
}

// server/error-handler.ts
var errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid input data";
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    message = "Unauthorized access";
  } else if (err.name === "ForbiddenError") {
    statusCode = 403;
    message = "Access forbidden";
  } else if (err.name === "NotFoundError") {
    statusCode = 404;
    message = "Resource not found";
  } else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "File too large";
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = "Unexpected field";
  }
  res.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    ...process.env.NODE_ENV === "development" && { stack: err.stack }
  });
};

// server/src/middleware/timeoutMiddleware.ts
function timeoutMiddleware(options = {}) {
  const {
    responseTimeout = 3e4,
    // 30 seconds default response timeout
    requestTimeout = 3e5,
    // 5 minutes default request timeout
    responseTimeoutMessage = "Request timeout",
    requestTimeoutMessage = "Request processing timeout"
  } = options;
  return (req, res, next) => {
    const requestTimeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: requestTimeoutMessage,
          code: "REQUEST_TIMEOUT",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          path: req.path,
          method: req.method
        });
      }
    }, requestTimeout);
    const responseTimeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          error: responseTimeoutMessage,
          code: "RESPONSE_TIMEOUT",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          path: req.path,
          method: req.method
        });
      }
    }, responseTimeout);
    const cleanup = () => {
      clearTimeout(requestTimeoutId);
      clearTimeout(responseTimeoutId);
      res.removeListener("finish", cleanup);
      res.removeListener("error", cleanup);
    };
    res.on("finish", cleanup);
    res.on("error", cleanup);
    next();
  };
}
var globalTimeoutOptions = {
  responseTimeout: parseInt(process.env.RESPONSE_TIMEOUT || "30000"),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || "300000"),
  responseTimeoutMessage: process.env.RESPONSE_TIMEOUT_MESSAGE || "Request timeout",
  requestTimeoutMessage: process.env.REQUEST_TIMEOUT_MESSAGE || "Request processing timeout"
};
function createTimeoutMiddleware(customOptions) {
  const options = { ...globalTimeoutOptions, ...customOptions };
  return timeoutMiddleware(options);
}

// server/src/routes/health.ts
import { Router as Router28 } from "express";

// server/src/controllers/healthController.ts
init_db2();
init_vite();
import { sql as sql29 } from "drizzle-orm";
var HealthController = class {
  startTime;
  constructor() {
    this.startTime = Date.now();
  }
  /**
   * Basic health check
   */
  async basicHealthCheck(req, res) {
    const response = {
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      checks: {
        database: {
          status: "healthy",
          responseTime: 0,
          lastChecked: (/* @__PURE__ */ new Date()).toISOString()
        },
        memory: {
          status: "healthy",
          used: 0,
          total: 0,
          percentage: 0
        },
        disk: {
          status: "healthy",
          used: 0,
          total: 0,
          percentage: 0
        },
        aiService: {
          status: "healthy",
          responseTime: 0,
          lastChecked: (/* @__PURE__ */ new Date()).toISOString()
        }
      }
    };
    try {
      const dbStart = Date.now();
      await db2.execute(sql29`SELECT 1`);
      const dbResponseTime = Date.now() - dbStart;
      response.checks.database.responseTime = dbResponseTime;
      const memoryUsage = process.memoryUsage();
      const memoryUsed = memoryUsage.heapUsed;
      const memoryTotal = memoryUsage.heapTotal;
      const memoryPercentage = memoryUsed / memoryTotal * 100;
      response.checks.memory.used = memoryUsed;
      response.checks.memory.total = memoryTotal;
      response.checks.memory.percentage = memoryPercentage;
      try {
        const fs4 = await import("fs");
        const path6 = await import("path");
        if (fs4.existsSync && path6.join) {
          const stats = await fs4.promises.stat(process.cwd());
          response.checks.disk.used = stats.size;
          response.checks.disk.total = 1024 * 1024 * 1024;
          response.checks.disk.percentage = stats.size / (1024 * 1024 * 1024) * 100;
        }
      } catch (error) {
      }
      try {
        const aiStart = Date.now();
        await new Promise((resolve2) => setTimeout(resolve2, 100));
        const aiResponseTime = Date.now() - aiStart;
        response.checks.aiService.responseTime = aiResponseTime;
      } catch (error) {
        response.checks.aiService.status = "unhealthy";
        response.checks.aiService.error = error instanceof Error ? error.message : "Unknown error";
      }
      const unhealthyChecks = Object.values(response.checks).filter((check) => check.status === "unhealthy").length;
      const degradedChecks = Object.values(response.checks).filter((check) => check.status === "degraded").length;
      if (unhealthyChecks > 0) {
        response.status = "unhealthy";
      } else if (degradedChecks > 0) {
        response.status = "degraded";
      }
      const statusCode = response.status === "healthy" ? 200 : response.status === "degraded" ? 206 : 503;
      res.status(statusCode).json(response);
    } catch (error) {
      log("Health check failed:", error);
      const errorResponse = {
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        checks: {
          database: {
            status: "unhealthy",
            responseTime: 0,
            lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
            error: error instanceof Error ? error.message : "Unknown error"
          },
          memory: {
            status: "healthy",
            used: 0,
            total: 0,
            percentage: 0
          },
          disk: {
            status: "healthy",
            used: 0,
            total: 0,
            percentage: 0
          },
          aiService: {
            status: "unhealthy",
            responseTime: 0,
            lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
            error: "Service unavailable"
          }
        }
      };
      res.status(503).json(errorResponse);
    }
  }
  /**
   * Detailed health check with metrics
   */
  async detailedHealthCheck(req, res) {
    try {
      const basicResponse = await this.basicHealthCheck(req, res);
      if (basicResponse.status !== "unhealthy") {
        try {
          const [userCount] = await db2.execute(sql29`SELECT COUNT(*) as count FROM users`);
          const [mealCount] = await db2.execute(sql29`SELECT COUNT(*) as count FROM meals`);
          const [analysisCount] = await db2.execute(sql29`SELECT COUNT(*) as count FROM meal_analyses`);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1e3);
          const [activeUsers] = await db2.execute(
            sql29`SELECT COUNT(DISTINCT user_id) as count FROM meals WHERE created_at > ${twentyFourHoursAgo}`
          );
          basicResponse.metrics = {
            totalUsers: Number(userCount[0]?.count || 0),
            totalMeals: Number(mealCount[0]?.count || 0),
            totalAnalyses: Number(analysisCount[0]?.count || 0),
            activeUsers24h: Number(activeUsers[0]?.count || 0)
          };
        } catch (error) {
          log("Failed to get metrics:", error);
        }
      }
      res.json(basicResponse);
    } catch (error) {
      log("Detailed health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        checks: {
          database: {
            status: "unhealthy",
            responseTime: 0,
            lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
            error: error instanceof Error ? error.message : "Unknown error"
          },
          memory: {
            status: "healthy",
            used: 0,
            total: 0,
            percentage: 0
          },
          disk: {
            status: "healthy",
            used: 0,
            total: 0,
            percentage: 0
          },
          aiService: {
            status: "unhealthy",
            responseTime: 0,
            lastChecked: (/* @__PURE__ */ new Date()).toISOString(),
            error: "Service unavailable"
          }
        }
      });
    }
  }
  /**
   * Database-specific health check
   */
  async databaseHealthCheck(req, res) {
    try {
      const start = Date.now();
      await db2.execute(sql29`SELECT 1`);
      const responseTime = Date.now() - start;
      const [tables] = await db2.execute(sql29`SHOW TABLES`);
      const [status] = await db2.execute(sql29`SHOW STATUS LIKE 'Threads_connected'`);
      const [variables] = await db2.execute(sql29`SHOW VARIABLES LIKE 'max_connections'`);
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        responseTime,
        database: {
          version: "8.0.0",
          // This would be dynamic in production
          tables: tables.length,
          connections: Number(status[0]?.Value || 0),
          maxConnections: Number(variables[0]?.Value || 0),
          uptime: process.uptime()
        }
      });
    } catch (error) {
      log("Database health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * System health check
   */
  async systemHealthCheck(req, res) {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const systemInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        environment: process.env.NODE_ENV || "development",
        version: process.env.npm_package_version || "1.0.0"
      };
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        system: systemInfo
      });
    } catch (error) {
      log("System health check failed:", error);
      res.status(503).json({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Readiness probe
   */
  async readinessProbe(req, res) {
    try {
      const isReady = await this.checkReadiness();
      if (isReady) {
        res.status(200).json({
          status: "ready",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        res.status(503).json({
          status: "not ready",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      log("Readiness probe failed:", error);
      res.status(503).json({
        status: "not ready",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Liveness probe
   */
  async livenessProbe(req, res) {
    try {
      const isAlive = await this.checkLiveness();
      if (isAlive) {
        res.status(200).json({
          status: "alive",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          uptime: process.uptime()
        });
      } else {
        res.status(503).json({
          status: "not alive",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      log("Liveness probe failed:", error);
      res.status(503).json({
        status: "not alive",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
  /**
   * Check if application is ready
   */
  async checkReadiness() {
    try {
      await db2.execute(sql29`SELECT 1`);
      return true;
    } catch (error) {
      return false;
    }
  }
  /**
   * Check if application is alive
   */
  async checkLiveness() {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal * 100;
      if (memoryPercentage > 90) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }
};
var healthController = new HealthController();

// server/src/routes/health.ts
var healthRouter = Router28();
healthRouter.get("/", healthController.basicHealthCheck);
healthRouter.get("/detailed", healthController.detailedHealthCheck);
healthRouter.get("/database", healthController.databaseHealthCheck);
healthRouter.get("/system", healthController.systemHealthCheck);
healthRouter.get("/ready", healthController.readinessProbe);
healthRouter.get("/live", healthController.livenessProbe);
var health_default = healthRouter;

// server/src/services/errorTrackingService.ts
init_vite();
var ErrorTrackingService = class {
  options;
  errorQueue = [];
  isProcessing = false;
  flushInterval = null;
  constructor(options = {}) {
    this.options = {
      enableTracking: true,
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      sampleRate: 1,
      beforeSend: (error) => true,
      maxStackSize: 1e3,
      excludePatterns: [],
      includeStack: true,
      ...options
    };
    this.startFlushInterval();
  }
  /**
   * Track an error
   */
  async trackError(error, context) {
    if (!this.options.enableTracking) {
      return;
    }
    if (Math.random() > this.options.sampleRate) {
      return;
    }
    if (this.shouldExcludeError(error)) {
      return;
    }
    const errorDetails = error instanceof Error ? this.createErrorDetails(error, context) : error;
    if (!this.options.beforeSend(errorDetails)) {
      return;
    }
    this.errorQueue.push(errorDetails);
    if (this.errorQueue.length >= this.options.maxStackSize) {
      await this.flush();
    }
    this.logError(errorDetails);
  }
  /**
   * Create error details from Error object
   */
  createErrorDetails(error, context) {
    const errorContext = {
      timestamp: Date.now(),
      environment: this.options.environment,
      version: this.options.version,
      ...context
    };
    return {
      name: error.name,
      message: error.message,
      stack: this.options.includeStack ? error.stack : void 0,
      code: error.code,
      statusCode: error.statusCode,
      severity: this.categorizeSeverity(error),
      category: this.categorizeError(error),
      context: errorContext,
      metadata: {
        ...error.metadata || {},
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }
  /**
   * Categorize error severity
   */
  categorizeSeverity(error) {
    const message = error.message.toLowerCase();
    const code = error.code?.toLowerCase();
    if (code === "auth_failed" || code === "unauthorized" || message.includes("critical")) {
      return "critical";
    }
    if (code === "validation_failed" || message.includes("failed") || message.includes("error")) {
      return "high";
    }
    if (message.includes("warning") || message.includes("deprecated")) {
      return "medium";
    }
    return "low";
  }
  /**
   * Categorize error type
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    const code = error.code?.toLowerCase();
    if (code?.includes("auth") || message.includes("auth") || message.includes("login")) {
      return "auth";
    }
    if (code?.includes("validation") || message.includes("validation") || message.includes("invalid")) {
      return "validation";
    }
    if (code?.includes("database") || message.includes("database") || message.includes("sql")) {
      return "database";
    }
    if (code?.includes("api") || message.includes("api") || message.includes("http")) {
      return "api";
    }
    if (code?.includes("ai") || message.includes("ai") || message.includes("openai") || message.includes("gemini")) {
      return "ai";
    }
    if (code?.includes("file") || message.includes("file") || message.includes("image")) {
      return "file";
    }
    if (code?.includes("system") || message.includes("system") || message.includes("memory")) {
      return "system";
    }
    return "unknown";
  }
  /**
   * Check if error should be excluded
   */
  shouldExcludeError(error) {
    const message = error instanceof Error ? error.message : error.message;
    const code = error instanceof Error ? error.code : error.code;
    return this.options.excludePatterns.some((pattern) => {
      return pattern.test(message) || code && pattern.test(code);
    });
  }
  /**
   * Log error
   */
  logError(errorDetails) {
    const logMessage = `[${errorDetails.severity.toUpperCase()}] ${errorDetails.category.toUpperCase()}: ${errorDetails.message}`;
    switch (errorDetails.severity) {
      case "critical":
        console.error(logMessage, errorDetails);
        break;
      case "high":
        console.error(logMessage, errorDetails);
        break;
      case "medium":
        console.warn(logMessage, errorDetails);
        break;
      case "low":
        console.info(logMessage, errorDetails);
        break;
    }
  }
  /**
   * Flush error queue
   */
  async flush() {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }
    this.isProcessing = true;
    const errorsToFlush = [...this.errorQueue];
    this.errorQueue = [];
    try {
      log(`Flushing ${errorsToFlush.length} errors to tracking service`);
      await this.sendToExternalService(errorsToFlush);
    } catch (error) {
      console.log("Failed to flush errors:", error instanceof Error ? error.message : String(error));
      this.errorQueue.unshift(...errorsToFlush);
    } finally {
      this.isProcessing = false;
    }
  }
  /**
   * Send errors to external service
   */
  async sendToExternalService(errors) {
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  }
  /**
   * Create error boundary for React components
   */
  createReactErrorBoundary() {
    return {
      ErrorBoundary: class ReactErrorBoundary {
        state = { hasError: false, error: null };
        static getDerivedStateFromError(error) {
          return { hasError: true, error };
        }
        componentDidCatch(error, errorInfo) {
          const errorDetails = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: error.code,
            statusCode: error.statusCode,
            severity: "high",
            category: "system",
            context: {
              timestamp: Date.now(),
              environment: errorTrackingService.options.environment,
              version: errorTrackingService.options.version,
              componentStack: errorInfo.componentStack
            },
            metadata: {
              component: "UnknownComponent",
              location: window.location.href
            }
          };
          errorTrackingService.trackError(errorDetails);
        }
        render() {
          if (this.state.hasError) {
            return `
              <div class="error-boundary">
                <h2>Something went wrong</h2>
                <p>We're sorry, but something went wrong. Our team has been notified.</p>
                <button onclick="window.location.reload()">Refresh the page</button>
              </div>
            `;
          }
          return "";
        }
      }
    };
  }
  /**
   * Create global error handler
   */
  createGlobalErrorHandler() {
    return (event, promiseRejection) => {
      const errorDetails = {
        name: event.error?.name || promiseRejection.reason?.name || "UnknownError",
        message: event.error?.message || promiseRejection.reason?.message || "Unknown error occurred",
        stack: event.error?.stack || promiseRejection.reason?.stack,
        code: event.error?.code || promiseRejection.reason?.code,
        statusCode: event.error?.statusCode || promiseRejection.reason?.statusCode,
        severity: "high",
        category: "system",
        context: {
          timestamp: Date.now(),
          environment: this.options.environment,
          version: this.options.version,
          source: event.filename || promiseRejection.type,
          lineno: event.lineno,
          colno: event.colno
        },
        metadata: {
          type: event.type || promiseRejection.type,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      };
      this.trackError(errorDetails);
    };
  }
  /**
   * Install global error handlers
   */
  installGlobalHandlers() {
    process.on("uncaughtException", (error) => {
      this.trackError(error, {
        category: "system",
        severity: "critical"
      });
    });
    process.on("unhandledRejection", (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.trackError(error, {
        category: "system",
        severity: "high"
      });
    });
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        this.trackError(event.error, {
          category: "system",
          severity: "high"
        });
      });
      window.addEventListener("unhandledrejection", (event) => {
        const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
        this.trackError(error, {
          category: "system",
          severity: "high"
        });
      });
    }
  }
  /**
   * Start flush interval
   */
  startFlushInterval() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 3e4);
  }
  /**
   * Get error statistics
   */
  getStats() {
    const errorsByCategory = {};
    const errorsBySeverity = {};
    this.errorQueue.forEach((error) => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
    });
    return {
      totalErrors: this.errorQueue.length,
      errorsByCategory,
      errorsBySeverity,
      queueSize: this.errorQueue.length
    };
  }
  /**
   * Clear error queue
   */
  clearQueue() {
    this.errorQueue = [];
  }
  /**
   * Update options
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
  }
  /**
   * Get current options
   */
  getOptions() {
    return { ...this.options };
  }
  /**
   * Cleanup service
   */
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
};
var errorTrackingService = new ErrorTrackingService();

// server/src/utils/performanceMonitor.ts
var MockPerformanceMonitor = class {
  metrics = [];
  databaseQueries = [];
  externalApiCalls = [];
  aiServiceCalls = [];
  timers = /* @__PURE__ */ new Map();
  maxMetrics = 1e4;
  startTimer(label) {
    const start = Date.now();
    const timer = { start, metrics: {} };
    this.timers.set(label, timer);
    return () => {
      const duration = Date.now() - start;
      const timerData = this.timers.get(label);
      if (timerData) {
        timerData.metrics.responseTime = duration;
        this.timers.delete(label);
      }
    };
  }
  recordMetric(metric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  recordDatabaseQuery(query) {
    this.databaseQueries.push(query);
    if (this.databaseQueries.length > this.maxMetrics) {
      this.databaseQueries = this.databaseQueries.slice(-this.maxMetrics);
    }
  }
  recordExternalApiCall(apiCall) {
    this.externalApiCalls.push(apiCall);
    if (this.externalApiCalls.length > this.maxMetrics) {
      this.externalApiCalls = this.externalApiCalls.slice(-this.maxMetrics);
    }
  }
  recordAiServiceCall(aiCall) {
    this.aiServiceCalls.push(aiCall);
    if (this.aiServiceCalls.length > this.maxMetrics) {
      this.aiServiceCalls = this.aiServiceCalls.slice(-this.maxMetrics);
    }
  }
  async getPerformanceStats() {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const recentMetrics = this.metrics.filter(
      (metric) => metric.timestamp >= oneHourAgo
    );
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        throughput: 0,
        memoryUsage: { average: 0, peak: 0 },
        cpuUsage: { average: 0, peak: 0 },
        topEndpoints: []
      };
    }
    const responseTimes = recentMetrics.map((m) => m.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    const errorCount = recentMetrics.filter((m) => m.statusCode >= 400).length;
    const errorRate = errorCount / recentMetrics.length * 100;
    const throughput = recentMetrics.length / 3600;
    const memoryUsages = recentMetrics.map((m) => m.memoryUsage.percentage);
    const cpuUsages = recentMetrics.map((m) => m.cpuUsage.user + m.cpuUsage.system);
    const memoryUsage = {
      average: memoryUsages.reduce((sum, usage) => sum + usage, 0) / memoryUsages.length,
      peak: Math.max(...memoryUsages)
    };
    const cpuUsage = {
      average: cpuUsages.reduce((sum, usage) => sum + usage, 0) / cpuUsages.length,
      peak: Math.max(...cpuUsages)
    };
    const endpointStats = /* @__PURE__ */ new Map();
    recentMetrics.forEach((metric) => {
      const stats = endpointStats.get(metric.endpoint) || { count: 0, totalTime: 0, errors: 0 };
      stats.count++;
      stats.totalTime += metric.responseTime;
      if (metric.statusCode >= 400) stats.errors++;
      endpointStats.set(metric.endpoint, stats);
    });
    const topEndpoints = Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      count: stats.count,
      averageTime: stats.totalTime / stats.count,
      errorRate: stats.errors / stats.count * 100
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    return {
      totalRequests: recentMetrics.length,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      throughput,
      memoryUsage,
      cpuUsage,
      topEndpoints
    };
  }
  async getSlowEndpoints(threshold) {
    return this.metrics.filter((metric) => metric.responseTime > threshold).sort((a, b) => b.responseTime - a.responseTime).slice(0, 50);
  }
  async getDatabaseStats() {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const recentQueries = this.databaseQueries.filter(
      (query) => query.timestamp >= oneHourAgo
    );
    if (recentQueries.length === 0) {
      return {
        totalQueries: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        queriesByTable: {},
        queriesByOperation: {},
        slowestQueries: []
      };
    }
    const averageQueryTime = recentQueries.reduce((sum, query) => sum + query.duration, 0) / recentQueries.length;
    const slowQueries = recentQueries.filter((query) => query.duration > 1e3).length;
    const queriesByTable = {};
    recentQueries.forEach((query) => {
      if (query.table) {
        queriesByTable[query.table] = (queriesByTable[query.table] || 0) + 1;
      }
    });
    const queriesByOperation = {};
    recentQueries.forEach((query) => {
      if (query.operation) {
        queriesByOperation[query.operation] = (queriesByOperation[query.operation] || 0) + 1;
      }
    });
    const slowestQueries = recentQueries.sort((a, b) => b.duration - a.duration).slice(0, 10);
    return {
      totalQueries: recentQueries.length,
      averageQueryTime,
      slowQueries,
      queriesByTable,
      queriesByOperation,
      slowestQueries
    };
  }
  async getExternalApiStats() {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const recentCalls = this.externalApiCalls.filter(
      (call) => call.timestamp >= oneHourAgo
    );
    if (recentCalls.length === 0) {
      return {
        totalCalls: 0,
        averageCallTime: 0,
        successRate: 0,
        callsByService: {},
        slowestCalls: []
      };
    }
    const averageCallTime = recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length;
    const successCalls = recentCalls.filter((call) => call.success).length;
    const successRate = successCalls / recentCalls.length * 100;
    const callsByService = {};
    recentCalls.forEach((call) => {
      callsByService[call.service] = (callsByService[call.service] || 0) + 1;
    });
    const slowestCalls = recentCalls.sort((a, b) => b.duration - a.duration).slice(0, 10);
    return {
      totalCalls: recentCalls.length,
      averageCallTime,
      successRate,
      callsByService,
      slowestCalls
    };
  }
  async getAiServiceStats() {
    const now = /* @__PURE__ */ new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1e3);
    const recentCalls = this.aiServiceCalls.filter(
      (call) => call.timestamp >= oneHourAgo
    );
    if (recentCalls.length === 0) {
      return {
        totalCalls: 0,
        averageCallTime: 0,
        successRate: 0,
        callsByService: {},
        tokensUsed: 0,
        averageTokensPerCall: 0,
        slowestCalls: []
      };
    }
    const averageCallTime = recentCalls.reduce((sum, call) => sum + call.duration, 0) / recentCalls.length;
    const successCalls = recentCalls.filter((call) => call.success).length;
    const successRate = successCalls / recentCalls.length * 100;
    const totalTokensUsed = recentCalls.reduce((sum, call) => sum + (call.tokensUsed || 0), 0);
    const averageTokensPerCall = totalTokensUsed / recentCalls.length;
    const callsByService = {};
    recentCalls.forEach((call) => {
      callsByService[call.service] = (callsByService[call.service] || 0) + 1;
    });
    const slowestCalls = recentCalls.sort((a, b) => b.duration - a.duration).slice(0, 10);
    return {
      totalCalls: recentCalls.length,
      averageCallTime,
      successRate,
      callsByService,
      tokensUsed: totalTokensUsed,
      averageTokensPerCall,
      slowestCalls
    };
  }
  clearMetrics() {
    this.metrics = [];
    this.databaseQueries = [];
    this.externalApiCalls = [];
    this.aiServiceCalls = [];
    this.timers.clear();
  }
};
var PrometheusPerformanceMonitor = class {
  logger;
  constructor(logger8) {
    this.logger = logger8;
  }
  startTimer(label) {
    this.logger.debug(`Performance timer started: ${label}`);
    return () => {
      this.logger.debug(`Performance timer stopped: ${label}`);
    };
  }
  recordMetric(metric) {
    this.logger.debug("Performance metric recorded", metric);
  }
  recordDatabaseQuery(query) {
    this.logger.debug("Database query recorded", query);
  }
  recordExternalApiCall(apiCall) {
    this.logger.debug("External API call recorded", apiCall);
  }
  recordAiServiceCall(aiCall) {
    this.logger.debug("AI service call recorded", aiCall);
  }
  async getPerformanceStats() {
    this.logger.debug("Getting performance stats");
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: { average: 0, peak: 0 },
      cpuUsage: { average: 0, peak: 0 },
      topEndpoints: []
    };
  }
  async getSlowEndpoints(threshold) {
    this.logger.debug(`Getting slow endpoints (threshold: ${threshold}ms)`);
    return [];
  }
  async getDatabaseStats() {
    this.logger.debug("Getting database stats");
    return {
      totalQueries: 0,
      averageQueryTime: 0,
      slowQueries: 0,
      queriesByTable: {},
      queriesByOperation: {},
      slowestQueries: []
    };
  }
  async getExternalApiStats() {
    this.logger.debug("Getting external API stats");
    return {
      totalCalls: 0,
      averageCallTime: 0,
      successRate: 0,
      callsByService: {},
      slowestCalls: []
    };
  }
  async getAiServiceStats() {
    this.logger.debug("Getting AI service stats");
    return {
      totalCalls: 0,
      averageCallTime: 0,
      successRate: 0,
      callsByService: {},
      tokensUsed: 0,
      averageTokensPerCall: 0,
      slowestCalls: []
    };
  }
  clearMetrics() {
    this.logger.debug("Performance metrics cleared");
  }
};
function createPerformanceMonitor(logger8) {
  if (config.monitoring.prometheus?.enabled) {
    return new PrometheusPerformanceMonitor(logger8);
  }
  return new MockPerformanceMonitor();
}
function performanceMonitoringMiddleware(performanceMonitor, logger8) {
  return (req, res, next) => {
    const start = Date.now();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    logger8.http(`Request started: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      userAgent: req.get("user-agent"),
      ip: req.ip
    });
    res.on("finish", () => {
      const duration = Date.now() - start;
      const cpuUsageEnd = process.cpuUsage(cpuUsage);
      const metric = {
        timestamp: /* @__PURE__ */ new Date(),
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        responseTime: duration,
        memoryUsage: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: memoryUsage.heapUsed / memoryUsage.heapTotal * 100
        },
        cpuUsage: {
          user: cpuUsageEnd.user,
          system: cpuUsageEnd.system
        },
        databaseQueries: {
          count: 0,
          // This would be populated by database middleware
          totalTime: 0,
          averageTime: 0
        },
        externalApiCalls: {
          count: 0,
          // This would be populated by API middleware
          totalTime: 0,
          averageTime: 0,
          successRate: 100
        },
        aiServiceCalls: {
          count: 0,
          // This would be populated by AI middleware
          totalTime: 0,
          averageTime: 0,
          successRate: 100
        }
      };
      performanceMonitor.recordMetric(metric);
      logger8.performance(`${req.method} ${req.path}`, duration, {
        statusCode: res.statusCode,
        memoryUsage: metric.memoryUsage.percentage,
        cpuUsage: metric.cpuUsage.user + metric.cpuUsage.system
      });
    });
    next();
  };
}
var defaultPerformanceMonitor = createPerformanceMonitor(new Logger("PerformanceMonitor"));

// server/src/middleware/securityEnhanced.ts
import jwt4 from "jsonwebtoken";

// server/src/config/security.ts
import dotenv5 from "dotenv";
dotenv5.config();
var securityConfig2 = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    issuer: process.env.JWT_ISSUER || "aicalorietracker",
    audience: process.env.JWT_AUDIENCE || "aicalorietracker-users",
    algorithm: "HS256",
    notBefore: 0,
    jwtid: void 0,
    subject: void 0,
    noTimestamp: false,
    header: void 0,
    keyid: void 0
  },
  // Session Configuration
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || "86400000"),
    // 24 hours in milliseconds
    rolling: process.env.SESSION_ROLLING === "true",
    secure: process.env.SESSION_SECURE === "true",
    httpOnly: process.env.SESSION_HTTP_ONLY !== "false",
    sameSite: process.env.SESSION_SAME_SITE || "strict",
    domain: process.env.SESSION_DOMAIN || void 0,
    path: process.env.SESSION_PATH || "/",
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || "5"),
    maxInactiveTime: parseInt(process.env.MAX_INACTIVE_TIME || "1800000"),
    // 30 minutes
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || "3600000")
    // 1 hour
  },
  // Rate Limiting Configuration
  rateLimit: {
    api: {
      windowMs: process.env.NODE_ENV !== "production" ? parseInt(process.env.API_RATE_LIMIT_WINDOW || "60000") : parseInt(process.env.API_RATE_LIMIT_WINDOW || "900000"),
      // 15 minutes in prod
      max: process.env.NODE_ENV !== "production" ? parseInt(process.env.API_RATE_LIMIT_MAX || "1000") : parseInt(process.env.API_RATE_LIMIT_MAX || "100"),
      message: process.env.API_RATE_LIMIT_MESSAGE || "Too many API requests, please try again later",
      skip: (req) => {
        return req.path.startsWith("/api/health") || req.path.startsWith("/api/admin") || req.ip === "127.0.0.1" || req.ip === "::1";
      }
    },
    auth: {
      windowMs: process.env.NODE_ENV !== "production" ? parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || "60000") : parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || "900000"),
      // 15 minutes in prod
      max: process.env.NODE_ENV !== "production" ? parseInt(process.env.AUTH_RATE_LIMIT_MAX || "100") : parseInt(process.env.AUTH_RATE_LIMIT_MAX || "5"),
      message: process.env.AUTH_RATE_LIMIT_MESSAGE || "Too many authentication attempts, please try again later"
    },
    upload: {
      windowMs: process.env.NODE_ENV !== "production" ? parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW || "60000") : parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW || "3600000"),
      // 1 hour in prod
      max: process.env.NODE_ENV !== "production" ? parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || "100") : parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || "10"),
      message: process.env.UPLOAD_RATE_LIMIT_MESSAGE || "Too many file uploads, please try again later"
    },
    ai: {
      windowMs: process.env.NODE_ENV !== "production" ? parseInt(process.env.AI_RATE_LIMIT_WINDOW || "60000") : parseInt(process.env.AI_RATE_LIMIT_WINDOW || "3600000"),
      // 1 hour in prod
      max: process.env.NODE_ENV !== "production" ? parseInt(process.env.AI_RATE_LIMIT_MAX || "200") : parseInt(process.env.AI_RATE_LIMIT_MAX || "50"),
      message: process.env.AI_RATE_LIMIT_MESSAGE || "Too many AI service requests, please try again later"
    }
  },
  // Password Configuration
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8"),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== "false",
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== "false",
    requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== "false",
    requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL_CHAR !== "false",
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || "12"),
    maxAttempts: parseInt(process.env.PASSWORD_MAX_ATTEMPTS || "5"),
    lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION || "900000")
    // 15 minutes
  },
  // CORS Configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:4173",
      "http://localhost:5000",
      "http://localhost:5001",
      "https://aical.scanitix.com",
      "https://www.aical.scanitix.com"
    ],
    credentials: process.env.CORS_CREDENTIALS !== "false",
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-API-Key",
      "X-Session-ID",
      "X-CSRF-Token"
    ],
    exposedHeaders: ["X-Total-Count", "X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"],
    maxAge: parseInt(process.env.CORS_MAX_AGE || "86400")
    // 24 hours
  },
  // Security Headers
  headers: {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": process.env.STRICT_TRANSPORT_SECURITY || "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": process.env.CONTENT_SECURITY_POLICY || "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    "Referrer-Policy": process.env.REFERRER_POLICY || "strict-origin-when-cross-origin",
    "Permissions-Policy": process.env.PERMISSIONS_POLICY || "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  },
  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_SIZE || "5242880"),
    // 5MB
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml"
    ],
    allowedExtensions: process.env.UPLOAD_ALLOWED_EXTENSIONS?.split(",") || [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg"
    ]
  },
  // IP Filtering Configuration
  ipFilter: {
    whitelist: process.env.IP_WHITELIST?.split(",") || [],
    blacklist: process.env.IP_BLACKLIST?.split(",") || [],
    enable: process.env.IP_FILTER_ENABLE !== "false"
  },
  // Bot Detection Configuration
  botDetection: {
    enable: process.env.BOT_DETECTION_ENABLE !== "false",
    suspiciousUserAgents: process.env.SUSPICIOUS_USER_AGENTS?.split(",") || [
      "bot",
      "crawler",
      "spider",
      "scraper",
      "curl",
      "wget",
      "python-requests",
      "scrapy",
      "selenium",
      "phantomjs",
      "headless",
      "chrome/90",
      "firefox/88",
      "postman",
      "insomnia",
      "axios",
      "fetch",
      "node-fetch"
    ]
  },
  // Database Security
  database: {
    ssl: process.env.DB_SSL === "true",
    sslRejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000"),
    acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || "60000"),
    timeout: parseInt(process.env.DB_QUERY_TIMEOUT || "60000")
  },
  // Encryption Configuration
  encryption: {
    algorithm: process.env.ENCRYPTION_ALGORITHM || "aes-256-gcm",
    key: process.env.ENCRYPTION_KEY || "your-encryption-key-change-in-production",
    ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || "16"),
    tagLength: parseInt(process.env.ENCRYPTION_TAG_LENGTH || "16")
  },
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableFileLogging: process.env.ENABLE_FILE_LOGGING !== "false",
    logDirectory: process.env.LOG_DIRECTORY || "./logs",
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE || "10485760"),
    // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES || "5"),
    enableConsoleLogging: process.env.ENABLE_CONSOLE_LOGGING !== "false"
  },
  // Monitoring Configuration
  monitoring: {
    enableErrorTracking: process.env.ENABLE_ERROR_TRACKING !== "false",
    enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING !== "false",
    enableSecurityMonitoring: process.env.ENABLE_SECURITY_MONITORING !== "false",
    sentryDsn: process.env.SENTRY_DSN || void 0,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT || "development",
    sentryRelease: process.env.SENTRY_RELEASE || "1.0.0"
  },
  // API Configuration
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || "30000"),
    retries: parseInt(process.env.API_RETRIES || "3"),
    retryDelay: parseInt(process.env.API_RETRY_DELAY || "1000"),
    enableCompression: process.env.API_ENABLE_COMPRESSION !== "false",
    enableRequestLogging: process.env.API_ENABLE_REQUEST_LOGGING !== "false"
  },
  // Mobile App Configuration
  mobile: {
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== "false",
    pushNotificationService: process.env.PUSH_NOTIFICATION_SERVICE || "fcm",
    enableOfflineMode: process.env.ENABLE_OFFLINE_MODE !== "false",
    enableBiometricAuth: process.env.ENABLE_BIOMETRIC_AUTH !== "false"
  }
};

// server/src/lib/securityUtils.ts
var logger5 = new Logger("SecurityUtils");
var getClientIp = (req) => {
  return req.ip || "unknown";
};
var logSecurityEvent = (event) => {
  if (process.env.NODE_ENV !== "production") return;
  const logEntry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    type: event.type,
    level: event.level,
    message: event.message,
    details: event.details || {},
    userId: event.userId || "anonymous",
    ip: event.ip || "unknown",
    userAgent: event.userAgent || "unknown",
    endpoint: event.endpoint || "unknown",
    environment: process.env.NODE_ENV || "development"
  };
  console.log("[Security Event]", JSON.stringify(logEntry, null, 2));
  switch (event.type) {
    case "AUTH_ATTEMPT":
      logger5.info(`Authentication attempt: ${event.message}`, event.details);
      break;
    case "TOKEN_VALIDATION":
      logger5.info(`Token validation: ${event.message}`, event.details);
      break;
    case "SECURITY_VIOLATION":
      logger5.warn(`Security violation: ${event.message}`, event.details);
      break;
    case "SUSPICIOUS_ACTIVITY":
      logger5.warn(`Suspicious activity: ${event.message}`, event.details);
      break;
  }
};
var validateRequest = (req) => {
  const errors = [];
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    /('|--|;|\/\*|\*\/|@@|xp_|sp_|exec\s+)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi
  ];
  const checkForSQL = (value) => {
    if (typeof value === "string") {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForSQL);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkForSQL);
    }
    return false;
  };
  if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
    errors.push("Potential SQL injection detected");
  }
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];
  const checkForXSS = (value) => {
    if (typeof value === "string") {
      return xssPatterns.some((pattern) => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkForXSS);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkForXSS);
    }
    return false;
  };
  if (checkForXSS(req.body) || checkForXSS(req.query) || checkForXSS(req.params)) {
    errors.push("Potential XSS attack detected");
  }
  const checkPathTraversal = (value) => {
    if (typeof value === "string") {
      return /\.\.\//g.test(value) || /\/etc\/passwd/g.test(value) || /windows\\system32/gi.test(value);
    }
    return false;
  };
  if (checkPathTraversal(req.body) || checkPathTraversal(req.query) || checkPathTraversal(req.params)) {
    errors.push("Potential path traversal attack detected");
  }
  const checkCommandInjection = (value) => {
    if (typeof value === "string") {
      return /;|&&|\|\|/g.test(value);
    }
    return false;
  };
  if (checkCommandInjection(req.body) || checkCommandInjection(req.query) || checkCommandInjection(req.params)) {
    errors.push("Potential command injection detected");
  }
  if (req.body && req.body.fileType) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(req.body.fileType)) {
      errors.push(`Invalid file type: ${req.body.fileType}`);
    }
  }
  return {
    valid: errors.length === 0,
    errors
  };
};
var EnhancedRateLimiter = class {
  requests = /* @__PURE__ */ new Map();
  maxRequests;
  windowMs;
  blockDuration;
  constructor(maxRequests = 100, windowMs = 15 * 60 * 1e3, blockDuration = 60 * 60 * 1e3) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDuration = blockDuration;
  }
  isAllowed(identifier) {
    const now = Date.now();
    const entry = this.requests.get(identifier);
    if (entry && now - entry.lastRequest < this.blockDuration) {
      return {
        allowed: false,
        remaining: 0,
        blocked: true,
        blockTime: entry.lastRequest + this.blockDuration - now
      };
    }
    if (entry && now - entry.lastRequest > this.windowMs) {
      this.requests.delete(identifier);
      return { allowed: true, remaining: this.maxRequests, blocked: false };
    }
    if (!entry) {
      this.requests.set(identifier, {
        count: 1,
        firstRequest: now,
        lastRequest: now
      });
      return { allowed: true, remaining: this.maxRequests - 1, blocked: false };
    }
    if (entry.count >= this.maxRequests) {
      this.requests.set(identifier, {
        count: entry.count + 1,
        firstRequest: entry.firstRequest,
        lastRequest: now
      });
      return {
        allowed: false,
        remaining: 0,
        blocked: true,
        blockTime: this.blockDuration
      };
    }
    entry.count++;
    entry.lastRequest = now;
    this.requests.set(identifier, entry);
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      blocked: false
    };
  }
  reset(identifier) {
    this.requests.delete(identifier);
  }
};
var apiRateLimiter3 = new EnhancedRateLimiter(
  securityConfig2.rateLimit?.api?.max || 100,
  securityConfig2.rateLimit?.api?.windowMs || 15 * 60 * 1e3
);
var authRateLimiter3 = new EnhancedRateLimiter(
  securityConfig2.rateLimit?.auth?.max || 5,
  securityConfig2.rateLimit?.auth?.windowMs || 15 * 60 * 1e3,
  30 * 60 * 1e3
  // 30 minute block for auth failures
);

// server/src/middleware/securityEnhanced.ts
var logger6 = new Logger("SecurityEnhanced");
var rateLimitStore2 = /* @__PURE__ */ new Map();
var createRateLimiter2 = (windowMs, max, message) => {
  return (req, res, next) => {
    const clientIp = getClientIp(req);
    const now = Date.now();
    const expiredEntries = [];
    rateLimitStore2.forEach((entry2, key) => {
      if (now > entry2.resetTime) {
        expiredEntries.push(key);
      }
    });
    expiredEntries.forEach((key) => rateLimitStore2.delete(key));
    let entry = rateLimitStore2.get(clientIp);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
        firstRequest: now
      };
      rateLimitStore2.set(clientIp, entry);
    } else {
      entry.count++;
    }
    if (entry.count > max) {
      logger6.warn(`Rate limit exceeded for IP: ${clientIp}, Count: ${entry.count}`);
      logSecurityEvent({
        type: "SECURITY_VIOLATION",
        level: "WARNING",
        message: "Rate limit exceeded",
        details: { ip: clientIp, count: entry.count, limit: max },
        ip: clientIp,
        userAgent: req.get("User-Agent"),
        endpoint: req.path
      });
      return res.status(429).json({
        success: false,
        error: message,
        code: "RATE_LIMIT_EXCEEDED",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        retryAfter: Math.ceil((entry.resetTime - now) / 1e3),
        limit: max,
        remaining: 0
      });
    }
    res.set({
      "X-RateLimit-Limit": max.toString(),
      "X-RateLimit-Remaining": (max - entry.count).toString(),
      "X-RateLimit-Reset": entry.resetTime.toString(),
      "X-RateLimit-Window": windowMs.toString()
    });
    next();
  };
};
var sessionSecurity = (req, res, next) => {
  const sessionId = req.headers["x-session-id"];
  const userAgent = req.get("User-Agent") || "";
  const clientIp = getClientIp(req);
  if (sessionId) {
    logger6.debug("Session validation for:", sessionId);
  }
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; worker-src 'self'; child-src 'self'; frame-ancestors 'none'; form-action 'self'; manifest-src 'self'; base-uri 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  next();
};
var inputValidation = (req, res, next) => {
  const validation = validateRequest(req);
  if (!validation.valid) {
    logger6.warn("Request validation failed:", validation.errors);
    logSecurityEvent({
      type: "SECURITY_VIOLATION",
      level: "WARNING",
      message: "Request validation failed",
      details: { errors: validation.errors, method: req.method, url: req.url },
      ip: getClientIp(req),
      userAgent: req.get("User-Agent"),
      endpoint: req.path
    });
    return res.status(400).json({
      success: false,
      error: "Invalid request format",
      code: "INVALID_REQUEST",
      details: validation.errors
    });
  }
  const sanitize = (value) => {
    if (typeof value === "string") {
      return value.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"').replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
    }
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    if (typeof value === "object" && value !== null) {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitize(value[key]);
      }
      return sanitized;
    }
    return value;
  };
  if (req.body) {
    req.body = sanitize(req.body);
  }
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};
var sqlInjectionProtection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    /('|--|;|\/\*|\*\/|@@|xp_|sp_|exec\s+)/gi,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
    /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
    /(\b(OR|AND)\s+\w+\s*LIKE\s*\w+)/gi,
    /(\b(OR|AND)\s+\w+\s*IN\s*\([^)]+\))/gi,
    /(\b(OR|AND)\s+\w+\s*BETWEEN\s+\w+\s+AND\s+\w+)/gi
  ];
  const checkValue = (value) => {
    if (typeof value === "string") {
      return sqlPatterns.some((pattern) => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };
  if (checkValue(req.body) || checkValue(req.query) || checkValue(req.params)) {
    logger6.warn("SQL injection attempt detected from:", getClientIp(req));
    throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "INVALID_INPUT" /* INVALID_INPUT */, "Invalid request format");
  }
  next();
};
var xssProtection = (req, res, next) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*rel\s*=\s*"stylesheet"[^>]*>/gi,
    /<meta[^>]*http-equiv[^>]*refresh[^>]*>/gi,
    /<form[^>]*>.*?<\/form>/gi,
    /<input[^>]*type\s*=\s*"hidden"[^>]*>/gi
  ];
  const checkXSS = (value) => {
    if (typeof value === "string") {
      return xssPatterns.some((pattern) => pattern.test(value));
    }
    if (Array.isArray(value)) {
      return value.some(checkXSS);
    }
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(checkXSS);
    }
    return false;
  };
  if (checkXSS(req.body) || checkXSS(req.query) || checkXSS(req.params)) {
    logger6.warn("XSS attempt detected from:", getClientIp(req));
    throw new AppError("VALIDATION_ERROR" /* VALIDATION_ERROR */, "INVALID_INPUT" /* INVALID_INPUT */, "Invalid request format");
  }
  next();
};
var csrfProtection = (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE" || req.method === "PATCH") {
    const bypassPaths = ["/api/auth/", "/api/onboarding/"];
    if (bypassPaths.some((path6) => req.path.startsWith(path6))) {
      logger6.debug("CSRF protection skipped for auth/onboarding endpoint:", req.path);
      return next();
    }
    if (req.hostname === "localhost" || getClientIp(req) === "127.0.0.1") {
      logger6.debug("CSRF protection skipped for localhost testing:", req.path);
      return next();
    }
    const csrfToken = req.headers["x-csrf-token"];
    const sessionToken = req.headers["x-session-token"];
    if (!csrfToken || !sessionToken) {
      logger6.warn("CSRF protection failed - missing tokens from:", getClientIp(req));
      throw new AuthorizationError("CSRF protection failed");
    }
    if (csrfToken !== sessionToken) {
      logger6.warn("CSRF token mismatch from:", getClientIp(req));
      throw new AuthorizationError("Invalid CSRF token");
    }
  }
  next();
};
var ipFilter = (req, res, next) => {
  const clientIp = getClientIp(req);
  const whitelist = process.env.IP_WHITELIST?.split(",") || [];
  const blacklist = process.env.IP_BLACKLIST?.split(",") || [];
  if (blacklist.length > 0 && blacklist.includes(clientIp)) {
    logger6.warn("Blocked blacklisted IP:", clientIp);
    throw new AuthorizationError("Access denied");
  }
  if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
    logger6.warn("Blocked non-whitelisted IP:", clientIp);
    throw new AuthorizationError("Access denied");
  }
  next();
};
var botDetection = (req, res, next) => {
  const userAgent = req.get("User-Agent") || "";
  const suspiciousUserAgents = [
    "bot",
    "crawler",
    "spider",
    "scraper",
    "curl",
    "wget",
    "python-requests",
    "scrapy",
    "selenium",
    "phantomjs",
    "headless",
    "chrome/90",
    "firefox/88",
    "postman",
    "insomnia",
    "axios",
    "fetch",
    "node-fetch"
  ];
  const isBot = suspiciousUserAgents.some(
    (pattern) => userAgent.toLowerCase().includes(pattern.toLowerCase())
  );
  if (isBot) {
    logger6.warn(`Bot detected: ${userAgent} from IP: ${getClientIp(req)}`);
  }
  next();
};
var securityMonitoring = (req, res, next) => {
  const startTime = Date.now();
  const suspiciousPatterns = {
    sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|CREATE|ALTER|TRUNCATE)\b)/gi,
    xss: /<script[^>]*>.*?<\/script>/gi,
    pathTraversal: /\.\.\//g,
    commandInjection: /;|&&|\|\|/g,
    directoryTraversal: /\/etc\/passwd/g,
    windowsSystem: /windows\\system32/gi,
    dataUri: /data:text\/html/gi
  };
  const checkSuspicious = (input) => {
    const detected = [];
    for (const [name, pattern] of Object.entries(suspiciousPatterns)) {
      if (pattern.test(input)) {
        detected.push(name);
      }
    }
    return detected;
  };
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);
    const suspicious = checkSuspicious(bodyStr);
    if (suspicious.length > 0) {
      logger6.warn(`Suspicious activity detected in body from ${getClientIp(req)}:`, suspicious);
      logSecurityEvent({
        type: "SUSPICIOUS_ACTIVITY",
        level: "WARNING",
        message: "Suspicious activity detected in request body",
        details: { patterns: suspicious, method: req.method, url: req.url },
        ip: getClientIp(req),
        userAgent: req.get("User-Agent"),
        endpoint: req.path
      });
    }
  }
  if (req.query) {
    const queryStr = JSON.stringify(req.query);
    const suspicious = checkSuspicious(queryStr);
    if (suspicious.length > 0) {
      logger6.warn(`Suspicious activity detected in query from ${getClientIp(req)}:`, suspicious);
      logSecurityEvent({
        type: "SUSPICIOUS_ACTIVITY",
        level: "WARNING",
        message: "Suspicious activity detected in query parameters",
        details: { patterns: suspicious, method: req.method, url: req.url },
        ip: getClientIp(req),
        userAgent: req.get("User-Agent"),
        endpoint: req.path
      });
    }
  }
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    if (duration > 1e4) {
      logger6.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
      logSecurityEvent({
        type: "SUSPICIOUS_ACTIVITY",
        level: "WARNING",
        message: "Slow request detected",
        details: { method: req.method, url: req.url, duration },
        ip: getClientIp(req),
        userAgent: req.get("User-Agent"),
        endpoint: req.path
      });
    }
    if (req.path.includes("/login") || req.path.includes("/auth")) {
      logSecurityEvent({
        type: "AUTH_ATTEMPT",
        level: res.statusCode === 200 ? "INFO" : "WARNING",
        message: `Authentication attempt ${res.statusCode === 200 ? "succeeded" : "failed"}`,
        details: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          userAgent: req.get("User-Agent")
        },
        ip: getClientIp(req),
        userAgent: req.get("User-Agent"),
        endpoint: req.path
      });
    }
  });
  next();
};
var enhancedSecurityMiddleware = [
  securityMonitoring,
  ipFilter,
  botDetection,
  inputValidation,
  sqlInjectionProtection,
  xssProtection,
  csrfProtection,
  sessionSecurity
];
var rateLimiters = {
  api: createRateLimiter2(
    securityConfig2.rateLimit.api.windowMs,
    securityConfig2.rateLimit.api.max,
    securityConfig2.rateLimit.api.message
  ),
  auth: createRateLimiter2(
    securityConfig2.rateLimit.auth.windowMs,
    securityConfig2.rateLimit.auth.max,
    securityConfig2.rateLimit.auth.message
  ),
  upload: createRateLimiter2(
    securityConfig2.rateLimit.upload.windowMs,
    securityConfig2.rateLimit.upload.max,
    securityConfig2.rateLimit.upload.message
  ),
  ai: createRateLimiter2(
    securityConfig2.rateLimit.ai.windowMs,
    securityConfig2.rateLimit.ai.max,
    securityConfig2.rateLimit.ai.message
  )
};

// server/index.ts
init_config();
init_imageStorageService();
import { createServer as createServer2 } from "http";
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path5.dirname(__filename4);
var envCandidates = [
  path5.resolve(__dirname4, "../server/.env"),
  // when running from dist/
  path5.resolve(__dirname4, ".env"),
  // if .env is alongside compiled file
  path5.resolve(process.cwd(), ".env")
  // project root
];
for (const envPath of envCandidates) {
  dotenv6.config({ path: envPath });
}
function log2(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
var app = express3();
app.set("trust proxy", true);
app.use((req, res, next) => {
  console.log("[PRE-PARSING] Headers:", req.headers);
  console.log("[PRE-PARSING] Raw headers:", req.rawHeaders);
  next();
});
app.use(express3.json({
  limit: "50mb",
  strict: false,
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString(encoding || "utf8"));
    } catch (e) {
    }
  }
}));
app.use(express3.urlencoded({
  extended: true,
  limit: "50mb",
  parameterLimit: 1e4,
  verify: (req, res, buf, encoding) => {
    try {
      const str = buf.toString(encoding || "utf8");
      if (str && str.includes("=")) {
        const urlSearchParams = new URLSearchParams(str);
        urlSearchParams.toString();
      }
    } catch (e) {
    }
  }
}));
app.use((req, res, next) => {
  const contentType = req.get("Content-Type") || "unknown";
  console.log("[POST-PARSING] Content-Type:", contentType);
  console.log("[POST-PARSING] Body:", req.body);
  console.log("[POST-PARSING] Body type:", typeof req.body);
  console.log("[POST-PARSING] Body keys:", Object.keys(req.body || {}));
  next();
});
app.use((req, res, next) => {
  const contentType = req.get("Content-Type");
  if (contentType) {
    if (contentType.includes("application/json") && typeof req.body !== "object") {
      console.warn("[CONTENT-TYPE-WARNING] Content-Type indicates JSON but body is not an object");
    } else if (contentType.includes("application/x-www-form-urlencoded") && typeof req.body !== "object") {
      console.warn("[CONTENT-TYPE-WARNING] Content-Type indicates form data but body is not an object");
    }
  }
  next();
});
app.use(enforceHttps);
app.use("/uploads", express3.static(path5.join(__dirname4, "..", "uploads"), {
  maxAge: "1y",
  // Cache for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path6) => {
    if (path6.endsWith(".jpg") || path6.endsWith(".jpeg")) {
      res.setHeader("Content-Type", "image/jpeg");
    } else if (path6.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    } else if (path6.endsWith(".webp")) {
      res.setHeader("Content-Type", "image/webp");
    }
  }
}));
console.log("[SERVER] Static file serving configured for uploads directory");
console.log("[SERVER] Registering routes...");
console.log("[SERVER] NODE_ENV:", process.env.NODE_ENV);
console.log("[SERVER] Environment is development:", process.env.NODE_ENV === "development");
registerRoutes(app);
console.log("[SERVER] Routes registered");
app.use(enhancedSecurityMiddleware);
app.use(rateLimiters.api);
app.use(createTimeoutMiddleware({ responseTimeout: 12e4, requestTimeout: 3e5 }));
var logger7 = new Logger("Performance");
app.use(performanceMonitoringMiddleware(defaultPerformanceMonitor, logger7));
app.use("/api/health", (req, res, next) => {
  next();
}, health_default);
app.get("/api/test", (req, res) => {
  log2("=== TEST ENDPOINT HIT ===");
  log2("Request received from mobile app");
  log2("Sending test response");
  res.json({
    success: true,
    message: "Mobile app test endpoint working",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    server: "AI Calorie Tracker Backend",
    version: "1.0.0"
  });
});
app.post("/api/test-form-data", (req, res) => {
  log2("=== FORM DATA TEST ENDPOINT HIT ===");
  log2("Content-Type:", req.get("Content-Type"));
  log2("Parsed body:", req.body);
  log2("Body type:", typeof req.body);
  log2("Body keys:", Object.keys(req.body || {}).join(", "));
  res.json({
    success: true,
    message: "Form data test endpoint working",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    receivedBody: req.body,
    bodyType: typeof req.body,
    bodyKeys: Object.keys(req.body || {}),
    contentType: req.get("Content-Type")
  });
});
app.get("/api/connectivity-test", (req, res) => {
  log2("=== CONNECTIVITY TEST ENDPOINT HIT ===");
  log2("Request received from mobile app");
  log2("Sending connectivity test response");
  res.json({
    success: true,
    message: "Connectivity test successful",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    server: "AI Calorie Tracker Backend",
    version: "1.0.0",
    ip: req.ip,
    headers: {
      "user-agent": req.get("User-Agent"),
      "x-forwarded-for": req.get("X-Forwarded-For"),
      "x-real-ip": req.get("X-Real-IP")
    }
  });
});
app.get("/api/health/db", async (req, res) => {
  log2("=== DATABASE HEALTH CHECK ENDPOINT HIT ===");
  try {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage_provider(), storage_provider_exports));
    const testContent = await storage2.getSiteContent("test_key");
    log2("Database health check successful");
    res.json({
      success: true,
      message: "Database health check passed",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      storageType: storage2.constructor.name,
      testContent
    });
  } catch (error) {
    log2("Database health check failed:", error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: "Database health check failed",
      error: error instanceof Error ? error.message : String(error),
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
});
app.use("/api/*", (req, res) => {
  console.log(`[API-404] API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl
  });
});
app.get("/api/public/connectivity-test", (req, res) => {
  log2("=== PUBLIC CONNECTIVITY TEST ENDPOINT HIT ===");
  log2("Request received from mobile app");
  log2("Sending connectivity test response");
  res.json({
    success: true,
    message: "Public connectivity test successful",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    server: "AI Calorie Tracker Backend",
    version: "1.0.0",
    ip: req.ip,
    headers: {
      "user-agent": req.get("User-Agent"),
      "x-forwarded-for": req.get("X-Forwarded-For"),
      "x-real-ip": req.get("X-Real-IP")
    }
  });
});
app.use("/api/*", (req, res) => {
  console.log(`[API-404] API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl
  });
});
app.use("/api/auth/refresh", sessionMiddleware, validateSession, refreshSession);
errorTrackingService.installGlobalHandlers();
app.use(securityAuditMiddleware);
app.use((req, res, next) => {
  const start = Date.now();
  const path6 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path6.startsWith("/api")) {
      log2(`=== API RESPONSE DEBUG ===`);
      log2(`Method: ${req.method}`);
      log2(`Path: ${path6}`);
      log2(`Status: ${res.statusCode}`);
      log2(`Duration: ${duration}ms`);
      log2(`Content-Type: ${res.get("content-type")}`);
      log2(`Content-Length: ${res.get("content-length")}`);
      if (capturedJsonResponse) {
        log2(`Response Data Type: ${typeof capturedJsonResponse}`);
        log2(`Response Data Size: ${JSON.stringify(capturedJsonResponse).length} chars`);
        log2(`Response Data: ${JSON.stringify(capturedJsonResponse).substring(0, 200)}${JSON.stringify(capturedJsonResponse).length > 200 ? "..." : ""}`);
      } else {
        log2(`No JSON response captured`);
      }
      log2(`=========================`);
      let logLine = `${req.method} ${path6} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log2(logLine);
    }
  });
  next();
});
var serverInstance;
process.on("SIGTERM", async () => {
  log2("SIGTERM received, shutting down gracefully");
  await errorTrackingService.flush();
  if (serverInstance) {
    serverInstance.close(() => {
      log2("Process terminated");
      process.exit(0);
    });
  }
});
process.on("SIGINT", async () => {
  log2("SIGINT received, shutting down gracefully");
  await errorTrackingService.flush();
  if (serverInstance) {
    serverInstance.close(() => {
      log2("Process terminated");
      process.exit(0);
    });
  }
});
(async () => {
  let server = createServer2(app);
  if (process.env.NODE_ENV === "development") {
    console.log("[SERVER] Development mode: Express server running on port 3002 for API routes");
    console.log("[SERVER] Vite dev server running on port 3000 for frontend with API proxy");
  } else {
    const { serveStatic: serveStatic2 } = await Promise.resolve().then(() => (init_vite(), vite_exports));
    serveStatic2(app);
    console.log("[SERVER] Production mode: Using static file serving");
  }
  try {
    await imageStorageService.initialize();
    console.log("[SERVER] Image storage service initialized successfully");
  } catch (error) {
    console.error("[SERVER] Failed to initialize image storage service:", error);
  }
  app.use(errorHandler);
  const port = process.env.PORT || PORT;
  const host = "0.0.0.0";
  console.log(`[SERVER] Attempting to start server on ${host}:${port}`);
  console.log(`[SERVER] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[SERVER] Platform: ${process.platform}`);
  server.maxConnections = 100;
  server.timeout = 12e4;
  server.keepAliveTimeout = 125e3;
  server.headersTimeout = 13e4;
  try {
    serverInstance = server.listen({
      port,
      host
      // Removed reusePort as it's not supported on Windows
    }, () => {
      log2(`[SERVER] Server successfully started and listening on ${host}:${port}`);
    });
    serverInstance.on("error", (error) => {
      console.error(`[SERVER] Server listen error:`, error);
      console.error(`[SERVER] Error code: ${error.code}`);
      console.error(`[SERVER] Error message: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`[SERVER] Failed to start server:`, error);
    console.error(`[SERVER] Error details:`, error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
})();
export {
  app
};
