# AI Calorie Tracker

A mobile application that uses artificial intelligence to track calories and nutritional information from food images.

## Features

- **AI Food Recognition**: Take photos of your food and get instant nutritional information
- **Meal Tracking**: Log your meals and track your daily calorie intake
- **Nutrition Coach**: Get personalized nutrition advice from an AI assistant
- **Recipe Import**: Import recipes from URLs and add them to your meal history
- **Meal Planning**: Generate personalized meal plans based on your preferences
- **Calendar View**: Track your meals and nutrition over time

## Project Structure

- **mobile/**: React Native mobile application
- **server/**: Backend API server (to be implemented)

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Android Studio or Xcode (for running on emulators)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/AICalorieTracker.git
cd AICalorieTracker
```

2. Install dependencies for the mobile app:
```bash
cd mobile
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm start
# or
yarn start
```

4. Run on iOS or Android:
```bash
# iOS
npm run ios
# or
yarn ios

# Android
npm run android
# or
yarn android
```

## Remaining Tasks

### 1. Assets
- Add required font files to `mobile/assets/fonts/`:
  - Inter-Regular.ttf
  - Inter-Medium.ttf
  - Inter-SemiBold.ttf
  - Inter-Bold.ttf
- Add app icons to `mobile/assets/`:
  - icon.png (1024x1024px)
  - adaptive-icon.png (1024x1024px)
  - splash.png (1242x2436px)
  - favicon.png (48x48px)
  - notification-icon.png (96x96px)
- Add onboarding images to `mobile/assets/`:
  - onboarding-1.png
  - onboarding-2.png
  - onboarding-3.png

### 2. Backend Implementation
- Set up a Node.js server with Express
- Implement authentication endpoints:
  - /api/auth/register
  - /api/auth/login
  - /api/auth/forgot-password
  - /api/auth/reset-password
  - /api/auth/logout
  - /api/auth/me
- Implement meal tracking endpoints:
  - /api/meals (GET, POST)
  - /api/meals/:id (GET, PUT, DELETE)
  - /api/meals/analyze (POST)
- Implement nutrition coach endpoints:
  - /api/nutrition-coach (POST)
  - /api/nutrition-coach/history (GET)
- Implement meal plan endpoints:
  - /api/meal-plans/generate (POST)
  - /api/meal-plans/save (POST)
  - /api/meal-plans (GET)
- Implement user profile endpoints:
  - /api/user/profile (GET, PUT)
  - /api/user/settings (GET, PUT)
  - /api/user/stats (GET)

### 3. AI Integration
- Integrate with a food recognition API (e.g., Clarifai, Google Cloud Vision)
- Implement nutritional information lookup
- Set up the AI nutrition coach using a language model API (e.g., OpenAI)
- Create a meal plan generation system

### 4. Testing
- Write unit tests for components
- Write integration tests for API calls
- Perform end-to-end testing

### 5. Deployment
- Set up CI/CD pipeline
- Deploy backend to a cloud provider (e.g., AWS, Heroku)
- Configure Expo for building production apps
- Publish to app stores

## Mock Services

For development purposes, the app includes mock services that simulate API calls:

- `mealService.ts`: Handles meal tracking and food analysis
- `nutritionCoachService.ts`: Provides mock responses for the nutrition coach
- `recipeService.ts`: Handles recipe import functionality
- `calendarService.ts`: Manages calendar data and daily stats
- `profileService.ts`: Handles user profile and settings
- `mealPlanService.ts`: Generates mock meal plans

These services can be replaced with real API calls once the backend is implemented.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query](https://tanstack.com/query/latest)
- [i18next](https://www.i18next.com/)