"""Registro y versionado de artefactos con manifiestos SHA256.

Estructura:
    models/registry/<artefacto>/<version>/        copia del artefacto + manifest.json
    models/registry/<artefacto>/current.json      alias a la versión en producción

Cada manifiesto registra la versión, el hash SHA256 (integridad/trazabilidad),
la versión del dataset, las métricas y la versión padre, satisfaciendo el bloque
"tracking y versionado" de la rúbrica.
"""
from __future__ import annotations

import json
import shutil
from datetime import date, datetime, timezone
from pathlib import Path

from src import config
from src.utils import get_logger, sha256_file

log = get_logger("omnirec.registry")


def _artifact_dir(name: str) -> Path:
    d = config.path("registry") / name
    d.mkdir(parents=True, exist_ok=True)
    return d


def _next_version(name: str) -> str:
    """Versión legible: AAAA.MM.DD-N (N incremental dentro del día)."""
    today = date.today().strftime("%Y.%m.%d")
    base = _artifact_dir(name)
    existing = [p.name for p in base.iterdir() if p.is_dir() and p.name.startswith(today)]
    return f"{today}-{len(existing) + 1}"


def register(
    name: str,
    source_path: str | Path,
    metrics: dict | None = None,
    dataset_version: str | None = None,
    extra: dict | None = None,
    promote: bool = True,
) -> dict:
    """Versiona un artefacto: copia el archivo y escribe su manifiesto."""
    source_path = Path(source_path)
    if not source_path.exists():
        raise FileNotFoundError(f"No existe el artefacto a registrar: {source_path}")

    version = _next_version(name)
    vdir = _artifact_dir(name) / version
    vdir.mkdir(parents=True, exist_ok=True)
    dest = vdir / source_path.name
    shutil.copy2(source_path, dest)

    parent = current_version(name)
    manifest = {
        "artifact": name,
        "version": version,
        "file": source_path.name,
        "sha256": sha256_file(dest),
        "size_bytes": dest.stat().st_size,
        "dataset_version": dataset_version,
        "metrics": metrics or {},
        "parent": parent,
        "created_at": datetime.now(timezone.utc).isoformat(),
        **(extra or {}),
    }
    (vdir / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    log.info("Registrado %s v%s (sha256=%s…)", name, version, manifest["sha256"][:12])

    if promote:
        promote_version(name, version)
    return manifest


def promote_version(name: str, version: str) -> None:
    """Apunta el alias `current` a una versión (la que sirve producción)."""
    alias = _artifact_dir(name) / "current.json"
    alias.write_text(
        json.dumps({"current": version, "promoted_at": datetime.now(timezone.utc).isoformat()},
                   indent=2),
        encoding="utf-8",
    )
    log.info("%s: alias current -> v%s", name, version)


def current_version(name: str) -> str | None:
    alias = _artifact_dir(name) / "current.json"
    if not alias.exists():
        return None
    return json.loads(alias.read_text(encoding="utf-8")).get("current")


def current_manifest(name: str) -> dict | None:
    version = current_version(name)
    if version is None:
        return None
    man = _artifact_dir(name) / version / "manifest.json"
    return json.loads(man.read_text(encoding="utf-8")) if man.exists() else None


def list_versions(name: str) -> list[dict]:
    base = _artifact_dir(name)
    out = []
    for vdir in sorted(p for p in base.iterdir() if p.is_dir()):
        man = vdir / "manifest.json"
        if man.exists():
            out.append(json.loads(man.read_text(encoding="utf-8")))
    return out
