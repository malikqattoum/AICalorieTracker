import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext';
import { offlineManager } from '../utils/offlineManager';

interface OfflineIndicatorProps {
  style?: any;
  showSyncStatus?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  style,
  showSyncStatus = false,
}) => {
  const { colors } = useTheme();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  // Network state monitoring
  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOnline = isOnline;
      const isNowOnline = state.isConnected ?? false;
      
      if (wasOnline !== isNowOnline) {
        setIsOnline(isNowOnline);
        
        if (!isNowOnline) {
          showIndicator();
        } else {
          hideIndicator();
        }
      }
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected ?? false);
      if (!state.isConnected) {
        showIndicator();
      }
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  // Offline manager sync status monitoring
  useEffect(() => {
    const unsubscribe = offlineManager.addSyncListener((status) => {
      setIsSyncing(status.isSyncing);
      
      if (showSyncStatus && status.isSyncing && status.pendingActions > 0) {
        const progress = Math.max(0, 100 - (status.pendingActions / 10) * 100);
        setSyncProgress(progress);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [showSyncStatus]);

  // Show/hide indicator animations
  const showIndicator = () => {
    setIsVisible(true);
    Animated.timing(animation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideIndicator = () => {
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
    });
  };

  // Calculate indicator color based on state
  const getIndicatorColor = () => {
    if (!isOnline) return colors.error;
    if (isSyncing) return colors.warning;
    return colors.success;
  };

  // Calculate indicator text
  const getIndicatorText = () => {
    if (!isOnline) return 'You are offline';
    if (isSyncing) return `Syncing... ${Math.round(syncProgress)}%`;
    return 'Online';
  };

  if (!isVisible && isOnline && !isSyncing) {
    return null;
  }

  const indicatorColor = getIndicatorColor();
  const indicatorText = getIndicatorText();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [-100, 0],
              }),
            },
          ],
        },
        style,
      ]}
    >
      <View style={[styles.indicator, { backgroundColor: indicatorColor }]}>
        <View style={styles.dot} />
        <Text style={[styles.text, { color: 'white' }]}>
          {indicatorText}
        </Text>
      </View>
      
      {showSyncStatus && isSyncing && (
        <View style={styles.progressContainer}>
          <View 
            style={[
              styles.progressBar,
              { 
                width: `${syncProgress}%`,
                backgroundColor: indicatorColor,
              }
            ]} 
          />
        </View>
      )}
    </Animated.View>
  );
};

// Higher-order component for automatic offline indicator
export const withOfflineIndicator = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: { showSyncStatus?: boolean }
) => {
  return (props: P) => (
    <>
      <OfflineIndicator showSyncStatus={options?.showSyncStatus} />
      <WrappedComponent {...props} />
    </>
  );
};

// Hook for offline status
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });

    const unsubscribeOfflineManager = offlineManager.addSyncListener((status) => {
      setIsSyncing(status.isSyncing);
    });

    return () => {
      unsubscribeNetInfo();
      unsubscribeOfflineManager();
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    isSyncing,
  };
};

// Simple offline status component
export const OfflineStatus: React.FC<{ style?: any }> = ({ style }) => {
  const { isOnline, isSyncing } = useOfflineStatus();
  const { colors } = useTheme();

  if (isOnline && !isSyncing) {
    return null;
  }

  const statusColor = isSyncing ? colors.warning : colors.error;
  const statusText = isSyncing ? 'Syncing...' : 'Offline';

  return (
    <View style={[styles.simpleStatus, style]}>
      <View style={[styles.simpleDot, { backgroundColor: statusColor }]} />
      <Text style={[styles.simpleText, { color: statusColor }]}>
        {statusText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: 'white',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  progressContainer: {
    width: '80%',
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    transitionWidth: '300ms',
  },
  simpleStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 16,
  },
  simpleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  simpleText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter-Regular',
  },
});

export default OfflineIndicator;