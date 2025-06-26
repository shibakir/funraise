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
cd funraise/server

# Or if you already have the project
cd path/to/your/project/server
```

### Choose Your Setup Method

**Option 1: Docker (Recommended)** - Everything configured automatically
```bash
make setup && make up
```

**Option 2: Local Development** - Manual MySQL setup required
```bash
npm install && cp env.example .env
# Configure .env file, then:
npm run dev
```

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup MySQL Database
Create a MySQL database and user:
```sql
CREATE DATABASE funraise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'funraise_user'@'localhost' IDENTIFIED BY 'funraise123';
GRANT ALL PRIVILEGES ON funraise.* TO 'funraise_user'@'localhost';
FLUSH PRIVILEGES;
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

## Docker Setup

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

# Discord OAuth (Optional)
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# JWT Secrets (Required)
JWT_SECRET=your_very_long_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=your_very_long_refresh_secret_minimum_32_characters

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Firebase Storage (Optional)
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
make clean         # Clean Docker resources (⚠️ destructive)
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

# Docker MySQL
make db-shell
# or
docker-compose exec db mysql -u funraise_user -p funraise
```

#### Docker Issues
```bash
# Check container status
make status

# View detailed logs
make logs-app

# Restart services
make restart

# Clean rebuild
make clean && make up
```

### Database Reset
If you need to completely reset the database:

**Local:**
```bash
npm run reset-db
npm run seed
```

**Docker:**
```bash
make down
docker volume rm server_mysql_data
make up
```

### Log Locations
- **Local**: Console output
- **Docker**: Container logs via `make logs`
- **Application logs**: Inside container at `/usr/src/app/logs`
