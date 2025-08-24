# AICalorieTracker Backend

A comprehensive AI-powered calorie tracking and meal analysis backend service built with Node.js, Express, and TypeScript.

## 🚀 Features

- **AI-Powered Meal Analysis**: Advanced meal analysis using OpenAI GPT and Google Gemini
- **Wearable Device Integration**: Support for Apple Health, Google Fit, Fitbit, Garmin, and other health devices
- **Healthcare Provider Integration**: Seamless integration with healthcare providers for comprehensive health data
- **User Management**: Complete user authentication, authorization, and profile management
- **Meal Tracking**: Track meals, calories, and nutritional information
- **Analytics & Reports**: Detailed health analytics and reporting
- **Real-time Sync**: Real-time data synchronization with wearable devices
- **Security**: Enterprise-grade security with JWT authentication, rate limiting, and data encryption
- **Scalability**: Built for scalability with Docker, Kubernetes, and cloud deployment support

## 📋 Prerequisites

- Node.js 18 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher
- Docker and Docker Compose (optional)

## 🛠️ Installation

### Quick Setup

Use the automated setup script for the easiest installation:

```bash
# Clone the repository
git clone https://github.com/your-repo/aic-calorie-tracker.git
cd aic-calorie-tracker/server

# Run the setup script
chmod +x scripts/setup-environment.sh
./scripts/setup-environment.sh -d  # Development setup
# or
./scripts/setup-environment.sh -p  # Production setup
```

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/aic-calorie-tracker.git
   cd aic-calorie-tracker/server
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
   sudo -u postgres createdb aic_calorie_tracker
   
   # Run migrations
   npm run db:migrate
   ```

5. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Building Docker Image

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

## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the root directory:

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

### Configuration Files

- `src/config/development.ts` - Development configuration
- `src/config/production.ts` - Production configuration
- `src/config/environment.ts` - Environment-specific configuration
- `src/config/deployment.ts` - Deployment configuration

## 📊 API Documentation

### Authentication

```bash
# Register user
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

# Refresh token
POST /api/auth/refresh
Authorization: Bearer <refresh_token>
```

### Meal Management

```bash
# Create meal
POST /api/meals
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Grilled Chicken Salad",
  "description": "Healthy salad with grilled chicken",
  "calories": 350,
  "protein": 30,
  "carbs": 20,
  "fat": 15,
  "mealType": "lunch"
}

# Get meals
GET /api/meals?startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <access_token>

# Analyze meal with AI
POST /api/meals/analyze
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "description": "Grilled chicken breast with quinoa and roasted vegetables",
  "image": "base64-encoded-image"
}
```

### Wearable Device Integration

```bash
# Connect wearable device
POST /api/wearables/connect
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceType": "fitbit",
  "deviceId": "device-123",
  "authToken": "device-auth-token"
}

# Sync device data
POST /api/wearables/sync
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceId": "device-123",
  "syncType": "both"
}

# Get device status
GET /api/wearables/status?deviceId=device-123
Authorization: Bearer <access_token>
```

### Healthcare Integration

```bash
# Connect healthcare provider
POST /api/healthcare/connect
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "provider": "apple_health",
  "authCode": "auth-code-from-provider"
}

# Get healthcare data
GET /api/healthcare/data?metricType=steps&startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <access_token>

# Generate health report
POST /api/healthcare/reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "type": "weekly",
  "startDate": "2023-01-01",
  "endDate": "2023-01-07"
}
```

### Analytics

```bash
# Get user analytics
GET /api/analytics/user
Authorization: Bearer <access_token>

# Get health insights
GET /api/analytics/insights
Authorization: Bearer <access_token>

# Get correlation analysis
GET /api/analytics/correlation?metric1=steps&metric2=calories_burned
Authorization: Bearer <access_token>
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests with watch mode
npm run test:watch

# Run specific test file
npm test -- --testPathPattern=user.test.ts
```

### Test Coverage

The application includes comprehensive test coverage:

- Unit tests for all services and utilities
- Integration tests for API endpoints
- End-to-end tests for critical workflows
- Mock services for external dependencies

## 🔒 Security

The application implements multiple security layers:

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy and input sanitization
- **CORS Protection**: Configurable cross-origin resource sharing
- **Data Encryption**: SSL/TLS encryption for data in transit
- **Password Hashing**: bcrypt for secure password storage

## 📈 Monitoring & Logging

### Health Checks

```bash
# Basic health check
GET /api/health

# Detailed health check
GET /api/health/detailed

# Database health check
GET /api/health/database

# System health check
GET /api/health/system
```

### Logging

The application uses structured logging with Winston:

- **Application Logs**: Request/response logging
- **Error Logs**: Error tracking and debugging
- **Security Logs**: Security event logging
- **Performance Logs**: Performance metrics

### Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **Sentry**: Error tracking
- **CloudWatch**: AWS monitoring

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   # Set up production environment
   ./scripts/setup-environment.sh -p
   ```

2. **Database Migration**
   ```bash
   npm run db:migrate
   ```

3. **Build Application**
   ```bash
   npm run build
   ```

4. **Start Application**
   ```bash
   npm start
   ```

### Cloud Deployment

The application supports deployment to various cloud platforms:

- **AWS**: ECS, Elastic Beanstalk, RDS, ElastiCache
- **Google Cloud**: GKE, Cloud SQL, Memorystore
- **Azure**: AKS, Azure Database for PostgreSQL, Azure Cache for Redis

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n aic-calorie-tracker

# View logs
kubectl logs -f deployment/aic-calorie-tracker -n aic-calorie-tracker
```

## 🔄 CI/CD

The application includes comprehensive CI/CD pipelines:

### GitHub Actions

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
    - name: Build Docker image
      run: |
        docker build -t aic-calorie-tracker:${{ github.sha }} .
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push aic-calorie-tracker:${{ github.sha }}
    - name: Deploy to production
      if: github.ref == 'refs/heads/main'
      run: |
        echo "Deploying to production..."
```

## 📚 Documentation

### API Documentation

- [OpenAPI/Swagger Documentation](./docs/api.md)
- [GraphQL Schema](./docs/schema.graphql)
- [Postman Collection](./docs/postman.json)

### Developer Documentation

- [Architecture Overview](./docs/architecture.md)
- [Database Schema](./docs/database.md)
- [Authentication Flow](./docs/authentication.md)
- [Wearable Integration Guide](./docs/wearable-integration.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow the existing code style
- Ensure all tests pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for GPT API
- [Google](https://google.com/) for Gemini API
- [Fitbit](https://fitbit.com/) for wearable device integration
- [Apple Health](https://developer.apple.com/health/) for health data integration
- [Express](https://expressjs.com/) for the web framework
- [TypeScript](https://www.typescriptlang.org/) for type safety
- [PostgreSQL](https://www.postgresql.org/) for the database
- [Redis](https://redis.io/) for caching

## 📞 Support

For support, please:

1. Check the [troubleshooting guide](./DEPLOYMENT.md#troubleshooting)
2. Review the [API documentation](./docs/api.md)
3. Open an issue on [GitHub](https://github.com/your-repo/aic-calorie-tracker/issues)
4. Contact the development team at support@yourdomain.com

---

**Built with ❤️ by the AICalorieTracker team**