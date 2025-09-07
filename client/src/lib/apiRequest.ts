import { getAccessToken } from './tokenManager';
import { API_URL } from './config';

/**
 * Makes an authenticated API request with automatic token inclusion
 * @param url - The API endpoint URL
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response>
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();

  // Normalize URL: prepend API base if relative
  const fullUrl = url.startsWith('/api/') ? `${API_URL}${url}` : url;

  const headers = new Headers(options.headers);

  // Always set JSON Content-Type unless explicitly provided
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Add Authorization header if token exists
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Stringify plain object bodies when sending JSON
  if (options.body && headers.get('Content-Type')?.includes('application/json')) {
    if (typeof options.body === 'object' && options.body !== null) {
      options.body = JSON.stringify(options.body);
    }
  }

  const requestOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers,
  };

  try {
    const response = await fetch(fullUrl, requestOptions);

    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401) {
      console.warn('API request failed with 401 - token might be expired');
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