import { describe, it, beforeAll, afterAll, expect, beforeEach } from '@jest/globals';
import { aiCacheService } from '../services/aiCacheService';

describe('AI Cache Service', () => {
  let testKey: string;
  let testData: any;

  beforeAll(() => {
    // Setup test data
    testKey = 'test-key';
    testData = {
      id: 1,
      name: 'Test Data',
      value: 'test-value',
      timestamp: Date.now(),
    };
  });

  beforeEach(() => {
    // Clear cache before each test
    aiCacheService.clear();
  });

  afterAll(() => {
    // Cleanup after all tests
    aiCacheService.cleanup();
  });

  describe('Basic Operations', () => {
    it('should set and get data correctly', async () => {
      await aiCacheService.set(testKey, testData);
      const result = await aiCacheService.get(testKey);

      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      const result = await aiCacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      await aiCacheService.set(testKey, testData);
      const exists = await aiCacheService.has(testKey);
      const notExists = await aiCacheService.has('non-existent-key');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });

    it('should delete data correctly', async () => {
      await aiCacheService.set(testKey, testData);
      await aiCacheService.delete(testKey);
      const result = await aiCacheService.get(testKey);

      expect(result).toBeNull();
    });

    it('should clear all data', async () => {
      await aiCacheService.set('key1', { data: 'value1' });
      await aiCacheService.set('key2', { data: 'value2' });
      await aiCacheService.clear();

      const result1 = await aiCacheService.get('key1');
      const result2 = await aiCacheService.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire data after TTL', async () => {
      const shortTTL = 100; // 100ms
      await aiCacheService.set(testKey, testData, { ttl: shortTTL });

      // Data should be available immediately
      let result = await aiCacheService.get(testKey);
      expect(result).toEqual(testData);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, shortTTL + 50));

      // Data should be expired
      result = await aiCacheService.get(testKey);
      expect(result).toBeNull();
    });

    it('should not expire data before TTL', async () => {
      const longerTTL = 1000; // 1 second
      await aiCacheService.set(testKey, testData, { ttl: longerTTL });

      // Wait less than TTL
      await new Promise(resolve => setTimeout(resolve, 100));

      // Data should still be available
      const result = await aiCacheService.get(testKey);
      expect(result).toEqual(testData);
    });
  });

  describe('Batch Operations', () => {
    it('should handle multiple get operations', async () => {
      await aiCacheService.set('key1', { data: 'value1' });
      await aiCacheService.set('key2', { data: 'value2' });
      await aiCacheService.set('key3', { data: 'value3' });

      const results = await aiCacheService.mget(['key1', 'key2', 'key3', 'non-existent']);

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual({ key: 'key1', value: { data: 'value1' } });
      expect(results[1]).toEqual({ key: 'key2', value: { data: 'value2' } });
      expect(results[2]).toEqual({ key: 'key3', value: { data: 'value3' } });
      expect(results[3]).toEqual({ key: 'non-existent', value: null });
    });

    it('should handle multiple set operations', async () => {
      const entries = [
        { key: 'batch1', value: { data: 'value1' } },
        { key: 'batch2', value: { data: 'value2' } },
        { key: 'batch3', value: { data: 'value3' } },
      ];

      await aiCacheService.mset(entries);

      const result1 = await aiCacheService.get('batch1');
      const result2 = await aiCacheService.get('batch2');
      const result3 = await aiCacheService.get('batch3');

      expect(result1).toEqual({ data: 'value1' });
      expect(result2).toEqual({ data: 'value2' });
      expect(result3).toEqual({ data: 'value3' });
    });

    it('should handle multiple delete operations', async () => {
      await aiCacheService.set('del1', { data: 'value1' });
      await aiCacheService.set('del2', { data: 'value2' });
      await aiCacheService.set('keep', { data: 'keep-value' });

      const deletedCount = await aiCacheService.mdelete(['del1', 'del2', 'non-existent']);

      expect(deletedCount).toBe(2);

      const result1 = await aiCacheService.get('del1');
      const result2 = await aiCacheService.get('del2');
      const resultKeep = await aiCacheService.get('keep');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(resultKeep).toEqual({ data: 'keep-value' });
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent keys for same parameters', () => {
      const params1 = { service: 'test', params: { id: 1, name: 'test' } };
      const params2 = { service: 'test', params: { id: 1, name: 'test' } };
      const params3 = { service: 'test', params: { id: 2, name: 'test' } };

      const key1 = aiCacheService.generateCacheKey(params1.service, params1.params);
      const key2 = aiCacheService.generateCacheKey(params2.service, params2.params);
      const key3 = aiCacheService.generateCacheKey(params3.service, params3.params);

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    it('should generate different keys for different services', () => {
      const params = { id: 1, name: 'test' };
      const key1 = aiCacheService.generateCacheKey('service1', params);
      const key2 = aiCacheService.generateCacheKey('service2', params);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      // Set initial data
      await aiCacheService.set(testKey, testData);

      // Get existing key (hit)
      await aiCacheService.get(testKey);

      // Get non-existent key (miss)
      await aiCacheService.get('non-existent');

      const stats = aiCacheService.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(50); // 1 hit out of 2 total requests
    });

    it('should update hit rate correctly', async () => {
      await aiCacheService.set(testKey, testData);

      // Multiple hits
      await aiCacheService.get(testKey);
      await aiCacheService.get(testKey);
      await aiCacheService.get(testKey);

      // Multiple misses
      await aiCacheService.get('non-existent-1');
      await aiCacheService.get('non-existent-2');

      const stats = aiCacheService.getStats();

      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(60); // 3 hits out of 5 total requests
    });

    it('should track cache size and entries', async () => {
      const initialStats = aiCacheService.getStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.entries).toBe(0);

      await aiCacheService.set('key1', { data: 'value1' });
      await aiCacheService.set('key2', { data: 'value2' });

      const stats = aiCacheService.getStats();

      expect(stats.entries).toBe(2);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Cache Eviction', () => {
    it('should evict entries when max size is reached', async () => {
      // Create a cache with small max size
      const smallCache = aiCacheService.constructor({ maxSize: 1000 }); // 1KB

      // Set multiple entries that exceed max size
      for (let i = 0; i < 10; i++) {
        await smallCache.set(`key${i}`, { data: 'x'.repeat(200) }); // Each entry ~400 bytes
      }

      const stats = smallCache.getStats();
      expect(stats.evictions).toBeGreaterThan(0);
    });

    it('should evict least recently used entries first', async () => {
      // Create a cache with small entry limit
      const smallCache = aiCacheService.constructor({ maxEntries: 3 });

      // Set 4 entries (should evict the first one)
      await smallCache.set('key1', { data: 'value1' });
      await smallCache.set('key2', { data: 'value2' });
      await smallCache.set('key3', { data: 'value3' });
      await smallCache.set('key4', { data: 'value4' });

      // key1 should be evicted, key2, key3, key4 should remain
      const result1 = await smallCache.get('key1');
      const result2 = await smallCache.get('key2');
      const result3 = await smallCache.get('key3');
      const result4 = await smallCache.get('key4');

      expect(result1).toBeNull();
      expect(result2).toEqual({ data: 'value2' });
      expect(result3).toEqual({ data: 'value3' });
      expect(result4).toEqual({ data: 'value4' });
    });

    it('should update statistics on eviction', async () => {
      const smallCache = aiCacheService.constructor({ maxEntries: 2 });

      await smallCache.set('key1', { data: 'value1' });
      await smallCache.set('key2', { data: 'value2' });
      await smallCache.set('key3', { data: 'value3' }); // This should evict key1

      const stats = smallCache.getStats();
      expect(stats.evictions).toBe(1);
      expect(stats.entries).toBe(2);
    });
  });

  describe('Cache Entry Information', () => {
    it('should return entry information', async () => {
      await aiCacheService.set(testKey, testData);

      const entryInfo = aiCacheService.getEntryInfo(testKey);

      expect(entryInfo).toBeTruthy();
      expect(entryInfo!.data).toEqual(testData);
      expect(entryInfo!.accessCount).toBe(0); // Not accessed yet
      expect(entryInfo!.timestamp).toBeLessThan(Date.now() + 1000);
      expect(entryInfo!.ttl).toBeGreaterThan(0);
    });

    it('should return null for non-existent entry', async () => {
      const entryInfo = aiCacheService.getEntryInfo('non-existent');
      expect(entryInfo).toBeNull();
    });
  });

  describe('Cache Keys', () => {
    it('should return all cache keys', async () => {
      await aiCacheService.set('key1', { data: 'value1' });
      await aiCacheService.set('key2', { data: 'value2' });
      await aiCacheService.set('key3', { data: 'value3' });

      const keys = aiCacheService.getKeys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys).toHaveLength(3);
    });

    it('should return empty array when cache is empty', async () => {
      const keys = aiCacheService.getKeys();
      expect(keys).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid keys gracefully', async () => {
      // Test with null/undefined keys
      await expect(aiCacheService.get(null as any)).rejects.toThrow();
      await expect(aiCacheService.set(null as any, testData)).rejects.toThrow();
      await expect(aiCacheService.delete(null as any)).rejects.toThrow();
    });

    it('should handle invalid data gracefully', async () => {
      // Test with circular references
      const circularData: any = { data: 'test' };
      circularData.self = circularData;

      // Should not throw, but may not store correctly
      await expect(aiCacheService.set('circular', circularData)).resolves.not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired entries', async () => {
      const shortCache = aiCacheService.constructor({ ttl: 100 }); // 100ms

      await shortCache.set('expire1', { data: 'value1' });
      await shortCache.set('expire2', { data: 'value2' });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Manual cleanup should remove expired entries
      shortCache.cleanupExpiredEntries();

      const result1 = await shortCache.get('expire1');
      const result2 = await shortCache.get('expire2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });
});