from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from db_models import User
from ml.engine import get_engine
from routers.ratings import user_ratings_map
from schemas import GuestRatingsRequest
from security import get_current_user, get_current_user_optional

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])

HOME_GENRES = ["Action", "Comedy", "Drama", "Animation", "Sci-Fi", "Horror"]
GENRE_LABELS = {
    "Action": "Acción y aventura", "Comedy": "Para reír sin parar",
    "Drama": "Dramas imperdibles", "Animation": "Animación para todos",
    "Sci-Fi": "Ciencia ficción", "Horror": "Noche de terror",
}


@router.get("")
def recommendations(
    limit: int = Query(20, ge=1, le=60),
    genre: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Top-N personalizado para el usuario autenticado (SVD re-ranking)."""
    ratings = user_ratings_map(db, user.id)
    result = get_engine().recommend(ratings, n=limit, genre=genre)
    return {**result, "basedOn": len(ratings)}


@router.post("/guest")
def guest_recommendations(
    body: GuestRatingsRequest,
    limit: int = Query(20, ge=1, le=60),
    genre: str | None = None,
):
    """Personalización para invitados: recibe el feedback guardado en el navegador."""
    ratings = {r.movieId: r.rating for r in body.ratings}
    result = get_engine().recommend(ratings, n=limit, genre=genre)
    return {**result, "basedOn": len(ratings)}


@router.get("/home")
def home_sections(
    user: User | None = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """Payload completo de la portada: héroe, top, populares y filas por género."""
    engine = get_engine()
    hero_ids = engine.popular(6)
    sections = [
        {
            "key": "top-rated",
            "title": "Los más aclamados",
            "subtitle": "Ranking bayesiano histórico del catálogo",
            "movies": engine.movies_payload(engine.popular(18)),
        },
    ]
    if user is not None:
        ratings = user_ratings_map(db, user.id)
        if ratings:
            rec = engine.recommend(ratings, n=18)
            sections.insert(0, {
                "key": "for-you",
                "title": f"Para ti, {user.username}",
                "subtitle": f"Basado en tus {len(ratings)} calificaciones (modelo SVD)",
                "movies": rec["results"],
            })
    for g in HOME_GENRES:
        sections.append({
            "key": f"genre-{g.lower()}",
            "title": GENRE_LABELS.get(g, g),
            "subtitle": None,
            "genre": g,
            "movies": engine.movies_payload(engine.popular(18, genre=g)),
        })
    return {"hero": engine.movies_payload(hero_ids), "sections": sections}


@router.post("/home/guest")
def home_sections_guest(body: GuestRatingsRequest):
    """Portada para invitados con feedback local: añade la fila personalizada."""
    engine = get_engine()
    payload = {"hero": engine.movies_payload(engine.popular(6)), "sections": []}
    ratings = {r.movieId: r.rating for r in body.ratings}
    if ratings:
        rec = engine.recommend(ratings, n=18)
        if rec["strategy"] == "svd_fold_in":
            payload["sections"].append({
                "key": "for-you",
                "title": "Para ti",
                "subtitle": f"Basado en tus {len(ratings)} calificaciones guardadas en este dispositivo",
                "movies": rec["results"],
            })
    payload["sections"].append({
        "key": "top-rated",
        "title": "Los más aclamados",
        "subtitle": "Ranking bayesiano histórico del catálogo",
        "movies": engine.movies_payload(engine.popular(18)),
    })
    for g in HOME_GENRES:
        payload["sections"].append({
            "key": f"genre-{g.lower()}",
            "title": GENRE_LABELS.get(g, g),
            "subtitle": None,
            "genre": g,
            "movies": engine.movies_payload(engine.popular(18, genre=g)),
        })
    return payload


@router.post("/affinity/{movie_id}")
def guest_affinity(movie_id: int, body: GuestRatingsRequest):
    """Predicción de afinidad de un invitado con una película."""
    ratings = {r.movieId: r.rating for r in body.ratings}
    return {"movieId": movie_id, "predictedRating": get_engine().predict_rating(ratings, movie_id)}


@router.get("/affinity/{movie_id}")
def user_affinity(
    movie_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ratings = user_ratings_map(db, user.id)
    return {"movieId": movie_id, "predictedRating": get_engine().predict_rating(ratings, movie_id)}
