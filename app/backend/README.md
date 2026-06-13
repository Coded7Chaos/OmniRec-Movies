# OmniRec Cinema API (FastAPI)

Backend REST que sirve los modelos del pipeline ML (notebooks 01–03) a la
aplicación web **OmniCine** (`app/web-app/`).

## Qué sirve

| Artefacto | Origen | Uso |
|---|---|---|
| `models/baseline_scores.pkl` | Notebook 03 | Popularidad bayesiana (cold start, portada). |
| `models/svd_model.pkl` | `scripts/train_models.py` | Factores latentes SVD + clústeres KMeans. |
| `data/intermediate/movies_prepared_60pct.parquet` | Notebook 02 | Catálogo (55,113 películas). |
| `data/intermediate/item_clusters.parquet` | Notebook 03 | Popularidad y rating medio por película. |
| `data/ml-25m/links.csv` | Dataset | IDs externos (IMDb / TMDb). |

## Puesta en marcha

```bash
# 1. Dependencias (sobre el venv del proyecto)
../../venv/bin/pip install -r requirements.txt

# 2. Artefacto del modelo (si models/svd_model.pkl no existe)
../../venv/bin/python scripts/train_models.py

# 3. Servidor
../../venv/bin/uvicorn main:app --reload --port 8000
```

Documentación interactiva: <http://localhost:8000/docs>.

## Arquitectura

- `main.py` — aplicación FastAPI, CORS y registro de routers.
- `ml/engine.py` — **motor de inferencia** (singleton): catálogo en memoria,
  baseline bayesiano, *folding-in* SVD (ridge), similitud coseno ítem-ítem y
  asignación de comunidades por centroide KMeans.
- `ml/personas.py` — arquetipos de las 6 comunidades de gustos (asignados por
  *lift* de géneros).
- `routers/` — `auth` (JWT), `movies`, `recommendations`, `ratings`,
  `profile`, `meta`.
- `database.py` + `db_models.py` — SQLite vía SQLAlchemy (`users`, `ratings`,
  `watchlist`). El archivo `omnirec.db` se crea al arrancar y está gitignorado.
- `scripts/train_models.py` — reproduce el SVD del notebook 03 (50 factores,
  20 épocas, seed 42) y guarda el artefacto compacto de inferencia.

## Estrategia de recomendación

1. **Sin historial:** top-N por score bayesiano (fórmula IMDb del notebook 03).
2. **Con historial:** se estima el vector latente del usuario con *folding-in*
   (ridge sobre los factores de los ítems calificados, sesgo encogido) y se
   re-rankea un pool de ~2,500 candidatos populares con `mu + bu + bi + qi·pu`.
3. **Invitados:** los endpoints `POST .../guest` aceptan el historial guardado
   en el navegador y aplican exactamente la misma lógica.

## Variables de entorno

| Variable | Por defecto | Qué hace |
|---|---|---|
| `OMNIREC_SECRET_KEY` | dev (insegura) | Firma de los JWT. Cambiar en producción. |
| `OMNIREC_DATABASE_URL` | `sqlite:///./omnirec.db` | Conexión SQLAlchemy. |
| `OMNIREC_CORS_ORIGINS` | `http://localhost:3000,...` | Orígenes permitidos (coma-separado). |
