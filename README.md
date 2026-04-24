# OmniRec-Movies

Sistema inteligente de recomendación de películas sobre **MovieLens 25M** (GroupLens, noviembre 2019). El proyecto sigue el ciclo **CRISP-DM** completo (Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment) y combina tres enfoques complementarios:

1. **Estadístico / Machine Learning clásico** (Fases 1–5) — popularidad bayesiana, SVD y NMF sobre una muestra estratificada al 60 %, con KNN item-based conservado como benchmark al 10 %. Completado.
2. **Aprendizaje profundo con embeddings** (Fase 6, parte 1) — NCF / Two-Tower. Pendiente.
3. **Recuperación semántica / RAG** sobre tags y genome-scores (Fase 6, parte 2). Pendiente.

El deployment (Fase 6) ya cuenta con una **app Django** operativa en `app/` que expone los 5 modelos entrenados mediante una interfaz web amigable (HTMX + Tailwind), sin necesidad de exponer IDs numéricos al usuario final.

---

## Índice

- [1. Estructura del repositorio](#1-estructura-del-repositorio)
- [2. Requisitos previos](#2-requisitos-previos)
- [3. Instalación](#3-instalación)
- [4. Ejecución de los notebooks (pipeline ML)](#4-ejecución-de-los-notebooks-pipeline-ml)
- [5. Ejecución de la app Django (testbench de modelos)](#5-ejecución-de-la-app-django-testbench-de-modelos)
- [6. Modelos entrenados y métricas](#6-modelos-entrenados-y-métricas)
- [7. Documentación detallada](#7-documentación-detallada)
- [8. Solución de problemas](#8-solución-de-problemas)

---

## 1. Estructura del repositorio

```
OmniRec-Movies/
├── data/
│   ├── ml-25m/                           # Dataset original (ratings, movies, tags, genome-*)
│   └── intermediate/                     # Parquets / CSV generados por el pipeline (notebooks 02 y 03)
│       ├── ratings_prepared_60pct.parquet      # muestra principal para Baseline/SVD/NMF ← nb 02
│       ├── movies_prepared_60pct.parquet       # catálogo asociado al 60 %                ← nb 02
│       ├── genome_scores_prepared_60pct.parquet# genome scores del 60 %                   ← nb 02
│       ├── ratings_knn_10pct.parquet           # muestra KNN benchmark                     ← nb 02
│       ├── movies_knn_10pct.parquet            # catálogo asociado al 10 %                 ← nb 02
│       ├── genome_tags.parquet           # 1 128 tags                                 ← nb 02
│       ├── model_comparison.csv          # RMSE / MAE / P@K / R@K / NDCG@10 / tiempo  ← nb 03
│       ├── user_clusters.parquet         # Segmentación de usuarios (KMeans sobre SVD) ← nb 03
│       └── item_clusters.parquet         # Segmentación de películas                   ← nb 03
├── notebooks/
│   ├── 01_Business_Understanding_and_EDA.ipynb   # Fases 1 + 2
│   ├── 02_Data_Sampling_and_Cleaning.ipynb       # Fase 3
│   ├── 03_ML_Baseline_AutoML.ipynb               # Fases 4 + 5
│   ├── 04_DeepLearning_Embeddings.ipynb          # Fase 6 (DL)  — placeholder
│   └── 05_Semantic_Search_RAG.ipynb              # Fase 6 (RAG) — placeholder
├── models/                               # Artefactos *.pkl del notebook 03
│   ├── baseline_scores.pkl
│   ├── knn_model.pkl
│   ├── svd_model.pkl
│   ├── nmf_model.pkl
│   └── automl_winner.pkl
├── reports/                              # SOLO documentación Markdown
│   ├── Proyecto.md                       # Estado y guía técnica del proyecto
│   ├── MEJORAS_NOTEBOOKS.md              # Historial de iteraciones sobre los notebooks
│   ├── CAMBIOS_APP_DJANGO_2026-04-20.md  # Construcción inicial de la app Django (iter 3)
│   └── UX_APP_DJANGO_2026-04-20.md       # Refinamiento de UX (iter 4)
├── app/                                  # Demo Django (Fase 6 — Deployment) ✅
│   ├── manage.py
│   ├── .env.example                      # Plantilla de variables de entorno
│   ├── core/                             # Proyecto Django (settings / urls / asgi / wsgi)
│   └── apps/recommender/                 # App principal (testbench de los 5 modelos)
├── src/                                  # Scripts reutilizables (pendiente)
├── config/                               # Parámetros de experimentos (pendiente)
├── requirements.txt
└── README.md                             # (este archivo)
```

---

## 2. Requisitos previos

- **Python 3.10 – 3.12** (verificado en 3.12.13).
- **Compilador C/C++** para `scikit-surprise`:
  - macOS/Linux: `gcc` o `clang`.
  - Windows: Visual C++ Build Tools.
- **Git** para clonar el repositorio.
- **RAM recomendada:** 16 GB. El notebook 01 usa Polars lazy sobre los 25 M ratings; el notebook 03 necesita ~3 GB adicionales durante el AutoML.
- *(Opcional)* **VS Code** con la extensión **Jupyter** si querés ejecutar los notebooks desde el editor.

---

## 3. Instalación

### 3.1 Clonar el repositorio

```bash
git clone https://github.com/Coded7Chaos/OmniRec-Movies
cd OmniRec-Movies
```

### 3.2 Crear y activar un entorno virtual

```bash
# Crea el venv (si tu comando de Python es diferente, usá python3 o py)
python -m venv venv

# Activar
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate            # Windows (PowerShell o CMD)
```

### 3.3 Instalar dependencias

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

`requirements.txt` contiene dos bloques:

- **Pipeline ML (notebooks 01–03):** `numpy<2`, `polars`, `pandas`, `pyarrow`, `scikit-learn`, `scikit-surprise`, `matplotlib`, `seaborn`, `jupyter`, `ipykernel`, `wordcloud`, `joblib`, etc.
- **Demo Django (app/):** `Django 6.0`, `django-environ`, `django-htmx`, `django-browser-reload`, `django-tailwind`, `pytailwindcss`.

> **Nota sobre NumPy:** `scikit-surprise==1.1.4` se distribuye como wheel compilado contra NumPy 1.x. Por eso `requirements.txt` fija `numpy>=1.26,<2.0`. Si instalás NumPy 2.x a mano verás el error `numpy.core.multiarray failed to import`.

### 3.4 Descargar los datos

Colocá el dataset **MovieLens 25M** en `data/ml-25m/` (archivos `ratings.csv`, `movies.csv`, `tags.csv`, `genome-scores.csv`, `genome-tags.csv`). Descarga oficial: <https://grouplens.org/datasets/movielens/25m/>.

Consultá `data/NOTAS_PROCEDENCIA.md` para el detalle de las fuentes y licencias.

---

## 4. Ejecución de los notebooks (pipeline ML)

El orden **01 → 02 → 03** es lineal y reproduce las fases 1 a 5 de CRISP-DM. No hay saltos hacia atrás.

### 4.1 Desde VS Code o Jupyter

1. Abrí la carpeta del proyecto en VS Code.
2. Abrí cualquier `.ipynb` de `notebooks/`.
3. Cuando te pida seleccionar kernel, elegí **el intérprete de Python del venv** (ruta `OmniRec-Movies/venv/bin/python` en macOS/Linux o `OmniRec-Movies\venv\Scripts\python.exe` en Windows).
4. Ejecutá las celdas en orden.

### 4.2 En modo batch (línea de comandos)

```bash
./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/01_Business_Understanding_and_EDA.ipynb
./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/02_Data_Sampling_and_Cleaning.ipynb
./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/03_ML_Baseline_AutoML.ipynb
```

### 4.3 Qué produce cada notebook

| # | Notebook | Fase CRISP-DM | Salida principal |
|---|---|---|---|
| 01 | `01_Business_Understanding_and_EDA.ipynb` | 1 + 2 | 14 bloques de EDA con insights de negocio sobre long tail, sparsity y evolución temporal. |
| 02 | `02_Data_Sampling_and_Cleaning.ipynb` | 3 | Parquets del 60 % principal y del 10 % para KNN, sin filtro global de cold-start. |
| 03 | `03_ML_Baseline_AutoML.ipynb` | 4 + 5 | 5 `*.pkl` en `models/` + `data/intermediate/model_comparison.csv`, `user_clusters.parquet`, `item_clusters.parquet`. |

El notebook 03 es requisito indispensable para que la app Django funcione (carga los pickles y parquets).

---

## 5. Ejecución de la app Django (testbench de modelos)

La app permite probar los modelos entrenados contra cualquier usuario de la muestra principal del 60 %. No expone IDs al usuario: genera **42 personas** (6 clusters × top-7 usuarios) con etiquetas del tipo *"Fan de Acción · 1 909 reseñas · Grupo 0"*, y permite elegir películas por **título con autocompletado**.

### 5.1 Configuración

```bash
cd app
cp .env.example .env
```

Editá `.env` si querés cambiar las rutas por defecto. Las variables soportadas son:

| Variable | Por defecto | Qué hace |
|---|---|---|
| `DJANGO_SECRET_KEY` | `change-me` | Secreto de Django (cambialo en producción). |
| `DJANGO_DEBUG` | `True` | Modo debug. |
| `DJANGO_ALLOWED_HOSTS` | `*` | Hosts permitidos (coma-separado). |
| `OMNIREC_MODELS_DIR` | `<repo>/models` | Dónde están los `*.pkl`. |
| `OMNIREC_DATA_DIR` | `<repo>/data/intermediate` | Dónde están los parquets preparados (`ratings_prepared_60pct.parquet`, `movies_prepared_60pct.parquet`) y los artefactos del notebook 03. |
| `OMNIREC_EAGER_LOAD` | `False` | Si es `True`, precarga SVD/NMF/Baseline al iniciar (KNN siempre es lazy por peso: 305 MB). |

### 5.2 Migraciones iniciales

```bash
python manage.py migrate
```

Esto crea `db.sqlite3` (la app no define modelos de dominio propios; sólo las tablas internas de Django).

### 5.3 Levantar el servidor de desarrollo

```bash
python manage.py runserver
```

Abrí <http://127.0.0.1:8000/> en el navegador.

### 5.4 Rutas disponibles

| Ruta | Propósito |
|---|---|
| `/` | Home con onboarding (3 pasos), KPIs y tabla de métricas. |
| `/recommend/` | Recomendar Top-N películas no vistas para una persona. Elegís persona + algoritmo + N. |
| `/predict/` | Predecir la nota de una persona para una película específica. Compara los 5 modelos y resalta el de mayor predicción. |
| `/catalog/` | Buscador del catálogo con HTMX (5 915 películas). |
| `/clusters/` | Visualización de los 6 clusters de usuarios. |
| `/health/` | JSON de estado: `{ status, sample_users, sample_movies, models_loaded, personas }`. |

### 5.5 Stack técnico

- **Django 6.0** con `apps.recommender` (namespaced bajo `apps/`).
- **django-environ** para la configuración vía `.env`.
- **django-htmx** para las actualizaciones parciales (autocompletado, resultados de recomendación, búsqueda).
- **django-browser-reload** para hot-reload en desarrollo.
- **Tailwind** vía CDN en `base.html` (zero-setup). `django-tailwind` + `pytailwindcss` están en `requirements.txt` para el pipeline de producción.
- **Registry singleton** (`apps/recommender/services.py`) con `threading.Lock` que carga los pickles y parquets de forma perezosa y thread-safe.
- **Patrón retriever + re-ranker:** se eligen 400 candidatos por score bayesiano y luego se reordenan con el modelo seleccionado — evita puntuar las 5 915 películas en cada request.

---

## 6. Modelos entrenados y métricas

Los modelos se entrenan en el notebook 03 con un **split temporal por usuario**. Baseline, SVD, NMF y AutoML corren sobre la muestra principal del `60 %`; KNN se conserva como benchmark metodológico sobre `10 %`.

| Modelo | RMSE | MAE | P@10 | R@10 | NDCG@10 | Tiempo (s) |
|---|---:|---:|---:|---:|---:|---:|
| **KNN-Baseline (item-based)** | **0.799** | 0.602 | **0.682** | 0.376 | **0.846** | 27.1 |
| SVD | 0.814 | 0.617 | 0.649 | 0.330 | 0.835 | 3.1 |
| AutoML → BaselineOnly | 0.853 | 0.650 | 0.559 | 0.295 | 0.811 | 66.2 |
| NMF | 0.863 | 0.657 | 0.587 | 0.310 | 0.805 | 7.2 |
| Baseline (Pop. Bayesiana) | 0.958 | 0.741 | 0.612 | 0.215 | 0.812 | 0.8 |

SVD es el candidato principal por equilibrio entre calidad, velocidad y reutilización de embeddings. KNN se mantiene sólo como benchmark sobre `10 %` porque escala mal cuando crece el catálogo. El AutoML detecta `auto-surprise` y, si no está instalado, cae automáticamente a un `GridSearchCV` sobre los modelos del pipeline principal.

---

## 7. Documentación detallada

- **`reports/Proyecto.md`** — Estado consolidado del proyecto, matriz CRISP-DM, decisiones metodológicas, detalle de cada notebook y de la app Django.
- **`reports/MEJORAS_NOTEBOOKS.md`** — Historial de iteraciones sobre los notebooks (iter 1: refactor técnico; iter 2: reorganización al flujo lineal).
- **`reports/CAMBIOS_APP_DJANGO_2026-04-20.md`** — Construcción inicial de la app Django (iter 3): arquitectura, endpoints, decisiones de diseño.
- **`reports/UX_APP_DJANGO_2026-04-20.md`** — Refinamiento de UX (iter 4): eliminación de IDs visibles, personas con etiquetas, autocompletado de películas, paleta sólida sin gradientes, onboarding.
- **`data/NOTAS_PROCEDENCIA.md`** — Origen y licencia del dataset.
- **`data/README.md`, `notebooks/README.md`, `src/README.md`, `config/README.md`, `models/README.md`, `reports/README.md`, `app/README.md`** — Notas breves por carpeta.

---

## 8. Solución de problemas

**`ModuleNotFoundError: No module named 'surprise'`**
El venv no está activo o las dependencias no se instalaron. Ejecutá `source venv/bin/activate && pip install -r requirements.txt`.

**`numpy.core.multiarray failed to import` al importar `surprise`**
Tenés NumPy 2.x instalado. Forzá la versión compatible: `pip install "numpy>=1.26,<2.0"`.

**La app Django arranca pero `/health/` dice `models_loaded: 0`**
Los `*.pkl` no existen aún. Ejecutá el notebook 03 completo antes de levantar el servidor, o apuntá `OMNIREC_MODELS_DIR` en `.env` a la carpeta donde sí estén.

**Los notebooks no aparecen con el kernel correcto en VS Code**
Tras activar el venv por primera vez, registralo como kernel: `python -m ipykernel install --user --name omnirec --display-name "Python (OmniRec)"`. Luego seleccionalo desde VS Code.

**`scikit-surprise` falla al instalar en Windows**
Instalá **Microsoft C++ Build Tools** desde <https://visualstudio.microsoft.com/visual-cpp-build-tools/>.

**Puerto 8000 ocupado al hacer `runserver`**
Usá otro puerto: `python manage.py runserver 8080`.

---

**Proyecto académico — UCB · Machine Learning.** Para el detalle técnico completo, referirse a `reports/Proyecto.md`.
