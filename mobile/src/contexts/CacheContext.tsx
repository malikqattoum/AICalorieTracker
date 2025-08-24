import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import cacheService from '../services/cacheService';

interface CacheContextType {
  cache: typeof cacheService;
  isCacheLoaded: boolean;
  cacheStats: {
    totalItems: number;
    expiredItems: number;
    totalSizeBytes: number;
    memoryUsage: string;
  };
  refreshCacheStats: () => void;
  clearCache: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

interface CacheProviderProps {
  children: ReactNode;
  autoLoad?: boolean;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({
  children,
  autoLoad = true
}) => {
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    totalItems: 0,
    expiredItems: 0,
    totalSizeBytes: 0,
    memoryUsage: '0 MB'
  });

  // Refresh cache statistics
  const refreshCacheStats = useCallback(() => {
    const stats = cacheService.getStats();
    setCacheStats(stats);
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    await cacheService.clear();
    refreshCacheStats();
  }, [refreshCacheStats]);

  // Clear offline data
  const clearOfflineData = useCallback(async () => {
    await cacheService.clearOfflineData();
    refreshCacheStats();
  }, [refreshCacheStats]);

  // Load cache from storage
  const loadCache = useCallback(async () => {
    try {
      await cacheService.loadFromStorage();
      refreshCacheStats();
      setIsCacheLoaded(true);
    } catch (error) {
      console.error('Error loading cache:', error);
      setIsCacheLoaded(false);
    }
  }, [refreshCacheStats]);

  // Initialize cache
  useEffect(() => {
    if (autoLoad) {
      loadCache();
    } else {
      setIsCacheLoaded(true);
    }
  }, [autoLoad, loadCache]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cacheService.stopCleanupTimer();
    };
  }, []);

  const value: CacheContextType = {
    cache: cacheService,
    isCacheLoaded,
    cacheStats,
    refreshCacheStats,
    clearCache,
    clearOfflineData
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = (): CacheContextType => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

export default CacheContext;