import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Button, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  Linking,
  Platform
} from 'react-native';
import { 
  check, 
  request, 
  openSettings, 
  PERMISSIONS, 
  PermissionStatus,
  RESULTS
} from 'react-native-permissions';
import { useTheme } from '../contexts/ThemeContext';
import { logError } from '../config';

export type PermissionType = 
  | 'camera'
  | 'photoLibrary'
  | 'location'
  | 'notification'
  | 'storage'
  | 'microphone';

interface PermissionHandlerProps {
  permission: PermissionType;
  children: React.ReactNode;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  onPermissionBlocked?: () => void;
  fallback?: React.ReactNode;
  showRationale?: boolean;
}

// Permission mapping
const PERMISSION_MAP = {
  camera: Platform.select({
    android: PERMISSIONS.ANDROID.CAMERA,
    ios: PERMISSIONS.IOS.CAMERA,
  }),
  photoLibrary: Platform.select({
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  }),
  location: Platform.select({
    android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
  }),
  notification: Platform.select({
    android: PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
    ios: PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY, // Fallback for iOS notifications
  }),
  storage: Platform.select({
    android: PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
    ios: PERMISSIONS.IOS.PHOTO_LIBRARY,
  }),
  microphone: Platform.select({
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    ios: PERMISSIONS.IOS.MICROPHONE,
  }),
};

// Permission descriptions
const PERMISSION_DESCRIPTIONS = {
  camera: 'Camera access is required to take photos of your meals for analysis.',
  photoLibrary: 'Photo library access is required to select photos from your device.',
  location: 'Location access is required to provide location-based meal suggestions.',
  notification: 'Notification permissions are required to send meal reminders and health tips.',
  storage: 'Storage access is required to save and manage your meal photos.',
  microphone: 'Microphone access is required for voice commands and meal descriptions.',
};

// Permission titles
const PERMISSION_TITLES = {
  camera: 'Camera Permission',
  photoLibrary: 'Photo Library Permission',
  location: 'Location Permission',
  notification: 'Notification Permission',
  storage: 'Storage Permission',
  microphone: 'Microphone Permission',
};

export const PermissionHandler: React.FC<PermissionHandlerProps> = ({
  permission,
  children,
  onPermissionGranted,
  onPermissionDenied,
  onPermissionBlocked,
  fallback,
  showRationale = true,
}) => {
  const { colors } = useTheme();
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check permission status
  const checkPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const permissionKey = PERMISSION_MAP[permission];
      
      if (!permissionKey) {
        logError(`Invalid permission type: ${permission}`);
        setIsLoading(false);
        return;
      }

      const status = await check(permissionKey);
      setPermissionStatus(status);
    } catch (error) {
      logError('Failed to check permission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permission]);

  // Request permission
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const permissionKey = PERMISSION_MAP[permission];
      
      if (!permissionKey) {
        logError(`Invalid permission type: ${permission}`);
        setIsLoading(false);
        return;
      }

      const status = await request(permissionKey);
      setPermissionStatus(status);

      // Handle different permission results
      if (status === RESULTS.GRANTED) {
        onPermissionGranted?.();
      } else if (status === RESULTS.DENIED) {
        onPermissionDenied?.();
      } else if (status === RESULTS.BLOCKED) {
        onPermissionBlocked?.();
      }
    } catch (error) {
      logError('Failed to request permission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permission, onPermissionGranted, onPermissionDenied, onPermissionBlocked]);

  // Open app settings
  const openAppSettings = useCallback(() => {
    openSettings().catch(() => {
      Alert.alert(
        'Settings',
        'Unable to open settings. Please manually enable the permission in your device settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings', 
            onPress: () => Linking.openSettings() 
          },
        ]
      );
    });
  }, []);

  // Show permission rationale
  const showPermissionRationale = useCallback(() => {
    Alert.alert(
      PERMISSION_TITLES[permission],
      PERMISSION_DESCRIPTIONS[permission],
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => onPermissionDenied?.()
        },
        { 
          text: 'Allow', 
          onPress: requestPermission 
        },
      ]
    );
  }, [permission, requestPermission, onPermissionDenied]);

  // Initial permission check
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Handle permission status changes
  useEffect(() => {
    if (permissionStatus === null) return;

    if (permissionStatus === RESULTS.GRANTED) {
      onPermissionGranted?.();
    } else if (permissionStatus === RESULTS.DENIED && showRationale) {
      showPermissionRationale();
    } else if (permissionStatus === RESULTS.BLOCKED) {
      onPermissionBlocked?.();
    }
  }, [permissionStatus, onPermissionGranted, onPermissionBlocked, showRationale, showPermissionRationale]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  // Show fallback if permission is denied and no fallback provided
  if (permissionStatus === RESULTS.DENIED && !fallback) {
    return (
      <View style={styles.container}>
        <ThemedPermissionDenied 
          permission={permission}
          onRetry={checkPermission}
          onOpenSettings={openAppSettings}
        />
      </View>
    );
  }

  // Show fallback component if provided
  if (permissionStatus === RESULTS.DENIED && fallback) {
    return <>{fallback}</>;
  }

  // Show permission blocked screen
  if (permissionStatus === RESULTS.BLOCKED) {
    return (
      <View style={styles.container}>
        <ThemedPermissionBlocked 
          permission={permission}
          onOpenSettings={openAppSettings}
        />
      </View>
    );
  }

  // Show children if permission is granted
  if (permissionStatus === RESULTS.GRANTED) {
    return <>{children}</>;
  }

  // Default fallback
  return <>{children}</>;
};

