# Mobile App Documentation

## Overview

This document provides comprehensive documentation for the AICalorieTracker mobile application, including setup, architecture, components, and troubleshooting.

## Table of Contents

1. [Setup and Installation](#setup-and-installation)
2. [Project Structure](#project-structure)
3. [Architecture Overview](#architecture-overview)
4. [Core Components](#core-components)
5. [Error Handling](#error-handling)
6. [Offline Functionality](#offline-functionality)
7. [Permission Management](#permission-management)
8. [Theme System](#theme-system)
9. [API Integration](#api-integration)
10. [Performance Monitoring](#performance-monitoring)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

## Setup and Installation

### Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Expo CLI (for development)
- Android Studio / Xcode (for native builds)
- MySQL Database

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```
   API_URL=https://your-api-domain.com
   SENTRY_DSN=your-sentry-dsn
   ENABLE_LOGGING=true
   ```

4. **Install pods (iOS)**
   ```bash
   cd ios && pod install && cd ..
   ```

5. **Start the development server**
   ```bash
   npx expo start
   ```

## Project Structure

```
mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── NetworkErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── PermissionHandler.tsx
│   │   ├── OfflineIndicator.tsx
│   │   └── premium/
│   │       └── RealTimeMonitoring.tsx
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── WebSocketContext.tsx
│   │   └── CacheContext.tsx
│   ├── services/           # API and service layers
│   │   ├── api.ts
│   │   ├── cacheService.ts
│   │   └── apiService.ts
│   ├── utils/              # Utility functions
│   │   ├── errorHandler.ts
│   │   ├── jsonErrorHandler.ts
│   │   ├── responseValidator.ts
│   │   ├── monitoring.ts
│   │   └── offlineManager.ts
│   ├── screens/            # Screen components
│   ├── navigation/         # Navigation setup
│   └── config/             # Configuration files
├── assets/                 # Images, fonts, etc.
├── types/                  # TypeScript type definitions
└── package.json
```

## Architecture Overview

### Component Architecture

The app follows a modular component architecture with clear separation of concerns:

1. **Presentation Layer**: UI components and screens
2. **Business Logic Layer**: Services and utilities
3. **Data Layer**: API integration and state management
4. **Infrastructure Layer**: Error handling, monitoring, and offline support

### State Management

The app uses React Context for global state management:

- **AuthContext**: User authentication state
- **ThemeContext**: App theme and colors
- **WebSocketContext**: Real-time communication
- **CacheContext**: Data caching and offline access

### Data Flow

1. **User Actions** → **Component Handlers** → **API Services**
2. **API Response** → **State Updates** → **UI Re-render**
3. **Error Handling** → **User Feedback** → **Error Logging**

## Core Components

### ErrorBoundary

A React component that catches JavaScript errors in the component tree, logs them, and displays a fallback UI.

```typescript
import { ErrorBoundary } from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### NetworkErrorBoundary

Monitors network connectivity and provides appropriate fallbacks when the device is offline.

```typescript
import { NetworkErrorBoundary } from '../components/NetworkErrorBoundary';

function App() {
  return (
    <NetworkErrorBoundary>
      <YourComponent />
    </NetworkErrorBoundary>
  );
}
```

### LoadingSpinner

Provides various loading states with customizable options:

```typescript
import { LoadingSpinner, FullScreenLoading } from '../components/LoadingSpinner';

function MyComponent() {
  return (
    <LoadingSpinner text="Loading..." size="large" />
  );
}
```

### PermissionHandler

Manages app permissions with user-friendly prompts and fallbacks.

```typescript
import { PermissionHandler, withPermission } from '../components/PermissionHandler';

function CameraComponent() {
  return (
    <PermissionHandler permission="camera">
      <Camera />
    </PermissionHandler>
  );
}

// Higher-order component usage
const ProtectedCamera = withPermission('camera')(CameraComponent);
```

### OfflineIndicator

Shows real-time offline status and sync progress.

```typescript
import { OfflineIndicator } from '../components/OfflineIndicator';

function App() {
  return (
    <>
      <OfflineIndicator showSyncStatus={true} />
      <MainContent />
    </>
  );
}
```

## Error Handling

### Error Types

The app categorizes errors into different types:

- **Network**: Connectivity issues
- **Validation**: Invalid user input
- **Authentication**: Login/permission issues
- **Permission**: Missing app permissions
- **Server**: Server-side errors
- **JSONParse**: Data parsing errors
- **Unknown**: Unexpected errors

### Error Handling Flow

1. **Error Detection**: Components catch errors
2. **Error Normalization**: Convert to standardized format
3. **Error Logging**: Log to monitoring services
4. **User Feedback**: Show appropriate error messages
5. **Error Recovery**: Provide retry mechanisms

### Global Error Setup

```typescript
import { setupGlobalErrorHandling } from '../utils/monitoring';

// App.tsx
useEffect(() => {
  setupGlobalErrorHandling();
}, []);
```

## Offline Functionality

### Offline Manager

The `OfflineManager` class handles offline operations:

```typescript
import { offlineManager } from '../utils/offlineManager';

// Queue an action for offline execution
await offlineManager.queueAction({
  type: 'CREATE',
  endpoint: '/api/meals',
  method: 'POST',
  data: mealData,
  maxRetries: 3
});

// Check sync status
const status = offlineManager.getSyncStatus();
```

### Offline Data Storage

```typescript
// Store data for offline use
await offlineManager.storeOfflineData('userProfile', userData);

// Retrieve offline data
const profile = await offlineManager.getOfflineData('userProfile');
```

## Permission Management

### Permission Types

- **camera**: Camera access
- **photoLibrary**: Photo library access
- **location**: Location services
- **notification**: Push notifications
- **storage**: File system access
- **microphone**: Audio recording

### Permission Hooks

```typescript
import { usePermission } from '../components/PermissionHandler';

function CameraComponent() {
  const { status, requestPermission, isGranted } = usePermission('camera');
  
  if (!isGranted) {
    return <Button title="Enable Camera" onPress={requestPermission} />;
  }
  
  return <Camera />;
}
```

## Theme System

### Theme Configuration

The app supports light, dark, and system themes:

```typescript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, colors, setTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.text }}>Hello World</Text>
    </View>
  );
}
```

### Custom Themes

```typescript
// Add custom themes to ThemeContext.tsx
const customColors: ThemeColors = {
  primary: '#FF6B6B',
  background: '#F8F9FA',
  // ... other colors
};
```

## API Integration

### API Service

```typescript
import { apiService } from '../services/apiService';

// GET request
const userData = await apiService.get('/api/user/profile');

// POST request
const response = await apiService.post('/api/meals', mealData);

// Error handling
apiService.get('/api/data')
  .catch(error => {
    console.error('API Error:', error);
  });
```

### Request Interceptors

```typescript
// Add authentication token
apiService.interceptors.request.use(config => {
  const token = SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Response Interceptors

```typescript
// Handle common responses
apiService.interceptors.response.use(response => {
  // Parse string responses as JSON
  if (typeof response.data === 'string') {
    try {
      response.data = JSON.parse(response.data);
    } catch (e) {
      // Handle parse error
    }
  }
  return response;
});
```

## Performance Monitoring

### Performance Metrics

```typescript
import { PerformanceMetrics } from '../utils/monitoring';

// Measure operation performance
const result = await PerformanceMetrics.measureInteraction('data-fetch', async () => {
  return await apiService.get('/api/data');
});

// Track navigation
PerformanceMetrics.trackNavigation('Home', 'Profile', navigationTime);
```

### Error Tracking

```typescript
import { reportCrash } from '../utils/monitoring';

// Report errors
try {
  // risky operation
} catch (error) {
  reportCrash(error, { context: 'user-action' });
}
```

## Testing

### Unit Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react-native';
import { LoadingSpinner } from '../components/LoadingSpinner';

test('renders loading spinner', () => {
  render(<LoadingSpinner />);
  expect(screen.getByTestId('loading-spinner')).toBeTruthy();
});
```

### Integration Testing

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../screens/LoginScreen';

test('successful login', async () => {
  render(<LoginScreen />);
  fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
  fireEvent.press(screen.getByTestId('login-button'));
  
  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeTruthy();
  });
});
```

## Deployment

### Build for Android

```bash
# Generate Android build
eas build --platform android

# Build with specific profile
eas build --platform android --profile production
```

### Build for iOS

```bash
# Generate iOS build
eas build --platform ios

# Build with specific profile
eas build --platform ios --profile production
```

### Update App Store

```bash
# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## Troubleshooting

### Common Issues

#### Build Errors

**Issue**: "Failed to build iOS project"
```bash
# Clean build
cd ios && rm -rf Pods && rm -rf Podfile.lock && pod install && cd ..
```

**Issue**: "Android build failed"
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

#### Runtime Errors

**Issue**: "Network request failed"
```typescript
// Check network status
const netInfo = await NetInfo.fetch();
if (!netInfo.isConnected) {
  // Handle offline state
}
```

**Issue**: "Permission denied"
```typescript
// Request permission
const { status } = await request(PERMISSIONS.ANDROID.CAMERA);
if (status !== RESULTS.GRANTED) {
  // Handle permission denial
}
```

#### Performance Issues

**Issue**: "App is slow"
```typescript
// Enable performance monitoring
import { PerformanceMetrics } from '../utils/monitoring';

// Measure slow operations
const startTime = Date.now();
// ... slow operation
const duration = Date.now() - startTime;
console.log(`Operation took ${duration}ms`);
```

### Debug Tools

### React Native Debugger

```bash
# Start React Native Debugger
react-native-debugger
```

### Flipper

```bash
# Install Flipper
npm install flipper-react-native

# Start Flipper
npx flipper
```

### Sentry Integration

```typescript
// Initialize Sentry
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'your-sentry-dsn',
  tracesSampleRate: 1.0,
});
```

## Best Practices

### Code Organization

1. **Keep components small and focused**
2. **Use TypeScript for type safety**
3. **Follow consistent naming conventions**
4. **Write comprehensive tests**

### Performance Optimization

1. **Use React.memo for expensive components**
2. **Implement proper key props in lists**
3. **Use FlatList instead of ScrollView for long lists**
4. **Optimize images with proper caching**

### Security

1. **Store sensitive data securely**
2. **Validate all user inputs**
3. **Use HTTPS for all API calls**
4. **Implement proper error handling without exposing sensitive data**

### Accessibility

1. **Provide proper accessibility labels**
2. **Support screen readers**
3. **Ensure sufficient color contrast**
4. **Test with different font sizes**

## Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
3. **Run tests**
   ```bash
   npm test
   ```

4. **Submit a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style

- Use ESLint and Prettier
- Follow the existing code style
- Write meaningful commit messages
- Update documentation as needed

## Support

For additional support:

1. **Check the troubleshooting section**
2. **Search existing issues**
3. **Create a new issue with detailed information**
4. **Contact the development team**

---

*This documentation is continuously updated. Please check for the latest version.*