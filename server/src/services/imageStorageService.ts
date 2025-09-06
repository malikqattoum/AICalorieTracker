import { createHash } from 'crypto';
import { writeFile, readFile, unlink, mkdir, access, constants } from 'fs/promises';
import { join, dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromBuffer } from 'file-type';
import db from '../db';

// Image storage configuration
const IMAGE_STORAGE_CONFIG = {
  // Storage type: 'local' or 's3'
  storageType: process.env.IMAGE_STORAGE_TYPE || 'local',
  
  // Local storage configuration
  local: {
    basePath: process.env.IMAGE_STORAGE_PATH || './uploads',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    quality: { jpeg: 0.8, png: 0.8, webp: 0.8 },
  },
  
  // S3 configuration (if using S3)
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  
  // Image processing configuration
  processing: {
    maxWidth: 1920,
    maxHeight: 1080,
    thumbnailWidth: 300,
    thumbnailHeight: 300,
    formats: ['webp', 'jpeg'], // Convert to these formats
  },
};

export interface ImageMetadata {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
  thumbnailPath?: string;
  hash: string;
  uploadedAt: Date;
  uploadedBy: number; // user ID
}

export interface ProcessedImage {
  original: ImageMetadata;
  thumbnail?: ImageMetadata;
  optimized: ImageMetadata;
}

class ImageStorageService {
  private initialized = false;

  /**
   * Initialize the image storage service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (IMAGE_STORAGE_CONFIG.storageType === 'local') {
        await this.ensureLocalDirectories();
      }
      
      this.initialized = true;
      console.log('Image storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize image storage service:', error);
      throw error;
    }
  }

  /**
   * Ensure local storage directories exist
   */
  private async ensureLocalDirectories(): Promise<void> {
    const directories = [
      IMAGE_STORAGE_CONFIG.local.basePath,
      join(IMAGE_STORAGE_CONFIG.local.basePath, 'originals'),
      join(IMAGE_STORAGE_CONFIG.local.basePath, 'optimized'),
      join(IMAGE_STORAGE_CONFIG.local.basePath, 'thumbnails'),
    ];

    for (const directory of directories) {
      try {
        await access(directory, constants.R_OK | constants.W_OK);
      } catch {
        await mkdir(directory, { recursive: true });
      }
    }
  }

  /**
   * Generate a unique filename for an image
   */
  private generateFilename(originalName: string, mimeType: string): string {
    const extension = this.getFileExtension(mimeType);
    const uuid = uuidv4();
    const timestamp = Date.now();
    return `${uuid}_${timestamp}.${extension}`;
  }

  /**
   * Get file extension from MIME type
   */
  private getFileExtension(mimeType: string): string {
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    return extensionMap[mimeType] || 'jpg';
  }

  /**
   * Generate a hash for image deduplication
   */
  private generateImageHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validate image file
   */
  private async validateImage(buffer: Buffer, clientMimeType: string): Promise<string> {
    // Check file size
    if (buffer.length > IMAGE_STORAGE_CONFIG.local.maxFileSize) {
      throw new Error(`Image size exceeds maximum limit of ${IMAGE_STORAGE_CONFIG.local.maxFileSize} bytes`);
    }

    // Detect actual MIME type from buffer
    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !IMAGE_STORAGE_CONFIG.local.allowedMimeTypes.includes(detected.mime)) {
      throw new Error(`Unsupported or invalid image type: ${detected?.mime || 'unknown'}`);
    }

    // Basic image validation by checking if buffer starts with image signatures
    const signatures: Record<string, Buffer> = {
      'image/jpeg': Buffer.from([0xff, 0xd8, 0xff]),
      'image/png': Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      'image/webp': Buffer.from([0x52, 0x49, 0x46, 0x46]),
    };

    const expectedSignature = signatures[detected.mime];
    if (!expectedSignature || !buffer.slice(0, expectedSignature.length).equals(expectedSignature)) {
      throw new Error('Invalid image file');
    }

