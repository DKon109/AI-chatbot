# Medical AI Chatbot - Setup Guide

This guide will help you set up the Medical AI Chatbot on a new computer.

## Prerequisites

Before starting, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (v12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Python** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/)

## Database Setup

### 1. Install PostgreSQL
- Download and install PostgreSQL from the official website
- Remember the password you set for the `postgres` user
- Make sure PostgreSQL is running as a service

### 2. Create Database
Open your PostgreSQL client (pgAdmin or command line) and run:

```sql
CREATE DATABASE medical_ai_enhanced;
```

### 3. Set Up Database Schema
Run the following SQL files in order:

```bash
# Navigate to the project directory
cd backend/database

# Run the main schema
psql -U postgres -d medical_ai_enhanced -f schema.sql

# Run AI agents schema
psql -U postgres -d medical_ai_enhanced -f ai_agents_schema.sql

# Run doctor AI schema
psql -U postgres -d medical_ai_enhanced -f doctor_ai_schema.sql
```

## Environment Configuration

### 1. Copy Environment File
```bash
cd backend
cp env.example .env
```

### 2. Update Environment Variables
Edit the `.env` file with your database credentials:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_ai_enhanced
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Python Dependencies

### 1. Create Virtual Environment
```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment
**On Windows:**
```bash
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Python Dependencies
```bash
pip install pandas numpy scikit-learn matplotlib seaborn joblib
```

## Node.js Dependencies

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

## Running the Application

### 1. Start Backend Server
```bash
cd backend
npm start
```

The backend will run on `http://localhost:5001`

### 2. Start Frontend Server
```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

## Verification

1. Open your browser and go to `http://localhost:3000`
2. You should see the Medical AI Chatbot interface
3. Try registering a new account
4. Test the symptom analysis feature

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your database credentials in `.env`
- Verify the database `medical_ai_enhanced` exists

### Port Already in Use
- Kill processes using ports 3000 or 5001:
```bash
# Kill port 3000
lsof -ti:3000 | xargs kill -9

# Kill port 5001
lsof -ti:5001 | xargs kill -9
```

### Python Issues
- Make sure you're in the virtual environment
- Check Python version: `python --version`
- Reinstall dependencies if needed

## Production Deployment

For production deployment:

1. Change `NODE_ENV=production` in `.env`
2. Use a strong, unique `JWT_SECRET`
3. Set up proper database credentials
4. Configure your web server (nginx, Apache)
5. Use PM2 for process management

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all prerequisites are installed
3. Ensure all environment variables are set correctly
4. Check that the database is running and accessible
