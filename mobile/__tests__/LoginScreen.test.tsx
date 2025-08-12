import React from 'react';
import { render as testingLibraryRender, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import LoginScreen from '../src/screens/LoginScreen';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';

// Create a custom render function with all providers
const render = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return testingLibraryRender(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NavigationContainer>
            {component}
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

// Mock useNavigation hook
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock contexts
jest.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

jest.mock('../src/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#ffffff',
      text: '#000000',
      primary: '#007AFF',
      card: '#f5f5f5',
      border: '#ccc',
      error: '#ff3b30',
      gray: '#8e8e93',
    },
  }),
}));

// Mock i18n
jest.mock('../src/i18n', () => ({
  t: (key) => key,
}));

// Mock API URL
jest.mock('../src/config', () => ({
  API_URL: 'http://localhost:3000',
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<LoginScreen />);
    
    expect(getByText('auth.login')).toBeTruthy();
    expect(getByPlaceholderText('auth.email')).toBeTruthy();
    expect(getByPlaceholderText('auth.password')).toBeTruthy();
  });

  it('validates email input', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    const emailInput = getByPlaceholderText('auth.email');
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent(emailInput, 'onBlur');
    
    expect(getByText('auth.invalidEmail')).toBeTruthy();
  });

  it('validates password input', () => {
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    const passwordInput = getByPlaceholderText('auth.password');
    fireEvent.changeText(passwordInput, '');
    fireEvent(passwordInput, 'onBlur');
    
    expect(getByText('auth.passwordRequirements')).toBeTruthy();
  });

  it('navigates to register screen when register link is pressed', () => {
    const { getByText } = render(<LoginScreen />);
    
    const registerLink = getByText('auth.createAccount');
    fireEvent.press(registerLink);
    
    // Since we're mocking the useNavigation hook, we need to access the mock differently
    const mockNavigate = require('@react-navigation/native').useNavigation().navigate;
    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('navigates to forgot password screen when forgot password link is pressed', () => {
    const { getByText } = render(<LoginScreen />);
    
    const forgotPasswordLink = getByText('auth.forgotPassword');
    fireEvent.press(forgotPasswordLink);
    
    // Since we're mocking the useNavigation hook, we need to access the mock differently
    const mockNavigate = require('@react-navigation/native').useNavigation().navigate;
    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });
});