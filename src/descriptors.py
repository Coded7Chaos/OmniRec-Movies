"""Construcción de descriptores textuales por película (la base de conocimiento del RAG).

Descriptor = título limpio + año + géneros + top-N tags genome más relevantes.
Ejemplo:
    "The Matrix (1999). Géneros: Action, Sci-Fi. Temas: virtual reality,
     dystopia, artificial intelligence, philosophy, ..."

Las películas sin genome score (long tail) reciben un descriptor degradado
(solo título + géneros); ese caso se cuantifica como cobertura en el informe.
"""
from __future__ import annotations

import re
from pathlib import Path

import pandas as pd
import polars as pl

from src import config
from src.data import load_genome_scores_lazy, load_genome_tags, load_movies
from src.utils import get_logger

log = get_logger("omnirec.descriptors")

_ARTICLE_RE = re.compile(
    r"^(?P<title>.*), (?P<art>The|A|An|El|La|Los|Las|Le|Les|Der|Das|Il)(?P<alt> \(.*\))?$"
)
_YEAR_RE = re.compile(r"\s*\((\d{4})\)\s*$")


def clean_title(raw: str) -> tuple[str, int | None]:
    """'Matrix, The (1999)' -> ('The Matrix', 1999). Igual criterio que el backend."""
    year = None
    m = _YEAR_RE.search(raw)
    if m:
        year = int(m.group(1))
        raw = _YEAR_RE.sub("", raw)
    m = _ARTICLE_RE.match(raw.strip())
    if m:
        raw = f"{m.group('art')} {m.group('title')}{m.group('alt') or ''}"
    return raw.strip(), year


def _genres_list(genres: str) -> list[str]:
    return [g for g in (genres or "").split("|") if g and g != "(no genres listed)"]


def _top_tags_per_movie(top_n: int, min_rel: float) -> dict[int, list[str]]:
    """Top-N tags genome por película (ordenados por relevancia descendente)."""
    tags = pl.from_pandas(load_genome_tags()[["tagId", "tag"]])
    ranked = (
        load_genome_scores_lazy()
        .filter(pl.col("relevance") >= min_rel)
        .join(tags.lazy(), on="tagId", how="inner")
        .sort(["movieId", "relevance"], descending=[False, True])
        .group_by("movieId", maintain_order=True)
        .agg(pl.col("tag").head(top_n).alias("tags"))
        .collect()
    )
    return {int(mid): list(t) for mid, t in zip(ranked["movieId"], ranked["tags"])}


def _popularity_by_movie() -> dict[int, int]:
    """Número de ratings por película (prior de popularidad para el re-ranking)."""
    path = config.path("data_intermediate") / "item_clusters.parquet"
    if not path.exists():
        return {}
    df = pd.read_parquet(path)[["movieId", "n_ratings"]]
    return {int(m): int(n) for m, n in zip(df["movieId"], df["n_ratings"])}


def build_descriptors() -> pd.DataFrame:
    """Construye el DataFrame de descriptores para todo el catálogo."""
    cfg = config.rag_cfg()["descriptors"]
    movies = load_movies()
    log.info("Agregando top-%d tags genome (relevancia >= %.2f)...",
             cfg["top_tags"], cfg["min_relevance"])
    tags_by_movie = _top_tags_per_movie(cfg["top_tags"], cfg["min_relevance"])
    pop_by_movie = _popularity_by_movie()

    rows = []
    for r in movies.itertuples(index=False):
        title, year = clean_title(r.title)
        genres = _genres_list(r.genres)
        top_tags = tags_by_movie.get(int(r.movieId), [])
        parts = [f"{title}" + (f" ({year})" if year else "") + "."]
        if genres:
            parts.append("Géneros: " + ", ".join(genres) + ".")
        if top_tags:
            parts.append("Temas: " + ", ".join(top_tags) + ".")
        rows.append({
            "movieId": int(r.movieId),
            "title": title,
            "year": year,
            "genres": genres,
            "top_tags": top_tags,
            "has_genome": bool(top_tags),
            "n_ratings": int(pop_by_movie.get(int(r.movieId), 0)),
            "descriptor": " ".join(parts),
        })

    df = pd.DataFrame(rows)
    cov = df["has_genome"].mean()
    log.info("Descriptores: %d (con genome: %d, cobertura %.1f%%)",
             len(df), int(df["has_genome"].sum()), 100 * cov)
    return df


def descriptors_path() -> Path:
    return config.path("data_intermediate") / "descriptors.parquet"


def save_descriptors(df: pd.DataFrame) -> Path:
    path = descriptors_path()
    df.to_parquet(path, index=False)
    log.info("Descriptores guardados: %s", path)
    return path


def load_descriptors() -> pd.DataFrame:
    path = descriptors_path()
    if not path.exists():
        raise FileNotFoundError(
            f"No existe {path}. Ejecuta la etapa 'prepare' del pipeline."
        )
    return pd.read_parquet(path)


if __name__ == "__main__":
    save_descriptors(build_descriptors())
