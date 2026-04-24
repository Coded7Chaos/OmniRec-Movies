"""
Capa de servicio del sistema de recomendación.
"""

from __future__ import annotations

import pickle
import threading
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd
import numpy as np
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Avg
from .models import Movie, MovieRating

# ---------------------------------------------------------------------
# Metadata de Comunidades (Arquetipos)
# ---------------------------------------------------------------------

COMMUNITY_PROFILES = {
    0: {
        'name': 'Críticos Exigentes',
        'tagline': 'Dramas profundos y cine de autor.',
        'description': 'Valoras guiones complejos y propuestas cinematográficas arriesgadas. No te impresionas fácilmente con los efectos especiales.',
        'emoji': '🎭'
    },
    1: {
        'name': 'Fans del Mainstream',
        'tagline': 'Grandes éxitos y entretenimiento.',
        'description': 'Disfrutas de las películas que marcan tendencia. Te gusta estar al día con lo que todos están viendo.',
        'emoji': '🍿'
    },
    2: {
        'name': 'Buscadores de Adrenalina',
        'tagline': 'Acción, aventura y mundos fantásticos.',
        'description': 'Buscas escapar de la realidad con emociones fuertes, mucha acción y ciencia ficción visualmente impactante.',
        'emoji': '🚀'
    },
    3: {
        'name': 'Cinéfilos Románticos',
        'tagline': 'Historias humanas y clásicos.',
        'description': 'Te conmueven las historias bien contadas sobre relaciones humanas, romance y los grandes clásicos del cine.',
        'emoji': '❤️'
    },
    4: {
        'name': 'Audiencia Familiar',
        'tagline': 'Animación y aventuras para todos.',
        'description': 'Prefieres el cine que puede disfrutar toda la familia: mucha animación, fantasía y humor ligero.',
        'emoji': '🦄'
    },
    5: {
        'name': 'Exploradores de Nicho',
        'tagline': 'Documentales y cine independiente.',
        'description': 'Tienes gustos muy específicos. Te interesan los temas reales y las visiones únicas de directores independientes.',
        'emoji': '🕵️'
    }
}

# ---------------------------------------------------------------------
# Metadata de Modelos
# ---------------------------------------------------------------------

MODEL_LABELS: dict[str, str] = {
    'baseline': 'Popularidad ponderada',
    'knn': 'Vecinos cercanos (KNN)',
    'svd': 'Factorización SVD',
    'nmf': 'Factorización NMF',
    'automl': 'AutoML (mejor RMSE)',
}

MODEL_HINTS: dict[str, str] = {
    'baseline': 'Rápido. Ordena por popularidad ajustada (score bayesiano global).',
    'knn': 'Basado en similitud ítem-ítem. Muy bueno para usuarios nuevos.',
    'svd': 'Recomendado. Captura gustos latentes profundos.',
    'nmf': 'Factores interpretables como mezclas de temas.',
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
    'Action': 'Acción', 'Adventure': 'Aventura', 'Animation': 'Animación',
    'Children': 'Infantil', 'Comedy': 'Comedia', 'Crime': 'Crimen',
    'Documentary': 'Documental', 'Drama': 'Drama', 'Fantasy': 'Fantasía',
    'Film-Noir': 'Cine negro', 'Horror': 'Terror', 'IMAX': 'IMAX',
    'Musical': 'Musical', 'Mystery': 'Misterio', 'Romance': 'Romance',
    'Sci-Fi': 'Ciencia ficción', 'Thriller': 'Suspenso', 'War': 'Bélico',
    'Western': 'Western', '(no genres listed)': 'Sin género',
}

CLUSTER_COLORS: list[str] = [
    '#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#9333ea', '#dc2626', '#0ea5e9',
]

# ---------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------

