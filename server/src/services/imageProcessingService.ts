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
  timeout?: number; // Timeout in milliseconds
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
      stripMetadata = true,
      timeout = 30000 // 30 second default timeout
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
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Image processing timeout after ${timeout}ms`)), timeout);
      });

      // Process with timeout
      const processingPromise = this.processImageWithTimeout(buffer, {
        maxWidth,
        maxHeight,
        quality,
        format,
        optimize,
        stripMetadata,
        timeout
      }, originalPath, optimizedPath);

      return await Promise.race([processingPromise, timeoutPromise]);
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
   * Get image dimensions using actual image processing
   */
  private async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      // Use sharp for actual image processing if available
      const sharp = await this.loadSharp();
      if (sharp) {
        const metadata = await sharp(buffer).metadata();
        return {
          width: metadata.width || 800,
          height: metadata.height || 600
        };
      }

      // Fallback: parse image headers for basic dimensions
      return this.parseImageDimensions(buffer);
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      // Return default dimensions as fallback
      return { width: 800, height: 600 };
    }
  }

  /**
   * Parse basic image dimensions from buffer headers
   */
  private parseImageDimensions(buffer: Buffer): { width: number; height: number } {
    try {
      // JPEG dimensions
      if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
        return this.parseJPEGDimensions(buffer);
      }
      // PNG dimensions
      if (buffer.length >= 8 &&
          buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return this.parsePNGDimensions(buffer);
      }
    } catch (error) {
      console.error('Error parsing image dimensions:', error);
    }
    return { width: 800, height: 600 };
  }

  /**
   * Parse JPEG dimensions
   */
  private parseJPEGDimensions(buffer: Buffer): { width: number; height: number } {
    let i = 2;
    while (i < buffer.length) {
      if (buffer[i] === 0xFF) {
        const marker = buffer[i + 1];
        if (marker >= 0xC0 && marker <= 0xC3) {
          const height = buffer.readUInt16BE(i + 5);
          const width = buffer.readUInt16BE(i + 7);
          return { width, height };
        }
        i += 2 + buffer.readUInt16BE(i + 2);
      } else {
        i++;
      }
    }
    return { width: 800, height: 600 };
  }

  /**
   * Parse PNG dimensions
   */
  private parsePNGDimensions(buffer: Buffer): { width: number; height: number } {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    return { width, height };
  }

  /**
   * Load Sharp library dynamically
   */
  private async loadSharp(): Promise<any | null> {
    try {
      // Use require for dynamic import to avoid TypeScript issues
      const sharp = require('sharp');
      return sharp;
    } catch (error) {
      // Sharp not available, will use fallback
      return null;
    }
  }

  /**
   * Process image with timeout handling
   */
  private async processImageWithTimeout(
    buffer: Buffer,
    options: ImageProcessingOptions,
    originalPath: string,
    optimizedPath: string
  ): Promise<ImageProcessingResult> {
    // Get image dimensions
    const dimensions = await this.getImageDimensions(buffer);

    // Check if optimization is needed
    if (dimensions.width <= options.maxWidth! && dimensions.height <= options.maxHeight! && !options.optimize) {
      // No optimization needed, just copy to cache
      await fs.copyFile(originalPath, optimizedPath);
      const optimizedSize = (await fs.stat(optimizedPath)).size;

      return {
        originalPath,
        optimizedPath,
        originalSize: buffer.length,
        optimizedSize,
        compressionRatio: this.calculateCompressionRatio(buffer.length, optimizedSize),
        format: options.format!,
        dimensions
      };
    }

    // Optimize image
    const optimizedBuffer = await this.optimizeImage(buffer, options);

    // Save optimized image
    await fs.writeFile(optimizedPath, optimizedBuffer);
    const optimizedSize = optimizedBuffer.length;

    return {
      originalPath,
      optimizedPath,
      originalSize: buffer.length,
      optimizedSize,
      compressionRatio: this.calculateCompressionRatio(buffer.length, optimizedSize),
      format: options.format!,
      dimensions
    };
  }

  /**
   * Optimize image using actual processing
   */
  private async optimizeImage(
    buffer: Buffer,
    options: ImageProcessingOptions
  ): Promise<Buffer> {
    try {
      const sharp = await this.loadSharp();
      if (sharp) {
        let pipeline = sharp(buffer);

        // Resize if needed
        if (options.maxWidth || options.maxHeight) {
          pipeline = pipeline.resize(options.maxWidth, options.maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Set quality
        if (options.quality) {
          pipeline = pipeline.jpeg({ quality: options.quality });
        }

        // Convert format if specified
        if (options.format) {
          switch (options.format) {
            case 'jpeg':
              pipeline = pipeline.jpeg({ quality: options.quality || 85 });
              break;
            case 'png':
              pipeline = pipeline.png();
              break;
            case 'webp':
              pipeline = pipeline.webp({ quality: options.quality || 85 });
              break;
          }
        }

        return await pipeline.toBuffer();
      }

      // Fallback: basic optimization
      return this.basicImageOptimization(buffer, options);
    } catch (error) {
      console.error('Error optimizing image:', error);
      return buffer; // Return original buffer on error
    }
  }

  /**
   * Basic image optimization fallback
   */
  private basicImageOptimization(buffer: Buffer, options: ImageProcessingOptions): Buffer {
    // For now, return original buffer
    // In a more complete implementation, you could implement basic compression
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