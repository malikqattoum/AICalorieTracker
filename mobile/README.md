# AI Calorie Tracker Mobile App

A React Native mobile application for the AI Calorie Tracker platform, providing all the features of the web application in a native mobile experience.

## Features

- **AI-Powered Food Recognition**: Take photos of your meals for instant nutritional analysis
- **Multi-Food Recognition**: Analyze multiple food items in a single image
- **Meal History**: Track and review your meal history
- **Nutrition Dashboard**: View daily nutrition stats and progress
- **Meal Planning**: Get AI-generated meal plans based on your goals
- **Nutrition Coach**: Chat with an AI nutrition coach for personalized advice
- **Recipe Import**: Import recipes from URLs for nutritional analysis
- **Meal Calendar**: View your meals in a calendar format
- **User Profiles**: Manage your profile and preferences
- **Achievements**: Track your progress with achievements and streaks
- **Internationalization**: Support for multiple languages

## Technology Stack

- **Framework**: React Native with Expo
- **State Management**: React Query
- **Navigation**: React Navigation
- **UI Components**: Custom components with Expo Vector Icons
- **Camera**: Expo Camera
- **Image Manipulation**: Expo Image Manipulator
- **Storage**: AsyncStorage and SecureStore
- **Internationalization**: i18n-js
- **API Communication**: Axios

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI

### Installation

1. Clone the repository
2. Navigate to the mobile directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Start the development server:

```bash
npm start
# or
yarn start
```

5. Use the Expo Go app on your device to scan the QR code, or run on an emulator/simulator

## Project Structure

- `/assets`: Static assets like images and fonts
- `/src`: Source code
  - `/components`: Reusable UI components
  - `/contexts`: React contexts for state management
  - `/hooks`: Custom React hooks
  - `/navigation`: Navigation configuration
  - `/screens`: App screens
  - `/i18n`: Internationalization setup and translations
  - `/utils`: Utility functions
  - `/api`: API service functions

## Building for Production

To create a production build:

```bash
expo build:android
# or
expo build:ios
```

## Similar to Calai.app

This mobile app provides similar functionality to the Calai.app mobile application, including:

- AI-powered food recognition
- Detailed nutritional analysis
- Meal tracking and history
- Personalized meal planning
- Nutrition coaching
- Progress tracking and analytics

## License

This project is licensed under the MIT License - see the LICENSE file for details.