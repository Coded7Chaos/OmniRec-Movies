# Mejoras aplicadas a los notebooks — cumplimiento CRISP-DM

Fecha: 2026-04-20 (revisado — iteración 2, misma fecha, tras reorganización lineal de fases)
Alcance: revisión y refactor de `notebooks/` hasta la fase de Modelado de Machine Learning, sobre la base de `reports/Proyecto.md`.

> **Nota sobre la iteración 2** — la versión inicial de este documento (ver §1-8) describe una estructura en la que el notebook 01 combinaba **Fase 1 + Fase 3** y el notebook 02 cubría la Fase 2. Esto forzaba un salto de fase (1 → 3 → 2 → 4). En la iteración 2 los notebooks se reorganizaron para que el flujo sea **estrictamente lineal de Fase 1 a Fase 6**. Los cambios se detallan en §9; las secciones §1-8 quedan como registro histórico.

---

## 1. Resumen ejecutivo

El objetivo de esta iteración fue asegurar que los tres primeros notebooks cumplan explícitamente la metodología **CRISP-DM** (Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation), con código ejecutable de punta a punta en el hardware local del autor (macOS, 16 GB RAM, 10 CPUs).

Cambios de alto nivel:

| Notebook | Situación previa | Situación actual |
|---|---|---|
| `01_Data_Sampling_and_Cleaning.ipynb` | Esqueleto con 2 celdas de código y rutas absolutas de **Deepnote** (`/work/data/raw/…`). Markdown de CRISP-DM sin contenido real. No ejecutable localmente. | Reescrito por completo: 34 celdas (15 código + 19 markdown) cubriendo Fase 1 (Business Understanding) y Fase 3 (Data Preparation). Rutas relativas autodetectadas. Validación estadística de la muestra. Ejecutado end-to-end sin errores. |
| `02_EDA_and_Visualization.ipynb` | Ya venía estructurado como CRISP-DM Fase 2 (Data Understanding) con Polars lazy sobre los 25 M ratings. | Conservado sin cambios — ya cumplía la fase de forma completa. |
| `03_ML_Baseline_AutoML.ipynb` | Contenido correcto (baseline + 3 modelos + AutoML + clustering) pero rotulado como "Fase 3 (Modeling)". En CRISP-DM estándar **Modeling es Fase 4 y Evaluation es Fase 5**. | Cabecera reescrita para declarar explícitamente "CRISP-DM Fase 4 (Modeling) + Fase 5 (Evaluation)". El resto del contenido se mantuvo por ser adecuado. |
| `04_DeepLearning_Embeddings.ipynb` · `05_Semantic_Search_RAG.ipynb` | Placeholders (una celda con `sadasd`). | **Fuera de alcance** en esta iteración ("hasta la parte de modelado de Machine Learning" — ambos corresponden a fases posteriores: Deep Learning y RAG). Se documentan como pendientes. |

---

## 2. Notebook 01 — reescritura completa

### 2.1 Problemas corregidos

1. **Rutas obsoletas**: el notebook original usaba `Path('/work/data/raw/ratings.csv')` y `Path('/work/data/intermediate')`, propias del entorno Deepnote. No ejecutaba en el repositorio local.
2. **Ausencia de Business Understanding**: los headers `# Business Understanding` y `## Data Preparation` existían pero sin contenido real que justificara decisiones.
3. **Sin validación de representatividad**: el sample se generaba pero nunca se comprobaba que preserve la distribución original (rating, géneros, tiers).
4. **Sin chequeos de hardware ni fallbacks**: no detectaba RAM baja ni conmutaba a Polars streaming cuando hiciera falta.
5. **Sin métricas comparativas** población ↔ muestra al final.

### 2.2 Estructura nueva (34 celdas)

| Sección | Fase CRISP-DM | Contenido |
|---|---|---|
| 0. Reproducibilidad, rutas y chequeo de hardware | Preámbulo | `SEED=42`, detección automática de raíz del proyecto (`Path.cwd()` + `notebooks/`), `psutil` para RAM, fallback a Polars lazy si RAM libre < 4 GB. |
| 1. Business Understanding | **Fase 1** | Contexto, criterios de éxito (4), restricciones (tamaño, sparsity, long tail, power users), plan de preparación. |
| 2. Data Understanding preliminar | Fase 2 (preview) | Esquemas + conteos lazy con Polars; nulos y estadísticas básicas. El EDA completo vive en notebook 02. |
| 3. Data Preparation | **Fase 3** | 7 sub-secciones: estrategia → carga del CSV → tiers `qcut(q=3)` → muestreo estratificado → filtro por usuario → filtro cold-start ≥ 20 votos → persistencia en Parquet. |
| 4. Sincronización de metadatos | Fase 3 | Filtra `movies.csv` + `genome-scores.csv` (Polars lazy + streaming) + copia `genome-tags.csv`. |
| 5. Validación de la muestra | Fase 3 | Distribución de rating (L1 distance = 0.0323), top-12 géneros, proporciones por tier. Visualización comparativa. |
| 6. Métricas finales | Fase 3 | Tabla (muestra vs población) con % retenido + sparsity final. |
| 7. Artefactos y handoff | Fase 3 | Smoke-test de lectura de los 4 parquets. |
| 8. Conclusiones | Cierre | 6 hallazgos con implicaciones para el notebook siguiente. |

