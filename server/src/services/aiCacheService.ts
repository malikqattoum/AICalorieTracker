import { createHash } from 'crypto';
import { log } from '../../vite';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  imageHash?: string; // For image content validation
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
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
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
    log(`Cache get request for key: ${key}`);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      log(`Cache miss - key not found: ${key}`);
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      log(`Cache miss - entry expired for key: ${key}, age: ${(Date.now() - entry.timestamp) / 1000}s, ttl: ${entry.ttl / 1000}s`);
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    log(`Cache hit for key: ${key}, access count: ${entry.accessCount}, age: ${(Date.now() - entry.timestamp) / 1000}s`);
    return entry.data;
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options?: Partial<CacheOptions>): Promise<void> {
    // Validate key
    if (key == null) {
      log(`Invalid cache key: ${key}`);
      return;
    }

    let entrySize: number;
    try {
      entrySize = this.calculateSize(data);
    } catch (error) {
      log(`Failed to calculate size for cache entry:`, error instanceof Error ? error.message : String(error));
      return;
    }

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

    // Store image hash for image-based cache keys
    if (key.includes(':image:')) {
      // For image-based keys, we'll store a placeholder that can be used for validation
      // The actual image hash will be computed during getWithImageValidation
      entry.imageHash = 'placeholder';
    }

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
    // Validate key
    if (key == null) {
      log(`Invalid cache key for deletion: ${key}`);
      return false;
    }

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
    const key = `${service}:${hash}`;
    log(`Generated cache key: ${key} for service: ${service} with params:`, params);
    return key;
  }

  /**
   * Generate content-based cache key using image hash
   */
  generateImageCacheKey(service: string, imageBuffer: Buffer, userId: number, additionalParams?: any): string {
    const imageHash = createHash('sha256').update(imageBuffer).digest('hex');
    const params = {
      userId,
      imageHash,
      ...additionalParams
    };
    const paramString = JSON.stringify(params);
    const hash = createHash('sha256').update(paramString).digest('hex');
    const key = `${service}:image:${hash}`;
    log(`Generated image cache key: ${key} for service: ${service}, userId: ${userId}, imageHash: ${imageHash.substring(0, 8)}..., additionalParams:`, additionalParams);
    return key;
  }

  /**
   * Set data with image hash for validation
   */
  async setWithImageHash<T>(
    key: string,
    data: T,
    imageBuffer: Buffer,
    options?: Partial<CacheOptions>
  ): Promise<void> {
    // Validate key
    if (key == null) {
      log(`Invalid cache key: ${key}`);
      return;
    }

    let entrySize: number;
    try {
      entrySize = this.calculateSize(data);
    } catch (error) {
      log(`Failed to calculate size for cache entry:`, error instanceof Error ? error.message : String(error));
      return;
    }

    // Check if we need to evict entries
    this.ensureCapacity(entrySize);

    const ttl = options?.ttl ?? this.options.ttl;
    const imageHash = createHash('sha256').update(imageBuffer).digest('hex');
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccessed: Date.now(),
      size: entrySize,
      imageHash,
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

    log(`Cache set with image hash for key: ${key}, hash: ${imageHash.substring(0, 8)}...`);
  }

  /**
   * Get cached result with image content validation
   */
  async getWithImageValidation<T>(
    key: string,
    imageBuffer: Buffer,
    userId: number
  ): Promise<T | null> {
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

    // Validate image content by comparing hashes
    const currentImageHash = createHash('sha256').update(imageBuffer).digest('hex');
    const cachedImageHash = entry.imageHash;

    log(`Image validation for key: ${key}`);
    log(`Current image hash: ${currentImageHash.substring(0, 8)}...`);
    log(`Cached image hash: ${cachedImageHash ? cachedImageHash.substring(0, 8) + '...' : 'null'}`);

    if (cachedImageHash && currentImageHash !== cachedImageHash) {
      // Image content has changed, invalidate cache
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      log(`Cache invalidated due to image content change for key: ${key}`);
      log(`Hash mismatch - current: ${currentImageHash}, cached: ${cachedImageHash}`);
      return null;
    }

    if (!cachedImageHash) {
      log(`No cached image hash found for key: ${key}, treating as cache miss`);
    } else {
      log(`Image hash validation passed for key: ${key}`);
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    log(`Cache hit with image validation for key: ${key}`);
    return entry.data;
  }

  /**
   * Extract image hash from cache key
   */
  private extractImageHashFromKey(key: string): string | null {
    try {
      // Key format: service:image:hash where hash is derived from params
      const parts = key.split(':');
      if (parts.length >= 3 && parts[1] === 'image') {
        // The hash is the last part, but we need the original image hash
        // For now, we'll store the image hash in the cache entry metadata
        const entry = this.cache.get(key);
        if (entry && (entry as any).imageHash) {
          return (entry as any).imageHash;
        }
        // If no image hash stored, return null to force revalidation
        return null;
      }
    } catch (error) {
      log(`Error extracting image hash from key: ${error instanceof Error ? error.message : String(error)}`);
    }
    return null;
  }

  /**
   * Invalidate cache entries by image hash pattern
   */
  async invalidateByImageHash(imageHash: string): Promise<number> {
    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    // Use Array.from to avoid iterator issues
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (key.includes(imageHash)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (await this.delete(key)) {
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      log(`Invalidated ${invalidatedCount} cache entries for image hash: ${imageHash}`);
    }

    return invalidatedCount;
  }

  /**
   * Enhanced cache invalidation with pattern matching
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    let invalidatedCount = 0;
    const keysToDelete: string[] = [];

    // Use Array.from to avoid iterator issues
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      if (await this.delete(key)) {
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      log(`Invalidated ${invalidatedCount} cache entries matching pattern: ${pattern}`);
    }

    return invalidatedCount;
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
  cleanupExpiredEntries(): void {
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
   * Reset statistics (for testing purposes)
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      entries: 0,
      hitRate: 0,
      compressionSavings: 0,
    };
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

// Export class for testing purposes
export { AICacheService };