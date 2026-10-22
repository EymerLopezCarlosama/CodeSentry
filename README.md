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
Node.js 20+, Python 3.11+, Docker Desktop (con WSL 2 en Windows) y [Ollama](https://ollama.com) con al menos un modelo descargado (por ejemplo `ollama pull qwen2.5-coder:3b`). Si no hay ninguno, la app ofrece instalar uno desde el formulario de proyectos.

## Arranque rápido (Windows)
1. **Primera vez:** doble clic en `setup.bat`. Crea los `.env` desde los `.env.example`, instala las dependencias (backend y frontend) y prepara el entorno virtual del analyzer.
2. Abrir **Docker Desktop** y **Ollama**.
3. Doble clic en `CodeSentry.bat`. Levanta la base de datos, el backend, el analyzer y el frontend, y abre `http://localhost:5173`.

**Detener:** cerrar las ventanas Backend, Analyzer y Frontend y, opcionalmente, `docker compose stop`.

**Datos de demo (opcional):**
```powershell
Get-Content database\seeds\demo.sql -Raw | docker exec -i codesentry-db mysql -uroot -proot codesentry
```

**Conexión a la BD:** `localhost:3307`, usuario `root`, contraseña `root`, base `codesentry`.

## Arranque manual (otros sistemas o depuración)
1. En `backend/`, `analyzer/` y `frontend/` copiar `.env.example` como `.env` (los `.env` no se suben a git).
2. `docker compose up -d` desde la raíz (la primera vez crea las tablas y los catálogos). Reiniciar desde cero (borra los datos): `docker compose down -v && docker compose up -d`.
3. `cd backend && npm install && npm run dev` (API en `http://localhost:3001/api`)
4. `cd frontend && npm install && npm run dev` (`http://localhost:5173`)
5. `cd analyzer && python -m venv .venv`, activar el entorno, `pip install -r requirements.txt` y `uvicorn app.main:app --port 8000 --reload`
6. Ollama corriendo con un modelo descargado.

## Flujo de ramas
`main` (estable) ← `feature/hu-XX-descripcion`
Cada rama entra a `main` solo por Pull Request, revisado por otro compañero. No hay rama `develop`.
Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`