### 2.3 Resultados numéricos de la ejecución

Datos del dataset original:
- 25 000 095 ratings, 162 541 usuarios, 59 047 películas.
- Rating: min=0.5, max=5.0, mean=3.534, std=1.061. Sin nulos.

Datos de la muestra producida:
- **1 152 574 ratings** (4.61 % de la población), **8 126 usuarios** (5.00 %), **5 915 películas** (10.02 %).
- Rating mean=3.578, std=1.036 (muy cerca de la población).
- **Sparsity 97.60 %** (↓ desde 99.74 % → matriz 10× más densa para CF).
- L1-distance entre distribución de rating muestra↔población: **0.0323** (excelente).
- Diferencia máxima de proporción por tier: **0.0000** (el estratificado es exacto).

Artefactos generados en `data/intermediate/`:

| Archivo | Filas | Tamaño | Propósito |
|---|---:|---:|---|
| `ratings_sample_5pct.parquet` | 1 152 574 | 7.21 MB | Tabla de entrenamiento para Surprise y DL. |
| `movies_sample.parquet` | 5 915 | 0.16 MB | Catálogo filtrado a los `movieId` supervivientes. |
| `genome_scores_sample.parquet` | 6 672 120 | 19.76 MB | Relevancia genómica filtrada — insumo para la Fase RAG. |
| `genome_tags.parquet` | 1 128 | 0.02 MB | Catálogo de tags del genoma (copia tal cual). |

### 2.4 Decisiones metodológicas clave documentadas

1. **Muestreo estratificado por terciles** (no percentiles 80/95): garantiza ~2 700 usuarios por tier, suficiente para representatividad.
2. **Cold-start aplicado después del muestreo de usuarios**: el conteo relevante es "votos dentro del sample", no en la población.
3. **Parquet Snappy**: ratio ~4.6× vs CSV equivalente; tipado preservado (`int32`, `float32`).
4. **Polars lazy** para el archivo pesado de genome-scores (415 MB CSV → nunca se materializa entero en RAM).
5. **Asserts**: validación defensiva (sin nulos, rango [0.5, 5.0], sin pares duplicados userId×movieId).

---

## 3. Notebook 02 — verificación

Ya cumplía de forma completa CRISP-DM Fase 2 (Data Understanding). Se mantuvo íntegro. Sus 14 secciones:

1. Reproducibilidad y chequeo de hardware.
2. Carga lazy + esquemas + conteos.
3. Calidad de datos (nulos, duplicados, rangos).
4. Distribución de rating → confirma sesgo positivo.
5. Géneros del catálogo → Drama/Comedy dominan.
6. Power users → ley de potencias + Pareto.
7. Blockbusters vs long tail → ≥ 20 votos justificado.
8. Popularidad vs calidad (corr ≈ +0.35).
9. Rating ponderado por género.
10. Evolución temporal → sin concept drift.
11. Análisis semántico de tags + wordcloud.
12. Tag Genome → `relevance > 0.3` como umbral.
13. Heatmap de correlación.
14. Sparsity = 99.74 % → obliga a modelos latentes.

Cada sección cierra con un bloque `**Insight de negocio.**` que alimenta decisiones concretas en el notebook 03.

---

## 4. Notebook 03 — ajuste de cabecera

### 4.1 Cambio realizado

Sólo la celda 0 (markdown) fue editada. Texto anterior:
```
# Fase 3 — Modelado: Baselines, Modelos Clásicos, AutoML y Clustering
...
Notebook `03_ML_Baseline_AutoML.ipynb` — **CRISP-DM Fase 3 (Modeling)**.
```

Texto nuevo:
```
# Fase 4 y 5 — Modeling + Evaluation (CRISP-DM)
...
Notebook `03_ML_Baseline_AutoML.ipynb` — **CRISP-DM Fase 4 (Modeling)** + **CRISP-DM Fase 5 (Evaluation)**.
```

