"""OmniRec-Movies — paquete de la Fase 4 (MLOps + RAG / recuperación semántica).

Módulos:
- ``config``       carga de YAML y resolución de rutas del proyecto.
- ``utils``        logging y utilidades (encoding UTF-8 en Windows, hashing).
- ``data``         carga y validación de los parquets de entrada.
- ``descriptors``  construcción de descriptores textuales por película.
- ``embeddings``   encoder Sentence-Transformers (preentrenado, inferencia).
- ``index``        índice vectorial FAISS (con fallback NumPy).
- ``search``       recuperación semántica con evidencia (tags).
- ``generate``     capa RAG generativa (LLM + fallback determinista).
- ``train``        reentrenamiento del SVD ganador.
- ``registry``     versionado de artefactos con manifiestos SHA256.
- ``tracking``     wrapper de MLflow (no-op si no está instalado).
- ``evaluate``     métricas del recomendador y de la recuperación.
- ``monitor``      reporte de calidad / drift y disparadores de reentrenamiento.
- ``pipeline``     orquestador CLI por etapas.
"""

__version__ = "0.4.0"  # Fase 4
