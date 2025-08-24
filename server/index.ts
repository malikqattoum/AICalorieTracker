import 'dotenv/config';
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

export const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Apply enhanced security middleware
app.use(enhancedSecurityMiddleware);
app.use(sessionMiddleware);
app.use(rateLimiters.api);

// Apply timeout middleware globally
app.use(createTimeoutMiddleware());

// Add performance monitoring middleware
const logger = new Logger('Performance');
app.use(performanceMonitoringMiddleware(require("./src/utils/performanceMonitor").defaultPerformanceMonitor, logger));

// Add health check routes (no timeout for health checks)
app.use('/api/health', (req, res, next) => {
  // Skip timeout middleware for health checks
  next();
}, healthRouter);

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

// Add protected routes with session validation
app.use('/api/auth/refresh', validateSession, refreshSession);
app.use('/api/user', validateSession);
app.use('/api/meals', validateSession);
app.use('/api/workouts', validateSession);
app.use('/api/analytics', validateSession);
app.use('/api/premium', validateSession);

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
  const server = await registerRoutes(app);

  // Use centralized error handling middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = process.env.PORT || PORT;
  const serverInstance = server.listen({
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