**Motivo**: la nomenclatura estándar de CRISP-DM es Business Understanding (1) → Data Understanding (2) → Data Preparation (3) → **Modeling (4)** → **Evaluation (5)** → Deployment (6). La etiqueta anterior "Fase 3 (Modeling)" confundía al lector con la fase real de Data Preparation (que vive en el notebook 01). Ahora los números del notebook coinciden con la metodología canónica.

### 4.2 Contenido del notebook 03 (sin tocar)

- **Modeling (Fase 4)**:
  - Sección 2: Baseline Bayesiano Ponderado (IMDb weighted rating).
  - Secciones 3-5: KNN-Baseline item-based, SVD (50 factores), NMF (15 factores).
  - Sección 6: AutoML vía `auto-surprise` (TPE) con fallback a `GridSearchCV` multi-algoritmo.
- **Evaluation (Fase 5)**:
  - Secciones 7-8: Precision@K, Recall@K, NDCG@K (umbral = 4.0); tabla comparativa unificada; visualización RMSE/NDCG@10/tiempo.
  - Sección 9: Clustering KMeans sobre `svd.pu` y `svd.qi`, elbow + silhouette, interpretación por géneros y popularidad, PCA 2D.
  - Sección 10: Conclusiones y decisiones para la Fase 4 del proyecto (notebook 04 — DL).

Artefactos que persiste: `models/*.pkl` (5 modelos) + `data/intermediate/model_comparison.csv`, `data/intermediate/user_clusters.parquet`, `data/intermediate/item_clusters.parquet`. *Nota: hasta la iteración 4 estos tres últimos se escribían en `reports/`; en la iteración 5 (2026-04-20) se movieron a `data/intermediate/` para que `reports/` quede reservado exclusivamente a documentación Markdown — ver `Proyecto.md` §9.*

---

## 5. Notebooks 04 y 05 — fuera del alcance actual

Ambos están aún como placeholders (celdas de prueba). Corresponden a las fases posteriores del proyecto (Deep Learning y RAG semántico), que el usuario indicó dejar fuera de esta iteración ("hasta la parte de modelado de Machine Learning"). Quedan documentados como pendientes en `Proyecto.md`.

---

## 6. Verificación CRISP-DM — tabla de trazabilidad

| Fase CRISP-DM | Notebook | Estado |
|---|---|---|
| 1. Business Understanding | `01_Data_Sampling_and_Cleaning.ipynb` §1 | ✅ Sección dedicada con contexto, criterios, restricciones, plan. |
| 2. Data Understanding | `02_EDA_and_Visualization.ipynb` (14 secciones) + `01` §2 (preview) | ✅ EDA completo sobre los 25 M ratings con Polars lazy. |
| 3. Data Preparation | `01_Data_Sampling_and_Cleaning.ipynb` §3-7 + `03` §1 (split train/test) | ✅ Muestreo estratificado + cold-start + persistencia Parquet + validación L1. |
| 4. Modeling | `03_ML_Baseline_AutoML.ipynb` §2-6 | ✅ Baseline + 3 modelos + AutoML. |
| 5. Evaluation | `03_ML_Baseline_AutoML.ipynb` §7-10 | ✅ Métricas Top-N, clustering interpretado, conclusiones. |
| 6. Deployment | Pendiente (fase 4 del proyecto — Deep Learning + MLOps) | ⏳ Notebook 04, notebook 05, `app/`. |

---

## 7. Reproducibilidad

Todos los notebooks fijan `SEED=42` en: `random`, `numpy.random`, `PYTHONHASHSEED`, `pandas.DataFrame.sample(random_state=SEED)`, `surprise.model_selection.train_test_split(random_state=SEED)`, `KMeans(random_state=SEED, n_init=10)`, `PCA(random_state=SEED)`, `SVD(random_state=SEED)`, `NMF(random_state=SEED)`.

Para reproducir: `./venv/bin/jupyter nbconvert --to notebook --execute --inplace notebooks/0X_*.ipynb` en orden 01 → 02 → 03.

---

## 8. Comandos ejecutados durante esta iteración

```bash
# Validación JSON + normalización de IDs de celda
./venv/bin/python -c "import nbformat; nb = nbformat.read(...); nbformat.validate(nb)"

# Ejecución end-to-end de notebook 01 (completada sin errores)
./venv/bin/jupyter nbconvert --to notebook --execute --inplace \
    notebooks/01_Data_Sampling_and_Cleaning.ipynb \
    --ExecutePreprocessor.timeout=900
```

