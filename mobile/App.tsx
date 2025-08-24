import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator } from 'react-native';

import { AuthProvider } from './src/contexts/AuthContext';
import Navigation from './src/navigation';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { setupI18n } from './src/i18n';
import { initializeNetworkMonitoring } from './src/services/apiService';
import { offlineManager } from './src/utils/offlineManager';
import ErrorHandler from './src/utils/errorHandler';
import { log, logError, APP_CONFIG, API_URL, ENABLE_LOGGING } from './src/config';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on validation errors
        if (error?.type === 'validation') return false;
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations by default
        return false;
      },
      onError: (error: any) => {
        ErrorHandler.handleError(error, 'React Query Mutation');
      },
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
log(`=== APP INITIALIZATION DEBUG ===`);
        log(`Starting ${APP_CONFIG.appName} v${APP_CONFIG.version} initialization...`);
        log(`Environment: ${APP_CONFIG.environment}`);
        log(`API URL: ${API_URL}`);
        log(`Enable Logging: ${ENABLE_LOGGING}`);
        log(`===============================`);
        log(`Starting ${APP_CONFIG.appName} v${APP_CONFIG.version} initialization...`);
        
        // Initialize i18n
        log('Setting up internationalization...');
        await setupI18n();
        
        // Initialize network monitoring
        log('Setting up network monitoring...');
        initializeNetworkMonitoring();
        
        // Initialize offline manager
        log('Initializing offline manager...');
        await offlineManager.initialize();
        
        // Pre-load fonts with better error handling
        try {
          log('Loading custom fonts...');
          await Font.loadAsync({
            'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
            'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
            'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
            'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
          });
          log('Custom fonts loaded successfully');
        } catch (fontError) {
          logError('Font loading failed:', fontError);
          log('App will use system fonts as fallback');
          // App continues with system fonts - this is not a fatal error
        }

        // Additional production setup
        await performProductionSetup();
        
        log('App initialization completed successfully');
      } catch (e) {
        const error = await ErrorHandler.normalizeError(e);
        logError('Critical app initialization error:', error);
        setInitError(error.message);
        
        // Still allow app to start in case of non-critical errors
        if (error.type !== 'network') {
          log('Continuing app startup despite initialization error');
        }
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Additional production setup tasks
  async function performProductionSetup(): Promise<void> {
    try {
      // Clear old cache data on app updates
      const lastAppVersion = await AsyncStorage.getItem('app_version');
      if (lastAppVersion !== APP_CONFIG.version) {
        log('App version changed, clearing cache...');
        await Promise.all([
          queryClient.clear(),
          offlineManager.clearOfflineData(),
        ]);
        await AsyncStorage.setItem('app_version', APP_CONFIG.version);
      }

      // Sync pending offline actions if needed
      if (offlineManager.hasPendingActions()) {
        log('Found pending offline actions, attempting sync...');
        // Don't await this - let it happen in background
        offlineManager.forceSync().catch(error => {
          log('Background sync failed:', error);
        });
      }

    } catch (error) {
      logError('Production setup error:', error);
      // Don't throw - these are non-critical
    }
  }

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Show loading screen during initialization
  if (!appIsReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#4F46E5' 
      }}>
        <Text style={{ 
          color: 'white', 
          fontSize: 24, 
          fontWeight: 'bold', 
          marginBottom: 20 
        }}>
          🍎 AI Calorie Tracker
        </Text>
        <ActivityIndicator size="large" color="white" />
        <Text style={{ 
          color: 'white', 
          marginTop: 10, 
          opacity: 0.8 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  // Show error screen if initialization failed critically
  if (initError && !appIsReady) {
    return (
      <SafeAreaProvider>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: 20,
          backgroundColor: '#FEF2F2' 
        }}>
          <Text style={{ 
            color: '#DC2626', 
            fontSize: 20, 
            fontWeight: 'bold', 
            marginBottom: 10 
          }}>
            Initialization Failed
          </Text>
          <Text style={{ 
            color: '#7F1D1D', 
            textAlign: 'center',
            marginBottom: 20 
          }}>
            {initError}
          </Text>
          <Text style={{ 
            color: '#7F1D1D', 
            fontSize: 12, 
            textAlign: 'center',
            opacity: 0.7 
          }}>
            Please restart the app or check your connection
          </Text>
        </View>
        <Toast />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <NavigationContainer>
              <Navigation />
              <StatusBar style="auto" />
            </NavigationContainer>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
      <Toast />
    </SafeAreaProvider>
  );
}