@echo off
cd /d "%~dp0"
echo 퀴즈 서버를 시작합니다...
timeout /t 2 /nobreak >nul
start "" http://localhost:3000/admin.html
node server.js
pause
