"""Encoder de embeddings basado en Sentence-Transformers (preentrenado, inferencia).

Cumple la Política oficial sobre Transformers (guía §4): modelo preentrenado en
modo inferencia, en CPU, sin fine-tuning. Devuelve vectores normalizados L2 para
que el producto interno equivalga al coseno.
"""
from __future__ import annotations

import math
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
    bs = batch_size or cfg["batch_size"]

    if not show_progress:
        emb = model.encode(
            texts,
            batch_size=bs,
            normalize_embeddings=cfg["normalize"],
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return emb.astype(np.float32)

    # Batching manual para que el progreso aparezca en logs de Docker (sin TTY).
    n = len(texts)
    n_batches = math.ceil(n / bs)
    log_every = max(1, n_batches // 10)
    parts = []
    for i in range(0, n, bs):
        batch_emb = model.encode(
            texts[i:i + bs],
            batch_size=bs,
            normalize_embeddings=cfg["normalize"],
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        parts.append(batch_emb)
        bn = i // bs + 1
        if bn % log_every == 0 or bn == n_batches:
            log.info("Codificando... %d%% (%d/%d batches)",
                     round(bn / n_batches * 100), bn, n_batches)
    return np.vstack(parts).astype(np.float32)


def embedding_dim() -> int:
    return int(get_encoder().get_sentence_embedding_dimension())


def model_name() -> str:
    return config.rag_cfg()["encoder"]["model_name"]
