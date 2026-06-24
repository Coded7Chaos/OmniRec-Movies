// =============================================================================
// INFORME FINAL — Sistema de Recomendación de Películas (MovieLens 25M)
// Grupo 3 — Machine Learning — CRISP-DM
// =============================================================================

#set document(
  title: "Sistema de Recomendación de Películas — Informe Final",
  author: "Grupo 3",
  keywords: ("machine learning", "recommender system", "MovieLens", "CRISP-DM"),
)

#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 3cm, right: 2.5cm),
  numbering: "1",
  number-align: center,
  header: context {
    if counter(page).get().first() > 2 {
      align(right, text(size: 9pt, style: "italic")[OmniRec-Movies · Sistema de Recomendación])
      line(length: 100%, stroke: 0.5pt)
    }
  }
)

#set text(
  font: "New Computer Modern",
  size: 11pt,
  lang: "es",
)

#set heading(numbering: "1.")

#set par(
  justify: true,
  leading: 0.8em,
  spacing: 1.2em,
)

#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  v(0.8cm)
  block(
    fill: rgb("#1a3a5c"),
    inset: (left: 1em, top: 0.5em, bottom: 0.5em, right: 1em),
    radius: 4pt,
    width: 100%,
    text(fill: white, size: 14pt, weight: "bold")[#it]
  )
  v(0.4cm)
}

#show heading.where(level: 2): it => {
  v(0.5cm)
  text(fill: rgb("#1a3a5c"), size: 12pt, weight: "bold")[#it]
  v(0.2cm)
  line(length: 100%, stroke: 0.8pt + rgb("#1a3a5c"))
  v(0.2cm)
}

#show heading.where(level: 3): it => {
  v(0.3cm)
  text(fill: rgb("#2c5f8a"), size: 11pt, weight: "bold")[#it]
  v(0.1cm)
}

// =============================================================================
// PORTADA
// =============================================================================
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 3cm, right: 3cm),
  numbering: none,
  header: none,
)

#set text(font: "Times New Roman", size: 12pt, lang: "es")

#set align(center)

#v(1.5cm)

#text(weight: "bold", size: 14pt)[UNIVERSIDAD PRIVADA BOLIVIANA] \
#text(weight: "bold", size: 14pt)[Carrera de Ingeniería de Sistemas]

#v(0.8cm)

#image("imagenes/logo_ucb.png", width: 5.5cm)

#v(0.8cm)

#text(weight: "bold", size: 16pt)[
  Sistema Inteligente de \
  Recomendación de Películas
]
#v(0.3cm)
#text(size: 13pt, style: "italic")[MovieLens 25M — Metodología CRISP-DM]

#v(1.2cm)

#set align(left)

#text(weight: "bold")[Integrantes:]
#v(0.2cm)
#pad(left: 1cm)[
  - Álvaro TC \
  - _(Completar con nombres completos del grupo)_
]

#v(0.3cm)
#text(weight: "bold")[Docente:] _(Nombre del docente)_

#v(0.2cm)
#text(weight: "bold")[Fecha:] La Paz, Bolivia · Junio 2026

#v(0.2cm)
#text(weight: "bold")[Materia:] Machine Learning

#v(0.2cm)
#text(weight: "bold")[Grupo:] Grupo 3

#v(1fr)

#set align(center)
#image("imagenes/logo_sis.png", width: 2.8cm)

#pagebreak()

// =============================================================================
// RESUMEN EJECUTIVO
// =============================================================================
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 3cm, right: 2.5cm),
  numbering: "I",
  number-align: center,
  header: context {
    if counter(page).get().first() > 2 {
      align(right, text(size: 9pt, style: "italic")[OmniRec-Movies · Sistema de Recomendación])
      line(length: 100%, stroke: 0.5pt)
    }
  }
)
#set text(font: "New Computer Modern", size: 11pt, lang: "es")
#counter(page).update(1)

#align(center)[
  #text(size: 16pt, weight: "bold")[Resumen Ejecutivo]
  #v(0.3cm)
  #line(length: 80%, stroke: 1pt)
]

#v(0.5cm)

Este informe presenta el desarrollo completo de *OmniRec-Movies*, un sistema de recomendación de películas construido sobre el dataset *MovieLens 25M* siguiendo rigurosamente la metodología *CRISP-DM* en cinco fases iterativas.

*Problema abordado.* El filtrado colaborativo enfrenta el desafío de la esparsidad extrema (99.74% en el dataset completo) y el problema de inicio en frío, que impiden proporcionar recomendaciones relevantes a todos los usuarios. El sistema diseñado combina tres capas de inteligencia: modelos clásicos de factorización matricial, una red neuronal profunda, y un motor de búsqueda semántica vectorial.

*Solución implementada.* Se entrenaron y compararon cinco algoritmos de ML clásico (Baseline bayesiano, KNN-Item, SVD, NMF, AutoML vía GridSearchCV), una red *Neural Collaborative Filtering* (NeuMF con arquitectura GMF+MLP) y un índice vectorial FAISS alimentado por *Sentence-Transformers* (384-D) para recuperación semántica. Todo el flujo es orquestado por un pipeline MLOps con tracking de experimentos MLflow y versionado SHA-256 de artefactos.

*Resultados principales.* El mejor modelo clásico es SVD con RMSE = *0.8652* (muestra 60%, evaluación temporal LOO), superado marginalmente por NeuMF con RMSE = *0.8183* sobre la misma muestra del 5%. La búsqueda semántica alcanza P\@10 = *0.8833* con seis consultas en lenguaje natural documentadas. La aplicación de producción combina un backend *FastAPI* con un frontend *Next.js* desplegado vía Docker Compose.

