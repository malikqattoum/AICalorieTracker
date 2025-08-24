# AI Calorie Tracker Troubleshooting Guide

## Overview

This guide provides solutions to common issues and problems you may encounter while developing, deploying, or using the AI Calorie Tracker application. The guide is organized by component and issue type for easy navigation.

## Table of Contents
- [Common Issues](#common-issues)
- [Development Environment Issues](#development-environment-issues)
- [Database Issues](#database-issues)
- [AI Service Issues](#ai-service-issues)
- [Frontend Issues](#frontend-issues)
- [Mobile App Issues](#mobile-app-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Security Issues](#security-issues)
- [Error Messages](#error-messages)

## Common Issues

### 1. Application Won't Start

**Symptom:** Application fails to start with no error message.

**Solutions:**
```bash
# Check Node.js version
node --version
# Should be 18+ 

# Check if port is available
lsof -i :3000
# If port is in use, either kill the process or change port

# Check environment variables
echo $NODE_ENV
echo $DATABASE_URL

# Check if all dependencies are installed
npm install
```

**Configuration Check:**
```bash
# Verify .env file exists
ls -la .env

# Check if .env has required variables
grep -E "(DATABASE_URL|JWT_SECRET|NODE_ENV)" .env
```

### 2. Database Connection Issues

**Symptom:** Application starts but database operations fail.

**Solutions:**
```bash
# Test database connection
mysql -u your_username -p -h localhost your_database

# Check database service status
systemctl status mysql
# or for Docker
docker ps | grep mysql

# Verify database URL format
echo $DATABASE_URL
# Should be: mysql://user:password@host:port/database

# Check database permissions
mysql -u root -p -e "GRANT ALL PRIVILEGES ON your_database.* TO 'your_user'@'localhost'; FLUSH PRIVILEGES;"
```

**Common Database Fixes:**
```sql
-- Check if database exists
SHOW DATABASES LIKE 'ai_calorie_tracker';

-- Check if tables exist
USE ai_calorie_tracker;
SHOW TABLES;

-- Check if user has permissions
SELECT user, host FROM mysql.user WHERE user = 'your_user';
```

### 3. JWT Authentication Issues

**Symptom:** Users can't login or authentication fails.

**Solutions:**
```bash
# Check JWT secret
echo $JWT_SECRET
# Should be a long, random string

# Generate new JWT secret
openssl rand -base64 32

# Check token expiration
echo $JWT_EXPIRES_IN
# Should be reasonable (e.g., 7d)

# Verify token format
# JWT should have 3 parts separated by dots
```

## Development Environment Issues

### 1. TypeScript Compilation Errors

**Symptom:** TypeScript compilation fails with various errors.

**Solutions:**
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
rm -rf .next
rm -rf dist

# Check TypeScript version
npx tsc --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Check for type errors
npm run check
```

**Common TypeScript Fixes:**
```typescript
// Fix missing imports
import { required } from 'zod';

// Fix type mismatches
const userId: number = parseInt(req.params.id);

// Fix optional chaining
const user = data?.user || null;
```

### 2. Hot Reloading Not Working

**Symptom:** Changes to code are not reflected in the running application.

**Solutions:**
```bash
# Check if using development mode
echo $NODE_ENV
# Should be "development"

# Restart development server
npm run dev

# Check for file watching issues
# Ensure files are not being edited by other processes
```

### 3. Import/Export Issues

**Symptom:** Module not found or import errors.

**Solutions:**
```bash
# Check file extensions
# Use .js or .ts extensions in imports
import { something } from './module.js';

# Check path aliases
# Verify tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@server/*": ["server/*"],
      "@shared/*": ["shared/*"]
    }
  }
}

# Check module resolution
# Ensure proper package.json exports
```

## Database Issues

### 1. Migration Failures

**Symptom:** Database migrations fail during setup or updates.

**Solutions:**
```bash
# Check migration status
npm run db:generate

# Reset database (use with caution)
mysql -u root -p -e "DROP DATABASE IF EXISTS ai_calorie_tracker; CREATE DATABASE ai_calorie_tracker;"

# Run migrations manually
npx drizzle-kit migrate

# Check migration files
ls -la server/src/migrations/
```

**Common Migration Fixes:**
```sql
-- Handle foreign key constraints
SET FOREIGN_KEY_CHECKS = 0;
-- Run migrations
SET FOREIGN_KEY_CHECKS = 1;

-- Check for syntax errors in migration files
# Use MySQL/PostgreSQL client to validate SQL
```

### 2. Data Integrity Issues

**Symptom:** Data corruption or inconsistent data.

**Solutions:**
```sql
-- Check for orphaned records
SELECT * FROM meal_analyses WHERE user_id NOT IN (SELECT id FROM users);

-- Check for duplicate records
SELECT user_id, food_name, COUNT(*) as count 
FROM meal_analyses 
GROUP BY user_id, food_name 
HAVING count > 1;

-- Fix data types
ALTER TABLE users MODIFY COLUMN email VARCHAR(255);
```

### 3. Performance Issues

**Symptom:** Slow database queries or high CPU usage.

**Solutions:**
```sql
-- Add missing indexes
CREATE INDEX idx_meal_analyses_user_id ON meal_analyses(user_id);
CREATE INDEX idx_meal_analyses_timestamp ON meal_analyses(timestamp);
CREATE INDEX idx_users_email ON users(email);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM meal_analyses WHERE user_id = 1 ORDER BY timestamp DESC;

-- Optimize database configuration
# Adjust innodb_buffer_pool_size, max_connections, etc.
```

## AI Service Issues

### 1. OpenAI API Issues

**Symptom:** Food analysis fails or returns errors.

**Solutions:**
```bash
# Check API key
echo $OPENAI_API_KEY
# Should be valid and have sufficient quota

# Test API connection
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4", "messages": [{"role": "user", "content": "Hello"}]}'

# Check API usage and limits
# Visit OpenAI dashboard to check usage and limits
```

**Common AI Service Fixes:**
```javascript
// Handle rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Add retry logic for AI service calls
async function callAIServiceWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 2. Image Processing Issues

**Symptom:** Image upload or processing fails.

**Solutions:**
```bash
# Check file upload limits
echo $MAX_FILE_SIZE
# Should be reasonable (e.g., 10MB)

# Check upload directory permissions
ls -la uploads/
# Should be writable by Node.js process

# Check image processing dependencies
npm list sharp
# Should be installed and working
```

**Common Image Processing Fixes:**
```javascript
// Validate image format
const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
const fileExtension = originalname.split('.').pop().toLowerCase();
if (!allowedFormats.includes(fileExtension)) {
  throw new Error('Invalid image format');
}

// Check image dimensions
const metadata = await sharp(buffer).metadata();
if (metadata.width < 100 || metadata.height < 100) {
  throw new Error('Image too small');
}
```

### 3. AI Service Timeout Issues

**Symptom:** AI service calls take too long or timeout.

**Solutions:**
```javascript
// Implement timeout
const timeout = 30000; // 30 seconds
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('AI service timeout')), timeout);
});

try {
  const result = await Promise.race([
    callAIService(),
    timeoutPromise
  ]);
  return result;
} catch (error) {
  if (error.message === 'AI service timeout') {
    // Fallback to simpler analysis
    return performBasicAnalysis(imageData);
  }
  throw error;
}
```

## Frontend Issues

### 1. Build Errors

**Symptom:** Frontend build fails with various errors.

**Solutions:**
```bash
# Clear build cache
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite

# Check Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Check for environment variables
# Vite needs VITE_* prefixed variables
```

**Common Frontend Fixes:**
```javascript
// Fix environment variable usage
// Use import.meta.env.VITE_API_URL
const apiUrl = import.meta.env.VITE_API_URL;

// Fix CSS imports
// Ensure proper CSS modules or global CSS setup
import './styles.css';

// Fix TypeScript in frontend
// Check tsconfig.json includes client directory
```

### 2. Runtime Errors

**Symptom:** Frontend loads but has JavaScript errors.

**Solutions:**
```bash
# Check browser console for errors
# Open Developer Tools (F12) and check Console tab

# Check network requests
# Check Network tab for failed API calls

# Check for missing environment variables
# Verify VITE_* variables are set
```

**Common Runtime Fixes:**
```javascript
// Fix API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Fix CORS issues
// Ensure backend allows frontend origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Fix authentication
// Ensure proper token storage and usage
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/auth';
}
```

### 3. Styling Issues

**Symptom:** CSS styles not applied or inconsistent.

**Solutions:**
```bash
# Check Tailwind CSS setup
# Verify postcss.config.js and tailwind.config.js

# Check CSS imports
# Ensure proper CSS file imports in main.ts

# Check for conflicting styles
# Use browser DevTools to inspect elements
```

**Common Styling Fixes:**
```javascript
// Fix Tailwind CSS
// Ensure proper imports
import 'tailwindcss/tailwind.css';

// Fix responsive design
// Use proper Tailwind responsive classes
<div className="md:flex md:space-x-4">

// Fix dark mode
// Add dark mode classes
<div className="dark:bg-gray-900 dark:text-white">
```

## Mobile App Issues

### 1. Expo Build Issues

**Symptom:** Mobile app build fails in Expo.

**Solutions:**
```bash
# Clear Expo cache
expo start --clear

# Check Expo version
expo --version

# Update Expo
expo install expo

# Check for native dependencies
expo install expo-camera expo-image-picker
```

**Common Mobile Fixes:**
```javascript
// Fix camera permissions
import { Camera } from 'expo-camera';

const [hasPermission, setHasPermission] = useState(null);

useEffect(() => {
  (async () => {
    const { status } = await Camera.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  })();
}, []);

// Fix image picker
import * as ImagePicker from 'expo-image-picker';

const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });
};
```

### 2. Platform-Specific Issues

**Symptom:** App works on iOS but not Android, or vice versa.

**Solutions:**
```javascript
// Fix platform-specific code
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

// Use platform-specific APIs
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';

// Handle different file paths
const filePath = Platform.OS === 'ios' 
  ? `${documentDirectory}/${file.name}`
  : `${FileSystem.documentDirectory}/${file.name}`;
```

### 3. Offline Functionality Issues

**Symptom:** App doesn't work offline or data sync fails.

**Solutions:**
```javascript
// Implement offline storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const saveOfflineData = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving offline data:', error);
  }
};

// Implement sync logic
const syncOfflineData = async () => {
  const offlineData = await AsyncStorage.getItem('pending_uploads');
  if (offlineData) {
    const data = JSON.parse(offlineData);
    // Sync data to server
    await uploadData(data);
    // Clear offline data after successful sync
    await AsyncStorage.removeItem('pending_uploads');
  }
};
```

## Deployment Issues

### 1. Docker Build Issues

**Symptom:** Docker build fails or container doesn't start.

**Solutions:**
```bash
# Check Dockerfile syntax
docker build -t ai-calorie-tracker .

# Run container interactively
docker run -it --rm -p 3000:3000 ai-calorie-tracker sh

# Check container logs
docker logs container_id

# Check Docker Compose configuration
docker-compose config
```

**Common Docker Fixes:**
```dockerfile
# Fix multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 2. Environment Variable Issues

**Symptom:** Application works locally but fails in production.

**Solutions:**
```bash
# Check environment variables in production
# For Docker
docker exec -it container env

# For Heroku
heroku config

# For AWS ECS
aws ecs describe-tasks --cluster your-cluster --task your-task-id
```

**Common Environment Fixes:**
```bash
# Ensure proper environment variable names
# Production should use different values
NODE_ENV=production
DATABASE_URL=production_database_url
JWT_SECRET=production_secret_key

# Use environment-specific configurations
if (process.env.NODE_ENV === 'production') {
  // Production-specific settings
} else {
  // Development-specific settings
}
```

### 3. SSL/Certificate Issues

**Symptom:** HTTPS not working or certificate errors.

**Solutions:**
```bash
# Check certificate expiration
openssl x509 -in your-cert.pem -text -noout | grep "Not After"

# Test certificate
openssl s_client -connect your-domain.com:443

# Check Nginx configuration
nginx -t
nginx -T
```

**Common SSL Fixes:**
```nginx
# Fix SSL configuration
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    # SSL security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

## Performance Issues

### 1. Memory Issues

**Symptom:** High memory usage or crashes due to memory limits.

**Solutions:**
```bash
# Check memory usage
node --inspect process.js
# Use Chrome DevTools to analyze memory

# Implement memory optimization
// Use streams for large files
const fs = require('fs');
const stream = fs.createReadStream('large-file.txt');

// Use object pooling
const objectPool = [];
function getObject() {
  return objectPool.pop() || new Object();
}

// Clean up unused data
setInterval(() => {
  // Clean up old data
}, 3600000); // Every hour
```

### 2. CPU Issues

**Symptom:** High CPU usage or slow response times.

**Solutions:**
```bash
# Monitor CPU usage
top -p $(pgrep -f "node")
htop

# Profile CPU usage
node --prof process.js
node --prof-process v8.log

// Implement caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 100, checkperiod: 600 });

// Use worker threads for CPU-intensive tasks
const { Worker } = require('worker_threads');
function runWorker(workerCode) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerCode);
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

### 3. Database Performance Issues

**Symptom:** Slow database queries or high load.

**Solutions:**
```sql
-- Optimize queries
SELECT * FROM meal_analyses 
WHERE user_id = ? AND timestamp > ? 
ORDER BY timestamp DESC 
LIMIT 50;

-- Add proper indexes
CREATE INDEX idx_meal_analyses_user_timestamp ON meal_analyses(user_id, timestamp);

-- Use query optimization
EXPLAIN ANALYZE SELECT * FROM meal_analyses WHERE user_id = 1;
```

## Security Issues

### 1. Authentication Issues

**Symptom:** Security vulnerabilities in authentication.

**Solutions:**
```javascript
// Implement proper password hashing
import bcrypt from 'bcrypt';

const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Implement rate limiting
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts'
});

// Implement proper session management
import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000 // 24 hours
  }
}));
```

### 2. CORS Issues

**Symptom:** Cross-origin requests blocked.

**Solutions:**
```javascript
// Configure CORS properly
import cors from 'cors';

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());
```

### 3. Input Validation Issues

**Symptom:** Security vulnerabilities from user input.

**Solutions:**
```javascript
// Implement proper input validation
import { z } from 'zod';

const userSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
});

// Validate input before processing
const result = userSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({
    error: 'Invalid input',
    details: result.error.errors
  });
}

// Sanitize output
import DOMPurify from 'dompurify';

const cleanOutput = DOMPurify.sanitize(userInput);
```

## Error Messages

### Common Error Messages and Solutions

#### "Cannot read property 'x' of undefined"
**Cause:** Trying to access a property of an undefined object.

**Solution:**
```javascript
// Use optional chaining
const value = data?.user?.profile?.name;

// Use nullish coalescing
const name = data?.user?.name ?? 'Guest';

// Add validation
if (!data || !data.user) {
  throw new Error('Invalid data structure');
}
```

#### "ECONNREFUSED ::1:3000"
**Cause:** Connection refused to the specified port.

**Solution:**
```bash
# Check if service is running
lsof -i :3000

# Start the service
npm run dev

# Check if port is blocked
sudo ufw status
```

#### "Database connection failed"
**Cause:** Unable to connect to the database.

**Solution:**
```bash
# Test database connection
mysql -u username -p -h localhost database

# Check database credentials
echo $DATABASE_URL

# Check database service
systemctl status mysql
```

#### "JWT verification failed"
**Cause:** Invalid or expired JWT token.

**Solution:**
```javascript
// Check token format
// JWT should have 3 parts separated by dots

