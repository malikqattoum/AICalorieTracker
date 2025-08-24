import * as Camera from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';
import { logError, log } from '../config';
import { ErrorHandler, ErrorType, AppError } from '../utils/errorHandler';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  expires?: string;
  scoped?: boolean;
}

export interface PermissionOptions {
  requestRationale?: string;
  openSettingsOnDeny?: boolean;
  showRationale?: boolean;
  maxAttempts?: number;
}

export class PermissionManager {
  private static instance: PermissionManager;
  private permissionAttempts: Map<string, number> = new Map();
  private maxPermissionAttempts: number = 3;

  private constructor() {}

  static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Request camera permission with enhanced handling
   */
  async requestCameraPermission(options: PermissionOptions = {}): Promise<PermissionStatus> {
    const permissionKey = 'camera';
    const currentAttempts = this.permissionAttempts.get(permissionKey) || 0;
    
    if (currentAttempts >= this.maxPermissionAttempts) {
      log(`Max attempts reached for ${permissionKey} permission`);
      return { granted: false, canAskAgain: false };
    }

    try {
      // Check current permission status
      const { status } = await Camera.getCameraPermissionsAsync();
      log(`Current camera permission status: ${status}`);

      if (status === 'granted') {
        this.permissionAttempts.delete(permissionKey);
        return { granted: true, canAskAgain: false };
      }

      if (status === 'denied') {
        const canAskAgain = await Camera.requestCameraPermissionsAsync();
        
        if (canAskAgain.status === 'granted') {
          this.permissionAttempts.delete(permissionKey);
          return { granted: true, canAskAgain: false };
        }

        // Handle denial with rationale
        if (options.requestRationale && options.showRationale !== false) {
          await this.showPermissionRationale(
            'Camera Access Required',
            options.requestRationale,
            options.openSettingsOnDeny
          );
        }

        this.permissionAttempts.set(permissionKey, currentAttempts + 1);
        return { 
          granted: false, 
          canAskAgain: canAskAgain.status === 'denied',
          expires: canAskAgain.expires?.toString(),
          scoped: (canAskAgain as any).scoped
        };
      }

      // Request permission for the first time
      const { status: newStatus } = await Camera.requestCameraPermissionsAsync();
      
      if (newStatus === 'granted') {
        this.permissionAttempts.delete(permissionKey);
        return { granted: true, canAskAgain: false };
      }

      this.permissionAttempts.set(permissionKey, currentAttempts + 1);
      return { 
        granted: false, 
        canAskAgain: newStatus === 'denied',
        expires: newStatus === 'denied' ? 'unknown' : undefined
      };

    } catch (error) {
      logError('Camera permission request failed:', error);
      this.permissionAttempts.set(permissionKey, currentAttempts + 1);
      return { granted: false, canAskAgain: true };
    }
  }

