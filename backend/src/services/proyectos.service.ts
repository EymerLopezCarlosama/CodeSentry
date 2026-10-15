import { AppError } from "../middlewares/error-handler";
import * as proyectosRepository from "../repositories/proyectos.repository";
import { ProyectoDetalle, ProyectoRespuesta } from "../types";
import { ActualizarProyectoDatos, CrearProyectoDatos } from "../validators/proyectos.validator";
import { existeCarpeta, normalizarRuta } from "../utils/paths";

function pendiente(funcion: string): never {
  throw new Error(`proyectos.service.${funcion}: pendiente de implementar`);
}

// Convierte lo que devuelve el repositorio a la forma del contrato (quita id_estado)
function aRespuesta(p: ProyectoDetalle): ProyectoRespuesta {
  return {
    id_proyecto: p.id_proyecto,
    nombre: p.nombre,
    ruta_carpeta: p.ruta_carpeta,
    modelo_ia: p.modelo_ia,
    lenguajes: p.lenguajes,
    fecha_registro: p.fecha_registro,
    fecha_actualizacion: p.fecha_actualizacion,
    estado: p.estado,
  };
}

// HU02 (Jhon)
export async function listar(): Promise<ProyectoRespuesta[]> {
  const proyectos = await proyectosRepository.listar();
  return proyectos.map(aRespuesta);
}

// HU02 (Jhon): inexistente → AppError(404, "PROYECTO_NO_ENCONTRADO", ...)
export async function obtener(id: number): Promise<ProyectoRespuesta> {
  const proyecto = await proyectosRepository.obtenerPorId(id);
  if (!proyecto) {
    throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto no existe.");
  }
  return aRespuesta(proyecto);
}

const MODELO_POR_DEFECTO = "qwen2.5-coder";

// Validación de ruta compartida con HU03 (Pao): normaliza, comprueba que exista
// y que no esté registrada. `idIgnorar` evita chocar con el propio proyecto al editar.
async function validarRuta(ruta: string, idIgnorar?: number): Promise<string> {
  const rutaNormalizada = normalizarRuta(ruta);

  if (!(await existeCarpeta(rutaNormalizada))) {
    throw new AppError(400, "RUTA_INEXISTENTE", "La carpeta no existe en este equipo.");
  }

  const existente = await proyectosRepository.obtenerPorRuta(rutaNormalizada);
  if (existente && existente.id_proyecto !== idIgnorar) {
    throw new AppError(409, "RUTA_DUPLICADA", "Esa carpeta ya está registrada.");
  }

  return rutaNormalizada;
}

// HU01 (Jhon): normalizar ruta → 400 RUTA_INEXISTENTE → 409 RUTA_DUPLICADA
// → modelo por defecto → estado "activo" → insertar → devolver con obtener
export async function crear(datos: CrearProyectoDatos): Promise<ProyectoRespuesta> {
  const ruta = await validarRuta(datos.ruta_carpeta);
  const modelo = datos.modelo_ia ?? MODELO_POR_DEFECTO;

  const idEstado = await proyectosRepository.obtenerIdEstado("activo", "proyecto");
  if (idEstado === null) {
    throw new AppError(500, "ESTADO_NO_ENCONTRADO", "No existe el estado 'activo' en la base de datos.");
  }

  const id = await proyectosRepository.insertar({
    nombre: datos.nombre,
    ruta_carpeta: ruta,
    modelo_ia: modelo,
    id_estado: idEstado,
    lenguajes: datos.lenguajes,
  });

  return obtener(id);
}

// HU03 (Pao): reutiliza la validación de ruta de crear, ignora el propio proyecto
// al buscar duplicados, 404 si no existe
export async function actualizar(
  id: number,
  datos: ActualizarProyectoDatos
): Promise<ProyectoRespuesta> {
  // 404 si no existe (antes de validar nada más)
  const actual = await proyectosRepository.obtenerPorId(id);
  if (!actual) {
    throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto no existe.");
  }

  const cambios = { ...datos };

  // Solo se valida la ruta si llegó una. Se ignora el propio proyecto.
  if (datos.ruta_carpeta !== undefined) {
    cambios.ruta_carpeta = await validarRuta(datos.ruta_carpeta, id);
  }

  const filas = await proyectosRepository.actualizar(id, cambios);
  if (filas === 0) {
    throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto no existe.");
  }

  return obtener(id);
}

// HU04 (Pao): 0 filas → 404. Solo BD, nunca fs.
export async function eliminar(id: number): Promise<void> {
  const filasBorradas = await proyectosRepository.eliminar(id);
  if (filasBorradas === 0) {
    throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto no existe.");
  }
}