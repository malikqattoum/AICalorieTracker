# AICalorieTracker Deployment and Operations Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Backend Deployment](#backend-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security Considerations](#security-considerations)
10. [Backup and Recovery](#backup-and-recovery)

## Overview

This guide provides comprehensive instructions for deploying and maintaining the AICalorieTracker application across different environments. The application consists of:

- **Backend**: Node.js/Express server with TypeScript
- **Database**: MySQL with comprehensive schema
- **Mobile App**: React Native application with Expo
- **AI Services**: Integration with OpenAI and other AI providers
- **External APIs**: Health, fitness, and nutrition APIs
- **Payment Processing**: Stripe integration
- **Push Notifications**: Firebase Cloud Messaging

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04+ or macOS 10.15+
- **Node.js**: v18.x or higher
- **npm**: v8.x or higher
- **MySQL**: 8.0 or higher
- **Redis**: 6.0 or higher (for caching)
- **Nginx**: 1.18+ (for reverse proxy)

### Development Tools
- **Git**: For version control
- **Docker**: For containerization (optional)
- **Docker Compose**: For multi-container orchestration (optional)
- **VS Code**: For development
- **Postman**: For API testing

### Cloud Provider Requirements
- **AWS/GCP/Azure**: For cloud hosting
- **Domain Name**: For application access
- **SSL Certificate**: For HTTPS
- **CDN**: For content delivery
- **Monitoring Tools**: For application monitoring

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/aicalorietracker.git
cd aicalorietracker
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install mobile app dependencies
cd ../mobile
npm install

# Install root dependencies
cd ..
npm install
```

### 3. Environment Configuration

Create environment files for each environment:

#### Backend Environment Variables (`.env`)

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aicalorietracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# External API Keys
NUTRITIONIX_API_KEY=your_nutritionix_api_key
SPOONACULAR_API_KEY=your_spoonacular_api_key
FITBIT_API_KEY=your_fitbit_api_key
GARMIN_API_KEY=your_garmin_api_key

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Push Notifications
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_SERVER_KEY=your_firebase_server_key

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=aicalorietracker-assets

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@aicalorietracker.com

# Monitoring and Logging
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
LOGGING_SERVICE_URL=https://logging-service.com/api/logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=https://aicalorietracker.com
```

#### Mobile App Environment Variables (`.env.production`)

```bash
# API Configuration
API_BASE_URL=https://api.aicalorietracker.com/v1
API_TIMEOUT=30000

# Analytics
ANALYTICS_ENABLED=true
SEGMENT_WRITE_KEY=your_segment_write_key

# Push Notifications
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_APP_ID=your_firebase_app_id

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PREMIUM_FEATURES=true
ENABLE_WEARABLE_INTEGRATION=true

# Performance Monitoring
SENTRY_DSN=your_sentry_dsn
```

### 4. Database Setup

#### Create Database and User

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Create database
CREATE DATABASE aicalorietracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'aicalorietracker_user'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON aicalorietracker.* TO 'aicalorietracker_user'@'localhost';
FLUSH PRIVILEGES;

-- Exit
EXIT;
```

#### Run Database Migrations

```bash
# Run backend migrations
cd server
npm run migrate

# Or run specific migration
npm run migrate -- --file src/db/migrations/20241218_complete_schema.sql
```

#### Seed Initial Data

```bash
# Run database seeding
npm run seed
```

## Backend Deployment

### 1. Build the Backend

```bash
cd server

# Build TypeScript
npm run build

# Run tests
npm test

# Run linting
npm run lint
```

### 2. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'aicalorietracker-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        WORKERS: 4
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

### 3. Start the Backend

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

### 4. Nginx Configuration

Create `/etc/nginx/sites-available/aicalorietracker`:

```nginx
server {
    listen 80;
    server_name api.aicalorietracker.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files
    location /static/ {
        alias /var/www/aicalorietracker/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/aicalorietracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.aicalorietracker.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Mobile App Deployment

### 1. Build for Production

```bash
cd mobile

# Install Expo CLI globally
npm install -g @expo/cli

# Login to Expo
expo login

# Build for iOS
expo build:ios -u

# Build for Android
expo build:android -u
```

### 2. Configure App Store and Play Store

#### iOS App Store

1. **Create App Store Connect Account**
   - Go to [App Store Connect](https://appstoreconnect.apple.com)
   - Create a new app

2. **Prepare App for Submission**
   ```bash
   # Generate app icons and splash screens
   expo generate:icons

   # Update app.json with store information
   ```
3. **Submit to App Store**
   ```bash
   # Upload to App Store Connect
   expo upload --ios
   ```

#### Android Play Store

1. **Create Google Play Console Account**
   - Go to [Google Play Console](https://play.google.com/console)
   - Create a new app

2. **Prepare App for Submission**
   ```bash
   # Generate Android icons and splash screens
   expo generate:icons

   # Update app.json with store information
   ```
3. **Submit to Play Store**
   ```bash
   # Upload to Google Play Console
   expo upload --android
   ```

### 3. Configure App Distribution

#### TestFlight (iOS)

```bash
# Create TestFlight build
expo build:ios --testflight

# Share with testers
expo distribution:submit
```

#### Internal Testing (Android)

```bash
# Create internal testing build
expo build:android --internal-testing

# Share with testers
expo distribution:submit
```

## Monitoring and Maintenance

### 1. Application Monitoring

#### PM2 Monitoring

```bash
# View process status
pm2 status

# View logs
pm2 logs

# Monitor memory usage
pm2 monit

# Restart application
pm2 restart aicalorietracker-api

# Update application
pm2 reload aicalorietracker-api
```

#### Application Health Checks

Create `health-check.js`:

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed');
    process.exit(0);
  } else {
    console.log(`Health check failed with status ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error('Health check error:', err);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Health check timeout');
  process.exit(1);
});

req.end();
```

Set up cron job for health checks:

```bash
# Edit crontab
crontab -e

# Add health check (every 5 minutes)
*/5 * * * * /usr/bin/node /path/to/health-check.js
```

### 2. Database Monitoring

#### MySQL Performance Monitoring

```sql
-- Enable performance schema
UPDATE performance_schema.setup_instruments SET ENABLED = 'YES', TIMED = 'YES';
UPDATE performance_schema.setup_consumers SET ENABLED = 'YES';

-- Monitor slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';
```

#### Database Backup Script

Create `backup-db.sh`:

```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mysql"
DB_NAME="aicalorietracker"
DB_USER="aicalorietracker_user"
DB_PASS="your_db_password"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mysqldump --user=$DB_USER --password=$DB_PASS --databases $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/mysql/
```

Make executable and set up cron:

```bash
chmod +x backup-db.sh
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup-db.sh
```

### 3. Log Management

#### Log Rotation

Create `/etc/logrotate.d/aicalorietracker`:

```
/var/log/aicalorietracker/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 nodejs nodejs
    postrotate
        pm2 reload aicalorietracker-api
    endscript
}
```

#### Centralized Logging

Configure for ELK Stack or similar:

```bash
# Install Filebeat
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.5.0-linux-x86_64.tar.gz
tar xzvf filebeat-8.5.0-linux-x86_64.tar.gz

# Configure Filebeat
sudo nano filebeat.yml
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues

**Symptoms**: Application fails to start, database errors in logs

**Solutions**:
```bash
# Check MySQL service
sudo systemctl status mysql

# Check database connectivity
mysql -u aicalorietracker_user -p -h localhost aicalorietracker

# Check database logs
sudo tail -f /var/log/mysql/error.log
```

#### 2. Memory Issues

**Symptoms**: Application crashes, high memory usage

**Solutions**:
```bash
# Check memory usage
free -h
pm2 monit

# Increase memory limit in PM2
pm2 restart aicalorietracker-api --max-memory-restart 2G

# Optimize Node.js memory
export NODE_OPTIONS="--max-old-space-size=2048"
```

#### 3. SSL Certificate Issues

**Symptoms**: HTTPS not working, certificate errors

**Solutions**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test configuration
sudo nginx -t
```

#### 4. Performance Issues

**Symptoms**: Slow response times, high CPU usage

**Solutions**:
```bash
# Check system performance
top
htop

# Check database performance
mysql -e "SHOW PROCESSLIST;"
mysql -e "SHOW FULL PROCESSLIST;"

# Optimize database
mysql -e "OPTIMIZE TABLE users, meals, meal_analyses;"
```

### Debug Mode

Enable debug mode for troubleshooting:

```bash
# Set environment variable
export NODE_ENV=development
export DEBUG=aicalorietracker:*

# Restart application
pm2 restart aicalorietracker-api
```

## Security Considerations

### 1. Security Best Practices

#### Environment Variables
- Never commit sensitive information to version control
- Use environment-specific configuration files
- Rotate secrets regularly

#### Database Security
```bash
# Create secure database user
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'very_strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON aicalorietracker.* TO 'app_user'@'localhost';

# Enable SSL for MySQL
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Add: ssl-ca=/etc/mysql/ssl/ca-cert.pem
```

#### Application Security
```javascript
// Enable helmet for security headers
app.use(helmet());

// Configure CORS properly
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

// Rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS)
}));
```

### 2. Vulnerability Scanning

#### Dependency Scanning
```bash
# Install security scanner
npm install -g npm-check-updates

# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```

#### Code Scanning
```bash
# Install security linter
npm install -g eslint-plugin-security

# Run security scan
npm run lint
```

## Backup and Recovery

### 1. Backup Strategy

#### Full Backup
```bash
#!/bin/bash
# Full backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/aicalorietracker"
APP_DIR="/var/www/aicalorietracker"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Backup database
mysqldump --user=aicalorietracker_user --password=your_db_password aicalorietracker | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/uploads .

# Upload to cloud storage
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/aicalorietracker/

# Clean up old backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### 2. Recovery Procedures

#### Application Recovery
```bash
# Stop application
pm2 stop aicalorietracker-api

# Restore from backup
cd /var/www
tar -xzf /var/backups/aicalorietracker/app_20240101_120000.tar.gz

# Install dependencies
npm install

# Start application
pm2 start aicalorietracker-api
```

#### Database Recovery
```bash
# Stop database
sudo systemctl stop mysql

# Restore database
gunzip < /var/backups/aicalorietracker/db_20240101_120000.sql.gz | mysql -u root -p

# Start database
sudo systemctl start mysql
```

### 3. Disaster Recovery Plan

#### RTO (Recovery Time Objective): 4 hours
#### RPO (Recovery Point Objective): 15 minutes

#### Recovery Steps
1. **Assess Damage**: Determine scope of failure
2. **Restore Infrastructure**: Set up new servers if needed
3. **Restore Data**: Restore from latest backup
4. **Restore Application**: Deploy application code
5. **Verify Functionality**: Test all features
6. **Monitor Performance**: Watch for issues
7. **Document Incident**: Record lessons learned

## Conclusion

This deployment guide provides comprehensive instructions for deploying and maintaining the AICalorieTracker application. By following these procedures, you can ensure a smooth deployment process and maintain high availability and performance of the application.

Remember to:
- Regularly update dependencies and security patches
- Monitor application performance and health
- Maintain regular backups
- Test disaster recovery procedures
- Document changes and incidents

For additional support, refer to the project documentation or contact the development team.