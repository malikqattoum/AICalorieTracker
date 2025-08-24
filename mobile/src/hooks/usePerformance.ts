import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { PerformanceOptimizer } from '../utils/performanceOptimizer';
import { PerformanceMetrics } from '../utils/monitoring';

interface PerformanceOptions {
  enableDebounce?: boolean;
  enableThrottle?: boolean;
  enableMemoization?: boolean;
  enableVirtualization?: boolean;
  enableLazyLoading?: boolean;
  enableImageOptimization?: boolean;
  enableCacheOptimization?: boolean;
  enableNetworkOptimization?: boolean;
}

interface VirtualizedListProps {
  data: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  overscan?: number;
}

interface OptimizedImageProps {
  source: { uri: string };
  style?: any;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

interface OptimizedRequestOptions {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  cacheKey?: string;
  cacheDuration?: number;
}

/**
 * Custom React hook for performance optimization in mobile applications
 */
export const usePerformance = (options: PerformanceOptions = {}) => {
  const {
    enableDebounce = true,
    enableThrottle = true,
    enableMemoization = true,
    enableVirtualization = true,
    enableLazyLoading = true,
    enableImageOptimization = true,
    enableCacheOptimization = true,
    enableNetworkOptimization = true,
  } = options;

  // Debounce utility
  const useDebounce = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) => {
    return useMemo(
      () => (enableDebounce ? PerformanceOptimizer.debounce(callback, delay) : callback),
      [callback, delay, enableDebounce]
    );
  };

  // Throttle utility
  const useThrottle = <T extends (...args: any[]) => any>(
    callback: T,
    limit: number
  ) => {
    return useMemo(
      () => (enableThrottle ? PerformanceOptimizer.throttle(callback, limit) : callback),
      [callback, limit, enableThrottle]
    );
  };

  // Memoization utility
  const useMemoize = <T extends (...args: any[]) => any>(
    callback: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ) => {
    return useMemo(
      () => (enableMemoization ? PerformanceOptimizer.memoize(callback, keyGenerator) : callback),
      [callback, keyGenerator, enableMemoization]
    );
  };

  // Virtualized list component
  const useVirtualizedList = ({
    data,
    itemHeight,
    containerHeight,
    renderItem,
    overscan = 5,
  }: VirtualizedListProps) => {
    const virtualizedConfig = useMemo(() => {
      if (!enableVirtualization) return null;
      
      return PerformanceOptimizer.getVirtualizedConfig(
        data.length,
        itemHeight,
        containerHeight,
        overscan
      );
    }, [data.length, itemHeight, containerHeight, overscan, enableVirtualization]);

    const visibleData = useMemo(() => {
      if (!virtualizedConfig) return data;
      
      const { visibleRange } = virtualizedConfig;
      return data.slice(visibleRange.startIndex, visibleRange.endIndex);
    }, [data, virtualizedConfig]);

    const getItemLayout = useCallback(
      (index: number) => {
        if (!virtualizedConfig) return null;
        return virtualizedConfig.getItemLayout(index);
      },
      [virtualizedConfig]
    );

    return {
      data: visibleData,
      getItemLayout,
      virtualizedConfig,
    };
  };

  // Optimized image component
  const useOptimizedImage = ({ source, style, quality = 0.8, onLoad, onError }: OptimizedImageProps) => {
    const optimizedSource = useMemo(() => {
      if (!enableImageOptimization || !source?.uri) return source;
      
      return {
        ...source,
        uri: PerformanceOptimizer.optimizeImageUri(source.uri, quality),
      };
    }, [source, quality, enableImageOptimization]);

    const handleLoad = useCallback(() => {
      onLoad?.();
    }, [onLoad]);

    const handleError = useCallback(() => {
      onError?.();
    }, [onError]);

    return {
      source: optimizedSource,
      style,
      onLoad: handleLoad,
      onError: handleError,
    };
  };

