import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { analyzeFoodImage, getNutritionTips } from "./openai";
import { insertMealAnalysisSchema } from "@shared/schema";
import { z } from "zod";

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

  const httpServer = createServer(app);
  return httpServer;
}
