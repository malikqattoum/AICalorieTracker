import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

interface CacheConfig {
  defaultTTL?: number;
  maxSize?: number;
  cleanupInterval?: number;
}

export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private config: CacheConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes default TTL
      maxSize: 1000,
      cleanupInterval: 60 * 1000, // 1 minute cleanup interval
      ...config
    };

    this.startCleanupTimer();
  }

  // Set data in cache
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (this.cache.size >= this.config.maxSize!) {
      this.cleanupExpired();
    }

    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, cacheItem);
    await this.saveToStorage();
  }

  // Get data from cache
  async get<T>(key: string): Promise<T | null> {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      return null;
    }

    // Check if item is expired
    if (this.isExpired(cachedItem)) {
      this.cache.delete(key);
      await this.saveToStorage();
      return null;
    }

    return cachedItem.data;
  }

  // Check if key exists in cache
  async has(key: string): Promise<boolean> {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) {
      return false;
    }

    if (this.isExpired(cachedItem)) {
      this.cache.delete(key);
      await this.saveToStorage();
      return false;
    }

    return true;
  }

  // Delete item from cache
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveToStorage();
  }

  // Clear all cache
  async clear(): Promise<void> {
    this.cache.clear();
    await this.saveToStorage();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Get all cache keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;

    this.cache.forEach((item) => {
      if (this.isExpired(item)) {
        expiredCount++;
      }
      totalSize += JSON.stringify(item).length;
    });

    return {
      totalItems: this.cache.size,
      expiredItems: expiredCount,
      totalSizeBytes: totalSize,
      memoryUsage: `${(totalSize / 1024 / 1024).toFixed(2)} MB`
    };
  }

  // Check if item is expired
  private isExpired(item: CacheItem<any>): boolean {
    if (!item.ttl) return false;
    return Date.now() - item.timestamp > item.ttl;
  }

  // Cleanup expired items
  private cleanupExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Save cache to AsyncStorage
  private async saveToStorage(): Promise<void> {
    try {
      const cacheData = Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        data: item.data,
        timestamp: item.timestamp,
        ttl: item.ttl
      }));

      await AsyncStorage.setItem('app_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cache to storage:', error);
    }
  }

  // Load cache from AsyncStorage
  async loadFromStorage(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('app_cache');
      
      if (cacheData) {
        const parsedData = JSON.parse(cacheData);
        
        this.cache.clear();
        
        parsedData.forEach((item: any) => {
          this.cache.set(item.key, {
            data: item.data,
            timestamp: item.timestamp,
            ttl: item.ttl
          });
        });
      }
    } catch (error) {
      console.error('Error loading cache from storage:', error);
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
      this.saveToStorage();
    }, this.config.cleanupInterval);
  }

  // Stop cleanup timer
  stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  // Cache API response
  async cacheApiResponse<T>(key: string, response: T, ttl?: number): Promise<void> {
    await this.set(key, response, ttl);
  }

  // Get cached API response
  async getCachedApiResponse<T>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }

  // Cache user preferences
  async cacheUserPreferences(preferences: any): Promise<void> {
    await this.set('user_preferences', preferences, 24 * 60 * 60 * 1000); // 24 hours TTL
  }

  // Get cached user preferences
  async getCachedUserPreferences(): Promise<any | null> {
    return this.get('user_preferences');
  }

  // Cache health data
  async cacheHealthData(data: any, ttl?: number): Promise<void> {
    await this.set('health_data', data, ttl || 30 * 60 * 1000); // 30 minutes TTL
  }

  // Get cached health data
  async getCachedHealthData(): Promise<any | null> {
    return this.get('health_data');
  }

  // Cache meal data
  async cacheMealData(data: any, ttl?: number): Promise<void> {
    await this.set('meal_data', data, ttl || 60 * 60 * 1000); // 1 hour TTL
  }

  // Get cached meal data
  async getCachedMealData(): Promise<any | null> {
    return this.get('meal_data');
  }

  // Cache analytics data
  async cacheAnalyticsData(data: any, ttl?: number): Promise<void> {
    await this.set('analytics_data', data, ttl || 15 * 60 * 1000); // 15 minutes TTL
  }

  // Get cached analytics data
  async getCachedAnalyticsData(): Promise<any | null> {
    return this.get('analytics_data');
  }

  // Cache premium data
  async cachePremiumData(data: any, ttl?: number): Promise<void> {
    await this.set('premium_data', data, ttl || 10 * 60 * 1000); // 10 minutes TTL
  }

  // Get cached premium data
  async getCachedPremiumData(): Promise<any | null> {
    return this.get('premium_data');
  }

  // Cache real-time data
  async cacheRealTimeData(data: any, ttl?: number): Promise<void> {
    await this.set('real_time_data', data, ttl || 5 * 60 * 1000); // 5 minutes TTL
  }

  // Get cached real-time data
  async getCachedRealTimeData(): Promise<any | null> {
    return this.get('real_time_data');
  }

  // Cache offline data
  async cacheOfflineData(key: string, data: any, ttl?: number): Promise<void> {
    await this.set(`offline_${key}`, data, ttl || 24 * 60 * 60 * 1000); // 24 hours TTL
  }

  // Get cached offline data
  async getCachedOfflineData(key: string): Promise<any | null> {
    return this.get(`offline_${key}`);
  }

  // Get all offline data keys
  async getOfflineDataKeys(): Promise<string[]> {
    const keys: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith('offline_')) {
        keys.push(key.replace('offline_', ''));
      }
    });

    return keys;
  }

  // Clear offline data
  async clearOfflineData(): Promise<void> {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.startsWith('offline_')) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    await this.saveToStorage();
  }

  // Remove cached data by key
  async removeCachedData(key: string): Promise<void> {
    this.cache.delete(key);
    await this.saveToStorage();
  }
}

// Singleton instance
const cacheService = new CacheService();

export default cacheService;