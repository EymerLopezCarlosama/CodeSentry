import type { ResultadoEscaneo } from "../../types";

interface ResumenEscaneoProps {
  cargando: boolean;
  resultado: ResultadoEscaneo | null;
  error: string | null;
}

// {JavaScript: 42, Python: 7} -> "JavaScript (42) y Python (7)"
function listar(conteos: Record<string, number>): string {
  const partes = Object.entries(conteos).map(([nombre, n]) => `${nombre} (${n})`);
  if (partes.length <= 1) return partes.join("");
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}

export default function ResumenEscaneo({ cargando, resultado, error }: ResumenEscaneoProps) {
  if (cargando) {
    return <small role="status">Escaneando la carpeta...</small>;
  }

  if (error) {
    return (
      <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
        {error}
      </p>
    );
  }

  if (!resultado) return null;

  const haySoportados = Object.keys(resultado.soportados).length > 0;
  const hayNoSoportados = Object.keys(resultado.no_soportados).length > 0;

  if (!haySoportados && !hayNoSoportados) {
    return (
      <p role="status" style={{ margin: 0 }}>
        No encontré código reconocible en esta carpeta.
      </p>
    );
  }

  return (
    <div role="status" style={{ display: "grid", gap: "4px" }}>
      {haySoportados ? (
        <p style={{ margin: 0 }}>
          Encontré <strong>{listar(resultado.soportados)}</strong>. Puedo trabajar con estos.
        </p>
      ) : (
        <p style={{ margin: 0, color: "var(--color-peligro)" }}>
          No encontré ningún lenguaje que pueda analizar por ahora (JavaScript, TypeScript o Python).
        </p>
      )}

      {hayNoSoportados && (
        <p style={{ margin: 0 }}>
          Fuera de mi alcance por ahora: <strong>{listar(resultado.no_soportados)}</strong>.
        </p>
      )}

      {resultado.truncado && (
        <small>La carpeta es muy grande: el conteo es parcial.</small>
      )}
    </div>
  );
}