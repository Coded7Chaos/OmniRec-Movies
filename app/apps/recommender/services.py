"""
Service layer for the recommender testbench.

Loads trained artefacts from <OMNIREC_MODELS_DIR> (pickles produced by
notebook 03) and parquets / CSV from <OMNIREC_DATA_DIR> (produced by
notebooks 02 and 03). The `reports/` folder of the repo is reserved for
Markdown documentation only.

Everything is cached in a module-level singleton so that a running
server pays the I/O cost at most once per artefact.
"""

from __future__ import annotations

import csv
import pickle
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd

from django.conf import settings


# Friendly names used in the UI. Technical names remain visible in the
# metrics table (which reads model_comparison.csv verbatim).
MODEL_LABELS: dict[str, str] = {
    'baseline': 'Popularidad ponderada',
    'knn': 'Vecinos cercanos (KNN)',
    'svd': 'Factorización SVD',
    'nmf': 'Factorización NMF',
    'automl': 'AutoML (mejor RMSE)',
}

MODEL_HINTS: dict[str, str] = {
    'baseline': 'Rápido — ignora al usuario, ordena por score bayesiano global.',
    'knn': 'Preciso pero lento — la primera llamada carga ~305 MB.',
    'svd': 'Recomendado — equilibrio entre calidad y velocidad.',
    'nmf': 'Factores no negativos, interpretables.',
    'automl': 'Ganador por RMSE tras búsqueda automática.',
}

MODEL_FILES: dict[str, str] = {
    'baseline': 'baseline_scores.pkl',
    'knn': 'knn_model.pkl',
    'svd': 'svd_model.pkl',
    'nmf': 'nmf_model.pkl',
    'automl': 'automl_winner.pkl',
}

# English → Spanish genre translation for persona labels and UI.
GENRE_ES: dict[str, str] = {
    'Action': 'Acción',
    'Adventure': 'Aventura',
    'Animation': 'Animación',
    'Children': 'Infantil',
    'Comedy': 'Comedia',
    'Crime': 'Crimen',
    'Documentary': 'Documental',
    'Drama': 'Drama',
    'Fantasy': 'Fantasía',
    'Film-Noir': 'Film-Noir',
    'Horror': 'Terror',
    'IMAX': 'IMAX',
    'Musical': 'Musical',
    'Mystery': 'Misterio',
    'Romance': 'Romance',
    'Sci-Fi': 'Ciencia Ficción',
    'Thriller': 'Suspenso',
    'War': 'Bélico',
    'Western': 'Western',
    '(no genres listed)': 'Sin género',
}


