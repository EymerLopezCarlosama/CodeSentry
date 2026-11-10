#!/bin/bash
# Instalación inicial de CodeSentry (Linux, macOS y Windows desde Git Bash). Equivale a setup.bat.
#
# 1. Copia backend/.env.example, analyzer/.env.example y frontend/.env.example a .env (si no existen).
# 2. npm install en backend y frontend.
# 3. Crea analyzer/.venv e instala analyzer/requirements.txt.
#
# La base de datos no se toca aquí: se levanta con `docker compose up -d`, que crea el esquema y los catálogos.
# Ollama tampoco: instálalo desde https://ollama.com y descarga un modelo (por ejemplo `ollama pull qwen2.5-coder`).

set -e
cd "$(dirname "$0")/.."

error() {
  echo "[ERROR] $1" >&2
  exit 1
}

echo "=== CodeSentry: configuración inicial ==="

command -v node >/dev/null 2>&1 || error "Falta Node.js 20+ (https://nodejs.org)."
command -v npm >/dev/null 2>&1 || error "Falta npm."
PY="$(command -v python3 || command -v python || true)"
[ -n "$PY" ] || error "Falta Python 3.11+ (https://www.python.org/downloads/)."
"$PY" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 11) else 1)' || error "Se necesita Python 3.11 o superior."
command -v docker >/dev/null 2>&1 || echo "[AVISO] No se encontró Docker: la base de datos no se podrá levantar (docker compose up -d)."

echo
echo "[1/4] Archivos .env"
for d in backend analyzer frontend; do
  if [ ! -f "$d/.env" ]; then
    cp "$d/.env.example" "$d/.env"
    echo "  creado $d/.env"
  else
    echo "  $d/.env ya existe, se conserva"
  fi
done

echo
echo "[2/4] Dependencias del backend"
(cd backend && npm install) || error "Falló npm install en backend."

echo
echo "[3/4] Dependencias del frontend"
(cd frontend && npm install) || error "Falló npm install en frontend."

echo
echo "[4/4] Entorno virtual del analyzer"
if [ -x analyzer/.venv/Scripts/python.exe ]; then
  PY_VENV="analyzer/.venv/Scripts/python.exe"
elif [ -x analyzer/.venv/bin/python ]; then
  PY_VENV="analyzer/.venv/bin/python"
else
  "$PY" -m venv analyzer/.venv || error "No se pudo crear analyzer/.venv."
  if [ -x analyzer/.venv/Scripts/python.exe ]; then PY_VENV="analyzer/.venv/Scripts/python.exe"; else PY_VENV="analyzer/.venv/bin/python"; fi
fi
"$PY_VENV" -m pip install -r analyzer/requirements.txt || error "Falló pip install."

echo
echo "=== Listo ==="
echo "Siguiente: docker compose up -d, abrir Ollama con un modelo descargado y ejecutar scripts/dev.sh"
