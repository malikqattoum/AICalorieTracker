import { Request, Response } from 'express';
import AdminService from '../services/adminService';

export default {
  async getAnalytics(req: Request, res: Response) {
    try {
      const analytics = await AdminService.getSystemAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  },

  async listUsers(req: Request, res: Response) {
    try {
      const users = await AdminService.listUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list users' });
    }
  },

  async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      const updatedUser = await AdminService.updateUser(userId, updates);
      res.json(updatedUser);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update user' });
    }
  },

  async updateContent(req: Request, res: Response) {
    try {
      const content = req.body;
      const result = await AdminService.updateContent(content);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: 'Failed to update content' });
    }
  },

  async listBackups(req: Request, res: Response) {
    try {
      const backups = await AdminService.listBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list backups' });
    }
  },

  async createBackup(req: Request, res: Response) {
    try {
      const backup = await AdminService.createBackup();
      res.json(backup);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create backup' });
    }
  }
};