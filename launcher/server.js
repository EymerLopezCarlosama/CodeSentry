// Centro de arranque de CodeSentry. Sin dependencias externas, solo Node 20+.
const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");
const { spawn, exec } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const PUERTO = 4000;
const URL_LAUNCHER = `http://localhost:${PUERTO}`;
const ES_WIN = process.platform === "win32";
const PYTHON = ES_WIN
  ? path.join(RAIZ, "analyzer", ".venv", "Scripts", "python.exe")
  : path.join(RAIZ, "analyzer", ".venv", "bin", "python");

const SERVICIOS = {
  db:       { nombre: "Base de datos",     obligatorio: true },
  backend:  { nombre: "Servidor (API)",    obligatorio: true,  url: "http://localhost:3001/api/salud" },
  analyzer: { nombre: "Motor de análisis", obligatorio: true,  url: "http://localhost:8000/salud" },
  frontend: { nombre: "Interfaz",          obligatorio: true,  url: "http://localhost:5173" },
  ollama:   { nombre: "IA local (Ollama)", obligatorio: false, url: "http://localhost:11434" },
};

const PROCESOS = {
  backend:  { cwd: path.join(RAIZ, "backend"),  shell: "npm run dev", requiere: path.join(RAIZ, "backend", "node_modules") },
  frontend: { cwd: path.join(RAIZ, "frontend"), shell: "npm run dev", requiere: path.join(RAIZ, "frontend", "node_modules") },
  analyzer: { cwd: path.join(RAIZ, "analyzer"), archivo: PYTHON, args: ["-m", "uvicorn", "app.main:app", "--port", "8000"], requiere: PYTHON },
  ollama:   { cwd: RAIZ, archivo: () => ollamaExe(), args: ["serve"] },
};

const hijos = new Map();      // id -> proceso lanzado
const arrancando = new Map(); // id -> timestamp inicio
const fallos = new Map();     // id -> mensaje de error
const registros = new Map();  // id -> logs recientes

function anotar(id, texto) {
  const lineas = registros.get(id) ?? [];
  const limpio = String(texto).replace(/\x1b\[[0-9;]*m/g, "");
  for (const l of limpio.split(/\r?\n/)) if (l.trim()) lineas.push(l);
  registros.set(id, lineas.slice(-60));
}

function urlResponde(url) {
  // Se extiende a 3000ms para evitar falsos positivos durante la compilación de TS
  return fetch(url, { signal: AbortSignal.timeout(3000) })
    .then((r) => r.status < 500)
    .catch(() => false);
}

function dbLista() {
  return new Promise((resolve) =>
    exec("docker exec codesentry-db mysqladmin ping -uroot -proot --silent",
      { timeout: 4000, windowsHide: true }, (e) => resolve(!e)));
}

function correr(cmd, id) {
  return new Promise((resolve) =>
    exec(cmd, { cwd: RAIZ, windowsHide: true, timeout: 120000 }, (e, so, se) => {
      anotar(id, `$ ${cmd}\n${so}${se}`);
      resolve(!e);
    }));
}

async function estadoDe(id) {
  const ok = id === "db" ? await dbLista() : await urlResponde(SERVICIOS[id].url);
  if (ok) { arrancando.delete(id); fallos.delete(id); return "ok"; }
  if (fallos.has(id)) return "error";
  const t = arrancando.get(id);
  if (t) {
    if (Date.now() - t > 120000) {
      arrancando.delete(id);
      fallos.set(id, "Tardó demasiado en responder. Abre el registro para ver qué pasó.");
      return "error";
    }
    return "iniciando";
  }
  return "apagado";
}

function matar(id) {
  const h = hijos.get(id);
  if (!h) return;
  hijos.delete(id);
  if (ES_WIN) exec(`taskkill /pid ${h.pid} /T /F`, { windowsHide: true });
  else h.kill();
}

function lanzar(id) {
  const p = PROCESOS[id];
  const opts = { cwd: p.cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] };
  const archivo = typeof p.archivo === "function" ? p.archivo() : p.archivo;
  const hijo = p.shell ? spawn(p.shell, [], { ...opts, shell: true }) : spawn(archivo, p.args, opts);
  hijos.set(id, hijo);
  hijo.stdout.on("data", (d) => anotar(id, d));
  hijo.stderr.on("data", (d) => anotar(id, d));
  hijo.on("error", (e) => fallos.set(id, `No se pudo lanzar: ${e.message}`));
  hijo.on("exit", (codigo) => {
    hijos.delete(id);
    if (codigo) {
      arrancando.delete(id);
      fallos.set(id, id === "ollama"
        ? "No se pudo iniciar. ¿Está instalado? Descárgalo en ollama.com."
        : `Se cerró con código ${codigo}. Abre el registro para ver el motivo.`);
    }
  });
}

