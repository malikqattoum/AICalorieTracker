import { getAccessToken } from './tokenManager';

/**
 * Makes an authenticated API request with automatic token inclusion
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response>
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);

  // Add Authorization header if token exists
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for JSON requests and stringify body if needed
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
    if (typeof options.body === 'object' && options.body !== null) {
      options.body = JSON.stringify(options.body);
    }
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, requestOptions);

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      console.warn('API request failed with 401 - token might be expired');
      // You could trigger token refresh here if needed
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Convenience method for GET requests
 */
export async function apiGet(url: string, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, { ...options, method: 'GET' });
}

/**
 * Convenience method for POST requests
 */
export async function apiPost(url: string, body?: any, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for PUT requests
 */
export async function apiPut(url: string, body?: any, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Convenience method for DELETE requests
 */
export async function apiDelete(url: string, options: RequestInit = {}): Promise<Response> {
  return apiRequest(url, { ...options, method: 'DELETE' });
}