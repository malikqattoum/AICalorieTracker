import { validateApiResponse } from './responseValidator';
import { ApiMonitoring } from './monitoring';
import { logError } from '../config';

/**
 * Wraps an API call to handle JSON parsing errors gracefully
 * @param apiCall The API call function to wrap
 * @param fallbackData Fallback data to use if the API call fails
 * @param endpoint The API endpoint for logging purposes
 * @returns Promise that resolves with the API response or fallback data
 */
export const withJsonErrorHandling = async <T>(
  apiCall: () => Promise<T>,
  fallbackData?: T,
  endpoint: string = 'unknown'
): Promise<T> => {
  try {
    const response = await apiCall();
    
    // Validate the response
    const validation = validateApiResponse(response, endpoint, fallbackData);
    
    if (!validation.isValid) {
      // Log the error for monitoring
      ApiMonitoring.logJsonParseError(
        new Error(validation.error || 'Invalid response'),
        endpoint,
        { data: response }
      );

      // Use fallback data if available
      if (validation.fallbackData) {
        return validation.fallbackData;
      }

      // If no fallback data provided, throw the error
      throw new Error(`Invalid API response: ${validation.error}`);
    }

    return response;
  } catch (error) {
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      logError('JSON Parse Error in wrapped API call:', {
        endpoint,
        error: error.message,
        fallbackData: !!fallbackData
      });

      // Return fallback data if available
      if (fallbackData) {
        return fallbackData;
      }

      // If no fallback data, re-throw the error
      throw error;
    }

    // For other types of errors, re-throw them
    throw error;
  }
};

/**
 * Creates a safe version of an API service method that handles JSON errors
 * @param apiMethod The API method to wrap
 * @param fallbackData Fallback data for this specific method
 * @returns Wrapped API method with error handling
 */
export const createSafeApiMethod = <T extends any[], R>(
  apiMethod: (...args: T) => Promise<R>,
  fallbackData: R,
  endpoint: string
) => {
  return async (...args: T): Promise<R> => {
    return withJsonErrorHandling(
      () => apiMethod(...args),
      fallbackData,
      endpoint
    );
  };
};

/**
 * Default fallback data for common endpoints
 */
export const DEFAULT_FALLBACK_DATA = {
  // Auth endpoints
  '/api/auth/me': {
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@example.com',
    isPremium: false,
  },
  
  // User profile endpoints
  '/api/user/profile': {
    totalMeals: 0,
    streakDays: 0,
    perfectDays: 0,
    favoriteFoods: [],
  },

  // User settings endpoints
  '/api/user/settings': {
    notifications: {
      mealReminders: true,
      weeklyReports: true,
      tips: true,
    },
    privacy: {
      shareAnalytics: true,
      storeImages: false,
    },
    goals: {
      calorieGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 200,
      fatGoal: 65,
    },
  },

  // Meals endpoints
  '/api/meals': [],
  
  // Meal plans endpoints
  '/api/meal-plans': [],
};

/**
 * Gets fallback data for a specific endpoint
 * @param endpoint The API endpoint
 * @returns Fallback data for the endpoint or undefined
 */
export const getFallbackDataForEndpoint = (endpoint: string): any => {
  // Check for exact match first
  if (endpoint in DEFAULT_FALLBACK_DATA) {
    return DEFAULT_FALLBACK_DATA[endpoint as keyof typeof DEFAULT_FALLBACK_DATA];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(DEFAULT_FALLBACK_DATA)) {
    if (endpoint.includes(key)) {
      return value;
    }
  }

  return undefined;
};

/**
 * Safely parses a JSON string with error handling
 * @param jsonString The JSON string to parse
 * @param fallbackValue Value to return if parsing fails
 * @param context Context for error logging
 * @returns Parsed object or fallback value
 */
export const safeJsonParse = <T = any>(
  jsonString: string,
  fallbackValue: T,
  context: string = 'unknown'
): T => {
  try {
    // Check if string is empty or just whitespace
    if (typeof jsonString !== 'string' || jsonString.trim() === '') {
      logError('Empty JSON string detected:', {
        context,
        input: jsonString.substring(0, 50) + '...'
      });
      return fallbackValue;
    }
    
    const parsed = JSON.parse(jsonString);
    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      logError('JSON Parse Error:', {
        context,
        error: error.message,
        jsonString: jsonString.substring(0, 100) + '...'
      });
    }
    return fallbackValue;
  }
};