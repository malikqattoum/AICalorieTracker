import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Camera, CameraType, CameraCapturedPicture } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { logError, log } from '../../config';
import { ErrorHandler } from '../../utils/errorHandler';
import { cameraService } from '../../services/cameraService';
import { permissionManager } from '../../services/permissionManager';
import { AppError } from '../../utils/errorHandler';

interface SafeCameraProps {
  onCapture: (uri: string) => void;
  onError?: (error: AppError) => void;
  type?: CameraType;
  flashMode?: 'on' | 'off' | 'auto';
  style?: any;
  showCaptureButton?: boolean;
  showGalleryButton?: boolean;
  enableGalleryPicker?: boolean;
}

export const SafeCamera: React.FC<SafeCameraProps> = ({
  onCapture,
  onError,
  type = CameraType.back,
  flashMode = 'off',
  style,
  showCaptureButton = true,
  showGalleryButton = true,
  enableGalleryPicker = true,
}) => {
  const cameraRef = useRef<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [flashModeState, setFlashModeState] = useState(flashMode);
  const [cameraType, setCameraType] = useState(type);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Check camera permissions on mount
  useEffect(() => {
    checkCameraPermissions();
  }, []);

  const checkCameraPermissions = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const status = await permissionManager.requestCameraPermission({
        requestRationale: 'This app needs camera access to analyze your meals. Please enable camera permissions to continue.',
        openSettingsOnDeny: true,
        showRationale: true,
        maxAttempts: 3,
      });

      setHasPermission(status.granted);
      
      if (!status.granted) {
        if (status.canAskAgain) {
          Alert.alert(
            'Camera Access Required',
            'Camera access is needed to take photos of your meals. Please enable permissions in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => permissionManager.openAppSettings() },
            ]
          );
        } else {
          Alert.alert(
            'Camera Access Required',
            'Camera permissions are required to use this feature. Please enable permissions in your device settings.',
            [
              { text: 'OK' },
            ]
          );
        }
      }

      return status.granted;
    } catch (error) {
      logError('Camera permission check failed:', error);
      const appError = ErrorHandler.createError(
        'Failed to check camera permissions',
        'permission',
        'PERMISSION_CHECK_FAILED',
        { originalError: error }
      );
      onError?.(appError);
      setHasPermission(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessing || !hasPermission) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Use the safe camera service
      const photoUri = await cameraService.safeCameraCapture(cameraRef, {
        quality: 0.8,
        base64: false,
        skipProcessing: true,
      });

      if (photoUri) {
        log('Photo captured successfully:', { uri: photoUri });
        onCapture(photoUri);
      }
    } catch (error) {
      logError('Camera capture failed:', error);
      const appError = ErrorHandler.createError(
        'Camera capture failed',
        'unknown',
        'CAMERA_CAPTURE_ERROR',
        { originalError: error }
      );
      onError?.(appError);
      
      // Show user-friendly error message
      Alert.alert(
        'Capture Failed',
        appError.message,
        [
          { text: 'OK' },
          { text: 'Try Again', onPress: () => handleCapture() },
        ]
      );
    } finally {
      setIsProcessing(false);
    }
  }, [cameraRef, isProcessing, hasPermission, onCapture, onError]);

  const handleGalleryPick = useCallback(async () => {
    if (!enableGalleryPicker || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      
      // Request photo library permission
      const status = await permissionManager.requestPhotoLibraryPermission({
        requestRationale: 'This app needs access to your photo library to select meal images. Please enable photo library permissions.',
        openSettingsOnDeny: true,
        showRationale: true,
        maxAttempts: 3,
      });

      if (!status.granted) {
        Alert.alert(
          'Photo Library Access Required',
          'Photo library access is needed to select meal images. Please enable permissions in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => permissionManager.openAppSettings() },
          ]
        );
        return;
      }

      // Use the safe image picker
      const result = await cameraService.safeImagePicker({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        if (selectedImage.uri) {
          log('Image selected from gallery:', { uri: selectedImage.uri });
          onCapture(selectedImage.uri);
        }
      }
    } catch (error) {
      logError('Gallery pick failed:', error);
      const appError = ErrorHandler.createError(
        'Failed to select image from gallery',
        'permission',
        'GALLERY_PICK_FAILED',
        { originalError: error }
      );
      onError?.(appError);
    } finally {
      setIsProcessing(false);
    }
  }, [enableGalleryPicker, isProcessing, onCapture, onError]);

  const toggleFlash = useCallback(() => {
    const newFlashMode: 'on' | 'off' | 'auto' = 
      flashModeState === 'on' ? 'off' : 
      flashModeState === 'off' ? 'auto' : 'on';
    setFlashModeState(newFlashMode);
  }, [flashModeState]);

  const toggleCameraType = useCallback(() => {
    const newType = cameraType === CameraType.back ? CameraType.front : CameraType.back;
    setCameraType(newType);
  }, [cameraType]);

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.permissionDenied}>
          <Ionicons name="camera" size={64} color="#999" />
          <View style={styles.permissionText}>
            <Ionicons name="alert-circle" size={24} color="#E11D48" />
            <View style={styles.permissionMessage}>
              <Ionicons name="lock-closed" size={20} color="#666" />
              <Ionicons name="warning" size={20} color="#F59E0B" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        // Note: flash prop might not be available in all expo-camera versions
        onCameraReady={() => log('Camera ready')}
        onMountError={(error) => {
          logError('Camera mount error:', error);
          const appError = ErrorHandler.createError(
            'Camera initialization failed',
            'unknown',
            'CAMERA_MOUNT_ERROR',
            { originalError: error }
          );
          onError?.(appError);
        }}
      >
        {/* Camera overlay */}
        <View style={styles.overlay}>
          {/* Top controls */}
          <View style={styles.topControls}>
            {showGalleryButton && (
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={handleGalleryPick}
                disabled={isProcessing}
              >
                <Ionicons 
                  name="images" 
                  size={24} 
                  color={isProcessing ? "#999" : "#FFF"} 
                />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.flashButton}
              onPress={toggleFlash}
              disabled={isProcessing}
            >
              <Ionicons 
                name={flashModeState === 'on' ? 'flash' : flashModeState === 'off' ? 'flash-off' : 'flash-outline'}
                size={24} 
                color={isProcessing ? "#999" : "#FFF"} 
              />
            </TouchableOpacity>
          </View>

          {/* Center capture area */}
          <View style={styles.centerOverlay}>
            <View style={styles.captureArea}>
              <View style={styles.captureAreaBorder} />
            </View>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={toggleCameraType}
              disabled={isProcessing}
            >
              <Ionicons 
                name="camera-reverse" 
                size={24} 
                color={isProcessing ? "#999" : "#FFF"} 
              />
            </TouchableOpacity>

            {showCaptureButton && (
              <TouchableOpacity
                style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
                onPress={handleCapture}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  galleryButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  flashButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureArea: {
    width: 250,
    height: 250,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFF',
    opacity: 0.8,
  },
  captureAreaBorder: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFF',
    opacity: 0.6,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E11D48',
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    marginTop: 20,
    alignItems: 'center',
  },
  permissionMessage: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
});

export default SafeCamera;