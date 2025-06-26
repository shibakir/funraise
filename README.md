# FunRaise Server - Installation & Setup Guide

A comprehensive guide for cloning, installing, and running the FunRaise GraphQL server both locally and with Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Environment Configuration](#environment-configuration)
- [Available Commands](#available-commands)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### For Local Development
- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MySQL** (v8.0 or higher)

### For Docker Setup
- **Docker** (v20.0.0 or higher)
- **Docker Compose** (v2.0.0 or higher)

## Quick Start

### Clone the Repository
```bash
# Clone the repository
git clone <repository-url>
cd funraise-server

# Or if you already have the project
cd path/to/your/project/funraise-server
```

### ⚠️ Important: Always Run from `/funraise-server` Directory
**Critical:** All Docker and npm commands for server must be run from the `/funraise-server` directory, not from the project root!

```bash
# Correct - from server directory
cd funraise-server
docker-compose up -d

# Wrong - from project root
cd funraise
docker-compose up -d  # Otherwise fail!
```

### Choose Your Setup Method

**Option 1: Docker (Recommended)** - Database created automatically
```bash
# Make sure you're in /server directory
cd funraise-server
make setup && make up
```

**Option 2: Local Development** - Manual database creation required
```bash
# Make sure you're in /server directory  
cd funraise-server
npm install && cp env.example .env
# Create MySQL database manually, configure .env file, then:
npm run dev
```

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MySQL Database
**Note:** This step is only required for local development. If using Docker, the database is created automatically.

⚠️ **Important:** The application only creates TABLES, not the database itself. In this case, TABLES are created during: 
```bash
npm run dev
```

Create a MySQL database and user manually:
```sql
# Connect to MySQL as root
mysql -u root -p

# Create database and user
CREATE DATABASE funraise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'funraise_user'@'localhost' IDENTIFIED BY 'funraise123';
GRANT ALL PRIVILEGES ON funraise.* TO 'funraise_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment
```bash
# Copy environment template
cp env.example .env

# Edit .env file with your configurations
nano .env  # or your preferred editor
```

### 4. Run Database Migrations & Seeders
The application automatically handles database setup on startup:
- Creates all necessary tables
- Clears existing data
- Seeds achievements and test data

### 5. Start Development Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will be available at `http://localhost:3000`

### 6. Verify Installation
```bash
# Check server is running
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"...","service":"funraise-api"}
```

## Docker Setup

**Why Docker is recommended:** Docker automatically handles MySQL database creation, user setup, and all dependencies without manual database setup required!

### 1. Initial Setup
```bash
# Create environment file from template
make setup

# This creates .env from env.example
# Edit the .env file with your configurations
```

### 2. Configure Environment Variables
Edit the `.env` file with your specific values:
```bash
nano .env
```

### 3. Start Services
```bash
# Start all services (MySQL + App)
make up

# Or with auto-rebuild
make dev

# Check status
make status
```

### 4. Verify Installation
```bash
# Check health endpoint
make health
# or
curl http://localhost:3000/health

# Expected response:
# {"status":"OK","timestamp":"...","service":"funraise-api"}

# Check container status (both should be healthy)
make status
# or  
docker-compose ps

# View logs
make logs

# View app-specific logs  
make logs-app
```

## Environment Configuration

### Required Environment Variables

Create a `.env` file based on `env.example`:

```env
# Application Settings
NODE_ENV=development
FUNRAISE_APP_URL=http://localhost:3000
FUNRAISE_APP_PORT=3000

# Database Configuration
DB_NAME=funraise
DB_USER=funraise_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost  # Use 'db' for Docker

# Discord OAuth
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# JWT Secrets
JWT_SECRET=your_very_long_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_very_long_refresh_secret_minimum_32_characters

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Firebase Storage
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Security Notes
- Generate strong JWT secrets (minimum 32 characters)
- Use secure database passwords
- Never commit `.env` files to version control
- Restrict database port access in production

## Available Commands

### NPM Scripts
```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start           # Start production server

# Database
npm run reset-db    # Reset database
npm run seed        # Run all seeders

# Testing
npm test           # Run test suite
npm run test:watch # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Documentation
npm run docs       # Generate and serve GraphQL docs
```

### Docker Commands (via Makefile)
```bash
make help          # Show all available commands
make setup         # Initial setup (.env creation)
make up            # Start all services
make down          # Stop all services
make restart       # Restart services
make logs          # View all logs
make logs-app      # View application logs
make logs-db       # View database logs
make shell         # Access app container
make db-shell      # Access MySQL console
make status        # Show container status
make health        # Check application health
make clean         # Clean Docker resources
```

### Direct Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Access containers
docker-compose exec app sh
docker-compose exec db mysql -u funraise_user -p funraise

# Rebuild images
docker-compose up --build
```

## API Documentation

### GraphQL Playground
Once the server is running, access the GraphQL playground at:
```
http://localhost:3000/graphql
```

### Generate Documentation
```bash
# Generate and serve GraphQL documentation
npm run docs

# Documentation will be available at http://localhost:8080
```

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Database
Tests use a separate test database configuration. Ensure your test environment is properly configured.

## Troubleshooting

### Critical Setup Issues

#### ⚠️ Wrong Directory Error
**Problem:** Commands fail when run from project root instead of `/funraise-server` directory.

**Solution:**
```bash
# Always navigate to server directory first
cd funraise-server

# Then run Docker/npm commands
docker-compose up -d
# or
make up
```

#### ⚠️ MySQL Docker Environment Error
**Problem:** 
```
MYSQL_USER="root", MYSQL_USER and MYSQL_PASSWORD are for configuring a regular user and cannot be used for the root user
```

**Solution:** Check your `.env` file has the correct format:
```bash
# In server/.env file - correct format:
DB_USER=funraise_user           # Not root
DB_PASSWORD=funraise123         # Regular user password  
MYSQL_ROOT_PASSWORD=funraise_root_123 # Root password
```

**If still failing:**
```bash
cd funraise-server
docker-compose down
docker volume rm funraise_mysql_data server_mysql_data
docker-compose up --build --force-recreate -d
```

#### ⚠️ File Case Sensitivity Error (Linux/Docker)
**Problem:** 
```
Cannot find module './middleware/AuthMiddleware'
```

**Root Cause:** In Linux/Docker, file names are case-sensitive. The actual file is `authMiddleware.js` but code imports `AuthMiddleware`.

**Already Fixed:** This has been resolved in the codebase, but if you encounter similar issues:
- Check exact file names: `ls -la middleware/`
- Ensure imports match exact case: `authMiddleware.js` not `AuthMiddleware.js`

### Common Issues

#### Port Already in Use
```bash
# Check what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Local MySQL
mysql -u funraise_user -p funraise

# Docker MySQL - connect to container
cd funraise-server
make db-shell
# or
docker-compose exec db mysql -u funraise_user -p funraise
```

#### Docker Issues
```bash
# ⚠️ Always run from /server directory first!
cd funraise-server

# Check container status
make status
# or
docker-compose ps

# View detailed logs
make logs-app
# or  
docker-compose logs -f app

# Restart services
make restart
# or
docker-compose restart

# Clean rebuild (nuclear option)
make clean && make up
# or
docker-compose down
docker volume rm funraise_mysql_data
docker-compose up --build --force-recreate -d
```

#### Container Keeps Restarting
```bash
cd funraise-server

# Check what's wrong
docker-compose logs app

# Common causes:
# 1. Wrong directory - make sure you're in /server
# 2. Missing .env file - run: cp env.example .env
# 3. Database not ready - wait for mysql to be healthy
# 4. Import errors - check logs for module not found errors
```

### Database Reset
If you need to completely reset the database:

**Local:**
```bash
cd funraise-server
npm run reset-db
npm run seed
```

**Docker:**
```bash
cd funraise-server
make down
docker volume rm server_mysql_data funraise_mysql_data
make up
```

### Log Locations
- **Local**: Console output
- **Docker**: Container logs via `cd funraise-server && make logs`
- **Application logs**: Inside container at `/usr/src/app/logs`

### Quick Diagnosis Commands
```bash
# Check you're in the right directory
pwd  # Should end with /server

# Check .env exists
ls -la .env

# Check Docker containers
docker-compose ps

# Check MySQL is healthy
docker-compose exec db mysqladmin ping -h localhost

# Test app health
curl http://localhost:3000/health
```

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Healthy containers:**
   ```bash
   cd funraise-server && docker-compose ps
   # Both services should show "healthy" status
   ```

2. **Working health check:**
   ```bash
   curl http://localhost:3000/health
   # Returns: {"status":"OK","timestamp":"...","service":"funraise-api"}
   ```

3. **Server logs show:**
   ```
   Database synchronized successfully
   Database cleared  
   Achievements seeded
   Test data seeded
   WebSocket server configured
   Server started at http://localhost:3000/graphql
   ```

4. **GraphQL Playground accessible:**
   - Open: http://localhost:3000/graphql
   - You should see the GraphQL interface

**Next Steps:**
- Access GraphQL Playground at http://localhost:3000/graphql
- Use the API for your mobile application
- Database is ready with test data and achievements