async function iniciarDb() {
  arrancando.set("db", Date.now());
  if (!(await correr("docker info", "db"))) {
    arrancando.delete("db");
    fallos.set("db", "Docker Desktop no está corriendo. Ábrelo, espera a que cargue y vuelve a intentar.");
    return;
  }
  if (!(await correr("docker compose up -d", "db"))) {
    arrancando.delete("db");
    fallos.set("db", "No se pudo levantar la base de datos. Abre el registro.");
  }
}

async function iniciar(id) {
  if (!SERVICIOS[id]) return;
  if ((await estadoDe(id)) === "ok" || arrancando.has(id)) return;
  fallos.delete(id);
  if (id === "db") return iniciarDb();
  const p = PROCESOS[id];
  if (p.requiere && !fs.existsSync(p.requiere)) {
    fallos.set(id, "Faltan dependencias. Ejecuta setup.bat primero.");
    return;
  }
  matar(id);
  arrancando.set(id, Date.now());
  lanzar(id);
}

async function iniciarTodo() {
  await iniciar("db");
  await Promise.all(["backend", "analyzer", "frontend", "ollama"].map(iniciar));
}

async function apagar() {
  for (const id of [...hijos.keys()]) matar(id);
  await correr("docker compose stop", "db");
}

function abrirNavegador() {
  const cmd = ES_WIN ? `start "" ${URL_LAUNCHER}` : process.platform === "darwin" ? `open ${URL_LAUNCHER}` : `xdg-open ${URL_LAUNCHER}`;
  exec(cmd);
}

// ===== REQUISITOS =====
const MODELO = "qwen2.5-coder";
const OLLAMA_WIN = path.join(process.env.LOCALAPPDATA || "", "Programs", "Ollama", "ollama.exe");
const WINGET_FLAGS = "--silent --accept-package-agreements --accept-source-agreements";
const instalando = new Set();
const fallosReq = new Map();
let pyCmd = null;

function ejecutar(cmd, ms = 8000) {
  return new Promise((resolve) =>
    exec(cmd, { cwd: RAIZ, windowsHide: true, timeout: ms }, (e, so, se) =>
      resolve({ ok: !e, salida: `${so}${se}`.trim() })));
}

function largo(id, cmd, cwd = RAIZ) {
  return new Promise((resolve) => {
    anotar(`req_${id}`, `$ ${cmd}`);
    const h = spawn(cmd, [], { cwd, shell: true, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    h.stdout.on("data", (d) => anotar(`req_${id}`, d));
    h.stderr.on("data", (d) => anotar(`req_${id}`, d));
    h.on("error", () => resolve(false));
    h.on("exit", (c) => resolve(c === 0));
  });
}

function ollamaExe() {
  return ES_WIN && fs.existsSync(OLLAMA_WIN) ? OLLAMA_WIN : "ollama";
}

async function detectarPython() {
  for (const cmd of ES_WIN ? ["python", "py -3"] : ["python3", "python"]) {
    const r = await ejecutar(`${cmd} --version`);
    const m = r.ok && r.salida.match(/Python (\d+)\.(\d+)/);
    if (m && (+m[1] > 3 || (+m[1] === 3 && +m[2] >= 11))) { pyCmd = cmd; return true; }
  }
  return false;
}

async function ollamaInstalado() {
  if (await urlResponde(SERVICIOS.ollama.url)) return true;
  if (ES_WIN && fs.existsSync(OLLAMA_WIN)) return true;
  return (await ejecutar("ollama --version")).ok;
}

async function modeloInstalado() {
  try {
    const r = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2000) });
    const { models = [] } = await r.json();
    return models.some((m) => m.name.startsWith(MODELO));
  } catch { return false; }
}

