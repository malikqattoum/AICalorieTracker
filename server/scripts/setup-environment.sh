#!/bin/bash

# AICalorieTracker Environment Setup Script
# This script helps set up the development environment for the AICalorieTracker application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Node.js
install_nodejs() {
    print_status "Installing Node.js..."
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION is already installed"
        return 0
    fi
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION installed successfully"
    else
        print_error "Failed to install Node.js"
        return 1
    fi
}

# Function to install PostgreSQL
install_postgresql() {
    print_status "Installing PostgreSQL..."
    
    if command_exists psql; then
        PG_VERSION=$(psql --version)
        print_success "PostgreSQL $PG_VERSION is already installed"
        return 0
    fi
    
    # Install PostgreSQL
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    if command_exists psql; then
        PG_VERSION=$(psql --version)
        print_success "PostgreSQL $PG_VERSION installed successfully"
    else
        print_error "Failed to install PostgreSQL"
        return 1
    fi
}

# Function to install Redis
install_redis() {
    print_status "Installing Redis..."
    
    if command_exists redis-cli; then
        REDIS_VERSION=$(redis-cli --version)
        print_success "Redis $REDIS_VERSION is already installed"
        return 0
    fi
    
    # Install Redis
    sudo apt-get update
    sudo apt-get install -y redis-server
    
    # Start Redis service
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    
    if command_exists redis-cli; then
        REDIS_VERSION=$(redis-cli --version)
        print_success "Redis $REDIS_VERSION installed successfully"
    else
        print_error "Failed to install Redis"
        return 1
    fi
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker $DOCKER_VERSION is already installed"
        return 0
    fi
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up the stable repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker Engine
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker $DOCKER_VERSION installed successfully"
        print_warning "Please log out and log back in to use Docker without sudo"
    else
        print_error "Failed to install Docker"
        return 1
    fi
}

# Function to install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose $COMPOSE_VERSION is already installed"
        return 0
    fi
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose $COMPOSE_VERSION installed successfully"
    else
        print_error "Failed to install Docker Compose"
        return 1
    fi
}

# Function to create .env file
create_env_file() {
    print_status "Creating .env file..."
    
    if [ -f ".env" ]; then
        print_warning ".env file already exists. Backing up to .env.backup"
        cp .env .env.backup
    fi
    
    cat > .env << EOF
# Application Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/aic_calorie_tracker
DB_SSL_REJECT_UNAUTHORIZED=false
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Service Configuration
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_API_KEY=your-google-api-key-here

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your-email@gmail.com
EMAIL_SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# File Upload Configuration
FILE_MAX_SIZE=5242880
FILE_STORAGE_PROVIDER=local
FILE_LOCAL_PATH=./uploads

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:3000

# Analytics Configuration
ANALYTICS_ENABLED=false
ANALYTICS_MIXPANEL_TOKEN=

# Third-party Services
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Development Settings
DEBUG=app:*,db:*
LOG_LEVEL=debug
MOCK_DATA=true
MOCK_SERVICES=true
EOF

    print_success ".env file created successfully"
    print_warning "Please edit the .env file with your actual configuration values"
}

# Function to create database
create_database() {
    print_status "Creating database..."
    
    # Check if database exists
    if sudo -u postgres psql -d aic_calorie_tracker -c "\dt" >/dev/null 2>&1; then
        print_success "Database already exists"
        return 0
    fi
    
    # Create database
    sudo -u postgres createdb aic_calorie_tracker
    
    if [ $? -eq 0 ]; then
        print_success "Database created successfully"
    else
        print_error "Failed to create database"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        if [ $? -eq 0 ]; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            return 1
        fi
    else
        print_success "Dependencies already installed"
    fi
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if [ -f "package.json" ] && npm run db:migrate; then
        print_success "Database migrations completed successfully"
    else
        print_error "Failed to run database migrations"
        return 1
    fi
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    # Create logs directory
    mkdir -p logs
    
    # Create uploads directory
    mkdir -p uploads
    
    # Create data directory
    mkdir -p data
    
    # Create backups directory
    mkdir -p backups
    
    print_success "Directories created successfully"
}

