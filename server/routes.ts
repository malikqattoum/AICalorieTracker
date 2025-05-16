import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-provider";
import { setupAuth } from "./auth";
import { analyzeFoodImage, getNutritionTips, getSmartMealSuggestions } from "./openai";
import { analyzeMultiFoodImage } from "./openai";
import { insertMealAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";

// Initialize Stripe client if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-03-31.basil" // The latest API version as of the current date
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

      // Analyze the food image using OpenAI
      const analysis = await analyzeFoodImage(base64Data);

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

      // Analyze the food image using OpenAI
      const analysis = await analyzeFoodImage(base64Data);

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
      const stats = await storage.getWeeklyStats(userId);

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
      const { goal } = req.body;

      if (!goal) {
        return res.status(400).json({ message: "Goal is required" });
      }

      const mealPlan = await generateMealPlan(goal);
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

  const httpServer = createServer(app);
  return httpServer;
}

async function generateMealPlan(goal: string): Promise<any> {
  //Implementation for generating meal plan based on goal.  This is a placeholder.
  // Replace with actual AI call or database lookup.
  return {
    "plan": "Placeholder meal plan for " + goal
  };
}