  // Optimized network request
  const useOptimizedRequest = <T,>(
    requestFn: () => Promise<T>,
    requestOptions: OptimizedRequestOptions = {}
  ) => {
    const optimizedRequest = useCallback(async () => {
      if (!enableNetworkOptimization) {
        return requestFn();
      }
      
      return PerformanceOptimizer.optimizeNetworkRequest(requestFn, requestOptions);
    }, [requestFn, requestOptions, enableNetworkOptimization]);

    return optimizedRequest;
  };

  // Performance monitoring
  const usePerformanceMonitor = (componentName: string) => {
    const renderCount = useRef(0);
    const renderTimes = useRef<number[]>([]);

    useEffect(() => {
      renderCount.current += 1;
    });

    const startRender = useCallback(() => {
      return PerformanceOptimizer.startComponentMonitoring(componentName);
    }, [componentName]);

    const measureRender = useCallback(() => {
      const trace = startRender();
      return {
        end: () => {
          const duration = trace.end();
          renderTimes.current.push(duration);
          return duration;
        },
      };
    }, [startRender]);

    const getAverageRenderTime = useCallback(() => {
      if (renderTimes.current.length === 0) return 0;
      return renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
    }, []);

    const getRenderCount = useCallback(() => {
      return renderCount.current;
    }, []);

    return {
      startRender,
      measureRender,
      getAverageRenderTime,
      getRenderCount,
      renderTimes: renderTimes.current,
    };
  };

  // Cache optimization
  const useCacheOptimization = () => {
    const optimizeCache = useCallback(async (maxSize?: number) => {
      if (!enableCacheOptimization) return;
      
      await PerformanceOptimizer.optimizeCacheSize(maxSize);
    }, [enableCacheOptimization]);

    return { optimizeCache };
  };

  // Batch operations
  const useBatchOperations = <T,>() => {
    const batchOperations = useCallback(async (
      operations: (() => Promise<T>)[],
      batchSize?: number,
      delay?: number
    ) => {
      return PerformanceOptimizer.batchOperations(operations, batchSize, delay);
    }, []);

    return { batchOperations };
  };

  // Memory monitoring
  const useMemoryMonitoring = () => {
    const [memoryInfo, setMemoryInfo] = useState<any>(null);

    const checkMemory = useCallback(async () => {
      const info = await PerformanceOptimizer.monitorMemoryUsage();
      setMemoryInfo(info);
    }, []);

    useEffect(() => {
      // Check memory periodically in development
      if (__DEV__) {
        const interval = setInterval(checkMemory, 30000); // Every 30 seconds
        return () => clearInterval(interval);
      }
    }, [checkMemory]);

    return { memoryInfo, checkMemory };
  };

  // Performance measurement
  const usePerformanceMeasurement = <T,>(operationName: string) => {
    const measureOperation = useCallback(async (operation: () => Promise<T>) => {
      return PerformanceOptimizer.measurePerformance(operationName, operation);
    }, [operationName]);

    return { measureOperation };
  };

  return {
    useDebounce,
    useThrottle,
    useMemoize,
    useVirtualizedList,
    useOptimizedImage,
    useOptimizedRequest,
    usePerformanceMonitor,
    useCacheOptimization,
    useBatchOperations,
    useMemoryMonitoring,
    usePerformanceMeasurement,
  };
};

/**
 * Hook for debouncing input values
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for throttling function calls
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef<number>(0);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        return callback(...args);
      }
    },
    [callback, delay]
  ) as T;
};

/**
 * Hook for lazy loading components
 */
export const useLazyLoad = (threshold: number = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  return { ref, isVisible };
};

/**
 * Hook for tracking component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const renderTimes = useRef<number[]>([]);
  const lastRenderTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.current.push(renderTime);
      lastRenderTime.current = renderTime;
    };
  });

  const getAverageRenderTime = useCallback(() => {
    if (renderTimes.current.length === 0) return 0;
    return renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;
  }, []);

  const getRenderCount = useCallback(() => {
    return renderCount.current;
  }, []);

  const getLastRenderTime = useCallback(() => {
    return lastRenderTime.current;
  }, []);

  return {
    getAverageRenderTime,
    getRenderCount,
    getLastRenderTime,
    renderCount: renderCount.current,
    renderTimes: renderTimes.current,
  };
};

export default usePerformance;