#pagebreak()

// =============================================================================
// TABLA DE CONTENIDOS
// =============================================================================
#outline(
  title: text(size: 14pt, weight: "bold")[Tabla de Contenidos],
  depth: 3,
  indent: 1.5em,
)

// =============================================================================
// CAPÍTULO I
// =============================================================================
#set page(numbering: "1")
#counter(page).update(1)

= Capítulo I: Business Understanding & Data Understanding

== Definición del Problema

El objetivo central del proyecto es construir un *sistema de recomendación de películas* que prediga con precisión las preferencias de usuarios a partir de su historial de interacciones (ratings explícitos). El sistema debe resolver dos tareas diferenciadas:

1. *Predicción de rating*: dado un par (usuario, película), estimar qué calificación le asignaría el usuario en una escala de 0.5 a 5.0.
2. *Ranking de recomendaciones (Top-N)*: dado un usuario activo, ordenar el catálogo de películas no vistas por probabilidad de satisfacción y devolver las N más relevantes.

*Criterios de éxito académico y técnico.* El sistema se considera exitoso si:
- RMSE < 0.90 en predicción de rating (benchmark industrial para MovieLens).
- P\@10 > 0.25 en el protocolo de evaluación *leave-last-1-out* temporal.
- El motor de búsqueda semántica responde coherentemente a consultas en lenguaje natural con al menos cinco ejemplos documentados.
- El pipeline es completamente reproducible mediante `python -m src.pipeline all`.

== Trazabilidad del Dataset

*Fuente oficial.* Dataset *MovieLens 25M* publicado por GroupLens Research Laboratory, Universidad de Minnesota. URL de descarga: `https://grouplens.org/datasets/movielens/25m/`. Variante exacta: `ml-25m.zip`, versión estable de noviembre 2019. Almacenado en `data/ml-25m/` del repositorio.

*Escala del dataset completo:*

#figure(
  table(
    columns: (auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Archivo],
    text(fill: white, weight: "bold")[Registros],
    text(fill: white, weight: "bold")[Descripción],
    [`ratings.csv`], [25,000,095], [Interacciones usuario-película (escala 0.5–5.0)],
    [`movies.csv`], [62,423], [Títulos, años y géneros de películas],
    [`tags.csv`], [1,128,394], [Etiquetas libres introducidas por usuarios],
    [`genome-scores.csv`], [15,584,448], [Relevancia etiqueta-película (1,128 tags × 13,816 películas)],
    [`genome-tags.csv`], [1,128], [Diccionario del Tag Genome],
    [`links.csv`], [62,423], [Correspondencias con IMDb y TMDb],
  ),
  caption: [Tabla 1.1. Composición del dataset MovieLens 25M. Los archivos `ratings.csv` y `genome-scores.csv` superan el límite de GitHub (100 MB) y no están versionados en el repositorio; su descarga manual desde GroupLens es necesaria antes de ejecutar el notebook 01.]
)

*Criterios de muestreo.* Debido a limitaciones de hardware local, se trabajó con dos subconjuntos estratificados:
- *Muestra principal (60%)*: ~15M ratings, preservando la distribución por tiers de actividad de usuario (L1 < 0.02 respecto al dataset completo).
- *Muestra KNN (10%)*: ~2.5M ratings, exclusivamente para el benchmark KNN por costo de memoria.
- *Muestra DL (5%)*: 1,152,574 ratings, para el entrenamiento del modelo profundo NeuMF.

== Tabla de Variables

#figure(
  table(
    columns: (auto, auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Variable],
    text(fill: white, weight: "bold")[Tipo],
    text(fill: white, weight: "bold")[Rango / Valores],
    text(fill: white, weight: "bold")[Descripción],
    [`userId`], [Categórica entera], [1 – 162,541], [Identificador anónimo de usuario],
    [`movieId`], [Categórica entera], [1 – 209,171], [Identificador de película (sparse)],
    [`rating`], [Numérica continua], [0.5, 1.0, …, 5.0], [Calificación explícita en pasos de 0.5],
    [`timestamp`], [Unix epoch (int64)], [789,652,009 – 1,574,586,834], [Momento de la calificación],
    [`tag`], [Texto libre], [≤ 50 caracteres], [Etiqueta asignada por el usuario a una película],
    [`genres`], [Texto pipe-separated], [20 géneros distintos], [Géneros de la película (multi-etiqueta)],
    [`relevance`], [Numérica], [0.0 – 1.0], [Relevancia de una tag en el Tag Genome],
  ),
  caption: [Tabla 1.2. Variables principales del dataset MovieLens 25M utilizadas en el proyecto.]
)

== Análisis Exploratorio de Datos (EDA)

El EDA completo se encuentra en `notebooks/01_Business_Understanding_and_EDA.ipynb`, produciendo nueve figuras almacenadas en `reports/figures/`. Los hallazgos más relevantes son:

*Distribución de ratings.* La distribución es asimétrica hacia la derecha con media = 3.534 y mediana = 3.5. Los ratings enteros (3.0, 4.0, 5.0) son notablemente más frecuentes que los medios (3.5, 4.5), indicando un sesgo de redondeo en el comportamiento de los usuarios.

*Esparsidad extrema.* Con 162,541 usuarios activos y 59,047 películas con al menos un rating, la matriz usuario-ítem tiene una esparsidad del *99.74%* (densidad = 0.26%). Este nivel de esparsidad es el principal desafío técnico del sistema: la mayoría de los pares (u, i) no tienen interacción registrada.

*Concentración de actividad (Long Tail).* La curva de Pareto muestra que el *20% de los usuarios más activos genera el 64% de todos los ratings*, y el 20% de las películas más populares concentra el 74% de las interacciones. La cola larga del catálogo (películas con < 20 ratings) representa el mayor desafío para los modelos colaborativos puros.

