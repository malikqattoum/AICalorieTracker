import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  optimize?: boolean;
  stripMetadata?: boolean;
}

export interface ImageProcessingResult {
  originalPath: string;
  optimizedPath: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions: { width: number; height: number };
}

/**
 * Image processing service for optimizing food images
 */
export class ImageProcessingService {
  private uploadDir: string;
  private cacheDir: string;
  private maxFileSize: number;

  constructor(uploadDir: string = 'uploads', cacheDir: string = 'cache', maxFileSize: number = 10 * 1024 * 1024) {
    this.uploadDir = uploadDir;
    this.cacheDir = cacheDir;
    this.maxFileSize = maxFileSize;
  }

  /**
   * Initialize directories
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  /**
   * Process and optimize an image
   */
  async processImage(
    imageData: Buffer | string,
    options: ImageProcessingOptions = {}
  ): Promise<ImageProcessingResult> {
    const {
      maxWidth = 1024,
      maxHeight = 1024,
      quality = 85,
      format = 'jpeg',
      optimize = true,
      stripMetadata = true
    } = options;

    // Convert string to Buffer if needed
    const buffer = typeof imageData === 'string' ? Buffer.from(imageData, 'base64') : imageData;

    // Validate file size
    if (buffer.length > this.maxFileSize) {
      throw new Error(`Image size exceeds maximum limit of ${this.maxFileSize} bytes`);
    }

    // Generate unique filename
    const filename = `${uuidv4()}.${format}`;
    const originalPath = path.join(this.uploadDir, `original_${filename}`);
    const optimizedPath = path.join(this.cacheDir, filename);

    // Save original image
    await fs.writeFile(originalPath, buffer);

    try {
      // Get image dimensions
      const dimensions = await this.getImageDimensions(buffer);

      // Check if optimization is needed
      if (dimensions.width <= maxWidth && dimensions.height <= maxHeight && !optimize) {
        // No optimization needed, just copy to cache
        await fs.copyFile(originalPath, optimizedPath);
        const optimizedSize = (await fs.stat(optimizedPath)).size;

        return {
          originalPath,
          optimizedPath,
          originalSize: buffer.length,
          optimizedSize,
          compressionRatio: this.calculateCompressionRatio(buffer.length, optimizedSize),
          format,
          dimensions
        };
      }

      // Optimize image
      const optimizedBuffer = await this.optimizeImage(buffer, {
        maxWidth,
        maxHeight,
        quality,
        format,
        optimize,
        stripMetadata
      });

      // Save optimized image
      await fs.writeFile(optimizedPath, optimizedBuffer);
      const optimizedSize = optimizedBuffer.length;

      return {
        originalPath,
        optimizedPath,
        originalSize: buffer.length,
        optimizedSize,
        compressionRatio: this.calculateCompressionRatio(buffer.length, optimizedSize),
        format,
        dimensions
      };
    } catch (error) {
      // Clean up files on error
      try {
        await fs.unlink(originalPath);
        if (await this.fileExists(optimizedPath)) {
          await fs.unlink(optimizedPath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    // For now, return default dimensions
    // In a real implementation, you would use a library like sharp or jimp
    return { width: 800, height: 600 };
  }

  /**
   * Optimize image using various techniques
   */
  private async optimizeImage(
    buffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    // For now, return the original buffer
    // In a real implementation, you would use a library like sharp or jimp
    return buffer;
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(originalSize: number, optimizedSize: number): number {
    return ((originalSize - optimizedSize) / originalSize) * 100;
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate image hash for caching
   */
  private generateImageHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get cached image if available
   */
  async getCachedImage(imageHash: string): Promise<string | null> {
    const cachedPath = path.join(this.cacheDir, imageHash);
    
    if (await this.fileExists(cachedPath)) {
      return cachedPath;
    }
    
    return null;
  }

  /**
   * Cache an image
   */
  async cacheImage(buffer: Buffer, imageHash: string): Promise<string> {
    const cachedPath = path.join(this.cacheDir, imageHash);
    await fs.writeFile(cachedPath, buffer);
    return cachedPath;
  }

  /**
   * Clean up old cached images
   */
  async cleanupCache(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    
    try {
      const files = await fs.readdir(this.cacheDir);
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get image information
   */
  async getImageInfo(imagePath: string): Promise<{
    size: number;
    format: string;
    dimensions: { width: number; height: number };
    lastModified: Date;
  }> {
    const stats = await fs.stat(imagePath);
    const dimensions = await this.getImageDimensions(await fs.readFile(imagePath));
    
    return {
      size: stats.size,
      format: path.extname(imagePath).slice(1),
      dimensions,
      lastModified: stats.mtime
    };
  }

  /**
   * Batch process multiple images
   */
  async batchProcessImages(
    imageBuffers: Buffer[],
    options: ImageProcessingOptions = {}
  ): Promise<ImageProcessingResult[]> {
    const results: ImageProcessingResult[] = [];
    
    for (const buffer of imageBuffers) {
      try {
        const result = await this.processImage(buffer, options);
        results.push(result);
      } catch (error) {
        // Log error but continue processing other images
        console.error('Error processing image:', error);
      }
    }
    
    return results;
  }

  /**
   * Validate image format
   */
  isValidImageFormat(buffer: Buffer): boolean {
    // Simple validation - check for common image file signatures
    const signatures = {
      jpeg: [0xff, 0xd8, 0xff],
      png: [0x89, 0x50, 0x4e, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };

    const bufferArray = Array.from(buffer.slice(0, 12));

    for (const [format, signature] of Object.entries(signatures)) {
      if (signature.every((byte, index) => bufferArray[index] === byte)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageFileSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      let oldestFile: Date | null = null;
      let newestFile: Date | null = null;

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        totalSize += stats.size;
        
        if (!oldestFile || stats.mtime < oldestFile) {
          oldestFile = stats.mtime;
        }
        
        if (!newestFile || stats.mtime > newestFile) {
          newestFile = stats.mtime;
        }
      }

      return {
        totalFiles: files.length,
        totalSize,
        averageFileSize: files.length > 0 ? totalSize / files.length : 0,
        oldestFile,
        newestFile
      };
    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        averageFileSize: 0,
        oldestFile: null,
        newestFile: null
      };
    }
  }
}

// Export singleton instance
export const imageProcessingService = new ImageProcessingService();