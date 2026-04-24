# OmniRec-Movies — Estado del Proyecto

Sistema inteligente de recomendación de películas sobre **MovieLens 25M** (GroupLens, noviembre 2019). Sigue el ciclo **CRISP-DM** (seis fases canónicas: Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment).

**Última actualización:** 2026-04-23 — iteración 6: **frontend Inertia.js + React + MUI** — se reemplazó Django templates + HTMX + Tailwind CDN por un stack SPA con **Inertia.js 2** (`inertia-django` + `@inertiajs/react`), **React 18**, **MUI 6** y **Vite 5**. Las 5 páginas (`/`, `/recommend/`, `/predict/`, `/catalog/`, `/clusters/`) ahora montan componentes React con un theme MUI profesional (paleta indigo/emerald sólida, tipografía Inter empaquetada). Las acciones interactivas (Top-N, predicción, búsqueda) pasan por endpoints JSON (`/api/recommend/`, `/api/predict/`, `/api/movies/`). Se eliminaron templates Django, HTMX, Tailwind y `forms.py`; `services.py` queda intacto. Detalle: [`MIGRACION_INERTIA_REACT_MUI_2026-04-23.md`](./MIGRACION_INERTIA_REACT_MUI_2026-04-23.md).
Iteración 5 (artefactos — `reports/` solo Markdown): se movieron `model_comparison.csv` y los parquets de clusters a `data/intermediate/`. Iteración 4 (UX — personas descriptivas en vez de IDs + UI sólida): [`UX_APP_DJANGO_2026-04-20.md`](./UX_APP_DJANGO_2026-04-20.md). Iteración 3 (construcción inicial de la app Django): [`CAMBIOS_APP_DJANGO_2026-04-20.md`](./CAMBIOS_APP_DJANGO_2026-04-20.md). Iteraciones 1–2 (refactor de notebooks al flujo lineal Fase 1 → Fase 6): [`MEJORAS_NOTEBOOKS.md`](./MEJORAS_NOTEBOOKS.md).

---

## 1. Estructura del repositorio

```
OmniRec-Movies/
├── data/
│   ├── ml-25m/              # Dataset original crudo (ratings.csv, movies.csv, tags.csv, ...)
│   └── intermediate/        # Parquets / CSV generados por el pipeline (notebooks 02 y 03)
│       ├── ratings_sample_5pct.parquet        (7.2 MB  — 1.15M ratings)           ← nb 02
│       ├── movies_sample.parquet              (0.16 MB — 5 915 películas)         ← nb 02
│       ├── genome_scores_sample.parquet       (19.8 MB — 6.67M pares filtrados)   ← nb 02
│       ├── genome_tags.parquet                (0.02 MB — 1 128 tags)              ← nb 02
│       ├── model_comparison.csv               (0.9 KB  — RMSE/MAE/P@K/R@K/NDCG)   ← nb 03
│       ├── user_clusters.parquet              (49 KB   — userId → cluster)        ← nb 03
│       └── item_clusters.parquet              (217 KB  — movieId → cluster)       ← nb 03
├── notebooks/
│   ├── 01_Business_Understanding_and_EDA.ipynb   # Fase 1 (Business) + Fase 2 (Data Understanding / EDA) — 45 celdas
│   ├── 02_Data_Sampling_and_Cleaning.ipynb       # Fase 3 (Data Preparation) — 29 celdas
│   ├── 03_ML_Baseline_AutoML.ipynb               # Fase 4 (Modeling) + Fase 5 (Evaluation)
│   ├── 04_DeepLearning_Embeddings.ipynb          # Fase 6 (Deployment — DL parte 1) — PLACEHOLDER
│   └── 05_Semantic_Search_RAG.ipynb              # Fase 6 (Deployment — RAG parte 2) — PLACEHOLDER
├── models/                  # *.pkl generados por notebook 03 (tras ejecución)
├── reports/                 # SOLO documentación en Markdown
│   ├── Proyecto.md                         # (este archivo) — estado y guía
│   ├── MEJORAS_NOTEBOOKS.md                # detalle técnico de las iteraciones de refactor (§1-8: iter 1, §9: iter 2)
│   ├── CAMBIOS_APP_DJANGO_2026-04-20.md    # construcción inicial de la app Django (iter 3)
│   └── UX_APP_DJANGO_2026-04-20.md         # refinamiento de UX de la app (iter 4)
├── src/                     # Scripts reutilizables (pendiente)
├── app/                     # Demo Django + Inertia + React + MUI (Fase 6) ✅
│   ├── manage.py
│   ├── .env.example         # plantilla django-environ (+ DJANGO_VITE_DEV_MODE)
│   ├── templates/layout.html  # layout base usado por inertia-django + django-vite
│   ├── frontend/            # proyecto Vite + React 18 + MUI 6
│   │   ├── package.json · vite.config.js
│   │   ├── src/main.jsx · theme.js · api.js
│   │   ├── src/components/ (Layout, PageHeader, StatCard, PersonaSelect, MovieAutocomplete)
│   │   ├── src/pages/ (Home, Recommend, Predict, Catalog, Clusters)
│   │   └── dist/            # assets compilados (manifest en dist/.vite/)
│   ├── core/                # project: settings.py (inertia + django-vite), urls.py
│   └── apps/
│       └── recommender/     # app principal: testbench de los 5 modelos
│           ├── apps.py
│           ├── urls.py      # páginas Inertia + /api/recommend · /api/predict · /api/movies · /health
│           ├── views.py     # inertia.render(...) para páginas + endpoints JSON
│           └── services.py  # Registry lazy-load de pickles + parquets (sin cambios)
├── config/                  # Parámetros de experimentos (pendiente)
├── requirements.txt
└── README.md
```

