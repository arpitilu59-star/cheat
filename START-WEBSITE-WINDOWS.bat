@echo off
cd /d "%~dp0site"
if not exist node_modules npm install
npm run dev
pause
