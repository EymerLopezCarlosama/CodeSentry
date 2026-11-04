import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# analyzer/.env (cada servicio lee el suyo)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


def _lista(nombre: str, defecto: str) -> list[str]:
    return [p.strip() for p in os.getenv(nombre, defecto).split(",") if p.strip()]


@dataclass(frozen=True)
class Settings:
    OLLAMA_URL: str = field(default_factory=lambda: os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/"))
    OLLAMA_DEFAULT_MODEL: str = field(default_factory=lambda: os.getenv("OLLAMA_DEFAULT_MODEL", "qwen2.5-coder"))
    IGNORED_DIRS: list[str] = field(
        default_factory=lambda: _lista(
            "IGNORED_DIRS", "node_modules,.git,dist,build,__pycache__,.venv,tests,__tests__,fixtures"
        )
    )
    SUPPORTED_EXTENSIONS: list[str] = field(default_factory=lambda: _lista("SUPPORTED_EXTENSIONS", ".js,.ts,.py"))
    ANALYZER_PORT: int = field(default_factory=lambda: int(os.getenv("ANALYZER_PORT", "8000")))
    MODELOS_PERMITIDOS: list[str] = field(
        default_factory=lambda: _lista("MODELOS_PERMITIDOS", "qwen2.5-coder,llama3")
    )

    # Límites del escáner
    ESCANEO_MAX_ARCHIVOS: int = 1000
    ESCANEO_MAX_SEGUNDOS: float = 30.0

    # Constantes fijas (docs/analyzer-contract.md)
    TIMEOUT_ARCHIVO: int = 120  # segundos máximos por llamada a Ollama

    # Explicaciones con IA
    EXPLICACIONES_MAX: int = field(default_factory=lambda: int(os.getenv("EXPLICACIONES_MAX", "25")))
    EXPLICACIONES_SEGUNDOS: int = 300  # presupuesto total de la fase de explicaciones


settings = Settings()