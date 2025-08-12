import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '../config';

// Define user type
export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isPremium: boolean;
  role: string;
  createdAt: string;
};

// Define context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  error: string | null;
  clearError: () => void;
};

// Define register data type
type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Setup axios instance
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add token to requests
  api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Check if user is logged in on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          // Validate token and get user data
          const response = await api.get('/api/auth/me');
          setUser(response.data);
        }
      } catch (err) {
        console.log('Failed to load user:', err);
        await SecureStore.deleteItemAsync('token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login with token and user
  const login = async (token: string, user: User) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Save token securely
      await SecureStore.setItemAsync('token', token);
      
      // Set user in state
      setUser(user);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Login with credentials
  const loginWithCredentials = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      // Use the login function to save token and set user
      await login(token, user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      // Save token securely
      await SecureStore.setItemAsync('token', token);
      
      // Set user in state
      setUser(user);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Call logout endpoint
      await api.post('/api/auth/logout');
      
      // Remove token
      await SecureStore.deleteItemAsync('token');
      
      // Clear user from state
      setUser(null);
    } catch (err) {
      console.log('Logout error:', err);
      // Still remove token and user even if API call fails
      await SecureStore.deleteItemAsync('token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Update user function
  const updateUser = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      
      const response = await api.put('/api/auth/update-profile', userData);
      
      // Update user in state
      setUser(prev => prev ? { ...prev, ...response.data } : null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    isLoading,
    login,
    loginWithCredentials,
    register,
    logout,
    updateUser,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};