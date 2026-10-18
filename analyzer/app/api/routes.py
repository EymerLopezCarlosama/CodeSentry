from fastapi import APIRouter

from app.services import modelos, ollama_client

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
def instalar(cuerpo: dict):
    from fastapi.responses import JSONResponse

    status, body = modelos.iniciar_instalacion(str(cuerpo.get("modelo", "")))
    return JSONResponse(status_code=status, content=body)


@router.get("/modelos/instalar")
def estado_instalacion(modelo: str) -> dict:
    return modelos.consultar_instalacion(modelo)