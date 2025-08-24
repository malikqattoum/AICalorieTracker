# AICalorieTracker Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the AICalorieTracker application in production environments. The application consists of a React Native mobile app and a Node.js backend with Express.

## Prerequisites

### System Requirements
- Node.js 18.x or higher
- npm 9.x or higher
- MySQL 8.0 or higher
- Redis 6.0 or higher (optional, for caching)
- Docker & Docker Compose (for containerized deployment)

### Environment Variables
Create a `.env` file in the server directory with the following required variables:

```env
# Application Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aicalorietracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_SSL=false
DB_CONNECTION_LIMIT=20

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
JWT_ALGORITHM=HS256

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=1000

# External API Configuration
NUTRITIONIX_APP_ID=your_nutritionix_app_id
NUTRITIONIX_APP_KEY=your_nutritionix_app_key
NUTRITIONIX_BASE_URL=https://trackapi.nutritionix.com
SPOONACULAR_API_KEY=your_spoonacular_api_key
SPOONACULAR_BASE_URL=https://api.spoonacular.com
OPENFOODFACTS_BASE_URL=https://world.openfoodfacts.org
WEATHER_API_KEY=your_weather_api_key
WEATHER_BASE_URL=https://api.openweathermap.org/data/2.5

# Payment Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Storage Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name
LOCAL_STORAGE_ENABLED=false
LOCAL_STORAGE_PATH=./uploads

# Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@aicalorietracker.com
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password

# Push Notifications Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_SERVER_KEY=your_firebase_server_key

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

## Deployment Methods

### 1. Manual Deployment

#### Backend Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/AICalorieTracker.git
   cd AICalorieTracker/server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create database
   mysql -u your_db_user -p -e "CREATE DATABASE aicalorietracker;"
   
   # Run migrations
   npm run migrate
   
   # Seed the database (optional)
   npm run seed
   ```

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start the application**
   ```bash
   npm start
   ```

#### Frontend Deployment

1. **Navigate to mobile directory**
   ```bash
   cd ../mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure app.json**
   ```json
   {
     "expo": {
       "name": "AICalorieTracker",
       "slug": "aicalorietracker",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/adaptive-icon.png",
       "userInterfaceStyle": "automatic",
       "splash": {
         "image": "./assets/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#ffffff"
       },
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.yourcompany.aicalorietracker"
       },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#FFFFFF"
         },
         "package": "com.yourcompany.aicalorietracker",
         "permissions": [
           "ACCESS_FINE_LOCATION",
           "ACCESS_COARSE_LOCATION",
           "ACTIVITY_RECOGNITION",
           "BODY_SENSORS",
           "BODY_SENSORS_BACKGROUND"
         ]
       },
       "web": {
         "favicon": "./assets/favicon.png"
       },
       "plugins": [
         "expo-font",
         "expo-camera",
         "expo-location",
         "expo-sensors",
         "expo-secure-store",
         "expo-file-system",
         "expo-image-picker",
         "expo-sharing",
         "expo-notifications"
       ]
     }
   }
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### 2. Docker Deployment

#### Using Docker Compose

1. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     server:
       build: ./server
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DB_HOST=db
         - DB_PORT=3306
         - DB_NAME=aicalorietracker
         - DB_USER=appuser
         - DB_PASSWORD=apppassword
       depends_on:
         - db
         - redis
       volumes:
         - ./logs:/app/logs
       restart: unless-stopped
     
     db:
       image: mysql:8.0
       environment:
         - MYSQL_ROOT_PASSWORD=rootpassword
         - MYSQL_DATABASE=aicalorietracker
         - MYSQL_USER=appuser
         - MYSQL_PASSWORD=apppassword
       volumes:
         - mysql_data:/var/lib/mysql
       restart: unless-stopped
     
     redis:
       image: redis:6.2-alpine
       volumes:
         - redis_data:/data
       restart: unless-stopped
     
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
       depends_on:
         - server
       restart: unless-stopped

   volumes:
     mysql_data:
     redis_data:
   ```

2. **Create nginx.conf**
   ```nginx
   events {
     worker_connections 1024;
   }

   http {
     upstream backend {
       server server:3000;
     }

     server {
       listen 80;
       server_name yourdomain.com;

       location / {
         proxy_pass http://backend;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;
       }

       location /socket.io/ {
         proxy_pass http://backend;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection "upgrade";
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto $scheme;
       }
     }
   }
   ```

3. **Build and start containers**
   ```bash
   docker-compose up -d --build
   ```

### 3. Cloud Deployment

#### AWS Deployment

1. **Create AWS EC2 instance**
   - Choose Amazon Linux 2
   - Configure security groups (ports 22, 80, 443)
   - Attach IAM role with necessary permissions

2. **Install dependencies**
   ```bash
   sudo yum update -y
   sudo yum install -y git nodejs npm mysql
   ```

3. **Deploy application**
   ```bash
   git clone https://github.com/your-username/AICalorieTracker.git
   cd AICalorieTracker/server
   npm install
   cp .env.example .env
   # Configure .env
   npm run migrate
   npm run build
   pm2 start ecosystem.config.js
   ```

4. **Configure Nginx**
   ```bash
   sudo yum install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

