#!/usr/bin/env bash
# Entrypoint del backend: asegura los artefactos de inferencia (idempotente) y
# luego ejecuta el comando recibido (uvicorn por defecto).
#
# Solo construye artefactos si ENSURE_ARTIFACTS=1 (el servicio backend lo activa;
# mlflow/jupyter comparten imagen pero NO deben disparar el build del índice).
set -e
cd /app

if [ "${ENSURE_ARTIFACTS:-0}" = "1" ]; then
  if [ ! -f models/rag_index/manifest.json ]; then
    echo "[init] Primera vez: construyendo descriptores + índice semántico (~5 min en CPU)…"
    python -m src.pipeline prepare
    python -m src.pipeline index
  else
    echo "[init] Índice semántico ya presente, se omite la construcción."
  fi

  if [ ! -f models/svd_model.pkl ]; then
    echo "[init] Entrenando SVD del recomendador…"
    python -m src.pipeline train || echo "[init] (aviso) SVD opcional no se generó; la búsqueda semántica sigue disponible."
  fi

  if [ ! -f models/baseline_scores.pkl ]; then
    echo "[init] Generando baseline de popularidad bayesiana…"
    python -m src.pipeline baseline || echo "[init] (aviso) baseline no se generó."
  fi

  # MLflow: la etapa `evaluate` es la única que registra un run (ver
  # src/pipeline.py). Se ejecuta una sola vez para poblar mlruns/mlflow.db; en
  # arranques posteriores se omite si la BD ya existe.
  if [ ! -f mlruns/mlflow.db ]; then
    echo "[init] Registrando métricas del recomendador y RAG en MLflow (evaluate)…"
    python -m src.pipeline evaluate || echo "[init] (aviso) evaluate no se completó; MLflow quedará vacío."
  else
    echo "[init] Tracking de MLflow ya presente, se omite evaluate."
  fi
fi

echo "[init] Arrancando: $*"
exec "$@"
