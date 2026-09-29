@echo off
title Foursight Contest Platform

echo ===================================================
echo Starting Foursight Next.js Server...
echo ===================================================
echo.

:: Start the Next.js development server in a new command window
start "Foursight Server" cmd /c "npm run dev"

echo Waiting for the server to initialize...
:: Wait 6 seconds to give Next.js time to compile and start
timeout /t 6 /nobreak >nul

echo Launching website in your default browser...
start http://localhost:3000

echo.
echo ===================================================
echo Foursight is now running!
echo.
echo Quick Links:
echo - Main Website: http://localhost:3000
echo - Contest Area: http://localhost:3000/contest
echo - Admin Panel:  http://localhost:3000/admin (Secret: foursight-admin-2026)
echo.
echo Keep the other terminal window ("Foursight Server") open to keep the server running.
echo To stop the server, close that window.
echo ===================================================
echo.
pause