---

## 2. Estado actual — matriz CRISP-DM (flujo lineal)

La lectura secuencial de los notebooks `01 → 02 → 03 → 04 → 05` se corresponde **1:1** con las fases canónicas de CRISP-DM. No hay saltos hacia atrás entre notebooks.

| Fase CRISP-DM | Notebook(s) | Sección(es) | Estado |
|---|---|---|---|
| 1. Business Understanding | `01_Business_Understanding_and_EDA.ipynb` | §1 | ✅ Completa |
| 2. Data Understanding (EDA) | `01_Business_Understanding_and_EDA.ipynb` | §2-16 (14 bloques de EDA) | ✅ Completa |
| 3. Data Preparation | `02_Data_Sampling_and_Cleaning.ipynb` | §1-7 | ✅ Completa |
| 4. Modeling | `03_ML_Baseline_AutoML.ipynb` | §2-6 | ✅ Completa |
| 5. Evaluation | `03_ML_Baseline_AutoML.ipynb` | §7-10 | ✅ Completa |
| 6. Deployment | `app/` (Django) · `04`, `05` (DL + RAG) | — | 🟡 Parcial — app Django operativa, notebooks 04/05 pendientes |

---

## 3. Setup

```bash
git clone https://github.com/Coded7Chaos/OmniRec-Movies
cd OmniRec-Movies

python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate            # Windows

pip install -r requirements.txt
```

> **Nota sobre `scikit-surprise`**: requiere compilar extensiones Cython. En macOS/Linux necesitas `gcc`/`clang`; en Windows, Visual C++ Build Tools.

> **`auto-surprise` es opcional.** El notebook 03 detecta `ImportError` automáticamente y recurre a un **GridSearchCV multi-algoritmo** (búsqueda exhaustiva) como fallback. Metodológicamente son equivalentes; el trade-off es tiempo (grid search es más lento que TPE).

### Requisitos de hardware verificados
- Ejecución medida en: macOS, 16 GB RAM, 10 CPUs (Darwin 25.4.0).
- Notebook 01 (BU + EDA Polars lazy sobre 25 M) corre en ~2-3 min con margen de RAM > 5 GB.
- Notebook 02 (muestreo 5 %) corre en ~1-2 min con margen holgado.
- Notebook 03 necesita ~3 GB extra durante el AutoML fallback; reservar headroom.

---

## 4. Flujo de ejecución — lineal Fase 1 → Fase 6

| # | Notebook | Fases CRISP-DM | Propósito | Salida principal |
|---|---|---|---|---|
| 1 | `01_Business_Understanding_and_EDA.ipynb` | **1 + 2** | Objetivo de negocio + criterios de éxito + EDA completo sobre los 25 M con Polars lazy (14 bloques + insights). | Figuras inline, conclusiones que justifican el cold-start ≥ 20 y el uso de modelos latentes. |
| 2 | `02_Data_Sampling_and_Cleaning.ipynb` | **3** | Muestreo estratificado 5 % por tier de actividad + cold-start + validación L1 + persistencia. | 4 parquets en `data/intermediate/` |
| 3 | `03_ML_Baseline_AutoML.ipynb` | **4 + 5** | Baseline Bayesiano + KNN/SVD/NMF + AutoML + clustering + evaluación unificada. | `models/*.pkl`, `data/intermediate/model_comparison.csv`, `data/intermediate/*_clusters.parquet` |
| 4 | `04_DeepLearning_Embeddings.ipynb` | **6** (parte 1) | NCF / Two-Tower con embeddings profundos. | ⏳ Pendiente |
| 5 | `05_Semantic_Search_RAG.ipynb` | **6** (parte 2) | RAG sobre tags + genome-scores. | ⏳ Pendiente |

