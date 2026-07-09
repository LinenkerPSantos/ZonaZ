@echo off
title Zona-Z Frontend (React + Vite)
echo ============================================
echo    ZONA-Z :: Frontend (React + Vite)
echo ============================================
echo.

cd /d "%~dp0..\frontend"

if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    echo.
    npm install
    echo.
)

echo Iniciando servidor de desenvolvimento...
echo Acesse: http://localhost:3000
echo.
npm run dev

pause
