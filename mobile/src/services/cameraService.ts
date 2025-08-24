import * as ImageManipulator from 'expo-image-manipulator';
import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logError, log } from '../config';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';

export interface CameraOptions {
  quality?: number;
  base64?: boolean;
  skipProcessing?: boolean;
  resize?: { width?: number; height?: number };
  format?: ImageManipulator.SaveFormat;
}

export interface MemoryInfo {
  available: number;
  total: number;
  used: number;
  timestamp: number;
}

export class CameraService {
  private static instance: CameraService;
  private memoryThreshold: number = 0.8; // 80% memory usage threshold
  private isProcessing: boolean = false;
  private lastMemoryCheck: number = 0;
  private memoryCheckInterval: number = 60000; // 1 minute
  private maxImageSize: number = 10 * 1024 * 1024; // 10MB
  private maxProcessingSize: number = 1920 * 1080; // 2MP

  private constructor() {}

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  /**
   * Check memory availability before performing operations
   */
  async checkMemoryAvailability(): Promise<{ available: boolean; info?: MemoryInfo }> {
    try {
      const now = Date.now();
      if (now - this.lastMemoryCheck < this.memoryCheckInterval) {
        // Use cached memory info
        const cachedInfo = await SecureStore.getItemAsync('memory_info');
        if (cachedInfo) {
          const info: MemoryInfo = JSON.parse(cachedInfo);
          const available = info.available > this.memoryThreshold;
          return { available, info };
        }
      }

      // Estimate memory availability (simplified approach)
      // In a real app, you might use device-specific APIs
      const estimatedAvailable = await this.estimateMemoryAvailable();
      
      const memoryInfo: MemoryInfo = {
        available: estimatedAvailable,
        total: 1, // Normalized to 1 (100%)
        used: 1 - estimatedAvailable,
        timestamp: now
      };

      // Cache the memory info
      await SecureStore.setItemAsync('memory_info', JSON.stringify(memoryInfo));
      this.lastMemoryCheck = now;

      const isAvailable = estimatedAvailable > this.memoryThreshold;
      return { available: isAvailable, info: memoryInfo };
    } catch (error) {
      logError('Memory check failed:', error);
      // Default to allowing operation if check fails
      return { available: true };
    }
  }

  /**
   * Estimate available memory (simplified implementation)
   */
  private async estimateMemoryAvailable(): Promise<number> {
    try {
      // Try to get memory info from device
      if (Platform.OS === 'android') {
        // Android-specific memory estimation
        const memoryInfo = await AsyncStorage.getItem('android_memory_info');
        if (memoryInfo) {
          return parseFloat(memoryInfo);
        }
      }
      
      // Fallback: Use a simple estimation based on available storage
      const storageInfo = await AsyncStorage.getItem('storage_info');
      if (storageInfo) {
        const info = JSON.parse(storageInfo);
        return Math.min(info.available / info.total, 1);
      }
      
      // Default to 70% available if no info
      return 0.7;
    } catch {
      return 0.7;
    }
  }

  /**
   * Safe image manipulation with memory checks
   */
  async safeImageManipulation(
    imageUri: string,
    options: any = {}
  ): Promise<any> {
    // Check if already processing
    if (this.isProcessing) {
      throw ErrorHandler.createError(
        'Another image processing operation is already in progress',
        'validation',
        'PROCESSING_IN_PROGRESS'
      );
    }

    // Check memory availability
    const memoryCheck = await this.checkMemoryAvailability();
    if (!memoryCheck.available) {
      throw ErrorHandler.createError(
        'Insufficient memory for image processing. Please close other apps and try again.',
        'unknown',
        'INSUFFICIENT_MEMORY',
        { memoryInfo: memoryCheck.info }
      );
    }

    // Validate and sanitize options
    const safeOptions = this.sanitizeImageOptions(options);

    try {
      this.isProcessing = true;
      log('Starting safe image manipulation:', { 
        uri: imageUri, 
        options: safeOptions,
        memoryInfo: memoryCheck.info 
      });

      const result = await ImageManipulator.manipulateAsync(imageUri, safeOptions, {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false // Avoid base64 memory issues
      });

      // Validate result size
      if (result.uri) {
        const resultSize = await this.getImageSize(result.uri);
        if (resultSize > this.maxImageSize) {
          throw ErrorHandler.createError(
            `Processed image too large (${(resultSize / 1024 / 1024).toFixed(2)}MB)`,
            'validation',
            'IMAGE_TOO_LARGE',
            { size: resultSize, maxSize: this.maxImageSize }
          );
        }
      }

      log('Image manipulation completed successfully');
      return result;
    } catch (error) {
      logError('Image manipulation failed:', error);
      throw this.handleImageError(error);
    } finally {
      this.isProcessing = false;
      // Suggest garbage collection
      this.suggestGarbageCollection();
    }
  }