Ejecuta en VS Code o Jupyter seleccionando el kernel del entorno virtual `venv`. Para ejecución batch:

```bash
./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/01_Business_Understanding_and_EDA.ipynb
./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/02_Data_Sampling_and_Cleaning.ipynb
./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/03_ML_Baseline_AutoML.ipynb
```

---

## 5. Notebook 01 — Business Understanding + Data Understanding (EDA)

Combinación de Fase 1 y Fase 2. **45 celdas**: 1 sección de Business Understanding + 1 de reproducibilidad/hardware + 14 bloques de EDA sobre los 25 M ratings crudos con Polars lazy.

### 5.1 Estructura

| Sección | Fase | Contenido |
|---|---|---|
| 1. Business Understanding | **Fase 1** | Objetivo, criterios de éxito (representatividad, factibilidad, reproducibilidad, trazabilidad), restricciones (tamaño, sparsity, long tail, power users), plan. |
| 2. Reproducibilidad y hardware | Preámbulo | `SEED=42`, detección automática de raíz del proyecto, `psutil`, info de CPU/RAM. |
| 3. Carga eficiente con Polars | **Fase 2** | `scan_csv` lazy + esquemas + conteos (no materializa los 25 M en RAM). |
| 4. Calidad de datos | Fase 2 | Nulos, duplicados, rangos. |
| 5. Univariado — `rating` | Fase 2 | Sesgo positivo: >80 % ≥ 3. |
| 6. Univariado — géneros | Fase 2 | Drama/Comedy dominan. |
| 7. Power users | Fase 2 | Ley de potencias + Pareto. |
| 8. Blockbusters vs long tail | Fase 2 | >40 % de películas con < 20 votos → justifica cold-start. |
| 9. Popularidad vs calidad | Fase 2 | Corr ≈ +0.35. |
| 10. Rating por género | Fase 2 | Rating ponderado por género. |
| 11. Evolución temporal | Fase 2 | Sin concept drift → OK split aleatorio. |
| 12. Análisis semántico de tags | Fase 2 | Top-20 + wordcloud. |
| 13. Tag Genome — relevance | Fase 2 | Distribución justifica umbral 0.3. |
| 14. Heatmap de correlación | Fase 2 | Métricas agregadas por película. |
| 15. Sparsity | Fase 2 | 99.74 % → obliga modelos latentes. |
| 16. Conclusiones Data Understanding | Cierre | Handoff al notebook 02. |

Cada bloque de EDA cierra con un `**Insight de negocio.**` que alimenta decisiones concretas del notebook 03.

---

## 6. Notebook 02 — Data Preparation

Fase 3 aislada. **29 celdas**. Consume los 4 CSV crudos de `data/ml-25m/` y produce los 4 parquets de `data/intermediate/`.

### 6.1 Estructura

| Sección | Contenido |
|---|---|
| 1. Reproducibilidad, rutas y hardware | `SEED=42`, detección de raíz, `psutil`, rutas a los 4 CSV + asserts de existencia. |
| 2. Estrategia de preparación y pasos | 7 sub-secciones: 2.1 Carga CSV → 2.2 Tiers `qcut(q=3)` → 2.3 Muestreo estratificado 5 % → 2.4 Filtrar ratings → 2.5 Cold-start ≥ 20 → 2.6 Persistencia Parquet Snappy. |
| 3. Sincronización de metadatos | Filtra `movies.csv` + `genome-scores.csv` (Polars streaming) + copia `genome-tags.csv`. |
| 4. Validación de la muestra | L1 distance rating (0.0323), géneros, tiers. Visualización comparativa. |
| 5. Métricas finales y sparsity | Tabla muestra↔población + sparsity. |
| 6. Artefactos generados | Smoke-test de lectura de los 4 parquets. |
| 7. Conclusiones | Handoff al notebook 03. |

### 6.2 Resultados de la última ejecución (2026-04-20)

