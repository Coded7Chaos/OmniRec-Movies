"""Genera el baseline de popularidad bayesiana (fórmula IMDb del notebook 03).

Produce `models/baseline_scores.pkl`, el artefacto que el backend usa para el
ranking *cold-start* (usuarios sin historial). Reproduce exactamente la fórmula
del notebook 03:

    C = media global de ratings
    m = percentil 60 del número de votos por película
    score = (v / (v + m)) · media_pelicula + (m / (v + m)) · C
"""
from __future__ import annotations

import pickle

from src import config
from src.data import load_ratings
from src.utils import get_logger

log = get_logger("omnirec.baseline")


def build_baseline() -> dict:
    ratings, label = load_ratings()
    stats = ratings.groupby("movieId")["rating"].agg(
        n_votes="count", mean_rating="mean"
    ).reset_index()

    C = float(ratings["rating"].mean())
    m = float(stats["n_votes"].quantile(0.60))

    stats["bayesian"] = (
        (stats["n_votes"] / (stats["n_votes"] + m)) * stats["mean_rating"]
        + (m / (stats["n_votes"] + m)) * C
    )
    score_dict = {int(mid): float(s) for mid, s in zip(stats["movieId"], stats["bayesian"])}

    artifact = {
        "bayesian_score_by_movieId": score_dict,
        "global_mean_C": C,
        "m_prior": m,
    }
    out = config.path("models") / "baseline_scores.pkl"
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "wb") as f:
        pickle.dump(artifact, f)
    log.info("Baseline guardado: %s (C=%.4f, m=%.0f, %d películas)",
             out, C, m, len(score_dict))
    return {"path": str(out), "dataset": label, "global_mean_C": round(C, 4),
            "m_prior": round(m, 1), "n_movies": len(score_dict)}


if __name__ == "__main__":
    print(build_baseline())
