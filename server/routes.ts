import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-provider";
import { setupAuth } from "./auth";
import { analyzeFoodImage, getNutritionTips, getSmartMealSuggestions } from "./openai";
import { analyzeMultiFoodImage } from "./openai";
import { aiService } from "./ai-service";
import { insertMealAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { getNutritionCoachReply } from "./openai";

// Initialize Stripe client if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil" // Use the version expected by the installed Stripe library
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Protected route middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Get meal analyses for the current user
  app.get("/api/meal-analyses", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const analyses = await storage.getMealAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching meal analyses:", error);
      res.status(500).json({ message: "Failed to fetch meal analyses" });
    }
  });

  // Get a specific meal analysis
  app.get("/api/meal-analyses/:id", isAuthenticated, async (req, res) => {
    try {
      const analysisId = parseInt(req.params.id);
      if (isNaN(analysisId)) {
        return res.status(400).json({ message: "Invalid analysis ID" });
      }

      const analysis = await storage.getMealAnalysis(analysisId);

      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (analysis.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(analysis);
    } catch (error) {
      console.error("Error fetching meal analysis:", error);
      res.status(500).json({ message: "Failed to fetch meal analysis" });
    }
  });

  // Analyze complex meal with multiple food items
  app.post("/api/analyze-complex-meal", isAuthenticated, async (req, res) => {
    try {
      const requestSchema = z.object({
        images: z.array(z.string()).min(1).max(10)
      });

      const validatedData = requestSchema.parse(req.body);
      const userId = req.user!.id;

      // Process each image
      const analysisResults = [];
      
      for (const imageData of validatedData.images) {
        // Remove data URL prefix if present
        const base64Data = imageData.includes('base64,')
          ? imageData.split('base64,')[1]
          : imageData;

        // Analyze the food image using configured AI service
        const analysis = await aiService.analyzeMultiFoodImage(base64Data);
        analysisResults.push(analysis);
      }

      // Combine results
      const combinedAnalysis = {
        totalCalories: analysisResults.reduce((sum, item) => sum + item.calories, 0),
        totalProtein: analysisResults.reduce((sum, item) => sum + item.protein, 0),
        totalCarbs: analysisResults.reduce((sum, item) => sum + item.carbs, 0),
        totalFat: analysisResults.reduce((sum, item) => sum + item.fat, 0),
        foods: analysisResults,
        mealScore: calculateMealScore(analysisResults),
        nutritionalBalance: calculateNutritionalBalance(analysisResults)
      };

      // Create a meal analysis record
      const mealAnalysis = await storage.createMealAnalysis({
        userId,
        foodName: `Complex Meal (${analysisResults.length} items)`,
        calories: combinedAnalysis.totalCalories,
        protein: combinedAnalysis.totalProtein,
        carbs: combinedAnalysis.totalCarbs,
        fat: combinedAnalysis.totalFat,
        fiber: analysisResults.reduce((sum, item) => sum + (item.fiber || 0), 0),
        imageData: validatedData.images[0], // Store first image only
        // Store complex meal metadata
        metadata: JSON.stringify({
          mealScore: combinedAnalysis.mealScore,
          nutritionalBalance: combinedAnalysis.nutritionalBalance,
          foodItems: analysisResults.length,
          isComplexMeal: true,
          referenceObject: analysisResults[0]?.referenceObject
        })
      });

      res.status(201).json(mealAnalysis);
    } catch (error) {
      console.error("Error analyzing complex meal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze complex meal" });
      }
    }
  });

  // Demo route - Analyze food image without authentication
  app.post("/api/demo-analyze", async (req, res) => {
    try {
      const requestSchema = z.object({
        imageData: z.string()
      });

      const validatedData = requestSchema.parse(req.body);

      // Remove data URL prefix if present
      const base64Data = validatedData.imageData.includes('base64,')
        ? validatedData.imageData.split('base64,')[1]
        : validatedData.imageData;

      // Analyze the food image using configured AI service
      const analysis = await aiService.analyzeFoodImage(base64Data);

      // Return the analysis but don't save it
      res.status(200).json(analysis);
    } catch (error) {
      console.error("Error analyzing food in demo:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze food" });
      }
    }
  });

  // Analyze food image and create meal analysis
  app.post("/api/analyze-food", isAuthenticated, async (req, res) => {
    try {
      const requestSchema = z.object({
        imageData: z.string()
      });

      const validatedData = requestSchema.parse(req.body);
      const userId = req.user!.id;

      // Remove data URL prefix if present
      const base64Data = validatedData.imageData.includes('base64,')
        ? validatedData.imageData.split('base64,')[1]
        : validatedData.imageData;

      // Analyze the food image using configured AI service
      const analysis = await aiService.analyzeFoodImage(base64Data);

      // Create a meal analysis record
      const mealAnalysis = await storage.createMealAnalysis({
        userId,
        ...analysis,
        imageData: validatedData.imageData
      });

      res.status(201).json(mealAnalysis);
    } catch (error) {
      console.error("Error analyzing food:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to analyze food" });
      }
    }
  });

  // Get weekly stats for the current user
  app.get("/api/weekly-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const medicalCondition = req.query.medicalCondition as string | undefined;
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

  // Generate meal plan
  app.post("/api/meal-plan", isAuthenticated, async (req, res) => {
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

  // Get nutrition tips  
  app.get("/api/nutrition-tips", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const tips = await getNutritionTips(userId);
      res.json({ tips });
    } catch (error) {
      console.error("Error fetching nutrition tips:", error);
      res.status(500).json({ message: "Failed to fetch nutrition tips" });
    }
  });

  // --- Smart Meal Suggestions Endpoint ---
  app.get("/api/smart-meal-suggestions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      // Optionally, you could pass recent meal analyses for more context
      const suggestions = await getSmartMealSuggestions(userId);
      res.json({ suggestions });
    } catch (error) {
      console.error("Error getting smart meal suggestions:", error);
      res.status(500).json({ message: "Failed to get meal suggestions" });
    }
  });

  // Stripe payment integration
  if (stripe) {
    // Create a payment intent
    app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
      try {
        const { amount, currency = "usd" } = req.body;

        if (!amount) {
          return res.status(400).json({ message: "Amount is required" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          metadata: {
            userId: req.user!.id.toString(),
            username: req.user!.username
          },
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({ message: error.message || "Failed to create payment intent" });
      }
    });

    // Create a subscription
    app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
      try {
        const { priceId, billingInterval = "monthly" } = req.body;

        if (!priceId) {
          return res.status(400).json({ message: "Price ID is required" });
        }

        // Get or create a Stripe customer
        let customerId = req.user!.stripeCustomerId;

        if (!customerId) {
          const customer = await stripe.customers.create({
            email: req.user!.email || undefined,
            name: `${req.user!.firstName} ${req.user!.lastName}`,
            metadata: {
              userId: req.user!.id.toString()
            }
          });

          customerId = customer.id;

          // Update the user with the customer ID
          await storage.updateUserStripeInfo(req.user!.id, { stripeCustomerId: customerId });
        }

        // Create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        });

        // Update user with subscription information
        await storage.updateUserStripeInfo(req.user!.id, {
          stripeSubscriptionId: subscription.id,
          subscriptionType: billingInterval,
          subscriptionStatus: subscription.status
        });

        // Get payment intent for client
        // @ts-ignore - Stripe types don't properly handle expanded fields
        const invoice = subscription.latest_invoice;
        // @ts-ignore - Stripe types don't properly handle expanded fields
        const paymentIntent = invoice.payment_intent;

        res.json({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret
        });
      } catch (error: any) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: error.message || "Failed to create subscription" });
      }
    });

    // Get subscription status
    app.get("/api/subscription", isAuthenticated, async (req, res) => {
      try {
        const user = req.user!;

        if (!user.stripeSubscriptionId) {
          return res.json({ active: false });
        }

        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        // Update local subscription status
        await storage.updateUserStripeInfo(user.id, {
          subscriptionStatus: subscription.status,
          isPremium: subscription.status === 'active'
        });

        res.json({
          active: subscription.status === 'active',
          status: subscription.status,
          // @ts-ignore - Stripe types don't properly handle these fields
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          // @ts-ignore - Stripe types don't properly handle these fields
          plan: subscription.items.data[0]?.plan.nickname || 'Unknown plan'
        });
      } catch (error: any) {
        console.error("Error fetching subscription:", error);
        res.status(500).json({ message: error.message || "Failed to fetch subscription" });
      }
    });

    // Cancel subscription
    app.post("/api/cancel-subscription", isAuthenticated, async (req, res) => {
      try {
        const user = req.user!;

        if (!user.stripeSubscriptionId) {
          return res.status(400).json({ message: "No active subscription" });
        }

        const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true
        });

        // Update subscription status in our database
        await storage.updateUserStripeInfo(user.id, {
          subscriptionStatus: 'canceling'
        });

        res.json({
          message: "Subscription will be canceled at the end of the billing period",
          // @ts-ignore - Stripe types don't properly handle these fields
          cancelAt: new Date(subscription.cancel_at! * 1000)
        });
      } catch (error: any) {
        console.error("Error canceling subscription:", error);
        res.status(500).json({ message: error.message || "Failed to cancel subscription" });
      }
    });
  }

  // --- Admin: Site Content Management ---
  app.get("/api/admin/content/:key", isAuthenticated, async (req, res) => {
    // TODO: Add admin check
    try {
      const key = req.params.key;
      const value = await storage.getSiteContent(key);
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/admin/content/:key", isAuthenticated, async (req, res) => {
    // TODO: Add admin check
    try {
      const key = req.params.key;
      const value = req.body.value;
      await storage.updateSiteContent(key, value);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update content" });
    }
  });

  // --- Personalized Nutrition Goals Endpoints ---
  app.get("/api/user/goals", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      res.json(user.nutritionGoals || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition goals" });
    }
  });
  app.post("/api/user/goals", isAuthenticated, async (req, res) => {
    try {
      const { calories, protein, carbs, fat } = req.body;
      await storage.updateUserNutritionGoals(req.user!.id, { calories, protein, carbs, fat });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update nutrition goals" });
    }
  });

  // Nutrition Coach Chatbot endpoint
  app.post("/api/nutrition-coach-chat", isAuthenticated, async (req, res) => {
    try {
      const { messages } = req.body;
      // Use OpenAI-powered nutrition coach
      const reply = await getNutritionCoachReply(messages, req.user!.id);
      res.json({ reply });
    } catch (error) {
      console.error("Error in nutrition coach chat:", error);
      res.status(500).json({ reply: "Sorry, I couldn't process your request." });
    }
  });

  // Onboarding completion endpoint
  app.post("/api/onboarding/complete", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const onboardingData = req.body;

      // Update user with onboarding data
      await storage.updateUserOnboarding(userId, {
        age: onboardingData.age,
        gender: onboardingData.gender,
        height: onboardingData.height,
        weight: onboardingData.weight,
        activityLevel: onboardingData.activityLevel,
        primaryGoal: onboardingData.primaryGoal,
        targetWeight: onboardingData.targetWeight,
        timeline: onboardingData.timeline,
        dietaryPreferences: JSON.stringify(onboardingData.dietaryPreferences || []),
        allergies: JSON.stringify(onboardingData.allergies || []),
        aiMealSuggestions: onboardingData.aiMealSuggestions !== undefined ? onboardingData.aiMealSuggestions : true,
        aiChatAssistantName: onboardingData.aiChatAssistantName || 'NutriBot',
        notificationsEnabled: onboardingData.notificationsEnabled !== undefined ? onboardingData.notificationsEnabled : true,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
      });

      // Calculate and create initial nutrition goals
      const bmr = calculateBMR(onboardingData.weight, onboardingData.height, onboardingData.age, onboardingData.gender);
      const activityMultiplier = getActivityMultiplier(onboardingData.activityLevel);
      const tdee = bmr * activityMultiplier;
      
      let dailyCalories = tdee;
      if (onboardingData.primaryGoal === 'lose-weight') {
        dailyCalories = tdee - 500; // 500 calorie deficit for weight loss
      } else if (onboardingData.primaryGoal === 'gain-muscle') {
        dailyCalories = tdee + 300; // 300 calorie surplus for muscle gain
      }

      // Create nutrition goals
      await storage.createNutritionGoals(userId, {
        dailyCalories: Math.round(dailyCalories),
        calories: Math.round(dailyCalories),
        protein: Math.round(onboardingData.weight * 2.2), // 2.2g per kg body weight
        carbs: Math.round((dailyCalories * 0.45) / 4), // 45% of calories from carbs
        fat: Math.round((dailyCalories * 0.30) / 9), // 30% of calories from fat
        weight: onboardingData.weight,
        weeklyWorkouts: getWeeklyWorkoutsFromActivity(onboardingData.activityLevel),
        waterIntake: 8, // 8 glasses per day default
      });

      res.json({ success: true, message: "Onboarding completed successfully" });
    } catch (error) {
      console.error("Error completing onboarding:", error);
      res.status(500).json({ message: "Failed to complete onboarding" });
    }
  });

  // AI Configuration Admin Routes
  app.get("/api/admin/ai-config", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const configs = await storage.getAIConfigs();
      // Remove sensitive data before sending to client
      const sanitizedConfigs = configs.map(config => ({
        ...config,
        apiKeyEncrypted: config.apiKeyEncrypted ? '***CONFIGURED***' : null,
        hasApiKey: !!config.apiKeyEncrypted
      }));
      
      res.json(sanitizedConfigs);
    } catch (error) {
      console.error("Error fetching AI configs:", error);
      res.status(500).json({ message: "Failed to fetch AI configurations" });
    }
  });

  app.put("/api/admin/ai-config/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'admin') {
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

  app.post("/api/admin/ai-config/:id/activate", isAuthenticated, async (req, res) => {
    try {
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const configId = parseInt(req.params.id);
      
      // Deactivate all configs first
      await storage.deactivateAllAIConfigs();
      
      // Activate the selected config
      await storage.updateAIConfig(configId, { isActive: true });
      
      res.json({ success: true, message: "AI provider activated successfully" });
    } catch (error) {
      console.error("Error activating AI provider:", error);
      res.status(500).json({ message: "Failed to activate AI provider" });
    }
  });

  // Import and mount admin routes
  try {
    const adminDashboardRouter = require('./src/routes/admin/dashboard').default;
    const adminUsersRouter = require('./src/routes/admin/users').default;
    const adminSystemRouter = require('./src/routes/admin/system').default;
    const adminAnalyticsRouter = require('./src/routes/admin/analytics').default;
    const adminPaymentsRouter = require('./src/routes/admin/payments').default;
    const adminSettingsRouter = require('./src/routes/admin/settings').default;
    const adminBackupRouter = require('./src/routes/admin/backup').default;
    const adminSecurityRouter = require('./src/routes/admin/security').default;
    const adminNotificationsRouter = require('./src/routes/admin/notifications').default;
    const adminActivityRouter = require('./src/routes/admin/activity').default;
    const adminRouter = require('./src/routes/admin/index').default;

    app.use('/api/admin/dashboard', adminDashboardRouter);
    app.use('/api/admin/users', adminUsersRouter);
    app.use('/api/admin/system', adminSystemRouter);
    app.use('/api/admin/analytics', adminAnalyticsRouter);
    app.use('/api/admin/payments', adminPaymentsRouter);
    app.use('/api/admin/settings', adminSettingsRouter);
    app.use('/api/admin/backup', adminBackupRouter);
    app.use('/api/admin/security', adminSecurityRouter);
    app.use('/api/admin/notifications', adminNotificationsRouter);
    app.use('/api/admin/activity', adminActivityRouter);
    app.use('/api/admin', adminRouter);
  } catch (error) {
    console.error('Error loading admin routes:', error);
  }

  // Import and mount user routes
  try {
    const userRouter = require('./src/routes/user/index').default;
    app.use('/api/user', userRouter);
  } catch (error) {
    console.error('Error loading user routes:', error);
  }

  const httpServer = createServer(app);
  return httpServer;
}

