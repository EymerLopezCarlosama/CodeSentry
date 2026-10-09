#!/bin/bash
# PROMPT — scripts/setup.sh
#
# Instalar todo de una vez: copiar backend/.env.example, analyzer/.env.example y frontend/.env.example a .env en cada carpeta si no existen; `npm install` en backend y frontend; crear analyzer/.venv e instalar requirements.txt.
# Nota para Windows: ejecutar desde Git Bash. La BD se levanta con `docker compose up -d` (crea el esquema y los catálogos automáticamente).
