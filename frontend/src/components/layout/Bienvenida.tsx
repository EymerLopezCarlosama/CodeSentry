import { useUsuario } from "../../hooks/useUsuario";
import { saludoPorHora } from "../../utils/format";

export default function Bienvenida() {
  const { nombre } = useUsuario();
  if (!nombre) return null;
  return (
    <h2 className="bienvenida">
      {saludoPorHora()}, {nombre}
    </h2>
  );
}