@echo off
title Zona-Z Backend (Flask)
echo ============================================
echo    ZONA-Z :: Backend (Flask API)
echo ============================================
echo.

cd /d "%~dp0..\backend"

if not exist "venv" (
    echo Criando ambiente virtual Python...
    python -m venv venv
    echo.
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias...
pip install -r requirements.txt --quiet
echo.

echo Iniciando servidor Flask...
echo API rodando em: http://localhost:5000
echo.
python run.py

pause
