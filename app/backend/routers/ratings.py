from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from db_models import Rating, User, WatchlistItem
from ml.engine import get_engine
from schemas import RatingIn, RatingsSyncRequest, WatchlistIn
from security import get_current_user

router = APIRouter(prefix="/api/ratings", tags=["ratings"])
watchlist_router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


def user_ratings_map(db: Session, user_id: int) -> dict[int, float]:
    rows = db.query(Rating.movie_id, Rating.rating).filter(Rating.user_id == user_id).all()
    return {movie_id: rating for movie_id, rating in rows}


def _upsert(db: Session, user_id: int, movie_id: int, value: float) -> None:
    row = db.query(Rating).filter_by(user_id=user_id, movie_id=movie_id).first()
    if row:
        row.rating = value
    else:
        db.add(Rating(user_id=user_id, movie_id=movie_id, rating=value))


@router.get("")
def my_ratings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    engine = get_engine()
    rows = (
        db.query(Rating)
        .filter(Rating.user_id == user.id)
        .order_by(Rating.updated_at.desc())
        .all()
    )
    results = []
    for row in rows:
        payload = engine.movie_payload(row.movie_id, userRating=row.rating)
        if payload:
            results.append(payload)
    return {"total": len(results), "results": results}


@router.post("")
def rate_movie(body: RatingIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _upsert(db, user.id, body.movieId, body.rating)
    db.commit()
    return {"ok": True, "movieId": body.movieId, "rating": body.rating}


@router.post("/sync")
def sync_ratings(body: RatingsSyncRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Importa los ratings de invitado (localStorage) al crear sesión.

    No sobreescribe ratings que el usuario ya tenga en el servidor.
    """
    existing = set(user_ratings_map(db, user.id))
    imported = 0
    for item in body.ratings:
        if item.movieId in existing:
            continue
        db.add(Rating(user_id=user.id, movie_id=item.movieId, rating=item.rating))
        imported += 1
    db.commit()
    return {"ok": True, "imported": imported}


@router.delete("/{movie_id}")
def delete_rating(movie_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Rating).filter_by(user_id=user.id, movie_id=movie_id).delete()
    db.commit()
    return {"ok": True}


@watchlist_router.get("")
def my_watchlist(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    engine = get_engine()
    rows = (
        db.query(WatchlistItem)
        .filter(WatchlistItem.user_id == user.id)
        .order_by(WatchlistItem.added_at.desc())
        .all()
    )
    results = [p for row in rows if (p := engine.movie_payload(row.movie_id))]
    return {"total": len(results), "results": results}


@watchlist_router.post("")
def add_to_watchlist(body: WatchlistIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    exists = db.query(WatchlistItem).filter_by(user_id=user.id, movie_id=body.movieId).first()
    if not exists:
        db.add(WatchlistItem(user_id=user.id, movie_id=body.movieId))
        db.commit()
    return {"ok": True}


@watchlist_router.delete("/{movie_id}")
def remove_from_watchlist(movie_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(WatchlistItem).filter_by(user_id=user.id, movie_id=movie_id).delete()
    db.commit()
    return {"ok": True}
