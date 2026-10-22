@echo off
setlocal
cd /d "%~dp0"

echo === CodeSentry ===

where docker >nul 2>nul || (echo [ERROR] Falta Docker Desktop & goto :fin)
docker info >nul 2>nul || (echo [ERROR] Docker Desktop no esta corriendo. Abrelo y vuelve a ejecutar. & goto :fin)

if not exist "backend\node_modules" (echo [ERROR] Falta instalar dependencias. Ejecuta setup.bat primero. & goto :fin)
if not exist "analyzer\.venv\Scripts\python.exe" (echo [ERROR] Falta el entorno del analyzer. Ejecuta setup.bat primero. & goto :fin)

echo [1/4] Base de datos
docker compose up -d || (echo [ERROR] No se pudo levantar la base de datos & goto :fin)

echo [2/4] Backend
start "CodeSentry - Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo [3/4] Analyzer
start "CodeSentry - Analyzer" cmd /k "cd /d %~dp0analyzer && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --reload"

echo [4/4] Frontend
start "CodeSentry - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo Esperando a que arranquen los servicios...
timeout /t 8 /nobreak >nul

curl.exe -s http://localhost:11434 >nul 2>nul || echo [AVISO] Ollama no responde. Abre la app Ollama para poder analizar codigo.

start "" http://localhost:5173

echo.
echo CodeSentry esta corriendo. Para detenerlo, cierra las 3 ventanas
echo (Backend, Analyzer, Frontend) y, si quieres, ejecuta: docker compose stop

:fin
echo.
pause
endlocal