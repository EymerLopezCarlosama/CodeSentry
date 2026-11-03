const DESTINO = "http://localhost:5173/";
const DETALLE = {
  db: "MySQL en Docker · puerto 3307",
  backend: "API local · puerto 3001",
  analyzer: "Reglas estáticas en Python · puerto 8000",
  frontend: "Interfaz web · puerto 5173",
  ollama: "Opcional: solo explica hallazgos con IA",
};
const PASOS = ["Bienvenida", "Configuración", "Arranque"];

const $ = (id) => document.getElementById(id);
const lista = $("lista"), mensaje = $("mensaje"), btnEncender = $("encender"), btnEntrar = $("entrar"), btnApagar = $("apagar");
const reqBox = $("req"), dlg = $("dlg"), pasosEl = $("pasos"), subEl = $("sub");
const secciones = [$("paso-bienvenida"), $("paso-config"), $("paso-arranque")];
const formNombre = $("form-nombre"), inputNombre = $("nombre"), btnNombre = $("btn-nombre"), errNombre = $("err-nombre");
const btnTodo = $("configurar-todo"), btnContinuar = $("a-arranque"), btnVerificar = $("verificar"), msgConfig = $("msg-config");

const abiertos = new Set();
const abiertosReq = new Set();

let paso = -1, nombre = "";
let encendiendo = false, redirigiendo = false, apagado = false, ultimo = "";
let requisitos = [], logsReq = {}, faltanObl = false, temporizadorReq = null, avanzando = false;

const post = (ruta, cuerpo) =>
  fetch(ruta, {
    method: "POST",
    headers: cuerpo ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  }).catch(() => null);

const el = (tag, clase, texto) => {
  const e = document.createElement(tag);
  if (clase) e.className = clase;
  if (texto != null) e.textContent = texto;
  return e;
};

const saludo = () => {
  const h = new Date().getHours();
  return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
};
const destino = () => `${DESTINO}?usuario=${encodeURIComponent(nombre)}`;

// ===== Pasos =====
function pintarPasos() {
  pasosEl.replaceChildren();
  PASOS.forEach((texto, i) => {
    const li = el("li", i === paso ? "activo" : i < paso ? "hecho" : "");
    li.append(el("span", null, i < paso ? "✓" : String(i + 1)), texto);
    pasosEl.append(li);
  });
}

function irAPaso(n) {
  paso = n;
  avanzando = false;
  secciones.forEach((s, i) => (s.hidden = i !== n));
  pintarPasos();
  subEl.replaceChildren();
  if (nombre && n > 0) {
    subEl.append(`${saludo()}, ${nombre} · `);
    const cambiar = el("button", "enlace", "¿No eres tú?");
    cambiar.onclick = () => { inputNombre.value = nombre; btnNombre.disabled = false; irAPaso(0); };
    subEl.append(cambiar);
  } else {
    subEl.textContent = "Centro de arranque · todo corre en este equipo";
  }
  if (n === 0) inputNombre.focus();
  if (n === 1) cargarRequisitos();
  if (n === 2) { ultimo = ""; refrescar(); }
}

// ===== Paso 1: nombre =====
inputNombre.oninput = () => (btnNombre.disabled = !inputNombre.value.trim());
formNombre.onsubmit = async (e) => {
  e.preventDefault();
  const valor = inputNombre.value.trim();
  if (!valor) return;
  btnNombre.disabled = true;
  errNombre.textContent = "";
  const r = await post("/api/usuario", { nombre: valor });
  if (r && r.ok) {
    nombre = (await r.json()).nombre;
    irAPaso(1);
  } else {
    errNombre.textContent = "No se pudo guardar el nombre. Inténtalo de nuevo.";
    btnNombre.disabled = false;
  }
};

// ===== Paso 2: configuración =====
function seleccionable(r) {
  if (!(r.estado === "falta" || r.estado === "error") || !r.puedeInstalar) return false;
  if (!r.depende) return true;
  const dep = requisitos.find((x) => x.id === r.depende);
  return !dep || dep.estado === "ok" || seleccionable(dep);
}

async function cargarRequisitos() {
  clearTimeout(temporizadorReq);
  if (paso !== 1) return;
  try { requisitos = await (await fetch("/api/requisitos")).json(); }
  catch { msgConfig.textContent = "No se pudieron comprobar los requisitos."; return; }
  logsReq = {};
  for (const id of abiertosReq) { try { logsReq[id] = await (await fetch(`/api/log/req_${id}`)).json(); } catch {} }
  faltanObl = requisitos.some((r) => r.obligatorio && r.estado !== "ok");
  pintarRequisitos();
  actualizarConfig();
  if (requisitos.some((r) => r.estado === "instalando" || r.estado === "en_cola")) temporizadorReq = setTimeout(cargarRequisitos, 2000);
}

