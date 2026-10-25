interface PasosProps {
  pasos: string[];
  actual: number; // 1 = primer paso
  fallido?: boolean; // marca el paso actual como error
}

export default function Pasos({ pasos, actual, fallido = false }: PasosProps) {
  return (
    <ol className="pasos" aria-label="Progreso de la revisión">
      {pasos.map((etiqueta, i) => {
        const n = i + 1;
        const estado = n < actual ? "hecho" : n === actual ? (fallido ? "error" : "actual") : "pendiente";
        return (
          <li key={etiqueta} className={`paso paso-${estado}`} aria-current={n === actual ? "step" : undefined}>
            <span className="paso-numero">{estado === "hecho" ? "✓" : estado === "error" ? "!" : n}</span>
            <span className="paso-etiqueta">{etiqueta}</span>
          </li>
        );
      })}
    </ol>
  );
}