# CodeSentry

Plataforma de análisis de calidad de código basada en un servicio local (100 % local, sin nube).
Unicomfacauca · Ingeniería de Sistemas · Calidad de Software.

## Arquitectura
`frontend` (React + TS) → `backend` (Node.js + TS) → `analyzer` (Python/FastAPI) → Ollama (`localhost:11434`)
Base de datos: MySQL 8 en contenedor Docker local (`docker-compose.yml`, puerto 3307).

## Estructura
| Carpeta | Contenido |
|---|---|
| `frontend/` | Interfaz web (dashboard, proyectos, revisión, resultados, checklist, reportes) |
| `backend/` | API REST y acceso a la base de datos |
| `analyzer/` | Microservicio de análisis: filtra .js/.ts/.py y consulta a Ollama |
| `database/` | `schema.sql` (tablas), `seeds/catalogos.sql` (estados y lenguajes) y migraciones |
| `docs/` | Requisitos, historias de usuario, diagramas, diccionario de datos, normas |
| `storage/reportes/` | Reportes exportados (pdf/html/json), ignorados por git |

## Requisitos
Node.js 20+, Python 3.11+, Docker Desktop (con WSL 2 en Windows) y Ollama con el modelo descargado.

## Arranque rápido
1. **Variables de entorno:** en `backend/`, `analyzer/` y `frontend/` copiar `.env.example` como `.env` (cada servicio lee el suyo; los `.env` no se suben a git).
2. **Base de datos:** `docker compose up -d` desde la raíz. La primera vez crea las tablas (`schema.sql`) y los catálogos (`seeds/catalogos.sql`). Verificar:
   `docker exec -it codesentry-db mysql -uroot -proot -e "SELECT * FROM codesentry.Estado;"`
   - Reiniciar la base desde cero (borra los datos): `docker compose down -v && docker compose up -d`
3. `cd backend && npm install && npm run dev` (API en `http://localhost:3001/api`)
4. `cd frontend && npm install && npm run dev`
5. `cd analyzer && python -m venv .venv && pip install -r requirements.txt && uvicorn app.main:app --reload` (solo se necesita desde HU-06)
6. Tener Ollama corriendo con el modelo descargado (solo desde HU-06).

**Conexión a la BD:** `localhost:3307`, usuario `root`, contraseña `root`, base `codesentry`.

## Flujo de ramas
`main` (estable) ← `feature/hu-XX-descripcion`
Cada HU se trabaja en su propia rama y entra a `main` mediante Pull Request (nadie sube directo a `main`).
Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`