function actualizarConfig() {
  const pend = requisitos.filter((r) => r.estado !== "ok");
  const ocupado = requisitos.some((r) => r.estado === "instalando" || r.estado === "en_cola");
  btnTodo.hidden = !requisitos.some(seleccionable);
  btnTodo.disabled = ocupado;
  btnContinuar.disabled = faltanObl || ocupado;
  btnContinuar.textContent = pend.length && !faltanObl ? "Continuar sin lo opcional" : "Continuar";
  if (!pend.length) {
    msgConfig.textContent = "Todo en orden. Pasando al arranque…";
    if (!avanzando) { avanzando = true; setTimeout(() => paso === 1 && irAPaso(2), 900); }
  } else if (ocupado) msgConfig.textContent = "Instalando… puede tardar varios minutos.";
  else if (faltanObl) msgConfig.textContent = "Faltan requisitos obligatorios. Usa «Configurar todo» o hazlos a mano.";
  else msgConfig.textContent = "Solo falta lo opcional (la IA local). Puedes instalarla o continuar sin ella.";
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
    } else if (r.estado === "en_cola") {
      b.append(el("i", "giro"), el("span", null, "En cola: espera su turno"));
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
    dlg.append(el("h2", null, `Instalar: ${r.nombre}`), el("p", null, r.porque),
      el("p", null, "Esto se ejecutará en tu equipo:"), el("code", "cmd", r.comando));
    if (r.aviso) dlg.append(el("div", "aviso-dlg", r.aviso));
    dlg.append(el("p", null, "Solo se ejecuta ese comando, nada más. Si no quieres autorizarlo, puedes hacerlo tú a mano."));
    const ok = el("button", "boton", "Autorizar e instalar");
    ok.onclick = async () => { dlg.close(); await post(`/api/instalar/${r.id}`); cargarRequisitos(); };
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

function abrirDialogoTodo() {
  const sel = requisitos.filter(seleccionable);
  if (!sel.length) return;
  dlg.replaceChildren();
  dlg.append(el("h2", null, "Configurar todo"),
    el("p", null, "Se prepara lo que falta, en este orden. Solo se ejecuta lo que ves aquí, nada más:"));
  const cajas = new Map();
  for (const r of sel) {
    const fila = el("label", "fila-todo");
    const c = document.createElement("input");
    c.type = "checkbox";
    c.checked = r.obligatorio;
    c.disabled = r.obligatorio;
    cajas.set(r.id, c);
    const cuerpo = el("div");
    const t = el("strong", null, r.nombre + " ");
    t.append(el("span", "etiqueta", r.obligatorio ? "Obligatorio" : "Opcional"));
    cuerpo.append(t, el("small", null, r.porque), el("code", "cmd", r.comando));
    if (r.aviso) cuerpo.append(el("small", null, r.aviso));
    fila.append(c, cuerpo);
    dlg.append(fila);
  }
  // Marcar el modelo marca Ollama; desmarcar Ollama desmarca el modelo.
  for (const r of sel) {
    cajas.get(r.id).onchange = () => {
      const marcado = cajas.get(r.id).checked;
      if (marcado && r.depende && cajas.has(r.depende)) cajas.get(r.depende).checked = true;
      if (!marcado) for (const o of sel) if (o.depende === r.id) cajas.get(o.id).checked = false;
    };
  }
  const aMano = requisitos.filter((r) => r.estado !== "ok" && r.obligatorio && !seleccionable(r));
  if (aMano.length) dlg.append(el("div", "aviso-dlg", `Quedará pendiente (hazlo a mano): ${aMano.map((r) => r.nombre).join(", ")}.`));

  const ok = el("button", "boton", "Autorizar e instalar");
  ok.onclick = async () => {
    const ids = sel.filter((r) => cajas.get(r.id).checked).map((r) => r.id);
    dlg.close();
    await post("/api/instalar-todo", { ids });
    cargarRequisitos();
  };
  const no = el("button", "boton sec", "Cancelar");
  no.onclick = () => dlg.close();
  dlg.append(el("div", "acciones-dlg"));
  dlg.lastChild.append(ok, no);
  dlg.showModal();
}

btnTodo.onclick = abrirDialogoTodo;
btnVerificar.onclick = cargarRequisitos;
btnContinuar.onclick = () => irAPaso(2);

// ===== Paso 3: arranque =====
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
  if (apagado || paso !== 2) return;
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
    setTimeout(() => (location.href = destino()), 1200);
    return;
  }
  if (conError) { encendiendo = false; mensaje.textContent = "Algo falló: abre el registro de la fila marcada, corrígelo y pulsa Iniciar."; }
  else if (encendiendo) mensaje.textContent = "Encendiendo servicios…";
  else if (listos) mensaje.textContent = "Todo está encendido.";
  else mensaje.textContent = "Pulsa «Encender todo» para arrancar los servicios.";
}

btnEncender.onclick = async () => {
  const r = await post("/api/iniciar-todo");
  if (r && r.status === 409) { irAPaso(1); return; }
  encendiendo = true; redirigiendo = false;
  setTimeout(refrescar, 300);
};

btnEntrar.onclick = () => (location.href = destino());

btnApagar.onclick = async () => {
  if (!confirm("¿Apagar todos los servicios de CodeSentry?")) return;
  apagado = true;
  mensaje.textContent = "Apagando…";
  await post("/api/apagar");
  lista.replaceChildren();
  mensaje.textContent = "CodeSentry está apagado. Ya puedes cerrar esta pestaña.";
  btnEncender.disabled = btnEntrar.disabled = btnApagar.disabled = true;
};

// ===== Inicio =====
(async function iniciar() {
  try { nombre = (await (await fetch("/api/usuario")).json()).nombre || ""; } catch { nombre = ""; }
  irAPaso(nombre ? 1 : 0);
  setInterval(refrescar, 1500);
})();