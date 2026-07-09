@echo off
title Zona-Z - Iniciando Projeto Completo
echo ============================================
echo    ZONA-Z :: Iniciando Projeto Completo
echo ============================================
echo.
echo Abrindo Backend (Flask) e Frontend (React)...
echo.

start "Zona-Z Backend" cmd /k "%~dp0start-backend.bat"

timeout /t 3 /nobreak >nul

start "Zona-Z Frontend" cmd /k "%~dp0start-frontend.bat"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Ambos os servidores foram iniciados em janelas separadas.
pause
