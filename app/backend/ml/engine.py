"""Motor de inferencia: sirve los modelos entrenados en los notebooks.

Artefactos consumidos:
- ``models/baseline_scores.pkl``   — popularidad bayesiana (notebook 03, baseline).
- ``models/svd_model.pkl``         — factores latentes SVD + clústeres KMeans
  (regenerable con ``app/backend/scripts/train_models.py``).
- ``models/dl_item_embeddings.pkl`` — embeddings de ítem del modelo Deep Learning
  (notebook 04, MF+Bias). OPCIONAL: alimenta "similares" con la red neuronal;
  si falta, ``similar_dl`` cae al espacio del SVD. Regenerable con
  ``app/backend/scripts/export_dl_embeddings.py``.
- ``data/intermediate/movies_prepared_60pct.parquet`` — catálogo limpio (notebook 02).
- ``data/intermediate/item_clusters.parquet``         — popularidad y rating medio por película.
- ``data/ml-25m/links.csv``        — ids externos (IMDb/TMDb).

Estrategia de recomendación (la misma documentada en reports/):
- Usuario sin historial (*cold start*): ranking por popularidad bayesiana.
- Usuario con ratings: *folding-in* — se estima su vector latente resolviendo
  un ridge sobre los factores de los ítems que calificó y se re-rankea un pool
  de candidatos populares con la predicción SVD (mu + bu + bi + qi·pu).
"""
from __future__ import annotations

import pickle
import re
from functools import lru_cache

import numpy as np
import pandas as pd

from config import (
    BIAS_SHRINK,
    CANDIDATE_POOL_SIZE,
    DATA_INT_DIR,
    DATA_RAW_DIR,
    FOLD_IN_REG,
    MIN_VOTES_CANDIDATE,
    MODELS_DIR,
)
from ml.personas import assign_personas

_ARTICLE_RE = re.compile(
    r"^(?P<title>.*), (?P<art>The|A|An|El|La|Los|Las|Le|Les|Der|Das|Il)(?P<alt> \(.*\))?$"
)
_YEAR_RE = re.compile(r"\s*\((\d{4})\)\s*$")


def _clean_title(raw: str) -> tuple[str, int | None]:
    """'Matrix, The (1999)' -> ('The Matrix', 1999)."""
    year = None
    m = _YEAR_RE.search(raw)
    if m:
        year = int(m.group(1))
        raw = _YEAR_RE.sub("", raw)
    m = _ARTICLE_RE.match(raw.strip())
    if m:
        raw = f"{m.group('art')} {m.group('title')}{m.group('alt') or ''}"
    return raw.strip(), year


