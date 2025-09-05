@echo off
REM SWMS Setup Script for Windows
REM This script sets up the Student Wellness Management System

echo ============================================
echo   Student Wellness Management System
echo          Setup Script (Windows)
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js v16+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [INFO] Node.js found: 
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo [INFO] npm found: 
npm --version

echo.
echo [STEP] Setting up backend...
cd backend
echo [INFO] Installing backend dependencies...
npm install
if not exist .env (
    echo [INFO] Creating environment file...
    copy .env.example .env
    echo [WARNING] Please update the .env file with your database credentials
) else (
    echo [INFO] Environment file already exists
)
cd ..

echo.
echo [STEP] Setting up frontend...
cd frontend
echo [INFO] Installing frontend dependencies...
npm install
cd ..

echo.
echo [STEP] Creating startup scripts...

REM Create backend startup script
echo @echo off > start-backend.bat
echo echo Starting SWMS Backend... >> start-backend.bat
echo cd backend >> start-backend.bat
echo npm run dev >> start-backend.bat

REM Create frontend startup script
echo @echo off > start-frontend.bat
echo echo Starting SWMS Frontend... >> start-frontend.bat
echo cd frontend >> start-frontend.bat
echo npm start >> start-frontend.bat

REM Create combined startup script
echo @echo off > start-all.bat
echo echo Starting SWMS Application... >> start-all.bat
echo echo Backend will start on http://localhost:5000 >> start-all.bat
echo echo Frontend will start on http://localhost:3000 >> start-all.bat
echo echo. >> start-all.bat
echo echo Starting backend... >> start-all.bat
echo start "SWMS Backend" cmd /k "cd backend && npm run dev" >> start-all.bat
echo timeout /t 3 /nobreak ^>nul >> start-all.bat
echo echo Starting frontend... >> start-all.bat
echo start "SWMS Frontend" cmd /k "cd frontend && npm start" >> start-all.bat
echo echo. >> start-all.bat
echo echo SWMS is starting up... >> start-all.bat
echo echo Check the opened terminal windows for each service >> start-all.bat
echo pause >> start-all.bat

echo [INFO] Startup scripts created:
echo   - start-backend.bat (Backend only)
echo   - start-frontend.bat (Frontend only)
echo   - start-all.bat (Both services)

echo.
echo ============================================
echo   SWMS Setup Successful!
echo ============================================
echo.
echo Next steps:
echo 1. Install and setup PostgreSQL if not already done
echo 2. Create database 'swms_db'
echo 3. Run the database schema: 
echo    psql -U postgres -d swms_db -f backend\database\schema.sql
echo 4. Insert sample data:
echo    psql -U postgres -d swms_db -f backend\database\seeds.sql
echo 5. Update backend\.env with your database credentials
echo 6. Start the application: start-all.bat
echo.
echo Access the application:
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:5000
echo.
echo Default admin credentials:
echo   Username: admin_swms
echo   Password: swmsewu2025
echo.
echo See README.md for detailed setup instructions.
echo.
pause
