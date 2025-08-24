import { Request, Response, NextFunction } from 'express';
import { log } from '../../vite';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response, options: RateLimitOptions) => void;
  message?: string | object;
  headers?: boolean;
  draftPolliRatelimHeaders?: boolean;
  trustProxy?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  windowMs: number;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimitService {
  private stores = new Map<string, RateLimitStore>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private defaultOptions: Required<RateLimitOptions> = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req: Request) => req.ip || 'unknown',
    onLimitReached: (req: Request, res: Response, options: RateLimitOptions) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: options.message || 'Rate limit exceeded',
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
    message: 'Too many requests from this IP, please try again later.',
    headers: true,
    draftPolliRatelimHeaders: false,
    trustProxy: false,
    legacyHeaders: true,
  };

  /**
   * Create a rate limiting middleware
   */
  createRateLimiter(options: RateLimitOptions) {
    const config = { ...this.defaultOptions, ...options };
    const storeId = this.generateStoreId(config);

    // Initialize store if it doesn't exist
    if (!this.stores.has(storeId)) {
      this.stores.set(storeId, {});
    }

    return this.rateLimiterMiddleware(config, storeId);
  }

  /**
   * Create a global rate limiter for all endpoints
   */
  createGlobalRateLimiter(options: Partial<RateLimitOptions> = {}) {
    return this.createRateLimiter({
      ...options,
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 1000, // Higher limit for global
    });
  }

  /**
   * Create an authentication-specific rate limiter
   */
  createAuthRateLimiter(options: Partial<RateLimitOptions> = {}) {
    return this.createRateLimiter({
      ...options,
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 5, // Stricter limit for auth
      keyGenerator: (req: Request) => {
        // Use IP + User-Agent for auth endpoints to prevent bypass
        return `${req.ip}-${req.get('User-Agent')}`;
      },
    });
  }

  /**
   * Create an API endpoint-specific rate limiter
   */
  createApiRateLimiter(options: Partial<RateLimitOptions> = {}) {
    return this.createRateLimiter({
      ...options,
      windowMs: options.windowMs || 60 * 1000, // 1 minute
      max: options.max || 60, // 60 requests per minute
    });
  }

  /**
   * Create a file upload rate limiter
   */
  createUploadRateLimiter(options: Partial<RateLimitOptions> = {}) {
    return this.createRateLimiter({
      ...options,
      windowMs: options.windowMs || 60 * 1000, // 1 minute
      max: options.max || 10, // 10 uploads per minute
    });
  }

  /**
   * Rate limiting middleware
   */
  private rateLimiterMiddleware(config: Required<RateLimitOptions>, storeId: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = config.keyGenerator(req);
      const store = this.stores.get(storeId)!;
      const now = Date.now();

      // Clean expired entries
      this.cleanupExpiredEntries(store, now);

      // Get or create entry for this key
      let entry = store[key];
      if (!entry || entry.resetTime <= now) {
        entry = {
          count: 0,
          resetTime: now + config.windowMs,
        };
        store[key] = entry;
      }

      // Increment count
      entry.count++;

      // Check if limit exceeded
      if (entry.count > config.max) {
        if (config.headers) {
          this.setRateLimitHeaders(res, config, entry);
        }

        if (config.onLimitReached) {
          config.onLimitReached(req, res, config);
          return;
        }

        res.status(429).json({
          error: 'Too Many Requests',
          message: config.message,
          retryAfter: Math.ceil(config.windowMs / 1000),
        });
        return;
      }

      // Set headers if enabled
      if (config.headers) {
        this.setRateLimitHeaders(res, config, entry);
      }

      // Store the rate limit info on the request object for use in other middleware
      (req as any).rateLimit = {
        limit: config.max,
        remaining: Math.max(0, config.max - entry.count),
        reset: entry.resetTime,
        used: entry.count,
        windowMs: config.windowMs,
      };

      // Call next middleware
      next();
    };
  }

  /**
   * Set rate limit headers
   */
  private setRateLimitHeaders(res: Response, config: Required<RateLimitOptions>, entry: any) {
    const remaining = Math.max(0, config.max - entry.count);
    const resetTime = new Date(entry.resetTime).toISOString();

    if (config.legacyHeaders) {
      res.set('X-RateLimit-Limit', config.max.toString());
      res.set('X-RateLimit-Remaining', remaining.toString());
      res.set('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000).toString());
    }

    if (config.draftPolliRatelimHeaders) {
      res.set('Retry-After', Math.ceil(config.windowMs / 1000).toString());
    }

    // Standard rate limit headers
    res.set('RateLimit-Limit', config.max.toString());
    res.set('RateLimit-Remaining', remaining.toString());
    res.set('RateLimit-Reset', resetTime);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(store: RateLimitStore, now: number): void {
    const keys = Object.keys(store);
    let cleanedCount = 0;

    for (const key of keys) {
      if (store[key].resetTime <= now) {
        delete store[key];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      log(`Cleaned up ${cleanedCount} expired rate limit entries`);
    }
  }

  /**
   * Generate a unique store ID
   */
  private generateStoreId(config: RateLimitOptions): string {
    return `${config.windowMs}-${config.max}-${config.keyGenerator?.name || 'unknown'}`;
  }

  /**
   * Get statistics for all rate limiters
   */
  getStats(): {
    totalStores: number;
    totalEntries: number;
    memoryUsage: number;
    stores: Array<{
      id: string;
      entryCount: number;
      oldestEntry?: number;
    }>;
  } {
    const stores = Array.from(this.stores.entries()).map(([id, store]) => ({
      id,
      entryCount: Object.keys(store).length,
      oldestEntry: Object.values(store).reduce((oldest, entry) => 
        !oldest || entry.resetTime < oldest ? entry.resetTime : oldest, 
        undefined as number | undefined
      ),
    }));

    return {
      totalStores: this.stores.size,
      totalEntries: stores.reduce((sum, store) => sum + store.entryCount, 0),
      memoryUsage: JSON.stringify(this.stores).length,
      stores,
    };
  }

  /**
   * Reset all rate limiters
   */
  resetAll(): void {
    let resetCount = 0;
    const storesArray = Array.from(this.stores.values());
    for (const store of storesArray) {
      const entryCount = Object.keys(store).length;
      Object.keys(store).forEach(key => delete store[key]);
      resetCount += entryCount;
    }
    log(`Reset ${resetCount} rate limit entries across ${this.stores.size} stores`);
  }

  /**
   * Reset rate limiter by store ID
   */
  resetStore(storeId: string): number {
    const store = this.stores.get(storeId);
    if (!store) {
      return 0;
    }

    const entryCount = Object.keys(store).length;
    Object.keys(store).forEach(key => delete store[key]);
    log(`Reset ${entryCount} rate limit entries for store: ${storeId}`);
    return entryCount;
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval(interval: number = 5 * 60 * 1000): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let totalCleaned = 0;

      const storesArray = Array.from(this.stores.values());
      for (const store of storesArray) {
        const keys = Object.keys(store);
        let cleanedCount = 0;

        for (const key of keys) {
          if (store[key].resetTime <= now) {
            delete store[key];
            cleanedCount++;
          }
        }

        totalCleaned += cleanedCount;
      }

      if (totalCleaned > 0) {
        log(`Cleaned up ${totalCleaned} expired rate limit entries`);
      }
    }, interval);

    log(`Started rate limit cleanup interval every ${interval}ms`);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      log('Stopped rate limit cleanup interval');
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.stopCleanupInterval();
    this.resetAll();
    log('Rate limiting service cleaned up');
  }
}

// Export singleton instance
export const rateLimitingService = new RateLimitService();
export default rateLimitingService;