// Verify token expiration
const decoded = jwt.verify(token, process.env.JWT_SECRET);
if (decoded.exp < Date.now() / 1000) {
  throw new Error('Token expired');
}

// Check JWT secret
echo $JWT_SECRET
```

#### "File upload failed"
**Cause:** Issues with file upload functionality.

**Solution:**
```bash
# Check file permissions
ls -la uploads/

# Check file size limits
echo $MAX_FILE_SIZE

# Check file type validation
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
if (!allowedTypes.includes(file.mimetype)) {
  throw new Error('Invalid file type');
}
```

## Debugging Tools

### Node.js Debugging
```bash
# Enable debugging
node --inspect process.js

# Debug with Chrome DevTools
chrome://inspect

# Debug with VS Code
# Add to launch.json:
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Program",
      "skipFiles": [
        "<node_internals>/**"
      ],
      "program": "${workspaceFolder}/dist/index.js",
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

### Database Debugging
```sql
-- Enable query logging
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/mysql.log';

-- Check slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

### Application Monitoring
```javascript
// Add logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log errors
logger.error('Error message', { error: error.stack });

// Log performance
logger.info('Request completed', { 
  method: req.method, 
  url: req.url, 
  duration: Date.now() - startTime 
});
```

## Getting Help

If you continue to experience issues:

1. **Check the logs** - Look for error messages in application logs
2. **Search existing issues** - Check GitHub issues for similar problems
3. **Create a minimal reproduction** - Create a simple example that demonstrates the issue
4. **Provide detailed information** - Include error messages, environment details, and steps to reproduce

### Support Channels
- **GitHub Issues**: https://github.com/your-org/ai-calorie-tracker/issues
- **Email**: support@ai-calorie-tracker.com
- **Community Forum**: https://community.ai-calorie-tracker.com
- **Discord**: https://discord.gg/ai-calorie-tracker

### Bug Report Template
When reporting bugs, please include:

```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Node.js version: [version]
- Database: [MySQL/PostgreSQL version]
- Operating System: [OS version]
- Browser (if applicable): [browser version]

## Error Messages
```

## Additional Resources

- **Official Documentation**: https://docs.ai-calorie-tracker.com
- **API Reference**: https://docs.ai-calorie-tracker.com/api
- **Deployment Guide**: https://docs.ai-calorie-tracker.com/deployment
- **Contributing Guide**: https://docs.ai-calorie-tracker.com/contributing