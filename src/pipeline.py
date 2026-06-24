"""Orquestador del pipeline reproducible — Fase 4 (MLOps + RAG).

Etapas (idempotentes, configurables en config/pipeline.yaml):
    prepare   valida entradas y construye los descriptores
    train     reentrena el SVD ganador (flujo de actualización del recomendador)
    train_dl  reentrena el modelo Deep Learning (MF+Bias + NeuMF, notebook 04)
    index     embeddings + índice FAISS de recuperación semántica
    evaluate  métricas del recomendador y de la recuperación (run de MLflow)
    register  versiona SVD + DL + índice con manifiestos SHA256 y promueve `current`
    monitor   reporte de calidad/drift + disparadores de reentrenamiento
    all       prepare -> train -> train_dl -> baseline -> index -> evaluate -> register -> monitor

Uso:
    python -m src.pipeline all
    python -m src.pipeline train_dl
"""
from __future__ import annotations

import argparse
import json

from src import config, registry, tracking
from src.utils import ensure_utf8_stdout, get_logger

log = get_logger("omnirec.pipeline")

STAGES = ["prepare", "train", "train_dl", "baseline", "index", "evaluate", "register", "monitor"]


def stage_prepare() -> dict:
    from src.data import validate_inputs
    from src.descriptors import build_descriptors, save_descriptors

    report = validate_inputs()
    save_descriptors(build_descriptors())
    return report


def stage_train() -> dict:
    from src.train import train_svd

    return train_svd()


def stage_train_dl() -> dict:
    from src.train_dl import train_dl

    metrics = train_dl()
    with tracking.start_run("train_dl") as run:
        cfg = config.pipeline_cfg()
        run.log_params({"seed": cfg["seed"], **cfg["deep_learning"]})
        flat = {}
        for model_name, m in metrics.get("models", {}).items():
            for mk, mv in m.items():
                if isinstance(mv, (int, float)):
                    flat[f"{model_name}_{mk}"] = mv
        run.log_metrics(flat)
        run.set_tags({"phase": "fase4-deep-learning", "served_model": metrics.get("served_model", "")})
    return metrics


def stage_baseline() -> dict:
    from src.baseline import build_baseline

    return build_baseline()


def stage_index() -> dict:
    from src.index import build_index

    return build_index(rebuild_descriptors=False)


def stage_evaluate() -> dict:
    from src import evaluate

    metrics = evaluate.evaluate_all()
    with tracking.start_run("evaluate") as run:
        cfg = config.pipeline_cfg()
        run.log_params({
            "encoder": config.rag_cfg()["encoder"]["model_name"],
            "rerank_alpha": config.rag_cfg()["search"]["rerank_alpha"],
            "seed": cfg["seed"],
            **cfg["svd"],
        })
        flat = {**metrics["recommender"], **{
            f"retrieval_{k}": v for k, v in metrics["retrieval"].items()
            if isinstance(v, (int, float))
        }}
        run.log_metrics({k: v for k, v in flat.items() if isinstance(v, (int, float))})
        run.set_tags({"phase": "fase4-mlops-rag"})
    return metrics


def stage_register(metrics: dict | None = None) -> dict:
    from src.index import _index_dir

    cfg = config.pipeline_cfg()
    rec = (metrics or {}).get("recommender", {})
    dataset_version = f"ml-25m::{rec.get('dataset', 'unknown')}"

    out = {}
    svd_path = config.path("models") / "svd_model.pkl"
    if svd_path.exists():
        out["svd_model"] = registry.register(
            "svd_model", svd_path, metrics=rec, dataset_version=dataset_version,
            extra={"hyperparams": cfg["svd"]},
        )
    baseline_path = config.path("models") / "baseline_scores.pkl"
    if baseline_path.exists():
        out["baseline_scores"] = registry.register(
            "baseline_scores", baseline_path, dataset_version=dataset_version,
            extra={"strategy": "bayesian_weighted_rating"},
        )
    manifest = _index_dir() / "manifest.json"
    if manifest.exists():
        ret = (metrics or {}).get("retrieval", {})
        out["rag_index"] = registry.register(
            "rag_index", manifest, metrics={
                k: v for k, v in ret.items() if isinstance(v, (int, float))
            },
            dataset_version=dataset_version,
            extra={"encoder": config.rag_cfg()["encoder"]["model_name"]},
        )
    # Modelo Deep Learning (notebook 04): versiona el artefacto de servicio
    # (embeddings) con sus métricas de test desde el sidecar dl_metrics.json.
    dl_emb = config.path("models") / "dl_item_embeddings.pkl"
    dl_sidecar = config.path("models") / "dl_metrics.json"
    if dl_emb.exists():
        dl_meta = json.loads(dl_sidecar.read_text(encoding="utf-8")) if dl_sidecar.exists() else {}
        served = (dl_meta.get("models", {}) or {}).get(dl_meta.get("served_model", "mf_bias"), {})
        out["dl_embeddings"] = registry.register(
            "dl_embeddings", dl_emb,
            metrics={k: v for k, v in served.items() if isinstance(v, (int, float))},
            dataset_version=f"ml-25m::{dl_meta.get('dataset', rec.get('dataset', 'unknown'))}",
            extra={"hyperparams": cfg["deep_learning"], "arch": "MFBias",
                   "served_model": dl_meta.get("served_model"),
                   "all_models": dl_meta.get("models", {})},
        )
    return out


def stage_monitor(metrics: dict | None = None) -> dict:
    from src import monitor

    return monitor.run(metrics)


def run_all() -> dict:
    out = {}
    out["prepare"] = stage_prepare()
    out["train"] = stage_train()
    out["train_dl"] = stage_train_dl()
    out["baseline"] = stage_baseline()
    out["index"] = stage_index()
    out["evaluate"] = stage_evaluate()
    out["register"] = stage_register(out["evaluate"])
    out["monitor"] = stage_monitor(out["evaluate"])
    return out


def main() -> None:
    ensure_utf8_stdout()
    parser = argparse.ArgumentParser(description="Pipeline MLOps+RAG — Fase 4")
    parser.add_argument("stage", choices=STAGES + ["all"])
    args = parser.parse_args()

    if args.stage == "all":
        result = run_all()
    else:
        result = {
            "prepare": stage_prepare,
            "train": stage_train,
            "train_dl": stage_train_dl,
            "baseline": stage_baseline,
            "index": stage_index,
            "evaluate": stage_evaluate,
            "register": stage_register,
            "monitor": stage_monitor,
        }[args.stage]()

    log.info("Etapa '%s' completada.", args.stage)
    print(json.dumps(result, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
