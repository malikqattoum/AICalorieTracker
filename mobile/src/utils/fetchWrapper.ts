/**
 * Wrapper for fetch() that handles JSON parsing errors gracefully
 * @param input The resource to fetch
 * @param init Request init options
 * @returns Promise that resolves with the response, handling JSON parsing errors
 */
export const safeFetch = async (
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> => {
  try {
    const response = await fetch(input, init);
    
    // If response is not OK, return it as-is for the caller to handle
    if (!response.ok) {
      return response;
    }
    
    // If there's no content, return early
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return response;
    }
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // Clone the response so we can read the body without consuming it
      const clonedResponse = response.clone();
      
      try {
        // Try to parse the JSON to check if it's valid
        const text = await clonedResponse.text();
        
        // Handle empty responses
        if (text.trim() === '') {
          // Create a new response with empty object
          return new Response('{}', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers
          });
        }
        
        // Try to parse JSON
        JSON.parse(text);
        // If parsing succeeds, return original response
        return response;
      } catch (parseError) {
        // If JSON parsing fails, create a response with empty object
        console.warn('JSON Parse Error in fetch response:', parseError);
        
        // Create a new response with empty object
        return new Response('{}', {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    }
    
    // For non-JSON responses, return as-is
    return response;
  } catch (error) {
    // Re-throw network errors and other fetch errors
    throw error;
  }
};

/**
 * Wrapper for fetch() that automatically parses JSON responses with error handling
 * @param input The resource to fetch
 * @param init Request init options
 * @returns Promise that resolves with parsed JSON data or null if parsing fails
 */
export const safeFetchJson = async <T = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T | null> => {
  try {
    const response = await safeFetch(input, init);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // If there's no content, return null
    if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null;
    }
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      
      // Handle empty responses
      if (text.trim() === '') {
        return {} as T;
      }
      
      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        console.warn('JSON Parse Error in fetch response:', parseError);
        return {} as T; // Return empty object as fallback
      }
    }
    
    // For non-JSON responses, return null
    return null;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates a safe version of fetch for a specific endpoint
 * @param baseUrl Base URL for the API
 * @returns Object with safe fetch methods
 */
export const createSafeApiClient = (baseUrl: string) => {
  return {
    get: async <T = any>(endpoint: string): Promise<T | null> => {
      return safeFetchJson<T>(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    
    post: async <T = any>(endpoint: string, data?: any): Promise<T | null> => {
      return safeFetchJson<T>(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    
    put: async <T = any>(endpoint: string, data?: any): Promise<T | null> => {
      return safeFetchJson<T>(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
    },
    
    delete: async <T = any>(endpoint: string): Promise<T | null> => {
      return safeFetchJson<T>(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
  };
};