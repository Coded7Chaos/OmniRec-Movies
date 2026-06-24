# =============================================================================
# Backend OmniRec (FastAPI + stack ML) — Fase 4 (MLOps + RAG)
# Contexto de build: RAÍZ del repositorio (necesita src/, config/, data/, app/backend/)
#   docker build -f app/backend/Dockerfile -t omnirec-backend .
# Docker (Linux) evita el problema de torch en Windows (WinError 1114).
# =============================================================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HUB_DISABLE_SYMLINKS_WARNING=1 \
    HF_HUB_OFFLINE=0

WORKDIR /app

# Toolchain para compilar scikit-surprise (Cython/C++) + curl para healthcheck.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential gcc g++ curl \
    && rm -rf /var/lib/apt/lists/*

# --- Dependencias Python -----------------------------------------------------
# 1) numpy<2 y Cython primero (scikit-surprise los necesita al compilar).
# 2) torch CPU desde el índice oficial (evita descargar la build CUDA, ~800MB).
# 3) el resto desde requirements.txt (torch ya queda satisfecho).
COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install "numpy>=1.26,<2.0" "Cython<3.1" \
    && pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.4.1" \
    && pip install -r requirements.txt

# --- Hornear el encoder Sentence-Transformers (funciona offline en runtime) ---
RUN python -c "from sentence_transformers import SentenceTransformer; \
SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

# --- Código + configuración + datos (los modelos van en un volumen) ----------
COPY src/ ./src/
COPY config/ ./config/
COPY data/ ./data/
COPY notebooks/ ./notebooks/
COPY app/backend/ ./app/backend/

COPY app/backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["uvicorn", "main:app", "--app-dir", "app/backend", "--host", "0.0.0.0", "--port", "8000"]