# Function to set up development environment
setup_development() {
    print_status "Setting up development environment..."
    
    # Create directories
    create_directories
    
    # Create .env file
    create_env_file
    
    # Install dependencies
    install_dependencies
    
    # Run database migrations
    run_migrations
    
    print_success "Development environment setup completed"
}

# Function to set up production environment
setup_production() {
    print_status "Setting up production environment..."
    
    # Create directories
    create_directories
    
    # Create .env file
    create_env_file
    
    # Install dependencies
    install_dependencies
    
    # Run database migrations
    run_migrations
    
    print_success "Production environment setup completed"
}

# Function to show help
show_help() {
    echo "AICalorieTracker Environment Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -i, --install-deps      Install system dependencies (Node.js, PostgreSQL, Redis, Docker)"
    echo "  -d, --dev-setup         Set up development environment"
    echo "  -p, --prod-setup        Set up production environment"
    echo "  -n, --nodejs            Install Node.js only"
    echo "  -b, --database          Install PostgreSQL only"
    echo "  -r, --redis             Install Redis only"
    echo "  -c, --docker            Install Docker only"
    echo "  -e, --env               Create .env file only"
    echo "  -m, --migrate           Run database migrations only"
    echo "  --check                 Check system requirements"
    echo ""
    echo "Examples:"
    echo "  $0 -i                    # Install all system dependencies"
    echo "  $0 -d                    # Set up development environment"
    echo "  $0 -p                    # Set up production environment"
    echo "  $0 -n -b -r              # Install Node.js, PostgreSQL, and Redis"
    echo "  $0 --check               # Check system requirements"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "OS: Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "OS: macOS"
    else
        print_error "Unsupported OS: $OSTYPE"
        return 1
    fi
    
    # Check architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]]; then
        print_success "Architecture: 64-bit"
    else
        print_warning "Architecture: $ARCH (64-bit recommended)"
    fi
    
    # Check memory
    MEMORY=$(free -m | awk '/Mem:/ {print $2}')
    if [ "$MEMORY" -ge 2048 ]; then
        print_success "Memory: ${MEMORY}MB (sufficient)"
    else
        print_warning "Memory: ${MEMORY}MB (minimum recommended: 2048MB)"
    fi
    
    # Check disk space
    DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    print_success "Available disk space: $DISK_SPACE"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_success "Node.js: $NODE_VERSION"
    else
        print_warning "Node.js: Not installed"
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm: $NPM_VERSION"
    else
        print_warning "npm: Not installed"
    fi
    
    # Check PostgreSQL
    if command_exists psql; then
        PG_VERSION=$(psql --version)
        print_success "PostgreSQL: $PG_VERSION"
    else
        print_warning "PostgreSQL: Not installed"
    fi
    
    # Check Redis
    if command_exists redis-cli; then
        REDIS_VERSION=$(redis-cli --version)
        print_success "Redis: $REDIS_VERSION"
    else
        print_warning "Redis: Not installed"
    fi
    
    # Check Docker
    if command_exists docker; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker: $DOCKER_VERSION"
    else
        print_warning "Docker: Not installed"
    fi
    
    # Check Docker Compose
    if command_exists docker-compose; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose: $COMPOSE_VERSION"
    else
        print_warning "Docker Compose: Not installed"
    fi
    
    print_success "System requirements check completed"
}

# Main script execution
main() {
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -i|--install-deps)
                install_nodejs
                install_postgresql
                install_redis
                install_docker
                install_docker_compose
                shift
                ;;
            -d|--dev-setup)
                setup_development
                shift
                ;;
            -p|--prod-setup)
                setup_production
                shift
                ;;
            -n|--nodejs)
                install_nodejs
                shift
                ;;
            -b|--database)
                install_postgresql
                shift
                ;;
            -r|--redis)
                install_redis
                shift
                ;;
            -c|--docker)
                install_docker
                install_docker_compose
                shift
                ;;
            -e|--env)
                create_env_file
                shift
                ;;
            -m|--migrate)
                run_migrations
                shift
                ;;
            --check)
                check_requirements
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # If no arguments provided, show help
    if [ $# -eq 0 ]; then
        show_help
    fi
}

# Run main function
main "$@"