  /**
   * Sanitize image processing options
   */
  private sanitizeImageOptions(options: any): any {
    const safeOptions = { ...options };

    // Limit resize dimensions
    if (safeOptions.resize) {
      safeOptions.resize.width = Math.min(safeOptions.resize.width || 800, 1200);
      safeOptions.resize.height = Math.min(safeOptions.resize.height || 600, 800);
    }

    // Limit crop dimensions
    if (safeOptions.crop) {
      if (Array.isArray(safeOptions.crop)) {
        safeOptions.crop = safeOptions.crop.map((box: any) => ({
          origin: { x: Math.max(0, box.origin.x), y: Math.max(0, box.origin.y) },
          size: {
            width: Math.min(box.size.width, this.maxProcessingSize),
            height: Math.min(box.size.height, this.maxProcessingSize)
          }
        }));
      }
    }

    // Ensure base64 is disabled to prevent memory issues
    safeOptions.base64 = false;

    return safeOptions;
  }

  /**
   * Get image file size
   */
  private async getImageSize(uri: string): Promise<number> {
    try {
      // In a real implementation, you would use file system APIs
      // For now, return a reasonable estimate
      return 1024 * 1024; // 1MB default
    } catch {
      return 1024 * 1024; // 1MB default
    }
  }

  /**
   * Handle image processing errors
   */
  private handleImageError(error: any): AppError {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'APP_ERROR') {
      return error as AppError;
    }

    let errorType: ErrorType = 'unknown';
    let errorMessage = 'Image processing failed';
    let errorCode = 'IMAGE_PROCESSING_ERROR';
    let details: any = { originalError: error.message };