#### Heroku Deployment

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Configure environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set OPENAI_API_KEY=your_openai_api_key
   # Add all required environment variables
   ```

3. **Deploy application**
   ```bash
   git push heroku main
   ```

## Database Setup

### MySQL Database

1. **Create database**
   ```sql
   CREATE DATABASE aicalorietracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'apppassword';
   GRANT ALL PRIVILEGES ON aicalorietracker.* TO 'appuser'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. **Run migrations**
   ```bash
   npm run migrate
   ```

3. **Seed database (optional)**
   ```bash
   npm run seed
   ```

### Redis Setup (Optional)

1. **Install Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # CentOS/RHEL
   sudo yum install redis
   ```

2. **Configure Redis**
   ```bash
   sudo nano /etc/redis/redis.conf
   # Set memory limit and persistence settings
   sudo systemctl restart redis
   ```

## SSL/TLS Configuration

### Using Let's Encrypt

1. **Install Certbot**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Configure Nginx with SSL**
   ```nginx
   server {
     listen 443 ssl;
     server_name yourdomain.com;
     
     ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
     }
   }
   ```

## Monitoring and Logging

### Application Monitoring

1. **Sentry Integration**
   - Create Sentry account
   - Create project
   - Install Sentry SDK
   - Configure DSN in environment variables

2. **Prometheus Integration**
   - Install Prometheus
   - Configure scrape targets
   - Set up Grafana dashboards

### Logging

1. **Log rotation**
   ```bash
   sudo apt-get install logrotate
   sudo nano /etc/logrotate.d/aicalorietracker
   ```

2. **Log rotation configuration**
   ```
   /var/log/aicalorietracker/*.log {
     daily
     missingok
     rotate 7
     compress
     delaycompress
     notifempty
     create 644 root root
   }
   ```

## Performance Optimization

### Database Optimization

1. **Index optimization**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_user_id ON meals(user_id);
   CREATE INDEX idx_created_at ON meals(created_at);
   CREATE INDEX idx_user_id_created_at ON meals(user_id, created_at);
   ```

2. **Query optimization**
   - Use EXPLAIN to analyze slow queries
   - Avoid SELECT *
   - Use appropriate JOIN types

### Caching Strategy

1. **Redis caching**
   ```javascript
   // Example Redis caching
   const cachedData = await redis.get(`user:${userId}`);
   if (cachedData) {
     return JSON.parse(cachedData);
   }
   
   const data = await getUserFromDatabase(userId);
   await redis.setex(`user:${userId}`, 3600, JSON.stringify(data));
   ```

2. **HTTP caching**
   ```javascript
   // Set cache headers
   res.set('Cache-Control', 'public, max-age=3600');
   ```

## Security Hardening

### Application Security

1. **Rate limiting**
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

2. **Helmet.js for security headers**
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

3. **CORS configuration**
   ```javascript
   app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
   }));
   ```

### Database Security

1. **Connection security**
   ```javascript
   // Use SSL for database connections
   const db = mysql.createConnection({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     ssl: { rejectUnauthorized: true }
   });
   ```

2. **Input validation**
   ```javascript
   import { body, validationResult } from 'express-validator';
   
   app.post('/api/users', [
     body('email').isEmail(),
     body('password').isLength({ min: 8 })
   ], (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     // Proceed with user creation
   });
   ```

## Backup and Recovery

### Database Backup

1. **Automated backup script**
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   mysqldump -u appuser -p aicalorietracker > /backup/aicalorietracker_$DATE.sql
   gzip /backup/aicalorietracker_$DATE.sql
   ```

2. **Cron job for automated backups**
   ```bash
   0 2 * * * /path/to/backup.sh
   ```

### File Storage Backup

1. **AWS S3 backup**
   ```bash
   aws s3 sync /uploads s3://your-backup-bucket/uploads/
   ```

## Troubleshooting

### Common Issues

1. **Database connection issues**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Memory issues**
   - Monitor memory usage
   - Adjust connection pool settings
   - Implement proper error handling

3. **Performance issues**
   - Monitor slow queries
   - Check indexing
   - Review caching strategy

### Debug Mode

1. **Enable debug logging**
   ```env
   LOG_LEVEL=debug
   ```

2. **Enable verbose error reporting**
   ```env
   NODE_ENV=development
   ```

## Maintenance

### Regular Tasks

1. **Update dependencies**
   ```bash
   npm audit
   npm update
   ```

2. **Monitor logs**
   ```bash
   tail -f logs/combined.log
   ```

3. **Check system health**
   ```bash
   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   
   # Check CPU usage
   top
   ```

### Scaling

1. **Horizontal scaling**
   - Load balancer configuration
   - Multiple application instances
   - Database read replicas

2. **Vertical scaling**
   - Increase server resources
   - Optimize application code
   - Implement caching

## Support

For support and questions:
- GitHub Issues: https://github.com/your-username/AICalorieTracker/issues
- Documentation: https://docs.aicalorietracker.com
- Email: support@aicalorietracker.com