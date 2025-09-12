import express, { Router, Request, Response, NextFunction } from 'express';
import { registerRateLimiter } from '../../../rate-limiter';
import { z } from 'zod';
import { storage } from '../../../storage-provider';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JWTService } from '../../services/auth/jwt.service';
import { requirePremium, requireOwnership } from '../../middleware/premiumCheck';
import { authenticate } from '../../middleware/auth';
import { pool } from '../../db';

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


router.post('/register',
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
router.get('/me', authenticate, requireOwnership('id'), async (req, res) => {
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
    const accessToken = await JWTService.refreshAccessToken(refreshToken);
    console.log('[REFRESH] Access token after refreshAccessToken:', accessToken, 'Type:', typeof accessToken);

    if (!accessToken || typeof accessToken !== 'string') {
      console.error('[REFRESH] Invalid access token received from JWTService');
      return res.status(500).json({ message: 'Failed to generate access token' });
    }

    console.log('[REFRESH] About to send response with accessToken');
    res.json({ accessToken });
  } catch (error) {
    console.error('[REFRESH] Error during token refresh:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('Invalid refresh token') || errorMessage.includes('Invalid token')) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (errorMessage.includes('Refresh token expired') || errorMessage.includes('expired')) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    if (errorMessage.includes('User not found')) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (errorMessage.includes('Invalid refresh token format')) {
      return res.status(400).json({ message: 'Invalid refresh token format' });
    }

    // For any other errors, return a generic server error
    res.status(500).json({ message: 'Token refresh failed' });
  }
});

