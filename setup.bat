@echo off
REM Horn System - Quick Setup Script for Windows
REM This script helps you set up the Horn system quickly

echo.
echo ========================================
echo    Horn System - Quick Setup
echo ========================================
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Docker detected
    echo.
    set /p use_docker="Do you want to use Docker? (recommended) [Y/n]: "
    
    if /i "%use_docker%"=="Y" goto docker_setup
    if /i "%use_docker%"=="" goto docker_setup
)

goto manual_setup

:docker_setup
echo.
echo Setting up with Docker...
docker compose down -v 2>nul
docker compose up --build -d

echo.
echo ========================================
echo Done! System is running:
echo   - Web App: http://localhost:8080
echo   - API: http://localhost:3005
echo.
echo Demo Login:
echo   Email: commander.north@horn.local
echo   Password: Horn12345!
echo ========================================
goto end

:manual_setup
echo.
echo Manual Setup...
echo.

echo 1. Setting up Server...
cd server

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo WARNING: Please edit server\.env with your database credentials
    pause
)

echo Installing server dependencies...
call npm install

echo Running database migrations...
call npx prisma migrate deploy
call npx prisma generate

echo.
echo 2. Setting up Client...
cd ..\client

if not exist .env (
    echo Creating .env file...
    copy .env.example .env
)

echo Installing client dependencies...
call npm install

echo.
echo ========================================
echo Setup Complete!
echo.
echo To start the system:
echo   Server: cd server ^&^& npm run dev
echo   Client: cd client ^&^& npm run dev
echo.
echo Then visit: http://localhost:5173
echo.
echo Demo Login:
echo   Email: commander.north@horn.local
echo   Password: Horn12345!
echo ========================================

:end
pause
