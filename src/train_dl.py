"""Entrenamiento reproducible del modelo Deep Learning (Fase 4 — MLOps).

Lleva el notebook 04 a una etapa del pipeline: entrena **MF+Bias** (el modelo de
servicio que alimenta "películas similares") y, opcionalmente, **NeuMF** (la
comparación deep), sobre la misma partición train/val/test con filtrado warm-start.
Evalúa en un test holdout (RMSE/MAE), exporta los embeddings de servicio y persiste
los pesos + un sidecar de métricas para el registry. Hiperparámetros reproducibles
en ``config/pipeline.yaml:deep_learning``.

Artefactos producidos:
    models/mf_model.pt            pesos MF+Bias + mapeos de índice
    models/ncf_model.pt           pesos NeuMF (si train_neumf)
    models/dl_item_embeddings.pkl embeddings de ítem normalizados (lo que sirve el backend)
    models/dl_metrics.json        métricas de test + metadatos (lo que registra el registry)
"""
from __future__ import annotations

import json
import pickle
import random
import time

import numpy as np

from src import config
from src.data import load_ratings
from src.utils import get_logger

log = get_logger("omnirec.train_dl")


# --------------------------------------------------------------------------- modelos
def _build_models(torch):
    nn = torch.nn

    class MFBias(nn.Module):
        """Matrix Factorization con sesgos: análogo neuronal del SVD."""

        def __init__(self, n_users, n_items, dim, global_mean):
            super().__init__()
            self.u_emb = nn.Embedding(n_users, dim)
            self.i_emb = nn.Embedding(n_items, dim)
            self.u_bias = nn.Embedding(n_users, 1)
            self.i_bias = nn.Embedding(n_items, 1)
            self.global_bias = nn.Parameter(torch.tensor(float(global_mean)))
            self.rmin, self.rmax = 0.5, 5.0
            nn.init.normal_(self.u_emb.weight, std=0.05)
            nn.init.normal_(self.i_emb.weight, std=0.05)
            nn.init.zeros_(self.u_bias.weight)
            nn.init.zeros_(self.i_bias.weight)

        def _scale(self, x):
            return self.rmin + (self.rmax - self.rmin) * torch.sigmoid(x)

        def forward(self, u, i):
            dot = (self.u_emb(u) * self.i_emb(i)).sum(1)
            out = dot + self.u_bias(u).squeeze(1) + self.i_bias(i).squeeze(1) + self.global_bias
            return self._scale(out)

    class NeuMF(nn.Module):
        """Neural Collaborative Filtering: rama GMF + rama MLP, con sesgos."""

        def __init__(self, n_users, n_items, dim, global_mean, layers=(64, 32, 16), p=0.2):
            super().__init__()
            self.u_gmf = nn.Embedding(n_users, dim)
            self.i_gmf = nn.Embedding(n_items, dim)
            self.u_mlp = nn.Embedding(n_users, dim)
            self.i_mlp = nn.Embedding(n_items, dim)
            blocks, in_dim = [], dim * 2
            for h in layers:
                blocks += [nn.Linear(in_dim, h), nn.ReLU(), nn.Dropout(p)]
                in_dim = h
            self.mlp = nn.Sequential(*blocks)
            self.u_bias = nn.Embedding(n_users, 1)
            self.i_bias = nn.Embedding(n_items, 1)
            self.global_bias = nn.Parameter(torch.tensor(float(global_mean)))
            self.head = nn.Linear(dim + layers[-1], 1)
            self.rmin, self.rmax = 0.5, 5.0
            for emb in (self.u_gmf, self.i_gmf, self.u_mlp, self.i_mlp):
                nn.init.normal_(emb.weight, std=0.05)
            nn.init.zeros_(self.u_bias.weight)
            nn.init.zeros_(self.i_bias.weight)

        def _scale(self, x):
            return self.rmin + (self.rmax - self.rmin) * torch.sigmoid(x)

        def forward(self, u, i):
            gmf = self.u_gmf(u) * self.i_gmf(i)
            mlp = self.mlp(torch.cat([self.u_mlp(u), self.i_mlp(i)], dim=1))
            fused = self.head(torch.cat([gmf, mlp], dim=1)).squeeze(1)
            out = fused + self.u_bias(u).squeeze(1) + self.i_bias(i).squeeze(1) + self.global_bias
            return self._scale(out)

    return MFBias, NeuMF