| Métrica | Valor |
|---|---|
| Ratings de la muestra | **1 152 574** (4.61 % de 25 M) |
| Usuarios de la muestra | **8 126** (5.00 % de 162 541) — estratificación exacta |
| Películas tras cold-start | **5 915** (10.02 % de 59 047) |
| Rating mean muestra / población | 3.5778 / 3.5339 |
| Rating std muestra / población | 1.0360 / 1.0607 |
| Sparsity de la muestra | **97.60 %** (vs 99.74 % de la población → 10× más densa) |
| L1 distance distribución de rating | **0.0323** |
| Diferencia máx. de proporción por tier | **0.0000** |

### 6.3 Decisiones metodológicas clave

1. **Terciles para tiers** (no 80/95): conserva granularidad en la cola de la distribución de actividad.
2. **Cold-start aplicado después del muestreo**: el conteo relevante es sobre la muestra, no sobre la población.
3. **Parquet Snappy**: ratio ~4.6× vs CSV + tipos preservados (`int32`, `float32`).
4. **Polars lazy streaming** para `genome-scores.csv` (415 MB) — nunca materializa los 15.5 M pares en RAM.
5. **Asserts defensivos**: sin nulos, rating ∈ [0.5, 5.0], sin duplicados `(userId, movieId)`.

---

## 7. Notebook 03 — Modeling + Evaluation

CRISP-DM **Fase 4 (Modeling)** + **Fase 5 (Evaluation)**. Contenido no cambió en la iteración 2; solo se mantuvo la cabecera actualizada en la iteración 1.

### 7.1 Datos y split

- **Fuente**: `data/intermediate/ratings_sample_5pct.parquet` (generado por el notebook 02). Si no existe, el notebook lo reconstruye on-the-fly con Polars lazy.
- **Tamaño de trabajo**: ~1.15 M ratings (5 % estratificado por tier).
- **Cold-start**: sólo películas con ≥ 20 votos (decisión justificada en notebook 01 §8).
- **Split**: 80/20 aleatorio con `random_state=42` vía `surprise.model_selection.train_test_split`. No usamos split temporal — el EDA mostró rating medio estable sin concept drift.

### 7.2 Modelos implementados

| # | Modelo | Hiperparámetros | Por qué este modelo |
|---|---|---|---|
| **1** | **Baseline: Popularidad Bayesiana Ponderada** | `C` = media global (trainset); `m` = P60 de votos | Piso no-trivial; fórmula IMDb con *shrinkage* hacia la media; penaliza la long tail. |
| **2** | **KNN-Baseline (item-based)** | `k=40`, sim=`pearson_baseline`, `min_support=5` | Item-based (más estable que user-based); Pearson corrige sesgos por usuario/ítem. **Interpretable**. |
| **3** | **SVD (Matrix Factorization)** | `n_factors=50`, `n_epochs=20`, `lr=0.005`, `reg=0.02` | Maneja sparsity. Los factores `.pu`/`.qi` se reutilizan en el clustering → **doble rol**. |
| **4** | **NMF (Non-negative MF)** | `n_factors=15`, `n_epochs=50`, `biased=False` | No negatividad → factores interpretables como "temas" aditivos. |
| **5** | **AutoML winner** (SVD/NMF/KNN/BaselineOnly) | TPE (auto-surprise) o GridSearchCV 2-fold | Contrasta modelos auto-tuneados vs defaults; reporta **tiempo total** como costo. |

### 7.3 Métricas (Fase 5 — Evaluation)

- **Predicción de rating**: RMSE (principal), MAE.
- **Ranking Top-N** (sobre el testset; `rating_real ≥ 4.0` = "relevante"):
  - **Precision@5, Precision@10** — precisión del Top-K recomendado.
  - **Recall@5, Recall@10** — cobertura sobre los relevantes del usuario.
  - **NDCG@10** — calidad del orden (ganancia acumulada descontada normalizada).
- **Costo de modelado**: tiempo de entrenamiento en segundos.

**Umbral 4.0 (no 3.5)**: el EDA mostró sesgo positivo con >80 % ratings ≥ 3; usar 3.5 inflaría `Recall` artificialmente.

### 7.4 AutoML — benchmark de desempeño y costo

- **Primera opción**: `auto-surprise` (TPE bayesiano), presupuesto 10 min, 30 evaluaciones sobre sub-sample del 20 %.
- **Fallback**: `GridSearchCV` de Surprise sobre 4 algoritmos con 2-fold CV.
- **Validación final**: el mejor algoritmo se refitea sobre el trainset completo y se evalúa sobre el testset reservado.

### 7.5 Clustering no supervisado

