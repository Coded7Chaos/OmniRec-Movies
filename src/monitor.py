"""Monitoreo de calidad / drift del recomendador y política de reentrenamiento.

Produce un reporte (JSON) que combina:
- métricas de calidad (recomendador + recuperación) de src.evaluate,
- drift temporal de la distribución de ratings (PSI old-vs-new),
- frescura de los datos (días desde el último rating),
- cobertura del índice semántico,
- degradación vs la versión `current` del registro,
y evalúa los disparadores de reentrenamiento de config/monitoring.yaml.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import numpy as np

from src import config, evaluate, registry
from src.data import load_ratings
from src.utils import get_logger

log = get_logger("omnirec.monitor")


def _psi(expected: np.ndarray, actual: np.ndarray, bins: int = 10) -> float:
    """Population Stability Index entre dos distribuciones (drift)."""
    edges = np.histogram_bin_edges(np.concatenate([expected, actual]), bins=bins)
    e, _ = np.histogram(expected, bins=edges)
    a, _ = np.histogram(actual, bins=edges)
    e = e / max(e.sum(), 1) + 1e-6
    a = a / max(a.sum(), 1) + 1e-6
    return float(np.sum((a - e) * np.log(a / e)))


def _rating_drift() -> dict:
    """PSI de la distribución de ratings entre la mitad antigua y la reciente."""
    ratings, _ = load_ratings()
    ts = ratings["timestamp"].to_numpy()
    median = np.median(ts)
    old = ratings.loc[ratings["timestamp"] <= median, "rating"].to_numpy()
    new = ratings.loc[ratings["timestamp"] > median, "rating"].to_numpy()
    last_ts = int(ts.max())
    days = (datetime.now(timezone.utc) - datetime.fromtimestamp(last_ts, tz=timezone.utc)).days
    return {"rating_psi": round(_psi(old, new), 4), "data_freshness_days": int(days)}


def _dl_status() -> dict:
    """Estado del modelo Deep Learning: Test RMSE actual (sidecar dl_metrics.json)
    vs la versión `current` registrada de ``dl_embeddings``."""
    sidecar = config.path("models") / "dl_metrics.json"
    if not sidecar.exists():
        return {"available": False}
    meta = json.loads(sidecar.read_text(encoding="utf-8"))
    served = (meta.get("models", {}) or {}).get(meta.get("served_model", "mf_bias"), {})
    rmse_now = served.get("test_rmse")
    prev = registry.current_manifest("dl_embeddings")
    rmse_rise = None
    if prev and rmse_now is not None and prev.get("metrics", {}).get("test_rmse"):
        base = prev["metrics"]["test_rmse"]
        rmse_rise = round(100.0 * (rmse_now - base) / base, 2)
    return {
        "available": True,
        "served_model": meta.get("served_model"),
        "test_rmse": rmse_now,
        "test_mae": served.get("test_mae"),
        "current_version": prev["version"] if prev else None,
        "rmse_rise_pct_vs_current": rmse_rise,
    }


def run(metrics: dict | None = None) -> dict:
    cfg = config.monitoring_cfg()
    th = cfg["thresholds"]

    quality = metrics or evaluate.evaluate_all()
    drift = _rating_drift()
    dl = _dl_status()

    rec = quality["recommender"]
    ret = quality["retrieval"]

    # Degradación de NDCG@10 vs la versión `current` registrada del SVD.
    prev = registry.current_manifest("svd_model")
    ndcg_key = next((k for k in rec if k.startswith("ndcg@")), None)
    ndcg_now = rec.get(ndcg_key)
    ndcg_drop = None
    if prev and ndcg_key and prev.get("metrics", {}).get(ndcg_key) and ndcg_now is not None:
        base = prev["metrics"][ndcg_key]
        ndcg_drop = round(100.0 * (base - ndcg_now) / base, 2)

    alerts = []
    if ndcg_drop is not None and ndcg_drop > th["ndcg10_drop_pct"]:
        alerts.append(f"NDCG@10 cayó {ndcg_drop}% (> {th['ndcg10_drop_pct']}%) vs {prev['version']}")
    if drift["rating_psi"] > th["popularity_psi"]:
        alerts.append(f"PSI de ratings {drift['rating_psi']} (> {th['popularity_psi']}): drift")
    if ret["coverage_genome"] is not None and ret["coverage_genome"] < th["min_coverage"]:
        alerts.append(
            f"Cobertura genome {ret['coverage_genome']} (< {th['min_coverage']})"
        )
    if drift["data_freshness_days"] > th["data_freshness_days"]:
        alerts.append(
            f"Datos con {drift['data_freshness_days']} días de antigüedad "
            f"(> {th['data_freshness_days']})"
        )
    dl_rise = dl.get("rmse_rise_pct_vs_current")
    if dl_rise is not None and dl_rise > th.get("dl_rmse_rise_pct", 5.0):
        alerts.append(
            f"Test RMSE del modelo DL subió {dl_rise}% (> {th['dl_rmse_rise_pct']}%) "
            f"vs {dl.get('current_version')}"
        )

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "recommender": rec,
        "retrieval": {k: v for k, v in ret.items() if k != "per_query"},
        "deep_learning": dl,
        "drift": drift,
        "ndcg_drop_pct_vs_current": ndcg_drop,
        "current_svd_version": prev["version"] if prev else None,
        "retrain_policy": cfg["retrain"],
        "alerts": alerts,
        "retrain_recommended": bool(alerts),
    }

    out_dir = config.path("monitoring")
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = out_dir / f"monitor_{stamp}.json"
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("Reporte de monitoreo: %s (%d alertas)", out, len(alerts))
    for a in alerts:
        log.warning("ALERTA: %s", a)
    return report


if __name__ == "__main__":
    print(json.dumps(run(), indent=2, ensure_ascii=False))