    if (error.message?.includes('memory') || error.message?.includes('Memory')) {
      errorType = 'unknown';
      errorMessage = 'Insufficient memory for image processing';
      errorCode = 'INSUFFICIENT_MEMORY';
    } else if (error.message?.includes('permission') || error.message?.includes('Permission')) {
      errorType = 'permission';
      errorMessage = 'Permission denied for image access';
      errorCode = 'PERMISSION_DENIED';
    } else if (error.message?.includes('format') || error.message?.includes('Format')) {
      errorType = 'validation';
      errorMessage = 'Unsupported image format';
      errorCode = 'UNSUPPORTED_FORMAT';
    } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorType = 'network';
      errorMessage = 'Image processing timed out';
      errorCode = 'PROCESSING_TIMEOUT';
    }

    return ErrorHandler.createError(errorMessage, errorType, errorCode, details);
  }

  /**
   * Suggest garbage collection
   */
  private suggestGarbageCollection(): void {
    if (typeof global.gc === 'function') {
      try {
        global.gc();
        log('Garbage collection suggested');
      } catch (error) {
        logError('Garbage collection failed:', error);
      }
    }
  }

  /**
   * Safe camera capture with memory management
   */
  async safeCameraCapture(
    cameraRef: any,
    options: CameraOptions = {}
  ): Promise<string | null> {
    if (!cameraRef.current) {
      throw ErrorHandler.createError('Camera not available', 'unknown', 'CAMERA_UNAVAILABLE');
    }

    // Check memory availability
    const memoryCheck = await this.checkMemoryAvailability();
    if (!memoryCheck.available) {
      throw ErrorHandler.createError(
        'Insufficient memory for camera capture',
        'unknown',
        'INSUFFICIENT_MEMORY',
        { memoryInfo: memoryCheck.info }
      );
    }

    try {
      const cameraOptions: any = {
        quality: options.quality ?? 0.8,
        base64: options.base64 ?? false,
        skipProcessing: options.skipProcessing ?? true,
      };

      log('Starting camera capture:', { options: cameraOptions, memoryInfo: memoryCheck.info });

      const photo = await cameraRef.current.takePictureAsync(cameraOptions);
      
      // Validate photo size
      const photoSize = await this.getImageSize(photo.uri);
      if (photoSize > this.maxImageSize) {
        throw ErrorHandler.createError(
          `Captured photo too large (${(photoSize / 1024 / 1024).toFixed(2)}MB)`,
          'validation',
          'PHOTO_TOO_LARGE',
          { size: photoSize, maxSize: this.maxImageSize }
        );
      }

      log('Camera capture completed successfully');
      return photo.uri;
    } catch (error) {
      logError('Camera capture failed:', error);
      throw this.handleCameraError(error);
    }
  }

  /**
   * Handle camera capture errors
   */
  private handleCameraError(error: any): AppError {
    let errorType: ErrorType = 'unknown';
    let errorMessage = 'Camera capture failed';
    let errorCode = 'CAMERA_CAPTURE_ERROR';
    let details: any = { originalError: error.message };

    if (error.message?.includes('memory') || error.message?.includes('Memory')) {
      errorType = 'unknown';
      errorMessage = 'Insufficient memory for camera capture';
      errorCode = 'INSUFFICIENT_MEMORY';
    } else if (error.message?.includes('permission') || error.message?.includes('Permission')) {
      errorType = 'permission';
      errorMessage = 'Camera permission denied';
      errorCode = 'PERMISSION_DENIED';
    } else if (error.message?.includes('camera') || error.message?.includes('Camera')) {
      errorType = 'unknown';
      errorMessage = 'Camera unavailable';
      errorCode = 'CAMERA_UNAVAILABLE';
    } else if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      errorType = 'network';
      errorMessage = 'Camera operation timed out';
      errorCode = 'CAMERA_TIMEOUT';
    }

    return ErrorHandler.createError(errorMessage, errorType, errorCode, details);
  }

  /**
   * Safe image picker with memory management
   */
  async safeImagePicker(options: ImagePicker.ImagePickerOptions = {}): Promise<ImagePicker.ImagePickerResult> {
    // Check memory availability
    const memoryCheck = await this.checkMemoryAvailability();
    if (!memoryCheck.available) {
      throw ErrorHandler.createError(
        'Insufficient memory for image selection',
        'unknown',
        'INSUFFICIENT_MEMORY',
        { memoryInfo: memoryCheck.info }
      );
    }

    try {
      const safeOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: options.mediaTypes ?? ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? true,
        aspect: options.aspect ?? [4, 3],
        quality: options.quality ?? 0.8,
        selectionLimit: options.selectionLimit ?? 1,
      };

      log('Starting image picker:', { options: safeOptions, memoryInfo: memoryCheck.info });

      const result = await ImagePicker.launchImageLibraryAsync(safeOptions);
      
      if (result.canceled) {
        throw ErrorHandler.createError('Image selection cancelled', 'validation', 'SELECTION_CANCELLED');
      }

      // Validate selected images
      if (result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          if (asset.uri) {
            const assetSize = await this.getImageSize(asset.uri);
            if (assetSize > this.maxImageSize) {
              throw ErrorHandler.createError(
                `Selected image too large (${(assetSize / 1024 / 1024).toFixed(2)}MB)`,
                'validation',
                'IMAGE_TOO_LARGE',
                { size: assetSize, maxSize: this.maxImageSize }
              );
            }
          }
        }
      }

      log('Image picker completed successfully');
      return result;
    } catch (error) {
      logError('Image picker failed:', error);
      throw this.handleImagePickerError(error);
    }
  }

  /**
   * Handle image picker errors
   */
  private handleImagePickerError(error: any): AppError {
    let errorType: ErrorType = 'unknown';
    let errorMessage = 'Image selection failed';
    let errorCode = 'IMAGE_PICKER_ERROR';
    let details: any = { originalError: error.message };

    if (error.message?.includes('memory') || error.message?.includes('Memory')) {
      errorType = 'unknown';
      errorMessage = 'Insufficient memory for image selection';
      errorCode = 'INSUFFICIENT_MEMORY';
    } else if (error.message?.includes('permission') || error.message?.includes('Permission')) {
      errorType = 'permission';
      errorMessage = 'Photo library permission denied';
      errorCode = 'PERMISSION_DENIED';
    } else if (error.message?.includes('cancelled') || error.message?.includes('Cancelled')) {
      errorType = 'validation';
      errorMessage = 'Image selection cancelled';
      errorCode = 'SELECTION_CANCELLED';
    }

    return ErrorHandler.createError(errorMessage, errorType, errorCode, details);
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      this.isProcessing = false;
      
      // Clear cached memory info
      await SecureStore.deleteItemAsync('memory_info');
      
      // Clear cached storage info
      await SecureStore.deleteItemAsync('storage_info');
      
      log('Camera service cleanup completed');
    } catch (error) {
      logError('Camera service cleanup failed:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus(): {
    isProcessing: boolean;
    memoryThreshold: number;
    lastMemoryCheck: number;
    maxImageSize: number;
  } {
    return {
      isProcessing: this.isProcessing,
      memoryThreshold: this.memoryThreshold,
      lastMemoryCheck: this.lastMemoryCheck,
      maxImageSize: this.maxImageSize,
    };
  }
}

// Export singleton instance
export const cameraService = CameraService.getInstance();
export default cameraService;