class RecommenderEngine:
    def __init__(self) -> None:
        self._load_catalog()
        self._load_baseline()
        self._load_svd()
        self._load_dl_embeddings()
        self._build_indexes()

    # ------------------------------------------------------------- carga
    def _load_catalog(self) -> None:
        movies = pd.read_parquet(DATA_INT_DIR / "movies_prepared_60pct.parquet")
        stats = pd.read_parquet(DATA_INT_DIR / "item_clusters.parquet")[
            ["movieId", "cluster", "n_ratings", "rating_mean"]
        ]
        df = movies.merge(stats, on="movieId", how="left")
        # links.csv (IDs IMDb/TMDb para pósters) es parte del dataset crudo y
        # puede no estar (p. ej. en Docker). Si falta, las imágenes caen al arte
        # procedural; el recomendador funciona igual.
        links_path = DATA_RAW_DIR / "links.csv"
        if links_path.exists():
            links = pd.read_csv(links_path)
            df = df.merge(links, on="movieId", how="left")
        cleaned = df["title"].map(_clean_title)
        df["clean_title"] = [c[0] for c in cleaned]
        df["year"] = [c[1] for c in cleaned]
        df["n_ratings"] = df["n_ratings"].fillna(0).astype(int)
        df["rating_mean"] = df["rating_mean"].astype(float)
        df["genres_list"] = df["genres"].str.split("|").map(
            lambda gs: [g for g in gs if g != "(no genres listed)"]
        )
        df["search_title"] = df["clean_title"].str.lower()
        self.movies = df.set_index("movieId", drop=False)

    def _load_baseline(self) -> None:
        with open(MODELS_DIR / "baseline_scores.pkl", "rb") as f:
            baseline = pickle.load(f)
        self.global_mean_c: float = baseline["global_mean_C"]
        scores = pd.Series(baseline["bayesian_score_by_movieId"], name="bayesian")
        self.movies["bayesian"] = scores.reindex(self.movies.index).fillna(self.global_mean_c)

    def _load_svd(self) -> None:
        path = MODELS_DIR / "svd_model.pkl"
        if not path.exists():
            raise FileNotFoundError(
                f"No existe {path}. Genera el artefacto con: "
                "venv/bin/python app/backend/scripts/train_models.py"
            )
        with open(path, "rb") as f:
            art = pickle.load(f)
        self.svd_meta = {
            "algo": art["algo"], "dataset": art["dataset"],
            "hyperparams": art["hyperparams"], "trained_at": art["trained_at"],
        }
        self.mu: float = art["global_mean"]
        self.qi: np.ndarray = art["item_factors"]            # (n_items, f)
        self.bi: np.ndarray = art["item_biases"]             # (n_items,)
        self.item_raw_ids: np.ndarray = art["item_raw_ids"]  # (n_items,)
        self.user_centroids: np.ndarray = art["user_cluster_centroids"]
        self.personas: dict[int, dict] = assign_personas(art["user_cluster_profiles"])

        norms = np.linalg.norm(self.qi, axis=1, keepdims=True)
        self.qi_normed = self.qi / np.maximum(norms, 1e-9)
        self.iid_to_inner = {int(mid): i for i, mid in enumerate(self.item_raw_ids)}

    def _load_dl_embeddings(self) -> None:
        """Embeddings de ítem del modelo Deep Learning (notebook 04, MF+Bias).

        Artefacto OPCIONAL: ``models/dl_item_embeddings.pkl`` (regenerable con
        ``app/backend/scripts/export_dl_embeddings.py``). Si falta, ``similar_dl``
        cae al espacio latente del SVD sin romper nada.
        """
        # Defaults seguros para que los atributos existan aunque no haya artefacto.
        self.dl_available = False
        self.dl_meta: dict | None = None
        self.dl_iid_to_inner: dict[int, int] = {}

        path = MODELS_DIR / "dl_item_embeddings.pkl"
        if not path.exists():
            return
        with open(path, "rb") as f:
            art = pickle.load(f)

        emb = np.asarray(art["embeddings"], dtype=np.float32)
        norms = np.linalg.norm(emb, axis=1, keepdims=True)
        self.dl_emb_normed = emb / np.maximum(norms, 1e-9)
        self.dl_item_ids = np.asarray(art["item_ids"])
        self.dl_iid_to_inner = {int(m): i for i, m in enumerate(self.dl_item_ids)}
        self.dl_meta = {
            "arch": art.get("arch", "MFBias"),
            "dim": int(emb.shape[1]),
            "items": int(emb.shape[0]),
            "source": art.get("source"),
        }
        self.dl_available = True

    def _build_indexes(self) -> None:
        known = self.movies.index.intersection(pd.Index(self.item_raw_ids))
        pool = self.movies.loc[known]
        pool = pool[pool["n_ratings"] >= MIN_VOTES_CANDIDATE]
        pool = pool.sort_values("bayesian", ascending=False).head(CANDIDATE_POOL_SIZE)
        self.candidate_ids = pool["movieId"].to_numpy()
        self.candidate_inner = np.array([self.iid_to_inner[m] for m in self.candidate_ids])

        genres: set[str] = set()
        for gs in self.movies["genres_list"]:
            genres.update(gs)
        self.genres = sorted(genres)

    # ------------------------------------------------------- serialización
    def movie_payload(self, movie_id: int, **extra) -> dict | None:
        if movie_id not in self.movies.index:
            return None
        row = self.movies.loc[movie_id]
        return {
            "movieId": int(row["movieId"]),
            "title": row["clean_title"],
            "originalTitle": row["title"],
            "year": int(row["year"]) if pd.notna(row["year"]) else None,
            "genres": list(row["genres_list"]),
            "avgRating": round(float(row["rating_mean"]), 2) if pd.notna(row["rating_mean"]) else None,
            "numRatings": int(row["n_ratings"]),
            "bayesianScore": round(float(row["bayesian"]), 3),
            "tmdbId": int(row["tmdbId"]) if pd.notna(row.get("tmdbId")) else None,
            "imdbId": int(row["imdbId"]) if pd.notna(row.get("imdbId")) else None,
            **extra,
        }

    def external_ids(self, movie_id: int) -> dict:
        """imdbId/tmdbId de una película, para enriquecer respuestas que no los
        traen (p. ej. la búsqueda semántica, que arma sus filas desde el índice
        FAISS). Lookup en memoria por movieId; películas desconocidas -> None."""
        if movie_id not in self.movies.index:
            return {"imdbId": None, "tmdbId": None}
        row = self.movies.loc[movie_id]
        return {
            "imdbId": int(row["imdbId"]) if pd.notna(row.get("imdbId")) else None,
            "tmdbId": int(row["tmdbId"]) if pd.notna(row.get("tmdbId")) else None,
        }

    def movies_payload(self, movie_ids, scores: dict[int, float] | None = None) -> list[dict]:
        out = []
        for mid in movie_ids:
            extra = {}
            if scores is not None and mid in scores:
                extra["predictedRating"] = round(float(scores[mid]), 2)
            p = self.movie_payload(int(mid), **extra)
            if p is not None:
                out.append(p)
        return out

    # ----------------------------------------------------------- catálogo
    def browse(
        self,
        search: str | None = None,
        genre: str | None = None,
        decade: int | None = None,
        sort: str = "popular",
        page: int = 1,
        page_size: int = 24,
    ) -> dict:
        df = self.movies
        if search:
            df = df[df["search_title"].str.contains(re.escape(search.lower()), na=False)]
        if genre:
            df = df[df["genres_list"].map(lambda gs: genre in gs)]
        if decade:
            df = df[(df["year"] >= decade) & (df["year"] < decade + 10)]

        if sort == "rating":
            df = df[df["n_ratings"] >= 50].sort_values("rating_mean", ascending=False)
        elif sort == "recent":
            df = df.sort_values(["year", "bayesian"], ascending=[False, False])
        elif sort == "title":
            df = df.sort_values("search_title")
        else:  # popular: ranking bayesiano del baseline
            df = df.sort_values(["bayesian", "n_ratings"], ascending=[False, False])

        total = len(df)
        start = (page - 1) * page_size
        page_ids = df["movieId"].iloc[start: start + page_size].tolist()
        return {
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": max((total + page_size - 1) // page_size, 1),
            "results": self.movies_payload(page_ids),
        }

    def popular(self, n: int = 20, genre: str | None = None, exclude: set[int] | None = None) -> list[int]:
        df = self.movies[self.movies["n_ratings"] >= MIN_VOTES_CANDIDATE]
        if genre:
            df = df[df["genres_list"].map(lambda gs: genre in gs)]
        if exclude:
            df = df[~df["movieId"].isin(exclude)]
        return df.sort_values("bayesian", ascending=False)["movieId"].head(n).tolist()

    # ----------------------------------------------------------- SVD
    def _fold_in(self, user_ratings: dict[int, float]) -> tuple[np.ndarray, float, int]:
        """Estima (pu, bu) para un usuario externo al trainset (folding-in ridge)."""
        inner = [(self.iid_to_inner[m], r) for m, r in user_ratings.items()
                 if m in self.iid_to_inner]
        if not inner:
            return np.zeros(self.qi.shape[1], dtype=np.float32), 0.0, 0
        idx = np.array([i for i, _ in inner])
        r = np.array([x for _, x in inner], dtype=np.float64)

        resid = r - self.mu - self.bi[idx]
        bu = float(resid.sum() / (len(resid) + BIAS_SHRINK))
        resid = resid - bu

        Q = self.qi[idx].astype(np.float64)
        f = Q.shape[1]
        A = Q.T @ Q + FOLD_IN_REG * len(idx) * np.eye(f)
        pu = np.linalg.solve(A, Q.T @ resid)
        return pu, bu, len(idx)

    def _estimate(self, pu: np.ndarray, bu: float, inner_idx: np.ndarray) -> np.ndarray:
        est = self.mu + bu + self.bi[inner_idx] + self.qi[inner_idx] @ pu
        return np.clip(est, 0.5, 5.0)

    def recommend(self, user_ratings: dict[int, float], n: int = 20,
                  genre: str | None = None) -> dict:
        """Top-N personalizado. Cold start -> baseline bayesiano."""
        rated = set(user_ratings)
        pu, bu, n_known = self._fold_in(user_ratings)

        if n_known == 0:
            ids = self.popular(n, genre=genre, exclude=rated)
            return {"strategy": "baseline_bayesian", "results": self.movies_payload(ids)}

        mask = ~np.isin(self.candidate_ids, list(rated))
        cand_ids = self.candidate_ids[mask]
        cand_inner = self.candidate_inner[mask]
        if genre:
            gmask = np.array([
                genre in self.movies.at[m, "genres_list"] for m in cand_ids
            ])
            cand_ids, cand_inner = cand_ids[gmask], cand_inner[gmask]

        est = self._estimate(pu, bu, cand_inner)
        order = np.argsort(-est)[:n]
        top_ids = cand_ids[order]
        scores = {int(m): float(s) for m, s in zip(top_ids, est[order])}
        return {
            "strategy": "svd_fold_in",
            "results": self.movies_payload(top_ids.tolist(), scores=scores),
        }

    def predict_rating(self, user_ratings: dict[int, float], movie_id: int) -> float | None:
        """Afinidad estimada de un usuario con una película puntual."""
        if movie_id not in self.iid_to_inner:
            return None
        pu, bu, n_known = self._fold_in(user_ratings)
        if n_known == 0:
            return None
        est = self._estimate(pu, bu, np.array([self.iid_to_inner[movie_id]]))
        return round(float(est[0]), 2)

    @lru_cache(maxsize=4096)
    def similar(self, movie_id: int, n: int = 12) -> tuple[int, ...]:
        """Vecinos por coseno en el espacio latente de ítems del SVD."""
        inner = self.iid_to_inner.get(movie_id)
        if inner is None:
            return tuple()
        sims = self.qi_normed @ self.qi_normed[inner]
        # Filtra películas con muy pocos votos para evitar vecinos espurios
        order = np.argsort(-sims)
        out: list[int] = []
        for i in order:
            mid = int(self.item_raw_ids[i])
            if mid == movie_id or mid not in self.movies.index:
                continue
            if self.movies.at[mid, "n_ratings"] < MIN_VOTES_CANDIDATE:
                continue
            out.append(mid)
            if len(out) >= n:
                break
        return tuple(out)

    @lru_cache(maxsize=4096)
    def similar_dl(self, movie_id: int, n: int = 12) -> tuple[int, ...]:
        """Vecinos por coseno en el espacio de *embeddings* del modelo Deep
        Learning (MF+Bias, notebook 04). Si el modelo DL no está disponible o la
        película no fue modelada, cae transparentemente al espacio del SVD."""
        inner = self.dl_iid_to_inner.get(movie_id) if self.dl_available else None
        if inner is None:
            return self.similar(movie_id, n=n)

        sims = self.dl_emb_normed @ self.dl_emb_normed[inner]
        order = np.argsort(-sims)
        out: list[int] = []
        for i in order:
            mid = int(self.dl_item_ids[i])
            if mid == movie_id or mid not in self.movies.index:
                continue
            if self.movies.at[mid, "n_ratings"] < MIN_VOTES_CANDIDATE:
                continue
            out.append(mid)
            if len(out) >= n:
                break
        return tuple(out)

    def serves_dl(self, movie_id: int) -> bool:
        """¿Se sirvieron similares con el modelo DL para esta película?"""
        return self.dl_available and movie_id in self.dl_iid_to_inner

    # ----------------------------------------------------------- personas
    def persona_for(self, user_ratings: dict[int, float]) -> dict | None:
        """Asigna comunidad: folding-in + centroide euclidiano más cercano."""
        pu, _, n_known = self._fold_in(user_ratings)
        if n_known == 0:
            return None
        dists = np.linalg.norm(self.user_centroids - pu, axis=1)
        cluster = int(np.argmin(dists))
        # Confianza relativa: qué tan cerca está del centroide ganador
        sorted_d = np.sort(dists)
        confidence = float(1.0 - sorted_d[0] / max(sorted_d[1], 1e-9))
        return {**self.personas[cluster], "confidence": round(min(max(confidence, 0.05), 0.99), 2)}

    def all_personas(self) -> list[dict]:
        return [self.personas[c] for c in sorted(self.personas)]

    # ----------------------------------------------------------- metadatos
    def stats(self) -> dict:
        return {
            "totalMovies": int(len(self.movies)),
            "totalRatingsDataset": int(self.movies["n_ratings"].sum()),
            "modeledMovies": int(len(self.item_raw_ids)),
            "genres": len(self.genres),
            "model": self.svd_meta,
            "dlEmbeddings": self.dl_meta,
        }


_engine: RecommenderEngine | None = None


def get_engine() -> RecommenderEngine:
    global _engine
    if _engine is None:
        _engine = RecommenderEngine()
    return _engine
