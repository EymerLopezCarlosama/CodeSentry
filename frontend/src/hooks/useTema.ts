import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Tema = "claro" | "oscuro";
export interface Origen {
  x: number;
  y: number;
}

const CLAVE = "codesentry-tema";
const DURACION_MS = 650;

interface TransicionVista {
  ready: Promise<void>;
  finished: Promise<void>;
}
type DocumentoConTransicion = {
  startViewTransition?: (cb: () => void) => TransicionVista;
};

function temaInicial(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    // Sin acceso a localStorage
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

function aplicarAlDocumento(tema: Tema): void {
  document.documentElement.setAttribute("data-theme", tema === "oscuro" ? "dark" : "light");
}

function guardar(tema: Tema): void {
  try {
    localStorage.setItem(CLAVE, tema);
  } catch {
    // No se pudo guardar
  }
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(temaInicial);

  useEffect(() => {
    aplicarAlDocumento(tema);
  }, [tema]);

  const alternar = useCallback(
    (origen?: Origen) => {
      const nuevo: Tema = tema === "oscuro" ? "claro" : "oscuro";
      guardar(nuevo);
      const raiz = document.documentElement;

      // 1. Si no hay soporte para View Transitions, usar fallback
      const iniciar = (document as unknown as DocumentoConTransicion).startViewTransition?.bind(document);

      if (!iniciar) {
        raiz.classList.add("tema-fundido");
        aplicarAlDocumento(nuevo);
        setTema(nuevo);
        window.setTimeout(() => raiz.classList.remove("tema-fundido"), DURACION_MS);
        return;
      }

      // 2. Coordenadas para el origen del círculo
      const x = origen?.x ?? window.innerWidth / 2;
      const y = origen?.y ?? 0;
      const radio = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      raiz.classList.add("cambiando-tema");

      // 3. Ejecutar la transición y actualizar el DOM de forma síncrona
      const transicion = iniciar(() => {
        flushSync(() => {
          aplicarAlDocumento(nuevo);
          setTema(nuevo);
        });
      });

      // 4. Aplicar la animación según la dirección del tema
      transicion.ready
        .then(() => {
          const esModoOscuro = nuevo === "oscuro";
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radio}px at ${x}px ${y}px)`,
          ];

          raiz.animate(
            {
              clipPath: esModoOscuro ? clipPath : clipPath.reverse(),
            },
            {
              duration: DURACION_MS,
              easing: "ease-in-out",
              pseudoElement: esModoOscuro
                ? "::view-transition-new(root)"
                : "::view-transition-old(root)",
            }
          );
        })
        .catch(() => {
          // Si la transición se cancela (ej: rápido doble clic)
        });

      transicion.finished.finally(() => {
        raiz.classList.remove("cambiando-tema");
      });
    },
    [tema]
  );

  return { tema, alternar };
}