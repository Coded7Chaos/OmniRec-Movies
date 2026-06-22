# Source Code (`src/`) — Fase 4 (MLOps + RAG)

Paquete reutilizable de entrenamiento, recuperación e inferencia. Se ejecuta como
módulo (`python -m src.pipeline …`); las rutas se resuelven desde la raíz del
proyecto, así que funciona desde cualquier directorio.

| Módulo | Responsabilidad |
|---|---|
| `config.py` | Carga de `config/*.yaml` y resolución de rutas. |
| `utils.py` | Logging, UTF-8 en Windows, hashing SHA256. |
| `data.py` | Carga y validación de los parquets de entrada. |
| `descriptors.py` | Descriptores textuales (título + géneros + top tags genome). |
| `embeddings.py` | Encoder Sentence-Transformers (preentrenado, inferencia). |
| `index.py` | Índice vectorial FAISS (+ fallback NumPy) y metadatos. |
| `search.py` | Recuperación semántica con re-ranking y evidencia. |
| `generate.py` | Capa RAG generativa (LLM Claude + fallback por plantilla). |
| `train.py` | Reentrenamiento del SVD ganador (flujo de actualización). |
| `registry.py` | Versionado de artefactos con manifiestos SHA256 + alias `current`. |
| `tracking.py` | Wrapper de MLflow (no-op si no está instalado). |
| `evaluate.py` | Métricas del recomendador (folding-in) y de la recuperación. |
| `monitor.py` | Reporte de calidad/drift + disparadores de reentrenamiento. |
| `pipeline.py` | Orquestador CLI por etapas. |

## Uso

```bash
python -m src.pipeline all          # prepare -> train -> index -> evaluate -> register
python -m src.pipeline index        # solo (re)construye el índice semántico
python -m src.pipeline evaluate     # métricas + run de MLflow
python -m src.pipeline monitor      # reporte de monitoreo
```

Ver `reports/INFORME_FASE4_MLOPS_RAG.md` para el detalle metodológico.
