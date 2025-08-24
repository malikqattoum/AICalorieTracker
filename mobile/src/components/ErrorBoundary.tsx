import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { reportCrash } from '../utils/monitoring';
import { useTheme } from '../contexts/ThemeContext';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    reportCrash(error, {
      componentStack: errorInfo.componentStack,
      timestamp: Date.now()
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ThemedErrorDisplay 
            error={this.state.error} 
            onReset={this.handleReset}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const ThemedErrorDisplay = ({ error, onReset }: { error?: Error, onReset: () => void }) => {
  const { colors } = useTheme();
  
  return (
    <>
      <Text style={[styles.title, { color: colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.errorText, { color: colors.text }]}>
        {error?.message || 'Unknown error'}
      </Text>
      <Button
        title="Try Again"
        onPress={onReset}
        color={colors.primary}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Inter-Bold'
  },
  errorText: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    fontFamily: 'Inter-Regular'
  }
});