function calculateMealScore(foods: any[]): number {
  const avgDensity = foods.reduce((sum, food) => sum + (food.densityScore || 50), 0) / foods.length;
  const varietyScore = Math.min(foods.length * 10, 50);
  return Math.round(avgDensity + varietyScore);
}

function calculateNutritionalBalance(foods: any[]): {protein: number, carbs: number, fat: number} {
  const total = foods.reduce((sum, food) => ({
    protein: sum.protein + food.protein,
    carbs: sum.carbs + food.carbs,
    fat: sum.fat + food.fat
  }), {protein: 0, carbs: 0, fat: 0});

  const totalGrams = total.protein + total.carbs + total.fat;
  return {
    protein: Math.round((total.protein / totalGrams) * 100),
    carbs: Math.round((total.carbs / totalGrams) * 100),
    fat: Math.round((total.fat / totalGrams) * 100)
  };
}

async function generateMealPlan(goal: string, medicalCondition?: string): Promise<any> {
  // Implementation for generating meal plan based on goal and medicalCondition.
  // Replace with actual AI call or database lookup.
  return {
    plan: `Placeholder meal plan for ${goal} (${medicalCondition || 'no condition'})`
  };
}

// Helper functions for onboarding
function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  // Mifflin-St Jeor Equation
  if (gender === 'male') {
    return (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
}

function getActivityMultiplier(activityLevel: string): number {
  const multipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'extra-active': 1.9
  };
  return multipliers[activityLevel as keyof typeof multipliers] || 1.2;
}

function getWeeklyWorkoutsFromActivity(activityLevel: string): number {
  const workouts = {
    'sedentary': 0,
    'light': 1,
    'moderate': 3,
    'active': 5,
    'extra-active': 7
  };
  return workouts[activityLevel as keyof typeof workouts] || 0;
}