# Deploying Node.js Express Application on Shared Hosting with PHP Reverse Proxy

## Table of Contents

1. [Introduction and Overview](#introduction-and-overview)
2. [Preparation Phase](#preparation-phase)
3. [PHP Reverse Proxy Implementation](#php-reverse-proxy-implementation)
4. [Node.js Server Setup](#nodejs-server-setup)
5. [Integration and Configuration](#integration-and-configuration)
6. [Testing and Validation](#testing-and-validation)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Appendices](#appendices)

## 1. Introduction and Overview

### Problem Statement and Solution Overview

Shared hosting providers typically don't support direct Node.js deployment due to security restrictions and resource limitations. This guide presents a comprehensive solution using a PHP reverse proxy to bridge the gap between shared hosting constraints and Node.js application requirements.

**Key Challenges Addressed:**
- No direct Node.js execution permissions
- Limited background process management
- Restricted port access (typically only port 80/443)
- File system permission constraints
- Resource usage monitoring requirements

**Solution Architecture:**
```
Internet → Apache (Port 80/443) → PHP Proxy → Node.js Server (Port 3002)
                                      ↓
                                 Localhost Communication
```

### Architecture Summary

The deployment architecture consists of three main components:

1. **Apache Web Server**: Handles incoming HTTP requests
2. **PHP Reverse Proxy**: Routes requests to the Node.js backend
3. **Node.js Express Server**: Processes API requests and serves application logic

### Prerequisites and Assumptions

**System Requirements:**
- Shared hosting with PHP 7.4+ support
- Node.js 18+ available via SSH or alternative installation
- MySQL database access
- SSH access for server management
- Cron job capabilities
- File system write permissions

**Assumptions:**
- Hosting provider allows custom PHP scripts
- SSH access available for Node.js management
- Sufficient disk space for application and logs
- Database server accessible from hosting environment

## 2. Preparation Phase

### Node.js Application Analysis

**Port Configuration:**
The application runs on port 3002 by default, as configured in `server/index.ts`:

```typescript
const port = process.env.PORT || PORT;
const host = "0.0.0.0";
```

**Dependencies and Build Process:**
Based on `package.json`, the application requires:

```json
{
  "scripts": {
    "build": "vite build",
    "build:server": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js"
  }
}
```

**Build Steps:**
1. Install dependencies: `npm install --production`
2. Build client: `npm run build`
3. Build server: `npm run build:server`
4. Start production server: `npm start`

### Environment Requirements

**Directory Structure:**
```
public_html/
├── node-proxy.php          # PHP reverse proxy
├── .htaccess              # Apache configuration
├── dist/                  # Compiled Node.js application
├── client/dist/           # Built client assets
├── logs/                  # Application logs
├── uploads/               # File uploads directory
└── .env                   # Environment variables
```

**File Permissions:**
- `node-proxy.php`: 644 (readable by web server)
- `dist/`: 755 (executable directory)
- `logs/`: 755 (writable directory)
- `uploads/`: 755 (writable directory)

### File Structure and Permissions

**Required Directory Permissions:**
```bash
chmod 755 dist/
chmod 755 logs/
chmod 755 uploads/
chmod 644 node-proxy.php
chmod 644 .htaccess
```

**Log File Structure:**
```
logs/
├── proxy.log              # PHP proxy logs
├── app.log               # Node.js application logs
├── error.log             # Error logs
└── access.log            # Access logs
```

## 3. PHP Reverse Proxy Implementation

### Architecture Design Summary

The PHP reverse proxy (`node-proxy.php`) serves as the bridge between Apache and the Node.js server, implementing:

- **Request Forwarding**: HTTP requests from Apache to Node.js
- **Response Handling**: Processing Node.js responses back to clients
- **Error Management**: Handling Node.js server unavailability
- **Security Controls**: IP-based access restrictions
- **Resource Management**: Memory and connection limits
- **Retry Logic**: Automatic retry on connection failures

### Implementation Details from node-proxy.php

**Core Components:**

1. **RequestHandler Class**: Processes incoming HTTP requests
```php
class RequestHandler {
    public function getMethod() { return $_SERVER['REQUEST_METHOD']; }
    public function getHeaders() { /* Extract headers from $_SERVER */ }
    public function getBody() { return file_get_contents('php://input'); }
    public function getQueryString() { return $_SERVER['QUERY_STRING'] ?? ''; }
}
```

2. **ProxyEngine Class**: Handles cURL-based request forwarding
```php
class ProxyEngine {
    public function forward($method, $url, $headers, $body, $query) {
        $ch = curl_init();
        $fullUrl = $this->config['node_server'] . $url;
        // Configure cURL options for proxying
        return ['response' => $response, 'code' => $httpCode, 'error' => $error];
    }
}
```

3. **ResponseProcessor Class**: Handles response formatting
```php
class ResponseProcessor {
    public function process($result) {
        if ($result['error']) {
            http_response_code(502);
            echo json_encode(['error' => 'Proxy error']);
            return;
        }
        http_response_code($result['code']);
        echo $result['response'];
    }
}
```

**Configuration Options:**

```php
$config = [
    'node_server' => 'http://localhost:3002',
    'timeout' => 30,
    'retry_attempts' => 3,
    'retry_delay' => 1,
    'allowed_ips' => ['127.0.0.1', '::1'],
    'max_memory' => 128 * 1024 * 1024, // 128MB
    'max_connections' => 10,
    'log_file' => 'logs/proxy.log'
];
```

### Customization Options

**Timeout Configuration:**
- `timeout`: cURL request timeout (default: 30 seconds)
- Adjust based on your application's response times

**Retry Logic:**
- `retry_attempts`: Number of retry attempts (default: 3)
- `retry_delay`: Delay between retries in seconds (default: 1)

**Security Settings:**
- `allowed_ips`: Array of allowed client IPs
- Add your server's IP addresses for security

**Resource Limits:**
- `max_memory`: Memory limit per request (default: 128MB)
- `max_connections`: Maximum concurrent connections (default: 10)

## 4. Node.js Server Setup

### Installation and Dependency Management

**Node.js Installation on Shared Hosting:**

```bash
# Check if Node.js is available
node --version
npm --version

# If not available, install via Node Version Manager (NVM)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

**Dependency Installation:**
```bash
# Navigate to application directory
cd /home/username/public_html

# Install production dependencies only
npm install --production --no-optional

# Verify installation
npm list --depth=0
```

### Persistent Execution Methods

**Method 1: Using nohup (Recommended for Shared Hosting):**
```bash
# Start the application in background
nohup npm start > logs/app.log 2>&1 &

# Get the process ID
echo $! > app.pid

# Check if running
ps aux | grep node
```

**Method 2: Using screen/tmux (if available):**
```bash
# Install screen (if not available)
# screen -S nodeapp
npm start
# Ctrl+A, D to detach

# Reattach to screen
screen -r nodeapp
```

**Method 3: Cron Job for Auto-restart:**
```bash
# Add to crontab (crontab -e)
*/5 * * * * /path/to/check-and-restart.sh
```

**Process Monitoring Script (`check-and-restart.sh`):**
```bash
#!/bin/bash
PROCESS_NAME="node"
APP_DIR="/home/username/public_html"
LOG_FILE="$APP_DIR/logs/restart.log"

# Check if Node.js process is running
if ! pgrep -f "$PROCESS_NAME.*dist/index.js" > /dev/null; then
    echo "$(date): Node.js process not found, restarting..." >> $LOG_FILE
    cd $APP_DIR
    nohup npm start >> logs/app.log 2>&1 &
    echo $! > app.pid
else
    echo "$(date): Node.js process is running" >> $LOG_FILE
fi
```

### Port Configuration and Conflict Resolution

**Port Selection:**
- Default port: 3002 (configured in server/index.ts)
- Ensure port is not used by other services
- Check available ports: `netstat -tlnp | grep :3002`

**Port Conflict Resolution:**
```bash
# Check what's using the port
lsof -i :3002

# Kill conflicting process (if safe)
kill -9 <PID>

# Or change Node.js port
export PORT=3003
```

**Firewall Considerations:**
- Shared hosting typically blocks external access to custom ports
- Ensure Node.js binds to localhost only: `host: "127.0.0.1"`

## 5. Integration and Configuration

### Web Server Configuration (.htaccess for Apache)

**Basic .htaccess Configuration:**
```apache
# Enable rewrite engine
RewriteEngine On

# Handle API routes
RewriteRule ^api/(.*)$ node-proxy.php [QSA,L]

# Handle static files
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^(.*)$ - [L]

# Handle SPA routes (for client-side routing)
RewriteRule ^(?!api/)(.*)$ /index.html [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache control for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 month"
    ExpiresDefault "access plus 2 days"
</IfModule>
```

### PHP Proxy Configuration

**Advanced Configuration Options:**
```php
$config = [
    'node_server' => 'http://127.0.0.1:3002',
    'timeout' => 60,                    // Increased timeout for API calls
    'retry_attempts' => 2,              // Reduced retries for faster failure
    'retry_delay' => 0.5,               // Faster retry delay
    'allowed_ips' => ['127.0.0.1'],     // Restrict to localhost
    'max_memory' => 256 * 1024 * 1024,  // 256MB memory limit
    'max_connections' => 20,            // Allow more concurrent connections
    'log_file' => __DIR__ . '/logs/proxy.log',
    'debug_mode' => false,              // Set to true for debugging
    'health_check_interval' => 30       // Health check every 30 seconds
];
```

### Environment Variables and Secrets Management

**Environment File Structure (.env):**
```bash
# Server Configuration
NODE_ENV=production
PORT=3002
HOST=127.0.0.1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AI Service Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# File Storage
LOCAL_STORAGE_ENABLED=true
LOCAL_STORAGE_PATH=./uploads

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
SENTRY_DSN=your_sentry_dsn
```

**Secure Environment Variable Handling:**
```php
// In node-proxy.php, load environment variables
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $envVars = parse_ini_file($envFile);
    foreach ($envVars as $key => $value) {
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}
```

**Secrets Management Best Practices:**
1. Never commit .env files to version control
2. Use strong, unique secrets for each environment
3. Rotate secrets regularly
4. Store backups of secrets securely
5. Use environment-specific secrets

## 6. Testing and Validation

### Health Checks and Endpoint Testing

**Basic Health Check Endpoint:**
```javascript
// In server/index.ts, add health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

**PHP Proxy Health Check:**
```php
// Add to node-proxy.php
if ($_SERVER['REQUEST_URI'] === '/api/health') {
    // Perform health check
    $healthCheck = checkNodeHealth();
    if ($healthCheck['status'] === 'healthy') {
        http_response_code(200);
        echo json_encode($healthCheck);
    } else {
        http_response_code(503);
        echo json_encode(['error' => 'Service unavailable']);
    }
    exit;
}

function checkNodeHealth() {
    $ch = curl_init('http://127.0.0.1:3002/health');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode === 200 ? 'healthy' : 'unhealthy',
        'response_code' => $httpCode,
        'timestamp' => date('c')
    ];
}
```

**Testing Script:**
```bash
#!/bin/bash
# test-deployment.sh

echo "Testing Node.js Application Health..."
curl -f http://localhost:3002/health

echo "Testing PHP Proxy..."
curl -f http://yourdomain.com/api/health

echo "Testing API Endpoints..."
curl -f http://yourdomain.com/api/test

echo "Testing Database Connection..."
curl -f http://yourdomain.com/api/health/db

echo "All tests completed!"
```

### Load Testing Considerations

**Basic Load Testing with Apache Bench:**
```bash
# Test PHP proxy performance
ab -n 1000 -c 10 http://yourdomain.com/api/health

# Test Node.js server directly
ab -n 1000 -c 10 http://localhost:3002/health
```

**Monitoring Load Test Results:**
- Response times
- Error rates
- Memory usage
- CPU utilization
- Database connection pool usage

### Error Scenario Testing

**Common Error Scenarios to Test:**
1. Node.js server down
2. Database connection failure
3. File system permission issues
4. Memory exhaustion
5. Network timeouts

**Error Testing Script:**
```bash
#!/bin/bash
# test-error-scenarios.sh

echo "Testing Node.js server down scenario..."
# Stop Node.js server
pkill -f "node.*dist/index.js"
sleep 2
curl http://yourdomain.com/api/health
# Should return 503 error

echo "Testing database connection failure..."
# Temporarily change database credentials
# Test API endpoint
# Should return database error

echo "Error scenario testing completed!"
```

## 7. Monitoring and Maintenance

### Logging Setup and Rotation

**Application Logging Configuration:**
```javascript
// In server/index.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'aicalorietracker' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

**PHP Proxy Logging:**
```php
// Enhanced logging in node-proxy.php
class ErrorHandler {
    public function log($message, $level = 'INFO') {
        $logFile = $this->config['log_file'];
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[$timestamp] [$level] $message\n";
        file_put_contents($logFile, $logEntry, FILE_APPEND);
    }
}
```

**Log Rotation Setup:**
```bash
# Create logrotate configuration
cat > /home/username/logrotate.conf << EOF
/home/username/public_html/logs/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    create 644 username username
    postrotate
        # Reload application if needed
        if [ -f /home/username/public_html/app.pid ]; then
            kill -HUP $(cat /home/username/public_html/app.pid)
        fi
    endscript
}
EOF

# Set up cron job for log rotation
# Add to crontab: 0 2 * * * /usr/sbin/logrotate /home/username/logrotate.conf
```

### Resource Monitoring

**System Resource Monitoring Script:**
```bash
#!/bin/bash
# monitor-resources.sh

LOG_FILE="/home/username/public_html/logs/monitoring.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')

# Memory Usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')

# Disk Usage
DISK_USAGE=$(df /home/username | tail -1 | awk '{print $5}' | sed 's/%//')

# Node.js Process Check
NODE_RUNNING=$(pgrep -f "node.*dist/index.js" | wc -l)

echo "[$TIMESTAMP] CPU: ${CPU_USAGE}% MEM: ${MEM_USAGE}% DISK: ${DISK_USAGE}% NODE: $NODE_RUNNING" >> $LOG_FILE

# Alert if resources are critical
if (( $(echo "$CPU_USAGE > 90" | bc -l) )) || (( $(echo "$MEM_USAGE > 90" | bc -l) )); then
    echo "[$TIMESTAMP] CRITICAL: High resource usage detected" >> $LOG_FILE
    # Send alert (email, SMS, etc.)
fi
```

**Database Monitoring:**
```sql
-- Create monitoring queries
SELECT
    COUNT(*) as total_connections,
    SUM(time) as total_time,
    AVG(time) as avg_time
FROM information_schema.processlist
WHERE user != 'system user';

-- Check for slow queries
SELECT
    sql_text,
    exec_count,
    avg_timer_wait/1000000000 as avg_time_sec
FROM performance_schema.events_statements_summary_by_digest
ORDER BY avg_timer_wait DESC
LIMIT 10;
```

### Backup and Recovery Procedures

**Automated Backup Script:**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/home/username/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/username/public_html"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='uploads' \
    --exclude='.env' \
    .

# Backup database
mysqldump -h localhost -u username -p'password' database_name > $BACKUP_DIR/db_$DATE.sql

# Compress database backup
gzip $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $APP_DIR/uploads .

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

**Recovery Procedures:**

**Application Recovery:**
```bash
#!/bin/bash
# recover-app.sh

BACKUP_DATE="20241218_120000"
BACKUP_DIR="/home/username/backups"
APP_DIR="/home/username/public_html"

# Stop application
pkill -f "node.*dist/index.js"

# Restore application files
tar -xzf $BACKUP_DIR/app_$BACKUP_DATE.tar.gz -C $APP_DIR

# Restore uploads
tar -xzf $BACKUP_DIR/uploads_$BACKUP_DATE.tar.gz -C $APP_DIR/uploads

# Install dependencies
cd $APP_DIR
npm install --production

# Start application
nohup npm start > logs/app.log 2>&1 &
echo $! > app.pid
```

**Database Recovery:**
```bash
#!/bin/bash
# recover-db.sh

BACKUP_DATE="20241218_120000"
BACKUP_DIR="/home/username/backups"

# Restore database
gunzip < $BACKUP_DIR/db_$BACKUP_DATE.sql.gz | mysql -h localhost -u username -p'password' database_name

echo "Database recovery completed"
```

## 8. Troubleshooting Guide

### Common Issues and Solutions

#### 1. PHP Proxy Connection Refused

**Symptoms:**
- HTTP 502 errors
- "Proxy error" messages
- Node.js server appears down

**Solutions:**
```bash
# Check if Node.js is running
ps aux | grep node

# Check Node.js port
netstat -tlnp | grep :3002

# Restart Node.js server
cd /home/username/public_html
nohup npm start > logs/app.log 2>&1 &
```

#### 2. Memory Exhaustion

**Symptoms:**
- Application crashes
- HTTP 500 errors
- PHP proxy returns memory errors

**Solutions:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Increase PHP memory limit (if possible)
# In .htaccess or php.ini
php_value memory_limit 256M

# Optimize Node.js memory usage
export NODE_OPTIONS="--max-old-space-size=512"
```

#### 3. Permission Denied Errors

**Symptoms:**
- File write errors
- Log file creation failures
- Upload directory access issues

**Solutions:**
```bash
# Fix directory permissions
chmod 755 logs/
chmod 755 uploads/
chmod 644 *.php
chmod 644 .htaccess

# Check file ownership
ls -la /home/username/public_html/
```

#### 4. Database Connection Issues

**Symptoms:**
- API endpoints return database errors
- Application startup failures
- Connection timeout errors

**Solutions:**
```bash
# Test database connection
mysql -h localhost -u username -p'password' database_name -e "SELECT 1;"

# Check database server status
# Contact hosting provider for database issues

# Verify connection parameters in .env
cat .env | grep DB_
```

#### 5. Port Conflicts

**Symptoms:**
- Node.js fails to start
- "Port already in use" errors

**Solutions:**
```bash
# Check port usage
lsof -i :3002

# Kill conflicting process
kill -9 <PID>

# Change port in .env
echo "PORT=3003" >> .env
```

### Performance Optimization

#### Node.js Performance Tuning

```javascript
// Optimize server configuration
server.maxConnections = 50;
server.timeout = 120000;
server.keepAliveTimeout = 125000;

// Use clustering for multi-core systems
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process
  const port = process.env.PORT || 3002;
  server.listen(port);
}
```

#### Database Optimization

```sql
-- Optimize database settings
SET GLOBAL innodb_buffer_pool_size = 134217728; -- 128MB
SET GLOBAL max_connections = 50;
SET GLOBAL query_cache_size = 67108864; -- 64MB

-- Add indexes for performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_meal_user_date ON meals(user_id, date);
```

#### Caching Strategies

```javascript
// Implement Redis caching (if available)
import { createClient } from 'redis';

const redisClient = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Cache middleware
app.use((req, res, next) => {
  const key = req.originalUrl;
  redisClient.get(key, (err, data) => {
    if (data) {
      res.json(JSON.parse(data));
    } else {
      next();
    }
  });
});
```

### Security Hardening

#### PHP Security Measures

```php
// Input validation
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

// Rate limiting
class RateLimiter {
    private $requests = [];
    
    public function checkLimit($ip, $maxRequests = 100, $timeWindow = 3600) {
        $now = time();
        $this->requests[$ip] = array_filter(
            $this->requests[$ip] ?? [],
            fn($time) => $now - $time < $timeWindow
        );
        
        if (count($this->requests[$ip]) >= $maxRequests) {
            return false;
        }
        
        $this->requests[$ip][] = $now;
        return true;
    }
}
```

#### Node.js Security Headers

```javascript
// Security middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

## 9. Appendices

### Appendix A: Complete Configuration Files

#### .htaccess (Complete Version)
```apache
# AICalorieTracker .htaccess Configuration
RewriteEngine On

# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# API proxy routing
RewriteRule ^api/(.*)$ node-proxy.php [QSA,L]

# Static file handling
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^(.*)$ - [L]

# SPA fallback
RewriteRule ^(?!api/)(.*)$ /index.html [QSA,L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:;"
</IfModule>

# Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/webp "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    ExpiresByType application/json "access plus 1 month"
    ExpiresDefault "access plus 2 days"
</IfModule>

# PHP settings
<IfModule mod_php.c>
    php_value upload_max_filesize 50M
    php_value post_max_size 50M
    php_value memory_limit 256M
    php_value max_execution_time 300
</IfModule>

# Error handling
ErrorDocument 404 /404.html
ErrorDocument 500 /500.html

# Access control
<Files "node-proxy.php">
    Require all granted
</Files>

# Deny access to sensitive files
<FilesMatch "\.(env|log|pid)$">
    Require all denied
</FilesMatch>
```

#### Environment Variables Template (.env.example)
```bash
# =================================================================
# AICalorieTracker Environment Configuration
# =================================================================

# Server Configuration
NODE_ENV=production
PORT=3002
HOST=127.0.0.1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=aicalorietracker_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# JWT Configuration
JWT_SECRET=your_256_bit_jwt_secret_key_here_minimum_32_characters
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AI Service Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.7

# External API Keys
NUTRITIONIX_APP_ID=your_nutritionix_app_id
NUTRITIONIX_APP_KEY=your_nutritionix_app_key
SPOONACULAR_API_KEY=your_spoonacular_api_key

# Payment Processing
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# File Storage
LOCAL_STORAGE_ENABLED=true
LOCAL_STORAGE_PATH=./uploads
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_s3_bucket_name

# Email Service
SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key

# Push Notifications
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FIREBASE_SERVER_KEY=your_firebase_server_key

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring and Logging
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Redis Configuration (if available)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Performance Tuning
MAX_CONNECTIONS=50
REQUEST_TIMEOUT=30000
SESSION_TIMEOUT=3600000

# Feature Flags
ENABLE_AI_FEATURES=true
ENABLE_PREMIUM_FEATURES=true
ENABLE_WEARABLE_INTEGRATION=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Appendix B: Monitoring Scripts

#### System Health Check Script
```bash
#!/bin/bash
# system-health-check.sh

LOG_FILE="/home/username/public_html/logs/health-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=== System Health Check: $TIMESTAMP ===" >> $LOG_FILE

# Check Node.js process
NODE_PID=$(pgrep -f "node.*dist/index.js")
if [ -n "$NODE_PID" ]; then
    echo "✓ Node.js process running (PID: $NODE_PID)" >> $LOG_FILE
else
    echo "✗ Node.js process not running" >> $LOG_FILE
fi

# Check PHP proxy accessibility
PROXY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/node-proxy.php)
if [ "$PROXY_STATUS" = "200" ]; then
    echo "✓ PHP proxy accessible" >> $LOG_FILE
else
    echo "✗ PHP proxy not accessible (HTTP $PROXY_STATUS)" >> $LOG_FILE
fi

# Check database connection
DB_STATUS=$(mysql -h localhost -u username -p'password' -e "SELECT 1;" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ Database connection successful" >> $LOG_FILE
else
    echo "✗ Database connection failed" >> $LOG_FILE
fi

# Check disk space
DISK_USAGE=$(df /home/username | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 90 ]; then
    echo "✓ Disk usage: $DISK_USAGE%" >> $LOG_FILE
else
    echo "✗ High disk usage: $DISK_USAGE%" >> $LOG_FILE
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -lt 90 ]; then
    echo "✓ Memory usage: $MEM_USAGE%" >> $LOG_FILE
else
    echo "✗ High memory usage: $MEM_USAGE%" >> $LOG_FILE
fi

echo "=== Health Check Complete ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

#### Automated Backup Script
```bash
#!/bin/bash
# automated-backup.sh

BACKUP_DIR="/home/username/backups"
SOURCE_DIR="/home/username/public_html"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR

echo "Starting backup: $DATE"

# Backup application files (excluding node_modules, logs, uploads)
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
    -C $SOURCE_DIR \
    --exclude='node_modules' \
    --exclude='logs' \
    --exclude='uploads' \
    --exclude='.env' \
    --exclude='.git' \
    .

# Backup database
mysqldump -h localhost -u username -p'password' database_name > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Backup uploads directory
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C $SOURCE_DIR/uploads .

# Calculate backup sizes
APP_SIZE=$(du -h $BACKUP_DIR/app_$DATE.tar.gz | cut -f1)
DB_SIZE=$(du -h $BACKUP_DIR/db_$DATE.sql.gz | cut -f1)
UPLOADS_SIZE=$(du -h $BACKUP_DIR/uploads_$DATE.tar.gz | cut -f1)

echo "Backup completed successfully:"
echo "  Application: $APP_SIZE"
echo "  Database: $DB_SIZE"
echo "  Uploads: $UPLOADS_SIZE"

# Clean up old backups
find $BACKUP_DIR -name "app_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned up (retention: $RETENTION_DAYS days)"
echo "Backup process completed at $(date)"
```

### Appendix C: Deployment Checklist

#### Pre-Deployment Checklist
- [ ] Node.js 18+ installed and accessible
- [ ] npm packages installed (--production flag used)
- [ ] Application built successfully (npm run build:server)
- [ ] Client assets built (npm run build)
- [ ] Environment variables configured (.env file)
- [ ] Database connection tested
- [ ] File permissions set correctly
- [ ] Required directories created (logs, uploads)
- [ ] .htaccess file configured
- [ ] node-proxy.php uploaded and configured
- [ ] SSL certificate installed (if required)

#### Deployment Checklist
- [ ] Application files uploaded to server
- [ ] Dependencies installed on server
- [ ] Environment variables copied
- [ ] Database migrations run
- [ ] Application started successfully
- [ ] PHP proxy accessible
- [ ] Health check endpoints responding
- [ ] API endpoints tested
- [ ] File upload functionality tested
- [ ] Database connections verified
- [ ] Logs accessible and rotating
- [ ] Monitoring scripts installed
- [ ] Backup scripts configured

#### Post-Deployment Checklist
- [ ] Application responding to requests
- [ ] Error logs checked for issues
- [ ] Performance metrics monitored
- [ ] Security headers verified
- [ ] SSL certificate working (if applicable)
- [ ] Domain DNS configured
- [ ] CDN configured (if applicable)
- [ ] Monitoring alerts set up
- [ ] Backup verification completed
- [ ] Documentation updated

### Appendix D: Quick Reference Commands

#### Node.js Management
```bash
# Start application
nohup npm start > logs/app.log 2>&1 &

# Stop application
pkill -f "node.*dist/index.js"

# Check if running
ps aux | grep node

# View logs
tail -f logs/app.log

# Restart application
pkill -f "node.*dist/index.js" && sleep 2 && nohup npm start > logs/app.log 2>&1 &
```

#### File Permissions
```bash
# Set correct permissions
chmod 755 dist/
chmod 755 logs/
chmod 755 uploads/
chmod 644 *.php
chmod 644 .htaccess
chmod 600 .env
```

#### Database Operations
```bash
# Test connection
mysql -h localhost -u username -p'password' database_name -e "SELECT 1;"

# Backup database
mysqldump -h localhost -u username -p'password' database_name > backup.sql

# Restore database
mysql -h localhost -u username -p'password' database_name < backup.sql
```

#### Log Analysis
```bash
# View recent errors
tail -f logs/error.log

# Search for specific errors
grep "ERROR" logs/app.log

# Count requests by endpoint
grep "GET\|POST\|PUT\|DELETE" logs/access.log | cut -d' ' -f6 | sort | uniq -c | sort -nr
```

#### System Monitoring
```bash
# Check system resources
top
free -h
df -h

# Check network connections
netstat -tlnp
lsof -i :3002

# Check cron jobs
crontab -l
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** AICalorieTracker Development Team  
**Contact:** support@aicalorietracker.com

This comprehensive deployment guide provides all the necessary information for successfully deploying the AICalorieTracker application on shared hosting environments using the PHP reverse proxy approach. Regular updates and improvements will be made based on community feedback and technological advancements.