# CodeSentry

Plataforma de análisis de calidad de código basada en un servicio local (100 % local, sin nube).
Unicomfacauca · Ingeniería de Sistemas · Calidad de Software.

## Arquitectura
`frontend` (React + TS) → `backend` (Node.js + TS) → `analyzer` (Python/FastAPI) → Ollama (`localhost:11434`)
Base de datos: MySQL/MariaDB local (XAMPP).

## Estructura
| Carpeta | Contenido |
|---|---|
| `frontend/` | Interfaz web (dashboard, proyectos, revisión, resultados, checklist, reportes) |
| `backend/` | API REST y acceso a la base de datos |
| `analyzer/` | Microservicio de análisis: filtra .js/.ts/.py y consulta a Ollama |
| `database/` | `schema.sql`, seeds de catálogos y migraciones |
| `docs/` | Requisitos, historias de usuario, diagramas, diccionario de datos, normas |
| `storage/reportes/` | Reportes exportados (pdf/html/json), ignorados por git |

## Arranque rápido
1. Copiar `.env.example` a `.env`.
2. Importar `database/schema.sql` y `database/seeds/catalogos.sql` en MySQL.
3. `cd backend && npm install && npm run dev`
4. `cd analyzer && python -m venv .venv && pip install -r requirements.txt && uvicorn app.main:app --reload`
5. `cd frontend && npm install && npm run dev`
6. Tener Ollama corriendo con el modelo descargado.

## Flujo de ramas
`main` (estable) ← `develop` ← `feature/hu-XX-descripcion`
Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
