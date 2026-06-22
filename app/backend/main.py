"""OmniRec Cinema API — backend FastAPI del sistema de recomendación.

Sirve los modelos entrenados en los notebooks (baseline bayesiano + SVD con
folding-in + clustering de comunidades) detrás de una API REST para la
aplicación web de cine (app/web-app).

Ejecución (desde app/backend/):
    ../../venv/bin/uvicorn main:app --reload --port 8000
"""
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS
from database import Base, engine
from ml.engine import get_engine
from routers import auth, meta, movies, profile, ratings, recommendations, search


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    t0 = time.time()
    try:
        rec = get_engine()
        print(f"Motor de recomendación cargado en {time.time() - t0:.1f}s "
              f"({len(rec.movies):,} películas, {len(rec.item_raw_ids):,} con embeddings SVD)")
    except Exception as e:  # noqa: BLE001
        # El recomendador necesita baseline_scores.pkl/svd_model.pkl/links.csv.
        # La búsqueda semántica (Fase 4) es independiente y debe seguir disponible.
        print(f"[aviso] Motor de recomendación no disponible: {e}")
    yield


app = FastAPI(
    title="OmniRec Cinema API",
    description="Recomendación de películas con baseline bayesiano, SVD (folding-in) "
                "y comunidades de gustos (KMeans sobre embeddings latentes).",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(recommendations.router)
app.include_router(ratings.router)
app.include_router(ratings.watchlist_router)
app.include_router(profile.router)
app.include_router(meta.router)
app.include_router(search.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "omnirec-cinema-api"}
