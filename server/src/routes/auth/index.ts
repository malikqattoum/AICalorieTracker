import { Router, Request, Response, NextFunction } from 'express';
import { registerRateLimiter } from '../../../rate-limiter';
import { z } from 'zod';
import { storage } from '../../../storage-provider';
import bcrypt from 'bcrypt';
import JWTService from '../../services/jwtService';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

console.log('[AUTH-ROUTE] Setting up /api/auth/register route...');
// POST /api/auth/register
router.post('/register', registerRateLimiter, async (req, res, next) => {
  console.log('=== [REGISTER] DEBUG START ===');
  console.log('[REGISTER] Received request:', req.body);
  console.log('[REGISTER] Headers:', req.headers);
  console.log('[REGISTER] Content-Type:', req.get('content-type'));
  
  try {
    console.log('[REGISTER] Starting validation...');
    const validatedData = registerSchema.parse(req.body);
    console.log('[REGISTER] Validation successful:', validatedData);
    
    // Check if username exists
    console.log('[REGISTER] Checking username:', validatedData.username);
    try {
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        console.log('[REGISTER] Username exists:', validatedData.username);
        return res.status(400).json({ message: "Username already exists" });
      }
    } catch (error) {
      console.error('[REGISTER] Error checking username:', error);
      return res.status(500).json({ message: "Error checking username availability" });
    }
    
    // Check if email exists
    console.log('[REGISTER] Checking email:', validatedData.email);
    try {
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        console.log('[REGISTER] Email exists:', validatedData.email);
        return res.status(400).json({ message: "Email already exists" });
      }
    } catch (error) {
      console.error('[REGISTER] Error checking email:', error);
      return res.status(500).json({ message: "Error checking email availability" });
    }

    // Create user with hashed password
    console.log('[REGISTER] Hashing password...');
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(validatedData.password, 10);
      console.log('[REGISTER] Password hashed successfully');
    } catch (error) {
      console.error('[REGISTER] Error hashing password:', error);
      return res.status(500).json({ message: "Error processing password" });
    }
    
    console.log('[REGISTER] Creating user with:', {
      username: validatedData.username,
      email: validatedData.email,
      password: '***', // Don't log actual password
      firstName: validatedData.username.split(' ')[0] || 'User',
      lastName: validatedData.username.split(' ')[1] || 'Account'
    });
    
    let user;
    try {
      user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.username.split(' ')[0] || 'User',
        lastName: validatedData.username.split(' ')[1] || 'Account'
      });
      console.log('[REGISTER] User created successfully:', { id: user.id, username: user.username });
    } catch (error) {
      console.error('[REGISTER] Error creating user:', error);
      return res.status(500).json({ message: "Error creating user account" });
    }
    
    // Generate JWT tokens for the newly created user
    console.log('[REGISTER] Generating JWT tokens...');
    const tokens = JWTService.generateTokens(user);
    console.log('[REGISTER] Tokens generated successfully');
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    console.log('[REGISTER] User creation completed successfully');
    
    // Return user data with tokens
    res.status(201).json({
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    console.error('=== [REGISTER] ERROR DEBUG ===');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[REGISTER] Error type:', error?.constructor?.name || 'Unknown');
    console.error('[REGISTER] Error message:', errorMessage);
    console.error('[REGISTER] Error stack:', errorStack);
    
    if (error instanceof z.ZodError) {
      console.log('[REGISTER] Zod validation error:', error.errors);
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    
    // Handle specific database errors
    if (error instanceof Error) {
      const lowerCaseMessage = errorMessage.toLowerCase();
      if (lowerCaseMessage.includes('database') || lowerCaseMessage.includes('connection') || lowerCaseMessage.includes('mysql')) {
        console.error('[REGISTER] Database connection error detected');
        return res.status(503).json({ message: "Database service unavailable" });
      }
      
      if (lowerCaseMessage.includes('duplicate') || lowerCaseMessage.includes('already exists')) {
        console.error('[REGISTER] Duplicate entry error detected');
        return res.status(409).json({ message: "Resource already exists" });
      }
    }
    
    console.error('[REGISTER] Unexpected error, passing to error handler');
    next(error);
  } finally {
    console.log('=== [REGISTER] DEBUG END ===');
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Try to find user by username first, then by email
    let user = await storage.getUserByUsername(validatedData.email);
    if (!user) {
      user = await storage.getUserByEmail(validatedData.email);
    }
    
    if (!user || !user.password || !(await bcrypt.compare(validatedData.password, user.password))) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Generate JWT tokens for the authenticated user
    console.log('[LOGIN] Generating JWT tokens...');
    const tokens = JWTService.generateTokens(user);
    console.log('[LOGIN] Tokens generated successfully');
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      tokens
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid request data", errors: error.errors });
    }
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);
  
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user as any;
  res.json(userWithoutPassword);
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token and get new access token
    const result = JWTService.refreshAccessToken(refreshToken);
    
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid refresh token') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    next(error);
  }
});

export default router;