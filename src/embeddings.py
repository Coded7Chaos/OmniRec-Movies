"""Encoder de embeddings basado en Sentence-Transformers (preentrenado, inferencia).

Cumple la Política oficial sobre Transformers (guía §4): modelo preentrenado en
modo inferencia, en CPU, sin fine-tuning. Devuelve vectores normalizados L2 para
que el producto interno equivalga al coseno.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np

from src import config
from src.utils import get_logger

log = get_logger("omnirec.embeddings")


@lru_cache(maxsize=2)
def _load_model(model_name: str, device: str):
    """Carga perezosa del modelo (se descarga una sola vez y queda en cache local)."""
    from sentence_transformers import SentenceTransformer

    log.info("Cargando encoder '%s' en %s...", model_name, device)
    return SentenceTransformer(model_name, device=device)


def get_encoder():
    cfg = config.rag_cfg()["encoder"]
    return _load_model(cfg["model_name"], cfg["device"])


def encode(texts: list[str], batch_size: int | None = None,
           show_progress: bool = False) -> np.ndarray:
    """Codifica una lista de textos a una matriz (n, d) float32 normalizada."""
    cfg = config.rag_cfg()["encoder"]
    model = get_encoder()
    emb = model.encode(
        texts,
        batch_size=batch_size or cfg["batch_size"],
        normalize_embeddings=cfg["normalize"],
        convert_to_numpy=True,
        show_progress_bar=show_progress,
    )
    return emb.astype(np.float32)


def embedding_dim() -> int:
    return int(get_encoder().get_sentence_embedding_dimension())


def model_name() -> str:
    return config.rag_cfg()["encoder"]["model_name"]
