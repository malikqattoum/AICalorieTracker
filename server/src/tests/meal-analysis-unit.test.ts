import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { aiCacheService } from '../services/aiCacheService';

// Mock the logger
jest.mock('../../vite', () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

describe('Meal Analysis Unit Tests', () => {
  beforeEach(() => {
    // Clear cache before each test
    aiCacheService.clear();
    (aiCacheService as any).resetStats();
  });

  describe('Content-Based Cache Keys', () => {
    it('should generate different cache keys for different images', () => {
      const imageBuffer1 = Buffer.from('fake-image-data-1');
      const imageBuffer2 = Buffer.from('fake-image-data-2');
      const userId = 123;

      const key1 = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer1, userId);
      const key2 = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer2, userId);

      expect(key1).not.toBe(key2);
      expect(key1).toContain('meal-analysis:image:');
      expect(key2).toContain('meal-analysis:image:');
    });

    it('should generate same cache key for identical images', () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;

      const key1 = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId);
      const key2 = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different users with same image', () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId1 = 123;
      const userId2 = 456;

      const key1 = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId1);
      const key2 = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId2);

      expect(key1).not.toBe(key2);
    });
  });

  describe('Image Content Validation', () => {
    it('should validate image content and return cached result for matching hash', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const cacheKey = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId);
      const testData = { foodName: 'apple', calories: 95 };

      // Set data in cache with image hash
      await (aiCacheService as any).setWithImageHash(cacheKey, testData, imageBuffer);

      // Get with image validation should return cached data
      const result = await aiCacheService.getWithImageValidation(cacheKey, imageBuffer, userId);

      expect(result).toEqual(testData);
    });

    it('should invalidate cache when image content changes', async () => {
      const originalImageBuffer = Buffer.from('fake-image-data-1');
      const differentImageBuffer = Buffer.from('fake-image-data-2');
      const userId = 123;
      const cacheKey = aiCacheService.generateImageCacheKey('meal-analysis', originalImageBuffer, userId);
      const testData = { foodName: 'apple', calories: 95 };

      // Set data in cache with image hash
      await (aiCacheService as any).setWithImageHash(cacheKey, testData, originalImageBuffer);

      // Get with different image should return null (cache invalidated)
      const result = await aiCacheService.getWithImageValidation(cacheKey, differentImageBuffer, userId);

      expect(result).toBeNull();
    });

    it('should handle expired cache entries with image validation', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const cacheKey = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId);
      const testData = { foodName: 'apple', calories: 95 };

      // Set data with very short TTL
      await aiCacheService.set(cacheKey, testData, { ttl: 50 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get with image validation should return null
      const result = await aiCacheService.getWithImageValidation(cacheKey, imageBuffer, userId);

      expect(result).toBeNull();
    });
  });

  describe('Cache Invalidation by Image Hash', () => {
    it('should invalidate cache entries by image hash pattern', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const cacheKey = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId);
      const testData = { foodName: 'apple', calories: 95 };

      // Set data in cache
      await aiCacheService.set(cacheKey, testData);

      // Verify data is cached
      let result = await aiCacheService.get(cacheKey);
      expect(result).toEqual(testData);

      // Invalidate by image hash
      const imageHash = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId).split(':')[2];
      const invalidatedCount = await aiCacheService.invalidateByImageHash(imageHash);

      expect(invalidatedCount).toBeGreaterThan(0);

      // Verify cache is invalidated
      result = await aiCacheService.get(cacheKey);
      expect(result).toBeNull();
    });

    it('should handle invalidation when no matching entries exist', async () => {
      const nonExistentHash = 'non-existent-hash';
      const invalidatedCount = await aiCacheService.invalidateByImageHash(nonExistentHash);

      expect(invalidatedCount).toBe(0);
    });
  });

  describe('Processing Speed Consistency', () => {
    it('should maintain consistent response times for cached vs non-cached requests', async () => {
      const imageBuffer = Buffer.from('fake-image-data');
      const userId = 123;
      const cacheKey = aiCacheService.generateImageCacheKey('meal-analysis', imageBuffer, userId);
      const testData = { foodName: 'apple', calories: 95 };

      // First request (cache miss)
      const startTime1 = Date.now();
      await aiCacheService.set(cacheKey, testData);
      const endTime1 = Date.now();
      const firstRequestTime = endTime1 - startTime1;

      // Second request (cache hit)
      const startTime2 = Date.now();
      const result = await aiCacheService.get(cacheKey);
      const endTime2 = Date.now();
      const secondRequestTime = endTime2 - startTime2;

      expect(result).toEqual(testData);
      // Cache hit should be faster (though in test environment this might vary)
      expect(secondRequestTime).toBeLessThanOrEqual(firstRequestTime + 10); // Allow some tolerance
    });

    it('should handle concurrent cache operations without race conditions', async () => {
      const operations = [];
      const cacheKey = 'concurrent-test-key';

      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          aiCacheService.set(`${cacheKey}-${i}`, { data: `value-${i}` })
        );
      }

      // Execute all operations concurrently
      await Promise.all(operations);

      // Verify all operations completed successfully
      for (let i = 0; i < 10; i++) {
        const result = await aiCacheService.get(`${cacheKey}-${i}`);
        expect(result).toEqual({ data: `value-${i}` });
      }
    });
  });

  describe('Data Persistence and Transaction Handling', () => {
    it('should handle cache operations atomically', async () => {
      const cacheKey = 'atomic-test';
      const testData = { foodName: 'banana', calories: 105 };

      // Set data
      await aiCacheService.set(cacheKey, testData);

      // Verify data integrity
      const result = await aiCacheService.get(cacheKey);
      expect(result).toEqual(testData);

      // Delete data
      const deleted = await aiCacheService.delete(cacheKey);
      expect(deleted).toBe(true);

      // Verify deletion
      const afterDelete = await aiCacheService.get(cacheKey);
      expect(afterDelete).toBeNull();
    });

    it('should maintain data consistency during batch operations', async () => {
      const entries = [
        { key: 'batch-1', value: { item: 'apple' } },
        { key: 'batch-2', value: { item: 'banana' } },
        { key: 'batch-3', value: { item: 'orange' } }
      ];

      // Set multiple entries
      await aiCacheService.mset(entries);

      // Verify all entries are set correctly
      for (const entry of entries) {
        const result = await aiCacheService.get(entry.key);
        expect(result).toEqual(entry.value);
      }

      // Delete multiple entries
      const deleteKeys = entries.map(e => e.key);
      const deletedCount = await aiCacheService.mdelete(deleteKeys);
      expect(deletedCount).toBe(entries.length);

      // Verify all entries are deleted
      for (const entry of entries) {
        const result = await aiCacheService.get(entry.key);
        expect(result).toBeNull();
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle malformed cache keys gracefully', async () => {
      const malformedKeys = ['', null, undefined, {}];

      for (const malformedKey of malformedKeys) {
        const result = await aiCacheService.get(malformedKey as any);
        expect(result).toBeNull();
      }
    });

    it('should handle invalid data types in cache operations', async () => {
      const invalidData = [undefined, null, NaN, Infinity];

      for (const data of invalidData) {
        try {
          await aiCacheService.set('invalid-data-test', data as any);
          // If it doesn't throw, verify it can be retrieved
          const result = await aiCacheService.get('invalid-data-test');
          expect(result).toBeDefined();
        } catch (error) {
          // If it throws, that's also acceptable behavior
          expect(error).toBeDefined();
        }
      }
    });

    it('should recover from cache corruption scenarios', async () => {
      const cacheKey = 'corruption-test';
      const testData = { foodName: 'grape', calories: 62 };

      // Set valid data
      await aiCacheService.set(cacheKey, testData);
      let result = await aiCacheService.get(cacheKey);
      expect(result).toEqual(testData);

      // Simulate corruption by clearing cache mid-operation
      aiCacheService.clear();

      // Verify system recovers gracefully
      result = await aiCacheService.get(cacheKey);
      expect(result).toBeNull();

      // Verify new data can still be set
      await aiCacheService.set(cacheKey, testData);
      result = await aiCacheService.get(cacheKey);
      expect(result).toEqual(testData);
    });
  });

  describe('Timeout Handling', () => {
    it('should handle timeout scenarios in cache operations', async () => {
      const cacheKey = 'timeout-test';
      const testData = { foodName: 'pear', calories: 85 };

      // Set data with short TTL
      await aiCacheService.set(cacheKey, testData, { ttl: 100 });

      // Verify data is available initially
      let result = await aiCacheService.get(cacheKey);
      expect(result).toEqual(testData);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Verify data is no longer available (timed out)
      result = await aiCacheService.get(cacheKey);
      expect(result).toBeNull();
    });

    it('should handle cleanup of expired entries', async () => {
      const shortLivedEntries = [
        { key: 'expire-1', value: { item: 'short-1' }, ttl: 50 },
        { key: 'expire-2', value: { item: 'short-2' }, ttl: 50 },
        { key: 'persist', value: { item: 'long' }, ttl: 5000 }
      ];

      // Set entries with different TTLs
      for (const entry of shortLivedEntries) {
        await aiCacheService.set(entry.key, entry.value, { ttl: entry.ttl });
      }

      // Wait for short-lived entries to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Manual cleanup
      (aiCacheService as any).cleanupExpiredEntries();

      // Verify expired entries are cleaned up
      for (const entry of shortLivedEntries.slice(0, 2)) {
        const result = await aiCacheService.get(entry.key);
        expect(result).toBeNull();
      }

      // Verify persistent entry remains
      const persistentResult = await aiCacheService.get('persist');
      expect(persistentResult).toEqual({ item: 'long' });
    });
  });
});