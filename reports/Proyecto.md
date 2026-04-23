# OmniRec-Movies

Sistema inteligente de recomendación de películas sobre **MovieLens 25M** (GroupLens, noviembre 2019). Sigue el ciclo **CRISP-DM** y está dividido en cinco fases incrementales: Business Understanding → Data Understanding → Data Preparation → Modeling → Deployment (MLOps + RAG).

---

## 1. Estructura del repositorio

```
OmniRec-Movies/
├── data/
│   ├── ml-25m/              # Dataset original crudo (ratings.csv, movies.csv, tags.csv, ...)
│   └── intermediate/        # Parquets procesados (muestra 5% estratificada, cold-start ≥ 20)
├── notebooks/
│   ├── 01_Data_Sampling_and_Cleaning.ipynb   # Fase 1 — muestreo estratificado + Parquet
│   ├── 02_EDA_and_Visualization.ipynb        # Fase 2 — EDA con Polars lazy (25M ratings)
│   ├── 03_ML_Baseline_AutoML.ipynb           # Fase 3 — Baseline + 3 modelos + AutoML + clustering
│   ├── 04_DeepLearning_Embeddings.ipynb      # Fase 4 — DL (pendiente)
│   └── 05_Semantic_Search_RAG.ipynb          # Fase 5 — RAG semántico (pendiente)
├── models/                  # Modelos serializados (SVD, KNN, NMF, AutoML winner, baseline)
├── reports/                 # Figuras, tabla comparativa CSV, asignaciones de clúster
├── src/                     # Scripts reutilizables (pendiente)
├── app/                     # Demo / servicio (pendiente)
├── config/                  # Parámetros de experimentos (pendiente)
├── requirements.txt
└── README.md
```

---

## 2. Setup

```bash
git clone https://github.com/Coded7Chaos/OmniRec-Movies
cd OmniRec-Movies

python -m venv venv
source venv/bin/activate          # macOS/Linux
# venv\Scripts\activate            # Windows

pip install -r requirements.txt
```

> **Nota sobre `scikit-surprise`**: requiere compilar extensiones Cython. En macOS/Linux necesitas `gcc`/`clang`; en Windows, Visual C++ Build Tools. Si falla la instalación, consulta la documentación oficial de Surprise.

> **`auto-surprise` es opcional.** El notebook 03 detecta `ImportError` automáticamente y recurre a un **GridSearchCV multi-algoritmo** (búsqueda exhaustiva) como fallback. Metodológicamente son equivalentes; el trade-off es tiempo (grid search es más lento que TPE).

---

## 3. Flujo de ejecución (orden de notebooks)

| # | Notebook | Propósito | Salida |
|---|---|---|---|
| 1 | `01_Data_Sampling_and_Cleaning.ipynb` | Muestreo estratificado 5 % + cold-start ≥ 20 votos. | `data/intermediate/ratings_sample_5pct.parquet`, `movies_sample.parquet` |
| 2 | `02_EDA_and_Visualization.ipynb` | EDA sobre los 25M originales con Polars lazy. | Insights y figuras inline (no persistencia). |
| 3 | `03_ML_Baseline_AutoML.ipynb` | Baseline + 3 modelos clásicos + AutoML + clustering. | `models/*.pkl`, `reports/model_comparison.csv`, `reports/*_clusters.parquet` |
| 4 | `04_DeepLearning_Embeddings.ipynb` | NCF / Two-Tower con embeddings profundos (pendiente). | Pendiente |
| 5 | `05_Semantic_Search_RAG.ipynb` | RAG sobre tags + genome-scores (pendiente). | Pendiente |

Ejecuta en VS Code o Jupyter seleccionando el kernel del entorno virtual `venv`.

---

## 4. Notebook 02 — EDA (Fase 2)

Reescrito para trabajar **directamente sobre los 25M ratings del CSV original** (no sobre la muestra). Usa:
- **`polars.scan_csv`** (*lazy evaluation* + paralelismo Rust) sobre `ratings.csv` (678 MB) y `genome-scores.csv` (435 MB). Nunca materializa los 25M en RAM; sólo el resultado agregado.
- **`polars.read_csv`** para los catálogos pequeños (`movies`, `genome-tags`, `links`).
- **`psutil`** para chequear RAM/CPU antes de operaciones costosas.

