"""Búsqueda semántica / RAG sobre el catálogo (Fase 4 — MLOps + RAG).

Expone la recuperación semántica con evidencia y la capa generativa fundamentada.
Es independiente del motor de recomendación: solo necesita el índice FAISS de
``models/rag_index/`` (generado por ``python -m src.pipeline index``).
"""
from fastapi import APIRouter, HTTPException, Query

from ml import semantic

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/semantic")
def semantic_search(
    q: str = Query(..., min_length=2, max_length=200, description="Consulta en lenguaje natural"),
    k: int = Query(10, ge=1, le=50),
    generate: bool = Query(False, description="Si true, añade una respuesta RAG generada"),
):
    """Recuperación semántica de películas con evidencia (tags) de pertinencia.

    Con ``generate=true`` añade una recomendación redactada (LLM o fallback).
    """
    try:
        result = semantic.rag(q, k) if generate else semantic.search(q, k)
    except FileNotFoundError as e:
        raise HTTPException(503, f"Índice semántico no disponible: {e}")
    return result