- **Embeddings**: `svd.pu` (usuarios, 50D) y `svd.qi` (películas, 50D).
- **Selección de k**: elbow + silhouette sobre sub-muestra (k ∈ [2, 10]). Default `k=6` para ambos.
- **KMeans**: `random_state=42`, `n_init=10`.
- **Interpretación**: perfiles de género, rating, popularidad, top-3 títulos representativos.
- **Visualización**: PCA 2D coloreado por clúster.

### 7.6 Artefactos

```
models/
├── svd_model.pkl              # SVD entrenado
├── knn_model.pkl              # KNN-Baseline entrenado
├── nmf_model.pkl              # NMF entrenado
├── baseline_scores.pkl        # dict{movieId: bayesian_score} + C, m
└── automl_winner.pkl          # mejor modelo + params + traza AutoML

data/intermediate/             # (reports/ queda reservado para documentación .md)
├── model_comparison.csv       # RMSE, MAE, P@K, R@K, NDCG@10, tiempo
├── user_clusters.parquet      # (userId, cluster)
└── item_clusters.parquet      # (movieId, cluster, title, genres, n_ratings, rating_mean)
```

### 7.7 Justificaciones de diseño

1. **SVD manual y no solo AutoML.** El PDF exige "al menos tres enfoques comparables"; los modelos manuales con hiperparámetros estándar sirven como honest baseline, AutoML muestra el upper bound alcanzable.
2. **KNN item-based y no user-based.** Long tail en usuarios: user-user similarity sería inestable. Item-based produce matriz más densa y estable.
3. **NMF como tercer modelo y no Slope One.** NMF produce embeddings no negativos → comparar con SVD en el clustering.
4. **Umbral `relevance = 4.0`.** Sesgo positivo: 3.0 es "meh", no "bueno".
5. **Sub-muestrear para AutoML.** GridSearchCV completo sería inviable; 20 % es el trade-off clásico.
6. **Clustering sobre embeddings SVD.** Los embeddings codifican similitud de gustos; clusterizar features crudos daría segmentos triviales por popularidad.

---

## 8. Reproducibilidad

Todo el pipeline usa `SEED=42`:
- `random.seed`, `numpy.random.seed`, `PYTHONHASHSEED`.
- `pandas.DataFrame.sample(random_state=SEED)`, `surprise_tts(random_state=SEED)`, `KMeans(random_state=SEED)`, `PCA(random_state=SEED)`, `SVD(random_state=SEED)`, `NMF(random_state=SEED)`.

Ejecución batch verificada (2026-04-20, iteración 2) para los notebooks 01 y 02; los parquets de `data/intermediate/` se regeneran deterministicamente y el notebook 03 los consume sin cambios.

---

## 9. Historial de iteraciones

