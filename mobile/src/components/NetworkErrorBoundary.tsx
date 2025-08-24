import React, { Component, ReactNode } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '../contexts/ThemeContext';
import { logError } from '../config';

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface NetworkErrorBoundaryState {
  hasNetworkError: boolean;
  isOnline: boolean;
}

export class NetworkErrorBoundary extends Component<NetworkErrorBoundaryProps, NetworkErrorBoundaryState> {
  private unsubscribeNetInfo: () => void;

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasNetworkError: false,
      isOnline: true,
    };
  }

  componentDidMount() {
    // Subscribe to network state changes
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      const wasOnline = this.state.isOnline;
      const isNowOnline = state.isConnected ?? false;
      
      if (wasOnline !== isNowOnline) {
        this.setState({ isOnline: isNowOnline });
        
        if (!isNowOnline) {
          this.setState({ hasNetworkError: true });
          logError('Network connection lost', { isConnected: isNowOnline });
        } else {
          this.setState({ hasNetworkError: false });
          logError('Network connection restored', { isConnected: isNowOnline });
        }
      }
    });

    // Check initial network state
    NetInfo.fetch().then(state => {
      this.setState({ isOnline: state.isConnected ?? false });
    }).catch(error => {
      logError('Failed to check initial network state:', error);
    });
  }

  componentWillUnmount() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
  }

  handleRetry = () => {
    NetInfo.fetch().then(state => {
      const isNowOnline = state.isConnected ?? false;
      this.setState({ 
        isOnline: isNowOnline,
        hasNetworkError: !isNowOnline
      });
      
      if (isNowOnline) {
        Alert.alert('Connection Restored', 'You are back online. Please try your action again.');
      }
    }).catch(error => {
      logError('Failed to retry network connection:', error);
      Alert.alert('Connection Failed', 'Unable to check network status. Please check your device settings.');
    });
  };

  render() {
    if (this.state.hasNetworkError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }
      
      return (
        <View style={styles.container}>
          <ThemedNetworkErrorDisplay 
            onRetry={this.handleRetry}
            isOnline={this.state.isOnline}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const ThemedNetworkErrorDisplay = ({ onRetry, isOnline }: { 
  onRetry: () => void; 
  isOnline: boolean;
}) => {
  const { colors } = useTheme();
  
  return (
    <>
      <Text style={[styles.title, { color: colors.text }]}>
        {isOnline ? 'Connection Issue' : 'No Internet Connection'}
      </Text>
      <Text style={[styles.errorText, { color: colors.text }]}>
        {isOnline 
          ? 'Unable to connect to our servers. Please check your internet connection and try again.'
          : 'You appear to be offline. Please connect to the internet to continue.'
        }
      </Text>
      <Button
        title="Try Again"
        onPress={onRetry}
        color={colors.primary}
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {isOnline 
          ? 'If the problem persists, please check your network settings or contact support.'
          : 'Some features may still be available in offline mode.'
        }
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  hint: {
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    opacity: 0.7,
  },
});

// Higher-order component for easy usage
export const withNetworkErrorBoundary = (WrappedComponent: React.ComponentType, fallbackComponent?: ReactNode) => {
  return (props: any) => (
    <NetworkErrorBoundary fallbackComponent={fallbackComponent}>
      <WrappedComponent {...props} />
    </NetworkErrorBoundary>
  );
};

export default NetworkErrorBoundary;