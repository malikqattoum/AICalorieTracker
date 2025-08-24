# AI Calorie Tracker Development Workflow

## Overview

This document outlines the development workflow for the AI Calorie Tracker project. It covers the entire development lifecycle from setting up the development environment to deploying the application to production.

## Table of Contents
- [Development Environment Setup](#development-environment-setup)
- [Code Standards and Style](#code-standards-and-style)
- [Git Workflow](#git-workflow)
- [Development Process](#development-process)
- [Testing Strategy](#testing-strategy)
- [Code Review Process](#code-review-process)
- [Deployment Process](#deployment-process)
- [Monitoring and Maintenance](#monitoring-and-maintenance)

## Development Environment Setup

### Prerequisites
- Node.js 18+
- npm 8+ or yarn 1.22+
- MySQL 8.0+ or PostgreSQL 13+
- Git
- VS Code (recommended)

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-org/ai-calorie-tracker.git
cd ai-calorie-tracker

# Install dependencies
npm install

# Copy environment files
cp .env.example .env
cp client/.env.example client/.env

# Set up database
mysql -u root -p -e "CREATE DATABASE ai_calorie_tracker;"
npm run db:generate
npm run db:migrate

# Start development servers
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev

# Terminal 3 - Mobile (optional)
cd ../mobile
npm start
```

### IDE Setup (VS Code)
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.preferTypeOnlyAutoImports": true,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json"
  ]
}
```

## Code Standards and Style

### TypeScript Standards
```typescript
// Use strict TypeScript configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}

// Use interfaces for object shapes
interface User {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
}

// Use type unions for multiple possible types
type UserRole = 'admin' | 'user' | 'premium';

// Use generics for reusable functions
function identity<T>(arg: T): T {
  return arg;
}
```

### JavaScript/Node.js Standards
```javascript
// Use ES6+ features
const { name, age } = user;
const numbers = [1, 2, 3].map(n => n * 2);

// Use async/await for async operations
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Use proper error handling
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### Frontend Standards (React)
```typescript
// Use functional components with hooks
import React, { useState, useEffect } from 'react';

interface UserProfileProps {
  userId: number;
  onUpdate: (userData: User) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

export default UserProfile;
```

### CSS/Tailwind Standards
```css
/* Use BEM-like naming convention */
.user-profile__header {
  @apply bg-gray-100 p-4 rounded-lg;
}

.user-profile__avatar {
  @apply w-16 h-16 rounded-full object-cover;
}

.user-profile__info {
  @apply mt-4;
}

/* Use CSS variables for theming */
:root {
  --primary-color: #4F46E5;
  --secondary-color: #6366F1;
  --text-color: #1F2937;
  --background-color: #FFFFFF;
}

/* Use responsive design */
@media (max-width: 768px) {
  .user-profile {
    @apply p-4;
  }
}
```

## Git Workflow

### Branch Strategy
We use a GitFlow-based workflow with the following branches:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature branches
- **hotfix/***: Hotfix branches for production issues
- **release/***: Release branches

### Branch Naming Conventions
```bash
# Feature branches
feature/user-authentication
feature/meal-analysis
feature/mobile-camera

# Bugfix branches
bugfix/login-validation-error
bugfix/database-connection-timeout

# Hotfix branches
hotfix/security-vulnerability
hotfix/critical-bug-fix

# Release branches
release/v1.0.0
release/v1.1.0
```

### Commit Message Format
```bash
# Format: type(scope): description
# 
# Types:
# feat: New feature
# fix: Bug fix
# docs: Documentation changes
# style: Code style changes
# refactor: Code refactoring
# test: Test changes
# chore: Build process or auxiliary tool changes

# Examples:
feat(auth): add JWT token refresh mechanism
fix(database): handle connection pool exhaustion
docs(api): update API documentation
style(lint): fix code formatting issues
refactor(utils): extract common validation functions
test(auth): add unit tests for login functionality
chore(deps): update dependencies to latest versions
```

### Git Hooks
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Run linting and tests before commit
npm run lint
npm run test

# .git/hooks/pre-push
#!/bin/bash
# Run full test suite before push
npm run test:ci
npm run build
```

## Development Process

### 1. Feature Development
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name

# Make changes
# ... code changes ...

# Commit changes
git add .
git commit -m "feat(your-feature): add new functionality"

# Push to remote
git push origin feature/your-feature-name

# Create pull request
# Go to GitHub and create PR from feature branch to develop
```

### 2. Bug Fix Process
```bash
# Create bugfix branch from develop
git checkout develop
git checkout -b bugfix/bug-description

# Fix the bug
# ... code changes ...

# Test the fix
npm run test
npm run test:e2e

# Commit and push
git add .
git commit -m "fix(bug): resolve specific issue"
git push origin bugfix/bug-description

# Create pull request
```

### 3. Code Quality Checks
```bash
# Run linting
npm run lint

# Run type checking
npm run check

# Run tests
npm run test

# Run security audit
npm audit

# Check for vulnerabilities
npm audit fix
```

### 4. Database Changes
```bash
# Create migration
npm run db:generate

# Test migration
npm run db:migrate

# Create migration rollback
npm run db:generate -- --down

# Document database changes
# Add migration description to CHANGELOG.md
```

## Testing Strategy

### Testing Pyramid
```
        /\
       /  \
      /    \
     /      \
    /________\
   Integration   Unit   E2E
     Tests       Tests   Tests
```

### Unit Testing
```typescript
// Example unit test
import { calculateCalories } from '../utils/nutrition';

describe('calculateCalories', () => {
  it('should calculate calories correctly', () => {
    const food = {
      protein: 10,
      carbs: 20,
      fat: 5
    };
    
    const calories = calculateCalories(food);
    expect(calories).toBe(145); // (10 * 4) + (20 * 4) + (5 * 9)
  });

  it('should handle zero values', () => {
    const food = {
      protein: 0,
      carbs: 0,
      fat: 0
    };
    
    const calories = calculateCalories(food);
    expect(calories).toBe(0);
  });
});
```

### Integration Testing
```typescript
// Example integration test
import request from 'supertest';
import { app } from '../app';
import { db } from '../db';

describe('Meal Analysis API', () => {
  beforeAll(async () => {
    // Set up test database
    await db.migrate();
  });

  afterAll(async () => {
    // Clean up test database
    await db.destroy();
  });

  it('should analyze food image', async () => {
    const response = await request(app)
      .post('/api/analyze-food')
      .set('Authorization', 'Bearer test-token')
      .send({
        imageData: 'base64-encoded-image'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('foodName');
  });
});
```

### E2E Testing
```typescript
// Example E2E test
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should allow user to login', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

### Test Coverage
```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/tests/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Code Review Process

### Review Checklist
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Database changes are documented
- [ ] Dependencies are reviewed

### Review Process
1. **Create Pull Request**: PR should be created from feature branch to develop
2. **Automated Checks**: CI/CD pipeline runs tests and linting
3. **Code Review**: At least one team member reviews the code
4. **Address Feedback**: Address all review comments
5. **Final Approval**: Tech lead or senior developer approves
6. **Merge**: PR is merged to develop branch

### Review Comments Format
```markdown
### Code Review Comments

#### Positive Feedback
- Great job implementing the new authentication flow!
- The error handling is comprehensive and well-structured.

#### Suggestions for Improvement
1. **Security**: Consider adding rate limiting to the login endpoint.
2. **Performance**: The database query could be optimized by adding an index.
3. **Testing**: Add unit tests for the new utility functions.

#### Required Changes
- [ ] Fix the TypeScript error in the user service
- [ ] Update the API documentation for the new endpoint
- [ ] Add integration tests for the payment flow
```

## Deployment Process

### Environment Strategy
- **Development**: Local development environment
- **Staging**: Pre-production environment for testing
- **Production**: Live environment for users

### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to production
      run: |
        # Deploy script here
        npm run deploy:production
```

### Deployment Steps
1. **Code Freeze**: No more feature commits to main branch
2. **Final Testing**: Run full test suite on staging
3. **Database Migration**: Apply database changes
4. **Build Application**: Create production build
5. **Deploy**: Deploy to production servers
6. **Monitor**: Monitor application health and performance
7. **Rollback Plan**: Prepare rollback plan if needed

### Rollback Process
```bash
# Rollback script
#!/bin/bash

echo "Starting rollback..."

# Stop current application
pm2 stop ai-calorie-tracker

# Restore previous version
cp /backups/previous-version.tar.gz /app/
tar -xzf previous-version.tar.gz

# Restart application
pm2 start ecosystem.config.js

# Verify rollback
curl -f https://your-domain.com/health

echo "Rollback completed"
```

## Monitoring and Maintenance

### Application Monitoring
```javascript
// Monitoring setup
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV
});

// Error tracking
app.use(Sentry.Handlers.errorHandler());

// Performance monitoring
app.use(Sentry.Handlers.requestHandler());
```

### Health Checks
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.execute('SELECT 1');
    
    // Check external services
    await checkExternalServices();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### Logging
```javascript
// Structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
});
```

### Performance Monitoring
```javascript
// Performance monitoring
const client = require('prom-client');

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 200, 300, 400, 500, 1000]
});

// Apply metrics middleware
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  
  res.on('finish', () => {
    end({ 
      method: req.method, 
      route: req.route?.path || 'unknown',
      status_code: res.statusCode 
    });
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Development Best Practices

### Code Organization
```
src/
├── controllers/     # Route controllers
├── services/       # Business logic
├── models/         # Database models
├── utils/          # Utility functions
├── middleware/     # Custom middleware
├── types/          # TypeScript type definitions
├── config/         # Configuration files
└── tests/          # Test files
```

### Error Handling
```typescript
// Centralized error handling
class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
app.use((error: AppError, req: Request, res: Response, next: NextFunction) => {
  const { statusCode = 500, message } = error;
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
});
```

### Security Best Practices
```typescript
// Security middleware
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### Performance Optimization
```typescript
// Caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600, checkperiod: 600 });

// Cache middleware
const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      return res.json(cachedResponse);
    }
    
    res.originalJson = res.json;
    res.json = (body: any) => {
      cache.set(key, body, duration);
      res.originalJson(body);
    };
    
    next();
  };
};

// Database optimization
app.use((req: Request, res: Response, next: NextFunction) => {
  const queryStart = Date.now();
  
  res.on('finish', () => {
    const queryDuration = Date.now() - queryStart;
    if (queryDuration > 1000) {
      console.warn(`Slow query: ${queryDuration}ms - ${req.method} ${req.url}`);
    }
  });
  
  next();
});
```

## Continuous Integration/Continuous Deployment (CI/CD)

### GitHub Actions Setup
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x]
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Set up Node.js
      uses: actions/setup-node@v2
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run check
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Build application
      run: npm run build
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v2
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

### Docker Integration
```dockerfile
# Dockerfile
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

## Documentation

### Code Documentation
```typescript
/**
 * User Service
 * 
 * Handles user-related operations including registration, login, and profile management.
 */
export class UserService {
  /**
   * Create a new user account
   * @param userData - User registration data
   * @returns Promise<User> - Created user object
   * @throws AppError - If user creation fails
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    // Implementation
  }
}
```

### API Documentation
```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

## Conclusion

This development workflow ensures consistent code quality, efficient collaboration, and reliable deployments. By following these guidelines, the team can maintain high standards and deliver features quickly and safely.

For additional questions or clarifications, please refer to the project's documentation or reach out to the development team.