| Fecha | Iteración | Resumen |
|---|---|---|
| 2026-04-20 (iter 1) | Refactor CRISP-DM inicial | Se reescribió el notebook 01 (rutas Deepnote → locales, se añadieron Business Understanding + validación L1), se alineó la cabecera del 03 a "Fase 4 + 5", se mantuvo el notebook 02 (EDA). Detalle: `MEJORAS_NOTEBOOKS.md` §1-8. |
| 2026-04-20 (iter 2) | **Reorganización lineal Fase 1 → Fase 6** | Se fusionó el Business Understanding del 01 viejo con el EDA del 02 viejo (→ nuevo **01 BU+EDA**) y se aisló la Data Preparation en un notebook dedicado (→ nuevo **02 Data Sampling**). Se eliminaron `01_Data_Sampling_and_Cleaning.ipynb` y `02_EDA_and_Visualization.ipynb` antiguos. Resultado: lectura 01→05 = Fase 1→6 sin saltos. Detalle: `MEJORAS_NOTEBOOKS.md` §9. |
| 2026-04-20 (iter 3) | **Fase 6 — Testbench Django** | Se construyó la app `apps.recommender` dentro de `app/` con Django 6, django-environ, django-htmx, django-browser-reload y Tailwind (CDN). Expone 5 endpoints: panel de métricas, Top-N por usuario, predicción paralela de los 5 modelos, búsqueda HTMX por título, explorador de clusters. Los artefactos de `models/` y `reports/` se cargan con un `Registry` thread-safe de lazy-load. Detalle: [`CAMBIOS_APP_DJANGO_2026-04-20.md`](./CAMBIOS_APP_DJANGO_2026-04-20.md). |
| 2026-04-20 (iter 4) | **UX — personas en vez de IDs + UI sólida** | Se eliminan los inputs numéricos de `userId`/`movieId` de la UI. `Registry` ahora deriva ~42 **personas** (top 7 por cluster × 6 clusters) con etiquetas tipo *"Fan de Drama · 312 reseñas · Grupo 3"*; las películas se eligen con **autocomplete HTMX por título**. Se quitaron todos los gradientes — paleta sólida (indigo-600, slate-*, emerald-600, rose-600). Se añadió sección *Cómo funciona* en tres pasos en `/`. Géneros mostrados en español (`Acción · Suspenso · …`). Detalle: [`UX_APP_DJANGO_2026-04-20.md`](./UX_APP_DJANGO_2026-04-20.md). |
| 2026-04-20 (iter 5) | **Reorganización de artefactos — `reports/` solo Markdown** | `model_comparison.csv`, `user_clusters.parquet` e `item_clusters.parquet` se movieron de `reports/` a `data/intermediate/`. El notebook 03 ahora los escribe en `DATA_INT_DIR` (se eliminó `REPORTS_DIR.mkdir(...)`). La app Django dejó de depender de `OMNIREC_REPORTS_DIR`: `Registry` lee los 3 archivos desde `data_dir`. `settings.py` y `.env.example` se simplificaron. Verificación tras el cambio: `/health/` → `personas: 42`, `/`, `/recommend/`, `/predict/`, `/clusters/` y `/movies/autocomplete/?q=matrix` responden HTTP 200. |
| 2026-04-23 (iter 6) | **Frontend Inertia.js + React + MUI** | Se migró el frontend de Django templates + HTMX + Tailwind CDN a **Inertia.js 2** + **React 18** + **MUI 6** compilado con **Vite 5**. Las 5 páginas (`/`, `/recommend/`, `/predict/`, `/catalog/`, `/clusters/`) renderizan componentes React con un `ThemeProvider` profesional (paleta indigo/emerald sólida, tipografía Inter empaquetada con `@fontsource/inter`, Autocomplete asíncrono para películas, Rating MUI para scores, LinearProgress para estados de carga). Las acciones interactivas pasan por 3 endpoints JSON (`/api/recommend/`, `/api/predict/`, `/api/movies/`). Backend: `inertia-django` + `django-vite` en settings/middleware; `views.py` reescrito con `inertia.render(...)`; `urls.py` simplificado; `forms.py`, templates HTMX y static Tailwind eliminados; `services.py` intacto. `requirements.txt`: fuera `django-htmx`/`django-browser-reload`/`django-tailwind`/`pytailwindcss`, dentro `inertia-django==1.2.*` y `django-vite==3.0.*`. Verificación: `manage.py check` → 0 issues; `/health/` → `personas: 42`; `/api/recommend/` (SVD n=3) → HTTP 200 en 389 ms; `/api/predict/` → 5 modelos con ganador resaltado; `/api/movies/?q=matrix` → 3 hits. Detalle: [`MIGRACION_INERTIA_REACT_MUI_2026-04-23.md`](./MIGRACION_INERTIA_REACT_MUI_2026-04-23.md). |

---

## 10. Próximos pasos

### Fase 6 (Deployment) — estado

