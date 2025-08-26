import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserService from '../services/userService';
import { User } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[AUTH] Authentication attempt for path: ${req.path}`);
    console.log(`[AUTH] Headers:`, req.headers);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[AUTH] Missing or invalid authorization header`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log(`[AUTH] Token received (first 20 chars): ${token.substring(0, 20)}...`);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    console.log(`[AUTH] Token decoded, userId: ${decoded.userId}`);
    
    const user = await UserService.getUserById(decoded.userId);
    if (!user) {
      console.log(`[AUTH] User not found for userId: ${decoded.userId}`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`[AUTH] User authenticated:`, { id: user.id, username: user.username, role: (user as any).role || 'user' });
    (req as any).user = user;
    next();
  } catch (error) {
    console.error(`[AUTH] Authentication error:`, error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(403).json({ error: 'Admin access required' });
  }
};

// Export isAuthenticated as an alias for authenticate
export const isAuthenticated = authenticate;

// Default export for backward compatibility
export default {
  authenticate,
  isAdmin,
  isAuthenticated
};
