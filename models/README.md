# Models

Artefactos del modelo entrenado e índices de inferencia. Se generan con el
pipeline y no se versionan en git por peso (ver `.gitignore`).

| Ruta | Contenido | Generado por |
|---|---|---|
| `svd_model.pkl` | Factores e ítems del SVD + clústeres KMeans (folding-in). | `python -m src.pipeline train` |
| `baseline_scores.pkl` | Popularidad bayesiana (baseline). | notebook 03 |
| `rag_index/` | Índice FAISS, embeddings, metadatos, embeddings de tags y `manifest.json`. | `python -m src.pipeline index` |
| `registry/<artefacto>/<version>/` | Copia versionada + `manifest.json` (SHA256, métricas, dataset). | `python -m src.pipeline register` |
| `registry/<artefacto>/current.json` | Alias a la versión en producción. | `register` / `promote` |

Reproducir todo: `python -m src.pipeline all`.
