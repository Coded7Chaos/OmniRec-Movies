"""Carga y validación de los parquets de entrada del pipeline.

Fuentes (generadas por los notebooks 02/03, ver reports/Proyecto.md):
- ``movies_prepared_60pct.parquet``        catálogo (movieId, title, genres).
- ``genome_scores_prepared_60pct.parquet`` relevancia tag-película (movieId, tagId, relevance).
- ``genome_tags.parquet``                  diccionario de 1 128 tags (tagId, tag).
- ratings (primer candidato que exista)    (userId, movieId, rating, [timestamp]).

Se usa Polars para la agregación pesada del genome (15.5 M filas) y Pandas para
el resto, manteniendo el contrato de datos que ya consume el backend.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd
import polars as pl

from src import config
from src.utils import get_logger

log = get_logger("omnirec.data")


def _int_path(name: str) -> Path:
    return config.path("data_intermediate") / name


def _require(path: Path) -> Path:
    if not path.exists():
        raise FileNotFoundError(
            f"Falta el parquet de entrada: {path}\n"
            "Ejecuta primero los notebooks 02/03 o coloca los parquets en "
            "data/intermediate/."
        )
    return path


# --------------------------------------------------------------------------- catálogo
def load_movies() -> pd.DataFrame:
    """Catálogo de películas (movieId, title, genres)."""
    cfg = config.pipeline_cfg()["data"]
    df = pd.read_parquet(_require(_int_path(cfg["movies"])))
    expected = {"movieId", "title", "genres"}
    missing = expected - set(df.columns)
    if missing:
        raise ValueError(f"movies parquet sin columnas {missing}")
    log.info("Catálogo: %d películas", len(df))
    return df


# --------------------------------------------------------------------------- genome
def load_genome_tags() -> pd.DataFrame:
    """Diccionario de tags genome (tagId, tag)."""
    cfg = config.pipeline_cfg()["data"]
    df = pd.read_parquet(_require(_int_path(cfg["genome_tags"])))
    log.info("Genome tags: %d", len(df))
    return df


def load_genome_scores_lazy() -> pl.LazyFrame:
    """Scores de relevancia tag-película como LazyFrame de Polars (15.5 M filas)."""
    cfg = config.pipeline_cfg()["data"]
    return pl.scan_parquet(_require(_int_path(cfg["genome_scores"])))


# --------------------------------------------------------------------------- ratings
def resolve_ratings_path() -> Path:
    """Primer parquet de ratings disponible según el orden de candidatos."""
    cfg = config.pipeline_cfg()["data"]
    for name in cfg["ratings_candidates"]:
        p = _int_path(name)
        if p.exists():
            return p
    raise FileNotFoundError(
        "No se encontró ningún parquet de ratings en data/intermediate/ "
        f"(candidatos: {cfg['ratings_candidates']})."
    )


def load_ratings() -> tuple[pd.DataFrame, str]:
    """Ratings disponibles + etiqueta del subconjunto usado (para trazabilidad)."""
    path = resolve_ratings_path()
    df = pd.read_parquet(path)
    cols = {"userId", "movieId", "rating"}
    missing = cols - set(df.columns)
    if missing:
        raise ValueError(f"ratings parquet sin columnas {missing}")
    df = df.astype({"userId": "int32", "movieId": "int32", "rating": "float32"})
    label = path.stem
    log.info("Ratings: %s (%d filas, %d usuarios, %d películas)",
             label, len(df), df["userId"].nunique(), df["movieId"].nunique())
    return df, label


# --------------------------------------------------------------------------- validación
def validate_inputs() -> dict:
    """Comprueba la presencia y forma de todas las entradas. Útil para `prepare`."""
    report: dict[str, object] = {}
    movies = load_movies()
    tags = load_genome_tags()
    scores_n = load_genome_scores_lazy().select(pl.len()).collect().item()
    ratings_path = resolve_ratings_path()
    report["movies"] = len(movies)
    report["genome_tags"] = len(tags)
    report["genome_scores_rows"] = int(scores_n)
    report["ratings_source"] = ratings_path.name
    report["movies_with_genome"] = (
        load_genome_scores_lazy().select(pl.col("movieId").n_unique()).collect().item()
    )
    log.info("Validación de entradas OK: %s", report)
    return report
