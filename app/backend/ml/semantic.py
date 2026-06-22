"""Puente entre el backend FastAPI y el componente RAG de ``src/`` (Fase 4).

Carga el índice semántico una sola vez (singleton) y expone la recuperación con
evidencia y la capa generativa. El paquete ``src`` se resuelve añadiendo la raíz
del proyecto al ``sys.path``; sus rutas internas son absolutas (basadas en
``__file__``), así que funcionan sin importar el directorio de trabajo.
"""
from __future__ import annotations

import sys
from functools import lru_cache
from pathlib import Path

# app/backend/ml/ -> raíz del proyecto
_ROOT = Path(__file__).resolve().parents[3]
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))


@lru_cache(maxsize=1)
def _ready() -> bool:
    """Carga perezosa del índice (calienta el encoder y FAISS)."""
    from src.search import get_searcher

    get_searcher()
    return True


def search(query: str, k: int | None = None) -> dict:
    from src.search import semantic_search

    _ready()
    return semantic_search(query, k)


def rag(query: str, k: int | None = None) -> dict:
    """Recuperación + respuesta generada (LLM o fallback por plantilla)."""
    from src.generate import rag_answer

    _ready()
    return rag_answer(query, k)


def warmup() -> None:
    _ready()
