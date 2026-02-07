@echo off
title Big Data D-Day App Serer
echo D-Day 앱을 실행합니다...
echo 이 창을 닫으면 앱이 종료됩니다.

:: 프로젝트 폴더로 이동
cd /d "%~dp0"

:: 브라우저 자동 실행 (잠시 대기 후)
timeout /t 3 >nul
start http://localhost:5173

:: 개발 서버 실행
npm run dev

pause
