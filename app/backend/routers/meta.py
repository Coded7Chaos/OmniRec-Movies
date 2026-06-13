import pandas as pd
from fastapi import APIRouter

from config import DATA_INT_DIR
from ml.engine import get_engine

router = APIRouter(prefix="/api/meta", tags=["meta"])


@router.get("/stats")
def catalog_stats():
    return get_engine().stats()


@router.get("/models")
def model_comparison():
    """Tabla comparativa de modelos generada por el notebook 03."""
    path = DATA_INT_DIR / "model_comparison.csv"
    if not path.exists():
        return {"models": []}
    df = pd.read_csv(path)
    return {"models": df.to_dict(orient="records")}


@router.get("/personas")
def personas():
    return {"personas": get_engine().all_personas()}
