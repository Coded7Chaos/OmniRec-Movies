"""Configuración central del backend OmniRec Cinema."""
from __future__ import annotations

import os
from pathlib import Path

# app/backend/ -> app/ -> raíz del proyecto
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parents[1]

DATA_INT_DIR = ROOT_DIR / "data" / "intermediate"
DATA_RAW_DIR = ROOT_DIR / "data" / "ml-25m"
MODELS_DIR = ROOT_DIR / "models"

DATABASE_URL = os.getenv("OMNIREC_DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'omnirec.db'}")

SECRET_KEY = os.getenv("OMNIREC_SECRET_KEY", "omnirec-dev-secret-cambiar-en-produccion")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

CORS_ORIGINS = os.getenv(
    "OMNIREC_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

# Recomendación
CANDIDATE_POOL_SIZE = 2500   # candidatos populares que se re-rankean con SVD
MIN_VOTES_CANDIDATE = 30     # mínimo de votos para entrar al pool de candidatos
FOLD_IN_REG = 0.1            # regularización ridge del folding-in
BIAS_SHRINK = 10.0           # encogimiento bayesiano del sesgo de usuario nuevo