const tiene = (...rutas) => rutas.every((r) => fs.existsSync(path.join(RAIZ, r)));
const cmdVenv = () =>
  `${pyCmd || "python"} -m venv "${path.join(RAIZ, "analyzer", ".venv")}" && "${PYTHON}" -m pip install -r "${path.join(RAIZ, "analyzer", "requirements.txt")}"`;

const REQ = {
  python: {
    nombre: "Python 3.11 o superior", obligatorio: true, auto: true, usaWinget: true,
    porque: "Ejecuta el motor de análisis de código (analyzer). Sin Python no se puede analizar.",
    aviso: "Se instala con winget (el administrador de paquetes de Windows). Descarga unos 30 MB y Windows puede pedirte permisos.",
    comando: () => `winget install -e --id Python.Python.3.12 ${WINGET_FLAGS}`,
    detectar: detectarPython,
    instalar: () => largo("python", `winget install -e --id Python.Python.3.12 ${WINGET_FLAGS}`),
    manual: { url: "https://www.python.org/downloads/", pasos: [
      "Descarga Python 3.11 o superior desde el enlace oficial.",
      "Al instalar, marca la casilla «Add python.exe to PATH».",
      "Cierra y vuelve a abrir CodeSentry.bat, y pulsa «Ya lo hice, verificar».",
    ] },
  },
  docker: {
    nombre: "Docker Desktop", obligatorio: true, auto: false,
    porque: "Ejecuta la base de datos MySQL donde se guardan tus proyectos y resultados, en un contenedor aislado.",
    aviso: "No se instala desde aquí: Docker Desktop necesita permisos de administrador, activar WSL 2 y reiniciar Windows.",
    detectar: async () => (await ejecutar("docker --version")).ok,
    manual: { url: "https://www.docker.com/products/docker-desktop/", pasos: [
      "Descarga Docker Desktop desde el enlace oficial e instálalo.",
      "Reinicia Windows si el instalador lo pide.",
      "Abre Docker Desktop y espera a que indique que el motor está corriendo.",
      "Vuelve aquí y pulsa «Ya lo hice, verificar».",
    ] },
  },
  env: {
    nombre: "Archivos de configuración (.env)", obligatorio: true, auto: true,
    porque: "Guardan los puertos y datos de conexión de cada servicio. Se crean copiando los .env.example.",
    aviso: "Si un .env ya existe, no se toca.",
    comando: () => "copiar backend/.env.example → backend/.env (igual en analyzer y frontend)",
    detectar: async () => tiene("backend/.env", "analyzer/.env", "frontend/.env"),
    instalar: async () => {
      for (const d of ["backend", "analyzer", "frontend"]) {
        const dest = path.join(RAIZ, d, ".env");
        const origen = `${dest}.example`;
        if (!fs.existsSync(dest) && fs.existsSync(origen)) fs.copyFileSync(origen, dest);
      }
    },
    manual: { url: null, pasos: [
      "En las carpetas backend, analyzer y frontend, copia el archivo .env.example y llama a la copia .env.",
      "Pulsa «Ya lo hice, verificar».",
    ] },
  },
  deps_backend: {
    nombre: "Dependencias del servidor (backend)", obligatorio: true, auto: true,
    porque: "Librerías de Node.js que necesita la API de CodeSentry.",
    aviso: "Descarga paquetes desde npmjs.org, necesita internet.",
    comando: () => "npm install   (dentro de la carpeta backend)",
    detectar: async () => tiene("backend/node_modules"),
    instalar: () => largo("deps_backend", "npm install", path.join(RAIZ, "backend")),
    manual: { url: null, pasos: ["Abre una terminal en la carpeta backend.", "Ejecuta: npm install", "Pulsa «Ya lo hice, verificar»."] },
  },
  deps_frontend: {
    nombre: "Dependencias de la interfaz (frontend)", obligatorio: true, auto: true,
    porque: "Librerías de React y Vite que necesita la pantalla de CodeSentry.",
    aviso: "Descarga paquetes desde npmjs.org, necesita internet.",
    comando: () => "npm install   (dentro de la carpeta frontend)",
    detectar: async () => tiene("frontend/node_modules"),
    instalar: () => largo("deps_frontend", "npm install", path.join(RAIZ, "frontend")),
    manual: { url: null, pasos: ["Abre una terminal en la carpeta frontend.", "Ejecuta: npm install", "Pulsa «Ya lo hice, verificar»."] },
  },
  venv: {
    nombre: "Entorno del motor de análisis", obligatorio: true, auto: true, depende: "python",
    porque: "Instala FastAPI y las demás librerías de Python en un entorno aislado (.venv) dentro del proyecto. No toca tu Python global.",
    aviso: "Descarga paquetes desde pypi.org, necesita internet.",
    comando: cmdVenv,
    detectar: async () =>
      fs.existsSync(PYTHON) && (await ejecutar(`"${PYTHON}" -c "import fastapi, uvicorn, httpx, pydantic"`)).ok,
    instalar: () => largo("venv", cmdVenv()),
    manual: { url: null, pasos: [
      "Abre una terminal en la carpeta analyzer.",
      "Ejecuta: python -m venv .venv",
      "Ejecuta: .venv\\Scripts\\python.exe -m pip install -r requirements.txt",
      "Pulsa «Ya lo hice, verificar».",
    ] },
  },
  ollama: {
    nombre: "Ollama (IA local)", obligatorio: false, auto: ES_WIN, usaWinget: true,
    porque: "Ollama ejecuta modelos de IA dentro de tu propio equipo. CodeSentry lo usa para redactar explicaciones claras de cada hallazgo (por qué es un problema y cómo corregirlo). Tu código nunca se envía a internet. Es opcional: sin Ollama el análisis funciona igual con reglas estáticas, solo que sin esas explicaciones.",
    aviso: "Se instala con winget (descarga de aprox. 1 GB, Windows puede pedirte permisos). Mientras explica, usa CPU/GPU de tu equipo.",
    comando: () => `winget install -e --id Ollama.Ollama ${WINGET_FLAGS}`,
    detectar: ollamaInstalado,
    instalar: () => largo("ollama", `winget install -e --id Ollama.Ollama ${WINGET_FLAGS}`),
    manual: { url: "https://ollama.com/download", pasos: [
      "Descarga el instalador de Ollama desde el enlace oficial e instálalo.",
      "Ábrelo una vez para que quede corriendo en segundo plano.",
      "Vuelve aquí y pulsa «Ya lo hice, verificar».",
    ] },
  },
  modelo: {
    nombre: `Modelo de IA (${MODELO})`, obligatorio: false, auto: true, depende: "ollama",
    porque: "Es el «cerebro» que Ollama usa para redactar las explicaciones: un modelo especializado en código, de tamaño moderado, pensado para equipos modestos. Una vez descargado funciona sin internet.",
    aviso: "Descarga de aprox. 5 GB, puede tardar varios minutos según tu conexión. Se guarda en tu disco.",
    comando: () => `ollama pull ${MODELO}`,
    detectar: modeloInstalado,
    instalar: async () => {
      await iniciar("ollama");
      for (let i = 0; i < 30 && !(await urlResponde(SERVICIOS.ollama.url)); i++) await new Promise((r) => setTimeout(r, 1000));
      await largo("modelo", `"${ollamaExe()}" pull ${MODELO}`);
    },
    manual: { url: "https://ollama.com/library/qwen2.5-coder", pasos: [
      "Asegúrate de tener Ollama instalado y abierto.",
      `Abre una terminal y ejecuta: ollama pull ${MODELO}`,
      "Pulsa «Ya lo hice, verificar».",
    ] },
  },
};

