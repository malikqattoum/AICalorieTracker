import { Request, Response } from 'express';
import UserService from '../services/userService';
import JWTService from '../services/jwtService';
import { AppError, ValidationError, AuthenticationError } from '../middleware/errorHandler';
import { errorTrackingService } from '../services/errorTrackingService';
import { Logger } from '../utils/logger';

const logger = new Logger('AuthController');

export default {
  async login(req: Request, res: Response) {
    try {
      logger.info('Login attempt received', {
        bodyKeys: Object.keys(req.body),
        hasEmail: !!req.body.email,
        hasUsername: !!req.body.username,
        emailValue: req.body.email,
        usernameValue: req.body.username
      });

      // Handle both username and email fields for backward compatibility
      const { email, username, password } = req.body;
      const loginIdentifier = email || username;

      if (!loginIdentifier || !password) {
        logger.warn('Login validation failed - missing login identifier or password', {
          email: !!email,
          username: !!username,
          loginIdentifier: !!loginIdentifier,
          password: !!password
        });
        throw new ValidationError('Email/Username and password are required');
      }

      const user = await UserService.authenticate(loginIdentifier, password);
      
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const tokens = await JWTService.generateTokens(user);
      
      logger.info('User logged in successfully', { userId: user.id, email });
      res.json({
        success: true,
        data: tokens,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Login failed', error);
      errorTrackingService.trackError(error as Error, {
        userId: (req as any).user?.id,
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
      
      if (error instanceof AppError) {
        const statusCode = error.type === 'VALIDATION_ERROR' ? 400 :
                          error.type === 'AUTHENTICATION_ERROR' ? 401 : 500;
        res.status(statusCode).json({
          success: false,
          message: error.message,
          timestamp: new Date()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Login failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password, username } = req.body;
      
      logger.info('Registration attempt', { email, username, hasPassword: !!password });
      
      if (!email || !password || !username) {
        throw new ValidationError('Email, password, and username are required');
      }

      if (password.length < 8) {
        throw new ValidationError('Password must be at least 8 characters long');
      }

      // Check database connection before proceeding
      try {
        const connectionTest = await UserService.testDatabaseConnection();
        logger.info('Database connection test', { success: connectionTest });
      } catch (dbError) {
        logger.error('Database connection test failed', dbError);
        throw new Error('Database connection failed');
      }

      const user = await UserService.createUser(email, password, username);
      
      const tokens = await JWTService.generateTokens(user);
      
      logger.info('User registered successfully', { userId: user.id, email });
      res.status(201).json({
        success: true,
        data: tokens,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Registration failed', error);
      errorTrackingService.trackError(error as Error, {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
      
      if (error instanceof AppError) {
        res.status(400).json({
          success: false,
          message: error.message,
          timestamp: new Date()
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Registration failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new ValidationError('Email is required');
      }

      await UserService.initiatePasswordReset(email);
      
      logger.info('Password reset initiated', { email });
      res.json({
        success: true,
        message: 'Password reset instructions sent',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Password reset failed', error);
      errorTrackingService.trackError(error as Error, {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
      
      if (error instanceof AppError) {
        res.status(400).json({
          success: false,
          message: error.message,
          timestamp: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Password reset failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new ValidationError('Token and new password are required');
      }

      if (newPassword.length < 8) {
        throw new ValidationError('New password must be at least 8 characters long');
      }

      await UserService.completePasswordReset(token, newPassword);
      
      logger.info('Password reset completed successfully');
      res.json({
        success: true,
        message: 'Password reset successful',
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Password reset completion failed', error);
      errorTrackingService.trackError(error as Error, {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
      
      if (error instanceof AppError) {
        res.status(400).json({
          success: false,
          message: error.message,
          timestamp: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Password reset failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  },

  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const tokens = await JWTService.refreshAccessToken(refreshToken);
      
      logger.info('Access token refreshed successfully');
      res.json({
        success: true,
        data: tokens,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Token refresh failed', error);
      errorTrackingService.trackError(error as Error, {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
      
      if (error instanceof AppError) {
        res.status(401).json({
          success: false,
          message: error.message,
          timestamp: new Date()
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  },

  async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        throw new AuthenticationError('User not authenticated');
      }

      const user = await UserService.getUserById(userId);
      
      logger.info('Current user retrieved', { userId });
      res.json({
        success: true,
        data: user,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to get current user', error);
      errorTrackingService.trackError(error as Error, {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
      });
      
      if (error instanceof AppError) {
        res.status(401).json({
          success: false,
          message: error.message,
          timestamp: new Date()
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  }
};