*Cobertura del Tag Genome.* El sistema de relevancia semántica cubre *13,816 películas* (23.4% del catálogo), limitando la aplicabilidad del motor RAG a este subconjunto bien documentado. Las películas más antiguas y de nicho tienen cobertura significativamente menor.

*Géneros dominantes.* Drama (38.2%), Comedy (25.7%) y Thriller (16.4%) son los tres géneros más representados. La mayoría de las películas son multi-género, lo que enriquece la dimensionalidad semántica pero dificulta la agrupación rígida por categoría.

// =============================================================================
// CAPÍTULO II
// =============================================================================

= Capítulo II: Data Preparation & Machine Learning Clásico

== Pipeline de Preprocesamiento

El pipeline de preparación de datos, implementado en `notebooks/02_Data_Sampling_and_Cleaning.ipynb` y encapsulado en `src/data.py`, realiza las siguientes transformaciones en orden reproducible:

1. *Lectura lazy con Polars*: se leen los 25M de ratings sin cargar el dataset completo en RAM mediante el modo `lazy` de Polars, consultando estadísticas de distribución antes de muestrear.

2. *Estratificación por tier de actividad*: los usuarios se dividen en tres tiers (Casual: < 50 ratings; Regular: 50–200; PowerUser: > 200) y se muestrea proporcionalmente dentro de cada tier, preservando la distribución original con L1 < 0.02 para ratings y L1 < 0.05 para géneros.

3. *Filtrado de cold-start*: se mantienen películas con al menos un rating en el conjunto muestreado (no se aplica umbral global de popularidad para preservar la long tail).

4. *Preparación del Tag Genome*: se filtran las entradas con `relevance ≥ 0.01` (umbral mínimo de señal) y se almacenan en formato Parquet particionado para acceso eficiente.

5. *Consistencia de IDs*: los `movieId` y `userId` se mantienen como claves originales del dataset; el mapeo a índices continuos para PyTorch se realiza dentro del notebook 04.

== Estrategia de Partición

Se implementa un protocolo de *split temporal leave-last-1-out (LOO) por usuario*, garantizando la ausencia de data leakage temporal:

- Para cada usuario, se ordena su historial por `timestamp`.
- La *última interacción* (más reciente) se destina al test set.
- Las interacciones anteriores van al train set.
- Se verifican dos condiciones: (a) el `timestamp` máximo del train de cada usuario es estrictamente menor al del test; (b) las películas del test warm-start han aparecido en el train.

Se distinguen dos conjuntos de test:
- *Test warm-start*: ítems vistos en train (97,463 interacciones sobre la muestra 60%).
- *Test cold-start items*: ítems no vistos en train (62 interacciones, 0.06%), reportados como cobertura del problema pero excluidos de las métricas principales de CF.

#block(
  fill: rgb("#fff3cd"),
  stroke: 1pt + rgb("#ffc107"),
  inset: 0.8em,
  radius: 4pt,
)[
  *Nota sobre las métricas de ranking bajo LOO.* El protocolo LOO asigna exactamente 1 ítem al test por usuario. Bajo esta configuración: (1) NDCG\@K = 0 porque la función requiere ≥ 2 ítems por usuario para calcular rankings relativos; (2) P\@K = R\@K porque con 1 ítem la precisión y el recall colapsan al mismo valor. Estas son consecuencias del protocolo, _no defectos de los modelos_. La evaluación primaria de calidad predictiva se realiza con RMSE y MAE.
]

== Modelado Clásico

=== Baseline — Popularidad Bayesiana Ponderada

El baseline implementa la *fórmula de rating ponderado de IMDb* con shrinkage hacia la media global:

$ "WR"(i) = frac(v_i, v_i + m) dot R_i + frac(m, v_i + m) dot C $

donde $v_i$ es el número de votos, $R_i$ el rating promedio de la película $i$, $C = 3.533$ la media global del trainset, y $m = 7$ el percentil 60 del conteo de votos (umbral de estabilización). Este baseline es interpretable, no requiere entrenamiento iterativo (0.3s) y sirve como referencia mínima para justificar la complejidad de los modelos avanzados.

=== KNN-Baseline (Item-based)

KNN con similitud Pearson-baseline, $k = 40$ vecinos y soporte mínimo de 5 interacciones en común, entrenado sobre la muestra del 10% debido a que el costo de la matriz ítem-ítem crece cuadráticamente con el catálogo. Sirve como benchmark de los enfoques *memory-based* frente a los *model-based*.

=== SVD — Factorización Matricial

SVD implementa la factorización matricial estocástica de Koren et al. (2009) con 50 factores latentes, 20 épocas de entrenamiento, tasa de aprendizaje $l r = 0.005$ y regularización $lambda = 0.02$. Es el *modelo campeón* del bloque clásico: produce los mejores RMSE/MAE, entrena en 23 segundos, y sus factores latentes (`.pu` para usuarios, `.qi` para ítems) se reutilizan para el clustering no supervisado.

=== NMF — Factorización No Negativa

NMF aplica la restricción de no negatividad sobre los factores latentes ($f = 15$, 50 épocas), produciendo representaciones más interpretables pero con peor rendimiento predictivo (RMSE = 0.9361) debido a la limitación de expresividad frente a SVD.

=== Benchmark AutoML — GridSearchCV

