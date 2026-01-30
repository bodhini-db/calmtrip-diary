@echo off
REM CalmTrip Quick Start Setup Script for Windows

echo.
echo 🧳 CalmTrip - Setup Script
echo ==============================
echo.

REM Check Node.js
echo ✓ Checking Node.js version...
node --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
echo.

REM Check environment file
if not exist .env.local (
    echo ⚠️  No .env.local file found!
    echo.
    echo Please create .env.local with the following variables:
    echo   VITE_SUPABASE_URL=your_supabase_url
    echo   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    echo   VITE_MAPBOX_TOKEN=your_mapbox_token
    echo.
    echo Template .env.example is available.
    exit /b 1
) else (
    echo ✓ .env.local file found
)

echo.
echo 🔧 Setup Instructions:
echo =======================
echo.
echo 1. Supabase Setup:
echo    - Go to https://supabase.com
echo    - Create a new project
echo    - Copy Project URL and Anon Key
echo    - Run the SQL from DATABASE_SCHEMA.md in Supabase SQL Editor
echo    - Create a "photos" bucket in Storage
echo.
echo 2. Mapbox Setup:
echo    - Go to https://mapbox.com
echo    - Create a free account
echo    - Get your public token
echo.
echo 3. Environment Variables:
echo    - Update .env.local with your credentials
echo.
echo 4. Start Development:
echo    npm run dev
echo.
echo 5. Open Browser:
echo    http://localhost:5173
echo.
echo ✨ Happy traveling with CalmTrip!
echo.
pause
