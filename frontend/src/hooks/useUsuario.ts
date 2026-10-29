import { useState } from "react";

const CLAVE = "codesentry.usuario";

function leer(): string {
  try {
    return localStorage.getItem(CLAVE) ?? "";
  } catch {
    return "";
  }
}

export function useUsuario() {
  const [nombre, setNombre] = useState<string>(leer);

  function guardar(nuevo: string) {
    const limpio = nuevo.trim().slice(0, 40);
    if (!limpio) return;
    try {
      localStorage.setItem(CLAVE, limpio);
    } catch {
      /* si el navegador bloquea el storage, el nombre vive solo en memoria */
    }
    setNombre(limpio);
  }

  return { nombre, guardar };
}