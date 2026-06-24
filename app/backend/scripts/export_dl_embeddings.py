"""Exporta los *embeddings* de ítem del modelo Deep Learning (notebook 04) a un
artefacto compacto que el backend sirve para "películas similares".

    python app/backend/scripts/export_dl_embeddings.py

Lee ``models/mf_model.pt`` (MF+Bias entrenado en `04_DeepLearning_Embeddings.ipynb`)
y escribe ``models/dl_item_embeddings.pkl`` = {item_ids, embeddings, arch, dim}.
El backend (``ml/engine.py``) lo carga de forma opcional: si falta, "similares"
cae al espacio latente del SVD sin romper nada.
"""
from __future__ import annotations

import pickle
from pathlib import Path

import numpy as np
import torch

ROOT = Path(__file__).resolve().parents[3]
MODELS = ROOT / "models"
SRC = MODELS / "mf_model.pt"
OUT = MODELS / "dl_item_embeddings.pkl"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(
            f"No existe {SRC}.\nEjecuta el notebook 04 (04_DeepLearning_Embeddings.ipynb) "
            "para generar mf_model.pt."
        )

    ckpt = torch.load(SRC, map_location="cpu", weights_only=False)
    state = ckpt["state_dict"]
    item2idx: dict[int, int] = ckpt["item2idx"]

    emb = state["i_emb.weight"].cpu().numpy().astype(np.float32)  # (n_items, dim)
    idx2item = {v: k for k, v in item2idx.items()}
    item_ids = np.array([idx2item[i] for i in range(emb.shape[0])], dtype=np.int64)

    art = {
        "item_ids": item_ids,
        "embeddings": emb,
        "arch": ckpt.get("arch", "MFBias"),
        "dim": int(emb.shape[1]),
        "source": "notebook 04 (mf_model.pt)",
    }
    with open(OUT, "wb") as f:
        pickle.dump(art, f)
    print(f"OK -> {OUT}  ({emb.shape[0]:,} ítems · dim={emb.shape[1]})")


if __name__ == "__main__":
    main()
