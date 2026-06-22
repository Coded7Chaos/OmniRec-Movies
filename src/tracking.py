"""Wrapper fino sobre MLflow para el registro de experimentos.

Si MLflow no está instalado, degrada a un contexto no-op para que el pipeline
siga corriendo (la pista MLflow es deseable, no un bloqueo duro).
"""
from __future__ import annotations

from contextlib import contextmanager

from src import config
from src.utils import get_logger

log = get_logger("omnirec.tracking")


def _mlflow():
    try:
        import mlflow
        return mlflow
    except ImportError:
        return None


@contextmanager
def start_run(run_name: str):
    """Abre un run de MLflow (file store local) o un contexto no-op."""
    mlflow = _mlflow()
    if mlflow is None:
        log.warning("MLflow no disponible; no se registrará el experimento.")
        yield _NoOpRun()
        return

    cfg = config.pipeline_cfg()["mlflow"]
    # MLflow 3.x deshabilitó el file store; usamos backend SQLite local (el
    # recomendado). Prioridad: variable de entorno (Docker/volumen) > config >
    # default local. Permite compartir la misma BD con el servicio `mlflow ui`.
    import os
    uri = (os.getenv("MLFLOW_TRACKING_URI") or cfg.get("tracking_uri")
           or f"sqlite:///{config.ROOT / 'mlflow.db'}")
    mlflow.set_tracking_uri(uri)
    mlflow.set_experiment(cfg["experiment"])
    with mlflow.start_run(run_name=run_name) as run:
        log.info("MLflow run '%s' (%s)", run_name, run.info.run_id)
        yield _MlflowRun(mlflow)


class _NoOpRun:
    def log_params(self, params: dict) -> None: ...
    def log_metrics(self, metrics: dict) -> None: ...
    def log_artifact(self, path) -> None: ...
    def set_tags(self, tags: dict) -> None: ...


class _MlflowRun:
    def __init__(self, mlflow) -> None:
        self._mlflow = mlflow

    def log_params(self, params: dict) -> None:
        self._mlflow.log_params({k: str(v) for k, v in params.items()})

    def log_metrics(self, metrics: dict) -> None:
        # MLflow no admite '@' en nombres de métricas (p. ej. ndcg@10).
        clean = {k.replace("@", "_at_"): float(v)
                 for k, v in metrics.items() if v is not None}
        self._mlflow.log_metrics(clean)

    def log_artifact(self, path) -> None:
        self._mlflow.log_artifact(str(path))

    def set_tags(self, tags: dict) -> None:
        self._mlflow.set_tags(tags)
