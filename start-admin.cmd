@echo off
echo Starting Hexo Admin GUI...

cd admin-gui

:: Start Backend Server
start "Hexo Admin Backend" cmd /k "npm start"

:: Start Frontend Server
start "Hexo Admin Frontend" cmd /k "npm run dev"

echo.
echo Services started in new windows.
echo Backend running on http://localhost:3001
echo Frontend running on http://localhost:5175
echo.
pause
