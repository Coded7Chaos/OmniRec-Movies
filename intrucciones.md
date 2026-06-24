# Guía de Ejecución y Entregables - Grupo 3: Sistema de Recomendación de Películas
**Asignatura:** Machine Learning  
**Metodología Obligatoria:** CRISP-DM  
**Dominio Temático:** Recomendación de Películas  
**Dataset Principal:** MovieLens 25M ([Enlace Oficial de Descarga](https://grouplens.org/datasets/movielens/25m/))  

---

## 1. Estructura del Repositorio y Archivos ("¿En qué archivos entregar?")
Para garantizar la reproducibilidad y cumplir con el componente obligatorio de **MLOps**, el proyecto debe organizarse bajo la siguiente estructura de carpetas y archivos. No se deben dejar scripts sueltos ni procesos manuales sin registrar.

    /
    ├── data/
    │   ├── raw/                  # Dataset original MovieLens 25M (ratings.csv, movies.csv, tags.csv)
    │   ├── processed/            # Subconjuntos filtrados y datos preparados para entrenamiento
    │   └── metadata_notes.txt    # Registro de fecha de acceso, variante exacta y criterios de muestreo
    ├── notebooks/
    │   ├── 01_eda_data_understanding.ipynb   # Análisis exploratorio, distribuciones y detección de outliers
    │   ├── 02_preprocessing_preparation.ipynb # Limpieza, tratamiento de usuarios/ítems poco frecuentes y partición
    │   ├── 03_machine_learning_models.ipynb  # Modelos clásicos, clustering y benchmark de AutoML
    │   └── 04_deep_learning_embeddings.ipynb # Redes ligeras, extracción y análisis visual de embeddings
    ├── src/
    │   ├── __init__.py
    │   ├── preprocessing.py      # Pipelines de transformación y tratamiento de datos
    │   ├── train_ml.py           # Scripts de entrenamiento de modelos clásicos y AutoML
    │   ├── train_dl.py           # Scripts de entrenamiento del modelo profundo y embeddings
    │   └── inference_pipeline.py # Flujo reproducible de inferencia (generación de recomendaciones)
    ├── models/
    │   ├── classical/            # Artefactos y pesos de los modelos clásicos guardados
    │   ├── deep_learning/        # Pesos de la red neuronal / matrices de embeddings usuario-ítem
    │   └── vector_index/         # Índice vectorial generado para la búsqueda semántica de metadatos
    ├── reports/
    │   ├── propuesta_fase1.pdf   # Documento formal de la propuesta (4-6 páginas)
    │   ├── informe_parcial_ml.pdf# Informe técnico de la Fase 2
    │   └── informe_final.pdf     # Informe final integrado de todo el proyecto
    ├── app/
    │   └── main.py               # Código de la demo mínima funcional (interfaz o API de recomendación)
    ├── config/
    │   └── tracking_config.json  # Parámetros de experimentos y configuraciones de MLOps
    ├── README.md                 # Instrucciones claras de ejecución paso a paso del flujo completo
    └── REQUIREMENTS.txt          # Control estricto de dependencias y librerías utilizadas

---

## 2. Contenido Técnico Obligatorio por Fase (Métrica y Enfoque)

### Fase 1: Propuesta del Proyecto
* **Contenido:** Definición clara del problema de recomendación, justificación del uso del dataset MovieLens 25M, identificación de riesgos de datos (ej. sparsity, usuarios con muy pocas calificaciones) y cronograma.
* **Especificación:** Planificar explícitamente cómo se abordará el flujo de **AutoML** en la fase clásica y cómo se estructurará el tracking de **MLOps**.

### Fase 2: Mini Proyecto de Machine Learning (Modelado Clásico)
* **Data Understanding y EDA:** Gráficos y análisis interpretados sobre la distribución de ratings, volumen de tags por película, cobertura de metadatos y tratamiento de usuarios/películas con baja interacción (fríos).
* **Data Preparation:** Documentar la estrategia de partición limpia en entrenamiento, validación y prueba. Construir un pipeline reproducible para evitar *data leakage*.
* **Modelado Clásico (Mínimo 3 modelos + 1 Baseline):**
    1.  *Baseline explícito:* Recomendador simple basado en popularidad o similitud cruda (filtros colaborativos básicos).
    2.  *Modelos avanzados:* Al menos tres enfoques comparables (ej. Factorización de Matrices SVD, KNN Baseline, Co-clustering, o regresores para predicción de rating).
    3.  *Benchmark Obligatorio de AutoML:* Ejecutar un flujo automatizado sobre el mismo protocolo de evaluación para contrastar rendimiento, métricas y coste de cómputo frente al diseño manual.
* **Componente No Supervisado:** Aplicar clustering (ej. K-Means, Clustering Jerárquico) sobre los perfiles de los usuarios o las características de las películas e interpretar los grupos identificados.
* **Evaluación:** Justificar métricas adecuadas (RMSE, MAE para predicción de ratings; Precision@K, Recall@K, MAP o NDCG para ranking/recomendación). Incluir análisis detallado de errores.

### Fase 3: Mini Proyecto de Deep Learning
* **Arquitectura:** Diseñar e implementar capas de **embeddings personalizados para usuarios e ítems** o una red neuronal ligera enfocada en recomendación (ej. Neural Collaborative Filtering - NCF).
* **Comparación Obligatoria:** Contrastar el rendimiento cuantitativo del enfoque profundo frente al mejor baseline clásico de la Fase 2.
* **Análisis Visual:** Extraer las representaciones latentes (embeddings) y utilizar técnicas de reducción de dimensionalidad (PCA o UMAP) para inspeccionar y verificar visualmente si las películas similares o géneros afines se agrupan correctamente en el espacio vectorial.
* **Curvas de Entrenamiento:** Presentar gráficas de pérdida y métricas en entrenamiento vs. validación, diagnosticando problemas de *overfitting* o *underfitting*.

### Fase 4: Mini Proyecto de MLOps + RAG / Recuperación Semántica
* **Búsqueda Semántica:** Implementar un motor de búsqueda por similitud vectorial utilizando los metadatos disponibles (títulos, tags aportados por usuarios o descriptores de géneros). El sistema debe responder eficientemente a consultas de texto libre.
* **Flujo MLOps Mínimo Viable (Obligatorio):**
    * *Tracking de Experimentos:* Registro sistemático de hiperparámetros, métricas y versiones de código.
    * *Versionado de Artefactos:* Control de versiones de los datasets procesados, matrices de embeddings y archivos del índice vectorial.
    * *Pipeline de Inferencia:* Flujo automatizado que reciba una consulta o ID de usuario y devuelva las recomendaciones ordenadas.
* **Monitoreo y Actualización:** Diseñar una propuesta formal para monitorear la degradación del recomendador y los criterios de reentrenamiento cuando ingresen nuevas interacciones de usuarios o nuevas películas.

---

## 3. ¿Qué presentar en cada una de las entregas?

La evaluación se divide de manera incremental. A continuación se detalla el formato y los entregables específicos de cada fase:

| Fase | Entregable Escrito / Código | Defensa / Presentación | Elementos Clave a Mostrar |
| :--- | :--- | :--- | :--- |
| **Fase 1: Propuesta** | Documento PDF (4 a 6 páginas, sin contar portada/anexos). | Exposición oral de 8 a 12 minutos con soporte visual. | Planteamiento del problema, trazabilidad del dataset, métricas de éxito y mitigación de riesgos de datos. |
| **Fase 2: ML Clásico** | Notebooks organizados (`/notebooks`) + Scripts de origen (`/src`) + Informe técnico parcial con conclusiones y análisis de error. | No aplica (Evaluación de repositorio e informe). | EDA profundo, justificación de la partición, comparativa de los 3 modelos vs Baseline y la fila explícita del benchmark de **AutoML**. Interpretación del clustering. |
| **Fase 3: Deep Learning** | Código integrado en el repositorio + Pesos guardados en `/models/deep_learning`. | No aplica (Evaluación de código y gráficas). | Implementación de embeddings usuario-ítem, curvas de aprendizaje limpias, mapas de similitud visualizados y justificación analítica de cuándo aporta valor el modelo profundo. |
| **Fase 4: MLOps + RAG** | Estructura reproducible completa, `README.md`, `REQUIREMENTS.txt` + Código de la Demo en `/app`. | Demostración en vivo del sistema o recorrido reproducible. | Evidencia del tracking de experimentos, pipeline funcional de inferencia, al menos **5 ejemplos documentados** de consultas en la búsqueda semántica y propuesta de monitoreo. |
| **Fase 5: Integración** | Informe final integrado (Portada institucional, Índice, Resumen Ejecutivo de 1 pág, Desarrollo, Resultados, Conclusiones y Referencias). | Defensa final grupal ante el docente. | Coherencia metodológica basada en **CRISP-DM**, discusión honesta de limitaciones, errores frecuentes y una profunda **reflexión ética** sobre los sesgos en sistemas de recomendación. |

---

## 4. Lista de Verificación (Checklist) para el Grupo 3 antes de Enviar
Asegúrese de marcar positivamente cada punto antes de realizar las entregas formales:

- [ ] La URL oficial de MovieLens 25M, la fecha de acceso y el criterio exacto de filtrado/muestreo están registrados en el informe.
- [ ] El split de datos (train, val, test) evita estrictamente el *data leakage* temporal o de usuarios.
- [ ] Se evaluaron al menos 3 modelos clásicos, 1 baseline de popularidad/similitud y se corrió **AutoML** como benchmark con el mismo protocolo.
- [ ] El clustering de películas o usuarios incluye una interpretación del significado de los clusters, no solo una gráfica decorativa.
- [ ] El modelo de Deep Learning genera embeddings explícitos analizados mediante reducción de dimensionalidad (PCA/UMAP).
- [ ] La búsqueda semántica sobre tags y metadatos responde de manera coherente a entradas de lenguaje natural (con al menos 5 ejemplos probados).
- [ ] El repositorio cuenta con componentes funcionales de MLOps: tracking de versiones de modelos, índice vectorial y control de dependencias.
- [ ] Las tablas de métricas del informe incluyen títulos, descripciones autocontenidas y permiten comparar justamente todos los enfoques desarrollados.