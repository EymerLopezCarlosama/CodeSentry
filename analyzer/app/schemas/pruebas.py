from typing import Literal
from pydantic import BaseModel

class EntradaPruebas(BaseModel):
    ruta_base: str
    ruta_relativa: str
    modelo: str | None = None

class SalidaPruebas(BaseModel):
    framework: Literal["jest", "pytest"]
    contenido: str
    aviso: str | None = None