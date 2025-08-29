import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient, performTokenRefresh } from "../lib/queryClient";
import { useToast } from "./use-toast";
import {
  updateTokensFromResponse,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  isTokenExpired,
  isTokenExpiringSoon,
  cleanupExpiredTokens,
  validateTokenForRequest,
  cleanupAllAuthData,
  getTokenTimeRemaining
} from "../lib/tokenManager";
import { logError, logInfo, logWarning } from "../lib/config";
import {
  AuthError,
  AuthErrorType,
  createAuthError,
  parseApiError,
  handleAuthError
} from "../lib/errorHandling";
import { useErrorHandler, useErrorContext } from "../contexts/ErrorContext";

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  token?: string; // Optional JWT token for authentication
}
import { useLocation } from "wouter";
import { z } from "zod";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  refreshMutation: UseMutationResult<{ accessToken: string }, Error, { refreshToken: string }>;
  isRefreshing: boolean;
  authError: string | null;
};

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenCleanupTriggered, setTokenCleanupTriggered] = useState(false);
  const { state, actions } = useErrorContext();
  const { handleError, showErrorNotification, dismissError } = useErrorHandler();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/auth/login", credentials);
        const responseData = await res.json();
        
        // Handle new response format with user and tokens
        if (responseData.tokens && responseData.user) {
          // Store the access and refresh tokens using token manager
          updateTokensFromResponse(responseData);
          // Return user data
          return responseData.user;
        } else if (responseData.token) {
          // Fallback for old format
          updateTokensFromResponse(responseData);
          return responseData;
        }
        
        return responseData;
      } catch (error) {
        // Convert error to AuthError and handle it
        const authError = parseApiError(error);
        await handleError(authError);
        throw authError;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.firstName} ${user.lastName}`,
      });
      
      // Clear any authentication errors
      actions.clearAllErrors();
    },
    onError: (error: Error) => {
      const authError = parseApiError(error);
      showErrorNotification(authError);
      
      toast({
        title: "Login failed",
        description: authError.userMessage,
        variant: "destructive",
        action: authError.recovery === 'RELOGIN' ? {
          label: "Retry",
          onClick: () => loginMutation.mutateAsync(loginMutation.variables as LoginData)
        } : undefined
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      try {
        // Omit confirmPassword before sending to API
        const { confirmPassword, ...credentials } = data;
        const res = await apiRequest("POST", "/api/auth/register", credentials);
        const responseData = await res.json();
        
        // Handle new response format with user and tokens
        if (responseData.tokens && responseData.user) {
          // Store the access and refresh tokens using token manager
          updateTokensFromResponse(responseData);
          // Return user data
          return responseData.user;
        } else if (responseData.token) {
          // Fallback for old format
          updateTokensFromResponse(responseData);
          return responseData;
        }
        
        return responseData;
      } catch (error) {
        // Convert error to AuthError and handle it
        const authError = parseApiError(error);
        await handleError(authError);
        throw authError;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      toast({
        title: "Registration successful!",
        description: `Welcome to NutriScan, ${user.firstName}!`,
      });
      // Redirect to onboarding for new users
      navigate("/onboarding");
      
      // Clear any authentication errors
      actions.clearAllErrors();
    },
    onError: (error: Error) => {
      const authError = parseApiError(error);
      showErrorNotification(authError);
      
      toast({
        title: "Registration failed",
        description: authError.userMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        // Log the error but continue with logout process
        logError("Logout API call failed", error);
        throw error; // Re-throw to trigger onError
      }
    },
    onSuccess: () => {
      // Clear all authentication data
      cleanupAllAuthData();
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.removeQueries(); // Clear all cached queries
      setAuthError(null);
      setTokenCleanupTriggered(true);
      actions.clearAllErrors(); // Clear error state
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate("/login");
    },
    onError: async (error: Error) => {
      const authError = parseApiError(error);
      await handleError(authError);
      
      // Even if logout API fails, clear local tokens and data
      try {
        cleanupAllAuthData();
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.removeQueries();
        setAuthError(null);
        setTokenCleanupTriggered(true);
        actions.clearAllErrors();
        navigate("/login");
      } catch (cleanupError) {
        logError("Failed to cleanup tokens during failed logout", cleanupError);
      }
      
      toast({
        title: "Logout failed",
        description: authError.userMessage,
        variant: "destructive",
      });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async ({ refreshToken }: { refreshToken: string }) => {
      try {
        const res = await apiRequest("POST", "/api/auth/refresh", { refreshToken });
        return await res.json();
      } catch (error) {
        const authError = parseApiError(error);
        throw authError;
      }
    },
    onSuccess: (data) => {
      // Store new access token using token manager
      setAccessToken(data.accessToken);
      setAuthError(null);
      setTokenCleanupTriggered(false);
      actions.clearAllErrors(); // Clear error state
      // Update query client with new token
      queryClient.setQueryDefaults(["/api/auth/me"], {
        queryFn: getQueryFn({ on401: "returnNull" }),
      });
      logInfo("Token refresh successful");
    },
    onError: async (error: Error) => {
      const authError = parseApiError(error);
      await handleError(authError);
      
      logError("Token refresh failed", authError);
      
      // If refresh fails, clear all auth data and redirect to login
      try {
        cleanupAllAuthData();
        queryClient.setQueryData(["/api/auth/me"], null);
        queryClient.removeQueries();
        setAuthError("Session expired. Please log in again.");
        setTokenCleanupTriggered(true);
        
        toast({
          title: "Session expired",
          description: authError.userMessage,
          variant: "destructive",
          action: {
            label: "Login",
            onClick: () => navigate("/login"),
          },
        });
        navigate("/login");
      } catch (cleanupError) {
        logError("Failed to cleanup tokens during refresh failure", cleanupError);
        throw cleanupError;
      }
    },
  });

  // Check for existing tokens on component mount
  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    if (accessToken && !user) {
      // Token exists but no user data, try to fetch user profile
      // This will be handled by the existing query
      logInfo("Access token found, fetching user profile");
    }
    
    // Ensure refresh token is stored if it exists
    if (!getRefreshToken() && refreshToken) {
      // This case should be handled by updateTokensFromResponse
      // but we add this as a safety measure
      setRefreshToken(refreshToken);
    }
    
    // Check for auth errors and show toast notification
    if (authError) {
      const authErrorObj = createAuthError(AuthErrorType.SESSION_EXPIRED, authError);
      showErrorNotification(authErrorObj);
      
      toast({
        title: "Authentication Error",
        description: authError,
        variant: "destructive",
      });
      setAuthError(null); // Clear after showing toast
    }
  }, [user, authError, toast]);

  // Automatic token cleanup and expiration handling
  useEffect(() => {
    const handleTokenCleanup = () => {
      try {
        cleanupExpiredTokens();
        
        // Check if access token is expired
        if (getAccessToken() && isTokenExpired()) {
          logWarning("Access token expired, attempting cleanup");
          cleanupExpiredTokens();
          
          // If refresh token also exists but is expired, clear everything
          if (getRefreshToken() && isTokenExpired(getRefreshToken() as string)) {
            logWarning("Both tokens expired, forcing logout");
            setTokenCleanupTriggered(true);
            const sessionError = createAuthError(AuthErrorType.SESSION_EXPIRED, "Your session has expired. Please log in again.");
            actions.addError(sessionError);
            showErrorNotification(sessionError);
            
            toast({
              title: "Session Expired",
              description: sessionError.userMessage,
              variant: "destructive",
              action: {
                label: "Login",
                onClick: () => navigate("/login"),
              },
            });
            // Don't navigate immediately to allow user to see the message
          }
        }
        
        // Check if token is expiring soon and preemptively refresh
        if (getAccessToken() && isTokenExpiringSoon(5)) {
          logInfo("Token expiring soon, attempting refresh");
          const refreshToken = getRefreshToken();
          if (refreshToken) {
            performTokenRefresh().catch(error => {
              const refreshError = parseApiError(error);
              handleError(refreshError);
              logError("Preemptive token refresh failed", error);
            });
          }
        }
      } catch (error) {
        logError("Token cleanup failed", error);
      }
    };

    // Run cleanup on mount and every minute
    handleTokenCleanup();
    const intervalId = setInterval(handleTokenCleanup, 60000); // Check every minute

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      try {
        cleanupExpiredTokens();
      } catch (error) {
        logError("Failed to cleanup tokens on page unload", error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate, toast]);

  // Handle token cleanup trigger
  useEffect(() => {
    if (tokenCleanupTriggered) {
      try {
        cleanupAllAuthData();
        queryClient.removeQueries();
        setAuthError(null);
        logInfo("Token cleanup trigger processed successfully");
      } catch (error) {
        logError("Failed to process token cleanup trigger", error);
      } finally {
        setTokenCleanupTriggered(false);
      }
    }
  }, [tokenCleanupTriggered, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        refreshMutation,
        isRefreshing,
        authError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper function to refresh access token (deprecated - use performTokenRefresh from queryClient)
export const refreshAccessToken = async (): Promise<string | null> => {
  logWarning('refreshAccessToken is deprecated, use performTokenRefresh from queryClient');
  return performTokenRefresh();
};
