import { Request, Response } from 'express';
import UserProfileService from '../services/userProfileService';

export default {
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const updates = req.body;
      const updatedProfile = await UserProfileService.updateProfile(userId, updates);
      res.json(updatedProfile);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update profile' });
    }
  },

  async getSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const settings = await UserProfileService.getSettings(userId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get settings' });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const settings = req.body;
      const updatedSettings = await UserProfileService.updateSettings(userId, settings);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update settings' });
    }
  },

  async markOnboardingCompleted(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      await UserProfileService.markOnboardingCompleted(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Failed to mark onboarding completed' });
    }
  },

  async getUserStats(req: Request, res: Response) {
    try {
      console.log('DEBUG: getUserStats controller called');
      const userId = (req as any).user.id;
      console.log('DEBUG: userId from request:', userId);
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const stats = await UserProfileService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
  }
};