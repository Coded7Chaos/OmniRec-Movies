# OmniRec-Movies

Sistema inteligente de recomendación de películas sobre **MovieLens 25M** (GroupLens, noviembre 2019). El proyecto sigue el ciclo **CRISP-DM** completo (Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment) y combina tres enfoques complementarios:

1. **Estadístico / Machine Learning clásico** (Fases 1–5) — popularidad bayesiana, SVD y NMF sobre una muestra estratificada al 60 %, con KNN item-based conservado como benchmark al 10 %. Completado.
2. **Aprendizaje profundo con embeddings** (Fase 6, parte 1) — NCF / Two-Tower. Pendiente.
3. **Recuperación semántica / RAG** sobre tags y genome-scores (Fase 6, parte 2). Pendiente.

El deployment (Fase 6) cuenta con una plataforma web completa en `app/`: un **backend FastAPI** (`app/backend/`) que sirve los modelos entrenados (baseline bayesiano, SVD con *folding-in* y comunidades KMeans) detrás de una API REST con autenticación JWT, y una **aplicación Next.js** (`app/web-app/`) con estética de cine comercial — **OmniCine** — donde usuarios reales se registran, exploran la cartelera, califican películas y reciben recomendaciones personalizadas en tiempo real. Los invitados sin cuenta también reciben personalización: su feedback se guarda en el navegador y se migra al servidor al crear la cuenta.

---

## Índice

