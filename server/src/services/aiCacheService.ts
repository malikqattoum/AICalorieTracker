import { createHash } from 'crypto';
import { log } from '../../vite';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of entries
  cleanupInterval?: number; // Cleanup interval in milliseconds
  compression?: boolean; // Enable compression for large entries
  compressionThreshold?: number; // Size threshold for compression
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
  hitRate: number;
  compressionSavings: number;
}

class AICacheService {
  private cache = new Map<string, CacheEntry>();
  private options: Required<CacheOptions>;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    entries: 0,
    hitRate: 0,
    compressionSavings: 0,
  };

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 30 * 60 * 1000, // 30 minutes default
      maxSize: 100 * 1024 * 1024, // 100MB default
      maxEntries: 10000, // 10,000 entries default
      cleanupInterval: 5 * 60 * 1000, // 5 minutes default
      compression: true,
      compressionThreshold: 1024, // 1KB default
      ...options,
    };

    this.startCleanupInterval();
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    log(`Cache hit for key: ${key}`);
    return entry.data;
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options?: Partial<CacheOptions>): Promise<void> {
    const entrySize = this.calculateSize(data);
    
    // Check if we need to evict entries
    this.ensureCapacity(entrySize);

    const ttl = options?.ttl ?? this.options.ttl;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: entrySize,
    };

    // Compress large entries if enabled
    if (this.options.compression && entrySize > this.options.compressionThreshold!) {
      try {
        const compressed = await this.compressData(data);
        entry.data = compressed;
        entry.size = this.calculateSize(compressed);
        this.stats.compressionSavings += entrySize - entry.size;
      } catch (error) {
        log(`Failed to compress cache entry:`, error instanceof Error ? error.message : String(error));
      }
    }

    this.cache.set(key, entry);
    this.stats.size += entry.size;
    this.stats.entries++;

    log(`Cache set for key: ${key}, size: ${entry.size} bytes`);
  }

  /**
   * Delete data from cache
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.stats.size -= entry.size;
    this.stats.entries--;

    log(`Cache deleted for key: ${key}`);
    return true;
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.size -= entry.size;
      this.stats.entries--;
      return false;
    }

    return true;
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<Array<{ key: string; value: T | null }>> {
    const results = await Promise.all(
      keys.map(async (key) => ({
        key,
        value: await this.get<T>(key),
      }))
    );

    return results;
  }

  /**
   * Set multiple values in cache
   */
  async mset<T>(entries: Array<{ key: string; value: T; options?: Partial<CacheOptions> }>): Promise<void> {
    await Promise.all(
      entries.map(async ({ key, value, options }) => {
        await this.set(key, value, options);
      })
    );
  }

  /**
   * Delete multiple keys from cache
   */
  async mdelete(keys: string[]): Promise<number> {
    let deletedCount = 0;
    
    for (const key of keys) {
      if (await this.delete(key)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const entryCount = this.cache.size;
    this.cache.clear();
    this.stats.size = 0;
    this.stats.entries = 0;

    log(`Cleared ${entryCount} cache entries`);
  }

  /**
   * Generate cache key from request parameters
   */
  generateCacheKey(service: string, params: any): string {
    const paramString = JSON.stringify(params);
    const hash = createHash('sha256').update(paramString).digest('hex');
    return `${service}:${hash}`;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entry information
   */
  getEntryInfo(key: string): CacheEntry | null {
    return this.cache.get(key) || null;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: any): number {
    return JSON.stringify(data).length * 2; // Rough estimate in bytes
  }

  /**
   * Compress data (simulated)
   */
  private async compressData<T>(data: T): Promise<T> {
    // In a real implementation, you would use a compression library like pako or node-zlib
    // For now, we'll just return the data as-is
    return data;
  }

  /**
   * Ensure cache capacity
   */
  private ensureCapacity(newEntrySize: number): void {
    // Check total size limit
    while (this.stats.size + newEntrySize > this.options.maxSize && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }

    // Check entry count limit
    while (this.cache.size >= this.options.maxEntries && this.cache.size > 0) {
      this.evictLeastRecentlyUsed();
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.cache.delete(oldestKey);
      this.stats.size -= entry.size;
      this.stats.entries--;
      this.stats.evictions++;

      log(`Evicted cache entry: ${oldestKey}`);
    }
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.options.cleanupInterval);

    log(`Started cache cleanup interval every ${this.options.cleanupInterval}ms`);
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    let cleanedSize = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedSize += entry.size;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.stats.size -= cleanedSize;
      this.stats.entries -= cleanedCount;
      this.stats.evictions += cleanedCount;

      log(`Cleaned up ${cleanedCount} expired cache entries, ${cleanedSize} bytes`);
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.clear();
    log('AI cache service cleaned up');
  }
}

// Export singleton instance
export const aiCacheService = new AICacheService();
export default aiCacheService;