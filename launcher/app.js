const DESTINO = "http://localhost:5173/";
const DETALLE = {
  db: "MySQL en Docker · puerto 3307",
  backend: "API local · puerto 3001",
  analyzer: "Reglas estáticas en Python · puerto 8000",
  frontend: "Interfaz web · puerto 5173",
  ollama: "Opcional: solo explica hallazgos con IA",
};

const lista = document.getElementById("lista");
const mensaje = document.getElementById("mensaje");
const btnEncender = document.getElementById("encender");
const btnEntrar = document.getElementById("entrar");
const btnApagar = document.getElementById("apagar");
const reqBox = document.getElementById("req");
const dlg = document.getElementById("dlg");

const abiertos = new Set();
const abiertosReq = new Set();

let encendiendo = false;
let redirigiendo = false;
let apagado = false;
let ultimo = "";
let requisitos = [];
let logsReq = {};
let faltanObl = false;
let temporizadorReq = null;

const post = (ruta) => fetch(ruta, { method: "POST" }).catch(() => null);

const el = (tag, clase, texto) => {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
};

async function cargarRequisitos() {
  clearTimeout(temporizadorReq);
  try { requisitos = await (await fetch("/api/requisitos")).json(); } catch { return; }
  logsReq = {};
  for (const id of abiertosReq) { try { logsReq[id] = await (await fetch(`/api/log/req_${id}`)).json(); } catch {} }
  faltanObl = requisitos.some((r) => r.obligatorio && r.estado !== "ok");
  btnEncender.disabled = faltanObl;
  pintarRequisitos();
  if (requisitos.some((r) => r.estado === "instalando")) temporizadorReq = setTimeout(cargarRequisitos, 2000);
}

function pintarRequisitos() {
  reqBox.replaceChildren();
  const pend = requisitos.filter((r) => r.estado !== "ok");
  if (!pend.length) return;
  reqBox.append(el("p", "titulo-req", "Requisitos pendientes"));
  for (const r of pend) {
    const card = el("div", "req" + (r.obligatorio ? " obligatorio" : ""));
    const h = el("h3", null, r.nombre);
    h.append(el("span", "etiqueta", r.obligatorio ? "Obligatorio" : "Opcional"));
    card.append(h, el("p", null, r.porque));
    if (r.bloqueadoPor) card.append(el("p", null, `Primero necesitas: ${r.bloqueadoPor}`));
    if (!r.auto && r.aviso) card.append(el("p", null, r.aviso));
    if (r.mensaje) card.append(el("div", "err", r.mensaje));
    const b = el("div", "botones");
    if (r.estado === "instalando") {
      b.append(el("i", "giro"), el("span", null, "Instalando… puede tardar varios minutos"));
    } else {
      if (r.auto) {
        const i = el("button", "mini", "Instalar…");
        i.disabled = !r.instalable;
        i.title = r.bloqueadoPor ? `Primero falta: ${r.bloqueadoPor}` : !r.instalable ? "Este equipo no permite instalarlo automáticamente" : "";
        i.onclick = () => abrirDialogo(r, "auto");
        b.append(i);
      }
      const m = el("button", "mini", "Lo haré yo manualmente");
      m.onclick = () => abrirDialogo(r, "manual");
      b.append(m);
    }
    if (r.estado === "instalando" || r.estado === "error") {
      const l = el("button", "mini", abiertosReq.has(r.id) ? "Ocultar" : "Registro");
      l.onclick = () => { abiertosReq.has(r.id) ? abiertosReq.delete(r.id) : abiertosReq.add(r.id); cargarRequisitos(); };
      b.append(l);
    }
    card.append(b);
    if (abiertosReq.has(r.id)) card.append(el("pre", null, (logsReq[r.id] || ["(sin salida todavía)"]).join("\n")));
    reqBox.append(card);
  }
}

function abrirDialogo(r, modo) {
  dlg.replaceChildren();
  const acciones = el("div", "acciones-dlg");
  if (modo === "auto") {
    dlg.append(
      el("h2", null, `Instalar: ${r.nombre}`), 
      el("p", null, r.porque),
      el("p", null, "Esto se ejecutará en tu equipo:"), 
      el("code", "cmd", r.comando)
    );
    if (r.aviso) dlg.append(el("div", "aviso-dlg", r.aviso));
    dlg.append(el("p", null, "Solo se ejecuta ese comando, nada más. Si no quieres autorizarlo, puedes hacerlo tú a mano."));
    const ok = el("button", "boton", "Autorizar e instalar");
    ok.onclick = async () => { dlg.close(); await fetch(`/api/instalar/${r.id}`, { method: "POST" }); cargarRequisitos(); };
    const man = el("button", "boton sec", "Lo haré yo manualmente");
    man.onclick = () => abrirDialogo(r, "manual");
    const no = el("button", "boton sec", "Cancelar");
    no.onclick = () => dlg.close();
    acciones.append(ok, man, no);
  } else {
    dlg.append(el("h2", null, `A mano: ${r.nombre}`));
    if (r.aviso && !r.auto) dlg.append(el("div", "aviso-dlg", r.aviso));
    const ol = el("ol");
    r.manual.pasos.forEach((p) => ol.append(el("li", null, p)));
    dlg.append(ol);
    if (r.manual.url) {
      const p = el("p");
      const a = el("a", null, r.manual.url);
      a.href = r.manual.url; a.target = "_blank"; a.rel = "noopener";
      p.append("Enlace oficial: ", a);
      dlg.append(p);
    }
    const ya = el("button", "boton", "Ya lo hice, verificar");
    ya.onclick = () => { dlg.close(); cargarRequisitos(); };
    const cerrar = el("button", "boton sec", "Cerrar");
    cerrar.onclick = () => dlg.close();
    acciones.append(ya, cerrar);
  }
  dlg.append(acciones);
  if (!dlg.open) dlg.showModal();
}