async function listarRequisitos() {
  const winget = ES_WIN && (await ejecutar("winget --version")).ok;
  const ids = Object.keys(REQ);
  const hechos = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await REQ[id].detectar()])));
  return ids.map((id) => {
    const d = REQ[id];
    const bloqueadoPor = d.depende && !hechos[d.depende] ? REQ[d.depende].nombre : null;
    const estado = hechos[id] ? "ok" : instalando.has(id) ? "instalando" : fallosReq.has(id) ? "error" : "falta";
    return {
      id, nombre: d.nombre, obligatorio: d.obligatorio, estado, porque: d.porque, aviso: d.aviso ?? null,
      auto: d.auto, instalable: d.auto && (!d.usaWinget || winget) && !bloqueadoPor,
      bloqueadoPor, comando: d.comando ? d.comando() : null, manual: d.manual,
      mensaje: fallosReq.get(id) ?? null,
    };
  });
}

async function instalarReq(id) {
  const d = REQ[id];
  if (!d || !d.auto || instalando.has(id)) return 400;
  if (d.depende && !(await REQ[d.depende].detectar())) return 409;
  if (d.usaWinget && !(await ejecutar("winget --version")).ok) return 400;
  instalando.add(id);
  fallosReq.delete(id);
  registros.set(`req_${id}`, []);
  d.instalar()
    .then(() => d.detectar())
    .then((ok) => { if (!ok) fallosReq.set(id, "No se pudo completar. Abre el registro o hazlo manualmente."); })
    .catch((e) => fallosReq.set(id, e.message))
    .finally(() => instalando.delete(id));
  return 202;
}