// Themed permission denied component
const ThemedPermissionDenied = ({ 
  permission, 
  onRetry, 
  onOpenSettings 
}: { 
  permission: PermissionType;
  onRetry: () => void;
  onOpenSettings: () => void;
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {PERMISSION_TITLES[permission]} Required
      </Text>
      <Text style={[styles.description, { color: colors.gray }]}>
        {PERMISSION_DESCRIPTIONS[permission]}
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRetry}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: colors.border }]}
          onPress={onOpenSettings}
        >
          <Text style={[styles.outlineButtonText, { color: colors.text }]}>
            Open Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Themed permission blocked component
const ThemedPermissionBlocked = ({ 
  permission, 
  onOpenSettings 
}: { 
  permission: PermissionType;
  onOpenSettings: () => void;
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>
        {PERMISSION_TITLES[permission]} Blocked
      </Text>
      <Text style={[styles.description, { color: colors.gray }]}>
        Permission for {permission} has been blocked. Please enable it in your device settings to use this feature.
      </Text>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onOpenSettings}
      >
        <Text style={styles.buttonText}>Open Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

// Higher-order component for easy usage
export const withPermission = (permission: PermissionType) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    return (props: P) => (
      <PermissionHandler permission={permission}>
        <WrappedComponent {...props} />
      </PermissionHandler>
    );
  };
};

// Hook for checking permissions
export const usePermission = (permission: PermissionType) => {
  const [status, setStatus] = useState<PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const permissionKey = PERMISSION_MAP[permission];
      
      if (!permissionKey) {
        logError(`Invalid permission type: ${permission}`);
        return;
      }

      const result = await check(permissionKey);
      setStatus(result);
    } catch (error) {
      logError('Failed to check permission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permission]);

  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const permissionKey = PERMISSION_MAP[permission];
      
      if (!permissionKey) {
        logError(`Invalid permission type: ${permission}`);
        return;
      }

      const result = await request(permissionKey);
      setStatus(result);
      return result;
    } catch (error) {
      logError('Failed to request permission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permission]);

  return {
    status,
    isLoading,
    checkPermission,
    requestPermission,
    isGranted: status === RESULTS.GRANTED,
    isDenied: status === RESULTS.DENIED,
    isBlocked: status === RESULTS.BLOCKED,
    isUndetermined: status === RESULTS.UNAVAILABLE,
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  outlineButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  outlineButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default PermissionHandler;