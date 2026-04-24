# Análisis Técnico Detallado — Notebook 03: ML Baseline & AutoML

Este documento presenta un análisis profundo del notebook `03_ML_Baseline_AutoML.ipynb`, el cual representa el núcleo de las fases de **Modelado** y **Evaluación** (Fases 4 y 5 de la metodología CRISP-DM) dentro del proyecto **OmniRec-Movies**.

---

## 1. Objetivo del Notebook
El objetivo primordial es establecer un **punto de referencia (baseline)** y evaluar múltiples algoritmos de **Filtrado Colaborativo (CF)** para predecir ratings y generar rankings de recomendación Top-N. Se busca balancear la precisión técnica (RMSE) con la interpretabilidad de negocio y la eficiencia computacional.

---

## 2. Técnicas Aplicadas y Justificación

### A. Baseline: Popularidad Bayesiana Ponderada (Fórmula IMDb)
*   **Qué se aplica:** Una adaptación de la fórmula *Weighted Rating* de IMDb que combina el promedio de una película con la media global.
*   **Por qué:** Para mitigar el ruido de la *long tail* (películas con muy pocos votos pero promedios inflados) identificado en la Fase de EDA.
*   **Objetivo:** Proveer un sistema de recomendación no personalizado sólido que sirva como "piso" de rendimiento y como fallback para usuarios nuevos (Cold Start).

### B. KNN-Baseline (Item-based)
*   **Qué se aplica:** Vecinos más cercanos (K-Nearest Neighbors) utilizando la similitud `pearson_baseline` y un enfoque orientado a ítems.
*   **Por qué:** Es el estándar histórico del filtrado colaborativo. El enfoque en ítems es más estable que el de usuarios ya que las relaciones entre películas cambian menos frecuentemente.
*   **Objetivo:** Obtener recomendaciones interpretables basadas en la similitud directa entre productos.

### C. SVD (Singular Value Decomposition - Matrix Factorization)
*   **Qué se aplica:** Descomposición matricial de Simon Funk (famosa por el Netflix Prize).
*   **Por qué:** Es la técnica más robusta para manejar la alta dispersión de datos (**Sparsity > 99%**). Transforma la matriz rala en factores latentes densos.
*   **Objetivo:** Maximizar la precisión de la predicción y generar **embeddings** (vectores de 50 dimensiones) que capturen la esencia semántica de usuarios y películas.

### D. NMF (Non-negative Matrix Factorization)
*   **Qué se aplica:** Factorización matricial con restricciones de no negatividad.
*   **Por qué:** Los factores resultantes son aditivos, lo que los hace más interpretables como "temas" o "géneros latentes".
*   **Objetivo:** Comparar una alternativa más explicable frente al SVD puro.

### E. AutoML Benchmark
*   **Qué se aplica:** Búsqueda exhaustiva (`GridSearchCV` multi-algoritmo) con validación cruzada.
*   **Por qué:** Para validar si el ajuste automático de hiperparámetros (learning rate, regularización, factores) supera significativamente a los valores por defecto.
*   **Objetivo:** Establecer el techo de rendimiento del Machine Learning clásico antes de pasar a Deep Learning.

### F. Clustering No Supervisado (K-Means)
*   **Qué se aplica:** Algoritmo K-Means aplicado sobre los factores latentes (embeddings) generados por el modelo SVD.
*   **Por qué:** Para agrupar usuarios con gustos similares y películas con perfiles parecidos en un espacio semántico de baja dimensionalidad.
*   **Objetivo:** Segmentación de audiencia y descubrimiento de "nichos" en el catálogo (ej: cine de autor, blockbusters de acción).

---

## 3. Métricas de Evaluación y Rendimiento

El proyecto evalúa los modelos bajo dos dimensiones críticas:

1.  **Predicción de Rating (Error):**
    *   **RMSE (Root Mean Squared Error):** Penaliza errores grandes. Es la métrica principal.
    *   **MAE (Mean Absolute Error):** Error promedio absoluto.
2.  **Generación de Ranking (Recomendación):**
    *   **Precision@K:** ¿Qué tan relevantes son los primeros K resultados?
    *   **Recall@K:** ¿Qué porcentaje de lo que le gusta al usuario logramos capturar?
    *   **NDCG@K (Normalized Discounted Cumulative Gain):** Premia que las mejores recomendaciones aparezcan al principio del ranking.

### Resultados Clave (Performance):
*   **Ganador en Precisión:** El modelo **SVD** y **KNN-Baseline** presentan el menor RMSE (~0.80), lo cual es excelente para un dataset de este tamaño.
*   **Eficiencia:** SVD es drásticamente más rápido (3.1s) que KNN (27.2s), lo que lo posiciona como el mejor candidato para producción.
*   **Baseline:** El modelo de popularidad bayesiana alcanza un RMSE de ~0.95, demostrando que incluso sin personalización se puede obtener un sistema funcional.
*   **Umbral de Relevancia:** Se utiliza **4.0** como umbral de "película recomendada", ajustándose al sesgo positivo del dataset (donde la mayoría califica con 3 o más).

---

## 4. Estado Actual y Conclusiones del Proyecto

*   **Rendimiento:** El proyecto ya rinde a un nivel competitivo. Se ha logrado una reducción significativa del error desde el baseline inicial hacia los modelos latentes.
*   **Infraestructura de Datos:** Se ha validado que un muestreo estratificado al 5% preserva la representatividad estadística permitiendo iteraciones rápidas.
*   **Insights de Negocio:**
    *   Los clústeres son interpretables: se identifican claramente grupos de "Power Users" y nichos cinematográficos.
    *   El sistema es capaz de "entender" géneros sin que se le pasen explícitamente, solo a través del comportamiento de voto (vía SVD).

**Próximos Pasos:**
La base está lista para la **Fase 6 (Deployment)**, donde se explorarán arquitecturas de Deep Learning (NCF) y Búsqueda Semántica (RAG) para superar los límites del filtrado colaborativo tradicional.