Resultado de la ejecución: todas las celdas de código corrieron sin excepción; los 4 parquets de `data/intermediate/` fueron regenerados con `SEED=42`.

---

## 9. Iteración 2 — Reorganización lineal Fase 1 → Fase 6

### 9.1 Problema detectado

La estructura de la iteración 1 violaba la linealidad del ciclo CRISP-DM:

| Orden de lectura previo | Fase cubierta |
|---|---|
| Notebook 01 §1 | Fase 1 (Business Understanding) |
| Notebook 01 §3-8 | Fase 3 (Data Preparation) |
| Notebook 02 (completo) | Fase 2 (Data Understanding / EDA) |
| Notebook 03 | Fases 4 + 5 |

El lector veía **Fase 1 → Fase 3 → Fase 2 → Fase 4**: había un salto hacia atrás. La guía explícita del usuario fue *"no quiero que la fase 1 y 3 estén en la misma porque luego salta a fase 2. Que el business understanding sea primero junto al EDA y luego se pase al data sampling."*

### 9.2 Solución aplicada — split + merge

Los dos primeros notebooks se reestructuraron sin tocar el notebook 03:

- **Nuevo `01_Business_Understanding_and_EDA.ipynb`** = celda de Business Understanding del notebook 01 antiguo **+** contenido completo del notebook 02 antiguo (EDA). Cabecera global reescrita a "Fase 1 y 2 — Business Understanding + Data Understanding (EDA)". Los encabezados de las 14 secciones del EDA se renumeraron de §0-14 a §2-16 (después de "1. Business Understanding" y "2. Reproducibilidad y chequeo de hardware").
- **Nuevo `02_Data_Sampling_and_Cleaning.ipynb`** = secciones de Data Preparation del notebook 01 antiguo (estrategia, tiers, muestreo, cold-start, validación, artefactos). Cabecera global reescrita a "Fase 3 — Data Preparation (CRISP-DM)".
- **Eliminados**: `01_Data_Sampling_and_Cleaning.ipynb` (antiguo) y `02_EDA_and_Visualization.ipynb` (antiguo).

### 9.3 Flujo nuevo — CRISP-DM 1→6 sin saltos

| # | Notebook | Fase(s) CRISP-DM | Celdas |
|---|---|---|---|
| 01 | `01_Business_Understanding_and_EDA.ipynb` | **1 + 2** | 45 |
| 02 | `02_Data_Sampling_and_Cleaning.ipynb` | **3** | 29 |
| 03 | `03_ML_Baseline_AutoML.ipynb` | **4 + 5** | (sin cambios) |
| 04 | `04_DeepLearning_Embeddings.ipynb` | **6** (DL parte 1) | placeholder |
| 05 | `05_Semantic_Search_RAG.ipynb` | **6** (RAG parte 2) | placeholder |

### 9.4 Estructura del nuevo notebook 01 — 45 celdas

| Sección | Fase | Contenido |
|---|---|---|
| 1. Business Understanding | **Fase 1** | Objetivo, criterios de éxito (4), restricciones (tamaño/sparsity/long tail/power users), plan. |
| 2. Reproducibilidad y hardware | Preámbulo | `SEED=42`, detección automática de raíz, `psutil`, info de CPU/RAM. |
| 3. Carga eficiente con Polars | Fase 2 | `scan_csv` lazy + esquemas + conteos (sin materializar los 25 M). |
| 4. Calidad de datos | Fase 2 | Nulos, duplicados, rangos. |
| 5. Univariado — rating | Fase 2 | Sesgo positivo, >80 % ≥ 3. |
| 6. Univariado — géneros | Fase 2 | Drama/Comedy dominan. |
| 7. Power users | Fase 2 | Ley de potencias + Pareto. |
| 8. Blockbusters vs long tail | Fase 2 | Justifica cold-start ≥ 20 votos. |
| 9. Popularidad vs calidad | Fase 2 | Corr ≈ +0.35. |
| 10. Rating por género | Fase 2 | Rating ponderado por género. |
| 11. Evolución temporal | Fase 2 | Sin concept drift. |
| 12. Análisis semántico de tags | Fase 2 | Top-20 + wordcloud. |
| 13. Tag Genome — relevancia | Fase 2 | Umbral 0.3. |
| 14. Heatmap de correlación | Fase 2 | Métricas agregadas por película. |
| 15. Sparsity | Fase 2 | 99.74 % → obliga modelos latentes. |
| 16. Conclusiones Data Understanding | Cierre | Handoff a notebook 02. |

### 9.5 Estructura del nuevo notebook 02 — 29 celdas

