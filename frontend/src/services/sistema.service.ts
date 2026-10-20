import { api } from "./api";

// Abre el diálogo de carpetas del sistema (en el equipo donde corre el backend).
// Devuelve la ruta elegida, o null si el usuario cancela (respuesta 204).
export async function seleccionarCarpeta(): Promise<string | null> {
  const respuesta = await api<{ ruta: string } | undefined>("/sistema/seleccionar-carpeta");
  return respuesta?.ruta ?? null;
}