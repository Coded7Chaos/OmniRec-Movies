# Configuration (`config/`)

Parámetros de los experimentos y del pipeline (Fase 4). Separar la configuración
del código permite reproducir y versionar las corridas sin tocar `src/`.

| Archivo | Contenido |
|---|---|
| `pipeline.yaml` | Semilla, rutas, fuentes de datos, hiperparámetros del SVD, protocolo de evaluación y experimento de MLflow. |
| `rag.yaml` | Encoder de embeddings, parámetros de los descriptores, backend del índice, re-ranking de búsqueda y capa generativa. |
| `monitoring.yaml` | Umbrales de calidad/drift y política de reentrenamiento (disparadores). |

Consumidos por `src/config.py` (`pipeline_cfg()`, `rag_cfg()`, `monitoring_cfg()`).
