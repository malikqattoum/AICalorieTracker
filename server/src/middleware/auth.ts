import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UserService from '../services/userService';
import { User } from '../models/user';
import { storage } from '../../storage-provider';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-here-1234567890123456';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(`[AUTH] Authentication attempt for path: ${req.path}`);
    console.log(`[AUTH] JWT_SECRET configured: ${!!process.env.JWT_SECRET}`);
    console.log(`[AUTH] Headers present:`, Object.keys(req.headers));

    const authHeader = req.headers.authorization;
    console.log(`[AUTH] Authorization header present: ${!!authHeader}`);
    console.log(`[AUTH] Authorization header value: ${authHeader ? authHeader.substring(0, 50) + '...' : 'null'}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[AUTH] Missing or invalid authorization header - returning 401`);
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    console.log(`[AUTH] Token extracted, length: ${token.length}`);
    console.log(`[AUTH] Token first 20 chars: ${token.substring(0, 20)}...`);

    // Verify the JWT token
    console.log(`[AUTH] Attempting to verify JWT token...`);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, id: number };
    const userId = decoded.userId || decoded.id; // Handle both possible token formats
    console.log(`[AUTH] Token decoded successfully, userId: ${userId}`);
    console.log(`[AUTH] Decoded token payload:`, decoded);

    // Get user from database
    console.log(`[AUTH] Looking up user in database...`);
    const user = await storage.getUserById(userId);
    console.log(`[AUTH] User lookup result:`, user ? 'found' : 'not found');

    if (!user) {
      console.log(`[AUTH] User not found for userId: ${userId} - returning 401`);
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log(`[AUTH] User authenticated successfully:`, {
      id: user.id,
      username: user.username,
      email: user.email,
      role: (user as any).role || 'user'
    });

    (req as any).user = user;
    next();
  } catch (error) {
    console.error(`[AUTH] Authentication error:`, error);

    if (error instanceof jwt.JsonWebTokenError) {
      console.log(`[AUTH] JWT verification failed - invalid token`);
      console.error(`[AUTH] JWT Error:`, error.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      console.log(`[AUTH] JWT token expired`);
      console.error(`[AUTH] Token Expired Error:`, error.message);
      return res.status(401).json({ error: 'Token expired' });
    }

    console.log(`[AUTH] Generic authentication failure`);
    console.error(`[AUTH] Generic Error:`, error instanceof Error ? error.message : String(error));
    res.status(401).json({ error: 'Authentication failed' });
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