**Secciones clave** (14 en total):
1. Reproducibilidad + hardware check (`SEED=42`).
2. Carga lazy + esquemas + conteos de filas.
3. Calidad de datos (nulos, duplicados, rangos).
4. Univariado: distribución de `rating` → confirma sesgo positivo (>80 % ≥ 3).
5. Univariado: géneros del catálogo → Drama/Comedy dominan.
6. Power users: ley de potencias + curva de Pareto.
7. Blockbusters vs. Long Tail: >40 % películas con < 20 votos.
8. Bivariado: popularidad vs. rating promedio (corr ≈ +0.35).
9. Bivariado: rating ponderado por género.
10. Evolución temporal (sin *concept drift*).
11. Análisis semántico: top-20 tags + wordcloud.
12. Tag Genome: distribución de relevance.
13. Heatmap de correlación entre métricas agregadas.
14. **Sparsity = 99.74 %** → justifica los modelos latentes de la Fase 3.

---

## 5. Notebook 03 — Modeling (Fase 3) — *documentado en detalle*

Este es el notebook que cumple las **especificaciones del mini-proyecto ML**:
1. Un baseline basado en similitud/popularidad.
2. Al menos tres enfoques comparables (rating o ranking).
3. AutoML como benchmark de desempeño + costo.
4. Clustering sobre usuarios o películas con interpretación.

### 5.1 Datos y split

- **Fuente**: `data/intermediate/ratings_sample_5pct.parquet` (generado por el notebook 01). Si no existe, el notebook lo reconstruye on-the-fly con Polars lazy.
- **Tamaño de trabajo**: ~1.25M ratings (5 % estratificado por *tier* de actividad: Casual/Regular/PowerUser).
- **Cold-start**: sólo películas con ≥ 20 votos (decisión justificada en Fase 2).
- **Split**: 80/20 aleatorio con `random_state=42` vía `surprise.model_selection.train_test_split`. No usamos split temporal porque el EDA mostró **rating medio estable** (~3.5) sin *concept drift*.

### 5.2 Modelos implementados

| # | Modelo | Hiperparámetros base | Por qué este modelo |
|---|---|---|---|
| **1** | **Baseline: Popularidad Bayesiana Ponderada** | `C` = media global (trainset); `m` = P60 de votos | Piso no-trivial; fórmula IMDb con *shrinkage* hacia la media; **penaliza la long tail** (regula ruido de películas con pocos votos identificado en EDA). |
| **2** | **KNN-Baseline (item-based)** | `k=40`, sim=`pearson_baseline`, `min_support=5` | Item-based (más estable que user-based); `pearson_baseline` corrige sesgos por usuario/ítem antes de medir similitud. **Interpretable**: podemos listar películas vecinas. |
| **3** | **SVD (Matrix Factorization)** | `n_factors=50`, `n_epochs=20`, `lr=0.005`, `reg=0.02` | Maneja sparsity 99.7 % con factores latentes densos. **Los factores `.pu`/`.qi` se reutilizan en el clustering** de la Sección 9 → doble rol. |
| **4** | **NMF (Non-negative Matrix Factorization)** | `n_factors=15`, `n_epochs=50`, `biased=False` | Restricción de no negatividad → factores **interpretables como \"temas\" aditivos**. Útil como comparación con SVD. |
| **5** | **AutoML winner** (SVD/NMF/KNN/BaselineOnly) | Elegidos por TPE (auto-surprise) o GridSearchCV 2-fold | Contrasta modelos auto-tuneados vs. defaults; reporta **tiempo total** como costo de modelado. |

### 5.3 Métricas

