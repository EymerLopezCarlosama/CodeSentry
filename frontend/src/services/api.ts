// PROMPT — services/api.ts
//
// Cliente HTTP base. `api<T>(ruta, opciones?)`: envuelve fetch con import.meta.env.VITE_API_URL como base, envía/recibe JSON, devuelve undefined en respuestas 204.
// Si la respuesta no es OK, leer { error: { codigo, mensaje } } y lanzar un `ErrorApi` con (status, codigo, mensaje) para que los componentes muestren el mensaje.
// Referencia: docs/api-contract.md (sección "Error estándar")
// Hecho cuando: los demás services solo llaman api("/proyectos") sin repetir fetch ni manejo de errores.
