from typing import Literal, Optional
from pydantic import BaseModel, Field, model_validator

Lenguaje = Literal["js", "ts", "py"]
Objetivo = Literal["carpeta", "archivo"]
TipoHallazgo = Literal["vulnerabilidad", "mala_practica", "refactorizacion"]
Severidad = Literal["baja", "media", "alta", "critica"]
EstadoTrabajo = Literal["en_proceso", "completado", "fallido"]


class EntradaAnalisis(BaseModel):
    ruta_base: str = Field(min_length=1)
    objetivo: Objetivo
    ruta_relativa: Optional[str] = None
    modelo: str = Field(min_length=1, max_length=50)
    lenguajes: list[Lenguaje] = Field(min_length=1)

    @model_validator(mode="after")
    def _ruta_relativa_si_archivo(self):
        if self.objetivo == "archivo" and not self.ruta_relativa:
            raise ValueError("ruta_relativa es obligatoria cuando objetivo es 'archivo'")
        return self


class Hallazgo(BaseModel):
    ruta_relativa: str
    tipo: TipoHallazgo
    severidad: Severidad
    linea_codigo: int = Field(ge=1)
    descripcion: str = Field(min_length=1)


class Progreso(BaseModel):
    procesados: int = 0
    total: int = 0


class Omitido(BaseModel):
    ruta_relativa: str
    motivo: str


class ErrorArchivo(BaseModel):
    ruta_relativa: str
    motivo: str


class SalidaAnalisis(BaseModel):
    estado: EstadoTrabajo
    progreso: Progreso
    resultados: list[Hallazgo] = []
    omitidos: list[Omitido] = []
    errores: list[ErrorArchivo] = []


class JobCreado(BaseModel):
    job_id: str