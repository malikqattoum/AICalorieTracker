import { Request, Response } from 'express';
import NutritionCoachService from '../services/nutritionCoachService';

export default {
  async askQuestion(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { question, imageData } = req.body;
      const response = await NutritionCoachService.askQuestion(userId, question, imageData);
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: 'Failed to process question' });
    }
  },

  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const history = await NutritionCoachService.getHistory(userId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get history' });
    }
  },

  async submitFeedback(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const answerId = parseInt(req.params.id);
      const { rating, comment } = req.body;
      await NutritionCoachService.submitFeedback(userId, answerId, rating, comment);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Invalid feedback submission' });
    }
  },

  async getRecommendations(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const recommendations = await NutritionCoachService.getRecommendations(userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get recommendations' });
    }
  },

  async getTips(req: Request, res: Response) {
    try {
      const tips = await NutritionCoachService.getTips();
      res.json(tips);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get tips' });
    }
  }
};