- **App Django** (`app/`, iter 3): ✅ testbench interactivo con los 5 modelos — ver §12.
- **Notebook 04** (`04_DeepLearning_Embeddings.ipynb`): ⏳ Neural Collaborative Filtering / Two-Tower. Los `cluster_id` del notebook 03 se pueden usar como feature categórica extra.
- **Notebook 05** (`05_Semantic_Search_RAG.ipynb`): ⏳ RAG sobre `tags.csv` + `genome-scores.csv` filtrado por `relevance > 0.3`; el SVD puede actuar como retriever de candidatos, el RAG como re-ranker por similitud semántica.
- **MLOps / API**: pendiente — envolver los endpoints de `app/` en REST + registrar métricas con MLflow + scheduled retraining.
- **src/**: extraer funciones reutilizables de los notebooks (sampling, cold-start, métricas Top-N) a scripts Python.

### Mejoras continuas posibles

- Tests unitarios en `src/` con pytest sobre las funciones de preparación y métricas.
- CI con GitHub Actions que ejecute los notebooks en modo headless sobre un sample reducido.
- Dockerfile para fijar el entorno reproducible (hoy depende del `venv` local).

---

## 11. App — Testbench de modelos (Fase 6 · 2026-04-23)

*Construida en iter 3, refinada en iter 4, artefactos reubicados en iter 5 y migrada a Inertia + React + MUI en iter 6. Esta sección describe el estado actual.*

Demo interactiva ubicada en `app/`. Carga los artefactos producidos por los notebooks 02 y 03 (pickles en `models/`; parquets y CSV en `data/intermediate/`) y los expone con un **SPA** renderizado por **React + MUI** sobre Django mediante **Inertia.js**. La UI no expone IDs al usuario final: las personas tienen etiquetas descriptivas derivadas de su cluster y género favorito, y las películas se eligen con `MUI Autocomplete` asíncrono contra un endpoint JSON.

### 11.1 Stack

| Capa | Librería | Rol |
|---|---|---|
| Framework | `Django 6.0` | Request/response, router, sesiones, admin opcional. |
| Config | `django-environ 0.13` | Lee `.env` → `SECRET_KEY`, `DEBUG`, rutas a `models/` y `data/intermediate/`, `DJANGO_VITE_DEV_MODE`. |
| Adaptador SPA | `inertia-django 1.2` | `inertia.render(request, 'Component', props={...})`; middleware detecta `X-Inertia`. |
| Bundler/asset | `django-vite 3.0` | Inyecta `<script>`/`<link>` leyendo `frontend/dist/.vite/manifest.json`. |
| Cliente SPA | `@inertiajs/react 2.0` | `createInertiaApp`, `<Link>`, `usePage()`. |
| UI | `@mui/material 6.1` + `@mui/icons-material` + `@emotion/react` | Design system (AppBar, Autocomplete, Rating, Table, Chip, LinearProgress, Grid v2). Tema Inter 400–800 + paleta indigo/emerald sólida. |
| Fuente | `@fontsource/inter 5.1` | Inter empaquetada como módulo (sin CDN). |
| Build | `Vite 5.4` + `@vitejs/plugin-react 4.3` | Dev server con HMR + producción con hashes. |
| Cómputo | `pandas 2.2`, `polars 1.9`, `scikit-surprise 1.1.4` | Lectura de parquets, inferencia de los modelos SVD/KNN/NMF. |

### 11.2 Estructura

```
app/
├── manage.py
├── .env.example
├── templates/
│   └── layout.html             # base Inertia (carga vite_hmr_client + vite_asset "src/main.jsx")
├── frontend/
│   ├── package.json · vite.config.js
│   ├── src/
│   │   ├── main.jsx            # createInertiaApp + ThemeProvider MUI
│   │   ├── theme.js            # createTheme MUI (paleta, tipografía, overrides)
│   │   ├── api.js              # postJson / getJson
│   │   ├── components/
│   │   │   ├── Layout.jsx      # AppBar sticky + Drawer mobile + Container
│   │   │   ├── PageHeader.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── PersonaSelect.jsx
│   │   │   └── MovieAutocomplete.jsx  # async, debounce 250ms
│   │   └── pages/
│   │       ├── Home.jsx · Recommend.jsx · Predict.jsx
│   │       └── Catalog.jsx · Clusters.jsx
│   └── dist/                   # generado por `npm run build`
├── core/
│   ├── settings.py             # inertia, django_vite, INERTIA_LAYOUT, DJANGO_VITE
│   ├── urls.py                 # root URLconf (admin + recommender)
│   ├── asgi.py · wsgi.py
└── apps/
    ├── __init__.py
    └── recommender/
        ├── apps.py             # RecommenderConfig — warmup opcional
        ├── urls.py             # 5 páginas Inertia + 3 endpoints JSON + /health/
        ├── views.py            # inertia.render(...) + api_recommend / api_predict / api_movies
        └── services.py         # Registry singleton thread-safe — pickles/parquets lazy
```

### 11.3 Endpoints

**Páginas Inertia** (devuelven HTML con `<div id="app" data-page="…">` + bundle React):

| Método | Ruta | Vista | Componente React | Descripción |
|---|---|---|---|---|
| GET | `/` | `home` | `Home` | KPIs (`StatCard`) + sección *Cómo funciona* + tabla de métricas con Chips "Más preciso" y "Mejor orden". |
| GET | `/recommend/` | `recommend` | `Recommend` | Form con `PersonaSelect` + `TextField select` (algoritmo) + `TextField` número. Resultado en `List` con `Avatar` numerado y `Rating` del score. |
| GET | `/predict/` | `predict` | `Predict` | Form con `PersonaSelect` + `MovieAutocomplete`. Tabla de los 5 modelos con `Chip` verde "Más alta". |
| GET | `/catalog/` | `catalog` | `Catalog` | Buscador + grid de cards con score bayesiano. |
| GET | `/clusters/` | `clusters` | `Clusters` | 6 cards (1 por cluster) con chips de personas/películas y top-5 títulos. |

**Endpoints JSON** (consumidos desde React con `fetch`):

| Método | Ruta | Cuerpo / query | Respuesta |
|---|---|---|---|
| POST | `/api/recommend/` | JSON `{user_id, model_key, n}` | `{recs, persona, model_label, elapsed_ms, n}` |
| POST | `/api/predict/` | JSON `{user_id, movie_id}` | `{persona, movie, rows, best_key}` |
| GET | `/api/movies/?q=&limit=` | query string | `{query, hits: [{movieId, title, genres, bayesian}]}` |
| GET | `/health/` | — | `{status, models_loaded, sample_users, sample_movies, personas}` |

### 11.4 Estrategia de carga de modelos y personas

`services.Registry` es un dataclass thread-safe con `threading.Lock`. Los artefactos se cargan **la primera vez que se piden** (lazy) y quedan cacheados en memoria. Razón: el `knn_model.pkl` pesa **305 MB** y no conviene bloquear el arranque. Si se necesita pre-cargar SVD/NMF/Baseline + las personas al inicio, basta con exportar `OMNIREC_EAGER_LOAD=True`.

**Personas** (iter 4, sin cambios en iter 6): el primer acceso a `/recommend/` o `/predict/` dispara el cálculo de `registry.personas()`. Une `ratings_sample_5pct.parquet` con `movies_sample.parquet` y `user_clusters.parquet` (todos bajo `data/intermediate/`) para derivar, por usuario: cantidad de reseñas, rating medio, género favorito (primer género del título más votado). Toma los top-7 por cluster × 6 clusters → **~42 personas** con etiquetas tipo *"Fan de Drama · 312 reseñas · Grupo 3"*. El resultado se cachea en `Registry._personas` y viaja como prop de Inertia a las páginas `Recommend`/`Predict`.

### 11.5 Cómo correrlo

```bash
# Dependencias Python:
source venv/bin/activate
pip install -r requirements.txt    # incluye inertia-django y django-vite

# Dependencias JS + build:
cd app/frontend
npm install                        # ~30 s, 169 paquetes
npm run build                      # produce dist/.vite/manifest.json + assets hasheados

# Django:
cd ..
python manage.py migrate --noinput
python manage.py runserver         # http://127.0.0.1:8000/
```

**Dev con HMR (opcional)** — recarga instantánea al editar JSX:

```bash
# Terminal 1
cd app/frontend && npm run dev     # Vite en :5173

# Terminal 2
cd app && DJANGO_VITE_DEV_MODE=True python manage.py runserver
```

### 11.6 Verificación (ejecutada el 2026-04-23, iter 6)

- `python manage.py check` → 0 issues.
- `GET /health/` → `{"status":"ok","models_loaded":0,"sample_users":8126,"sample_movies":5915,"personas":42}`.
- Todas las páginas (`/`, `/recommend/`, `/predict/`, `/catalog/`, `/clusters/`) devolvieron HTTP 200 con `<div id="app" data-page="…">` y el bundle `/static/assets/main-*.js` enlazado.
- `GET /recommend/` con header `X-Inertia: true` → respuesta JSON Inertia (`component`, `props`, `url`, `version`) — confirma el funcionamiento del middleware.
- `GET /api/movies/?q=matrix&limit=3` → 3 hits, primer resultado *Matrix, The (1999)* con score 4.157.
- `POST /api/recommend/` con persona 30024 + SVD + n=3 → HTTP 200, Top-3 en **388.7 ms** incluyendo primera carga del pickle.
- `POST /api/predict/` con persona 30024 + *The Matrix (1999)* → HTTP 200, 5 filas con `baseline 4.157`, `svd 3.969`, `knn 3.848` (tras cargar 305 MB en 264 ms).
- Build Vite: `dist/assets/main-*.js` = 684.52 kB (gzip 216.44 kB); `main-*.css` = 12.15 kB. Build en 1.14 s.

---

## 12. Créditos

Dataset: F. Maxwell Harper and Joseph A. Konstan. 2015. *The MovieLens Datasets: History and Context.* ACM TiiS 5, 4: 19:1–19:19. <https://doi.org/10.1145/2827872>

---

## Anexo — Índice rápido

| # | Sección |
|---|---|
| 1 | Estructura del repositorio |
| 2 | Matriz CRISP-DM |
| 3 | Setup |
| 4 | Flujo de ejecución |
| 5 | Notebook 01 |
| 6 | Notebook 02 |
| 7 | Notebook 03 |
| 8 | Reproducibilidad |
| 9 | Historial de iteraciones |
| 10 | Próximos pasos |
| 11 | **App Django — Testbench** |
| 12 | Créditos |