- **Predicción de rating**: RMSE (principal), MAE.
- **Ranking Top-N** (evaluado sobre el mismo testset, tratando `rating_real ≥ 4.0` como \"relevante\"):
  - **Precision@5, Precision@10** — precisión del Top-K recomendado.
  - **Recall@5, Recall@10** — cobertura sobre los relevantes del usuario.
  - **NDCG@10** — calidad del orden (ganancia acumulada descontada normalizada).
- **Costo de modelado**: tiempo de entrenamiento en segundos (incluido en la tabla final).

**Umbral 4.0 (no 3.5)**: el EDA mostró sesgo positivo con >80 % ratings ≥ 3; usar 3.5 inflaría `Recall` artificialmente.

### 5.4 AutoML — benchmark de desempeño y costo

- **Primera opción**: `auto-surprise` (TPE bayesiano) con presupuesto de 10 min y 30 evaluaciones sobre un **sub-sample del 20 %** del sample principal (para feasibilidad).
- **Fallback**: `GridSearchCV` de Surprise sobre 4 algoritmos (SVD, NMF, KNN-Baseline, BaselineOnly) con 2-fold CV. Mismo presupuesto de datos.
- **Validación final**: el mejor algoritmo + hiperparámetros se refitea sobre el **trainset completo** y se evalúa sobre el **testset reservado**, en las mismas métricas que el resto de modelos. Así se evita el sesgo de optimización del sub-sample.

### 5.5 Clustering no supervisado

- **Embeddings**: vectores latentes `svd.pu` (usuarios, 50D) y `svd.qi` (películas, 50D) del SVD ya entrenado.
- **Selección de k**: método del codo + silhouette score sobre sub-muestra (k ∈ [2, 10]). Por defecto `k=6` para ambos (configurable).
- **KMeans** con `random_state=42` y `n_init=10`.
- **Interpretación**:
  - Por clúster de usuarios: número de usuarios, rating medio/mediano, ratings por usuario, top-3 géneros más consumidos (con su rating promedio).
  - Por clúster de películas: número de películas, rating promedio, popularidad media, géneros dominantes, top-3 títulos representativos.
- **Visualización**: PCA 2D de ambos espacios, coloreados por clúster.

### 5.6 Artefactos que genera el notebook 03

```
models/
├── svd_model.pkl              # SVD entrenado
├── knn_model.pkl              # KNN-Baseline entrenado
├── nmf_model.pkl              # NMF entrenado
├── baseline_scores.pkl        # dict{movieId: bayesian_score} + C, m
└── automl_winner.pkl          # mejor modelo + params + traza AutoML

reports/
├── model_comparison.csv       # tabla comparativa (RMSE, MAE, P@K, R@K, NDCG@10, tiempo)
├── user_clusters.parquet      # (userId, cluster) para los 8k usuarios del trainset
└── item_clusters.parquet      # (movieId, cluster, title, genres, n_ratings, rating_mean)
```

### 5.7 Justificaciones de diseño (decisiones no triviales)

1. **Por qué SVD manual y no solo AutoML.** El PDF exige \"al menos tres enfoques **comparables**\". Si todo lo delegamos a AutoML perdemos el punto de comparación. Los tres modelos manuales con hiperparámetros estándar del paper original (Funk) sirven como *honest baseline*; AutoML muestra el *upper bound* alcanzable con búsqueda.

2. **Por qué KNN item-based y no user-based.** El EDA mostró **long tail en usuarios** (power users dominan): user-user similarity sería inestable para los usuarios casuales. Item-based produce una matriz más densa y estable en el tiempo (los ítems cambian menos que los gustos).

3. **Por qué NMF como tercer modelo y no Slope One.** NMF produce un **segundo set de embeddings** (no negativos) que permite comparar con los de SVD en el clustering. Slope One no genera embeddings.

4. **Por qué umbral `relevance = 4.0`.** El EDA mostró distribución sesgada: 3.0 es \"meh\", no \"bueno\". Usar 3.5 o 3.0 infla recall artificialmente y hace que los modelos parezcan mejores de lo que son.

5. **Por qué sub-muestrear para AutoML.** El presupuesto de cómputo (2 CPUs, 11.7 GB RAM) no permite GridSearchCV completo sobre el sample del 5 % × 4 algoritmos × 12+ combinaciones. Reducir a 20 % es el *trade-off* clásico — el óptimo encontrado se valida luego sobre el testset completo.

6. **Por qué clustering sobre embeddings SVD y no sobre features crudos.** Los embeddings viven en un espacio donde la distancia euclidiana ya codifica similitud de gustos (propiedad emergente de la factorización). Clusterizar features crudos (rating_mean, n_ratings) daría segmentos triviales por popularidad.

---

## 6. Reproducibilidad

Todo el pipeline usa `SEED=42`:
- `random.seed`, `numpy.random.seed`, `PYTHONHASHSEED`.
- `surprise_tts(random_state=SEED)`, `KMeans(random_state=SEED)`, `PCA(random_state=SEED)`.
- Cada modelo Surprise recibe `random_state=SEED` donde lo soporta.

Las muestras pandas (`sample(frac=...)`) también fijan `random_state=42`.

---

## 7. Próximos pasos

- **Fase 4** (`04_DeepLearning_Embeddings.ipynb`): Neural Collaborative Filtering / Two-Tower. Los **clusters_id** del notebook 03 se usan como features categóricas extra.
- **Fase 5** (`05_Semantic_Search_RAG.ipynb`): RAG semántico sobre `tags.csv` + `genome-scores.csv` filtrado por `relevance > 0.3`; el SVD actúa como retriever de candidatos y el RAG re-ranquea por similitud semántica del query.
- **MLOps**: exponer el modelo AutoML winner + baselines como API REST (`app/`), registrar métricas con MLflow, scheduled retraining.

---

## 8. Créditos

Dataset: F. Maxwell Harper and Joseph A. Konstan. 2015. *The MovieLens Datasets: History and Context.* ACM TiiS 5, 4: 19:1–19:19. <https://doi.org/10.1145/2827872>
