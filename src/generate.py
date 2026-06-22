"""Capa RAG generativa: retrieve -> augment -> generate.

Toma los resultados de la recuperación semántica y redacta una recomendación
fundamentada **citando solo las películas recuperadas** (anti-alucinación).

- Con ``ANTHROPIC_API_KEY``: usa el LLM Claude (modelo de config/rag.yaml) en
  modo inferencia (cumple la Política de Transformers §4).
- Sin clave o ante cualquier error de red: cae a una **plantilla determinista**
  construida a partir de los hits. Así la demo y la reproducibilidad nunca
  dependen de la red.
"""
from __future__ import annotations

import os

from src import config
from src.utils import get_logger

log = get_logger("omnirec.generate")

_SYSTEM = (
    "Eres el asistente de recomendación de OmniCine. Respondes en español neutro, "
    "con tono cercano y profesional. Recomiendas SOLO películas presentes en el "
    "contexto recuperado; NUNCA inventes títulos que no estén en la lista. "
    "Explica brevemente por qué cada película encaja con la consulta usando sus "
    "géneros y temas. Sé conciso (máximo un párrafo introductorio y una lista breve)."
)


def _format_context(results: list[dict]) -> str:
    lines = []
    for i, r in enumerate(results, 1):
        year = f" ({r['year']})" if r.get("year") else ""
        genres = ", ".join(r.get("genres", []))
        evidence = ", ".join(r.get("evidence", []))
        lines.append(
            f"{i}. {r['title']}{year} — géneros: {genres or 'n/d'}; "
            f"temas relevantes: {evidence or 'n/d'}; afinidad: {r['similarity']:.2f}"
        )
    return "\n".join(lines)


def _template_answer(query: str, results: list[dict]) -> str:
    """Respuesta determinista (sin LLM): fundamentada en los hits recuperados."""
    if not results:
        return f"No encontré películas que encajen con «{query}»."
    top = results[: min(5, len(results))]
    parts = [
        f"Para «{query}», estas son las películas más afines de nuestro catálogo:"
    ]
    for r in top:
        year = f" ({r['year']})" if r.get("year") else ""
        evidence = ", ".join(r.get("evidence", [])) or ", ".join(r.get("genres", []))
        parts.append(f"• {r['title']}{year} — encaja por: {evidence}.")
    return "\n".join(parts)


def _llm_answer(query: str, results: list[dict], cfg: dict) -> str:
    import anthropic

    client = anthropic.Anthropic()  # lee ANTHROPIC_API_KEY del entorno
    user = (
        f"Consulta del usuario: «{query}»\n\n"
        f"Películas recuperadas (usa solo estas):\n{_format_context(results)}\n\n"
        "Redacta una recomendación fundamentada citando estas películas."
    )
    msg = client.messages.create(
        model=cfg["model"],
        max_tokens=cfg["max_tokens"],
        system=_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in msg.content if b.type == "text").strip()


def generate_answer(query: str, results: list[dict]) -> dict:
    """Devuelve {'answer', 'mode'} donde mode ∈ {'llm', 'template'}."""
    cfg = config.rag_cfg()["generation"]
    if cfg.get("enabled") and os.getenv("ANTHROPIC_API_KEY"):
        try:
            answer = _llm_answer(query, results, cfg)
            if answer:
                return {"answer": answer, "mode": "llm", "model": cfg["model"]}
        except Exception as e:  # noqa: BLE001
            log.warning("Generación LLM falló (%s); usando fallback por plantilla.", e)
    return {"answer": _template_answer(query, results), "mode": "template", "model": None}


def rag_answer(query: str, k: int | None = None) -> dict:
    """Pipeline completo retrieve -> generate (usado por el backend y la demo CLI)."""
    from src.search import semantic_search

    retrieved = semantic_search(query, k)
    gen = generate_answer(query, retrieved["results"])
    return {**retrieved, **gen}
