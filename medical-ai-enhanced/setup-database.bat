@echo off
REM Medical AI Chatbot Database Setup Script for Windows
REM This script sets up the PostgreSQL database for the Medical AI Chatbot

echo 🏥 Medical AI Chatbot Database Setup
echo ====================================

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not installed. Please install PostgreSQL first.
    echo Download from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

echo ✅ PostgreSQL found

REM Get database credentials
echo.
echo Please enter your PostgreSQL credentials:
set /p DB_HOST="Database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Database port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_USER="PostgreSQL username (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="PostgreSQL password: "

set /p DB_NAME="Database name (default: medical_ai_enhanced): "
if "%DB_NAME%"=="" set DB_NAME=medical_ai_enhanced

REM Test connection
echo.
echo Testing database connection...
set PGPASSWORD=%DB_PASSWORD%
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Cannot connect to PostgreSQL. Please check your credentials.
    pause
    exit /b 1
)

echo ✅ Database connection successful

REM Create database
echo.
echo Creating database '%DB_NAME%'...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "CREATE DATABASE %DB_NAME%;" >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Database '%DB_NAME%' created successfully
) else (
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d postgres -c "SELECT 1 FROM pg_database WHERE datname='%DB_NAME%';" | findstr "1" >nul
    if %errorlevel% equ 0 (
        echo ⚠️  Database '%DB_NAME%' already exists
    ) else (
        echo ❌ Failed to create database '%DB_NAME%'
        pause
        exit /b 1
    )
)

REM Run schema files
echo.
echo Setting up database schema...

if exist "backend\database\schema.sql" (
    echo Running schema.sql...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "backend\database\schema.sql" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Schema schema.sql applied successfully
    ) else (
        echo ⚠️  Schema schema.sql had some issues (may already be applied)
    )
) else (
    echo ⚠️  Schema file backend\database\schema.sql not found, skipping...
)

if exist "backend\database\ai_agents_schema.sql" (
    echo Running ai_agents_schema.sql...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "backend\database\ai_agents_schema.sql" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Schema ai_agents_schema.sql applied successfully
    ) else (
        echo ⚠️  Schema ai_agents_schema.sql had some issues (may already be applied)
    )
) else (
    echo ⚠️  Schema file backend\database\ai_agents_schema.sql not found, skipping...
)

if exist "backend\database\doctor_ai_schema.sql" (
    echo Running doctor_ai_schema.sql...
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "backend\database\doctor_ai_schema.sql" >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ Schema doctor_ai_schema.sql applied successfully
    ) else (
        echo ⚠️  Schema doctor_ai_schema.sql had some issues (may already be applied)
    )
) else (
    echo ⚠️  Schema file backend\database\doctor_ai_schema.sql not found, skipping...
)

REM Create .env file
echo.
echo Creating .env file...
set TIMESTAMP=%RANDOM%
echo # Server Configuration > backend\.env
echo PORT=5001 >> backend\.env
echo NODE_ENV=development >> backend\.env
echo. >> backend\.env
echo # Database Configuration >> backend\.env
echo DB_HOST=%DB_HOST% >> backend\.env
echo DB_PORT=%DB_PORT% >> backend\.env
echo DB_NAME=%DB_NAME% >> backend\.env
echo DB_USER=%DB_USER% >> backend\.env
echo DB_PASSWORD=%DB_PASSWORD% >> backend\.env
echo. >> backend\.env
echo # JWT Configuration >> backend\.env
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-%TIMESTAMP% >> backend\.env
echo JWT_EXPIRES_IN=7d >> backend\.env
echo. >> backend\.env
echo # Frontend Configuration >> backend\.env
echo FRONTEND_URL=http://localhost:3000 >> backend\.env
echo. >> backend\.env
echo # Security Configuration >> backend\.env
echo BCRYPT_ROUNDS=12 >> backend\.env
echo RATE_LIMIT_WINDOW_MS=900000 >> backend\.env
echo RATE_LIMIT_MAX_REQUESTS=100 >> backend\.env

echo ✅ .env file created with your database credentials

REM Test final connection
echo.
echo Testing final database connection...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" >nul 2>&1
if %errorlevel% equ 0 (
    for /f %%i in ('psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2^>nul') do set TABLE_COUNT=%%i
    echo ✅ Database setup complete! Found %TABLE_COUNT% tables.
) else (
    echo ❌ Database connection test failed
    pause
    exit /b 1
)

echo.
echo 🎉 Database setup completed successfully!
echo.
echo Next steps:
echo 1. Install Node.js dependencies:
echo    cd backend ^&^& npm install
echo    cd frontend ^&^& npm install
echo.
echo 2. Install Python dependencies:
echo    cd backend ^&^& python -m venv venv
echo    venv\Scripts\activate
echo    pip install pandas numpy scikit-learn matplotlib seaborn joblib
echo.
echo 3. Start the application:
echo    Backend: cd backend ^&^& npm start
echo    Frontend: cd frontend ^&^& npm start
echo.
echo The application will be available at http://localhost:3000
pause
