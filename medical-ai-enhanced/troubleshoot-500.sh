#!/bin/bash

echo "🔍 Medical AI Chatbot - 500 Error Troubleshooting"
echo "================================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo ""
echo "1. Checking if .env file exists..."
if [ -f "backend/.env" ]; then
    print_status ".env file found"
else
    print_error ".env file missing!"
    echo "Run: cp backend/env.example backend/.env"
    echo "Then edit backend/.env with your database credentials"
    exit 1
fi

echo ""
echo "2. Checking database connection..."
if command -v psql &> /dev/null; then
    # Get database info from .env
    DB_HOST=$(grep DB_HOST backend/.env | cut -d '=' -f2)
    DB_PORT=$(grep DB_PORT backend/.env | cut -d '=' -f2)
    DB_NAME=$(grep DB_NAME backend/.env | cut -d '=' -f2)
    DB_USER=$(grep DB_USER backend/.env | cut -d '=' -f2)
    DB_PASSWORD=$(grep DB_PASSWORD backend/.env | cut -d '=' -f2)
    
    export PGPASSWORD=$DB_PASSWORD
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
        print_status "Database connection successful"
    else
        print_error "Cannot connect to database!"
        echo "Check your PostgreSQL credentials in backend/.env"
        echo "Make sure PostgreSQL is running"
        exit 1
    fi
else
    print_warning "psql not found - cannot test database connection"
fi

echo ""
echo "3. Checking if database tables exist..."
if command -v psql &> /dev/null; then
    TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    if [ "$TABLE_COUNT" -gt 0 ]; then
        print_status "Found $TABLE_COUNT tables in database"
    else
        print_error "No tables found in database!"
        echo "Run the database setup:"
        echo "  ./setup-database.sh"
        echo "  OR manually:"
        echo "  psql $DB_NAME < backend/database/schema.sql"
        exit 1
    fi
fi

echo ""
echo "4. Checking Node.js dependencies..."
if [ -d "backend/node_modules" ]; then
    print_status "Backend dependencies installed"
else
    print_error "Backend dependencies missing!"
    echo "Run: cd backend && npm install"
    exit 1
fi

if [ -d "frontend/node_modules" ]; then
    print_status "Frontend dependencies installed"
else
    print_error "Frontend dependencies missing!"
    echo "Run: cd frontend && npm install"
    exit 1
fi

echo ""
echo "5. Checking Python dependencies..."
if [ -d "backend/venv" ]; then
    print_status "Python virtual environment found"
    if [ -f "backend/venv/pyvenv.cfg" ]; then
        print_status "Python virtual environment is valid"
    else
        print_warning "Python virtual environment may be corrupted"
        echo "Recreate it: cd backend && rm -rf venv && python -m venv venv"
    fi
else
    print_warning "Python virtual environment not found"
    echo "Create it: cd backend && python -m venv venv"
    echo "Activate it: source venv/bin/activate"
    echo "Install packages: pip install pandas numpy scikit-learn matplotlib seaborn joblib"
fi

echo ""
echo "6. Checking port availability..."
if lsof -i :5001 &> /dev/null; then
    print_warning "Port 5001 is in use"
    echo "Kill the process: lsof -ti:5001 | xargs kill -9"
else
    print_status "Port 5001 is available"
fi

if lsof -i :3000 &> /dev/null; then
    print_warning "Port 3000 is in use"
    echo "Kill the process: lsof -ti:3000 | xargs kill -9"
else
    print_status "Port 3000 is available"
fi

echo ""
echo "7. Testing API endpoint..."
if curl -s http://localhost:5001/api/status &> /dev/null; then
    print_status "Backend API is responding"
else
    print_error "Backend API is not responding"
    echo "Start the backend: cd backend && npm start"
fi

echo ""
echo "🎯 Summary:"
echo "If all checks passed, try registering again."
echo "If you still get 500 errors, check the backend console for specific error messages."
echo ""
echo "Common fixes:"
echo "1. Make sure PostgreSQL is running"
echo "2. Run: ./setup-database.sh"
echo "3. Check backend/.env file has correct database credentials"
echo "4. Restart both frontend and backend servers"
