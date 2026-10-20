from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.services.analyzer import JobNoEncontradoError
from app.services.file_scanner import RutaInexistenteError
from app.services.modelos import DescargaNoEncontradaError, ModeloNoPermitidoError
from app.services.ollama_client import OllamaError

app = FastAPI(title="CodeSentry Analyzer")
app.include_router(router)


# Errores propios -> { "codigo": "..." } con el status del contrato
async def _error_propio(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=getattr(exc, "status", 500), content={"codigo": getattr(exc, "codigo", "ERROR")})


for _cls in (
    OllamaError,
    ModeloNoPermitidoError,
    DescargaNoEncontradaError,
    RutaInexistenteError,
    JobNoEncontradoError,
):
    app.add_exception_handler(_cls, _error_propio)