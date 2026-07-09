@echo off
setlocal
cd /d "%~dp0"

echo ================================================
echo   Zona-Z - Publicar mudancas no GitHub
echo ================================================
echo.

git add -A

git diff --cached --quiet
if %errorlevel%==0 (
    echo Nenhuma mudanca para publicar.
    echo.
    pause
    exit /b 0
)

echo Mudancas encontradas:
git status --short
echo.

set /p MSG="Mensagem do commit: "
if "%MSG%"=="" set MSG=Atualizacao do site Zona-Z

git commit -m "%MSG%"
if errorlevel 1 (
    echo.
    echo Falha ao criar o commit.
    pause
    exit /b 1
)

echo.
echo Enviando para o GitHub...
echo (se pedir usuario/senha ou autenticacao, preencha normalmente)
echo.

git push origin main

if errorlevel 1 (
    echo.
    echo Falha ao publicar. Veja a mensagem de erro acima.
) else (
    echo.
    echo Publicado com sucesso em https://github.com/LinenkerPSantos/ZonaZ
)

echo.
pause
