"""Utilidades transversales: logging, encoding UTF-8 y hashing de artefactos."""
from __future__ import annotations

import hashlib
import logging
import sys
from pathlib import Path


def ensure_utf8_stdout() -> None:
    """Fuerza UTF-8 en stdout/stderr.

    En Windows la consola usa cp1252 por defecto y cualquier ``print`` con
    acentos o nombres de tags genome (p. ej. ``sci-fi``, ``film noir``) lanza
    ``UnicodeEncodeError``. Llamar a esto al inicio de cada entrypoint evita
    que el pipeline se rompa por un carácter no-ASCII.
    """
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8")
            except (ValueError, OSError):
                pass


def get_logger(name: str = "omnirec") -> logging.Logger:
    """Logger consistente para todo el pipeline."""
    ensure_utf8_stdout()
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            logging.Formatter("%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
                              datefmt="%H:%M:%S")
        )
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        logger.propagate = False
    return logger


def sha256_file(path: str | Path, chunk_size: int = 1 << 20) -> str:
    """Hash SHA256 de un archivo (para trazabilidad/integridad de artefactos)."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    """Hash SHA256 de un blob en memoria."""
    return hashlib.sha256(data).hexdigest()
