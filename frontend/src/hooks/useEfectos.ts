import { useCallback, useEffect, useState } from "react";

export type Efectos = "alto" | "bajo";

const CLAVE = "codesentry-efectos";

function efectosIniciales(): Efectos {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "alto" || guardado === "bajo") return guardado;
  } catch {
    // sin acceso a localStorage: se decide por la preferencia del sistema
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "bajo" : "alto";
}

export function useEfectos() {
  const [efectos, setEfectos] = useState<Efectos>(efectosIniciales);

  useEffect(() => {
    document.documentElement.setAttribute("data-efectos", efectos);
  }, [efectos]);

  const alternar = useCallback(() => {
    setEfectos((actual) => {
      const nuevo: Efectos = actual === "alto" ? "bajo" : "alto";
      try {
        localStorage.setItem(CLAVE, nuevo);
      } catch {
        // si no se puede guardar, el cambio vale solo para esta sesión
      }
      return nuevo;
    });
  }, []);

  return { efectos, alternar };
}