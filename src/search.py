"""Recuperación semántica: consulta en lenguaje natural -> películas + evidencia.

Carga el índice FAISS (singleton) y, por cada resultado, calcula la *evidencia
de pertinencia*: los tags genome de la película que más se parecen a la consulta,
para que la recuperación "evidencie pertinencia" (guía §12) y no sea una caja negra.
"""
from __future__ import annotations

import json
from functools import lru_cache

import numpy as np

from src import config, embeddings
from src.index import SemanticIndex, load_index
from src.utils import get_logger

log = get_logger("omnirec.search")


class SemanticSearcher:
    def __init__(self, index: SemanticIndex) -> None:
        self.index = index
        d = config.path("rag_index")
        self._tag_emb: np.ndarray | None = None
        self._tags: list[str] | None = None
        tag_path = d / "tag_embeddings.npy"
        if tag_path.exists():
            self._tag_emb = np.load(tag_path)
            self._tags = json.loads((d / "tags.json").read_text(encoding="utf-8"))
            self._tag_pos = {t: i for i, t in enumerate(self._tags)}
        col = self.index.meta.get("n_ratings")
        self._max_log_n = float(np.log1p(int(col.max()))) if col is not None and len(col) else 1.0
        self._max_log_n = self._max_log_n or 1.0

    # ---------------------------------------------------------------- evidencia
    def _evidence(self, query_vec: np.ndarray, top_tags: list[str], n: int = 3) -> list[str]:
        """Tags de la película ordenados por similitud con la consulta."""
        if self._tag_emb is None or not top_tags:
            return top_tags[:n]
        present = [t for t in top_tags if t in self._tag_pos]
        if not present:
            return top_tags[:n]
        idx = [self._tag_pos[t] for t in present]
        sims = self._tag_emb[idx] @ query_vec
        order = np.argsort(-sims)[:n]
        return [present[i] for i in order]

    # ---------------------------------------------------------------- búsqueda
    def search(self, query: str, k: int | None = None) -> dict:
        cfg = config.rag_cfg()["search"]
        k = min(k or cfg["default_k"], cfg["max_k"])
        alpha = float(cfg.get("rerank_alpha", 0.0))
        pool = max(int(cfg.get("pool", k)), k)

        qvec = embeddings.encode([query])[0]
        hits = self.index.search(qvec, pool)

        # Re-ranking: coseno semántico + prior de popularidad (log-normalizado).
        # Vincula la recuperación con la señal del recomendador y prioriza
        # películas conocidas/con genome frente a long-tail homónimo.
        scored = []
        for pos, sim in hits:
            row = self.index.row(pos)
            pop = float(np.log1p(row.get("n_ratings", 0))) / self._max_log_n
            scored.append((pos, sim, alpha * pop + sim))
        scored.sort(key=lambda x: -x[2])

        results = []
        for pos, sim, final in scored[:k]:
            row = self.index.row(pos)
            top_tags = list(row["top_tags"]) if row["top_tags"] is not None else []
            results.append({
                "movieId": int(row["movieId"]),
                "title": row["title"],
                "year": int(row["year"]) if row["year"] == row["year"] else None,  # NaN-safe
                "genres": list(row["genres"]) if row["genres"] is not None else [],
                "similarity": round(float(sim), 4),
                "score": round(float(final), 4),
                "numRatings": int(row.get("n_ratings", 0)),
                "evidence": self._evidence(qvec, top_tags),
                "descriptor": row["descriptor"],
            })
        return {
            "query": query,
            "k": k,
            "encoder": self.index.manifest.get("encoder"),
            "rerank_alpha": alpha,
            "results": results,
        }


@lru_cache(maxsize=1)
def get_searcher() -> SemanticSearcher:
    return SemanticSearcher(load_index())


def semantic_search(query: str, k: int | None = None) -> dict:
    return get_searcher().search(query, k)
