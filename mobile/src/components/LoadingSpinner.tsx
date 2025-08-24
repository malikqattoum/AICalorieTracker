import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large' | 'large-inverted';
  color?: string;
  text?: string;
  style?: any;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  style,
  overlay = false,
}) => {
  const { colors } = useTheme();
  
  // Determine spinner size and text size
  const spinnerSize = size === 'small' ? 20 : size === 'large-inverted' ? 30 : 40;
  const textSize = size === 'small' ? 12 : size === 'large-inverted' ? 16 : 14;
  
  // Determine color
  const spinnerColor = color || colors.primary;
  const textColor = colors.gray; // Use gray instead of textSecondary
  
  // Determine if we need an overlay background
  const containerStyle = overlay ? [styles.overlay, style] : [styles.container, style];
  
  return (
    <View style={containerStyle}>
      <ActivityIndicator 
        size={spinnerSize} 
        color={spinnerColor} 
        testID="loading-spinner"
      />
      {text && (
        <Text 
          style={[
            styles.text, 
            { 
              fontSize: textSize, 
              color: textColor,
              marginTop: size === 'small' ? 4 : 8,
            }
          ]}
          testID="loading-text"
        >
          {text}
        </Text>
      )}
    </View>
  );
};

// Predefined loading components for common use cases
export const FullScreenLoading = ({ text = 'Loading...' }: { text?: string }) => (
  <LoadingSpinner 
    size="large" 
    text={text} 
    overlay={true} 
  />
);

export const ButtonLoading = () => (
  <LoadingSpinner 
    size="small" 
    overlay={false} 
  />
);

export const CardLoading = () => (
  <View style={styles.cardLoading}>
    <LoadingSpinner size="small" />
  </View>
);

export const ListLoading = () => (
  <View style={styles.listLoading}>
    <LoadingSpinner size="small" text="Loading items..." />
  </View>
);

export const PageLoading = ({ text = 'Loading page...' }: { text?: string }) => (
  <View style={styles.pageLoading}>
    <LoadingSpinner size="large" text={text} />
  </View>
);

// Loading skeleton components for better UX
export const SkeletonLoader = ({ 
  height = 60, 
  width = '100%', 
  borderRadius = 8,
  style 
}: { 
  height?: number; 
  width?: string | number; 
  borderRadius?: number;
  style?: any;
}) => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[
        styles.skeleton,
        {
          height,
          width,
          borderRadius,
          backgroundColor: colors.background + '20', // 20% opacity
        },
        style
      ]}
    />
  );
};

export const SkeletonList = ({ count = 3 }: { count?: number }) => {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonListItem}>
          <SkeletonLoader height={60} width={60} style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <SkeletonLoader height={16} width="70%" style={styles.skeletonTitle} />
            <SkeletonLoader height={14} width="50%" style={styles.skeletonSubtitle} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  text: {
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  cardLoading: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listLoading: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeleton: {
    marginBottom: 8,
  },
  skeletonList: {
    padding: 16,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  skeletonAvatar: {
    marginRight: 12,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: '60%',
  },
});

export default LoadingSpinner;