- [1. Estructura del repositorio](#1-estructura-del-repositorio)
- [2. Requisitos previos](#2-requisitos-previos)
- [3. Instalación](#3-instalación)
- [4. Ejecución de los notebooks (pipeline ML)](#4-ejecución-de-los-notebooks-pipeline-ml)
- [5. Ejecución de la aplicación web (FastAPI + Next.js)](#5-ejecución-de-la-aplicación-web-fastapi--nextjs)
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
│   ├── IMPLEMENTACION_AUTH_RECS_2026-04-24.md      # Iteración previa (app Django, retirada)
│   └── IMPLEMENTACION_FASTAPI_NEXTJS_2026-06-12.md # Plataforma actual FastAPI + Next.js
├── app/                                  # Plataforma web (Fase 6 — Deployment) ✅
│   ├── backend/                          # API REST FastAPI (modelos + auth JWT + SQLite)
│   │   ├── main.py                       # Punto de entrada (uvicorn main:app)
│   │   ├── ml/engine.py                  # Motor de inferencia (baseline + SVD folding-in)
│   │   ├── routers/                      # auth, movies, recommendations, ratings, profile, meta
│   │   └── scripts/train_models.py       # Regenera models/svd_model.pkl desde los parquets
│   └── web-app/                          # Frontend Next.js 16 — "OmniCine" (cine comercial)
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
- **Node.js 18.18+** (recomendado 20+) con npm, para el frontend Next.js de `app/web-app/`.
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
- **Backend FastAPI (app/backend/):** `fastapi`, `uvicorn`, `sqlalchemy`, `pyjwt`, `bcrypt`, `pydantic[email]` (también listados en `app/backend/requirements.txt`).

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

El notebook 03 (o `app/backend/scripts/train_models.py`) es requisito para que la aplicación web funcione: el backend carga `baseline_scores.pkl`, `svd_model.pkl` y los parquets intermedios.

---

## 5. Ejecución de la aplicación web (FastAPI + Next.js)

La plataforma **OmniCine** tiene dos procesos independientes que se levantan en
terminales separadas:

| Proceso | Carpeta | Puerto | URL |
|---|---|---|---|
| Backend FastAPI (API + modelos) | `app/backend/` | 8000 | <http://localhost:8000> · docs en `/docs` |
| Frontend Next.js (OmniCine) | `app/web-app/` | 3000 | <http://localhost:3000> |

**Requisitos:** el venv del proyecto instalado (sección 3), **Node.js 18.18+**
(recomendado 20+) con npm, y los parquets del notebook 02 en
`data/intermediate/`.

### 5.0 Inicio rápido (resumen)

```bash
# Terminal 1 — Backend
./venv/bin/python app/backend/scripts/train_models.py   # solo la primera vez
cd app/backend
../../venv/bin/uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd app/web-app
npm install                                              # solo la primera vez
npm run dev
```

Abrí <http://localhost:3000>. El detalle de cada paso está abajo.

### 5.1 Inicializar el backend (primera vez)

1. **Dependencias** (sobre el venv del proyecto; ya vienen incluidas si
   instalaste `requirements.txt` de la raíz):

   ```bash
   ./venv/bin/pip install -r app/backend/requirements.txt
   ```

2. **Artefacto del modelo.** El backend necesita `models/svd_model.pkl`
   (no se versiona en git por peso). Se genera en menos de un minuto:

   ```bash
   ./venv/bin/python app/backend/scripts/train_models.py
   ```

   El script reproduce los hiperparámetros del notebook 03 (SVD: 50 factores,
   20 épocas, seed 42) sobre los ratings disponibles en `data/intermediate/`,
   recalcula los clústeres KMeans (k=6) y guarda el artefacto compacto
   (~6 MB). También requiere `models/baseline_scores.pkl` (versionado) y
   `data/ml-25m/links.csv` (IDs de IMDb/TMDb para las imágenes).

3. **Variables de entorno** *(opcional en desarrollo)*: copiá
   `app/backend/.env.example` y exportá las variables si querés cambiar los
   valores por defecto:

   | Variable | Por defecto | Qué hace |
   |---|---|---|
   | `OMNIREC_SECRET_KEY` | clave dev insegura | Firma de los JWT (cambiar en producción). |
   | `OMNIREC_DATABASE_URL` | `sqlite:///./omnirec.db` | Conexión SQLAlchemy. |
   | `OMNIREC_CORS_ORIGINS` | `http://localhost:3000,...` | Orígenes permitidos, separados por coma. |

4. **Levantar el servidor:**

   ```bash
   cd app/backend
   ../../venv/bin/uvicorn main:app --reload --port 8000
   ```

   Al arrancar crea `omnirec.db` (SQLite con usuarios, ratings y watchlist;
   gitignorado) y carga el motor de recomendación en memoria (~1 s).
   Verificá con <http://localhost:8000/api/health> o la documentación
   interactiva en <http://localhost:8000/docs>.

### 5.2 Inicializar el frontend (primera vez)

1. **Dependencias:**

   ```bash
   cd app/web-app
   npm install
   ```

2. **Variables de entorno** *(opcional)*: por defecto el frontend apunta a
   `http://localhost:8000`. Si el backend corre en otra URL, creá
   `app/web-app/.env.local`:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Modo desarrollo** (hot-reload):

   ```bash
   npm run dev          # http://localhost:3000
   ```

4. **Modo producción:**

   ```bash
   npm run build
   npm run start        # sirve el build optimizado en el puerto 3000
   ```

### 5.3 Qué hace la aplicación

- **Portada** (`/`): marquesina rotativa con las destacadas y filas por
  género; si hay historial, aparece la fila "Para ti" personalizada.
- **Cartelera** (`/cartelera`): catálogo completo (55,113 películas) con
  búsqueda, filtros por género, ordenamientos y paginación.
- **Ficha** (`/pelicula/[id]`): calificación con estrellas (medios puntos),
  afinidad estimada por el modelo y similares por embeddings del SVD.
- **Para ti** (`/para-ti`): Top-N personalizado + comunidad de gustos.
- **Perfil** (`/perfil`): estadísticas, persona, calificadas y "mi lista".
- **Cuentas** (`/login`, `/registro`): sesión con JWT. Sin cuenta, el
  feedback se guarda en el navegador (localStorage) y personaliza igual; al
  registrarse se migra automáticamente al servidor.
- **Imágenes:** pósters y fondos reales desde el CDN público de Metahub por
  `imdbId` (sin API key), con arte procedural plano como respaldo si no hay
  imagen.

### 5.4 Endpoints principales del API

| Ruta | Propósito |
|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | Registro, inicio de sesión (JWT) y sesión actual. |
| `GET /api/movies` | Catálogo con búsqueda, filtro por género/década, orden y paginación. |
| `GET /api/movies/{id}` · `GET /api/movies/{id}/similar` | Ficha de película y vecinas por coseno en el espacio latente del SVD. |
| `GET /api/recommendations` · `POST /api/recommendations/guest` | Top-N personalizado (SVD folding-in) para usuarios o invitados. |
| `GET /api/recommendations/home` · `POST /api/recommendations/home/guest` | Payload completo de la portada (héroe + filas por género). |
| `GET/POST/DELETE /api/ratings` · `POST /api/ratings/sync` | Feedback del usuario; `sync` migra los ratings de invitado al crear sesión. |
| `GET/POST/DELETE /api/watchlist` | "Mi lista" del usuario. |
| `GET /api/profile` · `POST /api/profile/guest` | Estadísticas + comunidad de gustos (folding-in + centroide KMeans más cercano). |
| `GET /api/meta/models` · `GET /api/meta/stats` | Tabla comparativa del notebook 03 y métricas del catálogo. |

### 5.5 Estrategia de recomendación

- **Cold start (sin ratings):** ranking por **popularidad bayesiana**
  (`models/baseline_scores.pkl`, fórmula IMDb del notebook 03).
- **Con historial:** ***folding-in*** — se estima el vector latente del
  usuario resolviendo un ridge sobre los factores de los ítems que calificó,
  y se re-rankea un pool de ~2,500 candidatos populares con la predicción SVD
  (`mu + bu + bi + qi·pu`).
- **Comunidades:** el vector del usuario se asigna al centroide KMeans (k=6)
  más cercano; cada clúster tiene un arquetipo nombrado según el *lift* de
  géneros (p. ej. *Exploradores de Mundos*, *Detectives de Medianoche*).
- **Similitud ítem-ítem:** coseno entre embeddings de películas del SVD.

### 5.6 Stack técnico

- **FastAPI + SQLAlchemy + SQLite** (usuarios, ratings, watchlist) con JWT
  (`PyJWT`) y `bcrypt`.
- **Next.js 16 (App Router, Turbopack) + Tailwind CSS v4 + lucide-react +
  motion**, con diseño plano y sobrio (sin gradientes ni colores saturados) y
  animaciones fluidas.
- **Feedback de invitados** persistido en `localStorage` y migrado
  automáticamente al servidor al registrarse.

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

- **`reports/Proyecto.md`** — Estado consolidado del proyecto, matriz CRISP-DM, decisiones metodológicas y detalle de cada notebook.
- **`reports/IMPLEMENTACION_FASTAPI_NEXTJS_2026-06-12.md`** — Plataforma web actual: backend FastAPI, frontend Next.js (OmniCine), estrategia de inferencia y decisiones de diseño.
- **`reports/IMPLEMENTACION_AUTH_RECS_2026-04-24.md`** — Iteración previa sobre la app Django (retirada del repositorio).
- **`data/NOTAS_PROCEDENCIA.md`** — Origen y licencia del dataset.
- **`data/README.md`, `notebooks/README.md`, `src/README.md`, `config/README.md`, `models/README.md`, `reports/README.md`, `app/README.md`** — Notas breves por carpeta.

---

## 8. Solución de problemas

**`ModuleNotFoundError: No module named 'surprise'`**
El venv no está activo o las dependencias no se instalaron. Ejecutá `source venv/bin/activate && pip install -r requirements.txt`.

**`numpy.core.multiarray failed to import` al importar `surprise`**
Tenés NumPy 2.x instalado. Forzá la versión compatible: `pip install "numpy>=1.26,<2.0"`.

**El backend falla al arrancar con `No existe models/svd_model.pkl`**
Generá el artefacto de inferencia: `./venv/bin/python app/backend/scripts/train_models.py` (tarda menos de un minuto). Requiere los parquets del notebook 02 en `data/intermediate/`.

**Los notebooks no aparecen con el kernel correcto en VS Code**
Tras activar el venv por primera vez, registralo como kernel: `python -m ipykernel install --user --name omnirec --display-name "Python (OmniRec)"`. Luego seleccionalo desde VS Code.

**`scikit-surprise` falla al instalar en Windows**
Instalá **Microsoft C++ Build Tools** desde <https://visualstudio.microsoft.com/visual-cpp-build-tools/>.

**Puerto 8000 ocupado al levantar el backend**
Usá otro puerto: `uvicorn main:app --port 8080`, y apuntá el frontend con `NEXT_PUBLIC_API_URL=http://localhost:8080` en `app/web-app/.env.local`.

**La web carga pero muestra "No se pudo conectar con el servidor"**
El backend FastAPI no está corriendo o el CORS no permite el origen del frontend. Levantá `uvicorn main:app --port 8000` desde `app/backend/` y verificá `OMNIREC_CORS_ORIGINS`.

---

**Proyecto académico — UCB · Machine Learning.** Para el detalle técnico completo, referirse a `reports/Proyecto.md`.
