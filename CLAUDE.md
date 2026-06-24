# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OmniRec-Movies is an end-to-end movie recommender system built on MovieLens 25M, following the CRISP-DM methodology. The project has **5 Jupyter notebooks** (all executed) covering EDA, data prep, ML models, deep learning, and semantic search/RAG, plus a production app with a **FastAPI backend** and **Next.js frontend** (deployed via Docker Compose).

**Current state**: All 5 notebooks are executed and produce artefacts. The full app stack is functional. Pending: `informe_final.pdf` (Fase 5 integration report) and `propuesta_fase1.pdf`.

## Environment Setup

```bash
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Critical dependency constraint**: NumPy must stay `>=1.26,<2.0` (scikit-surprise ABI incompatibility with NumPy 2.x).

On Windows, `scikit-surprise` requires **Microsoft C++ Build Tools** to compile.

Register the Jupyter kernel once after creating the venv:
```bash
python -m ipykernel install --user --name omnirec --display-name "Python (OmniRec)"
```

## Running the ML Pipeline

Notebooks must be executed in order (each builds on outputs of the prior):

| Notebook | Phase (CRISP-DM) | Key outputs |
|----------|-------|-------------|
| `01_Business_Understanding_and_EDA.ipynb` | 1–2 (Business + Data Understanding) | 9 figures in `reports/figures/` |
| `02_Data_Sampling_and_Cleaning.ipynb` | 3 (Data Preparation) | `data/intermediate/*.parquet` (60% and 10% samples) |
| `03_ML_Baseline_AutoML.ipynb` | 4–5 (Modeling + Evaluation) | `models/*.pkl`, `model_comparison.csv`, cluster parquets |
| `04_DeepLearning_Embeddings.ipynb` | Deep Learning | `models/neumf_best_model.pt`, t-SNE plots |
| `05_Semantic_Search_RAG.ipynb` | MLOps + RAG | `models/rag_index/` (FAISS), monitoring JSON |

Run a notebook headlessly:
```bash
jupyter nbconvert --to notebook --execute --inplace notebooks/03_ML_Baseline_AutoML.ipynb
```

Run the full MLOps pipeline (train + index + evaluate + register):
```bash
python -m src.pipeline all
```

## Running the App (FastAPI + Next.js)

**Docker (recommended):**
```bash
docker compose up --build   # starts backend :8000 + frontend :3000
```

**Manual (two terminals):**
```bash
# Terminal 1 — FastAPI backend
cd app/backend
cp .env.example .env        # set OMNIREC_MODELS_DIR and OMNIREC_DATA_DIR
pip install -r requirements.txt
uvicorn main:app --reload   # http://127.0.0.1:8000

# Terminal 2 — Next.js frontend
cd app/web-app
npm install
npm run dev                 # http://localhost:3000
```

Key backend `.env` variables:
- `OMNIREC_MODELS_DIR` — absolute path to `models/`
- `OMNIREC_DATA_DIR` — absolute path to `data/intermediate/`

Health check: `GET /api/health` — returns JSON with loaded model status.

## Architecture

### Data pipeline (notebooks)

```
data/ml-25m/ratings.csv (25 M rows)
  → Notebook 02 (stratified sample: 60% main + 10% KNN subset)
  → data/intermediate/ratings_prepared_60pct.parquet  (~1.2M rows)
  → data/intermediate/ratings_knn_10pct.parquet       (~2.5M rows)
  → Notebook 03 (leave-last-1-out temporal split, seed=42)
  → models/*.pkl (5 algorithms) + cluster parquets + model_comparison.csv
  → Notebook 04 (NeuMF training, 20 epochs, early stopping)
  → models/neumf_best_model.pt  (RMSE 0.8183)
  → Notebook 05 (Sentence-Transformers 384-D → FAISS IndexFlatIP)
  → models/rag_index/ (embeddings.npy, index.faiss, meta.parquet, manifest.json)
```

**Sampling invariant**: stratified by user activity tier (Casual/Regular/PowerUser) so distribution matches full 25M (L1 distance < 0.02 for ratings, < 0.05 for genres).

### App stack (`app/`)

```
app/
  backend/                # FastAPI (Python)
    main.py               # App entry point, mounts all routers
    ml/
      engine.py           # Model registry singleton — loads SVD/baseline/clusters lazily
      semantic.py         # FAISS semantic search + RAG (Claude Haiku generative layer)
      personas.py         # Pre-computed user personas (top 7 per cluster × 6 clusters)
    routers/
      recommendations.py  # /api/recommendations, /api/recommendations/home, /affinity/{id}
      search.py           # /api/search/semantic (FAISS + optional RAG)
      auth.py             # JWT auth
      movies.py           # Catalog endpoints
      ratings.py          # User rating submission
      profile.py          # User profile
      meta.py             # /api/health
    config.py             # Pydantic settings from .env
    schemas.py            # Request/response models
    db_models.py          # SQLAlchemy ORM models
    database.py           # DB session factory
    security.py           # JWT helpers
  web-app/                # Next.js 14 (TypeScript)
    app/                  # App Router pages
    components/           # MovieCard, MovieRow, SearchResultCard, StarRating, etc.
    lib/
      api.ts              # FastAPI client functions
      store.tsx           # Zustand global state
      types.ts            # Shared TypeScript types
      cinemeta.ts         # External poster/metadata enrichment
```

### Five trained classical models

| Key | Algorithm | RMSE (60% sample) | Notes |
|-----|-----------|------|-------|
| `baseline_scores.pkl` | Bayesian popularity + shrinkage | 1.0092 | fastest; candidate retrieval |
| `knn_model.pkl` | KNN item-based, Pearson-baseline, k=40 | 0.8935 | trained on 10% subset |
| `svd_model.pkl` | SVD, 50 latent factors | 0.8652 | best; embeddings → KMeans |
| `nmf_model.pkl` | NMF, 15 factors | 0.9361 | interpretable themes |
| `automl_winner.pkl` | GridSearchCV (BaselineOnly winner) | 0.9235 | benchmark |

SVD embeddings drive `KMeans(k=6)` for user and item clustering (`user_clusters.parquet`, `item_clusters.parquet`).

**Deep learning model** (`neumf_best_model.pt`): NeuMF (GMF + 2-layer MLP), 32-D embeddings, Dropout 0.2, Adam lr=0.001, trained 20 epochs with early stopping. Val RMSE **0.8183** (vs SVD 0.8140 — marginal difference).

**Semantic search** (`models/rag_index/`): Sentence-Transformers `paraphrase-multilingual-MiniLM-L12-v2` (384-D), FAISS IndexFlatIP (cosine). P@10 = 0.8833, hitrate@10 = 0.4258, NDCG@10 = 0.2488. 6 documented query examples in notebook 05.

### MLOps components (`src/`)

| Module | Purpose |
|--------|---------|
| `src/pipeline.py` | Orchestrator: prepare→train→index→evaluate→register (idempotent) |
| `src/tracking.py` | MLflow wrapper (degrades to no-op). SQLite DB at `mlflow.db`, UI at :5001 |
| `src/registry.py` | Artefact versioning: SHA256 manifests, `models/registry/<artefact>/<YYYY.MM.DD-N>/` |
| `src/monitor.py` | Quality/drift reports: PSI on ratings, freshness, coverage. Retrain trigger at PSI > 0.2 |
| `src/index.py` | FAISS index construction + persistence (embeddings.npy + manifest) |
| `src/search.py` | Semantic retrieval with genome-tag evidence alignment |
| `src/embeddings.py` | Sentence-Transformers encoder (CPU inference, L2-normalized) |
| `src/train.py` | Classical model training scripts |
| `src/data.py` | Data loading + preprocessing pipelines |
| `src/evaluate.py` | RMSE/MAE/P@K/R@K/NDCG@K evaluation utilities |
| `src/baseline.py` | Bayesian popularity scorer |
| `src/descriptors.py` | Movie text descriptor generation for embedding |

### Config files (`config/`)

| File | Purpose |
|------|---------|
| `config/pipeline.yaml` | Paths, SVD hyperparams, evaluation settings, MLflow experiment name |
| `config/rag.yaml` | Encoder model, FAISS settings, Claude Haiku generative layer config |
| `config/monitoring.yaml` | Drift thresholds (PSI > 0.2), retrain policy (50k new ratings threshold) |

## Key File Locations

- `requirements.txt` — root: ML + notebook dependencies
- `app/backend/requirements.txt` — FastAPI app dependencies
- `data/ml-25m/` — raw MovieLens 25M CSVs (large files gitignored)
- `data/intermediate/` — generated parquets and CSV (gitignored; produced by notebooks 02–03)
- `models/` — trained pickle + .pt files + rag_index/ + registry/ (gitignored; produced by notebooks/pipeline)
- `reports/figures/` — EDA plots (PNG, committed)
- `reports/Informe_ML.pdf` — Partial ML technical report
- `data/NOTAS_PROCEDENCIA.md` — Dataset origin notes (GroupLens, Nov 2019)

## Common Issues

| Symptom | Fix |
|---------|-----|
| `No module named 'surprise'` | Activate venv and `pip install -r requirements.txt` |
| `numpy.core.multiarray failed to import` | `pip install "numpy>=1.26,<2.0"` |
| `/api/health` shows no models | Run notebook 03 fully; verify `OMNIREC_MODELS_DIR` in `app/backend/.env` |
| Backend port 8000 occupied | `uvicorn main:app --port 8080` |
| Frontend can't reach API | Check `NEXT_PUBLIC_API_URL` in `app/web-app/.env.local` |
| FAISS index not found | Run notebook 05 or `python -m src.pipeline all` |
