# AI Calorie Tracker - Production Deployment Guide

This guide provides comprehensive instructions for deploying the AI Calorie Tracker mobile application to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Configuration Setup](#configuration-setup)
3. [Build Configuration](#build-configuration)
4. [Deployment Process](#deployment-process)
5. [App Store Submission](#app-store-submission)
6. [Post-Deployment Monitoring](#post-deployment-monitoring)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- **Node.js** (v18.0 or higher)
- **npm** (v8.0 or higher)
- **Expo CLI** (v6.0 or higher)
- **EAS CLI** (v8.0 or higher)
- **Git** (for version control)

### Accounts and Credentials
- **Apple Developer Account** (for iOS deployment)
- **Google Play Console Account** (for Android deployment)
- **Expo Account** (for EAS builds)
- **Firebase Account** (for push notifications and analytics)

### Environment Variables
Create a `.env.production` file in the root directory:

```env
# API Configuration
API_URL=https://api.aicalorietracker.com
SENTRY_DSN=your-sentry-dsn-here

# Apple Developer Credentials
APPLE_ID=your-apple-id@icloud.com
APPLE_TEAM_ID=YOUR_TEAM_ID
ASC_APP_ID=your-app-store-connect-app-id

# Google Play Console Credentials
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./android/service-account-key.json
GOOGLE_PLAY_TRACK=production

# Security
JWT_SECRET=your-super-secret-jwt-key
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Configuration Setup

### 1. App Configuration
Update `mobile/app.json` for production:

```json
{
  "expo": {
    "name": "AI Calorie Tracker",
    "slug": "ai-calorie-tracker",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/adaptive-icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.aicalorietracker.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.aicalorietracker.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACTIVITY_RECOGNITION",
        "BODY_SENSORS"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "name": "AI Calorie Tracker",
      "shortName": "AI Calorie Tracker",
      "lang": "en"
    },
    "plugins": [
      "expo-camera",
      "expo-image-picker",
      "expo-location",
      "expo-notifications",
      "expo-secure-store",
      "expo-sensors",
      "expo-file-system"
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      },
      "apiUrl": "https://api.aicalorietracker.com",
      "useMockData": false,
      "enableLogging": false,
      "sentryDsn": "your-sentry-dsn-here",
      "appName": "AI Calorie Tracker",
      "version": "1.0.0",
      "supportEmail": "support@aicalorietracker.com",
      "environment": "production"
    }
  }
}
```

### 2. EAS Configuration
Update `mobile/eas.json` with your specific credentials:

```json
{
  "cli": {
    "version": ">= 8.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "serviceAccountKeyPath": "./ios/service-account-key.json",
        "teamId": "YOUR_TEAM_ID",
        "provisioningProfilePath": "./ios/development.provisionprofile",
        "certificatePath": "./ios/development.p12",
        "releaseChannel": "production",
        "assetPatterns": [
          "assets/**/*"
        ],
        "incremental": true,
        "upload": true,
        "submit": true
      },
      "android": {
        "serviceAccountKeyPath": "./android/service-account-key.json",
        "keystorePath": "./android/keystore.jks",
        "keystorePassword": "your-keystore-password",
        "keyAlias": "your-key-alias",
        "keyPassword": "your-key-password",
        "gradleCommand": "bundleRelease",
        "upload": true,
        "submit": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID",
        "ipaPath": "ios/build/Build/Products/Release-iphonesimulator/app.ipa"
      },
      "android": {
        "serviceAccountKeyPath": "./android/service-account-key.json",
        "track": "production",
        "aabPath": "android/app/build/outputs/bundle/release/app.aab"
      }
    }
  }
}
```

## Build Configuration

### 1. iOS Configuration
1. **Generate iOS Certificates**
   - Create an App ID in Apple Developer Portal
   - Create a Provisioning Profile
   - Generate Distribution Certificate
   - Export certificates and profiles to the project

2. **Configure Xcode Project**
   - Update Bundle Identifier
   - Configure App Icons and Splash Screens
   - Set up Privacy Manifests
   - Configure Background Modes

### 2. Android Configuration
1. **Generate Android Keystore**
   ```bash
   keytool -genkey -v -keystore android/keystore.jks -alias your-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure Google Play Console**
   - Create App Listing
   - Set up App Signing
   - Configure Store Listing
   - Set up Content Rating

## Deployment Process

### Automated Deployment
Use the provided deployment script for automated deployment:

```bash
# Full deployment (tests, build, submit)
./mobile/deploy.sh

# Only run tests
./mobile/deploy.sh test

# Only build
./mobile/deploy.sh build

# Only submit to stores
./mobile/deploy.sh submit
```

### Manual Deployment Steps

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Update Configuration**
   ```bash
   # Update app.json for production
   sed -i.bak 's/"useMockData": true/"useMockData": false/' app.json
   sed -i.bak 's/"apiUrl": ".*"/"apiUrl": "https://api.aicalorietracker.com"/' app.json
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Build Application**
   ```bash
   eas build --platform all --profile production
   ```

5. **Submit to Stores**
   ```bash
   eas submit --platform ios --profile production
   eas submit --platform android --profile production
   ```

## App Store Submission

### Apple App Store
1. **Prepare App Store Listing**
   - App Name: AI Calorie Tracker
   - Subtitle: AI-Powered Nutrition Tracking
   - Description: Comprehensive calorie tracking with AI-powered meal analysis
   - Keywords: nutrition, calories, diet, health, fitness, AI
   - Category: Health & Fitness
   - Age Rating: 4+

2. **Upload Screenshots**
   - iPhone 13/14/15 Pro Max screenshots
   - iPad Pro screenshots
   - App Preview video (optional)

3. **Submit for Review**
   - Complete App Store Connect information
   - Privacy Policy URL
   - Beta Review Testers
   - Review Notes

### Google Play Store
1. **Prepare Store Listing**
   - App Name: AI Calorie Tracker
   - Short Description: AI-powered nutrition tracking app
   - Full Description: Comprehensive calorie tracking with AI-powered meal analysis
   - Category: Health & Fitness
   - Content Rating: Everyone

2. **Upload Assets**
   - Feature Graphic
   - Phone/Tablet Screenshots
   - Icon
   - Promo Video

3. **Submit for Review**
   - Content Rating Questionnaire
   - App Content
   - Testers

## Post-Deployment Monitoring

### 1. Application Monitoring
- **Crash Reporting**: Sentry or Firebase Crashlytics
- **Performance Monitoring**: New Relic or Datadog
- **User Analytics**: Firebase Analytics or Mixpanel

### 2. API Monitoring
- **Health Checks**: Regular API health checks
- **Performance Monitoring**: Response times and error rates
- **Usage Analytics**: API call frequency and patterns

### 3. Store Monitoring
- **App Store Reviews**: Regular review monitoring
- **Download Statistics**: Daily/weekly/monthly downloads
- **Ratings and Feedback**: User sentiment analysis

### 4. Automated Monitoring Scripts
Create monitoring scripts for critical metrics:

```bash
# Health check script
#!/bin/bash
API_URL="https://api.aicalorietracker.com"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL/health)
if [ "$RESPONSE" -eq 200 ]; then
    echo "API is healthy"