@dataclass
class Registry:
    models_dir: Path
    data_dir: Path

    _models: dict[str, Any] = field(default_factory=dict)
    _movies_df: pd.DataFrame | None = None
    _user_clusters: pd.DataFrame | None = None
    _item_clusters: pd.DataFrame | None = None
    _baseline_data: dict[str, Any] | None = None
    _centroids: np.ndarray | None = None
    _lock: threading.RLock = field(default_factory=threading.RLock)

    def load_model(self, key: str) -> Any:
        if key not in self._models:
            with self._lock:
                if key not in self._models:
                    path = self.models_dir / MODEL_FILES[key]
                    if not path.exists(): raise FileNotFoundError(f"Model {key} not found.")
                    with path.open('rb') as f:
                        self._models[key] = pickle.load(f)
        return self._models[key]

    def movies_df(self) -> pd.DataFrame:
        if self._movies_df is None:
            self._movies_df = pd.read_parquet(self.data_dir / 'movies_sample.parquet').set_index('movieId', drop=False)
        return self._movies_df

    def user_clusters(self) -> pd.DataFrame:
        if self._user_clusters is None:
            self._user_clusters = pd.read_parquet(self.data_dir / 'user_clusters.parquet')
        return self._user_clusters

    def item_clusters(self) -> pd.DataFrame:
        if self._item_clusters is None:
            self._item_clusters = pd.read_parquet(self.data_dir / 'item_clusters.parquet')
        return self._item_clusters

    def baseline(self) -> dict[str, Any]:
        if self._baseline_data is None: self._baseline_data = self.load_model('baseline')
        return self._baseline_data

    def _calculate_centroids(self):
        """Calcula los centros de los clústeres usando los factores del modelo SVD."""
        svd = self.load_model('svd')
        uc = self.user_clusters()
        
        # Extraer factores pu de los usuarios que están en el parquet de clusters
        user_factors = []
        cluster_labels = []
        
        for _, row in uc.iterrows():
            uid = int(row['userId'])
            try:
                inner_uid = svd.trainset.to_inner_uid(uid)
                user_factors.append(svd.pu[inner_uid])
                cluster_labels.append(row['cluster'])
            except ValueError:
                continue
        
        df_factors = pd.DataFrame(user_factors)
        df_factors['cluster'] = cluster_labels
        
        # Centros: promedio de factores por clúster
        self._centroids = df_factors.groupby('cluster').mean().sort_index().values

    def get_user_profile(self, user: User) -> dict:
        ratings = MovieRating.objects.filter(user=user, rating__gte=3.5)
        n_ratings = ratings.count()
        if n_ratings < 3:
            return {'has_profile': False, 'message': 'Puntúa al menos 3 películas para identificar tu comunidad de gustos.'}
        
        svd = self.load_model('svd')
        if self._centroids is None:
            self._calculate_centroids()

        movie_ids = ratings.values_list('movie_id', flat=True)
        factors = []
        for mid in movie_ids:
            try:
                inner_id = svd.trainset.to_inner_iid(mid)
                factors.append(svd.qi[inner_id])
            except: continue
            
        if not factors:
            return {'has_profile': False, 'message': 'Películas no disponibles para inferencia.'}
        
        user_vector = np.mean(factors, axis=0)
        distances = np.linalg.norm(self._centroids - user_vector, axis=1)
        closest_cluster = int(np.argmin(distances))
        
        profile_info = COMMUNITY_PROFILES[closest_cluster]
        stats = MovieRating.objects.filter(user=user).aggregate(avg=Avg('rating'))
        
        return {
            'has_profile': True,
            'cluster_id': closest_cluster,
            'name': profile_info['name'],
            'tagline': profile_info['tagline'],
            'description': profile_info['description'],
            'emoji': profile_info['emoji'],
            'color': CLUSTER_COLORS[closest_cluster % len(CLUSTER_COLORS)],
            'n_ratings': n_ratings,
            'stats': {'avg_rating': round(float(stats['avg']), 2) if stats['avg'] else 0}
        }

    def sync_catalog(self):
        df = self.movies_df()
        to_create = []
        existing_ids = set(Movie.objects.values_list('movie_id', flat=True))
        for _, row in df.iterrows():
            mid = int(row['movieId'])
            if mid not in existing_ids:
                to_create.append(Movie(movie_id=mid, title=row['title'], genres=row['genres']))
        if to_create:
            Movie.objects.bulk_create(to_create)
            return len(to_create)
        return 0

    def get_recommendations(self, user: User, model_key: str = 'svd', n: int = 10) -> list[dict]:
        user_ratings = MovieRating.objects.filter(user=user).values_list('movie_id', 'rating')
        if not user_ratings: return self.get_top_popular(n=n)
        rated_movie_ids = {r[0] for r in user_ratings}
        model = self.load_model(model_key if model_key != 'automl' else 'automl')
        if model_key == 'automl': model = model['model']
        candidates = self.get_top_popular(n=300)
        scored = []
        for movie in candidates:
            mid = movie['movieId']
            if mid in rated_movie_ids: continue
            try:
                pred = model.predict(-1, mid).est
                scored.append((mid, pred))
            except:
                scored.append((mid, movie['score']))
        scored.sort(key=lambda x: x[1], reverse=True)
        result = []
        df = self.movies_df()
        for mid, score in scored[:n]:
            row = df.loc[mid]
            result.append({
                'movieId': mid, 'title': row['title'],
                'genres': row['genres'], 'score': round(float(score), 2)
            })
        return result

    def get_top_popular(self, n: int = 10) -> list[dict]:
        scores = self.baseline()['bayesian_score_by_movieId']
        df = self.movies_df()
        ordered = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        result = []
        for mid, score in ordered:
            if mid in df.index:
                row = df.loc[mid]
                result.append({
                    'movieId': mid, 'title': row['title'],
                    'genres': row['genres'], 'score': round(float(score), 2)
                })
            if len(result) >= n: break
        return result

    def get_communities(self) -> list[dict]:
        ic = self.item_clusters()
        rows = []
        for cluster_id, group in ic.groupby('cluster'):
            cid = int(cluster_id)
            profile = COMMUNITY_PROFILES.get(cid, {'name': f'Comunidad {cid}'})
            rows.append({
                'cluster': cid, 'name': profile['name'], 'color': CLUSTER_COLORS[cid % len(CLUSTER_COLORS)],
                'n_movies': len(group), 'avg_rating': round(group['rating_mean'].mean(), 2)
            })
        return rows

    def metrics(self) -> list[dict]:
        path = self.data_dir / 'model_comparison.csv'
        return pd.read_csv(path).to_dict(orient='records') if path.exists() else []

    def available_genres(self) -> list[dict]:
        """Calcula dinámicamente la lista de géneros y sus conteos desde el catálogo."""
        df = self.movies_df()
        # Separar géneros por el pipe '|' y explotarlos en filas individuales
        all_genres = df['genres'].str.split('|').explode()
        counts = all_genres.value_counts()
        
        result = []
        for genre_raw, count in counts.items():
            if not genre_raw or genre_raw == '(no genres listed)':
                continue
            result.append({
                'label': GENRE_ES.get(genre_raw, genre_raw),
                'raw': genre_raw,
                'count': int(count)
            })
        # Ordenar por los más frecuentes
        return sorted(result, key=lambda x: x['count'], reverse=True)

    def movie_lookup(self, query: str = '', genre: str | None = None, limit: int = 18, sort: str = 'score') -> list[dict]:
        """Realiza búsquedas y filtrado de películas para el catálogo."""
        df = self.movies_df()
        
        # Filtro por Género (usamos el nombre en inglés que es el 'raw')
        if genre:
            df = df[df['genres'].str.contains(genre, case=False, na=False)]
            
        # Filtro por Título
        if query:
            df = df[df['title'].str.contains(query, case=False, na=False)]
            
        # Ordenamiento
        if sort == 'score':
            # Intentamos ordenar por score bayesiano si está disponible
            scores = self.baseline().get('bayesian_score_by_movieId', {})
            df['tmp_score'] = df.index.map(lambda x: scores.get(x, 0))
            df = df.sort_values('tmp_score', ascending=False)
        else:
            df = df.sort_values('title')
            
        hits = []
        for mid, row in df.head(limit).iterrows():
            hits.append({
                'movieId': int(mid),
                'title': row['title'],
                'genres': row['genres'],
                'score': round(float(scores.get(mid, 0)), 2) if sort == 'score' else None
            })
        return hits

registry = Registry(
    models_dir=Path(settings.OMNIREC_MODELS_DIR),
    data_dir=Path(settings.OMNIREC_DATA_DIR)
)
