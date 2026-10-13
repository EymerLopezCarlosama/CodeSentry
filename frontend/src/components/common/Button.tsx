import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variante?: "primario" | "secundario" | "peligro";
  disabled?: boolean;
  type?: "button" | "submit";
}

export default function Button({
  children,
  onClick,
  variante = "primario",
  disabled = false,
  type = "button",
}: ButtonProps) {
  return (
    <button type={type} className={`btn btn-${variante}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}