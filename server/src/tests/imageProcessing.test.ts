import { describe, it, beforeAll, afterAll, expect, jest } from '@jest/globals';
import { imageProcessingService, ImageProcessingService } from '../services/imageProcessingService';
import fs from 'fs/promises';
import path from 'path';

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Image Processing Service', () => {
  let imageProcessing: ImageProcessingService;
  let testUploadDir: string;
  let testCacheDir: string;

  beforeAll(async () => {
    testUploadDir = path.join(__dirname, 'test-uploads');
    testCacheDir = path.join(__dirname, 'test-cache');
    imageProcessing = new ImageProcessingService(testUploadDir, testCacheDir);
    
    // Mock file system operations
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(Buffer.from('test-image-data'));
    mockFs.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true
    } as any);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue(['file1.jpg', 'file2.png'].map(name => ({ name, isDirectory: () => false })) as any);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.copyFile.mockResolvedValue(undefined);
  });

  afterAll(async () => {
    // Clean up test directories
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create upload and cache directories', async () => {
      await imageProcessing.initialize();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(testUploadDir, { recursive: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith(testCacheDir, { recursive: true });
    });
  });

  describe('Image Processing', () => {
    const testImageBuffer = Buffer.from('test-image-data');

    it('should process an image successfully', async () => {
      const result = await imageProcessing.processImage(testImageBuffer);
      
      expect(result).toHaveProperty('originalPath');
      expect(result).toHaveProperty('optimizedPath');
      expect(result).toHaveProperty('originalSize');
      expect(result).toHaveProperty('optimizedSize');
      expect(result).toHaveProperty('compressionRatio');
      expect(result).toHaveProperty('format');
      expect(result).toHaveProperty('dimensions');
      
      expect(result.originalSize).toBe(testImageBuffer.length);
      expect(result.format).toBe('jpeg');
      expect(result.compressionRatio).toBeGreaterThanOrEqual(0);
    });

    it('should handle image size validation', async () => {
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB, exceeds 10MB limit
      
      await expect(imageProcessing.processImage(largeBuffer))
        .rejects.toThrow('Image size exceeds maximum limit');
    });

    it('should process image with custom options', async () => {
      const options = {
        maxWidth: 800,
        maxHeight: 600,
        quality: 90,
        format: 'png' as const,
        optimize: true,
        stripMetadata: true
      };

      const result = await imageProcessing.processImage(testImageBuffer, options);
      
      expect(result.format).toBe('png');
    });

    it('should handle base64 string input', async () => {
      const base64Image = testImageBuffer.toString('base64');
      
      const result = await imageProcessing.processImage(base64Image);
      
      expect(result).toHaveProperty('originalPath');
      expect(result).toHaveProperty('optimizedPath');
    });
  });

  describe('Image Validation', () => {
    it('should validate image format correctly', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const invalidBuffer = Buffer.from([0x01, 0x02, 0x03, 0x04]);

      expect(imageProcessing['isValidImageFormat'](jpegBuffer)).toBe(true);
      expect(imageProcessing['isValidImageFormat'](pngBuffer)).toBe(true);
      expect(imageProcessing['isValidImageFormat'](invalidBuffer)).toBe(false);
    });
  });

  describe('Caching', () => {
    it('should cache an image', async () => {
      const imageHash = 'test-hash';
      const result = await imageProcessing.cacheImage(Buffer.from('test-image-data'), imageHash);
      
      expect(result).toContain(imageHash);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(imageHash),
        Buffer.from('test-image-data')
      );
    });

    it('should retrieve cached image if available', async () => {
      const imageHash = 'cached-hash';
      mockFs.access.mockResolvedValueOnce(undefined);
      
      const result = await imageProcessing.getCachedImage(imageHash);
      
      expect(result).toContain(imageHash);
    });

    it('should return null if cached image not available', async () => {
      mockFs.access.mockRejectedValueOnce(new Error('File not found'));
      
      const result = await imageProcessing.getCachedImage('nonexistent-hash');
      
      expect(result).toBeNull();
    });
  });

  describe('Cleanup', () => {
    it('should clean up old cached images', async () => {
      const oldFileTime = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
      const recentFileTime = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
      
      mockFs.stat.mockImplementation((filePath: any) => {
        const filename = path.basename(filePath as string);
        return Promise.resolve({
          size: 1024,
          mtime: filename.includes('old') ? oldFileTime : recentFileTime,
          isFile: () => true
        } as any);
      });

      await imageProcessing.cleanupCache(7 * 24 * 60 * 60 * 1000); // 7 days max age
      
      expect(mockFs.unlink).toHaveBeenCalledTimes(1); // Should delete old file
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple images', async () => {
      const imageBuffers = [
        Buffer.from('image1'),
        Buffer.from('image2'),
        Buffer.from('image3')
      ];

      const results = await imageProcessing.batchProcessImages(imageBuffers);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('originalPath');
        expect(result).toHaveProperty('optimizedPath');
      });
    });

    it('should handle errors in batch processing', async () => {
      const imageBuffers = [
        Buffer.from('valid-image'),
        Buffer.alloc(11 * 1024 * 1024), // Invalid size
        Buffer.from('another-valid-image')
      ];

      mockFs.stat.mockImplementation((filePath) => {
        return Promise.resolve({
          size: 1024,
          mtime: new Date(),
          isFile: () => true
        } as any);
      });

      const results = await imageProcessing.batchProcessImages(imageBuffers);
      
      // Should process valid images and skip invalid ones
      expect(results).toHaveLength(2);
    });
  });

  describe('Storage Statistics', () => {
    it('should return storage statistics', async () => {
      mockFs.stat.mockImplementation((filePath) => {
        return Promise.resolve({
          size: 1024,
          mtime: new Date(),
          isFile: () => true
        } as any);
      });

      const stats = await imageProcessing.getStorageStats();
      
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('averageFileSize');
      expect(stats).toHaveProperty('oldestFile');
      expect(stats).toHaveProperty('newestFile');
      
      expect(stats.totalFiles).toBeGreaterThan(0);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should handle empty cache directory', async () => {
      mockFs.readdir.mockRejectedValueOnce(new Error('Directory not found'));
      
      const stats = await imageProcessing.getStorageStats();
      
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageFileSize).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should clean up files on processing error', async () => {
      mockFs.writeFile.mockImplementationOnce(() => {
        throw new Error('Processing failed');
      });

      await expect(imageProcessing.processImage(Buffer.from('test-image-data')))
        .rejects.toThrow('Processing failed');
      
      // Verify cleanup was attempted
      expect(mockFs.unlink).toHaveBeenCalledTimes(2); // Original and optimized files
    });

    it('should handle file system errors gracefully', async () => {
      mockFs.access.mockRejectedValue(new Error('File system error'));
      
      const result = await imageProcessing.getCachedImage('test-hash');
      
      expect(result).toBeNull();
    });
  });

  describe('Image Information', () => {
    it('should get image information', async () => {
      const imagePath = 'test-image.jpg';
      
      const info = await imageProcessing.getImageInfo(imagePath);
      
      expect(info).toHaveProperty('size');
      expect(info).toHaveProperty('format');
      expect(info).toHaveProperty('dimensions');
      expect(info).toHaveProperty('lastModified');
      
      expect(info.format).toBe('jpg');
      expect(info.size).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should process images efficiently', async () => {
      const startTime = Date.now();
      
      await imageProcessing.processImage(Buffer.from('test-image-data'));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should process within reasonable time (less than 1 second for small image)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle concurrent processing', async () => {
      const imageBuffers = Array(5).fill(null).map(() => Buffer.from('test-image'));
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        imageBuffers.map(buffer => imageProcessing.processImage(buffer))
      );
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(5);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});