function pintar(servicios, logs) {
  lista.replaceChildren();
  for (const s of servicios) {
    const estado = s.estado === "apagado" && !s.obligatorio ? "aviso" : s.estado === "apagado" ? "" : s.estado;
    const li = document.createElement("li");
    li.className = estado;

    const fila = document.createElement("div");
    fila.className = "fila";
    const icono = document.createElement("span");
    icono.className = "icono";
    if (s.estado === "iniciando") { const g = document.createElement("i"); g.className = "giro"; icono.append(g); }
    else icono.textContent = s.estado === "ok" ? "✓" : s.estado === "error" ? "✕" : estado === "aviso" ? "!" : "○";

    const info = document.createElement("div");
    info.className = "info";
    const t = document.createElement("strong"); t.textContent = s.nombre;
    const d = document.createElement("small");
    d.textContent = estado === "aviso" ? "No detectado: el análisis funciona igual, sin explicaciones de IA" : DETALLE[s.id];
    info.append(t, d);
    fila.append(icono, info);

    if (s.estado === "apagado" || s.estado === "error") {
      const b = document.createElement("button");
      b.className = "mini"; b.textContent = "Iniciar";
      b.onclick = () => { post(`/api/iniciar/${s.id}`); setTimeout(refrescar, 300); };
      fila.append(b);
    }
    if (s.estado === "error" || s.estado === "iniciando") {
      const b = document.createElement("button");
      b.className = "mini"; b.textContent = abiertos.has(s.id) ? "Ocultar" : "Registro";
      b.onclick = () => { abiertos.has(s.id) ? abiertos.delete(s.id) : abiertos.add(s.id); ultimo = ""; refrescar(); };
      fila.append(b);
    }
    li.append(fila);

    if (s.mensaje) { const e = document.createElement("div"); e.className = "err"; e.textContent = s.mensaje; li.append(e); }
    if (abiertos.has(s.id)) { const pre = document.createElement("pre"); pre.textContent = (logs[s.id] || ["(sin salida todavía)"]).join("\n"); li.append(pre); }
    lista.append(li);
  }
}

async function refrescar() {
  if (apagado) return;
  let servicios;
  try { servicios = await (await fetch("/api/estado")).json(); } catch { return; }

  const logs = {};
  for (const id of abiertos) { try { logs[id] = await (await fetch(`/api/log/${id}`)).json(); } catch {} }

  const clave = JSON.stringify([servicios, logs]);
  if (clave !== ultimo) { ultimo = clave; pintar(servicios, logs); }

  const obligatorios = servicios.filter((s) => s.obligatorio);
  const listos = obligatorios.every((s) => s.estado === "ok");
  const conError = obligatorios.some((s) => s.estado === "error");
  btnEntrar.disabled = !listos;

  if (encendiendo && listos && !redirigiendo) {
    redirigiendo = true;
    mensaje.textContent = "Todo listo. Entrando a CodeSentry…";
    setTimeout(() => (location.href = DESTINO), 1200);
    return;
  }
  if (faltanObl) mensaje.textContent = "Instala los requisitos obligatorios de arriba para poder encender CodeSentry.";
  else if (conError) { encendiendo = false; mensaje.textContent = "Algo falló: abre el registro de la fila marcada, corrígelo y pulsa Iniciar."; }
  else if (encendiendo) mensaje.textContent = "Encendiendo servicios…";
  else if (listos) mensaje.textContent = "Todo está encendido.";
  else mensaje.textContent = "Pulsa «Encender todo» para arrancar los servicios.";
}

btnEncender.onclick = async () => {
  const r = await post("/api/iniciar-todo");
  if (r && r.status === 409) { await cargarRequisitos(); return; }
  encendiendo = true; redirigiendo = false;
  setTimeout(refrescar, 300);
};

btnEntrar.onclick = () => (location.href = DESTINO);

btnApagar.onclick = async () => {
  if (!confirm("¿Apagar todos los servicios de CodeSentry?")) return;
  apagado = true;
  mensaje.textContent = "Apagando…";
  await post("/api/apagar");
  lista.replaceChildren();
  mensaje.textContent = "CodeSentry está apagado. Ya puedes cerrar esta pestaña.";
  btnEncender.disabled = btnEntrar.disabled = btnApagar.disabled = true;
};

cargarRequisitos();
refrescar();
setInterval(refrescar, 1500);