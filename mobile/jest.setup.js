import '@testing-library/jest-native/extend-expect';
import React from 'react';

// Mock Image component
jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native');
  ReactNative.Image = {
    ...ReactNative.Image,
    resolveAssetSource: () => ({ uri: 'mock-image' }),
  };
  return ReactNative;
});

// Mock require for image assets
const mockRequire = (path) => {
  if (path.includes('.png') || path.includes('.jpg') || path.includes('.jpeg')) {
    return { uri: 'mock-image' };
  }
  return require(path);
};

// Override require for image files
global.require = jest.fn().mockImplementation(mockRequire);

// Mock React Native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Camera
jest.mock('expo-camera', () => ({
  Camera: jest.fn().mockImplementation(({ children }) => children),
  CameraType: {
    back: 'back',
    front: 'front',
  },
}));

// Mock ImagePicker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

// Mock ImageManipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
}));

// Mock FileSystem
jest.mock('expo-file-system', () => ({
  getInfoAsync: jest.fn(),
  deleteAsync: jest.fn(),
  copyAsync: jest.fn(),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: jest.fn(),
}));

// Mock Font loading
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
}));

// Mock SplashScreen
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// Mock StatusBar
jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(),
}));

// Mock LinearGradient - return a simple div for testing
jest.mock('expo-linear-gradient', () => {
  return function LinearGradient(props) {
    return { ...props, children: props.children, __mock: 'LinearGradient' };
  };
});

// Mock Vector Icons - return a simple text element for testing
jest.mock('@expo/vector-icons', () => {
  return function MockIcon({ name, size, color, ...props }) {
    return {
      ...props,
      name,
      size,
      color,
      testID: `icon-${name}`,
      __mock: 'VectorIcon'
    };
  };
});

// Mock Toast
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock React Query
const { QueryClient } = require('@tanstack/react-query');
const mockQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  })),
  useQueryClient: jest.fn(() => mockQueryClient),
  QueryClient: jest.fn(() => mockQueryClient),
}));

// Mock i18n
jest.mock('./src/i18n', () => ({
  t: (key) => key,
}));

// Mock Theme Context
jest.mock('./src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#4F46E5',
      text: '#000000',
      gray: '#666666',
      card: '#FFFFFF',
      border: '#E5E7EB',
    },
  }),
}));

// Mock Auth Context
jest.mock('./src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      firstName: 'John',
    },
  }),
}));

// Mock Config
jest.mock('./src/config', () => ({
  API_URL: 'http://localhost:5001',
}));

// Mock Fetch Wrapper
jest.mock('./src/utils/fetchWrapper', () => ({
  safeFetchJson: jest.fn(),
}));

// Mock Services
jest.mock('./src/services/nutritionCoachService', () => ({
  askQuestion: jest.fn(),
}));

// Mock other services
jest.mock('./src/services/apiService', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

jest.mock('./src/services/mealService', () => ({
  getMeals: jest.fn(),
  getMealById: jest.fn(),
  createMeal: jest.fn(),
  updateMeal: jest.fn(),
  deleteMeal: jest.fn(),
}));

jest.mock('./src/services/mealAnalysisService', () => ({
  analyzeFood: jest.fn(),
  analyzeMultiFood: jest.fn(),
}));

jest.mock('./src/services/mealPlanService', () => ({
  getMealPlan: jest.fn(),
  generateMealPlan: jest.fn(),
  saveMealPlan: jest.fn(),
}));

jest.mock('./src/services/profileService', () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('./src/services/cameraService', () => ({
  capturePhoto: jest.fn(),
  selectPhoto: jest.fn(),
}));

// Mock Components
jest.mock('./src/components/home/NutritionSummaryCard', () => 'NutritionSummaryCard');
jest.mock('./src/components/home/RecentMealsCard', () => 'RecentMealsCard');
jest.mock('./src/components/home/AiInsightsCard', () => 'AiInsightsCard');
jest.mock('./src/components/home/MealPlanCard', () => 'MealPlanCard');
jest.mock('./src/components/home/NutritionTipsCard', () => 'NutritionTipsCard');
jest.mock('./src/components/home/AchievementsCard', () => 'AchievementsCard');

// Suppress console errors during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
};