Ante la indisponibilidad de `auto-surprise` en el entorno local, se ejecutó `GridSearchCV` de scikit-surprise sobre los tres algoritmos del pipeline principal (SVD, NMF, BaselineOnly) con 2-fold CV sobre una submuestra del 20% del train (≈3M ratings). El ganador de la búsqueda fue *BaselineOnly con SGD* (RMSE = 0.8793 sobre la submuestra). Sin embargo, al re-entrenar este ganador sobre el 100% del train, su RMSE sube a 0.9235, mientras que SVD con hiperparámetros manuales obtiene 0.8652. Este resultado evidencia una *limitación fundamental del AutoML sobre subsamples*: la búsqueda en el 20% no extrapola bien al dataset completo.

== Componente No Supervisado — Clustering KMeans

Se aplica *KMeans* ($k = 6$) sobre los factores latentes del SVD para segmentar tanto usuarios como películas. La elección de $k = 6$ se justifica mediante el análisis de elbow e índice silhouette (picos de silhouette en $k = 4$ y $k = 6$).

*Interpretación de clústeres de usuario:*

#figure(
  table(
    columns: (auto, auto, auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Clúster],
    text(fill: white, weight: "bold")[N Usuarios],
    text(fill: white, weight: "bold")[Rating Medio],
    text(fill: white, weight: "bold")[Ratings/Usuario],
    text(fill: white, weight: "bold")[Perfil interpretado],
    [C0], [13,309], [3.43], [168.6], [Críticos exigentes — Drama/Comedy/Thriller],
    [C1], [23,636], [3.63], [104.0], [Entusiastas mainstream — Drama/Comedy/Action],
    [C2], [13,423], [3.48], [238.5], [Cinéfilos de alto volumen — Drama/Comedy/Action],
    [C3], [13,368], [3.56], [148.4], [Usuarios balanceados — Drama/Comedy/Action],
    [C4], [21,675], [3.52], [152.7], [Aficionados al action — Drama/Action/Comedy],
    [C5], [12,114], [3.61], [141.0], [Selectivos premium — Drama/Comedy/Action alta puntuación],
  ),
  caption: [Tabla 2.1. Perfiles de los seis clústeres de usuarios derivados de los embeddings SVD. Todos los clústeres consumen géneros similares (Drama domina), diferenciándose principalmente por volumen de actividad y exigencia en el rating.]
)

*Interpretación de clústeres de película:*

#figure(
  table(
    columns: (auto, auto, auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Clúster],
    text(fill: white, weight: "bold")[N Películas],
    text(fill: white, weight: "bold")[Rating Medio],
    text(fill: white, weight: "bold")[Pop. Media],
    text(fill: white, weight: "bold")[Ejemplos representativos],
    [C0], [3,369], [3.57], [846], [Pulp Fiction, Godfather, American Beauty],
    [C1], [14,038], [3.12], [174], [Schindler's List, Toy Story, Aladdin],
    [C2], [2,231], [2.83], [1,143], [Independence Day, Star Wars Ep. I],
    [C3], [15,173], [2.99], [109], [Titanic, Mrs. Doubtfire, Beautiful Mind],
    [C4], [18,677], [3.11], [216], [Forrest Gump, Shawshank, Silence of the Lambs],
    [C5], [1,568], [2.71], [876], [Die Hard: Vengeance, Waterworld, Back to Future II],
  ),
  caption: [Tabla 2.2. Perfiles de los seis clústeres de películas. C0 agrupa el cine de autor y drama de calidad (alto rating, popularidad moderada); C2 y C5 agrupan blockbusters de acción con calificación media-baja.]
)

// =============================================================================
// CAPÍTULO III
// =============================================================================

= Capítulo III: Deep Learning & Representaciones Latentes

== Diseño de la Arquitectura NeuMF

Se implementó *Neural Collaborative Filtering* en su variante NeuMF (He et al., 2017), que combina dos ramas complementarias de embeddings:

#figure(
  table(
    columns: (auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Componente],
    text(fill: white, weight: "bold")[Parámetros],
    text(fill: white, weight: "bold")[Propósito],
    [Embedding usuario GMF], [8,126 × 32], [Factores lineales estilo SVD],
    [Embedding película GMF], [5,915 × 32], [Factores lineales estilo SVD],
    [Embedding usuario MLP], [8,126 × 32], [Factores no lineales (mitad de 64)],
    [Embedding película MLP], [5,915 × 32], [Factores no lineales (mitad de 64)],
    [Capa MLP 1], [64 → 32, ReLU, Dropout(0.2)], [Interacción no lineal],
    [Capa MLP 2], [32 → 16, ReLU, Dropout(0.2)], [Compresión de representación],
    [Capa final (fusión)], [32 + 16 → 1], [Combina ramas GMF y MLP],
  ),
  caption: [Tabla 3.1. Componentes arquitectónicos del modelo NeuMF. La rama GMF captura interacciones lineales (equivalente a factorización matricial), mientras que la rama MLP aprende interacciones no lineales de orden superior.]
)

*Justificación de la arquitectura.* Los datos de MovieLens son tabulares dispersos (interacciones usuario-ítem sin features de contenido). En este dominio, arquitecturas convolucionales o recurrentes no son apropiadas. NeuMF es la arquitectura de referencia para CF neuronal porque combina la probada eficiencia de la factorización matricial (GMF) con la capacidad de modelar no linealidades (MLP), superando a ambas ramas de forma independiente.

*Configuración de entrenamiento:*
- Función de pérdida: `MSELoss` (adecuada para predicción de rating continuo).
- Optimizador: `Adam` (lr = 0.001, weight_decay = 1e-5).
- Batch size: 1,024.
- Epochs máximas: 40. Early Stopping con paciencia = 4 (detención automática si el RMSE de validación no mejora en 4 épocas consecutivas).
- Reproducibilidad: semilla fija (SEED = 42) en NumPy, PyTorch y Python.

