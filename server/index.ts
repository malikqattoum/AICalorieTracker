import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: path.resolve(__dirname, '.env') });

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./error-handler";
import { securityHeaders, corsMiddleware, sanitizeInput, requestSizeLimiter } from "./security-middleware";
import { createTimeoutMiddleware } from "./src/middleware/timeoutMiddleware";
import healthRouter from "./src/routes/health";
import { errorTrackingService } from "./src/services/errorTrackingService";
import { performanceMonitoringMiddleware } from "./src/utils/performanceMonitor";
import { Logger } from "./src/utils/logger";
import { enhancedSecurityMiddleware, rateLimiters } from "./src/middleware/securityEnhanced";
import { sessionMiddleware, validateSession, refreshSession } from "./src/middleware/secureSession";
import { securityAuditService, securityAuditMiddleware } from "./src/services/securityAuditService";
import { PORT } from "./config";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";

export const app = express();

// Apply JSON middleware before any routes
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Test endpoint to verify JSON parsing works
app.post('/api/test-json-parsing', (req, res) => {
  log('=== JSON PARSING TEST ENDPOINT HIT ===');
  log('Request received for JSON parsing test');
  log('Request body:', JSON.stringify(req.body, null, 2));
  log('Request body type:', typeof req.body);
  
  try {
    res.json({
      success: true,
      message: 'JSON parsing test successful',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('Error in JSON parsing test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete JSON parsing test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// TEMPORARY: Test endpoint completely bypassing all middleware - raw text endpoint
app.post('/api/debug-raw', (req, res) => {
  log('=== DEBUG RAW ENDPOINT HIT ===');
  log('Request received for debug raw test');
  
  // Set raw text response
  res.setHeader('Content-Type', 'text/plain');
  
  try {
    // Just return a simple success message without processing
    res.send('DEBUG ENDPOINT SUCCESS - No CSRF protection detected');
  } catch (error) {
    log('Error in debug raw test:', error instanceof Error ? error.message : String(error));
    res.status(500).send('DEBUG ENDPOINT ERROR');
  }
});

// Test JSON parsing with minimal middleware - placed at the very beginning
app.post('/api/test-minimal-middleware', (req, res) => {
  log('=== MINIMAL MIDDLEWARE TEST ENDPOINT HIT ===');
  log('Request received for minimal middleware test');
  log('Request body (raw):', JSON.stringify(req.body, null, 2));
  log('Request body type:', typeof req.body);
  
  try {
    res.json({
      success: true,
      message: 'Minimal middleware JSON parsing test successful',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('Error in minimal middleware test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete minimal middleware test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


// Test JSON parsing with minimal middleware
app.post('/api/test-minimal-json', (req, res) => {
  log('=== MINIMAL JSON TEST ENDPOINT HIT ===');
  log('Request received for minimal JSON test');
  log('Request body:', JSON.stringify(req.body, null, 2));
  log('Request body type:', typeof req.body);
  
  try {
    res.json({
      success: true,
      message: 'Minimal JSON parsing test successful',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log('Error in minimal JSON test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete minimal JSON test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// TEMPORARY: Test endpoint completely bypassing all middleware
app.post('/api/debug-test', (req, res) => {
  log('=== DEBUG TEST ENDPOINT HIT ===');
  log('Request received for debug test');
  log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const onboardingData = req.body;
    
    // Validate required fields (same as onboarding endpoint)
    const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'primaryGoal'];
    for (const field of requiredFields) {
      if (onboardingData[field] === undefined || onboardingData[field] === null || onboardingData[field] === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate numeric fields
    const numericFields = ['age', 'height', 'weight'];
    for (const field of numericFields) {
      const value = Number(onboardingData[field]);
      if (isNaN(value) || value <= 0) {
        return res.status(400).json({ message: `${field} must be a positive number` });
      }
      onboardingData[field] = value;
    }

    // Validate targetWeight if provided
    if (onboardingData.targetWeight) {
      const targetWeight = Number(onboardingData.targetWeight);
      if (isNaN(targetWeight) || targetWeight <= 0) {
        return res.status(400).json({ message: "targetWeight must be a positive number" });
      }
      onboardingData.targetWeight = targetWeight;
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra-active'];
    if (!validActivityLevels.includes(onboardingData.activityLevel)) {
      return res.status(400).json({ message: "Invalid activity level" });
    }

    // Validate primary goal
    const validGoals = ['lose-weight', 'maintain-weight', 'gain-muscle'];
    if (!validGoals.includes(onboardingData.primaryGoal)) {
      return res.status(400).json({ message: "Invalid primary goal" });
    }

    log('Onboarding validation successful:', onboardingData);
    
    res.json({
      success: true,
      message: "Debug test completed successfully",
      data: onboardingData
    });
  } catch (error) {
    log('Error in debug test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete debug test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Mobile app connectivity test endpoint - placed before any middleware
app.get('/api/mobile-test', (req, res) => {
  log('=== MOBILE TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Mobile app connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// Simple test endpoint that bypasses all middleware
app.get('/api/simple-test', (req, res) => {
  log('=== SIMPLE TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending test response');
  
  res.json({
    success: true,
    message: 'Simple test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// Mobile app connectivity test endpoint - placed before any middleware
app.get('/api/mobile-test', (req, res) => {
  log('=== MOBILE TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Mobile app connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// TEMPORARY: Test endpoint bypassing enhanced security for debugging
app.post('/api/test-onboarding', (req, res) => {
  log('=== TEMPORARY ONBOARDING TEST ENDPOINT HIT ===');
  log('Request received for onboarding test');
  
  try {
    // Simulate the onboarding endpoint logic without enhanced security
    const onboardingData = req.body;
    const userId = 16; // Use our test user ID

    // Validate required fields (same as onboarding endpoint)
    const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'primaryGoal'];
    for (const field of requiredFields) {
      if (onboardingData[field] === undefined || onboardingData[field] === null || onboardingData[field] === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate numeric fields
    const numericFields = ['age', 'height', 'weight'];
    for (const field of numericFields) {
      const value = Number(onboardingData[field]);
      if (isNaN(value) || value <= 0) {
        return res.status(400).json({ message: `${field} must be a positive number` });
      }
      onboardingData[field] = value;
    }

    // Validate targetWeight if provided
    if (onboardingData.targetWeight) {
      const targetWeight = Number(onboardingData.targetWeight);
      if (isNaN(targetWeight) || targetWeight <= 0) {
        return res.status(400).json({ message: "targetWeight must be a positive number" });
      }
      onboardingData.targetWeight = targetWeight;
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra-active'];
    if (!validActivityLevels.includes(onboardingData.activityLevel)) {
      return res.status(400).json({ message: "Invalid activity level" });
    }

    // Validate primary goal
    const validGoals = ['lose-weight', 'maintain-weight', 'gain-muscle'];
    if (!validGoals.includes(onboardingData.primaryGoal)) {
      return res.status(400).json({ message: "Invalid primary goal" });
    }

    log('Onboarding validation successful:', onboardingData);
    
    res.json({
      success: true,
      message: "Onboarding test completed successfully",
      data: onboardingData
    });
  } catch (error) {
    log('Error in onboarding test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete onboarding test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Register API routes FIRST (before any middleware)
console.log('[SERVER] Registering routes...');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV);
console.log('[SERVER] Environment is development:', process.env.NODE_ENV === "development");
registerRoutes(app);
console.log('[SERVER] Routes registered');

// Apply JSON middleware before security middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Apply enhanced security middleware
app.use(enhancedSecurityMiddleware);
app.use(rateLimiters.api);

// Apply timeout middleware globally
app.use(createTimeoutMiddleware());

// Apply session middleware only to protected routes (moved after public routes)

// Add performance monitoring middleware
const logger = new Logger('Performance');
import { defaultPerformanceMonitor } from "./src/utils/performanceMonitor";
app.use(performanceMonitoringMiddleware(defaultPerformanceMonitor, logger));

// Add health check routes (no timeout for health checks)
app.use('/api/health', (req, res, next) => {
  // Skip timeout middleware for health checks
  next();
}, healthRouter);

// Add a 404 handler for API routes that don't exist
app.use('/api/*', (req, res) => {
  console.log(`[API-404] API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
    method: req.method,
    path: req.originalUrl
  });
});

// Add a simple test endpoint for mobile app debugging
app.get('/api/test', (req, res) => {
  log('=== TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending test response');
  
  res.json({
    success: true,
    message: 'Mobile app test endpoint working',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0'
  });
});

// Add a public connectivity test endpoint
app.get('/api/connectivity-test', (req, res) => {
  log('=== CONNECTIVITY TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// Add a database health check endpoint
app.get('/api/health/db', async (req, res) => {
  log('=== DATABASE HEALTH CHECK ENDPOINT HIT ===');
  
  try {
    // Test database connection
    const { storage } = await import('./storage-provider');
    
    // Test site content table access
    const testContent = await storage.getSiteContent('test_key');
    log('Database health check successful');
    
    res.json({
      success: true,
      message: 'Database health check passed',
      timestamp: new Date().toISOString(),
      storageType: storage.constructor.name,
      testContent: testContent
    });
  } catch (error) {
    log('Database health check failed:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      success: false,
      message: 'Database health check failed',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

// Add public routes (no authentication required)
app.get('/api/public/connectivity-test', (req, res) => {
  log('=== PUBLIC CONNECTIVITY TEST ENDPOINT HIT ===');
  log('Request received from mobile app');
  log('Sending connectivity test response');
  
  res.json({
    success: true,
    message: 'Public connectivity test successful',
    timestamp: new Date().toISOString(),
    server: 'AI Calorie Tracker Backend',
    version: '1.0.0',
    ip: req.ip,
    headers: {
      'user-agent': req.get('User-Agent'),
      'x-forwarded-for': req.get('X-Forwarded-For'),
      'x-real-ip': req.get('X-Real-IP')
    }
  });
});

// TEMPORARY: Test endpoint bypassing enhanced security for debugging
app.post('/api/test-onboarding', async (req, res) => {
  log('=== TEMPORARY ONBOARDING TEST ENDPOINT HIT ===');
  log('Request received for onboarding test');
  
  try {
    // Simulate the onboarding endpoint logic without enhanced security
    const onboardingData = req.body;
    const userId = 16; // Use our test user ID

    // Validate required fields (same as onboarding endpoint)
    const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'primaryGoal'];
    for (const field of requiredFields) {
      if (onboardingData[field] === undefined || onboardingData[field] === null || onboardingData[field] === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate numeric fields
    const numericFields = ['age', 'height', 'weight'];
    for (const field of numericFields) {
      const value = Number(onboardingData[field]);
      if (isNaN(value) || value <= 0) {
        return res.status(400).json({ message: `${field} must be a positive number` });
      }
      onboardingData[field] = value;
    }

    // Validate targetWeight if provided
    if (onboardingData.targetWeight) {
      const targetWeight = Number(onboardingData.targetWeight);
      if (isNaN(targetWeight) || targetWeight <= 0) {
        return res.status(400).json({ message: "targetWeight must be a positive number" });
      }
      onboardingData.targetWeight = targetWeight;
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra-active'];
    if (!validActivityLevels.includes(onboardingData.activityLevel)) {
      return res.status(400).json({ message: "Invalid activity level" });
    }

    // Validate primary goal
    const validGoals = ['lose-weight', 'maintain-weight', 'gain-muscle'];
    if (!validGoals.includes(onboardingData.primaryGoal)) {
      return res.status(400).json({ message: "Invalid primary goal" });
    }

    log('Onboarding validation successful:', onboardingData);
    
    res.json({
      success: true,
      message: "Onboarding test completed successfully",
      data: onboardingData
    });
  } catch (error) {
    log('Error in onboarding test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete onboarding test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// TEMPORARY: Test endpoint completely bypassing all middleware
app.post('/api/debug-test', (req, res) => {
  log('=== DEBUG TEST ENDPOINT HIT ===');
  log('Request received for debug test');
  log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const onboardingData = req.body;
    
    // Validate required fields (same as onboarding endpoint)
    const requiredFields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'primaryGoal'];
    for (const field of requiredFields) {
      if (onboardingData[field] === undefined || onboardingData[field] === null || onboardingData[field] === '') {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate numeric fields
    const numericFields = ['age', 'height', 'weight'];
    for (const field of numericFields) {
      const value = Number(onboardingData[field]);
      if (isNaN(value) || value <= 0) {
        return res.status(400).json({ message: `${field} must be a positive number` });
      }
      onboardingData[field] = value;
    }

    // Validate targetWeight if provided
    if (onboardingData.targetWeight) {
      const targetWeight = Number(onboardingData.targetWeight);
      if (isNaN(targetWeight) || targetWeight <= 0) {
        return res.status(400).json({ message: "targetWeight must be a positive number" });
      }
      onboardingData.targetWeight = targetWeight;
    }

    // Validate activity level
    const validActivityLevels = ['sedentary', 'light', 'moderate', 'active', 'extra-active'];
    if (!validActivityLevels.includes(onboardingData.activityLevel)) {
      return res.status(400).json({ message: "Invalid activity level" });
    }

    // Validate primary goal
    const validGoals = ['lose-weight', 'maintain-weight', 'gain-muscle'];
    if (!validGoals.includes(onboardingData.primaryGoal)) {
      return res.status(400).json({ message: "Invalid primary goal" });
    }

    log('Onboarding validation successful:', onboardingData);
    
    res.json({
      success: true,
      message: "Debug test completed successfully",
      data: onboardingData
    });
  } catch (error) {
    log('Error in debug test:', error instanceof Error ? error.message : String(error));
    res.status(500).json({
      message: "Failed to complete debug test",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Add protected routes with session validation
app.use('/api/auth/refresh', sessionMiddleware, validateSession, refreshSession);
// Note: Individual routes will handle their own authentication middleware

// Install global error handlers
errorTrackingService.installGlobalHandlers();

// Install security audit middleware
app.use(securityAuditMiddleware);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Enhanced diagnostic logging for mobile app debugging
      log(`=== API RESPONSE DEBUG ===`);
      log(`Method: ${req.method}`);
      log(`Path: ${path}`);
      log(`Status: ${res.statusCode}`);
      log(`Duration: ${duration}ms`);
      log(`Content-Type: ${res.get('content-type')}`);
      log(`Content-Length: ${res.get('content-length')}`);
      
      if (capturedJsonResponse) {
        log(`Response Data Type: ${typeof capturedJsonResponse}`);
        log(`Response Data Size: ${JSON.stringify(capturedJsonResponse).length} chars`);
        log(`Response Data: ${JSON.stringify(capturedJsonResponse).substring(0, 200)}${JSON.stringify(capturedJsonResponse).length > 200 ? '...' : ''}`);
      } else {
        log(`No JSON response captured`);
      }
      log(`=========================`);

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  let server: Server;
  
// Set up server configuration
if (process.env.NODE_ENV === "development") {
  // In development with concurrent setup, don't use Vite middleware
  // The Vite dev server (running on port 3000) will handle the frontend
  // and proxy API requests to this server (port 3002)
  server = createServer(app);
  console.log('[SERVER] Development mode: Express server running on port 3002 for API routes');
  console.log('[SERVER] Vite dev server running on port 3000 for frontend with API proxy');
} else {
  server = createServer(app);
  serveStatic(app);
  console.log('[SERVER] Production mode: Using static file serving');
}
  
  // Add test endpoint after routes are registered
  app.post('/api/test-json', (req, res) => {
    console.log('=== JSON TEST ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    
    res.json({
      success: true,
      message: 'JSON parsing test successful',
      receivedData: req.body,
      timestamp: new Date().toISOString()
    });
  });

  // Add minimal middleware test endpoint after routes are registered
  app.post('/api/test-minimal-middleware', (req, res) => {
    log('=== MINIMAL MIDDLEWARE TEST ENDPOINT HIT ===');
    log('Request received for minimal middleware test');
    log('Request body (raw):', JSON.stringify(req.body, null, 2));
    log('Request body type:', typeof req.body);
    
    try {
      res.json({
        success: true,
        message: 'Minimal middleware JSON parsing test successful',
        receivedData: req.body,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      log('Error in minimal middleware test:', error instanceof Error ? error.message : String(error));
      res.status(500).json({
        message: "Failed to complete minimal middleware test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Use centralized error handling middleware (after all routes)
  app.use(errorHandler);

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || PORT;
  // Increase server connection limits
  server.maxConnections = 100;
  server.timeout = 60000; // 60 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds

  const serverInstance = server!.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    log('SIGTERM received, shutting down gracefully');
    await errorTrackingService.flush();
    serverInstance.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  });

  process.on('SIGINT', async () => {
    log('SIGINT received, shutting down gracefully');
    await errorTrackingService.flush();
    serverInstance.close(() => {
      log('Process terminated');
      process.exit(0);
    });
  });

  return serverInstance;
})();
