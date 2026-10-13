import type { ReactNode } from "react";
import Button from "./Button";

interface ModalProps {
  abierto: boolean;
  titulo: string;
  children: ReactNode;
  onCerrar: () => void;
  onConfirmar: () => void;
  textoConfirmar?: string;
  textoCancelar?: string;
  varianteConfirmar?: "primario" | "peligro";
}

export default function Modal({
  abierto,
  titulo,
  children,
  onCerrar,
  onConfirmar,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  varianteConfirmar = "primario",
}: ModalProps) {
  if (!abierto) return null;

  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo">{titulo}</h2>
        <div>{children}</div>
        <div className="modal-acciones">
          <Button variante="secundario" onClick={onCerrar}>
            {textoCancelar}
          </Button>
          <Button variante={varianteConfirmar} onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
        </div>
      </div>
    </div>
  );
}