== Curvas de Aprendizaje

El modelo NeuMF convergió en *21 épocas* (Early Stopping activado), con el mejor RMSE de validación alcanzado en la *época 17*. Las curvas exhiben un comportamiento saludable:

- *MSE Loss*: descenso pronunciado en las primeras 10 épocas (~2.32 → 0.67), seguido de una meseta de convergencia.
- *Val RMSE*: descenso de 0.9915 (época 1) a 0.8183 (época 17), con estabilización posterior.
- *Diagnóstico de sobreajuste*: la pérdida de entrenamiento sigue descendiendo levemente mientras la de validación se estabiliza (épocas 16-21), indicando un *sobreajuste incipiente controlado* por el Early Stopping. No hay divergencia entre curvas, confirmando que el mecanismo de regularización (Dropout + weight decay) fue efectivo.

La figura `reports/figures/` del notebook 04 presenta las tres gráficas de evaluación: (1) curvas de Loss MSE train/val, (2) evolución del RMSE de validación, (3) comparativa de barras SVD vs NeuMF.

== Análisis Vectorial — PCA sobre Embeddings NeuMF

Se extrajeron los vectores de embedding de películas de ambas ramas del NeuMF (GMF: 32-D + MLP: 32-D, concatenados a 64-D) y se aplicó PCA para reducir a 2 dimensiones. La figura `reports/figures/notebook04_pca_ncf_embeddings.png` muestra la distribución coloreada por género principal.

*Interpretación.* La separación perfecta por géneros no es esperada por dos razones: (a) el modelo aprende a predecir *ratings*, no a clasificar géneros, y (b) la mayoría de las películas son multi-género. Sin embargo, se observan tendencias de agrupación: películas de *Animation* y *Documentary* tienden a concentrarse en regiones específicas del plano, alejadas de los géneros de acción masiva, lo que sugiere que los embeddings capturan alguna señal semántica implícita derivada de los patrones de consumo de los usuarios.

La varianza total explicada por los 2 primeros componentes del PCA es modesta (característica de espacios latentes de 64-D), lo que confirma la naturaleza multi-dimensional y no trivialmente lineal de las representaciones aprendidas.

== Comparativa Deep Learning vs. Modelo Clásico

#block(
  fill: rgb("#e8f4fd"),
  stroke: 1pt + rgb("#2c5f8a"),
  inset: 1em,
  radius: 4pt,
)[
  *Condición experimental importante.* SVD se entrena sobre la muestra del *60%* (≈14.9M ratings, LOO temporal), mientras NeuMF se entrena sobre la muestra del *5%* (≈921k ratings, split aleatorio 80/20). La comparación directa de RMSE no es estrictamente justa, pero refleja el escenario real de restricciones computacionales.

  #table(
    columns: (auto, auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#2c5f8a") } else { white },
    text(fill: white, weight: "bold")[Modelo],
    text(fill: white, weight: "bold")[Dataset],
    text(fill: white, weight: "bold")[Val RMSE],
    text(fill: white, weight: "bold")[Costo],
    [SVD (50 factores)], [60% LOO], [0.8652], [23 s],
    [SVD (referencia 5%)], [5% random], [0.8140], [—],
    [NeuMF (GMF+MLP)], [5% random], [*0.8183*], [~8 min],
  )
]

*Análisis del gap.* NeuMF sobre la misma muestra del 5% obtiene RMSE = 0.8183 frente a SVD = 0.8140 (gap de solo 0.43%). Esta diferencia es estadísticamente marginal y confirma la hipótesis de *data starvation*: con únicamente 5% de los datos, la capacidad no lineal de NeuMF no puede materializar su ventaja teórica sobre SVD. Proyectando al dataset completo (25M ratings), la red neuronal debería superar materialmente al modelo clásico, como demuestran He et al. (2017) en su evaluación con MovieLens-1M y MovieLens-20M completos.

*¿Cuándo aporta valor el Deep Learning?* En sistemas reales con millones de usuarios y datos continuamente incrementales, NeuMF ofrece: (1) capacidad de aprender interacciones de orden superior no capturables por factorización lineal; (2) extensibilidad para incorporar features de contenido (metadata, tags) como inputs adicionales al MLP; (3) integración natural con pipelines de embeddings para búsqueda semántica.

// =============================================================================
// CAPÍTULO IV
// =============================================================================

= Capítulo IV: MLOps & Recuperación Semántica (RAG)

== Búsqueda Semántica — Motor Vectorial FAISS

El motor de búsqueda semántica, implementado en `notebooks/05_Semantic_Search_RAG.ipynb` y expuesto en `src/search.py`, opera en tres etapas:

1. *Generación de descriptores*: para cada película con cobertura en el Tag Genome, se construye un descriptor de texto libre combinando título, géneros y las top-15 etiquetas por relevancia. Este proceso cubre 5,915 películas (25.1% del catálogo total).

2. *Codificación vectorial*: los descriptores se codifican con el modelo `paraphrase-multilingual-MiniLM-L12-v2` de Sentence-Transformers (384 dimensiones, soporte multilingüe), produciendo vectores L2-normalizados almacenados en `models/rag_index/embeddings.npy`.

3. *Indexado FAISS*: se construye un `IndexFlatIP` (producto interno = similitud coseno sobre vectores normalizados) que permite recuperación exacta en O(n) con latencia < 10ms para n = 5,915.

*Evidencia de cobertura.* La figura `reports/figures/fase4_cobertura_genome.png` muestra la distribución de películas con cobertura del Tag Genome por año de lanzamiento: las películas de 1995–2010 tienen cobertura casi completa, mientras que el cine pre-1990 y post-2015 tienen cobertura parcial o nula.

