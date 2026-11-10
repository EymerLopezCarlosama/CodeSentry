from pydantic import BaseModel


class EntradaDocumentacion(BaseModel):
    ruta_base: str
    ruta_relativa: str
    modelo: str | None = None


class SalidaDocumentacion(BaseModel):
    contenido: str
    aviso: str | None = None