async function faltantesObligatorios() {
  return (await listarRequisitos()).filter((r) => r.obligatorio && r.estado !== "ok").map((r) => r.id);
}

const HOSTS_OK = [`localhost:${PUERTO}`, `127.0.0.1:${PUERTO}`];
const ORIGENES_OK = [`http://localhost:${PUERTO}`, `http://127.0.0.1:${PUERTO}`];

function json(res, codigo, datos) {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(datos));
}

const servidor = http.createServer(async (req, res) => {
  if (!HOSTS_OK.includes(req.headers.host)) { res.writeHead(403); return res.end(); }
  if (req.method === "POST" && !ORIGENES_OK.includes(req.headers.origin)) { res.writeHead(403); return res.end(); }

  const ruta = new URL(req.url, URL_LAUNCHER).pathname;

  // ===== ARCHIVOS ESTÁTICOS DEL LAUNCHER =====
  if (req.method === "GET" && ruta === "/") {
    return fs.readFile(path.join(__dirname, "index.html"), (e, data) => {
      if (e) { res.writeHead(500); return res.end("Falta launcher/index.html"); }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
  }

  if (req.method === "GET" && ruta === "/index.css") {
    return fs.readFile(path.join(__dirname, "index.css"), (e, data) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      res.end(data);
    });
  }

  if (req.method === "GET" && ruta === "/app.js") {
    return fs.readFile(path.join(__dirname, "app.js"), (e, data) => {
      if (e) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
      res.end(data);
    });
  }

  // ===== RUTAS DE LA API =====
  if (req.method === "GET" && ruta === "/api/estado") {
    const ids = Object.keys(SERVICIOS);
    const estados = await Promise.all(ids.map(estadoDe));
    return json(res, 200, ids.map((id, i) => ({
      id, nombre: SERVICIOS[id].nombre, obligatorio: SERVICIOS[id].obligatorio,
      estado: estados[i], mensaje: fallos.get(id) ?? null,
    })));
  }

  const log = ruta.match(/^\/api\/log\/(\w+)$/);
  if (req.method === "GET" && log) return json(res, 200, registros.get(log[1]) ?? []);

  const uno = ruta.match(/^\/api\/iniciar\/(\w+)$/);
  if (req.method === "POST" && uno && SERVICIOS[uno[1]]) { iniciar(uno[1]); return json(res, 202, { ok: true }); }
  
  if (req.method === "POST" && ruta === "/api/iniciar-todo") {
    const faltan = await faltantesObligatorios();
    if (faltan.length) return json(res, 409, { faltan });
    iniciarTodo();
    return json(res, 202, { ok: true });
  }

  if (req.method === "GET" && ruta === "/api/requisitos") return json(res, 200, await listarRequisitos());

  const inst = ruta.match(/^\/api\/instalar\/(\w+)$/);
  if (req.method === "POST" && inst) {
    const codigo = await instalarReq(inst[1]);
    return json(res, codigo, { ok: codigo === 202 });
  }
  
  if (req.method === "POST" && ruta === "/api/apagar") {
    json(res, 200, { ok: true });
    return apagar().finally(() => process.exit(0));
  }

  res.writeHead(404); res.end();
});

servidor.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.log("El centro de arranque ya estaba abierto. Reabriendo la página...");
    abrirNavegador();
    setTimeout(() => process.exit(0), 500);
  } else throw e;
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  console.log(`CodeSentry · Centro de arranque en ${URL_LAUNCHER}`);
  abrirNavegador();
});

process.on("SIGINT", () => { for (const id of [...hijos.keys()]) matar(id); process.exit(0); });