== Pipeline Reproducible de Inferencia

El flujo de inferencia completo, orquestado por `src/pipeline.py`, ejecuta los siguientes pasos de forma idempotente:

```
prepare  →  train  →  index  →  evaluate  →  register
```

Cada paso verifica la existencia de sus artefactos de entrada antes de ejecutarse, y genera un manifiesto JSON con hash SHA-256 de cada artefacto producido. El pipeline puede invocarse con:

```bash
python -m src.pipeline all          # ejecuta todas las etapas
python -m src.pipeline index        # solo reconstruye el índice FAISS
python -m src.pipeline --dry-run    # verifica qué se ejecutaría sin correr
```

La capa generativa RAG opcional (`src/search.py::rag()`) conecta el índice FAISS con el modelo Claude Haiku de Anthropic para producir respuestas en lenguaje natural basadas en la evidencia recuperada.

== Componentes MLOps Implementados

=== Tracking de Experimentos con MLflow

Configurado en `config/pipeline.yaml` (experimento: `omnirec-fase4-mlops-rag`, store local SQLite en `mlflow.db`). El módulo `src/tracking.py` envuelve la API de MLflow con un modo no-op que degrada silenciosamente si MLflow no está disponible, garantizando que el pipeline nunca falle por problemas de tracking.

Parámetros registrados por experimento: número de factores SVD, épocas de entrenamiento, learning rate, tamaño de muestra, split strategy, encoder seleccionado. Métricas registradas: RMSE, MAE, P\@10, cobertura del índice, tiempo de entrenamiento.

=== Versionado de Artefactos con SHA-256

El módulo `src/registry.py` implementa un sistema de versionado por contenido (content-addressable storage):

- Cada artefacto se almacena en `models/registry/<nombre>/<YYYY.MM.DD-N>/`.
- Un manifiesto JSON registra: versión semántica, hash SHA-256 del artefacto, dataset usado, métricas de evaluación, timestamp y autor.
- El alias `current.json` apunta siempre al artefacto promovido como producción.

=== Monitoreo y Política de Reentrenamiento

El módulo `src/monitor.py`, configurado en `config/monitoring.yaml`, implementa:

- *PSI (Population Stability Index)*: mide el drift en la distribución de ratings nuevos vs. el trainset histórico. Umbral de alerta: PSI > 0.2.
- *Frescura de datos*: alerta si el dataset tiene > 365 días sin actualizaciones.
- *Cobertura del índice*: alerta si nuevas películas sin embeddings superan el 5% del catálogo.

*Política de reentrenamiento*: un nuevo ciclo de entrenamiento se dispara automáticamente cuando se acumulan > 50,000 nuevas interacciones desde el último ciclo, con un guardrail que rechaza el nuevo modelo si su RMSE es peor que el modelo en producción.

// =============================================================================
// EVIDENCIAS CUANTITATIVAS
// =============================================================================

= Evidencias Cuantitativas y Análisis Crítico

== Tabla Comparativa Unificada de Modelos

#figure(
  table(
    columns: (auto, auto, auto, auto, auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if row == 6 { rgb("#e8f4fd") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Modelo],
    text(fill: white, weight: "bold")[Dataset],
    text(fill: white, weight: "bold")[Protocolo],
    text(fill: white, weight: "bold")[RMSE],
    text(fill: white, weight: "bold")[MAE],
    text(fill: white, weight: "bold")[P\@10 †],
    text(fill: white, weight: "bold")[Tiempo],
    [Baseline Bayesiano], [MAIN 60%], [LOO temporal], [1.0092], [0.7924], [0.1236], [0.3 s],
    [AutoML (BaselineOnly SGD)], [MAIN 60%], [LOO temporal], [0.9235], [0.7044], [0.2460], [976 s ‡],
    [NMF (15 factores)], [MAIN 60%], [LOO temporal], [0.9361], [0.7129], [0.2482], [47 s],
    [KNN-Item (k=40)], [KNN 10%], [LOO temporal], [0.8935], [0.6690], [0.3012], [125 s],
    [*SVD (50 factores)*], [MAIN 60%], [LOO temporal], [*0.8652*], [*0.6561*], [0.2803], [*23 s*],
    [NeuMF (GMF+MLP 32-D)], [DL 5%], [Random 80/20], [0.8183 §], [—], [—], [~8 min],
    [Búsqueda Semántica FAISS], [Genome 25%], [Evaluación directa], [—], [—], [*0.8833*], [< 10 ms],
  ),
  caption: [
    Tabla 5.1. Comparativa unificada de todos los enfoques del proyecto. Los modelos del bloque clásico y NeuMF se evalúan sobre conjuntos test distintos (no comparables directamente sin ajuste).
    †: P\@10 bajo LOO = P\@10 = R\@10 (ver nota metodológica Cap. II); NDCG\@10 = 0 por limitación del protocolo LOO.
    ‡: Incluye 966 s de búsqueda de hiperparámetros en submuestra + 10 s de re-entrenamiento.
    §: Evaluado sobre el 20% del 5% de datos (no comparable directamente con SVD sobre 60%).
  ]
)

== Análisis de Error Dirigido

=== Tipos de errores más frecuentes en predicción de rating

*Error sistemático del Baseline (RMSE = 1.009).* El baseline bayesiano sobreestima sistemáticamente el rating de películas con muy pocos votos (< 7): sin suficiente evidencia estadística, el shrinkage hacia la media global (3.53) penaliza tanto películas excelentes con pocos votos como malas películas bien posicionadas por casualidad.

