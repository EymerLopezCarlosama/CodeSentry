#!/bin/bash
# PROMPT — scripts/dev.sh
#
# Levantar backend (npm run dev), analyzer (uvicorn app.main:app --reload) y frontend (npm run dev) en paralelo, y apagar los tres con Ctrl+C (trap).
# Nota para Windows: ejecutar desde Git Bash. Ollama y la base de datos (`docker compose up -d`) deben estar encendidos aparte.