# --------------------------------------------------------------------------- datos
def _split(ratings, seed, test_size):
    from sklearn.model_selection import train_test_split

    train_df, temp = train_test_split(ratings, test_size=test_size, random_state=seed)
    val_df, test_df = train_test_split(temp, test_size=0.5, random_state=seed)

    known_u = set(train_df.userId.unique())
    known_i = set(train_df.movieId.unique())
    warm = lambda d: d[d.userId.isin(known_u) & d.movieId.isin(known_i)].copy()
    val_df, test_df = warm(val_df), warm(test_df)

    u2i = {int(u): k for k, u in enumerate(sorted(known_u))}
    i2i = {int(m): k for k, m in enumerate(sorted(known_i))}
    for d in (train_df, val_df, test_df):
        d["u"] = d.userId.map(u2i).astype("int64")
        d["i"] = d.movieId.map(i2i).astype("int64")
    return train_df, val_df, test_df, u2i, i2i


def _loaders(torch, train_df, val_df, test_df, batch_size, seed):
    from torch.utils.data import DataLoader, TensorDataset

    def ds(df):
        return TensorDataset(
            torch.as_tensor(df.u.values, dtype=torch.long),
            torch.as_tensor(df.i.values, dtype=torch.long),
            torch.as_tensor(df.rating.values, dtype=torch.float32),
        )

    g = torch.Generator()
    g.manual_seed(seed)
    return (
        DataLoader(ds(train_df), batch_size=batch_size, shuffle=True, generator=g),
        DataLoader(ds(val_df), batch_size=batch_size),
        DataLoader(ds(test_df), batch_size=batch_size),
    )


# --------------------------------------------------------------------------- bucle
def _evaluate(torch, model, loader, device):
    model.eval()
    se = ae = n = 0.0
    with torch.no_grad():
        for u, i, r in loader:
            u, i, r = u.to(device), i.to(device), r.to(device)
            p = model(u, i)
            se += ((p - r) ** 2).sum().item()
            ae += (p - r).abs().sum().item()
            n += len(r)
    return (se / n) ** 0.5, ae / n


def _fit(torch, model, name, train_loader, val_loader, device, dl_cfg):
    import copy

    opt = torch.optim.Adam(model.parameters(), lr=dl_cfg["lr"], weight_decay=dl_cfg["weight_decay"])
    loss_fn = torch.nn.MSELoss()
    best_rmse, best_state, bad = float("inf"), None, 0
    t0 = time.time()
    for ep in range(1, dl_cfg["epochs"] + 1):
        model.train()
        for u, i, r in train_loader:
            u, i, r = u.to(device), i.to(device), r.to(device)
            opt.zero_grad()
            loss_fn(model(u, i), r).backward()
            opt.step()
        val_rmse, val_mae = _evaluate(torch, model, val_loader, device)
        if val_rmse < best_rmse - 1e-4:
            best_rmse, best_state, bad = val_rmse, copy.deepcopy(model.state_dict()), 0
        else:
            bad += 1
        log.info("[%s] época %02d | Val RMSE %.4f | Val MAE %.4f%s",
                 name, ep, val_rmse, val_mae, "  <- mejor" if bad == 0 else "")
        if bad >= dl_cfg["patience"]:
            log.info("[%s] early stopping en época %d (mejor Val RMSE %.4f)", name, ep, best_rmse)
            break
    model.load_state_dict(best_state)
    return model, round(best_rmse, 4), round(time.time() - t0, 1)


