"""Asignación de arquetipos (personas) a los clústeres de usuarios del SVD.

Los clústeres provienen del KMeans (k=6) sobre los embeddings de usuarios
entrenados en el notebook 03. Cada clúster se caracteriza por los géneros con
mayor *lift* (preferencia relativa frente a la población global) y se le asigna
el arquetipo con mejor afinidad, garantizando nombres únicos.
"""
from __future__ import annotations

ARCHETYPES: list[dict] = [
    {
        "key": "espiritus-jovenes",
        "name": "Espíritus Jóvenes",
        "icon": "sparkles",
        "color": "#c9a03f",
        "genres": {"Children": 3, "Animation": 3, "Fantasy": 2, "Musical": 1, "Comedy": 1},
        "description": "Te conquistan la animación, la fantasía y las historias que despiertan al niño interior.",
    },
    {
        "key": "buscadores-adrenalina",
        "name": "Buscadores de Adrenalina",
        "icon": "zap",
        "color": "#b3262e",
        "genres": {"Action": 3, "IMAX": 2, "Sci-Fi": 2, "Thriller": 2, "Adventure": 2},
        "description": "Explosiones, persecuciones y pantallas gigantes: el cine es para sentirlo a máxima velocidad.",
    },
    {
        "key": "detectives-medianoche",
        "name": "Detectives de Medianoche",
        "icon": "moon",
        "color": "#6b7aa8",
        "genres": {"Mystery": 3, "Crime": 3, "Thriller": 2, "Film-Noir": 2, "Drama": 1},
        "description": "Tramas que se desenredan lento, giros imposibles y crímenes por resolver: tu territorio.",
    },
    {
        "key": "corazones-romanticos",
        "name": "Corazones Románticos",
        "icon": "heart",
        "color": "#a86478",
        "genres": {"Romance": 3, "Musical": 2, "Drama": 2, "Comedy": 1},
        "description": "Historias que emocionan: romances, musicales y dramas que se quedan contigo días enteros.",
    },
    {
        "key": "amantes-terror",
        "name": "Amantes del Terror",
        "icon": "ghost",
        "color": "#5f8a6c",
        "genres": {"Horror": 3, "Thriller": 2, "Mystery": 1},
        "description": "Cuanto más oscura la sala y más tensa la escena, mejor. El miedo es tu género favorito.",
    },
    {
        "key": "exploradores-mundos",
        "name": "Exploradores de Mundos",
        "icon": "rocket",
        "color": "#5b89a6",
        "genres": {"Sci-Fi": 3, "Fantasy": 2, "Adventure": 2, "IMAX": 1, "Animation": 1},
        "description": "Galaxias lejanas, mundos imposibles y futuros por descubrir: el cine como puerta de escape.",
    },
    {
        "key": "criticos-exigentes",
        "name": "Críticos Exigentes",
        "icon": "award",
        "color": "#a8946b",
        "genres": {"Drama": 3, "Documentary": 2, "Film-Noir": 1, "War": 1},
        "description": "El cine de autor, los guiones impecables y las actuaciones memorables son tu estándar.",
    },
    {
        "key": "comediantes-natos",
        "name": "Comediantes Natos",
        "icon": "laugh",
        "color": "#b98a3d",
        "genres": {"Comedy": 3, "Romance": 1, "Animation": 1},
        "description": "Vas al cine a reírte. Las mejores comedias del catálogo siempre pasan por tu radar.",
    },
]


def assign_personas(cluster_profiles: list[dict]) -> dict[int, dict]:
    """Asigna a cada clúster el arquetipo de mayor afinidad (greedy, sin repetir).

    La afinidad pondera el lift de los géneros top del clúster con los pesos de
    género de cada arquetipo. Los clústeres se procesan del más definido al
    menos definido para que la asignación greedy reparta bien los nombres.
    """
    def affinity(profile: dict, archetype: dict) -> float:
        score = 0.0
        for rank, genre in enumerate(profile["top_genres"]):
            weight = archetype["genres"].get(genre, 0)
            lift = profile.get("genre_lift", {}).get(genre, 1.0)
            score += weight * lift * (1.0 - 0.15 * rank)
        return score

    order = sorted(
        cluster_profiles,
        key=lambda p: max(p.get("genre_lift", {}).values(), default=1.0),
        reverse=True,
    )
    used: set[str] = set()
    result: dict[int, dict] = {}
    for profile in order:
        ranked = sorted(ARCHETYPES, key=lambda a: affinity(profile, a), reverse=True)
        chosen = next((a for a in ranked if a["key"] not in used), ranked[0])
        used.add(chosen["key"])
        result[profile["cluster"]] = {
            **{k: chosen[k] for k in ("key", "name", "icon", "color", "description")},
            "cluster": profile["cluster"],
            "top_genres": profile["top_genres"],
            "n_users": profile["n_users"],
            "avg_rating": round(profile["avg_rating"], 2),
        }
    return result
