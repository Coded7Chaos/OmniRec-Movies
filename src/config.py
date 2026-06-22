"""Carga de configuración YAML y resolución de rutas del proyecto.

Todas las rutas de ``config/pipeline.yaml`` se interpretan relativas a la raíz
del repositorio (``ROOT``), de modo que el pipeline funciona igual sin importar
desde qué directorio se invoque.
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml

# src/ -> raíz del proyecto
ROOT = Path(__file__).resolve().parents[1]
CONFIG_DIR = ROOT / "config"


def _load_yaml(name: str) -> dict:
    path = CONFIG_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"No se encontró el archivo de configuración: {path}")
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f)


@lru_cache(maxsize=1)
def pipeline_cfg() -> dict:
    return _load_yaml("pipeline.yaml")


@lru_cache(maxsize=1)
def rag_cfg() -> dict:
    return _load_yaml("rag.yaml")


@lru_cache(maxsize=1)
def monitoring_cfg() -> dict:
    return _load_yaml("monitoring.yaml")


def path(key: str) -> Path:
    """Devuelve una ruta de ``pipeline.yaml:paths`` resuelta a absoluta."""
    paths = pipeline_cfg()["paths"]
    if key not in paths:
        raise KeyError(f"Ruta '{key}' no definida en pipeline.yaml:paths")
    return (ROOT / paths[key]).resolve()


def resolve(rel: str | Path) -> Path:
    """Resuelve una ruta relativa al proyecto a absoluta."""
    p = Path(rel)
    return p if p.is_absolute() else (ROOT / p).resolve()
