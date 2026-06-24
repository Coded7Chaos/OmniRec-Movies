from fastapi import APIRouter, HTTPException, Query

from ml.engine import get_engine

router = APIRouter(prefix="/api/movies", tags=["movies"])


@router.get("")
def browse_movies(
    search: str | None = Query(None, max_length=100),
    genre: str | None = None,
    decade: int | None = Query(None, ge=1900, le=2020),
    sort: str = Query("popular", pattern="^(popular|rating|recent|title)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=60),
):
    return get_engine().browse(
        search=search, genre=genre, decade=decade,
        sort=sort, page=page, page_size=page_size,
    )


@router.get("/genres")
def list_genres():
    return {"genres": get_engine().genres}


@router.get("/{movie_id}")
def movie_detail(movie_id: int):
    engine = get_engine()
    payload = engine.movie_payload(movie_id)
    if payload is None:
        raise HTTPException(404, "Película no encontrada")
    return payload


@router.get("/{movie_id}/similar")
def similar_movies(
    movie_id: int,
    limit: int = Query(12, ge=1, le=30),
    method: str = Query("dl", pattern="^(dl|svd)$"),
):
    engine = get_engine()
    if engine.movie_payload(movie_id) is None:
        raise HTTPException(404, "Película no encontrada")
    if method == "dl":
        ids = engine.similar_dl(movie_id, n=limit)
        used = "dl" if engine.serves_dl(movie_id) else "svd"
    else:
        ids = engine.similar(movie_id, n=limit)
        used = "svd"
    return {"movieId": movie_id, "method": used, "results": engine.movies_payload(ids)}
