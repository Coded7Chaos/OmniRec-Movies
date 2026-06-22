"""Reentrenamiento del modelo SVD ganador (el flujo reproducible de actualización).

Reproduce los hiperparámetros del notebook 03 (config/pipeline.yaml:svd) sobre los
ratings disponibles y guarda un artefacto compacto para inferencia, junto con los
clústeres KMeans. Es la pieza "flujo reproducible de actualización de
recomendaciones" de la fase MLOps.
"""
from __future__ import annotations

import pickle
import random
import time
from pathlib import Path

import numpy as np
import pandas as pd

from src import config
from src.data import load_movies, load_ratings
from src.utils import get_logger

log = get_logger("omnirec.train")


def train_svd() -> dict:
    """Entrena SVD + KMeans y guarda models/svd_model.pkl. Devuelve metadatos."""
    cfg = config.pipeline_cfg()
    svd_cfg = cfg["svd"]
    seed = cfg["seed"]
    random.seed(seed)
    np.random.seed(seed)

    from surprise import SVD, Dataset, Reader

    ratings, dataset_label = load_ratings()
    movies = load_movies()

    reader = Reader(rating_scale=(0.5, 5.0))
    trainset = Dataset.load_from_df(
        ratings[["userId", "movieId", "rating"]], reader
    ).build_full_trainset()

    t0 = time.time()
    svd = SVD(
        n_factors=svd_cfg["n_factors"], n_epochs=svd_cfg["n_epochs"],
        lr_all=svd_cfg["lr_all"], reg_all=svd_cfg["reg_all"], random_state=seed,
    )
    svd.fit(trainset)
    train_secs = round(time.time() - t0, 1)
    log.info("SVD entrenado en %ss (qi=%s, mu=%.4f)", train_secs, svd.qi.shape, trainset.global_mean)

    from sklearn.cluster import KMeans

    km_users = KMeans(n_clusters=svd_cfg["k_user_clusters"], random_state=seed, n_init=10)
    user_labels = km_users.fit_predict(svd.pu)
    km_items = KMeans(n_clusters=svd_cfg["k_item_clusters"], random_state=seed, n_init=10)
    km_items.fit(svd.qi)

    inner_to_raw_i = np.array(
        [trainset.to_raw_iid(i) for i in range(trainset.n_items)], dtype=np.int32
    )
    inner_to_raw_u = np.array(
        [trainset.to_raw_uid(u) for u in range(trainset.n_users)], dtype=np.int32
    )
    profiles = _cluster_profiles(ratings, movies, inner_to_raw_u, user_labels,
                                 svd_cfg["k_user_clusters"])

    artifact = {
        "algo": "SVD",
        "dataset": dataset_label,
        "hyperparams": {k: svd_cfg[k] for k in ("n_factors", "n_epochs", "lr_all", "reg_all")}
        | {"seed": seed},
        "global_mean": float(trainset.global_mean),
        "item_raw_ids": inner_to_raw_i,
        "item_factors": svd.qi.astype(np.float32),
        "item_biases": svd.bi.astype(np.float32),
        "user_cluster_centroids": km_users.cluster_centers_.astype(np.float32),
        "item_cluster_centroids": km_items.cluster_centers_.astype(np.float32),
        "user_cluster_profiles": profiles,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    out = config.path("models") / "svd_model.pkl"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "wb") as f:
        pickle.dump(artifact, f)
    size_mb = out.stat().st_size / 1024 / 1024
    log.info("Artefacto guardado: %s (%.1f MB)", out, size_mb)

    return {
        "path": str(out),
        "dataset": dataset_label,
        "n_ratings": int(len(ratings)),
        "n_users": int(ratings["userId"].nunique()),
        "n_items": int(ratings["movieId"].nunique()),
        "train_secs": train_secs,
        "hyperparams": artifact["hyperparams"],
    }


def _cluster_profiles(ratings, movies, inner_to_raw_u, labels, k):
    """Perfil de géneros por clúster (lift) para nombrar comunidades."""
    user_df = pd.DataFrame({"userId": inner_to_raw_u, "cluster": labels})
    merged = (ratings.merge(user_df, on="userId")
              .merge(movies[["movieId", "genres"]], on="movieId", how="left"))
    exploded = merged.assign(genre=merged["genres"].str.split("|")).explode("genre")
    exploded = exploded[exploded["genre"] != "(no genres listed)"]
    global_share = exploded["genre"].value_counts(normalize=True)
    profiles = []
    for c in range(k):
        sub = exploded[exploded["cluster"] == c]
        share = sub["genre"].value_counts(normalize=True)
        lift = (share / global_share).dropna()
        lift = lift[share[lift.index] > 0.01].sort_values(ascending=False)
        top = lift.head(4).index.tolist()
        profiles.append({
            "cluster": c,
            "n_users": int(sub["userId"].nunique()),
            "avg_rating": float(sub["rating"].mean()) if len(sub) else 0.0,
            "top_genres": top,
            "genre_lift": {g: float(lift[g]) for g in top},
        })
    return profiles


if __name__ == "__main__":
    print(train_svd())
