# Mobile App Integration Guide

This document provides instructions on how to integrate the React Native mobile app with the existing AI Calorie Tracker backend.

## Overview

The mobile app is designed to work with the same backend API as the web application. It uses the same endpoints and authentication mechanisms, making integration straightforward.

## Backend Requirements

1. Ensure your backend API is accessible from mobile devices
2. CORS should be configured to allow requests from the mobile app
3. All API endpoints should return consistent JSON responses

## API Configuration

1. Update the `API_URL` in `src/config.ts` to point to your backend server:

```typescript
// For local development with Expo
export const API_URL = 'http://192.168.1.x:5001'; // Use your local IP address

// For production
// export const API_URL = 'https://your-production-api.com';
```

## Authentication Integration

The mobile app uses token-based authentication with secure storage:

1. Ensure your backend `/api/auth/login` endpoint returns a token
2. The token is stored securely using Expo SecureStore
3. All subsequent API requests include the token in the Authorization header

## API Endpoints

The mobile app expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `PUT /api/auth/update-profile` - Update user profile

### Meal Analysis
- `POST /api/analyze-food` - Analyze single food image
- `POST /api/analyze-multi-food` - Analyze multiple foods in an image
- `GET /api/meal-analyses` - Get meal history
- `GET /api/meal-analyses/recent` - Get recent meals
- `GET /api/meal-analyses/:id` - Get meal details
- `DELETE /api/meal-analyses/:id` - Delete meal
- `POST /api/meal-analyses/:id/favorite` - Toggle favorite status

### Nutrition & Stats
- `GET /api/daily-stats` - Get daily nutrition stats
- `GET /api/weekly-stats` - Get weekly nutrition stats
- `GET /api/user/stats` - Get user profile stats

### Meal Planning
- `GET /api/meal-plan/current` - Get current meal plan
- `POST /api/meal-plan` - Generate new meal plan
- `POST /api/meal-plan/:id/save` - Save meal plan

### Nutrition Coach
- `POST /api/nutrition-coach` - Send message to nutrition coach

## Image Handling

The mobile app handles images in the following way:

1. Images are captured using the device camera or selected from the gallery
2. Images are resized and converted to base64 format before sending to the API
3. The API should accept base64-encoded images in the request body

Example image processing:

```typescript
// In CameraScreen.tsx
const manipResult = await ImageManipulator.manipulateAsync(
  imageUri,
  [{ resize: { width: 800 } }],
  { base64: true, format: ImageManipulator.SaveFormat.JPEG }
);

const imageData = `data:image/jpeg;base64,${manipResult.base64}`;
```

## Push Notifications (Future Enhancement)

To enable push notifications:

1. Set up Firebase Cloud Messaging (FCM) for Android
2. Set up Apple Push Notification service (APNs) for iOS
3. Implement a notification service in your backend
4. Update the mobile app to register device tokens with your backend

## Testing the Integration

1. Start your backend server
2. Update the `API_URL` in the mobile app
3. Run the mobile app using Expo
4. Test login functionality
5. Test image upload and analysis
6. Verify that all data is correctly displayed

## Troubleshooting

- **Network Errors**: Ensure your backend is accessible from the device/emulator
- **CORS Issues**: Configure your backend to allow requests from the mobile app
- **Authentication Errors**: Verify token format and expiration
- **Image Upload Failures**: Check maximum request size limits on your server

## Security Considerations

1. Always use HTTPS in production
2. Implement rate limiting on your API
3. Validate all input on the server side
4. Consider implementing refresh tokens for better security
5. Regularly audit your API for security vulnerabilities