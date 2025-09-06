import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage-provider";
import { analyzeFoodImage, getNutritionTips, getSmartMealSuggestions } from "./openai";
import { analyzeMultiFoodImage } from "./openai";
import { aiService } from "./ai-service";
import { insertMealAnalysisSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { getNutritionCoachReply } from "./openai";
import { aiCache } from "./ai-cache";
import { db } from "./src/db";
import { users, nutritionGoals } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
// Import authentication middleware
import { authenticate } from "./src/middleware/auth";
import jwt from "jsonwebtoken";
// Import file system modules for image serving
import * as fs from "fs";
import * as path from "path";
// Image upload middleware
import multer from "multer";
// Import admin auth middleware
import { isAdmin } from "./admin-auth";
// Import route modules
import adminDashboardRouter from "./src/routes/admin/dashboard";
import adminUsersRouter from "./src/routes/admin/users";
import adminSystemRouter from "./src/routes/admin/system";
import adminAnalyticsRouter from "./src/routes/admin/analytics";
import adminPaymentsRouter from "./src/routes/admin/payments";
import adminSettingsRouter from "./src/routes/admin/settings";
import adminBackupRouter from "./src/routes/admin/backup";
import adminSecurityRouter from "./src/routes/admin/security";
import adminNotificationsRouter from "./src/routes/admin/notifications";
import adminActivityRouter from "./src/routes/admin/activity";
import adminRouter from "./src/routes/admin/index";
import securityRouter from "./src/routes/security";
import userRouter from "./src/routes/user/index";
import wearableRouter from "./src/routes/wearables";
import authRouter from "./src/routes/auth";

// Initialize Stripe client if secret key is available
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil" // Use the version expected by the installed Stripe library
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  console.log('[ROUTES] Registering routes...');
  console.log('[ROUTES] Adding image serving route...');

  // Test route to verify routing is working
  app.get('/api/test-image-route', (req, res) => {
    console.log('[TEST-ROUTE] Test route hit');
    res.json({ message: 'Test route working' });
  });

  // Image serving routes - must be before API routes
  app.get('/api/images/:size/:filename', (req, res) => {
    console.log('[IMAGE-SERVE] Image request received:', req.params);
    try {
      const { size, filename } = req.params;

      // Validate size parameter
      const validSizes = ['original', 'optimized', 'thumbnail'];
      if (!validSizes.includes(size)) {
        return res.status(400).json({ message: 'Invalid image size' });
      }

      // Validate filename to prevent directory traversal
      if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ message: 'Invalid filename' });
      }

      // Construct the file path
      const filePath = path.join(process.cwd(), 'uploads', size === 'original' ? 'originals' : size === 'optimized' ? 'optimized' : 'thumbnails', filename);

      // Check if file exists and serve it
      if (fs.existsSync(filePath)) {
        // Set appropriate headers
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG, could be improved

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error: Error) => {
          console.error('Error streaming image file:', error);
          res.status(500).json({ message: 'Error serving image' });
        });
      } else {
        res.status(404).json({ message: 'Image not found' });
      }
    } catch (error) {
      console.error('Error serving image:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Simple test endpoint for mobile app connectivity
  app.get('/api/simple-test', (req, res) => {
    console.log('=== SIMPLE TEST ENDPOINT HIT ===');
    console.log('Request received from mobile app');
    console.log('Sending connectivity test response');
    
    res.json({
      success: true,
      message: 'Mobile app connectivity test successful',
      timestamp: new Date().toISOString(),
      server: 'AI Calorie Tracker Production Backend',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      ip: req.ip,
      headers: {
        'user-agent': req.get('User-Agent'),
        'x-forwarded-for': req.get('X-Forwarded-For'),
        'x-real-ip': req.get('X-Real-IP')
      }
    });
  });


  // Get meal analyses for the current user
  app.get("/api/meal-analyses", authenticate, async (req, res) => {
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
  app.get("/api/meal-analyses/:id", authenticate, async (req, res) => {
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
  app.post("/api/analyze-complex-meal", authenticate, async (req, res) => {
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

        // Check cache first
        let analysis = aiCache.get(base64Data);
        
        if (!analysis) {
          // Analyze the food image using configured AI service
          analysis = await aiService.analyzeMultiFoodImage(base64Data);
          
          // Cache the result
          aiCache.set(base64Data, analysis);
        }
        
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
        mealId: 0, // Will be set by database or can be updated later
        foodName: `Complex Meal (${analysisResults.length} items)`,
        estimatedCalories: combinedAnalysis.totalCalories,
        estimatedProtein: combinedAnalysis.totalProtein.toString(),
        estimatedCarbs: combinedAnalysis.totalCarbs.toString(),
        estimatedFat: combinedAnalysis.totalFat.toString(),
        imageUrl: validatedData.images[0], // Store first image only
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

      // Check cache first
      let analysis = aiCache.get(base64Data);
      
      if (!analysis) {
        // Analyze the food image using configured AI service
        analysis = await aiService.analyzeFoodImage(base64Data);
        
        // Cache the result
        aiCache.set(base64Data, analysis);
      }

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
  app.post("/api/analyze-food", authenticate, async (req, res) => {
    console.log('[ANALYZE-FOOD] Starting food analysis request');
    console.log('[ANALYZE-FOOD] User ID:', req.user!.id);
    console.log('[ANALYZE-FOOD] Content-Type:', req.get('Content-Type'));
    console.log('[ANALYZE-FOOD] Raw body type:', typeof req.body);
    console.log('[ANALYZE-FOOD] Raw body keys:', Object.keys(req.body || {}));

    try {
      const requestSchema = z.object({
        imageData: z.string()
      });

      // Normalize body to support multiple field names and handle malformed requests
      const body: any = req.body || {};
      let normalizedImageData = body.imageData ?? body.image ?? body.data ?? null;

      // Handle case where JSON was parsed as URL-encoded form data
      if (!normalizedImageData && Object.keys(body).length >= 1) {
        const bodyKeys = Object.keys(body);
        console.log('[ANALYZE-FOOD] Checking for malformed JSON in body keys:', bodyKeys.length);
        
        // Try to find JSON-like key
        for (const key of bodyKeys) {
          const value = body[key];
          console.log('[ANALYZE-FOOD] Checking key:', key.substring(0, 50) + '...', 'value type:', typeof value);
          
          // Case 1: Entire JSON object as key with empty value
          if (key.startsWith('{') && key.includes('imageData') && (!value || value === '')) {
            try {
              console.log('[ANALYZE-FOOD] Attempting to parse JSON from key');
              const parsed = JSON.parse(key);
              if (parsed && typeof parsed === 'object') {
                normalizedImageData = parsed.imageData || parsed.image || parsed.data;
                console.log('[ANALYZE-FOOD] Successfully extracted imageData from JSON key');
                break;
              }
            } catch (e) {
              console.log('[ANALYZE-FOOD] Failed to parse JSON from key:', e);
            }
          }
          
          // Case 2: Check if value itself contains the image data
          if (typeof value === 'string' && (value.startsWith('data:image/') || value.startsWith('/9j/') || value.length > 1000)) {
            normalizedImageData = value;
            console.log('[ANALYZE-FOOD] Found image data in value');
            break;
          }
        }
      }

      console.log('[ANALYZE-FOOD] Normalized image data type:', typeof normalizedImageData);
      console.log('[ANALYZE-FOOD] Normalized image data length:', normalizedImageData?.length || 0);
      console.log('[ANALYZE-FOOD] Image data preview:', normalizedImageData?.substring(0, 50) + '...');

      // Check if image data is missing before Zod validation
      if (!normalizedImageData || typeof normalizedImageData !== 'string' || normalizedImageData.trim() === '') {
        console.error('[ANALYZE-FOOD] Missing or invalid image data');
        console.error('[ANALYZE-FOOD] Available body fields:', Object.keys(body));
        console.error('[ANALYZE-FOOD] Body structure debug:');
        Object.keys(body).forEach(key => {
          const value = body[key];
          console.error(`  Key: "${key.substring(0, 100)}..." (${key.length} chars)`);
          console.error(`  Value type: ${typeof value}`);
          console.error(`  Value preview: ${typeof value === 'string' ? value.substring(0, 50) + '...' : JSON.stringify(value).substring(0, 50) + '...'}`);
        });
        
        return res.status(400).json({
          message: "Image data is required. Please provide imageData, image, or data field with base64 encoded image.",
          receivedFields: Object.keys(body),
          expectedFields: ['imageData', 'image', 'data'],
          debug: {
            contentType: req.get('Content-Type'),
            bodyType: typeof req.body,
            bodyKeys: Object.keys(body),
            firstKeyPreview: Object.keys(body)[0]?.substring(0, 100)
          }
        });
      }

      const validatedData = requestSchema.parse({ imageData: normalizedImageData });
      const userId = req.user!.id;
      console.log('[ANALYZE-FOOD] Validation passed, userId:', userId);

      // Remove data URL prefix if present
      const base64Data = validatedData.imageData.includes('base64,')
        ? validatedData.imageData.split('base64,')[1]
        : validatedData.imageData;
      console.log('[ANALYZE-FOOD] Base64 data length after prefix removal:', base64Data.length);

      // Check cache first
      let analysis = aiCache.get(base64Data);
      console.log('[ANALYZE-FOOD] Cache hit:', !!analysis);

      if (!analysis) {
        console.log('[ANALYZE-FOOD] Cache miss, calling AI service');
        // Analyze the food image using configured AI service
        analysis = await aiService.analyzeFoodImage(base64Data);
        console.log('[ANALYZE-FOOD] AI analysis completed:', !!analysis);

        // Cache the result
        aiCache.set(base64Data, analysis);
        console.log('[ANALYZE-FOOD] Analysis cached');
      }

      console.log('[ANALYZE-FOOD] Starting image storage process');
      // Persist image to storage (original, optimized, thumbnail)
      const { imageStorageService } = await import('./src/services/imageStorageService');
      const buffer = Buffer.from(base64Data, 'base64');
      console.log('[ANALYZE-FOOD] Buffer created, size:', buffer.length);
      const mimeType = (validatedData.imageData.startsWith('data:image/')
        ? validatedData.imageData.substring(5, validatedData.imageData.indexOf(';'))
        : 'image/jpeg');
      console.log('[ANALYZE-FOOD] MIME type detected:', mimeType);

      const processed = await imageStorageService.processAndStoreImage(
        buffer,
        'camera.jpg',
        mimeType,
        userId
      );
      console.log('[ANALYZE-FOOD] Image processed successfully');
      const optimizedUrl = imageStorageService.getImageUrl(processed.optimized.path, 'optimized');
      console.log('[ANALYZE-FOOD] Optimized URL generated:', optimizedUrl);

      console.log('[ANALYZE-FOOD] Creating meal analysis record');
      // Create a meal analysis record referencing the stored file and hash
      const mealAnalysis = await storage.createMealAnalysis({
        userId,
        mealId: 0, // Will be set by database or can be updated later
        foodName: analysis.foodName,
        estimatedCalories: analysis.calories,
        estimatedProtein: analysis.protein?.toString(),
        estimatedCarbs: analysis.carbs?.toString(),
        estimatedFat: analysis.fat?.toString(),
        imageUrl: optimizedUrl,
        imageHash: processed.original.hash,
        analysisDetails: analysis.analysisDetails
      });
      console.log('[ANALYZE-FOOD] Meal analysis record created, ID:', mealAnalysis.id);

      console.log('[ANALYZE-FOOD] Inserting into meal_images table');
      // Insert into meal_images table
      const { db } = await import('./db');
      const { mealImages } = await import('./src/db/schemas/mealImages');
      // Upsert by unique image_hash to avoid duplicate errors for re-uploads
      await db.insert(mealImages)
        .values({
          mealAnalysisId: mealAnalysis.id,
          filePath: processed.original.filename,
          fileSize: processed.optimized.size,
          mimeType: processed.optimized.mimeType,
          width: processed.optimized.width || null,
          height: processed.optimized.height || null,
          imageHash: processed.original.hash,
        })
        .onDuplicateKeyUpdate({
          set: {
            mealAnalysisId: mealAnalysis.id,
            filePath: processed.original.filename,
            fileSize: processed.optimized.size,
            mimeType: processed.optimized.mimeType,
            width: processed.optimized.width || null,
            height: processed.optimized.height || null,
            updatedAt: sql`CURRENT_TIMESTAMP`
          }
        });
      console.log('[ANALYZE-FOOD] Database operations completed successfully');

      console.log('[ANALYZE-FOOD] Sending successful response');
      res.status(201).json(mealAnalysis);
    } catch (error) {
      console.error("[ANALYZE-FOOD] Error analyzing food:", error);
      console.error("[ANALYZE-FOOD] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      if (error instanceof z.ZodError) {
        console.error("[ANALYZE-FOOD] Zod validation error:", error.errors);
        // Provide more specific error message for imageData validation
        const imageDataError = error.errors.find(err => err.path.includes('imageData'));
        if (imageDataError) {
          res.status(400).json({
            message: "Image data is required and must be a valid string",
            error: imageDataError.message,
            code: imageDataError.code
          });
        } else {
          res.status(400).json({ message: "Invalid request data", errors: error.errors });
        }
      } else {
        res.status(500).json({ message: "Failed to analyze food" });
      }
    }
  });

  // Mobile-compatible: Analyze meal image (multipart or base64)
  // Matches mobile client: POST /api/meals/analyze
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
      if (ok) cb(null, true); else cb(new Error('Unsupported file type'));
    }
  });

  app.post('/api/meals/analyze', authenticate, upload.single('image'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const { imageStorageService } = await import('./src/services/imageStorageService');
      const { storage } = await import('./storage-provider');

      let buffer: Buffer | null = null;
      let originalName = 'upload.jpg';
      let mimeType = 'image/jpeg';

      if ((req as any).file) {
        buffer = (req as any).file.buffer;
        originalName = (req as any).file.originalname || originalName;
        mimeType = (req as any).file.mimetype || mimeType;
      } else if (typeof req.body?.imageData === 'string') {
        const imageData = req.body.imageData.includes('base64,')
          ? req.body.imageData.split('base64,')[1]
          : req.body.imageData;
        buffer = Buffer.from(imageData, 'base64');
        if (req.body.imageData.startsWith('data:image/')) {
          const mt = req.body.imageData.substring(5, req.body.imageData.indexOf(';'));
          if (mt) mimeType = mt;
        }
      }

      if (!buffer) {
        return res.status(400).json({ error: 'No image provided. Send multipart field "image" or JSON { imageData }.' });
      }

      const processed = await imageStorageService.processAndStoreImage(
        buffer,
        originalName,
        mimeType,
        userId
      );

      const base64ForAI = buffer.toString('base64');
      const { aiService } = await import('./ai-service');
      const analysis = await aiService.analyzeFoodImage(base64ForAI);

      const mealAnalysis = await storage.createMealAnalysis({
        userId,
        mealId: 0,
        foodName: analysis.foodName,
        estimatedCalories: analysis.calories,
        estimatedProtein: analysis.protein?.toString(),
        estimatedCarbs: analysis.carbs?.toString(),
        estimatedFat: analysis.fat?.toString(),
        imageUrl: `data:image/jpeg;base64,${base64ForAI}`,
        analysisDetails: analysis.analysisDetails,
      });

      const { db } = await import('./db');
      const { mealImages } = await import('./src/db/schemas/mealImages');
      const { mealAnalyses } = await import('./src/db/schemas/mealAnalyses');
      const { eq } = await import('drizzle-orm');

      const filename = processed.original.filename;
      const optimizedUrl = imageStorageService.getImageUrl(processed.optimized.path, 'optimized');

      await db.insert(mealImages).values({
        mealAnalysisId: mealAnalysis.id,
        filePath: filename,
        fileSize: processed.optimized.size,
        mimeType: processed.optimized.mimeType,
        width: processed.optimized.width || null,
        height: processed.optimized.height || null,
        imageHash: processed.original.hash,
      });

      await db.update(mealAnalyses)
        .set({ imageHash: processed.original.hash, imageUrl: optimizedUrl })
        .where(eq(mealAnalyses.id, mealAnalysis.id));

      res.status(201).json({ ...mealAnalysis, imageUrl: optimizedUrl });
    } catch (error) {
      console.error('Error analyzing meal image:', error);
      res.status(500).json({ message: 'Failed to analyze meal image' });
    }
  });

  // Get weekly stats for the current user
  app.get("/api/weekly-stats", async (req, res) => {
    try {
      console.log('[DEBUG] /api/weekly-stats called');
      const userId = 1; // Hardcoded for testing
      const medicalCondition = req.query.medicalCondition as string | undefined;
      console.log('[DEBUG] userId:', userId, 'medicalCondition:', medicalCondition);

      const stats = await storage.getWeeklyStats(userId, medicalCondition);
      console.log('[DEBUG] getWeeklyStats result:', stats ? 'found' : 'null');

      if (!stats) {
        console.log('[DEBUG] No weekly stats found, returning 404');
        return res.status(404).json({ message: "No weekly stats found" });
      }

      console.log('[DEBUG] Returning weekly stats successfully');
      res.json(stats);
    } catch (error) {
      console.error("[DEBUG] Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Generate meal plan
  app.post("/api/meal-plan", authenticate, async (req, res) => {
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
  app.get("/api/nutrition-tips", authenticate, async (req, res) => {
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
  app.get("/api/smart-meal-suggestions", authenticate, async (req, res) => {
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
    app.post("/api/create-payment-intent", authenticate, async (req, res) => {
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
    app.post("/api/create-subscription", authenticate, async (req, res) => {
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
    app.get("/api/subscription", authenticate, async (req, res) => {
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
    app.post("/api/cancel-subscription", authenticate, async (req, res) => {
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

  app.get("/api/admin/content/:key", authenticate, isAdmin, async (req, res) => {
    try {
      const key = req.params.key;
      const value = await storage.getSiteContent(key);
      res.json({ key, value });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post("/api/admin/content/:key", authenticate, isAdmin, async (req, res) => {
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
  app.get("/api/user/goals", authenticate, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      res.json(user.nutritionGoals || {});
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition goals" });
    }
  });
  app.post("/api/user/goals", authenticate, async (req, res) => {
    try {
      const { calories, protein, carbs, fat } = req.body;
      await storage.updateUserNutritionGoals(req.user!.id, { calories, protein, carbs, fat });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update nutrition goals" });
    }
  });

  // Nutrition Coach Chatbot endpoint
  app.post("/api/nutrition-coach-chat", authenticate, async (req, res) => {
    try {
      console.log(`[NUTRITION-COACH] Request received for user: ${req.user!.id}`);
      console.log(`[NUTRITION-COACH] Request body:`, req.body);
      console.log(`[NUTRITION-COACH] Request body type:`, typeof req.body);
      console.log(`[NUTRITION-COACH] Request body keys:`, Object.keys(req.body || {}));
      console.log(`[NUTRITION-COACH] Content-Type:`, req.get('Content-Type'));

      const { messages } = req.body;

      // Detailed validation logging
      console.log(`[NUTRITION-COACH] Messages value:`, messages);
      console.log(`[NUTRITION-COACH] Messages type:`, typeof messages);
      console.log(`[NUTRITION-COACH] Is messages an array:`, Array.isArray(messages));

      if (!messages) {
        console.log(`[NUTRITION-COACH] ERROR: Messages is null/undefined`);
        return res.status(400).json({ error: "Messages field is required" });
      }

      if (!Array.isArray(messages)) {
        console.log(`[NUTRITION-COACH] ERROR: Messages is not an array, type: ${typeof messages}`);
        return res.status(400).json({ error: "Messages must be an array" });
      }

      if (messages.length === 0) {
        console.log(`[NUTRITION-COACH] ERROR: Messages array is empty`);
        return res.status(400).json({ error: "Messages array cannot be empty" });
      }

      // Validate message structure
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        console.log(`[NUTRITION-COACH] Message ${i}:`, msg);
        console.log(`[NUTRITION-COACH] Message ${i} type:`, typeof msg);

        if (!msg || typeof msg !== 'object') {
          console.log(`[NUTRITION-COACH] ERROR: Message ${i} is not an object`);
          return res.status(400).json({ error: `Message ${i} must be an object` });
        }

        if (!msg.role || !msg.content) {
          console.log(`[NUTRITION-COACH] ERROR: Message ${i} missing role or content`);
          console.log(`[NUTRITION-COACH] Message ${i} keys:`, Object.keys(msg));
          return res.status(400).json({ error: `Message ${i} must have 'role' and 'content' fields` });
        }

        if (!['user', 'assistant'].includes(msg.role)) {
          console.log(`[NUTRITION-COACH] ERROR: Invalid role '${msg.role}' in message ${i}`);
          return res.status(400).json({ error: `Message ${i} role must be 'user' or 'assistant'` });
        }

        if (typeof msg.content !== 'string' && (typeof msg.content !== 'object' || !msg.content.image_url)) {
          console.log(`[NUTRITION-COACH] ERROR: Message ${i} content must be a string or object with image_url, type: ${typeof msg.content}`);
          return res.status(400).json({ error: `Message ${i} content must be a string or object with image_url` });
        }
      }

      console.log(`[NUTRITION-COACH] Processing ${messages.length} messages`);
      console.log(`[NUTRITION-COACH] First message:`, messages[0]);

      // Use OpenAI-powered nutrition coach
      const reply = await getNutritionCoachReply(messages, req.user!.id);
      console.log(`[NUTRITION-COACH] OpenAI reply received:`, reply.substring(0, 100) + '...');

      res.json({ reply });
    } catch (error) {
      console.error("[NUTRITION-COACH] Error in nutrition coach chat:", error);
      res.status(500).json({ reply: "Sorry, I couldn't process your request." });
    }
  });

// Onboarding completion endpoint with comprehensive error handling and transaction support
app.post("/api/onboarding/complete", authenticate, async (req, res) => {
  const startTime = Date.now();
  
  // Get user ID from authenticated request
  const userId = req.user!.id;
  console.log(`[ONBOARDING] Starting onboarding process for user ${userId}`);
  
  try {
    // Validate request body structure
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const onboardingData = req.body;

    // Comprehensive validation schema
    const validateOnboardingData = (data: any) => {
      const errors: string[] = [];

      // Required fields validation
      const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'primaryGoal'];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push(`${field} is required`);
        }
      }

      // Numeric fields validation
      const numericFields = ['age', 'height', 'weight'];
      for (const field of numericFields) {
        const value = Number(data[field]);
        if (isNaN(value) || value <= 0) {
          errors.push(`${field} must be a positive number`);
        } else if (field === 'age' && (value < 13 || value > 120)) {
          errors.push('age must be between 13 and 120');
        } else if (field === 'height' && (value < 50 || value > 300)) {
          errors.push('height must be between 50cm and 300cm');
        } else if (field === 'weight' && (value < 20 || value > 500)) {
          errors.push('weight must be between 20kg and 500kg');
        }
      }

      // Target weight validation
      if (data.targetWeight !== undefined) {
        const targetWeight = Number(data.targetWeight);
        if (isNaN(targetWeight) || targetWeight <= 0) {
          errors.push('targetWeight must be a positive number');
        } else if (targetWeight < 20 || targetWeight > 500) {
          errors.push('targetWeight must be between 20kg and 500kg');
        }
      }

      // Activity level validation
      const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra-active'];
      if (!validActivityLevels.includes(data.activityLevel)) {
        errors.push('Invalid activity level. Must be one of: ' + validActivityLevels.join(', '));
      }

      // Primary goal validation
      const validGoals = ['lose-weight', 'maintain-weight', 'gain-muscle'];
      if (!validGoals.includes(data.primaryGoal)) {
        errors.push('Invalid primary goal. Must be one of: ' + validGoals.join(', '));
      }

      // Gender validation
      const validGenders = ['male', 'female', 'other'];
      if (!validGenders.includes(data.gender)) {
        errors.push('Invalid gender. Must be one of: ' + validGenders.join(', '));
      }

      // Timeline validation (if provided)
      if (data.timeline !== undefined) {
        const validTimelines = ['1-3 months', '3-6 months', '6-12 months', '1+ years'];
        if (!validTimelines.includes(data.timeline)) {
          errors.push('Invalid timeline. Must be one of: ' + validTimelines.join(', '));
        }
      }

      // Ensure arrays for JSON fields
      if (data.dietaryPreferences !== undefined && !Array.isArray(data.dietaryPreferences)) {
        errors.push('dietaryPreferences must be an array');
      }

      if (data.allergies !== undefined && !Array.isArray(data.allergies)) {
        errors.push('allergies must be an array');
      }

      // Boolean field validation
      if (data.aiMealSuggestions !== undefined && typeof data.aiMealSuggestions !== 'boolean') {
        errors.push('aiMealSuggestions must be a boolean');
      }

      if (data.notificationsEnabled !== undefined && typeof data.notificationsEnabled !== 'boolean') {
        errors.push('notificationsEnabled must be a boolean');
      }

      return errors;
    };

    // Validate input data
    const validationErrors = validateOnboardingData(onboardingData);
    if (validationErrors.length > 0) {
      console.log(`[ONBOARDING] Validation failed for user ${userId}:`, validationErrors);
      return res.status(400).json({ error: "Validation failed: " + validationErrors.join(', ') });
    }

    // Convert numeric fields to proper types
    const processedData = {
      ...onboardingData,
      age: Number(onboardingData.age),
      height: Number(onboardingData.height),
      weight: Number(onboardingData.weight),
      targetWeight: onboardingData.targetWeight ? Number(onboardingData.targetWeight) : null,
      aiMealSuggestions: onboardingData.aiMealSuggestions !== undefined ? Boolean(onboardingData.aiMealSuggestions) : true,
      aiChatAssistantName: onboardingData.aiChatAssistantName || 'NutriBot',
      notificationsEnabled: onboardingData.notificationsEnabled !== undefined ? Boolean(onboardingData.notificationsEnabled) : true,
    };

    // Ensure arrays for JSON fields
    const dietaryPreferences = Array.isArray(processedData.dietaryPreferences) ? processedData.dietaryPreferences : [];
    const allergies = Array.isArray(processedData.allergies) ? processedData.allergies : [];

    console.log(`[ONBOARDING] Processing onboarding data for user ${userId}`);

    // Use transaction for data consistency with better error handling
    try {
      await db.transaction(async (tx) => {
        // Check if user exists first
        const existingUser = await tx.select().from(users).where(eq(users.id, userId));
        if (!existingUser || existingUser.length === 0) {
          throw new Error(`User with ID ${userId} not found`);
        }

        // Update user with onboarding data
        await tx.update(users)
          .set({
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
            onboardingCompletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Calculate and create initial nutrition goals
        const bmr = calculateBMR(processedData.weight, processedData.height, processedData.age, processedData.gender);
        const activityMultiplier = getActivityMultiplier(processedData.activityLevel);
        const tdee = bmr * activityMultiplier;

        let dailyCalories = tdee;
        if (processedData.primaryGoal === 'lose-weight') {
          dailyCalories = tdee - 500; // 500 calorie deficit for weight loss
        } else if (processedData.primaryGoal === 'gain-muscle') {
          dailyCalories = tdee + 300; // 300 calorie surplus for muscle gain
        }

        // Check if nutrition goals already exist for this user
        const existingGoals = await tx.select().from(nutritionGoals).where(eq(nutritionGoals.userId, userId));
        
        if (existingGoals && existingGoals.length > 0) {
          // Update existing nutrition goals
          await tx.update(nutritionGoals)
            .set({
              dailyCalories: Math.round(dailyCalories),
              calories: Math.round(dailyCalories),
              protein: Math.round(processedData.weight * 2.2), // 2.2g per kg body weight
              carbs: Math.round((dailyCalories * 0.45) / 4), // 45% of calories from carbs
              fat: Math.round((dailyCalories * 0.30) / 9), // 30% of calories from fat
              weight: processedData.weight,
              weeklyWorkouts: getWeeklyWorkoutsFromActivity(processedData.activityLevel),
              waterIntake: 8, // 8 glasses per day default
              updatedAt: new Date(),
            })
            .where(eq(nutritionGoals.userId, userId));
        } else {
          // Create new nutrition goals
          await tx.insert(nutritionGoals).values({
            userId,
            dailyCalories: Math.round(dailyCalories),
            calories: Math.round(dailyCalories),
            protein: Math.round(processedData.weight * 2.2), // 2.2g per kg body weight
            carbs: Math.round((dailyCalories * 0.45) / 4), // 45% of calories from carbs
            fat: Math.round((dailyCalories * 0.30) / 9), // 30% of calories from fat
            weight: processedData.weight,
            weeklyWorkouts: getWeeklyWorkoutsFromActivity(processedData.activityLevel),
            waterIntake: 8, // 8 glasses per day default
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });
    } catch (dbError) {
      console.error(`[ONBOARDING] Database transaction failed for user ${userId}:`, dbError);
      throw new Error(`Database operation failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[ONBOARDING] Onboarding completed successfully for user ${userId} in ${duration}ms`);

    // Calculate nutrition goals for response
    const bmr = calculateBMR(processedData.weight, processedData.height, processedData.age, processedData.gender);
    const activityMultiplier = getActivityMultiplier(processedData.activityLevel);
    const tdee = bmr * activityMultiplier;
    let dailyCalories = tdee;
    if (processedData.primaryGoal === 'lose-weight') {
      dailyCalories = tdee - 500;
    } else if (processedData.primaryGoal === 'gain-muscle') {
      dailyCalories = tdee + 300;
    }

    res.status(201).json({
      data: {
        userId,
        nutritionGoals: {
          dailyCalories: Math.round(dailyCalories),
          calories: Math.round(dailyCalories),
          protein: Math.round(processedData.weight * 2.2),
          carbs: Math.round((dailyCalories * 0.45) / 4),
          fat: Math.round((dailyCalories * 0.30) / 9),
        },
        completedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[ONBOARDING] Error completing onboarding for user ${userId} after ${duration}ms:`, error);
    
    // Provide more detailed error information in development
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    res.status(500).json({
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
    });
  }
});


  // AI Configuration Admin Routes
  app.get("/api/admin/ai-config", authenticate, async (req, res) => {
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

  app.put("/api/admin/ai-config/:id", authenticate, async (req, res) => {
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

  app.post("/api/admin/ai-config/:id/activate", authenticate, async (req, res) => {
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

  // Mount admin routes
  try {
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

  // Mount security routes
  try {
    app.use('/api/security', securityRouter);
  } catch (error) {
    console.error('Error loading security routes:', error);
  }

  // Mount user routes
  try {
    app.use('/api/user', userRouter);
  } catch (error) {
    console.error('Error loading user routes:', error);
  }

  // Mount wearable routes
  try {
    app.use('/api/wearable', wearableRouter);
  } catch (error) {
    console.error('Error loading wearable routes:', error);
  }

  // Set up authentication routes after public routes are defined
  // Mount auth routes
  try {
    app.use('/api/auth', authRouter);
    console.log('✓ Auth routes mounted at /api/auth');
  } catch (error) {
    console.error('Error loading auth routes:', error);
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