@dataclass
class Registry:
    """Thread-safe, lazy cache of models + dataframes."""

    models_dir: Path
    data_dir: Path

    _models: dict[str, Any] = field(default_factory=dict)
    _movies: pd.DataFrame | None = None
    _ratings: pd.DataFrame | None = None
    _user_clusters: pd.DataFrame | None = None
    _item_clusters: pd.DataFrame | None = None
    _metrics: list[dict[str, Any]] | None = None
    _user_ids: list[int] | None = None
    _rated_by_user: dict[int, set[int]] | None = None
    _personas: list[dict[str, Any]] | None = None
    _personas_by_id: dict[int, dict[str, Any]] | None = None
    _lock: threading.Lock = field(default_factory=threading.Lock)

    # ---------- data frames ----------

    def movies(self) -> pd.DataFrame:
        if self._movies is None:
            with self._lock:
                if self._movies is None:
                    path = self.data_dir / 'movies_sample.parquet'
                    df = pd.read_parquet(path)
                    df['movieId'] = df['movieId'].astype('int64')
                    self._movies = df.set_index('movieId', drop=False)
        return self._movies

    def ratings(self) -> pd.DataFrame:
        if self._ratings is None:
            with self._lock:
                if self._ratings is None:
                    path = self.data_dir / 'ratings_sample_5pct.parquet'
                    self._ratings = pd.read_parquet(path)
        return self._ratings

    def user_clusters(self) -> pd.DataFrame:
        if self._user_clusters is None:
            path = self.data_dir / 'user_clusters.parquet'
            self._user_clusters = pd.read_parquet(path)
        return self._user_clusters

    def item_clusters(self) -> pd.DataFrame:
        if self._item_clusters is None:
            path = self.data_dir / 'item_clusters.parquet'
            self._item_clusters = pd.read_parquet(path)
        return self._item_clusters

    def metrics(self) -> list[dict[str, Any]]:
        if self._metrics is None:
            path = self.data_dir / 'model_comparison.csv'
            rows: list[dict[str, Any]] = []
            with path.open() as fh:
                for row in csv.DictReader(fh):
                    for key in ('RMSE', 'MAE', 'P@5', 'R@5', 'P@10', 'R@10', 'NDCG@10', 'Tiempo (s)'):
                        try:
                            row[key] = float(row[key])
                        except (KeyError, ValueError):
                            pass
                    rows.append(row)
            self._metrics = rows
        return self._metrics

    def user_ids(self) -> list[int]:
        if self._user_ids is None:
            ids = self.ratings()['userId'].unique().tolist()
            self._user_ids = sorted(int(u) for u in ids)
        return self._user_ids

    def rated_by_user(self, user_id: int) -> set[int]:
        if self._rated_by_user is None:
            with self._lock:
                if self._rated_by_user is None:
                    df = self.ratings()
                    grouped = df.groupby('userId')['movieId'].apply(
                        lambda s: set(int(m) for m in s)
                    )
                    self._rated_by_user = grouped.to_dict()
        return self._rated_by_user.get(int(user_id), set())

    # ---------- personas ----------

    def _compute_personas(self) -> list[dict[str, Any]]:
        ratings = self.ratings()
        movies = self.movies().reset_index(drop=True)[['movieId', 'genres']]
        clusters = self.user_clusters()

        # Use a reduced join to keep memory in check.
        merged = ratings[['userId', 'movieId', 'rating']].merge(movies, on='movieId', how='inner')
        merged['primary_genre'] = merged['genres'].str.split('|').str[0]

        agg = merged.groupby('userId').agg(
            n_ratings=('rating', 'size'),
            rating_mean=('rating', 'mean'),
        ).reset_index()

        # Favorite genre = most-rated primary genre per user.
        gc = merged.groupby(['userId', 'primary_genre']).size().rename('n').reset_index()
        idx = gc.groupby('userId')['n'].idxmax()
        favorite = gc.loc[idx, ['userId', 'primary_genre']].rename(columns={'primary_genre': 'top_genre'})

        summary = agg.merge(favorite, on='userId').merge(clusters, on='userId')
        summary = summary.sort_values('n_ratings', ascending=False)

        # Take top 7 per cluster → up to ~42 personas across 6 clusters.
        per_cluster = summary.groupby('cluster', group_keys=False).head(7)
        per_cluster = per_cluster.sort_values(['cluster', 'n_ratings'], ascending=[True, False])

        personas: list[dict[str, Any]] = []
        for _, row in per_cluster.iterrows():
            genre_en = str(row['top_genre']) if row['top_genre'] else '(no genres listed)'
            genre_es = GENRE_ES.get(genre_en, genre_en)
            n = int(row['n_ratings'])
            cluster = int(row['cluster'])
            mean_rating = float(row['rating_mean'])
            label = f'Fan de {genre_es} · {n} reseñas · Grupo {cluster}'
            personas.append({
                'userId': int(row['userId']),
                'label': label,
                'top_genre_es': genre_es,
                'top_genre_en': genre_en,
                'n_ratings': n,
                'cluster': cluster,
                'rating_mean': round(mean_rating, 2),
            })
        return personas

    def personas(self) -> list[dict[str, Any]]:
        if self._personas is None:
            with self._lock:
                if self._personas is None:
                    self._personas = self._compute_personas()
                    self._personas_by_id = {p['userId']: p for p in self._personas}
        return self._personas

    def persona(self, user_id: int) -> dict[str, Any] | None:
        self.personas()
        return (self._personas_by_id or {}).get(int(user_id))

    # ---------- models ----------

    def model(self, key: str) -> Any:
        if key not in MODEL_FILES:
            raise KeyError(f'Unknown model key: {key}')
        if key not in self._models:
            with self._lock:
                if key not in self._models:
                    path = self.models_dir / MODEL_FILES[key]
                    with path.open('rb') as fh:
                        self._models[key] = pickle.load(fh)
        return self._models[key]

    def baseline(self) -> dict[str, Any]:
        return self.model('baseline')

    # ---------- prediction helpers ----------

    def predict_rating(self, model_key: str, user_id: int, movie_id: int) -> float | None:
        if model_key == 'baseline':
            scores = self.baseline()['bayesian_score_by_movieId']
            val = scores.get(int(movie_id))
            return float(val) if val is not None else None

        model = self.model(model_key)
        try:
            pred = model.predict(int(user_id), int(movie_id))
        except Exception:
            return None
        return float(pred.est)

    def top_n_for_user(
        self,
        user_id: int,
        model_key: str,
        n: int = 10,
        candidate_limit: int = 400,
    ) -> list[dict[str, Any]]:
        seen = self.rated_by_user(user_id)
        baseline_scores: dict[int, float] = self.baseline()['bayesian_score_by_movieId']
        candidates = sorted(baseline_scores.items(), key=lambda kv: kv[1], reverse=True)
        movies = self.movies()

        scored: list[tuple[int, float]] = []
        for movie_id, _bayes_score in candidates:
            if movie_id in seen:
                continue
            if movie_id not in movies.index:
                continue
            score = self.predict_rating(model_key, user_id, movie_id)
            if score is None:
                continue
            scored.append((int(movie_id), float(score)))
            if len(scored) >= candidate_limit:
                break

        scored.sort(key=lambda kv: kv[1], reverse=True)
        top = scored[:n]
        result = []
        for movie_id, score in top:
            row = movies.loc[movie_id]
            result.append({
                'movieId': int(movie_id),
                'title': row['title'],
                'genres': format_genres(row['genres']),
                'score': score,
            })
        return result

    def movie_lookup(self, query: str, limit: int = 15) -> list[dict[str, Any]]:
        q = (query or '').strip().lower()
        if not q:
            return []
        movies = self.movies()
        mask = movies['title'].str.lower().str.contains(q, regex=False, na=False)
        hits = movies.loc[mask].head(limit)
        baseline_scores: dict[int, float] = self.baseline()['bayesian_score_by_movieId']
        rows = []
        for _, r in hits.iterrows():
            movie_id = int(r['movieId'])
            rows.append({
                'movieId': movie_id,
                'title': r['title'],
                'genres': format_genres(r['genres']),
                'bayesian': baseline_scores.get(movie_id),
            })
        return rows

    def movie_by_id(self, movie_id: int) -> dict[str, Any] | None:
        movies = self.movies()
        if movie_id not in movies.index:
            return None
        row = movies.loc[movie_id]
        return {
            'movieId': int(movie_id),
            'title': row['title'],
            'genres': format_genres(row['genres']),
        }

    def cluster_summary(self) -> list[dict[str, Any]]:
        ic = self.item_clusters()
        uc = self.user_clusters()
        summary: list[dict[str, Any]] = []
        for cluster_id, group in ic.groupby('cluster'):
            top_titles = (
                group.sort_values('rating_mean', ascending=False)
                .head(5)['title']
                .tolist()
            )
            summary.append({
                'cluster': int(cluster_id),
                'n_movies': int(len(group)),
                'n_users': int((uc['cluster'] == cluster_id).sum()),
                'rating_mean': float(group['rating_mean'].mean()),
                'n_ratings_median': int(group['n_ratings'].median()),
                'top_titles': top_titles,
            })
        return sorted(summary, key=lambda r: r['cluster'])

    # ---------- startup ----------

    def warmup(self) -> None:
        self.movies()
        self.baseline()
        self.metrics()
        self.personas()
        try:
            self.model('svd')
            self.model('nmf')
        except FileNotFoundError:
            pass


def format_genres(raw: str | None) -> str:
    """Pipe-separated → Spanish-joined. 'Action|Sci-Fi|Thriller' → 'Acción · Ciencia Ficción · Suspenso'."""
    if not raw:
        return ''
    parts = [GENRE_ES.get(p, p) for p in str(raw).split('|') if p]
    return ' · '.join(parts)


def _build_registry() -> Registry:
    return Registry(
        models_dir=Path(settings.OMNIREC_MODELS_DIR),
        data_dir=Path(settings.OMNIREC_DATA_DIR),
    )


registry: Registry = _build_registry()
