#!/bin/bash

# AI Calorie Tracker Production Deployment Script
# This script automates the deployment process for the mobile application

set -e

# Configuration
APP_NAME="AI-Calorie-Tracker"
API_BASE_URL="https://api.aicalorietracker.com"
EAS_BUILD_PROFILE="production"
PLATFORMS="ios,android"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if required tools are installed
check_requirements() {
    log "Checking requirements..."
    
    # Check if EAS CLI is installed
    if ! command -v eas &> /dev/null; then
        error "EAS CLI is not installed. Please install it with: npm install -g @expo/eas-cli"
    fi
    
    # Check if Expo CLI is installed
    if ! command -v expo &> /dev/null; then
        error "Expo CLI is not installed. Please install it with: npm install -g @expo/cli"
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js."
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm."
    fi
    
    log "All requirements are satisfied."
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        error "Failed to install dependencies."
    fi
    log "Dependencies installed successfully."
}

# Run tests
run_tests() {
    log "Running tests..."
    npm test
    if [ $? -ne 0 ]; then
        error "Tests failed. Please fix the issues before deploying."
    fi
    log "All tests passed."
}

# Update app configuration for production
update_config() {
    log "Updating configuration for production..."
    
    # Update app.json with production settings
    sed -i.bak 's/"useMockData": true/"useMockData": false/' mobile/app.json
    sed -i.bak 's/"apiUrl": ".*"/"apiUrl": "'"$API_BASE_URL"'"/' mobile/app.json
    
    # Update version number
    NEW_VERSION=$(node -p "require('./package.json').version")
    NEW_VERSION="${NEW_VERSION%.*}.$((${NEW_VERSION##*.} + 1))"
    
    # Update package.json version
    npm version --no-git-tag-version "$NEW_VERSION"
    
    log "Configuration updated for production version $NEW_VERSION"
}

# Build the application
build_app() {
    log "Building application for production..."
    
    # Clean previous builds
    eas build:clean
    
    # Build for both platforms
    eas build --platform all --profile "$EAS_BUILD_PROFILE"
    
    if [ $? -ne 0 ]; then
        error "Build failed."
    fi
    
    log "Application built successfully."
}

# Submit to app stores
submit_stores() {
    log "Submitting to app stores..."
    
    # Submit to Apple App Store
    eas submit --platform ios --profile "$EAS_BUILD_PROFILE"
    
    # Submit to Google Play Store
    eas submit --platform android --profile "$EAS_BUILD_PROFILE"
    
    log "Submitted to app stores successfully."
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$REPORT_FILE" << EOF
# AI Calorie Tracker Deployment Report

**Deployment Date:** $(date)
**Version:** $(node -p "require('./package.json').version")
**Environment:** Production

## Build Information
- **Platform:** $PLATFORMS
- **EAS Profile:** $EAS_BUILD_PROFILE
- **API Base URL:** $API_BASE_URL

## Steps Completed
1. ✅ Requirements checked
2. ✅ Dependencies installed
3. ✅ Tests passed
4. ✅ Configuration updated
5. ✅ Application built
6. ✅ Submitted to app stores

## Next Steps
1. Monitor build status in EAS dashboard
2. Review app store submissions
3. Monitor application performance
4. Monitor API health

## Contact Information
- **Support:** support@aicalorietracker.com
- **Development Team:** dev@aicalorietracker.com

---
*This report was generated automatically by the deployment script.*
EOF

    log "Deployment report generated: $REPORT_FILE"
}

# Main deployment function
deploy() {
    log "Starting deployment of $APP_NAME..."
    
    # Check requirements
    check_requirements
    
    # Install dependencies
    install_dependencies
    
    # Run tests
    run_tests
    
    # Update configuration
    update_config
    
    # Build application
    build_app
    
    # Submit to stores
    submit_stores
    
    # Generate report
    generate_report
    
    log "Deployment completed successfully!"
    log "Please monitor the build status in the EAS dashboard."
}

# Handle command line arguments
case "${1:-}" in
    "test")
        run_tests
        ;;
    "build")
        check_requirements
        install_dependencies
        update_config
        build_app
        ;;
    "submit")
        submit_stores
        ;;
    *)
        deploy
        ;;
esac