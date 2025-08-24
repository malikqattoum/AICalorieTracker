import { Router } from 'express';
import { healthController } from '../controllers/healthController';

const healthRouter = Router();

/**
 * Basic health check endpoint
 * GET /api/health
 * Returns basic health status of the application
 */
healthRouter.get('/', healthController.basicHealthCheck);

/**
 * Detailed health check endpoint
 * GET /api/health/detailed
 * Returns comprehensive health status with metrics
 */
healthRouter.get('/detailed', healthController.detailedHealthCheck);

/**
 * Database health check endpoint
 * GET /api/health/database
 * Returns database-specific health information
 */
healthRouter.get('/database', healthController.databaseHealthCheck);

/**
 * System health check endpoint
 * GET /api/health/system
 * Returns system-level health information
 */
healthRouter.get('/system', healthController.systemHealthCheck);

/**
 * Readiness probe endpoint
 * GET /api/health/ready
 * Kubernetes readiness probe - checks if application is ready to serve traffic
 */
healthRouter.get('/ready', healthController.readinessProbe);

/**
 * Liveness probe endpoint
 * GET /api/health/live
 * Kubernetes liveness probe - checks if application is alive
 */
healthRouter.get('/live', healthController.livenessProbe);

export default healthRouter;