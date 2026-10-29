@echo off
setlocal
cd /d "%~dp0"
title CodeSentry - Centro de arranque

where node >nul 2>nul || (echo [ERROR] Falta Node.js 20+ & goto :fin)
if not exist "backend\node_modules" (echo [ERROR] Falta instalar dependencias. Ejecuta setup.bat primero. & goto :fin)
if not exist "analyzer\.venv\Scripts\python.exe" (echo [ERROR] Falta el entorno del analyzer. Ejecuta setup.bat primero. & goto :fin)

echo Abriendo el Centro de arranque de CodeSentry...
echo Para cerrar todo usa el boton "Apagar todo" de la pagina.
echo.
node launcher\server.js
goto :eof

:fin
echo.
pause
endlocal