| Sección | Contenido |
|---|---|
| 1. Reproducibilidad, rutas y hardware | `SEED=42`, detección de raíz, `psutil`, **rutas a los 4 CSV crudos + asserts de existencia**. |
| 2. Estrategia y pasos | 2.1 Carga CSV → 2.2 Tiers `qcut(q=3)` → 2.3 Muestreo 5 % → 2.4 Filtrar ratings → 2.5 Cold-start ≥ 20 → 2.6 Parquet Snappy. |
| 3. Sincronización de metadatos | `movies.csv` filtrado + `genome-scores.csv` (Polars streaming) + copia `genome-tags.csv`. |
| 4. Validación de la muestra | L1 distance rating, géneros, tiers. |
| 5. Métricas finales y sparsity | Tabla muestra↔población. |
| 6. Artefactos generados | Smoke-test de los 4 parquets. |
| 7. Conclusiones | Handoff al notebook 03. |

### 9.6 Bugs detectados durante la ejecución del nuevo 02 — y fixes

Al ejecutar `nbconvert --execute` sobre el nuevo 02, aparecieron dos `NameError` porque algunas constantes vivían en secciones que se migraron al nuevo 01:

| Error | Causa | Fix aplicado |
|---|---|---|
| `NameError: name 'RATINGS_CSV' is not defined` | Las rutas `RATINGS_CSV`/`MOVIES_CSV`/`GENOME_SCORES_CSV`/`GENOME_TAGS_CSV` se definían en la sección "Data Understanding preliminar" del 01 antiguo — esa sección quedó en el nuevo 01. | Se añadieron las 4 constantes + asserts de existencia a la celda 2 (Reproducibilidad + rutas + hardware) del nuevo 02. |
| `NameError: name 'POP_STATS' is not defined` | `POP_STATS` y `POP_N_RATINGS` se calculaban con `polars lazy.stats().collect()` en la misma sección migrada. | Se añadió al final de la celda de carga del CSV un bloque que los computa directamente sobre `df_ratings` (`nunique`, `mean`, `std`) para preservar la validación de representatividad de la sección 4. |

Tras ambos fixes, el notebook 02 se ejecutó limpio en el tercer intento (128 817 bytes).

### 9.7 Comandos de la iteración 2

```bash
# Construcción del nuevo 01 (BU + EDA) y del nuevo 02 (Data Prep) vía nbformat
./venv/bin/python .claude_tmp_restructure.py   # script auxiliar (eliminado tras su uso)

# Eliminación de los notebooks antiguos
rm notebooks/01_Data_Sampling_and_Cleaning.ipynb  # (antiguo, Fase 1+3)
rm notebooks/02_EDA_and_Visualization.ipynb       # (antiguo, Fase 2)

# Ejecución end-to-end verificada
./venv/bin/jupyter nbconvert --to notebook --execute --inplace \
    notebooks/01_Business_Understanding_and_EDA.ipynb \
    --ExecutePreprocessor.timeout=1800

./venv/bin/jupyter nbconvert --to notebook --execute --inplace \
    notebooks/02_Data_Sampling_and_Cleaning.ipynb \
    --ExecutePreprocessor.timeout=1800
```

Resultado: ambos notebooks ejecutan sin errores. Los 4 parquets de `data/intermediate/` se regeneran deterministicamente con `SEED=42`. El notebook 03 sigue pudiendo consumir `ratings_sample_5pct.parquet` sin cambios.

### 9.8 Tabla de trazabilidad CRISP-DM actualizada

| Fase CRISP-DM | Notebook | Sección(es) | Estado |
|---|---|---|---|
| 1. Business Understanding | `01_Business_Understanding_and_EDA.ipynb` | §1 | ✅ |
| 2. Data Understanding | `01_Business_Understanding_and_EDA.ipynb` | §2-16 (14 secciones de EDA) | ✅ |
| 3. Data Preparation | `02_Data_Sampling_and_Cleaning.ipynb` | §1-7 | ✅ |
| 4. Modeling | `03_ML_Baseline_AutoML.ipynb` | §2-6 | ✅ |
| 5. Evaluation | `03_ML_Baseline_AutoML.ipynb` | §7-10 | ✅ |
| 6. Deployment | `04_DeepLearning_Embeddings.ipynb` + `05_Semantic_Search_RAG.ipynb` + `app/` | — | ⏳ Pendiente |

Ahora la lectura secuencial **01 → 02 → 03 → 04 → 05** corresponde a **Fase 1 → 2 → 3 → 4 → 5 → 6** sin saltos.
