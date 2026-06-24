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

  # Modelo Deep Learning (notebook 04 / etapa train_dl del pipeline).
  #   - Si ya hay embeddings de servicio: nada.
  #   - Si el usuario ya entrenó en Jupyter (models/mf_model.pt en el volumen):
  #     solo exporta los embeddings (rápido).
  #   - Si no hay nada: entrena vía el pipeline MLOps (reproducible, ~3-4 min).
  if [ ! -f models/dl_item_embeddings.pkl ]; then
    if [ -f models/mf_model.pt ]; then
      echo "[init] Exportando embeddings del modelo Deep Learning (mf_model.pt)…"
      python app/backend/scripts/export_dl_embeddings.py || echo "[init] (aviso) embeddings DL no se exportaron; 'similares' usará el SVD."
    else
      echo "[init] Entrenando modelo Deep Learning vía pipeline (train_dl)…"
      python -m src.pipeline train_dl || echo "[init] (aviso) DL no se entrenó; 'similares' usará el SVD."
    fi
  fi

  # Versiona los artefactos DL en el registry (idempotente; crea una versión nueva).
  if [ -f models/dl_item_embeddings.pkl ] && [ ! -d models/registry/dl_embeddings ]; then
    echo "[init] Registrando embeddings DL en el model registry…"
    python -m src.pipeline register || echo "[init] (aviso) no se registró el artefacto DL."
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