  /**
   * Request photo library permission with enhanced handling
   */
  async requestPhotoLibraryPermission(options: PermissionOptions = {}): Promise<PermissionStatus> {
    const permissionKey = 'photoLibrary';
    const currentAttempts = this.permissionAttempts.get(permissionKey) || 0;
    
    if (currentAttempts >= this.maxPermissionAttempts) {
      log(`Max attempts reached for ${permissionKey} permission`);
      return { granted: false, canAskAgain: false };
    }

    try {
      // Check current permission status
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      log(`Current photo library permission status: ${status}`);

      if (status === 'granted') {
        this.permissionAttempts.delete(permissionKey);
        return { granted: true, canAskAgain: false };
      }

      if (status === 'denied') {
        const canAskAgain = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (canAskAgain.status === 'granted') {
          this.permissionAttempts.delete(permissionKey);
          return { granted: true, canAskAgain: false };
        }

        // Handle denial with rationale
        if (options.requestRationale && options.showRationale !== false) {
          await this.showPermissionRationale(
            'Photo Library Access Required',
            options.requestRationale,
            options.openSettingsOnDeny
          );
        }

        this.permissionAttempts.set(permissionKey, currentAttempts + 1);
        return { 
          granted: false, 
          canAskAgain: canAskAgain.status === 'denied',
          expires: canAskAgain.expires?.toString(),
          scoped: (canAskAgain as any).scoped
        };
      }

      // Request permission for the first time
      const { status: newStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (newStatus === 'granted') {
        this.permissionAttempts.delete(permissionKey);
        return { granted: true, canAskAgain: false };
      }

      this.permissionAttempts.set(permissionKey, currentAttempts + 1);
      return { 
        granted: false, 
        canAskAgain: newStatus === 'denied',
        expires: newStatus === 'denied' ? 'unknown' : undefined
      };

    } catch (error) {
      logError('Photo library permission request failed:', error);
      this.permissionAttempts.set(permissionKey, currentAttempts + 1);
      return { granted: false, canAskAgain: true };
    }
  }


  /**
   * Show permission rationale dialog
   */
  private async showPermissionRationale(
    title: string,
    message: string,
    openSettingsOnDeny: boolean = true
  ): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve()
          },
          { 
            text: 'Continue', 
            onPress: () => resolve()
          },
          ...(openSettingsOnDeny ? [{
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings();
              resolve();
            }
          }] : [])
        ]
      );
    });
  }

  /**
   * Check if permission can be requested again
   */
  canRequestPermission(permission: string): boolean {
    const attempts = this.permissionAttempts.get(permission) || 0;
    return attempts < this.maxPermissionAttempts;
  }

  /**
   * Reset permission attempts for a specific permission
   */
  resetPermissionAttempts(permission: string): void {
    this.permissionAttempts.delete(permission);
    log(`Reset permission attempts for ${permission}`);
  }

  /**
   * Reset all permission attempts
   */
  resetAllPermissionAttempts(): void {
    this.permissionAttempts.clear();
    log('Reset all permission attempts');
  }

  /**
   * Get permission status with detailed information
   */
  async getPermissionStatus(permission: string): Promise<PermissionStatus> {
    try {
      switch (permission) {
        case 'camera':
          const { status: cameraStatus } = await Camera.getCameraPermissionsAsync();
          return {
            granted: cameraStatus === 'granted',
            canAskAgain: cameraStatus === 'denied',
            expires: cameraStatus === 'denied' ? 'unknown' : undefined
          };
        
        case 'photoLibrary':
          const { status: photoStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
          return {
            granted: photoStatus === 'granted',
            canAskAgain: photoStatus === 'denied',
            expires: photoStatus === 'denied' ? 'unknown' : undefined
          };
        
        default:
          return { granted: false, canAskAgain: true };
      }
    } catch (error) {
      logError(`Failed to get ${permission} status:`, error);
      return { granted: false, canAskAgain: true };
    }
  }

  /**
   * Open app settings for permissions
   */
  async openAppSettings(): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL('app-settings:');
      if (supported) {
        await Linking.openURL('app-settings:');
        return true;
      }
      return false;
    } catch (error) {
      logError('Failed to open app settings:', error);
      return false;
    }
  }

  /**
   * Handle permission errors with appropriate recovery
   */
  async handlePermissionError(error: any, permission: string): Promise<AppError> {
    let errorType: ErrorType = 'permission';
    let errorMessage = `Permission denied for ${permission}`;
    let errorCode = `PERMISSION_DENIED_${permission.toUpperCase()}`;
    let details: any = { 
      permission, 
      originalError: error.message,
      attempts: this.permissionAttempts.get(permission) || 0
    };

    if (error.message?.includes('never') || error.message?.includes('Never')) {
      errorType = 'permission';
      errorMessage = `Permission for ${permission} was permanently denied`;
      errorCode = `PERMISSION_PERMANENTLY_DENIED_${permission.toUpperCase()}`;
      details.permanent = true;
    } else if (error.message?.includes('restricted') || error.message?.includes('Restricted')) {
      errorType = 'permission';
      errorMessage = `Permission for ${permission} is restricted by device policy`;
      errorCode = `PERMISSION_RESTRICTED_${permission.toUpperCase()}`;
      details.restricted = true;
    } else if (error.message?.includes('unavailable') || error.message?.includes('Unavailable')) {
      errorType = 'unknown';
      errorMessage = `Permission for ${permission} is unavailable on this device`;
      errorCode = `PERMISSION_UNAVAILABLE_${permission.toUpperCase()}`;
      details.unavailable = true;
    }

    return ErrorHandler.createError(errorMessage, errorType, errorCode, details);
  }

  /**
   * Get permission attempts count
   */
  getPermissionAttempts(permission: string): number {
    return this.permissionAttempts.get(permission) || 0;
  }

  /**
   * Get all permission attempts
   */
  getAllPermissionAttempts(): Map<string, number> {
    return new Map(this.permissionAttempts);
  }

  /**
   * Check if we should show permission rationale
   */
  async shouldShowPermissionRationale(permission: string): Promise<boolean> {
    try {
      switch (permission) {
        case 'camera':
          try {
            const { status } = await Camera.getCameraPermissionsAsync();
            return status === 'denied';
          } catch {
            return false;
          }
        case 'photoLibrary':
          try {
            const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
            return status === 'denied';
          } catch {
            return false;
          }
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const permissionManager = PermissionManager.getInstance();
export default permissionManager;