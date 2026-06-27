@echo off
echo ============================================
echo   北斗火眼·消防智查 v3.0 — Demo 启动
echo ============================================
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting server on port 8080...
node server.cjs
pause