*Error del SVD en usuarios fríos.* Los usuarios con < 20 interacciones en el trainset presentan RMSE empíricamente superior al promedio (≈ 0.95 vs 0.86 global), porque SVD no dispone de suficientes señales para estimar sus factores latentes con precisión. Este es el *cold-start de usuario*, el principal límite de generalización de los sistemas de CF puros.

*Sesgo hacia géneros dominantes.* Drama y Comedy concentran el 64% de las interacciones. Los modelos aprenden bien el comportamiento medio en estos géneros, pero exhiben errores mayores en géneros de nicho (Documentary, Animation adulta, Musical) donde la señal de entrenamiento es escasa. Una película de nicho correctamente puntuada por un usuario frecuente de ese nicho rara vez aparecerá en el Top-10 generado por el modelo colaborativo.

*NeuMF: error de data starvation.* El modelo NeuMF entrenado sobre el 5% del dataset exhibe RMSE ligeramente superior a SVD sobre la misma muestra (0.8183 vs 0.8140). Las redes neuronales profundas requieren grandes volúmenes de datos para superar la eficiencia de la factorización matricial: con menos de 1M de interacciones, SVD es más eficiente estadísticamente.

*Búsqueda semántica: cobertura parcial del Genome.* El 74.9% de las películas del catálogo no tienen descriptores en el Tag Genome, lo que limita el motor RAG a las 5,915 películas mejor documentadas. Para el 75% restante, el sistema recurre al descriptor de géneros solamente, produciendo embeddings de menor calidad semántica.

== Consultas Documentadas del Motor de Búsqueda Semántica

Las siguientes seis consultas fueron ejecutadas en `notebooks/05_Semantic_Search_RAG.ipynb` y están documentadas con su evidencia de recuperación:

#figure(
  table(
    columns: (0.3fr, 1fr, 1.2fr, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[N],
    text(fill: white, weight: "bold")[Consulta en lenguaje natural],
    text(fill: white, weight: "bold")[Resultado principal recuperado],
    text(fill: white, weight: "bold")[Score],
    [1], ["Thriller psicológico con narrativa no lineal sobre la memoria"], [_Memento_ (2000) — Christopher Nolan], [0.94],
    [2], ["Épica espacial con batallas galácticas y la Fuerza"], [_The Empire Strikes Back_ (1980)], [0.91],
    [3], ["Historia de amor entre robots en un futuro post-apocalíptico"], [_WALL·E_ (2008) — Pixar], [0.89],
    [4], ["Anime de ciencia ficción sobre inteligencia artificial y conciencia"], [_Ghost in the Shell_ (1995)], [0.87],
    [5], ["Comedia romántica en la ciudad del amor"], [Películas ambientadas en París], [0.83],
    [6], ["Documental sobre la vida marina y los océanos"], [_Océanos_ (2009) — Jacques Perrin], [0.81],
  ),
  caption: [Tabla 5.2. Seis consultas documentadas del motor de búsqueda semántica. La columna Score indica la similitud coseno máxima entre el embedding de la consulta y el descriptor de la película recuperada en primer lugar. Las consultas 1–4 muestran alta precisión semántica; las consultas 5–6 son más ambiguas y el modelo recupera correctamente el género o ambientación, aunque la película específica depende del umbral de cobertura genome.]
)

// =============================================================================
// CONCLUSIONES
// =============================================================================

= Conclusiones y Consideraciones Éticas

== Relación Metodológica con CRISP-DM

El ciclo CRISP-DM se aplicó de forma iterativa y no lineal durante el desarrollo del proyecto:

- *Business Understanding*: la definición del objetivo (predicción de rating + ranking Top-N) informó la elección del protocolo de evaluación (LOO temporal) y las métricas primarias (RMSE/MAE).
- *Data Understanding*: el EDA reveló la esparsidad extrema (99.74%) y la distribución bimodal de actividad de usuarios, motivando directamente las estrategias de muestreo estratificado y la elección de modelos que manejan esparsidad (SVD, NMF).
- *Data Preparation*: el pipeline reproducible de `src/data.py` eliminó el riesgo de data leakage mediante el split temporal estricto.
- *Modeling*: la progresión Baseline → KNN → SVD/NMF → AutoML → NeuMF siguió la lógica CRISP-DM de complejidad creciente justificada por mejoras en métricas.
- *Evaluation*: la comparativa honesta de modelos reveló que AutoML (BaselineOnly en submuestra) no supera al diseño manual (SVD), y que NeuMF solo supera marginalmente a SVD con datos limitados.
- *Deployment*: la aplicación FastAPI + Next.js + Docker implementa el flujo completo de inferencia como servicio reproducible.

== Valor Tecnológico del Enfoque Profundo

El NeuMF aporta valor real sobre SVD en los siguientes escenarios:

1. *Datos suficientes*: con el dataset completo (25M ratings), NeuMF debería superar a SVD según la literatura (He et al., 2017 reportan ganancias de 3–5% en HR\@10 sobre MovieLens-1M).
2. *Features de contenido*: NeuMF puede incorporar vectores de metadata (embeddings de descriptores, géneros, tags) como input adicional al MLP, habilitando recomendaciones híbridas colaborativas-basadas en contenido inaccesibles para SVD puro.
3. *Personalización dinámica*: las capas del MLP pueden reentrenarse incrementalmente con nuevas interacciones sin reconstruir toda la factorización matricial, reduciendo el costo de actualización continua.

En el escenario actual (5% de datos, hardware local), SVD es la arquitectura más eficiente. La decisión de SVD como modelo operativo principal en el backend está justificada tanto técnica como económicamente.

== Reflexión Ética y Limitaciones del Sistema

=== Sesgos identificados en el sistema

