# JSON Error Handling Guide

## Problem
The app was experiencing crashes with the error `SyntaxError: Unexpected end of JSON input` when the API returned a 200 OK status with an empty response body instead of valid JSON.

## Solution
We've implemented multiple layers of protection to handle this issue gracefully:

### 1. Safe Fetch Wrapper
A new utility `safeFetchJson` handles JSON parsing errors automatically:

```typescript
import { safeFetchJson } from '../utils/fetchWrapper';

// Before (could crash):
const response = await fetch('/api/user/profile');
const data = await response.json(); // Could crash here

// After (safe):
const data = await safeFetchJson('/api/user/profile');
if (data === null) {
  // Handle error case
  throw new Error('Failed to fetch data');
}
```

### 2. API Service Interceptors
Both API services now validate responses before they reach components:

```typescript
// In api.ts and secureApiService.ts
apiInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Handle empty or invalid JSON responses
    if (response.data === null || response.data === undefined) {
      response.data = {};
    } else if (typeof response.data === 'string' && response.data.trim() === '') {
      response.data = {};
    } else if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (parseError) {
        console.warn('JSON Parse Error in response:', parseError);
        response.data = {};
      }
    }
    
    return response;
  }
);
```

### 3. Response Validation Utility
A comprehensive validation utility checks for various malformed response scenarios:

```typescript
import { validateApiResponse } from '../utils/responseValidator';

const validation = validateApiResponse(
  response.data,
  endpoint,
  fallbackData // Optional fallback data
);

if (!validation.isValid) {
  // Handle invalid response
  if (validation.fallbackData) {
    // Use fallback data
    return validation.fallbackData;
  }
}
```

## Migration Guide

### 1. Update Imports
Add the safe fetch wrapper import to your screen files:

```typescript
import { safeFetchJson } from '../utils/fetchWrapper';
```

### 2. Replace Direct Fetch Calls
Replace direct fetch calls with safe fetch calls:

```typescript
// Before:
const response = await fetch(`${API_URL}/api/user/settings`);
if (!response.ok) {
  throw new Error('Failed to fetch user settings');
}
const data = await response.json();

// After:
const data = await safeFetchJson(`${API_URL}/api/user/settings`);
if (data === null) {
  throw new Error('Failed to fetch user settings');
}
```

### 3. Update Mutation Functions
For POST/PUT/DELETE requests:

```typescript
// Before:
const response = await fetch(`${API_URL}/api/user/settings`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedSettings),
});

if (!response.ok) {
  throw new Error('Failed to update settings');
}

return response.json();

// After:
const data = await safeFetchJson(`${API_URL}/api/user/settings`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updatedSettings),
});

if (data === null) {
  throw new Error('Failed to update settings');
}

return data;
```

## Files Updated

1. `mobile/src/utils/fetchWrapper.ts` - New safe fetch utilities
2. `mobile/src/utils/responseValidator.ts` - Response validation utility
3. `mobile/src/utils/monitoring.ts` - Error monitoring
4. `mobile/src/services/api.ts` - API service with JSON error handling
5. `mobile/src/services/secureApiService.ts` - Secure API service with JSON error handling
6. `mobile/src/services/apiService.ts` - Enhanced API service
7. `mobile/src/utils/errorHandler.ts` - Enhanced error handling
8. Several screen files updated to use safe fetch

## Testing

Run the new test suite to verify the implementation:

```bash
npm test -- --testPathPattern="jsonErrorHandling"
npm test -- --testPathPattern="responseValidator"
npm test -- --testPathPattern="monitoring"
```

## Error Monitoring

All JSON parsing errors are now logged and monitored:

```typescript
import { ApiMonitoring } from '../utils/monitoring';

// Get error statistics
const stats = ApiMonitoring.getErrorStats();

// Reset error counts
ApiMonitoring.resetErrorCounts();
```

## Fallback Data

Default fallback data is provided for common endpoints:

```typescript
const DEFAULT_FALLBACK_DATA = {
  '/api/auth/me': {
    firstName: 'Guest',
    lastName: 'User',
    email: 'guest@example.com',
    isPremium: false,
  },
  '/api/user/profile': {
    totalMeals: 0,
    streakDays: 0,
    perfectDays: 0,
    favoriteFoods: [],
  },
  // ... more endpoints
};
```

## Benefits

1. **No More Crashes** - The app will never crash due to malformed JSON responses
2. **Graceful Degradation** - Uses fallback data when API responses are invalid
3. **Better User Experience** - Users see appropriate messages instead of app crashes
4. **Improved Debugging** - All JSON parsing errors are logged for debugging
5. **Production Ready** - Monitoring helps track and alert on frequent errors

## Future Improvements

1. Add more comprehensive fallback data for all endpoints
2. Implement automatic retry logic for failed requests
3. Add offline support with local caching
4. Enhance error reporting with more detailed analytics