from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from db_models import User
from ml.engine import get_engine
from routers.ratings import user_ratings_map
from schemas import GuestRatingsRequest
from security import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


def _profile_payload(ratings: dict[int, float]) -> dict:
    engine = get_engine()
    persona = engine.persona_for(ratings)

    genre_counts: Counter[str] = Counter()
    for movie_id in ratings:
        if movie_id in engine.movies.index:
            genre_counts.update(engine.movies.at[movie_id, "genres_list"])

    values = list(ratings.values())
    return {
        "persona": persona,
        "stats": {
            "totalRatings": len(ratings),
            "avgRating": round(sum(values) / len(values), 2) if values else None,
            "fiveStars": sum(1 for v in values if v >= 4.5),
            "topGenres": [
                {"genre": genre, "count": count}
                for genre, count in genre_counts.most_common(5)
            ],
        },
        "allPersonas": engine.all_personas(),
    }


@router.get("")
def my_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ratings = user_ratings_map(db, user.id)
    return {
        "user": {"id": user.id, "username": user.username, "email": user.email,
                 "memberSince": user.created_at.isoformat()},
        **_profile_payload(ratings),
    }


@router.post("/guest")
def guest_profile(body: GuestRatingsRequest):
    ratings = {r.movieId: r.rating for r in body.ratings}
    return {"user": None, **_profile_payload(ratings)}