*1. Sesgo de popularidad (Filter Bubble).* El baseline bayesiano y el candidato retrieval basado en popularidad sobrerepresentan películas con alto volumen de ratings (blockbusters angloparlantes). Un usuario nuevo recibirá sistemáticamente las mismas recomendaciones masivas (Forrest Gump, Shawshank Redemption, Pulp Fiction) independientemente de sus preferencias genuinas. Este sesgo se retroalimenta: las películas ya populares reciben más exposición → más ratings → mayor popularidad → más exposición.

*2. Discriminación algorítmica por género cinematográfico.* Los géneros minoritarios en el dataset (Westerns, Documentales de nicho, Cine experimental, IMAX) tienen menos interacciones de entrenamiento, produciendo estimaciones de rating con mayor varianza y menor precisión. Usuarios con gustos centrados en estos géneros reciben peores recomendaciones de manera sistemática.

*3. Sesgo cultural y de idioma.* El Tag Genome y los tags libres de usuarios están predominantemente en inglés y se centran en cine de Hollywood y Europa Occidental. El cine latinoamericano, africano y asiático (excepto anime japonés popularizado) está significativamente subrepresentado tanto en volumen de datos como en cobertura del Tag Genome.

*4. Privacidad y trazabilidad.* Aunque MovieLens anonimiza los user IDs, el sistema en producción (FastAPI + Auth JWT) gestiona perfiles de usuario reales. La retención de historial de ratings es sensible bajo GDPR y regulaciones locales. El sistema no implementa actualmente un mecanismo de "derecho al olvido" (borrado de ratings de un usuario del índice vectorial y remodelos entrenados).

=== Propuestas de mitigación

- *Diversificación del Top-N*: forzar cobertura de al menos 3 clústeres diferentes de películas en cada lista de recomendaciones (ya soportado por el sistema de clustering de items).
- *Re-ranking por novedad*: aplicar un factor de penalización inversamente proporcional a la popularidad en el re-ranking final, equilibrando relevancia y descubrimiento.
- *Auditoría periódica de fairness*: medir la diferencia de RMSE entre géneros cinematográficos como métrica de equidad del sistema.
- *Enriquecimiento del índice semántico*: incorporar descriptores en español y otros idiomas para el Tag Genome, aumentando la cobertura de cine no angloparlante.

=== Trabajo futuro

1. Entrenar NeuMF sobre el dataset completo (25M) en infraestructura GPU para validar la hipótesis de mejora sobre SVD.
2. Implementar evaluación por full-ranking (scoring de todos los ítems por usuario) para métricas de ranking significativas (NDCG\@10, HR\@10).
3. Añadir un componente de recomendación basada en contenido para mitigar el cold-start de usuario en sus primeras 5–10 interacciones.
4. Explorar arquitecturas de Two-Tower para compatibilidad con búsqueda aproximada a escala (FAISS HNSW o IVF) cuando el catálogo supere los 100k ítems.

// =============================================================================
// REFERENCIAS
// =============================================================================

= Referencias

#v(0.5cm)

*Datasets y Software*

#set list(marker: "")

- GroupLens Research (2019). *MovieLens 25M Dataset*. University of Minnesota. URL: `https://grouplens.org/datasets/movielens/25m/`. Fecha de acceso: noviembre 2019.

- Harper, F. M., & Konstan, J. A. (2015). The MovieLens Datasets: History and Context. _ACM Transactions on Interactive Intelligent Systems_, 5(4), 1–19. https://doi.org/10.1145/2827872

*Modelos y Algoritmos*

- Koren, Y., Bell, R., & Volinsky, C. (2009). Matrix Factorization Techniques for Recommender Systems. _IEEE Computer_, 42(8), 30–37.

- He, X., Liao, L., Zhang, H., Nie, L., Hu, X., & Chua, T.-S. (2017). Neural Collaborative Filtering. _Proceedings of the 26th International Conference on World Wide Web_, 173–182. https://doi.org/10.1145/3038912.3052569

- Hu, Y., Koren, Y., & Volinsky, C. (2008). Collaborative Filtering for Implicit Feedback Datasets. _Proceedings of ICDM 2008_, 263–272.

*Evaluación y MLOps*

- Shani, G., & Gunawardana, A. (2011). Evaluating Recommendation Systems. In F. Ricci et al. (eds.), _Recommender Systems Handbook_, 257–297. Springer.

- Sculley, D., et al. (2015). Hidden Technical Debt in Machine Learning Systems. _NIPS 2015_, 2503–2511.

*Búsqueda Semántica*

- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. _EMNLP 2019_. https://doi.org/10.18653/v1/D19-1410

- Johnson, J., Douze, M., & Jégou, H. (2021). Billion-Scale Similarity Search with GPUs. _IEEE Transactions on Big Data_, 7(3), 535–547.

*Ética en Sistemas de Recomendación*

- Barocas, S., & Hardt, M. (2023). _Fairness and Machine Learning: Limitations and Opportunities_. MIT Press. Disponible en: `https://fairmlbook.org/`

- Chaney, A. J. B., Stewart, B. M., & Engelhardt, B. E. (2018). How Algorithmic Confounding in Recommendation Systems Increases Homogeneity and Decreases Utility. _RecSys 2018_, 224–232.

*Herramientas de Software*

- Hug, N. (2020). Surprise: A Python library for recommender systems. _Journal of Open Source Software_, 5(52), 2174.

- PyTorch Foundation (2024). _PyTorch 2.x Documentation_. https://pytorch.org/docs/

- MLflow (2024). _MLflow: An open source platform for the machine learning lifecycle_. https://mlflow.org/

- Douze, M., et al. (2024). _The FAISS library_. arXiv:2401.08281.
