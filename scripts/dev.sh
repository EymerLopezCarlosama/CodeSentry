#!/bin/bash
# Levanta backend, analyzer y frontend en paralelo y los apaga a los tres con Ctrl+C.
#
# - backend:  npm run dev                     -> http://localhost:3001/api
# - analyzer: uvicorn app.main:app --reload   -> http://localhost:8000
# - frontend: npm run dev                     -> http://localhost:5173
#
# Nota para Windows: ejecutar desde Git Bash.
# Ollama y la base de datos (`docker compose up -d`) deben estar encendidos aparte; aquí solo se avisa si no responden.

cd "$(dirname "$0")/.."

# Python del entorno virtual (Windows: Scripts/python.exe; Linux y macOS: bin/python)
if [ -x analyzer/.venv/Scripts/python.exe ]; then
  PY="$PWD/analyzer/.venv/Scripts/python.exe"
elif [ -x analyzer/.venv/bin/python ]; then
  PY="$PWD/analyzer/.venv/bin/python"
else
  echo "[ERROR] Falta analyzer/.venv. Ejecuta scripts/setup.sh primero." >&2
  exit 1
fi

for d in backend frontend; do
  [ -d "$d/node_modules" ] || { echo "[ERROR] Faltan las dependencias de $d. Ejecuta scripts/setup.sh primero." >&2; exit 1; }
done
[ -f backend/.env ] || { echo "[ERROR] Falta backend/.env. Ejecuta scripts/setup.sh primero." >&2; exit 1; }

puerto_abierto() {
  (echo > "/dev/tcp/$1/$2") >/dev/null 2>&1
}

puerto_abierto localhost 3307 || echo "[AVISO] La base de datos no responde en el puerto 3307 (docker compose up -d)."
puerto_abierto localhost 11434 || echo "[AVISO] Ollama no responde en el puerto 11434: el análisis funciona, sin explicaciones de IA."

pids=()

apagar() {
  echo
  echo "Apagando backend, analyzer y frontend..."
  for pid in "${pids[@]}"; do
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  exit 0
}
trap apagar INT TERM

# Con control de trabajos (set -m) cada servicio queda en su propio grupo de procesos y se apaga completo
set -m

lanzar() {
  local nombre="$1" carpeta="$2"
  shift 2
  # El prefijo se pone con un bucle de bash: awk (mawk) acumula la entrada y no mostraría nada hasta llenar su búfer
  (cd "$carpeta" && exec "$@") > >(while IFS= read -r linea || [ -n "$linea" ]; do printf '[%s] %s\n' "$nombre" "$linea"; done) 2>&1 &
  pids+=("$!")
}

lanzar backend backend npm run dev
lanzar analyzer analyzer "$PY" -m uvicorn app.main:app --reload --port 8000
lanzar frontend frontend npm run dev

echo "CodeSentry en marcha: http://localhost:5173  (Ctrl+C para apagar todo)"
wait
