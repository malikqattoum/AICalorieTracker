# Token Refresh System Documentation

## Overview

This document describes the automatic token refresh mechanism implemented in the AICalorieTracker application. The system ensures seamless user experience by automatically refreshing expired access tokens using refresh tokens.

## Architecture

### Components

1. **Server-Side Components**
   - `/api/auth/refresh` endpoint in `server/src/routes/auth/index.ts`
   - `JWTService.refreshAccessToken()` method in `server/src/services/jwtService.ts`

2. **Client-Side Components**
   - `tokenManager.ts` - Centralized token storage and management
   - `queryClient.ts` - API request handling with automatic token refresh
   - `use-auth.tsx` - Authentication hook with refresh token mutation

### Flow Diagram

```
User Request → API Call → 401 Error → Token Refresh → New Token → Retry Request
     ↑                                                              ↓
  Login/Register ← Refresh Token Expired ← Clear Tokens ← Redirect to Login
```

## Implementation Details

### 1. Server-Side Implementation

#### Refresh Token Endpoint
```typescript
// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }
  
  try {
    const result = JWTService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid refresh token') {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    next(error);
  }
});
```

#### JWT Service
```typescript
refreshAccessToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as any;
    const accessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    return { accessToken };
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}
```

### 2. Client-Side Implementation

#### Token Manager
- Centralized token storage using localStorage
- Utility functions for token operations
- Type-safe constants for storage keys

#### API Request Handling
```typescript
export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  // ... normal request setup
  
  const res = await fetch(url, { ... });
  
  // Handle 401 errors by attempting to refresh the token
  if (res.status === 401 && !url.includes('/auth/refresh')) {
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry the original request with the new token
        const retryRes = await fetch(url, {
          method,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });
        
        await throwIfResNotOk(retryRes);
        return retryRes;
      }
    } catch (refreshError) {
      throw new Error('Session expired. Please log in again.');
    }
  }
  
  await throwIfResNotOk(res);
  return res;
}
```

#### React Query Integration
The `getQueryFn` function also implements the same token refresh logic for queries, ensuring consistent behavior across API calls.

### 3. Authentication Hook

#### Refresh Token Mutation
```typescript
const refreshMutation = useMutation({
  mutationFn: async ({ refreshToken }: { refreshToken: string }) => {
    const res = await apiRequest("POST", "/api/auth/refresh", { refreshToken });
    return await res.json();
  },
  onSuccess: (data) => {
    localStorage.setItem('accessToken', data.accessToken);
    queryClient.setQueryDefaults(["/api/auth/me"], {
      queryFn: getQueryFn({ on401: "returnNull" }),
    });
  },
  onError: (error: Error) => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    queryClient.setQueryData(["/api/auth/me"], null);
    navigate("/login");
  },
});
```

## Security Considerations

1. **Token Storage**
   - Access tokens stored in localStorage (accessible by JavaScript)
   - Refresh tokens also stored in localStorage
   - Tokens cleared on logout or refresh failure

2. **Token Validation**
   - Server validates refresh tokens before issuing new access tokens
   - Client automatically clears tokens on validation failure
   - No sensitive data exposed in client-side storage

3. **Request Security**
   - All API requests include credentials
   - Authorization headers automatically added
   - Retry mechanism prevents token leakage

## Error Handling

### Common Scenarios

1. **Access Token Expired**
   - API returns 401 Unauthorized
   - Client attempts token refresh
   - If successful, retries original request
   - If failed, redirects to login

2. **Refresh Token Expired**
   - Refresh endpoint returns 401
   - Client clears all tokens
   - Redirects to login page

3. **Network Issues**
   - Refresh requests fail with network errors
   - Client treats as refresh token expiration
   - Redirects to login

### Error Messages

- "Session expired. Please log in again." - General session expiration
- "Authentication required. Please log in to continue." - Missing authentication
- "Failed to refresh token" - Server-side refresh failure

## Testing

### Test Scenarios

1. **Normal Token Refresh**
   - User has valid refresh token
   - Access token expires
   - Refresh succeeds
   - Original request succeeds

2. **Expired Refresh Token**
   - User has invalid refresh token
   - Access token expires
   - Refresh fails
   - User redirected to login

3. **Network Failure**
   - Refresh request fails due to network issues
   - Client handles gracefully
   - User redirected to login

### Test Files

- `tokenRefresh.test.ts` - Unit tests for token refresh functionality
- Test functions demonstrate the complete refresh flow

## Usage Examples

### Manual Token Refresh
```typescript
import { refreshAccessToken } from './lib/queryClient';

// Manually refresh token if needed
try {
  const newToken = await refreshAccessToken();
  console.log('Token refreshed successfully');
} catch (error) {
  console.error('Token refresh failed:', error);
}
```

### Checking Token Status
```typescript
import { hasValidAccessToken, hasRefreshToken } from './lib/tokenManager';

// Check if user can make authenticated requests
if (hasValidAccessToken()) {
  // Can make API calls
} else if (hasRefreshToken()) {
  // Can refresh token
} else {
  // Need to login
}
```

## Future Enhancements

1. **Token Expiration Prediction**
   - Decode JWT to check expiration before API calls
   - Proactive token refresh

2. **Secure Storage**
   - Use httpOnly cookies for refresh tokens
   - Implement secure token storage mechanisms

3. **Session Management**
   - Add session timeout handling
   - Implement idle session logout

4. **Token Rotation**
   - Issue new refresh tokens with each refresh
   - Implement token revocation

## Troubleshooting

### Common Issues

1. **Tokens Not Being Stored**
   - Check localStorage permissions
   - Verify server response includes tokens

2. **Refresh Requests Failing**
   - Check network connectivity
   - Verify refresh token endpoint is accessible
   - Check server logs for errors

3. **Infinite Redirect Loop**
   - Check token clearing logic
   - Verify refresh token mutation error handling
   - Ensure proper navigation logic

### Debug Mode

Enable debug logging to troubleshoot token issues:
```typescript
// Add to tokenManager.ts
export const enableDebugMode = (enabled: boolean): void => {
  if (enabled) {
    console.log('Token refresh debug mode enabled');
  }
};