// GET /api/auth/premium-status
router.get('/premium-status', async (req, res) => {
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

    // Return premium status
    res.json({
      isPremium: user.isPremium || false,
      subscriptionType: user.subscriptionType || null,
      subscriptionStatus: user.subscriptionStatus || null,
      subscriptionEndDate: user.subscriptionEndDate || null
    });
  } catch (error) {
    console.error('Error in /api/auth/premium-status:', error);
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

// GET /api/auth/premium-features - Premium-only endpoint
router.get('/premium-features', requirePremium, async (req, res) => {
  try {
    const user = (req as any).user;

    // Return premium features available to the user
    res.json({
      features: [
        'Advanced Analytics',
        'AI-Powered Insights',
        'Real-time Monitoring',
        'Professional Reports',
        'Healthcare Integration',
        'Custom Goals',
        'Priority Support'
      ],
      user: {
        id: user.id,
        username: user.username,
        isPremium: user.isPremium,
        subscriptionType: user.subscriptionType
      }
    });
  } catch (error) {
    console.error('Error in /api/auth/premium-features:', error);
    res.status(500).json({ error: 'Failed to retrieve premium features' });
  }
});

// GET /api/auth/test-jwt - Diagnostic endpoint for JWT testing
router.get('/test-jwt', async (req, res) => {
  try {
    console.log('[TEST-JWT] Starting JWT diagnostic test...');

    // Check if JWT_SECRET is set
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[TEST-JWT] JWT_SECRET is not set');
      return res.status(500).json({
        success: false,
        message: 'JWT_SECRET environment variable is not set',
        jwtSecretConfigured: false
      });
    }

    console.log('[TEST-JWT] JWT_SECRET is configured');

    // Create a test user payload
    const testPayload = {
      id: 999999,
      userId: 999999,
      email: 'test@example.com',
      username: 'testuser',
      tokenVersion: 1
    };

    console.log('[TEST-JWT] Generating test token...');

    // Generate a test token
    const testToken = jwt.sign(testPayload, jwtSecret, {
      expiresIn: '1h' // Short expiry for testing
    });

    console.log('[TEST-JWT] Test token generated, length:', testToken.length);

    // Validate the token by decoding it
    console.log('[TEST-JWT] Validating test token...');
    const decoded = jwt.verify(testToken, jwtSecret) as any;

    console.log('[TEST-JWT] Token validation successful');

    // Verify the decoded payload matches the original
    const payloadMatches = (
      decoded.id === testPayload.id &&
      decoded.userId === testPayload.userId &&
      decoded.email === testPayload.email &&
      decoded.username === testPayload.username
    );

    console.log('[TEST-JWT] Payload verification:', payloadMatches);

    // Test JWTService token generation as well
    console.log('[TEST-JWT] Testing JWTService.generateTokens...');
    let serviceTestResult = null;

    try {
      const serviceTokens = await JWTService.generateTokens(testPayload);

      if (serviceTokens && serviceTokens.accessToken) {
        console.log('[TEST-JWT] JWTService tokens generated successfully');

        // Validate the service-generated token
        const serviceDecoded = jwt.verify(serviceTokens.accessToken, jwtSecret) as any;
        const servicePayloadMatches = (
          serviceDecoded.id === testPayload.id &&
          serviceDecoded.userId === testPayload.userId &&
          serviceDecoded.email === testPayload.email
        );

        console.log('[TEST-JWT] JWTService token validation successful');

        serviceTestResult = {
          success: true,
          accessTokenLength: serviceTokens.accessToken.length,
          refreshTokenLength: serviceTokens.refreshToken.length,
          validationSuccess: true,
          payloadMatches: servicePayloadMatches
        };
      } else {
        console.error('[TEST-JWT] JWTService returned invalid tokens');
        serviceTestResult = {
          success: false,
          error: 'JWTService returned invalid tokens'
        };
      }
    } catch (serviceError) {
      console.log('[TEST-JWT] JWTService test failed (expected for test user):', serviceError instanceof Error ? serviceError.message : String(serviceError));
      serviceTestResult = {
        success: false,
        error: serviceError instanceof Error ? serviceError.message : String(serviceError),
        note: 'This is expected when testing with a non-existent user ID'
      };
    }

    res.json({
      success: true,
      message: 'JWT system is working properly',
      jwtSecretConfigured: true,
      tests: {
        manualTokenGeneration: {
          success: true,
          tokenLength: testToken.length,
          validationSuccess: true,
          payloadMatches
        },
        jwtServiceGeneration: serviceTestResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[TEST-JWT] Error during JWT test:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      success: false,
      message: 'JWT test failed',
      error: errorMessage,
      jwtSecretConfigured: !!process.env.JWT_SECRET,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/auth/test-session - Diagnostic endpoint for session store testing
router.get('/test-session', async (req, res) => {
  try {
    console.log('[TEST-SESSION] Starting session store diagnostic test...');

    const results = {
      success: false,
      message: 'Session store test completed',
      tests: {
        sessionMiddlewareConfigured: { success: false, message: '' },
        sessionCreation: { success: false, message: '', sessionId: null },
        sessionStorage: { success: false, message: '', stored: false },
        sessionRetrieval: { success: false, message: '', retrieved: false },
        sessionDataIntegrity: { success: false, message: '', matches: false },
        sessionCleanup: { success: false, message: '', cleaned: false }
      },
      sessionInfo: {
        sessionId: null,
        hasSession: false,
        sessionData: null,
        isMySQLStore: false
      },
      timestamp: new Date().toISOString()
    };

    // Test 1: Check if session middleware is configured
    console.log('[TEST-SESSION] Checking session middleware configuration...');
    if (req.session) {
      results.tests.sessionMiddlewareConfigured = {
        success: true,
        message: 'Session middleware is configured'
      };
      results.sessionInfo.hasSession = true;
      console.log('[TEST-SESSION] Session middleware test passed');
    } else {
      results.tests.sessionMiddlewareConfigured = {
        success: false,
        message: 'Session middleware is not configured or not working'
      };
      console.log('[TEST-SESSION] Session middleware test failed');
      return res.status(500).json(results);
    }

    // Test 2: Create a test session
    console.log('[TEST-SESSION] Creating test session...');
    try {
      const testData = {
        testId: `test_${Date.now()}`,
        testValue: 'session_test_data',
        createdAt: new Date().toISOString(),
        userAgent: req.get('User-Agent') || 'unknown'
      };

      // Set session data
      (req.session as any).testData = testData;
      (req.session as any).testTimestamp = Date.now();

      results.tests.sessionCreation = {
        success: true,
        message: 'Test session created successfully',
        sessionId: (req.session as any).id || 'unknown'
      };
      results.sessionInfo.sessionId = (req.session as any).id;
      console.log('[TEST-SESSION] Session creation test passed');
    } catch (creationError) {
      console.error('[TEST-SESSION] Session creation failed:', creationError);
      results.tests.sessionCreation = {
        success: false,
        message: `Session creation failed: ${creationError instanceof Error ? creationError.message : String(creationError)}`,
        sessionId: null
      };
      return res.status(500).json(results);
    }

    // Test 3: Check if session is stored (by checking if it has an ID)
    console.log('[TEST-SESSION] Checking session storage...');
    if ((req.session as any).id) {
      results.tests.sessionStorage = {
        success: true,
        message: 'Session appears to be stored (has ID)',
        stored: true
      };
      console.log('[TEST-SESSION] Session storage test passed');
    } else {
      results.tests.sessionStorage = {
        success: false,
        message: 'Session does not appear to be stored (no ID)',
        stored: false
      };
      console.log('[TEST-SESSION] Session storage test failed');
    }

    // Test 4: Test session retrieval by accessing the data we just set
    console.log('[TEST-SESSION] Testing session retrieval...');
    try {
      const storedTestData = (req.session as any).testData;
      const storedTimestamp = (req.session as any).testTimestamp;

      if (storedTestData && storedTimestamp) {
        results.tests.sessionRetrieval = {
          success: true,
          message: 'Session data retrieved successfully',
          retrieved: true
        };
        results.sessionInfo.sessionData = storedTestData;
        console.log('[TEST-SESSION] Session retrieval test passed');
      } else {
        results.tests.sessionRetrieval = {
          success: false,
          message: 'Session data could not be retrieved',
          retrieved: false
        };
        console.log('[TEST-SESSION] Session retrieval test failed');
      }
    } catch (retrievalError) {
      console.error('[TEST-SESSION] Session retrieval failed:', retrievalError);
      results.tests.sessionRetrieval = {
        success: false,
        message: `Session retrieval failed: ${retrievalError instanceof Error ? retrievalError.message : String(retrievalError)}`,
        retrieved: false
      };
    }

    // Test 5: Check data integrity
    console.log('[TEST-SESSION] Checking session data integrity...');
    try {
      const originalTestData = {
        testId: `test_${(req.session as any).testTimestamp}`,
        testValue: 'session_test_data',
        createdAt: new Date((req.session as any).testTimestamp).toISOString(),
        userAgent: req.get('User-Agent') || 'unknown'
      };

      const storedTestData = (req.session as any).testData;

      if (storedTestData &&
          storedTestData.testId === originalTestData.testId &&
          storedTestData.testValue === originalTestData.testValue) {
        results.tests.sessionDataIntegrity = {
          success: true,
          message: 'Session data integrity verified',
          matches: true
        };
        console.log('[TEST-SESSION] Session data integrity test passed');
      } else {
        results.tests.sessionDataIntegrity = {
          success: false,
          message: 'Session data integrity check failed',
          matches: false
        };
        console.log('[TEST-SESSION] Session data integrity test failed');
      }
    } catch (integrityError) {
      console.error('[TEST-SESSION] Session data integrity check failed:', integrityError);
      results.tests.sessionDataIntegrity = {
        success: false,
        message: `Data integrity check failed: ${integrityError instanceof Error ? integrityError.message : String(integrityError)}`,
        matches: false
      };
    }

    // Test 6: Check if this is using MySQL store
    console.log('[TEST-SESSION] Checking session store type...');
    try {
      // Check if the session store has MySQL-specific methods
      const store = (req.session as any).store || (req.sessionStore);
      if (store && typeof store.query === 'function') {
        results.sessionInfo.isMySQLStore = true;
        console.log('[TEST-SESSION] MySQL session store detected');
      } else {
        results.sessionInfo.isMySQLStore = false;
        console.log('[TEST-SESSION] Not using MySQL session store');
      }
    } catch (storeCheckError) {
      console.log('[TEST-SESSION] Could not determine session store type');
      results.sessionInfo.isMySQLStore = false;
    }

    // Test 7: Clean up test session
    console.log('[TEST-SESSION] Cleaning up test session...');
    try {
      // Clear the test data
      delete (req.session as any).testData;
      delete (req.session as any).testTimestamp;

      results.tests.sessionCleanup = {
        success: true,
        message: 'Test session cleaned up successfully',
        cleaned: true
      };
      console.log('[TEST-SESSION] Session cleanup test passed');
    } catch (cleanupError) {
      console.error('[TEST-SESSION] Session cleanup failed:', cleanupError);
      results.tests.sessionCleanup = {
        success: false,
        message: `Session cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        cleaned: false
      };
    }

    // Determine overall success
    const allTestsPassed = Object.values(results.tests).every(test =>
      test.success === true
    );

    results.success = allTestsPassed;

    if (allTestsPassed) {
      results.message = 'All session store tests passed successfully';
    } else {
      results.message = 'Some session store tests failed';
    }

    const statusCode = results.success ? 200 : 500;
    res.status(statusCode).json(results);

  } catch (error) {
    console.error('[TEST-SESSION] Unexpected error during session test:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      success: false,
      message: 'Session test failed with unexpected error',
      error: errorMessage,
      tests: {
        sessionMiddlewareConfigured: { success: false, message: 'Test not completed due to error' },
        sessionCreation: { success: false, message: 'Test not completed due to error' },
        sessionStorage: { success: false, message: 'Test not completed due to error' },
        sessionRetrieval: { success: false, message: 'Test not completed due to error' },
        sessionDataIntegrity: { success: false, message: 'Test not completed due to error' },
        sessionCleanup: { success: false, message: 'Test not completed due to error' }
      },
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/auth/test-db - Diagnostic endpoint for database connectivity and refresh tokens
router.get('/test-db', async (req, res) => {
  try {
    console.log('[TEST-DB] Starting database diagnostic test...');

    const results = {
      success: true,
      message: 'Database connectivity test completed',
      tests: {
        databaseConnection: { success: false, message: '' },
        refreshTokensTable: { success: false, message: '', exists: false, recordCount: 0 },
        basicQuery: { success: false, message: '' }
      },
      timestamp: new Date().toISOString()
    };

    // Test 1: Database connectivity
    console.log('[TEST-DB] Testing database connectivity...');
    try {
      await pool.execute('SELECT 1 as test');
      results.tests.databaseConnection = {
        success: true,
        message: 'Database connection successful'
      };
      console.log('[TEST-DB] Database connection test passed');
    } catch (dbError) {
      console.error('[TEST-DB] Database connection failed:', dbError);
      results.tests.databaseConnection = {
        success: false,
        message: `Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`
      };
      results.success = false;
    }

    // Test 2: Check if refresh_tokens table exists
    console.log('[TEST-DB] Checking refresh_tokens table existence...');
    try {
      const [tables] = await pool.execute(
        "SHOW TABLES LIKE 'refresh_tokens'"
      );

      const tableExists = (tables as any[]).length > 0;
      results.tests.refreshTokensTable.exists = tableExists;

      if (tableExists) {
        console.log('[TEST-DB] refresh_tokens table exists');

        // Get record count
        const [countResult] = await pool.execute(
          'SELECT COUNT(*) as count FROM refresh_tokens'
        );
        const recordCount = (countResult as any[])[0].count;
        results.tests.refreshTokensTable.recordCount = recordCount;

        results.tests.refreshTokensTable = {
          success: true,
          message: `refresh_tokens table exists with ${recordCount} records`,
          exists: true,
          recordCount
        };
      } else {
        console.log('[TEST-DB] refresh_tokens table does not exist');
        results.tests.refreshTokensTable = {
          success: false,
          message: 'refresh_tokens table does not exist',
          exists: false,
          recordCount: 0
        };
        results.success = false;
      }
    } catch (tableError) {
      console.error('[TEST-DB] Error checking refresh_tokens table:', tableError);
      results.tests.refreshTokensTable = {
        success: false,
        message: `Error checking table: ${tableError instanceof Error ? tableError.message : String(tableError)}`,
        exists: false,
        recordCount: 0
      };
      results.success = false;
    }

    // Test 3: Basic database operations test
    console.log('[TEST-DB] Testing basic database operations...');
    try {
      // Try a simple SELECT query with MariaDB/MySQL compatible syntax
      const [testResult] = await pool.execute('SELECT NOW() as `current_time`, @@version as `mysql_version`');
      const dbInfo = (testResult as any[])[0];

      results.tests.basicQuery = {
        success: true,
        message: `Basic query successful. Database version: ${dbInfo.mysql_version}, Current time: ${dbInfo.current_time}`
      };
      console.log('[TEST-DB] Basic query test passed');
    } catch (queryError) {
      console.error('[TEST-DB] Basic query test failed:', queryError);
      results.tests.basicQuery = {
        success: false,
        message: `Basic query failed: ${queryError instanceof Error ? queryError.message : String(queryError)}`
      };
      results.success = false;
    }

    // Update overall success status
    if (!results.success) {
      results.message = 'Some database tests failed';
    }

    const statusCode = results.success ? 200 : 500;
    res.status(statusCode).json(results);

  } catch (error) {
    console.error('[TEST-DB] Unexpected error during database test:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);

    res.status(500).json({
      success: false,
      message: 'Database test failed with unexpected error',
      error: errorMessage,
      tests: {
        databaseConnection: { success: false, message: 'Test not completed due to error' },
        refreshTokensTable: { success: false, message: 'Test not completed due to error' },
        basicQuery: { success: false, message: 'Test not completed due to error' }
      },
      timestamp: new Date().toISOString()
    });
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