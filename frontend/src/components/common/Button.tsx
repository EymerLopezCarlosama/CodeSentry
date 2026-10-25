import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "peligro";
  tamano?: "normal" | "pequeno";
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function Button({
  children,
  onClick,
  variante = "primario",
  tamano = "normal",
  disabled = false,
  type = "button",
}: ButtonProps) {
  const clases = `btn btn-${variante}${tamano === "pequeno" ? " btn-sm" : ""}`;
  return (
    <button type={type} className={clases} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}