# --------------------------------------------------------------------------- API
def train_dl() -> dict:
    """Entrena MF+Bias (+NeuMF), evalúa en test, exporta embeddings y métricas."""
    cfg = config.pipeline_cfg()
    dl_cfg = cfg["deep_learning"]
    seed = cfg["seed"]

    random.seed(seed)
    np.random.seed(seed)

    import torch

    torch.manual_seed(seed)
    if dl_cfg.get("force_cpu"):
        device = torch.device("cpu")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
    elif torch.backends.mps.is_available():
        device = torch.device("mps")
    else:
        device = torch.device("cpu")
    log.info("Dispositivo DL: %s", device)

    ratings, dataset_label = load_ratings()
    ratings = ratings[["userId", "movieId", "rating"]]
    train_df, val_df, test_df, u2i, i2i = _split(ratings, seed, dl_cfg["test_size"])
    n_users, n_items = len(u2i), len(i2i)
    global_mean = float(train_df.rating.mean())
    log.info("Split DL | train=%d val=%d test=%d | usuarios=%d películas=%d",
             len(train_df), len(val_df), len(test_df), n_users, n_items)

    MFBias, NeuMF = _build_models(torch)
    train_loader, val_loader, test_loader = _loaders(
        torch, train_df, val_df, test_df, dl_cfg["batch_size"], seed
    )

    models_dir = config.path("models")
    models_dir.mkdir(parents=True, exist_ok=True)
    dim = dl_cfg["embedding_dim"]
    metrics: dict = {"dataset": dataset_label, "seed": seed, "device": str(device),
                     "n_users": n_users, "n_items": n_items, "models": {}}

    # --- MF+Bias (modelo de servicio) ---------------------------------------
    torch.manual_seed(seed)
    mf = MFBias(n_users, n_items, dim, global_mean).to(device)
    mf, mf_val, mf_secs = _fit(torch, mf, "MF+Bias", train_loader, val_loader, device, dl_cfg)
    mf_test_rmse, mf_test_mae = _evaluate(torch, mf, test_loader, device)
    torch.save({"state_dict": mf.state_dict(), "user2idx": u2i, "item2idx": i2i,
                "rating_range": (dl_cfg["rating_min"], dl_cfg["rating_max"]), "arch": "MFBias"},
               models_dir / "mf_model.pt")
    metrics["models"]["mf_bias"] = {
        "val_rmse": mf_val, "test_rmse": round(mf_test_rmse, 4),
        "test_mae": round(mf_test_mae, 4), "train_secs": mf_secs, "params": _count(mf),
    }
    log.info("MF+Bias TEST RMSE %.4f | MAE %.4f", mf_test_rmse, mf_test_mae)

    # --- NeuMF (comparación) ------------------------------------------------
    if dl_cfg.get("train_neumf", True):
        torch.manual_seed(seed)
        ncf = NeuMF(n_users, n_items, dim, global_mean).to(device)
        ncf, ncf_val, ncf_secs = _fit(torch, ncf, "NeuMF", train_loader, val_loader, device, dl_cfg)
        ncf_test_rmse, ncf_test_mae = _evaluate(torch, ncf, test_loader, device)
        torch.save({"state_dict": ncf.state_dict(), "user2idx": u2i, "item2idx": i2i,
                    "rating_range": (dl_cfg["rating_min"], dl_cfg["rating_max"]), "arch": "NeuMF"},
                   models_dir / "ncf_model.pt")
        metrics["models"]["neumf"] = {
            "val_rmse": ncf_val, "test_rmse": round(ncf_test_rmse, 4),
            "test_mae": round(ncf_test_mae, 4), "train_secs": ncf_secs, "params": _count(ncf),
        }
        log.info("NeuMF TEST RMSE %.4f | MAE %.4f", ncf_test_rmse, ncf_test_mae)

    # --- Exporta embeddings de servicio (lo que sirve el backend) -----------
    item_emb = mf.i_emb.weight.detach().cpu().numpy().astype(np.float32)
    idx2item = {v: k for k, v in i2i.items()}
    item_ids = np.array([idx2item[i] for i in range(item_emb.shape[0])], dtype=np.int64)
    emb_path = models_dir / "dl_item_embeddings.pkl"
    with open(emb_path, "wb") as f:
        pickle.dump({"item_ids": item_ids, "embeddings": item_emb, "arch": "MFBias",
                     "dim": int(item_emb.shape[1]), "source": "src.train_dl"}, f)
    metrics["served_model"] = "mf_bias"
    metrics["served_artifact"] = emb_path.name
    metrics["trained_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
    metrics["hyperparams"] = {k: dl_cfg[k] for k in
                              ("embedding_dim", "batch_size", "epochs", "lr", "weight_decay")} | {"seed": seed}

    # Sidecar de métricas para el registry / monitoreo.
    (models_dir / "dl_metrics.json").write_text(
        json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("Embeddings DL exportados: %s (%d ítems, dim=%d)",
             emb_path, item_emb.shape[0], item_emb.shape[1])
    return metrics


def _count(model) -> int:
    return int(sum(p.numel() for p in model.parameters() if p.requires_grad))


if __name__ == "__main__":
    print(json.dumps(train_dl(), indent=2, ensure_ascii=False))
