# AI Calorie Tracker Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the AI Calorie Tracker application in various environments. The application consists of three main components:

1. **Backend Server** - Node.js/Express API with AI services
2. **Web Frontend** - React application with Vite
3. **Mobile App** - React Native application

## Prerequisites

Before deployment, ensure you have the following:

### System Requirements
- Node.js 18+ 
- npm 8+ or yarn 1.22+
- MySQL 8.0+ or PostgreSQL 13+
- Redis (optional, for caching)
- Nginx (optional, for reverse proxy)

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/ai_calorie_tracker
# OR for PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/ai_calorie_tracker

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# Stripe Configuration (for payments)
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Sentry Configuration (for error tracking)
SENTRY_DSN=your-sentry-dsn

# App Configuration
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-domain.com
```

## Deployment Methods

### 1. Local Development Setup

#### Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-org/ai-calorie-tracker.git
cd ai-calorie-tracker

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

#### Frontend Setup
```bash
# Install frontend dependencies
cd client
npm install

# Start development server
npm run dev
```

#### Mobile App Setup
```bash
# Install mobile dependencies
cd mobile
npm install

# Start development server
npm start
```

### 2. Docker Deployment

#### Using Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://user:password@db:3306/ai_calorie_tracker
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ai_calorie_tracker
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    volumes:
      - db_data:/var/lib/mysql
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./uploads:/var/www/uploads
    depends_on:
      - app

volumes:
  db_data:
  redis_data:
```

```bash
# Build and start services
docker-compose up -d

# Run database migrations
docker-compose exec app npm run db:migrate
```

### 3. Cloud Deployment

#### AWS Deployment

##### Using AWS Elastic Beanstalk
```bash
# Install EB CLI
pip install awsebcli

# Initialize EB
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

##### Using AWS ECS
```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t ai-calorie-tracker .
docker tag ai-calorie-tracker:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-calorie-tracker:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-calorie-tracker:latest

# Create ECS task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### Google Cloud Platform

##### Using Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/ai-calorie-tracker
gcloud run deploy ai-calorie-tracker --image gcr.io/PROJECT-ID/ai-calorie-tracker --platform managed
```

#### Heroku Deployment
```bash
# Login to Heroku
heroku login

# Create app
heroku create ai-calorie-tracker

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DATABASE_URL=your-database-url

# Add buildpack
heroku buildpacks:add heroku/nodejs

# Deploy
git push heroku main
```

### 4. Traditional Server Deployment

#### Ubuntu Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Clone repository
git clone https://github.com/your-org/ai-calorie-tracker.git
cd ai-calorie-tracker

# Install dependencies
npm install --production

# Set up environment
cp .env.example .env
nano .env

# Set up database
npm run db:generate
npm run db:migrate

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ai-calorie-tracker',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/ai-calorie-tracker
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static files
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
    }
    
    # Uploads
    location /uploads {
        alias /path/to/your/uploads;
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

## Database Setup

### MySQL Setup
```sql
-- Create database
CREATE DATABASE ai_calorie_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON ai_calorie_tracker.* TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE ai_calorie_tracker;

-- Create user
CREATE USER app_user WITH PASSWORD 'secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE ai_calorie_tracker TO app_user;
```

## SSL Certificate Setup

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring and Logging

### Application Monitoring
```bash
# Install PM2 monitoring
pm2 monit

# View logs
pm2 logs

# Install PM2 dashboard
pm2 install pm2-server-monit
```

### Health Checks
```javascript
// Add health check endpoint in server
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected' // Add actual database check
  });
});
```

## Backup and Recovery

### Database Backup
```bash
# MySQL backup
mysqldump -u app_user -p ai_calorie_tracker > backup_$(date +%Y%m%d).sql

# PostgreSQL backup
pg_dump -U app_user -d ai_calorie_tracker > backup_$(date +%Y%m%d).sql

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/path/to/backups"
mkdir -p $BACKUP_DIR

# Database backup
mysqldump -u app_user -p ai_calorie_tracker > $BACKUP_DIR/db_backup_$DATE.sql

# Upload to cloud (optional)
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql s3://your-backup-bucket/

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
```

### File Backup
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup configuration files
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env nginx.conf
```

## Performance Optimization

### Caching Strategy
```javascript
// Redis caching setup
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});

// Cache middleware
const cache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl || req.url;
    const cachedData = await redis.get(key);
    
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    res.originalJson = res.json;
    res.json = (body) => {
      redis.setex(key, duration, JSON.stringify(body));
      res.originalJson(body);
    };
    
    next();
  };
};
```

### Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_meal_analyses_user_id ON meal_analyses(user_id);
CREATE INDEX idx_meal_analyses_timestamp ON meal_analyses(timestamp);

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM meal_analyses WHERE user_id = 1 ORDER BY timestamp DESC;
```

## Security Hardening

### Environment Security
```bash
# Set proper file permissions
chmod 600 .env
chmod 700 uploads/

# Remove development dependencies
npm prune --production

# Run security audit
npm audit

# Use HTTPS only
NODE_ENV=production
FORCE_HTTPS=true
```

### Database Security
```sql
-- Create read-only user for application
CREATE USER 'app_readonly'@'localhost' IDENTIFIED BY 'readonly_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_calorie_tracker.* TO 'app_readonly'@'localhost';

-- Create backup user
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON ai_calorie_tracker.* TO 'backup_user'@'localhost';
```

## Deployment Scripts

### Automated Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build

# Run database migrations
npm run db:migrate

# Restart application
pm2 restart ai-calorie-tracker

echo "Deployment completed successfully!"
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

APP_URL="https://your-domain.com/health"
MAX_RETRIES=5
RETRY_DELAY=30

for ((i=1; i<=MAX_RETRIES; i++)); do
    if curl -f "$APP_URL" > /dev/null 2>&1; then
        echo "Health check passed"
        exit 0
    else
        echo "Health check failed (attempt $i/$MAX_RETRIES)"
        if [ $i -eq $MAX_RETRIES ]; then
            echo "Max retries reached. Alerting..."
            # Send alert notification
            curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
                -H 'Content-type: application/json' \
                --data '{"text":"Health check failed for AI Calorie Tracker"}'
            exit 1
        fi
        sleep $RETRY_DELAY
    fi
done
```

## Troubleshooting Common Issues

### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Database Connection Issues
```bash
# Test database connection
mysql -u app_user -p -h localhost ai_calorie_tracker

# Check database status
systemctl status mysql
```

### Memory Issues
```bash
# Check memory usage
free -h

# Increase swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## Support

For deployment support:
- Email: deploy-support@ai-calorie-tracker.com
- Documentation: https://docs.ai-calorie-tracker.com
- Status Page: https://status.ai-calorie-tracker.com
- Community Forum: https://community.ai-calorie-tracker.com