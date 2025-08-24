# AICalorieTracker Deployment Guide

This guide provides comprehensive instructions for deploying the AICalorieTracker application in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development](#local-development)
4. [Docker Deployment](#docker-deployment)
5. [AWS Deployment](#aws-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Security Considerations](#security-considerations)
10. [Performance Optimization](#performance-optimization)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have the following:

### System Requirements
- Node.js 18 or higher
- npm or yarn package manager
- Docker and Docker Compose (for containerized deployment)
- PostgreSQL 12 or higher
- Redis 6 or higher
- Git

### Environment Variables
Create a `.env` file in the root directory with the following variables:

```bash
# Application Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/aic_calorie_tracker
DB_SSL_REJECT_UNAUTHORIZED=true
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key
GOOGLE_API_KEY=your-google-api-key

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# File Upload Configuration
FILE_MAX_SIZE=5242880
FILE_STORAGE_PROVIDER=s3
FILE_S3_BUCKET=your-bucket-name
FILE_S3_REGION=us-east-1
FILE_S3_ACCESS_KEY_ID=your-access-key
FILE_S3_SECRET_ACCESS_KEY=your-secret-key

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=https://yourdomain.com

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_MIXPANEL_TOKEN=your-mixpanel-token

# Third-party Services
STRIPE_PUBLISHABLE_KEY=your-stripe-key
STRIPE_SECRET_KEY=your-stripe-secret
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

## Environment Setup

### Production Environment Setup

1. **Server Setup**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install Docker
   sudo apt-get install -y docker.io docker-compose
   
   # Install PostgreSQL
   sudo apt-get install -y postgresql postgresql-contrib
   
   # Install Redis
   sudo apt-get install -y redis-server
   ```

2. **Database Setup**
   ```bash
   # Create database user
   sudo -u postgres createuser --interactive
   # Enter username: aic_user
   # Shall the new role be a superuser? (y/n) n
   # Shall the new role be allowed to create databases? (y/n) y
   # Shall the new role be allowed to create more new roles? (y/n) n
   
   # Create database
   sudo -u postgres createdb aic_calorie_tracker
   
   # Grant permissions
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aic_calorie_tracker TO aic_user;"
   ```

3. **Redis Setup**
   ```bash
   # Configure Redis
   sudo nano /etc/redis/redis.conf
   
   # Update the following settings:
   # maxmemory 256mb
   # maxmemory-policy allkeys-lru
   # requirepass your-redis-password
   
   # Restart Redis
   sudo systemctl restart redis
   ```

## Local Development

### Running Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run Database Migrations**
   ```bash
   npm run db:migrate
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

### Using Docker Compose

1. **Start Services**
   ```bash
   docker-compose up -d
   ```

2. **View Logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop Services**
   ```bash
   docker-compose down
   ```

## Docker Deployment

### Building the Docker Image

```bash
# Build the image
docker build -t aic-calorie-tracker:latest .

# Run the container
docker run -d \
  --name aic-calorie-tracker \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/uploads:/app/uploads \
  aic-calorie-tracker:latest
```

### Using Docker Compose

1. **Start the Stack**
   ```bash
   docker-compose up -d
   ```

2. **Scale Services**
   ```bash
   docker-compose up -d --scale app=3
   ```

3. **Update Application**
   ```bash
   docker-compose pull
   docker-compose up -d --force-recreate
   ```

## AWS Deployment

### Using AWS ECS

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name aic-calorie-tracker --region us-east-1
   ```

2. **Build and Push Image**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
   docker build -t aic-calorie-tracker .
   docker tag aic-calorie-tracker:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/aic-calorie-tracker:latest
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/aic-calorie-tracker:latest
   ```

3. **Create ECS Task Definition**
   ```json
   {
     "family": "aic-calorie-tracker",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::123456789012:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "aic-calorie-tracker",
         "image": "123456789012.dkr.ecr.us-east-1.amazonaws.com/aic-calorie-tracker:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           },
           {
             "name": "DATABASE_URL",
             "value": "postgresql://user:password@rds-endpoint:5432/aic_calorie_tracker"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/aic-calorie-tracker",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

4. **Create ECS Service**
   ```bash
   aws ecs create-service \
     --cluster aic-calorie-tracker-cluster \
     --service-name aic-calorie-tracker \
     --task-definition aic-calorie-tracker:1 \
     --desired-count 3 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345678],securityGroups=[sg-12345678],assignPublicIp=ENABLED}"
   ```

### Using AWS Elastic Beanstalk

1. **Initialize Elastic Beanstalk**
   ```bash
   eb init -p "Node.js" aic-calorie-tracker
   ```

2. **Create Environment**
   ```bash
   eb create production
   ```

3. **Deploy Application**
   ```bash
   eb deploy
   ```

## Kubernetes Deployment

### Using kubectl

1. **Create Kubernetes Manifests**
   ```yaml
   # deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: aic-calorie-tracker
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: aic-calorie-tracker
     template:
       metadata:
         labels:
           app: aic-calorie-tracker
       spec:
         containers:
         - name: aic-calorie-tracker
           image: aic-calorie-tracker:latest
           ports:
           - containerPort: 3000
           env:
           - name: NODE_ENV
             value: "production"
           - name: DATABASE_URL
             valueFrom:
               secretKeyRef:
                 name: database-secret
                 key: url
           resources:
             requests:
               memory: "512Mi"
               cpu: "250m"
             limits:
               memory: "1Gi"
               cpu: "500m"
   ```

2. **Apply Manifests**
   ```bash
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   kubectl apply -f ingress.yaml
   ```

### Using Helm

1. **Create Helm Chart**
   ```bash
   helm create aic-calorie-tracker
   ```

2. **Customize Values**
   ```yaml
   # values.yaml
   replicaCount: 3
   image:
     repository: aic-calorie-tracker
     tag: latest
     pullPolicy: IfNotPresent
   service:
     type: LoadBalancer
     port: 80
   ingress:
     enabled: true
     annotations:
       kubernetes.io/ingress.class: nginx
     hosts:
     - host: yourdomain.com
       paths:
       - path: /
         pathType: Prefix
   ```

3. **Install Chart**
   ```bash
   helm install aic-calorie-tracker ./aic-calorie-tracker
   ```

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run security scan
      run: npm audit

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Build Docker image
      run: |
        docker build -t aic-calorie-tracker:${{ github.sha }} .
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push aic-calorie-tracker:${{ github.sha }}
    
    - name: Deploy to production
      if: github.ref == 'refs/heads/main'
      run: |
        echo "Deploying to production..."
        # Add deployment commands here
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        DOCKER_IMAGE = 'aic-calorie-tracker'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} ."
            }
        }
        
        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "docker login -u ${DOCKER_USER} -p ${DOCKER_PASS}"
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                }
            }
        }
        
        stage('Deploy') {
            steps {
                sh 'echo "Deploying to production..."'
                // Add deployment commands here
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
    }
}
```

## Monitoring and Logging

### Application Monitoring

1. **Health Checks**
   ```bash
   # Basic health check
   curl http://localhost:3000/api/health
   
   # Detailed health check
   curl http://localhost:3000/api/health/detailed
   
   # Database health check
   curl http://localhost:3000/api/health/database
   ```

2. **Metrics Collection**
   ```bash
   # Prometheus metrics
   curl http://localhost:3000/api/metrics
   
   # Application metrics
   curl http://localhost:3000/api/stats
   ```

### Logging Configuration

1. **Structured Logging**
   ```javascript
   // Configure Winston logger
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
       new winston.transports.File({ filename: 'logs/combined.log' }),
       new winston.transports.Console({
         format: winston.format.simple()
       })
     ]
   });
   ```

2. **Log Aggregation**
   ```bash
   # Configure ELK Stack
   # Filebeat configuration
   filebeat.inputs:
   - type: log
     enabled: true
     paths:
       - /app/logs/*.log
     fields:
       app: aic-calorie-tracker
     fields_under_root: true
   ```

## Security Considerations

### Production Security Checklist

1. **Environment Variables**
   - [ ] Store sensitive data in environment variables
   - [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - [ ] Never commit secrets to version control

2. **Database Security**
   - [ ] Use SSL/TLS for database connections
   - [ ] Implement proper access controls
   - [ ] Regular database backups
   - [ ] Database encryption at rest

3. **Application Security**
   - [ ] Implement rate limiting
   - [ ] Use HTTPS/TLS
   - [ ] Implement proper authentication and authorization
   - [ ] Regular security updates

4. **Container Security**
   - [ ] Use minimal base images
   - [ ] Scan container images for vulnerabilities
   - [ ] Implement proper resource limits
   - [ ] Use non-root users

### Security Scanning

```bash
# Run security scan
npm audit

# Docker security scan
docker scan aic-calorie-tracker:latest

# Code security analysis
npm install -g @npmcli/arborist
npm audit --json --audit-level moderate
```

## Performance Optimization

### Database Optimization

1. **Indexing**
   ```sql
   -- Create indexes for frequently queried columns
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_meals_user_id ON meals(user_id);
   CREATE INDEX idx_meals_created_at ON meals(created_at);
   ```

2. **Query Optimization**
   ```sql
   -- Use EXPLAIN to analyze query performance
   EXPLAIN ANALYZE SELECT * FROM meals WHERE user_id = 1 AND created_at > '2023-01-01';
   ```

3. **Connection Pooling**
   ```javascript
   // Configure connection pool
   const pool = new Pool({
     user: process.env.DB_USER,
     host: process.env.DB_HOST,
     database: process.env.DB_NAME,
     password: process.env.DB_PASSWORD,
     port: process.env.DB_PORT,
     max: 20,
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 2000,
   });
   ```

### Caching Strategy

1. **Redis Caching**
   ```javascript
   // Configure Redis caching
   const redis = require('redis');
   const client = redis.createClient({
     host: process.env.REDIS_HOST,
     port: process.env.REDIS_PORT,
     password: process.env.REDIS_PASSWORD
   });
   
   // Cache middleware
   const cache = (duration) => {
     return async (req, res, next) => {
       const key = req.originalUrl || req.url;
       const cachedData = await client.get(key);
       
       if (cachedData) {
         return res.json(JSON.parse(cachedData));
       }
       
       res.originalJson = res.json;
       res.json = (body) => {
         client.setex(key, duration, JSON.stringify(body));
         res.originalJson(body);
       };
       
       next();
     };
   };
   ```

2. **Application-Level Caching**
   ```javascript
   // In-memory cache
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 600, checkperiod: 600 });
   
   // Cache user data
   const getUser = async (userId) => {
     const cachedUser = cache.get(`user:${userId}`);
     if (cachedUser) {
       return cachedUser;
     }
     
     const user = await User.findById(userId);
     cache.set(`user:${userId}`, user);
     return user;
   };
   ```

## Backup and Recovery

### Database Backup

1. **Automated Backups**
   ```bash
   # PostgreSQL backup
   pg_dump -U postgres aic_calorie_tracker > backup_$(date +%Y%m%d_%H%M%S).sql
   
   # Restore backup
   psql -U postgres aic_calorie_tracker < backup_20231201_120000.sql
   ```

2. **Automated Backup Script**
   ```bash
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_DIR="/backups"
   DATABASE_NAME="aic_calorie_tracker"
   
   # Create backup
   pg_dump -U postgres $DATABASE_NAME > $BACKUP_DIR/backup_$DATE.sql
   
   # Compress backup
   gzip $BACKUP_DIR/backup_$DATE.sql
   
   # Keep only last 7 days of backups
   find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
   ```

### File Backup

1. **Upload Backup**
   ```bash
   # Upload to S3
   aws s3 cp /backups/ s3://your-backup-bucket/ --recursive
   ```

2. **Automated Backup Schedule**
   ```bash
   # Add to crontab
   0 2 * * * /path/to/backup_script.sh
   ```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check database status
   sudo systemctl status postgresql
   
   # Check database logs
   tail -f /var/log/postgresql/postgresql-15-main.log
   
   # Test database connection
   psql -U postgres -d aic_calorie_tracker -c "SELECT 1;"
   ```

2. **Memory Issues**
   ```bash
   # Check memory usage
   free -h
   
   # Check process memory
   ps aux | grep node
   
   # Monitor memory usage
   node --inspect app.js
   ```

3. **Performance Issues**
   ```bash
   # Monitor system resources
   top
   
   # Check application performance
   npm run profile
   
   # Analyze slow queries
   EXPLAIN ANALYZE SELECT * FROM meals WHERE user_id = 1;
   ```

### Debug Mode

```bash
# Enable debug mode
DEBUG=* npm run dev

# Enable specific debug modules
DEBUG=app:*,db:* npm run dev

# Enable verbose logging
LOG_LEVEL=debug npm run dev
```

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/database

# System health
curl http://localhost:3000/api/health/system

# Readiness probe
curl http://localhost:3000/api/health/ready

# Liveness probe
curl http://localhost:3000/api/health/live
```

## Support

For additional support, please:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [API documentation](./docs/api.md)
3. Open an issue on [GitHub](https://github.com/your-repo/aic-calorie-tracker/issues)
4. Contact the development team at support@yourdomain.com

---

*Last Updated: December 2023*
*Version: 1.0.0*