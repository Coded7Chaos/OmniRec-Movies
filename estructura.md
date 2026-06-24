# Estructura y Contenido Obligatorio del Informe Final - Grupo 3
**Proyecto:** Sistema de Recomendación de Películas (MovieLens 25M)  
**Metodología:** CRISP-DM  

---

## 1. Formato General y Requisitos de Presentación
El documento escrito debe cumplir estrictamente con las siguientes directrices de formato profesional antes de detallar su contenido técnico:
* **Portada Institucional:** Debe incluir obligatoriamente el nombre de la asignatura (Machine Learning), título del proyecto, identificación del Grupo 3, nombres completos de los integrantes, nombre del docente y fecha de entrega.
* **Resumen Ejecutivo:** Una página como máximo (ubicada justo después del índice) que sintetice el problema, la solución diseñada (ML clásico, Deep Learning y MLOps/RAG) y los resultados principales.
* **Estilo Académico:** Tipografía legible, interlineado uniforme y numeración de páginas correlativa.
* **Tablas y Figuras:** Toda tabla, gráfica de rendimiento o diagrama arquitectónico debe contar con un título numerado y una descripción analítica inferior que permita interpretarla de forma independiente al texto.
* **Sección de Referencias:** Registro formal de los datasets utilizados (incluyendo URL de descarga de MovieLens 25M, variante exacta y fecha de acceso), bibliografía técnica y herramientas de software empleadas.
* **Anexos:** Reservados exclusivamente para material complementario. Los resultados centrales, métricas y análisis de error deben permanecer en el cuerpo principal del informe.

---

## 2. Estructura del Cuerpo del Informe (Alineado con CRISP-DM)

### Capítulo I: Business Understanding & Data Understanding
* **Definición del Problema:** Explicación clara del sistema de recomendación, los objetivos prácticos del modelo (predicción de ratings o ranking de recomendaciones) y los criterios de éxito académico y técnico.
* **Trazabilidad del Dataset:** Registro explícito de la fuente del dataset MovieLens 25M. Descripción detallada del subconjunto de datos seleccionado y justificación técnica en caso de haber aplicado algún criterio de muestreo o filtrado para controlar el volumen.
* **Tabla de Variables:** Listado y descripción de las entradas principales del dataset (IDs de usuarios, IDs de películas, calificaciones, marcas de tiempo, etiquetas/tags y géneros).
* **Análisis Exploratorio de Datos (EDA):** Gráficos analizados críticamente sobre la distribución de ratings, densidad de la matriz de interacciones (sparsity), volumen de tags acumulados por película y estrategias implementadas para abordar usuarios o ítems poco frecuentes (problema de inicio en frío).

### Capítulo II: Data Preparation & Machine Learning Clásico
* **Pipeline de Preprocesamiento:** Descripción detallada del flujo automatizado de limpieza, transformaciones aplicadas y manejo de valores atípicos o ruidosos.
* **Estrategia de Partición:** Documentación estricta de la división del dataset en conjuntos de entrenamiento, validación y prueba, garantizando un protocolo de evaluación justo que evite el *data leakage*.
* **Modelado Clásico:** Descripción de los tres modelos clásicos implementados y la definición del baseline explícito (basado en popularidad o similitud simple).
* **Benchmark Obligatorio de AutoML:** Explicación de cómo se ejecutó el flujo automatizado de AutoML bajo el mismo protocolo de evaluación y una descripción detallada de cómo este reutiliza o contrasta el pipeline de preprocesamiento diseñado por el equipo.

### Capítulo III: Deep Learning & Representaciones Latentes
* **Diseño de la Arquitectura:** Explicación técnica de la red neuronal ligera o del sistema de embeddings personalizados para la relación usuario-ítem implementado. Justificación de la idoneidad de este enfoque profundo para el tipo de datos tabular/interacciones del proyecto.
* **Curvas de Aprendizaje:** Gráficas de pérdida (*loss*) y de las métricas seleccionadas en el conjunto de entrenamiento versus el de validación, acompañadas de un diagnóstico explícito sobre la presencia de sobreajuste (*overfitting*) o subajuste (*underfitting*).
* **Análisis Vectorial:** Explicación del componente de embeddings y análisis visual mediante técnicas de reducción de dimensionalidad (PCA o UMAP) para verificar si las películas similares o géneros afines se agrupan correctamente en el espacio latente.

### Capítulo IV: MLOps & Recuperación Semántica (RAG)
* **Búsqueda Semántica:** Documentación del motor de recuperación vectorial construido sobre los títulos, tags o descriptores disponibles de las películas.
* **Pipeline Reproducible de Inferencia:** Descripción del flujo que conecta la entrada del usuario o consulta en lenguaje natural con la salida ordenada del recomendador.
* **Componentes MLOps Implementados:** Evidencia explícita del flujo mínimo de MLOps operativo, detallando las herramientas elegidas para el tracking de experimentos (parámetros y métricas) y el control de versiones de los artefactos (modelos entrenados, matrices de embeddings e índices vectoriales).
* **Propuesta de Operación:** Plan formalizado para el monitoreo de la calidad del recomendador en producción, detección de degradación del modelo (*data drift*) y políticas establecidas para la actualización o reentrenamiento ante la llegada de nuevas interacciones de usuarios.

---

## 3. Evidencias Cuantitativas y Análisis Crítico Obligatorio

El cuerpo del informe debe integrar de forma obligatoria las siguientes tres secciones de validación experimental:

1.  **Tabla Comparativa de Modelos y Métricas:** Una matriz organizada que contraste de manera justa todos los enfoques del proyecto utilizando las mismas particiones. Debe incluir el Baseline, los 3 modelos clásicos manuales, el enfoque de Deep Learning y una **fila o sección específica dedicada al benchmark de AutoML** para evaluar si la búsqueda automatizada superó al diseño manual en métricas o balance de costo computacional. Se deben justificar las métricas según el enfoque seleccionado (ej. RMSE/MAE para regresión de ratings, o Precision@K/Recall@K/NDCG para ranking).
2.  **Análisis de Error Dirigido:** Evaluación cualitativa y cuantitativa que vaya más allá de los promedios globales de exactitud. Se deben documentar ejemplos específicos de casos mal predichos, recomendaciones erróneas o fallas de similitud, discutiendo los límites de generalización y sesgos del sistema.
3.  **Documentación de Consultas del Buscador:** Inclusión de **al menos cinco (5) ejemplos reales de consultas** introducidas en el componente de recuperación semántica, mostrando explícitamente la entrada del usuario, la evidencia recuperada del índice vectorial y la salida del sistema para validar la relevancia práctica de la búsqueda.

---

## 4. Conclusiones y Consideraciones Éticas
* **Relación Metodológica:** Conclusiones finales que vinculen explícitamente los resultados obtenidos con los objetivos trazados en cada fase del ciclo de vida CRISP-DM.
* **Discusión de Valor Tecnológico:** Justificación analítica detallada de los escenarios específicos en los que el enfoque profundo (embeddings neuronales) aporta un valor real frente a las soluciones de filtrado colaborativo clásico o AutoML, sopesando la complejidad frente al rendimiento.
* **Reflexión Ética y Trabajo Futuro:** Análisis crítico sobre los sesgos potenciales en el sistema de recomendación (burbujas de filtro, amplificación de popularidad o discriminación algorítmica), limitaciones técnicas del desarrollo actual y propuestas concretas para la continuidad del proyecto en fases posteriores.