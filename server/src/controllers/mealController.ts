import { Request, Response } from 'express';
import MealService from '../services/mealService';

export default {
  async getMeals(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { date, type } = req.query;
      const meals = await MealService.getUserMeals(userId, date as string, type as string);
      res.json(meals);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get meals' });
    }
  },

  async createMeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const mealData = req.body;
      const meal = await MealService.createMeal(userId, mealData);
      res.status(201).json(meal);
    } catch (error) {
      res.status(400).json({ error: 'Failed to create meal' });
    }
  },

  async updateMeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const mealId = parseInt(req.params.id);
      const updates = req.body;
      const updatedMeal = await MealService.updateMeal(userId, mealId, updates);
      res.json(updatedMeal);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update meal' });
    }
  },

  async deleteMeal(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const mealId = parseInt(req.params.id);
      await MealService.deleteMeal(userId, mealId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete meal' });
    }
  },

  async analyzeMealImage(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Expect multipart/form-data with field 'image'
      // If not using multer yet, accept base64 via 'imageData' as fallback
      const contentType = req.headers['content-type'] || '';

      // Lazy-load services to avoid circular imports
      const { imageStorageService } = await import('../services/imageStorageService');
      const { storage } = await import('../../storage-provider');

      let buffer: Buffer | null = null;
      let originalName = 'upload.jpg';
      let mimeType = 'image/jpeg';

      if (contentType.includes('multipart/form-data') && (req as any).file) {
        // Using multer upstream (not wired yet) – support if present
        buffer = (req as any).file.buffer;
        originalName = (req as any).file.originalname || originalName;
        mimeType = (req as any).file.mimetype || mimeType;
      } else if (typeof req.body?.imageData === 'string') {
        // Accept base64 data URL or raw base64 string
        const imageData = req.body.imageData.includes('base64,')
          ? req.body.imageData.split('base64,')[1]
          : req.body.imageData;
        buffer = Buffer.from(imageData, 'base64');
        // Try detect mime from prefix if present
        if (req.body.imageData.startsWith('data:image/')) {
          const mt = req.body.imageData.substring(5, req.body.imageData.indexOf(';'));
          if (mt) mimeType = mt;
        }
      }

      if (!buffer) {
        return res.status(400).json({ error: 'No image provided. Send multipart with field "image" or JSON { imageData }.' });
      }

      // Process and store (original, optimized, thumbnail), returns metadata
      const processed = await imageStorageService.processAndStoreImage(
        buffer,
        originalName,
        mimeType,
        userId
      );

      // Analyze via existing AI flow to keep consistent behavior
      const base64ForAI = buffer.toString('base64');
      const { aiService } = await import('../../ai-service');
      let analysis = await aiService.analyzeFoodImage(base64ForAI);

      // Create meal analysis entry referencing the stored image filename via proxy URLs
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

      // Persist record in meal_images table to track stored file
      const { db } = await import('../db');
      const { mealImages } = await import('../db/schemas/mealImages');
      const { mealAnalyses } = await import('../db/schemas/mealAnalyses');
      const { eq } = await import('drizzle-orm');

      // Filename is same across original/optimized/thumbnail in our service
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

      // Also update meal_analyses with image hash and optional paths
      await db.update(mealAnalyses)
        .set({
          imageHash: processed.original.hash,
          imageUrl: optimizedUrl,
        })
        .where(eq(mealAnalyses.id, mealAnalysis.id));

      return res.status(201).json({
        ...mealAnalysis,
        imageUrl: optimizedUrl,
      });
    } catch (error) {
      console.error('Meal analysis failed:', error);
      res.status(400).json({ error: 'Meal analysis failed' });
    }
  },

  async getDailySummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { date } = req.query;
      const summary = await MealService.getDailySummary(userId, date as string);
      res.json(summary);
    } catch (error) {
      res.status(400).json({ error: 'Failed to get daily summary' });
    }
  }
};