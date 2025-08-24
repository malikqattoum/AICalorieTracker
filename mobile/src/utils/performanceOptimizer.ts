import { log, logError, ENABLE_LOGGING } from '../config';
import { PerformanceMetrics } from './monitoring';

// Performance optimization utilities for React Native applications

export interface PerformanceConfig {
  enableDebounce: boolean;
  enableThrottle: boolean;
  enableMemoization: boolean;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  enableImageOptimization: boolean;
  enableCacheOptimization: boolean;
  enableNetworkOptimization: boolean;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  enableDebounce: true,
  enableThrottle: true,
  enableMemoization: true,
  enableVirtualization: true,
  enableLazyLoading: true,
  enableImageOptimization: true,
  enableCacheOptimization: true,
  enableNetworkOptimization: true,
};

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private config: PerformanceConfig;
  private performanceMetrics: Map<string, number> = new Map();

  constructor(config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG) {
    this.config = config;
  }

  static getInstance(config?: PerformanceConfig): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer(config);
    }
    return PerformanceOptimizer.instance;
  }

  // Debounce function to limit how often a function can be called
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Throttle function to limit how often a function can be called
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Memoization utility for expensive function calls
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key)!;
      }
      
      const result = func(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  // Virtualization helper for large lists
  static getVirtualizedConfig = (
    dataLength: number,
    itemHeight: number,
    containerHeight: number,
    overscan: number = 5
  ) => {
    const visibleRange = {
      startIndex: 0,
      endIndex: Math.ceil(containerHeight / itemHeight) + overscan,
    };

    return {
      dataLength,
      itemHeight,
      containerHeight,
      visibleRange,
      getItemLayout: (index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      }),
    };
  };

  // Image optimization utilities
  static optimizeImageUri = (uri: string, quality: number = 0.8): string => {
    if (!uri) return uri;
    
    // Add quality parameter for web images
    if (uri.includes('http') && !uri.includes('quality')) {
      const separator = uri.includes('?') ? '&' : '?';
      return `${uri}${separator}quality=${Math.round(quality * 100)}`;
    }
    
    return uri;
  };

  // Cache size optimization
  static optimizeCacheSize = async (maxSize: number = 50 * 1024 * 1024): Promise<void> => {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const keys = await AsyncStorage.getAllKeys();
      
      let totalSize = 0;
      const itemsToDelete: string[] = [];
      
      for (const key of keys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            const size = new Blob([value]).size;
            totalSize += size;
            
            if (totalSize > maxSize) {
              itemsToDelete.push(key);
            }
          }
        } catch (error) {
          logError(`Error checking cache size for ${key}:`, error);
        }
      }
      
      if (itemsToDelete.length > 0) {
        await AsyncStorage.multiRemove(itemsToDelete);
        log(`Removed ${itemsToDelete.length} cache items to stay under ${maxSize} bytes limit`);
      }
    } catch (error) {
      logError('Cache optimization failed:', error);
    }
  };

  // Network optimization
  static optimizeNetworkRequest = async <T>(
    requestFn: () => Promise<T>,
    options: {
      timeout?: number;
      retryCount?: number;
      retryDelay?: number;
      cacheKey?: string;
      cacheDuration?: number;
    } = {}
  ): Promise<T> => {
    const {
      timeout = 10000,
      retryCount = 2,
      retryDelay = 1000,
      cacheKey,
      cacheDuration = 5 * 60 * 1000, // 5 minutes
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const startTime = Date.now();
        
        // Check cache first
        if (cacheKey) {
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          const cached = await AsyncStorage.getItem(`cache_${cacheKey}`);
          
          if (cached) {
            const cacheData = JSON.parse(cached);
            if (Date.now() - cacheData.timestamp < cacheDuration) {
              log(`Cache hit for ${cacheKey}`);
              return cacheData.data;
            }
          }
        }

        // Execute request with timeout
        const result = await Promise.race([
          requestFn(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          ),
        ]);

        // Cache the result
        if (cacheKey) {
          const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
          await AsyncStorage.setItem(
            `cache_${cacheKey}`,
            JSON.stringify({
              data: result,
              timestamp: Date.now(),
            })
          );
        }

        const duration = Date.now() - startTime;
        log(`Network request completed in ${duration}ms`);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        logError(`Network request attempt ${attempt + 1} failed:`, error);
        
        if (attempt < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError || new Error('All network attempts failed');
  };

  // Component performance monitoring
  static startComponentMonitoring = (componentName: string) => {
    const startTime = Date.now();
    
    return {
      end: () => {
        const duration = Date.now() - startTime;
        log(`Component ${componentName} rendered in ${duration}ms`);
        
        if (duration > 100) {
          log(`Slow component detected: ${componentName} took ${duration}ms`);
        }
        
        return duration;
      },
    };
  };

  // Memory usage monitoring
  static monitorMemoryUsage = async () => {
    try {
      // This is a simplified memory check - in production you might use specific React Native memory monitoring libraries
      const memoryInfo = {
        timestamp: new Date().toISOString(),
        // Add actual memory monitoring here if available
        // memory: global.performance?.memory?.usedJSHeapSize,
      };
      
      log('Memory usage:', memoryInfo);
      return memoryInfo;
    } catch (error) {
      logError('Memory monitoring failed:', error);
      return null;
    }
  };

  // Batch operations optimization
  static batchOperations = async <T>(
    operations: (() => Promise<T>)[],
    batchSize: number = 5,
    delay: number = 100
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      // Execute batch in parallel
      const batchResults = await Promise.all(
        batch.map(op => PerformanceOptimizer.withErrorHandling(op))
      );
      
      results.push(...batchResults.filter(Boolean) as T[]);
      
      // Add delay between batches to prevent overwhelming the system
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  };

  // Error handling wrapper for operations
  private static async withErrorHandling<T>(
    operation: () => Promise<T>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      logError('Operation failed:', error);
      return null;
    }
  }

  // Performance measurement utilities
  static measurePerformance = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> => {
    const trace = PerformanceMetrics.startTrace(operationName);
    
    try {
      const result = await operation();
      const duration = trace.end();
      
      return { result, duration };
    } catch (error) {
      trace.end();
      throw error;
    }
  };

  // Get performance metrics
  getMetrics = (): Record<string, number> => {
    const metrics: Record<string, number> = {};
    
    this.performanceMetrics.forEach((value, key) => {
      metrics[key] = value;
    });
    
    return metrics;
  };

  // Clear performance metrics
  clearMetrics = (): void => {
    this.performanceMetrics.clear();
  };

  // Log performance summary
  logPerformanceSummary = (): void => {
    if (!ENABLE_LOGGING) return;
    
    const metrics = this.getMetrics();
    const slowOperations = Object.entries(metrics).filter(([_, duration]) => duration > 100);
    
    log('Performance Summary:', {
      totalOperations: Object.keys(metrics).length,
      averageDuration: Object.values(metrics).reduce((a, b) => a + b, 0) / Object.values(metrics).length,
      slowOperations: slowOperations.length,
      slowOperationDetails: slowOperations,
    });
  }
}

// Performance monitoring hook for React components
export const usePerformanceMonitor = (componentName: string) => {
  return {
    start: () => PerformanceOptimizer.startComponentMonitoring(componentName),
    measure: <T>(operation: () => Promise<T>) => 
      PerformanceOptimizer.measurePerformance(componentName, operation),
  };
};

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();