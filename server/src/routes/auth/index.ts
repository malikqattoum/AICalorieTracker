import express, { Router, Request, Response, NextFunction } from 'express';
import { registerRateLimiter } from '../../../rate-limiter';
import { z } from 'zod';
import { storage } from '../../../storage-provider';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWTService } from '../../services/auth/jwt.service';

console.log('[AUTH-DEBUG] Auth router file loaded');

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8)
});

console.log('[AUTH-ROUTE] Setting up /api/auth/register route...');
// POST /api/auth/register

// Middleware to log raw request body
const rawBodyLogger = (req: Request, res: Response, next: NextFunction) => {
  let rawBody = '';
  req.on('data', (chunk) => {
    rawBody += chunk.toString();
  });
  req.on('end', () => {
    console.log('[RAW BODY]', rawBody);
    next();
  });
};

// Middleware to validate Content-Type
const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(415).json({
      message: "Unsupported Media Type",
      details: "Content-Type must be application/json"
    });
  }
  next();
};

router.post('/register',
  express.json(),
  validateContentType,
  registerRateLimiter,
  async (req, res, next) => {
  console.log('=== [REGISTER] DEBUG START ===');
  console.log('[REGISTER] Received request:', req.body);
  console.log('[REGISTER] Parsed body type:', typeof req.body);
  console.log('[REGISTER] Headers:', req.headers);
  console.log('[REGISTER] Content-Type:', req.get('content-type'));
  console.log('[REGISTER] Raw headers:', req.rawHeaders);
  
  try {
    console.log('[REGISTER] Environment check - JWT_SECRET set:', !!process.env.JWT_SECRET);
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
      firstName: validatedData.firstName,
      lastName: validatedData.lastName
    });
    
    let user;
    try {
      user = await storage.createUser({
        username: validatedData.username,
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName
      });
      console.log('[REGISTER] User created successfully:', { id: user.id, username: user.username });
    } catch (error) {
      console.error('[REGISTER] Error creating user:', error);
      return res.status(500).json({ message: "Error creating user account" });
    }
    
    // Generate JWT tokens for the newly created user
    console.log('[REGISTER] Generating JWT tokens...');
    const tokens = await JWTService.generateTokens(user);
    console.log('[REGISTER] Tokens value after generateTokens call:', tokens, 'Type:', typeof tokens);
    console.log('[REGISTER] Tokens generated successfully');
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    console.log('[REGISTER] User creation completed successfully');
    
    // Return user data with tokens
    console.log('[REGISTER] About to send response with tokens:', tokens);
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
  console.log('[AUTH-DEBUG] Login route added');
  try {
    console.log('[AUTH-DEBUG] Login handler called for path:', req.path);
    console.log('[LOGIN] Environment check - JWT_SECRET set:', !!process.env.JWT_SECRET);
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by username
    const user = await storage.getUserByUsername(validatedData.username);
    
    if (!user || !user.password || !(await bcrypt.compare(validatedData.password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT tokens for the authenticated user
    console.log('[LOGIN] Generating JWT tokens...');
    const tokens = await JWTService.generateTokens(user);
    console.log('[LOGIN] Tokens value after generateTokens call:', tokens, 'Type:', typeof tokens);
    console.log('[LOGIN] Tokens generated successfully');
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    console.log('[LOGIN] About to send response with tokens:', tokens);
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
router.post('/logout', (req, res) => {
  // For JWT-based authentication, logout is handled client-side
  // by removing the token from storage. Server doesn't need to do anything special.
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-here-1234567890123456';
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, id: number };
    const userId = decoded.userId || decoded.id;

    // Get user from database
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error in /api/auth/me:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check for JWT-specific errors
    if (errorMessage.includes('invalid') || errorMessage.includes('malformed')) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (errorMessage.includes('expired') || errorMessage.includes('TokenExpiredError')) {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    console.log('[REFRESH] Environment check - JWT_SECRET set:', !!process.env.JWT_SECRET);
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }
    
    // Verify refresh token and get new access token
    const result = await JWTService.refreshAccessToken(refreshToken);
    console.log('[REFRESH] Result after refreshAccessToken:', result, 'Type:', typeof result);

    console.log('[REFRESH] About to send response with result:', result);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid refresh token') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    next(error);
  }
});

console.log('[AUTH-DEBUG] Final router stack:', router.stack.map(layer => {
  if (layer.route) {
    return {
      path: layer.route.path,
      methods: Object.keys((layer.route as any).methods || {})
    };
  }
  return 'middleware';
}));

export default router;