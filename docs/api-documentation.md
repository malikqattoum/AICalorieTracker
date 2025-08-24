# AI Calorie Tracker API Documentation

## Overview

The AI Calorie Tracker API provides a comprehensive RESTful interface for managing user nutrition tracking, meal analysis, AI-powered insights, and health monitoring. The API is built with Express.js, TypeScript, and follows REST principles.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most API endpoints require authentication using JWT (JSON Web Token). Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "user",
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

#### POST /auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

#### GET /auth/logout
Logout user and invalidate session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Meal Analysis

#### POST /analyze-food
Analyze food image using AI services.

**Authentication:** Required

**Request Body:**
```json
{
  "imageData": "base64-encoded-image"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "foodName": "Apple",
  "calories": 95,
  "protein": 0.5,
  "carbs": 25,
  "fat": 0.3,
  "confidence": 0.95,
  "analysisTime": "2023-01-01T00:00:00.000Z"
}
```

#### GET /meal-analyses
Get user's meal analysis history.

**Authentication:** Required

**Query Parameters:**
- `limit`: Number of results (default: 50)
- `offset`: Offset for pagination (default: 0)
- `startDate`: Filter by start date
- `endDate`: Filter by end date

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "foodName": "Apple",
      "calories": 95,
      "protein": 0.5,
      "carbs": 25,
      "fat": 0.3,
      "timestamp": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

### User Profile

#### GET /user/profile
Get user profile information.

**Authentication:** Required

**Response:**
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "1990-01-01",
  "height": 175,
  "weight": 70,
  "activityLevel": "moderate",
  "dietaryPreferences": ["vegetarian"],
  "healthGoals": ["weight_loss"],
  "createdAt": "2023-01-01T00:00:00.000Z"
}
```

#### PUT /user/profile
Update user profile information.

**Authentication:** Required

**Request Body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "1990-01-01",
  "height": 175,
  "weight": 70,
  "activityLevel": "moderate",
  "dietaryPreferences": ["vegetarian"],
  "healthGoals": ["weight_loss"]
}
```

### AI-Powered Insights

#### GET /premium-analytics/insights
Get AI-generated health insights.

**Authentication:** Required

**Query Parameters:**
- `type`: Insight type (nutrition, fitness, recovery, overall)
- `period`: Time period (daily, weekly, monthly)