    return detected.mime;
  }

  /**
   * Process and store an image
   */
  async processAndStoreImage(
    imageBuffer: Buffer,
    originalName: string,
    mimeType: string,
    uploadedBy: number
  ): Promise<ProcessedImage> {
    try {
      await this.initialize();
      const actualMimeType = await this.validateImage(imageBuffer, mimeType);

      const hash = this.generateImageHash(imageBuffer);
      const filename = this.generateFilename(originalName, actualMimeType);

      // Store original image
      const originalPath = await this.storeOriginalImage(imageBuffer, filename);

      // Process and store optimized image
      const optimizedPath = await this.storeOptimizedImage(imageBuffer, filename, actualMimeType);

      // Generate thumbnail
      const thumbnailPath = await this.storeThumbnail(imageBuffer, filename, actualMimeType);

      // Create image metadata
      const originalMetadata: ImageMetadata = {
        id: uuidv4(),
        originalName,
        filename,
        path: originalPath,
        size: imageBuffer.length,
        mimeType: actualMimeType,
        hash,
        uploadedAt: new Date(),
        uploadedBy,
      };

      const optimizedMetadata: ImageMetadata = {
        ...originalMetadata,
        path: optimizedPath,
      };

      const thumbnailMetadata: ImageMetadata = {
        ...originalMetadata,
        path: thumbnailPath,
      };

      return {
        original: originalMetadata,
        optimized: optimizedMetadata,
        thumbnail: thumbnailMetadata,
      };
    } catch (error) {
      console.error('Failed to process and store image:', error);
      throw error;
    }
  }

  /**
   * Store original image
   */
  private async storeOriginalImage(buffer: Buffer, filename: string): Promise<string> {
    if (IMAGE_STORAGE_CONFIG.storageType === 'local') {
      const path = join(IMAGE_STORAGE_CONFIG.local.basePath, 'originals', filename);
      await writeFile(path, buffer);
      return path;
    } else if (IMAGE_STORAGE_CONFIG.storageType === 's3') {
      // S3 storage implementation
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
        secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
        region: IMAGE_STORAGE_CONFIG.s3.region
      });

      const key = `originals/${filename}`;
      await s3.upload({
        Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'image/jpeg' // This should be determined from the actual file
      }).promise();

      return key;
    } else {
      throw new Error(`Unsupported storage type: ${IMAGE_STORAGE_CONFIG.storageType}`);
    }
  }

  /**
   * Store optimized image
   */
  private async storeOptimizedImage(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (IMAGE_STORAGE_CONFIG.storageType === 'local') {
      // For now, just store a compressed version
      // In a real implementation, you would use a library like sharp to optimize
      const optimizedBuffer = await this.compressImage(buffer, mimeType);
      const path = join(IMAGE_STORAGE_CONFIG.local.basePath, 'optimized', filename);
      await writeFile(path, optimizedBuffer);
      return path;
    } else if (IMAGE_STORAGE_CONFIG.storageType === 's3') {
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
        secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
        region: IMAGE_STORAGE_CONFIG.s3.region
      });

      const optimizedBuffer = await this.compressImage(buffer, mimeType);
      const key = `optimized/${filename}`;
      await s3.upload({
        Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
        Key: key,
        Body: optimizedBuffer,
        ContentType: mimeType
      }).promise();

      return key;
    } else {
      throw new Error(`Unsupported storage type: ${IMAGE_STORAGE_CONFIG.storageType}`);
    }
  }

  /**
   * Store thumbnail image
   */
  private async storeThumbnail(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (IMAGE_STORAGE_CONFIG.storageType === 'local') {
      // For now, just store a resized version
      // In a real implementation, you would use a library like sharp to create thumbnail
      const thumbnailBuffer = await this.createThumbnail(buffer, mimeType);
      const path = join(IMAGE_STORAGE_CONFIG.local.basePath, 'thumbnails', filename);
      await writeFile(path, thumbnailBuffer);
      return path;
    } else if (IMAGE_STORAGE_CONFIG.storageType === 's3') {
      const AWS = require('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
        secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
        region: IMAGE_STORAGE_CONFIG.s3.region
      });

      const thumbnailBuffer = await this.createThumbnail(buffer, mimeType);
      const key = `thumbnails/${filename}`;
      await s3.upload({
        Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
        Key: key,
        Body: thumbnailBuffer,
        ContentType: mimeType
      }).promise();

      return key;
    } else {
      throw new Error(`Unsupported storage type: ${IMAGE_STORAGE_CONFIG.storageType}`);
    }
  }

  /**
   * Compress image
   */
  private async compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // Simple compression using native Node.js buffer operations
    // In a real implementation, you would use a library like sharp for better compression
    if (mimeType === 'image/jpeg') {
      // For JPEG, we can use a simple approach by reducing quality
      // This is a placeholder - in production use sharp
      return buffer.slice(0, Math.floor(buffer.length * 0.8)); // Reduce to 80% size
    } else if (mimeType === 'image/png') {
      // For PNG, we can try to reduce colors
      return buffer.slice(0, Math.floor(buffer.length * 0.7)); // Reduce to 70% size
    }
    return buffer;
  }

  /**
   * Create thumbnail
   */
  private async createThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer> {
    // Simple thumbnail creation
    // In a real implementation, you would use a library like sharp
    const thumbnailSize = 300; // 300x300 thumbnail
    const aspectRatio = 1; // Square thumbnail
    
    // This is a placeholder - in production use sharp to properly resize
    if (buffer.length > 1024 * 1024) { // If larger than 1MB
      return buffer.slice(0, 1024 * 500); // Reduce to ~500KB
    }
    return buffer;
  }

  /**
   * Get image URL
   */
  getImageUrl(imagePath: string, size: 'original' | 'optimized' | 'thumbnail' = 'optimized'): string {
    if (IMAGE_STORAGE_CONFIG.storageType === 'local') {
      // For local storage, return a relative path
      // In production, you would serve these through a CDN or dedicated image server
      const filename = imagePath.split('/').pop();
      return `/api/images/${size}/${filename}`;
    } else {
      // For S3, return the S3 URL
      return `https://${IMAGE_STORAGE_CONFIG.s3.bucket}.s3.${IMAGE_STORAGE_CONFIG.s3.region}.amazonaws.com/${imagePath}`;
    }
  }

  /**
   * Delete image files
   */
  async deleteImage(imageMetadata: ImageMetadata): Promise<void> {
    try {
      if (IMAGE_STORAGE_CONFIG.storageType === 'local') {
        const filesToDelete = [
          join(IMAGE_STORAGE_CONFIG.local.basePath, 'originals', imageMetadata.filename),
          join(IMAGE_STORAGE_CONFIG.local.basePath, 'optimized', imageMetadata.filename),
          join(IMAGE_STORAGE_CONFIG.local.basePath, 'thumbnails', imageMetadata.filename),
        ];

        for (const filePath of filesToDelete) {
          try {
            await unlink(filePath);
          } catch (error) {
            // File might not exist, which is fine
            console.log(`File not found for deletion: ${filePath}`);
          }
        }
      } else if (IMAGE_STORAGE_CONFIG.storageType === 's3') {
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3({
          accessKeyId: IMAGE_STORAGE_CONFIG.s3.accessKeyId,
          secretAccessKey: IMAGE_STORAGE_CONFIG.s3.secretAccessKey,
          region: IMAGE_STORAGE_CONFIG.s3.region
        });

        const keysToDelete = [
          `originals/${imageMetadata.filename}`,
          `optimized/${imageMetadata.filename}`,
          `thumbnails/${imageMetadata.filename}`,
        ];

        for (const key of keysToDelete) {
          try {
            await s3.deleteObject({
              Bucket: IMAGE_STORAGE_CONFIG.s3.bucket,
              Key: key
            }).promise();
          } catch (error) {
            console.log(`File not found in S3 for deletion: ${key}`);
          }
        }
      }

      // Also delete from database
      await db.execute(
        `DELETE FROM image_metadata WHERE hash = '${imageMetadata.hash}'`
      );

      console.log(`Image deleted successfully: ${imageMetadata.filename}`);
    } catch (error) {
      console.error('Failed to delete image:', error);
      throw error;
    }
  }

  /**
   * Get image by hash (for deduplication)
   */
  async getImageByHash(hash: string): Promise<ImageMetadata | null> {
    try {
      const images = await db.execute(
        `SELECT * FROM image_metadata WHERE hash = '${hash}' LIMIT 1`
      );
      return images.length ? images[0] as ImageMetadata : null;
    } catch (error) {
      console.error('Failed to get image by hash:', error);
      return null;
    }
  }

  /**
   * Clean up old or unused images
   */
  async cleanupOldImages(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const oldImages = await db.execute(
        `SELECT * FROM image_metadata WHERE uploaded_at < '${cutoffDate.toISOString()}'`
      );

      let deletedCount = 0;
      for (const image of oldImages) {
        await this.deleteImage(image as ImageMetadata);
        deletedCount++;
      }

      console.log(`Image cleanup completed: ${deletedCount} images deleted`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old images:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    originalSize: number;
    optimizedSize: number;
    thumbnailSize: number;
  }> {
    try {
      const stats = await db.execute(
        `SELECT
          COUNT(*) as totalImages,
          SUM(size) as totalSize,
          SUM(CASE WHEN path LIKE '%originals%' THEN size ELSE 0 END) as originalSize,
          SUM(CASE WHEN path LIKE '%optimized%' THEN size ELSE 0 END) as optimizedSize,
          SUM(CASE WHEN path LIKE '%thumbnails%' THEN size ELSE 0 END) as thumbnailSize
         FROM image_metadata`
      );

      return {
        totalImages: Number(stats[0]?.totalImages || 0),
        totalSize: Number(stats[0]?.totalSize || 0),
        originalSize: Number(stats[0]?.originalSize || 0),
        optimizedSize: Number(stats[0]?.optimizedSize || 0),
        thumbnailSize: Number(stats[0]?.thumbnailSize || 0),
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const imageStorageService = new ImageStorageService();
export default imageStorageService;