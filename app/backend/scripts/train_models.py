"""Re-entrena el modelo ganador (SVD) del notebook 03 y genera el artefacto de servicio.

Reproduce los hiperparámetros exactos de `notebooks/03_ML_Baseline_AutoML.ipynb`
(SVD: n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02, SEED=42) y el
clustering KMeans (k=6) sobre los embeddings de usuarios e ítems.

Usa `ratings_prepared_60pct.parquet` si existe; de lo contrario cae al dataset
disponible `ratings_knn_10pct.parquet` (el parquet del 60% no se conserva en el
repositorio por tamaño).

Salida: `models/svd_model.pkl` — dict compacto con todo lo necesario para
inferencia en el backend (factores de ítems, sesgos, media global, centroides
de clústeres y perfiles de género por clúster). No se serializa el objeto
Surprise completo para mantener el artefacto liviano y libre de dependencias
de versión.

Uso:  venv/bin/python app/backend/scripts/train_models.py
"""
from __future__ import annotations

import pickle
import random
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "venv" / "lib" / "python3.12" / "site-packages"))

from sklearn.cluster import KMeans  # noqa: E402
from surprise import SVD, Dataset, Reader  # noqa: E402

SEED = 42
N_FACTORS = 50
N_EPOCHS = 20
LR_ALL = 0.005
REG_ALL = 0.02
K_USERS_CLUSTERS = 6
K_ITEMS_CLUSTERS = 6

DATA_INT_DIR = ROOT / "data" / "intermediate"
MODELS_DIR = ROOT / "models"


def load_ratings() -> tuple[pd.DataFrame, str]:
    main_60 = DATA_INT_DIR / "ratings_prepared_60pct.parquet"
    knn_10 = DATA_INT_DIR / "ratings_knn_10pct.parquet"
    if main_60.exists():
        path, label = main_60, "MAIN 60%"
    elif knn_10.exists():
        path, label = knn_10, "KNN 10%"
    else:
        raise FileNotFoundError(
            "No se encontró ningún parquet de ratings en data/intermediate/. "
            "Ejecuta el notebook 02 primero."
        )
    df = pd.read_parquet(path).astype(
        {"userId": "int32", "movieId": "int32", "rating": "float32"}
    )
    return df, label


def main() -> None:
    random.seed(SEED)
    np.random.seed(SEED)

    ratings, dataset_label = load_ratings()
    movies = pd.read_parquet(DATA_INT_DIR / "movies_prepared_60pct.parquet")
    print(f"Dataset: {dataset_label}  ({len(ratings):,} ratings, "
          f"{ratings['userId'].nunique():,} usuarios, {ratings['movieId'].nunique():,} películas)")

    # Para servicio se entrena con todos los ratings disponibles (la evaluación
    # comparativa con split temporal ya está documentada en el notebook 03).
    reader = Reader(rating_scale=(0.5, 5.0))
    trainset = Dataset.load_from_df(
        ratings[["userId", "movieId", "rating"]], reader
    ).build_full_trainset()

    t0 = time.time()
    svd = SVD(n_factors=N_FACTORS, n_epochs=N_EPOCHS,
              lr_all=LR_ALL, reg_all=REG_ALL, random_state=SEED)
    svd.fit(trainset)
    print(f"SVD entrenado en {time.time() - t0:.1f}s  "
          f"(pu={svd.pu.shape}, qi={svd.qi.shape}, mu={trainset.global_mean:.4f})")

    inner_to_raw_i = np.array(
        [trainset.to_raw_iid(i) for i in range(trainset.n_items)], dtype=np.int32
    )

    # Clustering de comunidades (mismo procedimiento que el notebook 03)
    t0 = time.time()
    km_users = KMeans(n_clusters=K_USERS_CLUSTERS, random_state=SEED, n_init=10)
    user_labels = km_users.fit_predict(svd.pu)
    km_items = KMeans(n_clusters=K_ITEMS_CLUSTERS, random_state=SEED, n_init=10)
    km_items.fit(svd.qi)
    print(f"KMeans (usuarios e ítems, k=6) en {time.time() - t0:.1f}s")

    # Perfil de géneros por clúster de usuarios, para nombrar las comunidades
    inner_to_raw_u = np.array(
        [trainset.to_raw_uid(u) for u in range(trainset.n_users)], dtype=np.int32
    )
    user_cluster_df = pd.DataFrame({"userId": inner_to_raw_u, "cluster": user_labels})
    merged = (
        ratings.merge(user_cluster_df, on="userId")
        .merge(movies[["movieId", "genres"]], on="movieId", how="left")
    )
    # Distribución global de géneros para calcular el lift por clúster:
    # los géneros masivos (Drama, Comedy) dominan en volumen en todos los
    # clústeres, así que la preferencia relativa es lo que los distingue.
    all_exploded = merged.assign(genre=merged["genres"].str.split("|")).explode("genre")
    all_exploded = all_exploded[all_exploded["genre"] != "(no genres listed)"]
    global_share = all_exploded["genre"].value_counts(normalize=True)

    cluster_profiles: list[dict] = []
    for c in range(K_USERS_CLUSTERS):
        sub = all_exploded[all_exploded["cluster"] == c]
        share = sub["genre"].value_counts(normalize=True)
        lift = (share / global_share).dropna()
        # Solo géneros con presencia mínima, para que el lift no sea ruido
        lift = lift[share[lift.index] > 0.01].sort_values(ascending=False)
        top_genres = lift.head(4).index.tolist()
        cluster_profiles.append({
            "cluster": c,
            "n_users": int(sub["userId"].nunique()),
            "avg_rating": float(sub["rating"].mean()),
            "ratings_per_user": float(len(sub) / max(sub["userId"].nunique(), 1)),
            "top_genres": top_genres,
            "genre_lift": {g: float(lift[g]) for g in top_genres},
        })
        print(f"  Cluster {c}: {top_genres}  avg={sub['rating'].mean():.2f}  "
              f"users={sub['userId'].nunique():,}")

    artifact = {
        "algo": "SVD",
        "dataset": dataset_label,
        "hyperparams": {"n_factors": N_FACTORS, "n_epochs": N_EPOCHS,
                        "lr_all": LR_ALL, "reg_all": REG_ALL, "seed": SEED},
        "global_mean": float(trainset.global_mean),
        "item_raw_ids": inner_to_raw_i,
        "item_factors": svd.qi.astype(np.float32),
        "item_biases": svd.bi.astype(np.float32),
        "user_cluster_centroids": km_users.cluster_centers_.astype(np.float32),
        "item_cluster_centroids": km_items.cluster_centers_.astype(np.float32),
        "user_cluster_profiles": cluster_profiles,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S"),
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out = MODELS_DIR / "svd_model.pkl"
    with open(out, "wb") as f:
        pickle.dump(artifact, f)
    print(f"Artefacto guardado: {out}  ({out.stat().st_size / 1024 / 1024:.1f} MB)")


if __name__ == "__main__":
    main()