else
    echo "API is unhealthy - Status: $RESPONSE"
    # Send alert
    curl -X POST -H "Content-Type: application/json" -d '{"text":"API health check failed"}' $SLACK_WEBHOOK
fi
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check EAS CLI version
   - Verify credentials and permissions
   - Ensure all dependencies are installed
   - Check for conflicting native dependencies

2. **App Store Rejections**
   - Privacy policy requirements
   - Data collection permissions
   - App functionality issues
   - Missing required information

3. **API Issues**
   - Check server health and uptime
   - Verify SSL certificates
   - Monitor rate limiting
   - Check database connectivity

### Debug Commands

```bash
# Check EAS build status
eas build:list --platform all

# View build logs
eas build:logs --platform ios --profile production

# Check app status
eas submit:list --platform ios

# Test API connectivity
curl -v https://api.aicalorietracker.com/health
```

### Support Contacts
- **Development Team**: dev@aicalorietracker.com
- **Support Team**: support@aicalorietracker.com
- **Emergency Contact**: emergency@aicalorietracker.com

## Version Control and Updates

### Version Management
- Use semantic versioning (MAJOR.MINOR.PATCH)
- Update version numbers in package.json and app.json
- Tag releases in Git
- Maintain changelog

### Update Process
1. Test thoroughly in staging environment
2. Update version numbers
3. Build and submit to stores
4. Monitor for issues
5. Roll back if necessary

## Security Considerations

### Data Protection
- Encrypt sensitive data at rest and in transit
- Implement proper authentication and authorization
- Regular security audits
- Compliance with data protection regulations

### API Security
- Rate limiting and throttling
- Input validation and sanitization
- Regular security updates
- Monitoring for suspicious activity

---

This deployment guide provides comprehensive instructions for deploying the AI Calorie Tracker mobile application to production. Follow these steps carefully to ensure a successful deployment.