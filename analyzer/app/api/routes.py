from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas.analisis import EntradaAnalisis, EntradaEscaneo, JobCreado, SalidaAnalisis, SalidaEscaneo
from app.schemas.documentacion import EntradaDocumentacion, SalidaDocumentacion
from app.schemas.pruebas import EntradaPruebas, SalidaPruebas
from app.services import analyzer, doc_generator, escaner, modelos, ollama_client, reglas, test_generator
from app.services.archivo_fuente import ArchivoError

router = APIRouter()


@router.get("/salud")
def salud() -> dict:
    try:
        ollama_client.listar_modelos()
        ollama = "ok"
    except ollama_client.OllamaError:
        ollama = "error"
    return {"analyzer": "ok", "ollama": ollama}


@router.get("/modelos")
def listar_modelos() -> dict:
    return modelos.listar()


@router.post("/modelos/instalar", status_code=202)
def instalar(cuerpo: dict) -> JSONResponse:
    status, body = modelos.iniciar_instalacion(str(cuerpo.get("modelo", "")))
    return JSONResponse(status_code=status, content=body)


@router.get("/modelos/instalar")
def estado_instalacion(modelo: str) -> dict:
    return modelos.consultar_instalacion(modelo)


@router.post("/analisis", status_code=202, response_model=JobCreado)
def crear_analisis(entrada: EntradaAnalisis) -> JobCreado:
    return JobCreado(job_id=analyzer.crear_trabajo(entrada))


@router.get("/analisis/{job_id}", response_model=SalidaAnalisis)
def consultar_analisis(job_id: str) -> SalidaAnalisis:
    return analyzer.consultar(job_id)

@router.post("/escaneo", response_model=SalidaEscaneo)
def escanear(entrada: EntradaEscaneo) -> SalidaEscaneo:
    return escaner.escanear_lenguajes(entrada.ruta_base)

def _error_json(e: Exception) -> JSONResponse:
    contenido = {"codigo": e.codigo}
    if getattr(e, "mensaje", None):
        contenido["mensaje"] = e.mensaje
    return JSONResponse(status_code=e.status, content=contenido)


@router.post("/pruebas", response_model=SalidaPruebas)
def pruebas(entrada: EntradaPruebas):
    try:
        return test_generator.generar_pruebas(entrada)
    except (ArchivoError, ollama_client.OllamaError) as e:
        return _error_json(e)


@router.post("/documentacion", response_model=SalidaDocumentacion)
def documentacion(entrada: EntradaDocumentacion):
    try:
        return doc_generator.generar_documentacion(entrada)
    except (ArchivoError, ollama_client.OllamaError) as e:
        return _error_json(e)


@router.get("/reglas")
def listar_reglas() -> list[dict]:
    return reglas.catalogo()