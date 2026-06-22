"""Índice vectorial de la recuperación semántica (FAISS, con fallback NumPy).

Construye y persiste el índice a partir de los descriptores:
    models/rag_index/
        embeddings.npy   matriz (n, d) float32 normalizada
        index.faiss      índice IndexFlatIP (si backend=faiss)
        meta.parquet     metadatos alineados por fila con los embeddings
        manifest.json    versión, modelo, dimensiones, hashes (trazabilidad)

El producto interno sobre vectores normalizados equivale al coseno, por eso un
``IndexFlatIP`` exacto es suficiente y reproducible para 55 K películas.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd

from src import config, embeddings
from src.descriptors import build_descriptors, load_descriptors, save_descriptors
from src.utils import get_logger, sha256_bytes

log = get_logger("omnirec.index")

_META_COLS = ["movieId", "title", "year", "genres", "top_tags", "has_genome",
              "n_ratings", "descriptor"]


def _index_dir() -> Path:
    d = config.path("rag_index")
    d.mkdir(parents=True, exist_ok=True)
    return d


# --------------------------------------------------------------------------- build
def build_index(rebuild_descriptors: bool = True) -> dict:
    """Construye embeddings + índice FAISS y persiste todos los artefactos."""
    cfg = config.rag_cfg()
    if rebuild_descriptors:
        desc = build_descriptors()
        save_descriptors(desc)
    else:
        desc = load_descriptors()

    desc = desc.reset_index(drop=True)
    log.info("Codificando %d descriptores con %s...", len(desc), embeddings.model_name())
    emb = embeddings.encode(desc["descriptor"].tolist(), show_progress=True)

    d = _index_dir()
    np.save(d / "embeddings.npy", emb)
    desc[_META_COLS].to_parquet(d / "meta.parquet", index=False)

    # Embeddings de los tags genome -> evidencia de pertinencia condicionada a la
    # consulta (qué tags de cada película explican mejor el match).
    from src.data import load_genome_tags

    tags = load_genome_tags().sort_values("tagId")
    tag_names = tags["tag"].tolist()
    log.info("Codificando %d tags genome para evidencia...", len(tag_names))
    tag_emb = embeddings.encode(tag_names)
    np.save(d / "tag_embeddings.npy", tag_emb)
    (d / "tags.json").write_text(
        json.dumps(tag_names, ensure_ascii=False), encoding="utf-8"
    )

    backend = cfg["index"]["backend"]
    if backend == "faiss":
        backend = _build_faiss(emb, d)

    manifest = {
        "artifact": "rag_index",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "encoder": embeddings.model_name(),
        "dim": int(emb.shape[1]),
        "n_items": int(emb.shape[0]),
        "backend": backend,
        "metric": cfg["index"]["metric"],
        "descriptor_top_tags": cfg["descriptors"]["top_tags"],
        "descriptor_min_relevance": cfg["descriptors"]["min_relevance"],
        "coverage_genome": float(desc["has_genome"].mean()),
        "embeddings_sha256": sha256_bytes(emb.tobytes()),
    }
    with open(d / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    log.info("Índice construido: %s (backend=%s, %d x %d)",
             d, backend, manifest["n_items"], manifest["dim"])
    return manifest


def _build_faiss(emb: np.ndarray, out_dir: Path) -> str:
    try:
        import faiss
    except ImportError:
        log.warning("faiss no disponible; se usará backend NumPy.")
        return "numpy"
    index = faiss.IndexFlatIP(emb.shape[1])
    index.add(emb)
    faiss.write_index(index, str(out_dir / "index.faiss"))
    return "faiss"


# --------------------------------------------------------------------------- load / search
@dataclass
class SemanticIndex:
    meta: pd.DataFrame
    manifest: dict
    _emb: np.ndarray | None = None
    _faiss: object | None = None

    @property
    def n_items(self) -> int:
        return len(self.meta)

    def search(self, query_vec: np.ndarray, k: int) -> list[tuple[int, float]]:
        """Devuelve [(posición_fila, score_coseno)] de los k vecinos más cercanos."""
        q = np.ascontiguousarray(query_vec.reshape(1, -1).astype(np.float32))
        if self._faiss is not None:
            scores, idx = self._faiss.search(q, k)
            return [(int(i), float(s)) for i, s in zip(idx[0], scores[0]) if i >= 0]
        sims = (self._emb @ q[0])
        top = np.argpartition(-sims, min(k, len(sims) - 1))[:k]
        top = top[np.argsort(-sims[top])]
        return [(int(i), float(sims[i])) for i in top]

    def row(self, pos: int) -> pd.Series:
        return self.meta.iloc[pos]


def load_index() -> SemanticIndex:
    d = _index_dir()
    man_path = d / "manifest.json"
    if not man_path.exists():
        raise FileNotFoundError(
            f"No existe el índice en {d}. Ejecuta la etapa 'index' del pipeline."
        )
    manifest = json.loads(man_path.read_text(encoding="utf-8"))
    meta = pd.read_parquet(d / "meta.parquet")

    if manifest.get("backend") == "faiss":
        try:
            import faiss
            idx = faiss.read_index(str(d / "index.faiss"))
            return SemanticIndex(meta=meta, manifest=manifest, _faiss=idx)
        except Exception as e:  # noqa: BLE001
            log.warning("No se pudo cargar FAISS (%s); fallback NumPy.", e)
    emb = np.load(d / "embeddings.npy")
    return SemanticIndex(meta=meta, manifest=manifest, _emb=emb)


if __name__ == "__main__":
    build_index()
