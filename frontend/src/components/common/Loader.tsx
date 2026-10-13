interface LoaderProps {
  texto?: string;
}

export default function Loader({ texto = "Cargando..." }: LoaderProps) {
  return (
    <div className="loader" role="status">
      <span className="loader-spinner" />
      {texto && <span>{texto}</span>}
    </div>
  );
}