#!/bin/bash

echo "🔍 Medical AI Chatbot - Database Verification"
echo "============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo ""
echo "This script will help you verify your database setup in pgAdmin 4"
echo ""

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    print_error ".env file not found!"
    echo "Please run: ./setup-database.sh first"
    exit 1
fi

# Get database info from .env
DB_HOST=$(grep DB_HOST backend/.env | cut -d '=' -f2)
DB_PORT=$(grep DB_PORT backend/.env | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME backend/.env | cut -d '=' -f2)
DB_USER=$(grep DB_USER backend/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep DB_PASSWORD backend/.env | cut -d '=' -f2)

echo "📊 Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test connection
export PGPASSWORD=$DB_PASSWORD
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" &> /dev/null; then
    print_error "Cannot connect to database!"
    echo "Please check:"
    echo "1. PostgreSQL is running"
    echo "2. Database credentials in backend/.env are correct"
    echo "3. Database '$DB_NAME' exists"
    exit 1
fi

print_status "Database connection successful"

echo ""
echo "📋 Checking database tables..."

# Get list of tables
TABLES=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null | tr -d ' ')

if [ -z "$TABLES" ]; then
    print_error "No tables found in database!"
    echo "Please run: ./setup-database.sh"
    exit 1
fi

echo ""
echo "🗄️  Found tables in '$DB_NAME' database:"
echo "=========================================="

# Expected tables
EXPECTED_TABLES=(
    "users"
    "patients"
    "chat_messages"
    "diet_recommendations"
    "ai_agent_sessions"
    "feedback_data"
    "user_progress"
    "badges"
    "prescriptions"
    "pharmacy_connections"
    "hospital_searches"
    "symptom_analysis_sessions"
    "structured_symptom_data"
)

# Check each table
MISSING_TABLES=()
for table in "${EXPECTED_TABLES[@]}"; do
    if echo "$TABLES" | grep -q "^$table$"; then
        print_status "$table"
    else
        print_error "$table (MISSING)"
        MISSING_TABLES+=("$table")
    fi
done

echo ""
echo "📊 Database Statistics:"
echo "======================"

# Count total tables
TOTAL_TABLES=$(echo "$TABLES" | wc -l | tr -d ' ')
echo "Total tables: $TOTAL_TABLES"

# Count users
USER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
echo "Users registered: $USER_COUNT"

# Count patients
PATIENT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM patients;" 2>/dev/null | tr -d ' ')
echo "Patients in system: $PATIENT_COUNT"

# Count chat messages
CHAT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM chat_messages;" 2>/dev/null | tr -d ' ')
echo "Chat messages: $CHAT_COUNT"

echo ""
echo "🎯 pgAdmin 4 Instructions:"
echo "========================="
echo "1. Open pgAdmin 4"
echo "2. In the left panel, expand 'Servers'"
echo "3. Find your PostgreSQL server (may show a lock icon)"
echo "4. Right-click and enter password if needed"
echo "5. Expand the server → 'Databases'"
echo "6. Look for: '$DB_NAME'"
echo "7. Click on '$DB_NAME' → 'Schemas' → 'public' → 'Tables'"
echo "8. You should see all the tables listed above"

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo ""
    print_warning "Missing tables detected!"
    echo "Run the database setup again:"
    echo "  ./setup-database.sh"
    echo ""
    echo "Or manually run the SQL files:"
    echo "  psql $DB_NAME < backend/database/schema.sql"
    echo "  psql $DB_NAME < backend/database/ai_agents_schema.sql"
    echo "  psql $DB_NAME < backend/database/doctor_ai_schema.sql"
else
    echo ""
    print_status "All required tables are present!"
    echo "Your database is properly set up for the Medical AI Chatbot."
fi

echo ""
echo "🔧 Troubleshooting:"
echo "=================="
echo "If you can't find the database in pgAdmin 4:"
echo "1. Make sure you're connected to the right PostgreSQL server"
echo "2. Check the server name matches your setup"
echo "3. Verify the database name is exactly: '$DB_NAME'"
echo "4. Try refreshing the server (right-click → Refresh)"
echo "5. Check if the database exists: psql -l | grep $DB_NAME"
