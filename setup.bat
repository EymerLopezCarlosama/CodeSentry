@echo off
setlocal
cd /d "%~dp0"

echo === CodeSentry: configuracion inicial ===

where node >nul 2>nul || (echo [ERROR] Falta Node.js 20+ & goto :fin)
where npm >nul 2>nul || (echo [ERROR] Falta npm & goto :fin)
where python >nul 2>nul || (echo [ERROR] Falta Python 3.11+ & goto :fin)
where docker >nul 2>nul || (echo [ERROR] Falta Docker Desktop & goto :fin)

echo.
echo [1/4] Archivos .env
for %%D in (backend analyzer frontend) do (
  if not exist "%%D\.env" (
    copy "%%D\.env.example" "%%D\.env" >nul
    echo   creado %%D\.env
  ) else (
    echo   %%D\.env ya existe, se conserva
  )
)

echo.
echo [2/4] Dependencias del backend
pushd backend
call npm install || (popd & echo [ERROR] npm install del backend & goto :fin)
popd

echo.
echo [3/4] Dependencias del frontend
pushd frontend
call npm install || (popd & echo [ERROR] npm install del frontend & goto :fin)
popd

echo.
echo [4/4] Entorno virtual del analyzer
if not exist "analyzer\.venv\Scripts\python.exe" (
  python -m venv analyzer\.venv || (echo [ERROR] No se pudo crear el venv & goto :fin)
)
call analyzer\.venv\Scripts\python.exe -m pip install -r analyzer\requirements.txt || (echo [ERROR] pip install & goto :fin)

echo.
echo === Listo. Ahora ejecuta CodeSentry.bat ===
echo Recuerda instalar Ollama (ollama.com) y descargar un modelo.

:fin
echo.
pause
endlocal