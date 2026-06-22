"""Evaluación del recomendador y de la recuperación semántica.

Recomendador (ejercita el artefacto servido vía *folding-in*, mismo mecanismo que
el backend, con split temporal leave-last-one-out):
    - RMSE / MAE sobre el rating ocultado.
    - HitRate@K / NDCG@K rankeando el ítem ocultado contra negativos muestreados.

Recuperación: precisión por solapamiento de géneros sobre un set de consultas
etiquetadas + cobertura del índice. Mismo protocolo para comparar versiones.
"""
from __future__ import annotations

import pickle

import numpy as np
import pandas as pd

from src import config
from src.data import load_ratings
from src.utils import get_logger

log = get_logger("omnirec.evaluate")

BIAS_SHRINK = 10.0
FOLD_IN_REG = 0.1

# Consultas etiquetadas con los géneros esperados (precisión de recuperación).
RETRIEVAL_EVAL = [
    ("thriller psicológico sobre la memoria", {"Thriller", "Drama", "Mystery", "Sci-Fi"}),
    ("space opera épica con batallas espaciales", {"Sci-Fi", "Action", "Adventure"}),
    ("animación familiar con mensaje ecológico", {"Animation", "Children", "Comedy"}),
    ("neo-noir distópico con estética cyberpunk", {"Sci-Fi", "Thriller", "Action"}),
    ("comedia romántica ligera en parís", {"Comedy", "Romance"}),
    ("documental de naturaleza sobre océanos", {"Documentary"}),
]


# --------------------------------------------------------------- recomendador
def _fold_in(qi, bi, mu, idx, r):
    resid = r - mu - bi[idx]
    bu = float(resid.sum() / (len(resid) + BIAS_SHRINK))
    resid = resid - bu
    Q = qi[idx].astype(np.float64)
    A = Q.T @ Q + FOLD_IN_REG * len(idx) * np.eye(Q.shape[1])
    pu = np.linalg.solve(A, Q.T @ resid)
    return pu, bu


def evaluate_recommender() -> dict:
    cfg = config.pipeline_cfg()["evaluation"]
    seed = config.pipeline_cfg()["seed"]
    rng = np.random.default_rng(seed)

    with open(config.path("models") / "svd_model.pkl", "rb") as f:
        art = pickle.load(f)
    qi, bi, mu = art["item_factors"], art["item_biases"], art["global_mean"]
    iid_to_inner = {int(m): i for i, m in enumerate(art["item_raw_ids"])}
    all_inner = np.arange(qi.shape[0])

    ratings, label = load_ratings()
    ratings = ratings[ratings["movieId"].isin(iid_to_inner)]
    counts = ratings.groupby("userId").size()
    eligible = counts[counts >= cfg["min_user_ratings"]].index.to_numpy()
    rng.shuffle(eligible)
    eligible = eligible[: cfg["max_eval_users"]]
    ratings = ratings[ratings["userId"].isin(eligible)].sort_values(["userId", "timestamp"])

    k = cfg["top_k"]
    se, ae, n = 0.0, 0.0, 0
    hits, ndcg, n_rank = 0, 0.0, 0
    for _, g in ratings.groupby("userId", sort=False):
        inner = g["movieId"].map(iid_to_inner).to_numpy()
        r = g["rating"].to_numpy(dtype=np.float64)
        if len(inner) < 2:
            continue
        test_i, test_r = inner[-1], r[-1]
        prof_i, prof_r = inner[:-1], r[:-1]
        pu, bu = _fold_in(qi, bi, mu, prof_i, prof_r)

        pred = mu + bu + bi[test_i] + qi[test_i] @ pu
        pred = float(np.clip(pred, 0.5, 5.0))
        se += (pred - test_r) ** 2
        ae += abs(pred - test_r)
        n += 1

        # ranking leave-one-out contra 99 negativos no vistos por el usuario
        seen = set(inner.tolist())
        negs = rng.choice(all_inner, size=200, replace=False)
        negs = np.array([j for j in negs if j not in seen])[:99]
        cand = np.append(negs, test_i)
        scores = mu + bu + bi[cand] + qi[cand] @ pu
        rank = int((scores >= scores[-1]).sum())  # posición del ítem de test (1 = mejor)
        if rank <= k:
            hits += 1
            ndcg += 1.0 / np.log2(rank + 1)
        n_rank += 1

    return {
        "dataset": label,
        "eval_users": int(n),
        "rmse": round((se / n) ** 0.5, 4) if n else None,
        "mae": round(ae / n, 4) if n else None,
        f"hitrate@{k}": round(hits / n_rank, 4) if n_rank else None,
        f"ndcg@{k}": round(ndcg / n_rank, 4) if n_rank else None,
    }


# --------------------------------------------------------------- recuperación
def evaluate_retrieval(k: int = 10) -> dict:
    from src.index import load_index
    from src.search import semantic_search

    precisions = []
    per_query = []
    for query, expected in RETRIEVAL_EVAL:
        res = semantic_search(query, k)["results"]
        hits = [bool(set(r["genres"]) & expected) for r in res]
        p = sum(hits) / len(hits) if hits else 0.0
        precisions.append(p)
        per_query.append({"query": query, "precision@k": round(p, 3)})

    meta = load_index().meta
    coverage = float(meta["has_genome"].mean()) if "has_genome" in meta else None
    return {
        "queries": len(RETRIEVAL_EVAL),
        "k": k,
        "mean_precision@k": round(float(np.mean(precisions)), 4),
        "coverage_genome": round(coverage, 4) if coverage is not None else None,
        "per_query": per_query,
    }


def evaluate_all() -> dict:
    log.info("Evaluando recomendador (folding-in, leave-last-one-out)...")
    rec = evaluate_recommender()
    log.info("Recomendador: %s", rec)
    log.info("Evaluando recuperación semántica...")
    ret = evaluate_retrieval()
    log.info("Recuperación: mean P@k=%s, cobertura=%s",
             ret["mean_precision@k"], ret["coverage_genome"])
    return {"recommender": rec, "retrieval": ret}


if __name__ == "__main__":
    import json
    print(json.dumps(evaluate_all(), indent=2, ensure_ascii=False))
