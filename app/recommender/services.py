"""
Capa de servicio del testbench.

Carga los artefactos entrenados (pickles de `models/` y parquets/CSV de
`data/intermediate/`) y los enriquece con metadata orientada a UI:
nombres humanos para personas, arquetipos para comunidades (clusters),
filtros por género e intensidad, y utilidades de catálogo (destacadas,
por género, etc.).

Todo queda cacheado en un singleton thread-safe a nivel de módulo.
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


# ---------------------------------------------------------------------
# Metadata estática — UI / presentación
# ---------------------------------------------------------------------

MODEL_LABELS: dict[str, str] = {
    'baseline': 'Popularidad ponderada',
    'knn': 'Vecinos cercanos (KNN)',
    'svd': 'Factorización SVD',
    'nmf': 'Factorización NMF',
    'automl': 'AutoML (mejor RMSE)',
}

MODEL_HINTS: dict[str, str] = {
    'baseline': 'Rápido. Ordena por popularidad ajustada (score bayesiano global), sin tener en cuenta a la persona.',
    'knn': 'Preciso pero costoso. La primera llamada carga ~305 MB; después es rápido.',
    'svd': 'Recomendado. Buen balance entre calidad, velocidad y cobertura.',
    'nmf': 'Factores no negativos, ideal cuando querés explicar las recomendaciones como "mezclas de temas".',
    'automl': 'Modelo ganador tras búsqueda automática de hiperparámetros.',
}

MODEL_FILES: dict[str, str] = {
    'baseline': 'baseline_scores.pkl',
    'knn': 'knn_model.pkl',
    'svd': 'svd_model.pkl',
    'nmf': 'nmf_model.pkl',
    'automl': 'automl_winner.pkl',
}

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

# Arquetipos para comunidades (clusters). Dos ejes: género principal y
# cómo califica el grupo (promedio bajo = exigente, alto = entusiasta).
ARCHETYPES: dict[str, dict[str, str]] = {
    'Action': {
        'name': 'Adrenalina en pantalla',
        'tagline': 'Persecuciones, peleas y acción sin pausa.',
    },
    'Adventure': {
        'name': 'Exploradores incansables',
        'tagline': 'Viajes épicos, mapas y tesoros por descubrir.',
    },
    'Drama': {
        'name': 'Corazón del drama',
        'tagline': 'Historias humanas, emociones intensas y guiones cuidados.',
    },
    'Comedy': {
        'name': 'Risas garantizadas',
        'tagline': 'Comedias frescas para pasar un buen rato.',
    },
    'Thriller': {
        'name': 'Al filo del asiento',
        'tagline': 'Suspenso, tensión y giros inesperados.',
    },
    'Horror': {
        'name': 'Noches de terror',
        'tagline': 'Cine de miedo para amantes del género.',
    },
    'Romance': {
        'name': 'Romántic@s empedernid@s',
        'tagline': 'Historias de amor, encuentros y segundas oportunidades.',
    },
    'Sci-Fi': {
        'name': 'Viajer@s del futuro',
        'tagline': 'Universos paralelos, IA y ciencia ficción de autor.',
    },
    'Fantasy': {
        'name': 'Reino del fantástico',
        'tagline': 'Magia, criaturas imposibles y mundos inventados.',
    },
    'Crime': {
        'name': 'Detectives de sillón',
        'tagline': 'Investigaciones, mafias y thrillers policiales.',
    },
    'Mystery': {
        'name': 'Acertij@s del cine',
        'tagline': 'Pistas, silencios y finales para pensar.',
    },
    'Animation': {
        'name': 'Cine animado',
        'tagline': 'Animación para todas las edades, del studio al indie.',
    },
    'Documentary': {
        'name': 'Ventana al mundo real',
        'tagline': 'Historias reales que informan y conmueven.',
    },
    'Children': {
        'name': 'En familia',
        'tagline': 'Películas pensadas para ver con los más chicos.',
    },
    'War': {
        'name': 'Cine bélico',
        'tagline': 'Conflictos, heroísmo y cicatrices de la guerra.',
    },
    'Western': {
        'name': 'Al oeste',
        'tagline': 'Cowboys, duelos y polvo del desierto.',
    },
    'Musical': {
        'name': 'Con la música a cuestas',
        'tagline': 'Musicales clásicos y contemporáneos.',
    },
    'Film-Noir': {
        'name': 'Cine negro',
        'tagline': 'Atmósfera, sombras y antihéroes.',
    },
    'IMAX': {
        'name': 'Pantalla gigante',
        'tagline': 'Películas pensadas para el formato más envolvente.',
    },
    '(no genres listed)': {
        'name': 'Gustos eclécticos',
        'tagline': 'Sin un género dominante, abiertos a todo.',
    },
}

# Paleta para avatares de personas y colores de comunidades.
CLUSTER_COLORS: list[str] = [
    '#4f46e5',  # indigo
    '#0891b2',  # cyan
    '#059669',  # emerald
    '#d97706',  # amber
    '#db2777',  # pink
    '#9333ea',  # purple
    '#dc2626',  # red
    '#0ea5e9',  # sky
]

# Nombres para personalizar cada persona. La combinación (nombre,
# apellido) es determinística por userId, así que una misma persona
# siempre se presenta igual.
PERSONA_NAMES: list[str] = [
    'Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Fabián', 'Gisela', 'Hugo',
    'Inés', 'Joaquín', 'Karen', 'Lucas', 'María', 'Nicolás', 'Olivia',
    'Pablo', 'Quimey', 'Renata', 'Santiago', 'Tamara', 'Ulises', 'Valeria',
    'Walter', 'Ximena', 'Yamil', 'Zoe', 'Bianca', 'Cristian', 'Delfina',
    'Emilio', 'Florencia', 'Gonzalo', 'Helena', 'Ignacio', 'Julieta',
    'Kevin', 'Laura', 'Martín', 'Natalia', 'Octavio', 'Paula', 'Ramiro',
    'Sofía', 'Tomás', 'Úrsula', 'Víctor', 'Wanda', 'Yago', 'Zulma',
]
PERSONA_LASTS: list[str] = [
    'R.', 'M.', 'G.', 'L.', 'V.', 'C.', 'P.', 'S.', 'T.', 'D.', 'H.', 'B.',
]

# Categorías de intensidad (cantidad de reseñas).
INTENSITY_BUCKETS = [
    ('casual', 0, 200, 'Ve cine esporádicamente'),
    ('regular', 200, 600, 'Ve cine con frecuencia'),
    ('experto', 600, 10_000_000, 'Cinéfil@ intensiv@'),
]

# Categorías de criterio (rating promedio).
TASTE_BUCKETS = [
    ('exigente', 0.0, 3.35, 'Es exigente al puntuar'),
    ('equilibrado', 3.35, 3.85, 'Puntúa con criterio equilibrado'),
    ('entusiasta', 3.85, 5.1, 'Tiende a puntuar alto'),
]


def _bucket(value: float, buckets):
    for key, low, high, label in buckets:
        if low <= value < high:
            return key, label
    return buckets[-1][0], buckets[-1][3]


def format_genres(raw: str | None) -> str:
    if not raw:
        return ''
    parts = [GENRE_ES.get(p, p) for p in str(raw).split('|') if p]
    return ' · '.join(parts)


def genre_list(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [GENRE_ES.get(p, p) for p in str(raw).split('|') if p]


def persona_display_name(user_id: int) -> str:
    first = PERSONA_NAMES[user_id % len(PERSONA_NAMES)]
    last = PERSONA_LASTS[(user_id // len(PERSONA_NAMES)) % len(PERSONA_LASTS)]
    return f'{first} {last}'


# ---------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------


@dataclass
class Registry:
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
    _communities: list[dict[str, Any]] | None = None
    _community_by_id: dict[int, dict[str, Any]] | None = None
    _top_movies: list[dict[str, Any]] | None = None
    _genre_counts: list[dict[str, Any]] | None = None
    _lock: threading.RLock = field(default_factory=threading.RLock)

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

    # ---------- comunidades (clusters enriquecidos) ----------

    def _compute_communities(self) -> list[dict[str, Any]]:
        ic = self.item_clusters()
        uc = self.user_clusters()

        # Género dominante de cada cluster (aproximación: género primario
        # del catálogo del cluster, ponderado por cantidad).
        ic = ic.copy()
        ic['primary_genre'] = ic['genres'].fillna('').str.split('|').str[0]
        genre_by_cluster = (
            ic.groupby(['cluster', 'primary_genre']).size()
              .rename('n').reset_index()
        )
        idx = genre_by_cluster.groupby('cluster')['n'].idxmax()
        top_genre = genre_by_cluster.loc[idx, ['cluster', 'primary_genre']].rename(
            columns={'primary_genre': 'top_genre_en'}
        )

        rows = []
        for cluster_id, group in ic.groupby('cluster'):
            cid = int(cluster_id)
            tg_en = top_genre.loc[top_genre['cluster'] == cid, 'top_genre_en'].iloc[0]
            arch = ARCHETYPES.get(tg_en, ARCHETYPES['(no genres listed)'])
            top_rows = group.sort_values('rating_mean', ascending=False).head(6)
            top_titles = top_rows['title'].tolist()
            top_genres_en = top_rows['genres'].fillna('').str.split('|').str[0].tolist()
            rating_mean = float(group['rating_mean'].mean())
            taste_key, taste_label = _bucket(rating_mean, TASTE_BUCKETS)
            n_users = int((uc['cluster'] == cluster_id).sum())
            description = (
                f"{arch['tagline']} {taste_label.capitalize()}. "
                f"Esta comunidad agrupa {n_users} personas y cubre "
                f"{int(len(group))} películas de la muestra."
            )
            rows.append({
                'cluster': cid,
                'name': arch['name'],
                'tagline': arch['tagline'],
                'description': description,
                'color': CLUSTER_COLORS[cid % len(CLUSTER_COLORS)],
                'top_genre_en': tg_en,
                'top_genre_es': GENRE_ES.get(tg_en, tg_en),
                'rating_mean': round(rating_mean, 2),
                'taste': taste_key,
                'taste_label': taste_label,
                'n_users': n_users,
                'n_movies': int(len(group)),
                'n_ratings_median': int(group['n_ratings'].median()),
                'top_titles': top_titles,
                'top_genres': top_genres_en,
            })
        rows.sort(key=lambda r: r['cluster'])
        return rows

    def communities(self) -> list[dict[str, Any]]:
        if self._communities is None:
            with self._lock:
                if self._communities is None:
                    self._communities = self._compute_communities()
                    self._community_by_id = {c['cluster']: c for c in self._communities}
        return self._communities

    def community(self, cluster_id: int) -> dict[str, Any] | None:
        self.communities()
        return (self._community_by_id or {}).get(int(cluster_id))

    # ---------- personas enriquecidas ----------

    def _compute_personas(self) -> list[dict[str, Any]]:
        ratings = self.ratings()
        movies = self.movies().reset_index(drop=True)[['movieId', 'genres']]
        clusters = self.user_clusters()

        merged = ratings[['userId', 'movieId', 'rating']].merge(movies, on='movieId', how='inner')
        merged['primary_genre'] = merged['genres'].str.split('|').str[0]

        agg = merged.groupby('userId').agg(
            n_ratings=('rating', 'size'),
            rating_mean=('rating', 'mean'),
        ).reset_index()

        gc = merged.groupby(['userId', 'primary_genre']).size().rename('n').reset_index()
        idx = gc.groupby('userId')['n'].idxmax()
        favorite = gc.loc[idx, ['userId', 'primary_genre']].rename(columns={'primary_genre': 'top_genre'})

        summary = agg.merge(favorite, on='userId').merge(clusters, on='userId')
        summary = summary.sort_values('n_ratings', ascending=False)

        # Top 8 por cluster → ~48 personas.
        per_cluster = summary.groupby('cluster', group_keys=False).head(8)
        per_cluster = per_cluster.sort_values(['cluster', 'n_ratings'], ascending=[True, False])

        self.communities()  # asegura que community_by_id esté poblado

        personas: list[dict[str, Any]] = []
        for _, row in per_cluster.iterrows():
            user_id = int(row['userId'])
            genre_en = str(row['top_genre']) if row['top_genre'] else '(no genres listed)'
            genre_es = GENRE_ES.get(genre_en, genre_en)
            n = int(row['n_ratings'])
            mean_rating = float(row['rating_mean'])
            cluster_id = int(row['cluster'])
            community = (self._community_by_id or {}).get(cluster_id) or {}

            intensity_key, intensity_label = _bucket(n, INTENSITY_BUCKETS)
            taste_key, taste_label = _bucket(mean_rating, TASTE_BUCKETS)

            display_name = persona_display_name(user_id)
            headline = f'Amante de {genre_es.lower()}'
            description = (
                f'{intensity_label}. {taste_label.capitalize()} '
                f'(promedio {mean_rating:.2f}). Afín a la comunidad '
                f'"{community.get("name", "eclécticos")}".'
            )

            personas.append({
                'userId': user_id,
                'displayName': display_name,
                'headline': headline,
                'description': description,
                'genreEn': genre_en,
                'genreEs': genre_es,
                'nRatings': n,
                'ratingMean': round(mean_rating, 2),
                'intensity': intensity_key,
                'intensityLabel': intensity_label,
                'taste': taste_key,
                'tasteLabel': taste_label,
                'community': community.get('name', ''),
                'communityId': cluster_id,
                'color': community.get('color', CLUSTER_COLORS[cluster_id % len(CLUSTER_COLORS)]),
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

    # ---------- catálogo y utilidades UI ----------

    def top_movies(self, limit: int = 12) -> list[dict[str, Any]]:
        if self._top_movies is None:
            with self._lock:
                if self._top_movies is None:
                    baseline = self.baseline()
                    scores = baseline['bayesian_score_by_movieId']
                    movies = self.movies()
                    ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
                    rows = []
                    for movie_id, score in ordered:
                        if movie_id not in movies.index:
                            continue
                        row = movies.loc[movie_id]
                        rows.append({
                            'movieId': int(movie_id),
                            'title': row['title'],
                            'genres': format_genres(row['genres']),
                            'genresList': genre_list(row['genres']),
                            'score': round(float(score), 2),
                        })
                    self._top_movies = rows
        return self._top_movies[:limit]

    def top_movies_by_genre(self, genre_es: str, limit: int = 8) -> list[dict[str, Any]]:
        return [m for m in self.top_movies(limit=400) if genre_es in m['genresList']][:limit]

    def available_genres(self) -> list[dict[str, Any]]:
        if self._genre_counts is None:
            with self._lock:
                if self._genre_counts is None:
                    counts: dict[str, int] = {}
                    for raw in self.movies()['genres'].fillna(''):
                        for part in raw.split('|'):
                            if not part:
                                continue
                            key = GENRE_ES.get(part, part)
                            counts[key] = counts.get(key, 0) + 1
                    ordered = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
                    self._genre_counts = [
                        {'label': label, 'count': count}
                        for label, count in ordered
                        if label != 'Sin género'
                    ]
        return self._genre_counts

    # ---------- modelos ----------

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

    # ---------- helpers de predicción ----------

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
        for movie_id, _ in candidates:
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
                'genresList': genre_list(row['genres']),
                'score': round(float(score), 2),
            })
        return result

    def movie_lookup(
        self,
        query: str,
        limit: int = 15,
        genre_es: str | None = None,
        sort: str = 'score',
    ) -> list[dict[str, Any]]:
        q = (query or '').strip().lower()
        movies = self.movies()
        mask = pd.Series(True, index=movies.index)
        if q:
            mask &= movies['title'].str.lower().str.contains(q, regex=False, na=False)
        if genre_es:
            mask &= movies['genres'].fillna('').apply(
                lambda g: genre_es in genre_list(g)
            )
        subset = movies.loc[mask]
        baseline_scores: dict[int, float] = self.baseline()['bayesian_score_by_movieId']

        rows = []
        for _, r in subset.iterrows():
            movie_id = int(r['movieId'])
            rows.append({
                'movieId': movie_id,
                'title': r['title'],
                'genres': format_genres(r['genres']),
                'genresList': genre_list(r['genres']),
                'bayesian': round(float(baseline_scores.get(movie_id, 0.0)), 2),
            })

        if sort == 'alpha':
            rows.sort(key=lambda r: r['title'].lower())
        else:
            rows.sort(key=lambda r: r['bayesian'], reverse=True)
        return rows[:limit]

    def movie_by_id(self, movie_id: int) -> dict[str, Any] | None:
        movies = self.movies()
        if movie_id not in movies.index:
            return None
        row = movies.loc[movie_id]
        return {
            'movieId': int(movie_id),
            'title': row['title'],
            'genres': format_genres(row['genres']),
            'genresList': genre_list(row['genres']),
        }

    # ---------- startup ----------

    def warmup(self) -> None:
        self.movies()
        self.baseline()
        self.metrics()
        self.communities()
        self.personas()
        self.top_movies()
        self.available_genres()
        try:
            self.model('svd')
            self.model('nmf')
        except FileNotFoundError:
            pass


def _build_registry() -> Registry:
    return Registry(
        models_dir=Path(settings.OMNIREC_MODELS_DIR),
        data_dir=Path(settings.OMNIREC_DATA_DIR),
    )


registry: Registry = _build_registry()