**Response:**
```json
{
  "insights": [
    {
      "id": 1,
      "type": "nutrition",
      "title": "Calorie Intake Analysis",
      "description": "Your calorie intake has been consistent this week",
      "recommendations": ["Continue current eating habits"],
      "confidence": 0.85,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /premium-analytics/predictions
Get health predictions and forecasts.

**Authentication:** Required

**Query Parameters:**
- `type`: Prediction type (weight_projection, goal_achievement, health_risk)
- `period`: Forecast period (7, 30, 90 days)

**Response:**
```json
{
  "predictions": [
    {
      "id": 1,
      "type": "weight_projection",
      "targetDate": "2023-02-01T00:00:00.000Z",
      "predictionValue": 68.5,
      "confidence": 0.78,
      "recommendations": ["Maintain current diet and exercise"]
    }
  ]
}
```

### Healthcare Integration

#### POST /healthcare/integrate
Connect with healthcare provider.

**Authentication:** Required

**Request Body:**
```json
{
  "professionalId": "string",
  "professionalType": "doctor",
  "professionalName": "Dr. Smith",
  "practiceName": "Health Clinic",
  "accessLevel": "read_only",
  "dataSharingConsent": true
}
```

#### GET /healthcare/integrations
Get user's healthcare integrations.

**Authentication:** Required

**Response:**
```json
{
  "integrations": [
    {
      "id": 1,
      "professionalId": "string",
      "professionalName": "Dr. Smith",
      "professionalType": "doctor",
      "practiceName": "Health Clinic",
      "accessLevel": "read_only",
      "sharedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### Wearable Device Integration

#### POST /wearables/sync
Sync data from wearable devices.

**Authentication:** Required

**Request Body:**
```json
{
  "deviceId": "string",
  "deviceType": "fitbit",
  "metrics": [
    {
      "type": "heart_rate",
      "value": 72,
      "unit": "bpm",
      "timestamp": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /wearables/health-insights
Get insights from wearable device data.

**Authentication:** Required

**Response:**
```json
{
  "insights": [
    {
      "type": "heart_rate",
      "analysis": "Your resting heart rate has improved by 5%",
      "recommendations": ["Continue current exercise routine"]
    }
  ]
}
```

### Admin Endpoints

#### GET /admin/dashboard/stats
Get system statistics (Admin only).

**Authentication:** Required, Admin role

**Response:**
```json
{
  "totalUsers": 1000,
  "activeUsers": 750,
  "totalAnalyses": 50000,
  "aiServiceUsage": 45000,
  "revenue": 15000,
  "systemHealth": "healthy"
}
```

#### GET /admin/users
Get all users (Admin only).

**Authentication:** Required, Admin role

**Query Parameters:**
- `limit`: Number of results
- `offset`: Offset for pagination
- `role`: Filter by user role

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "string",
      "email": "string",
      "role": "user",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1000
}
```

### Error Handling

The API uses standard HTTP status codes and returns error information in the following format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Rate Limiting

API endpoints are rate limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Regular endpoints: 100 requests per minute
- Admin endpoints: 200 requests per minute

### Data Models

#### User
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  dateOfBirth?: Date;
  height?: number;
  weight?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dietaryPreferences?: string[];
  healthGoals?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### MealAnalysis
```typescript
interface MealAnalysis {
  id: number;
  userId: number;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  imageUrl?: string;
  timestamp: Date;
}
```

#### HealthInsight
```typescript
interface HealthInsight {
  id: number;
  userId: number;
  type: 'nutrition' | 'fitness' | 'recovery' | 'overall';
  title: string;
  description: string;
  recommendations: string[];
  confidence: number;
  createdAt: Date;
}
```

## SDK and Client Libraries

### JavaScript/TypeScript
```javascript
import { APIClient } from '@ai-calorie-tracker/sdk';

const client = new APIClient({
  baseURL: 'http://localhost:3000/api',
  token: 'your-jwt-token'
});

// Get user profile
const profile = await client.user.getProfile();

// Analyze food image
const analysis = await client.meal.analyzeFood(imageData);
```

### Python
```python
from ai_calorie_tracker import APIClient

client = APIClient(
    base_url='http://localhost:3000/api',
    token='your-jwt-token'
)

# Get user profile
profile = client.user.get_profile()

# Analyze food image
analysis = client.meal.analyze_food(image_data)
```

## Webhooks

The API supports webhooks for real-time notifications:

### Available Webhook Events
- `meal.analyzed`: New meal analysis completed
- `user.registered`: New user registration
- `user.premium_upgraded`: User upgraded to premium
- `system.alert`: System alert or error

### Webhook Configuration
```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["meal.analyzed", "user.registered"],
  "secret": "your-webhook-secret"
}
```

## Changelog

### Version 1.0.0 (2023-01-01)
- Initial API release
- Core authentication and meal analysis endpoints
- Basic user profile management
- Admin dashboard endpoints

### Version 1.1.0 (2023-02-01)
- Added AI-powered insights and predictions
- Enhanced healthcare integration
- Wearable device support
- Improved error handling

### Version 1.2.0 (2023-03-01)
- Real-time monitoring endpoints
- Premium analytics features
- Enhanced security measures
- Performance optimizations

## Support

For API support and questions:
- Email: api-support@ai-calorie-tracker.com
- Documentation: https://docs.ai-calorie-tracker.com
- Status Page: https://status.ai-calorie-tracker.com