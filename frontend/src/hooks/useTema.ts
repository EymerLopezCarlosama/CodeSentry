import { useCallback, useEffect, useState } from "react";

export type Tema = "claro" | "oscuro";

const CLAVE = "codesentry-tema";

function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    // sin acceso a localStorage: se usa el del sistema
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema === "oscuro" ? "dark" : "light");
  }, [tema]);

  const alternar = useCallback(() => {
    setTema((actual) => {
      const nuevo: Tema = actual === "oscuro" ? "claro" : "oscuro";
      try {
        localStorage.setItem(CLAVE, nuevo);
      } catch {
        // si no se puede guardar, el cambio vale solo para esta sesión
      }
      return nuevo;
    });
  }, []);

  return { tema, alternar };
}