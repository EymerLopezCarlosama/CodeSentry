const BASE_URL = import.meta.env.VITE_API_URL;

export class ErrorApi extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

interface Opciones extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function api<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const { body, headers, ...resto } = opciones;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      ...resto,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErrorApi(0, "SIN_CONEXION", "No se pudo conectar con el servidor. ¿Está encendido el backend?");
  }

  if (respuesta.status === 204) return undefined as T;

  if (!respuesta.ok) {
    try {
      const datos = await respuesta.json();
      throw new ErrorApi(respuesta.status, datos.error.codigo, datos.error.mensaje);
    } catch (err) {
      if (err instanceof ErrorApi) throw err;
      throw new ErrorApi(respuesta.status, "ERROR_DESCONOCIDO", "Respuesta inesperada del servidor.");
    }
  }

  return (await respuesta.json()) as T;
}