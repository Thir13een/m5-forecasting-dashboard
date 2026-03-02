import csv
import logging
from pathlib import Path

import lightgbm as lgb
import pandas as pd

logger = logging.getLogger(__name__)

HORIZONS = [1, 7, 14, 28]


class ModelStore:
    _models: dict[int, lgb.Booster] = {}
    _feature_cols: list[str] = []
    _loaded: bool = False

    @classmethod
    def load(cls, model_dir: str) -> None:
        path = Path(model_dir)
        logger.info("Loading LightGBM models from %s ...", path)
        for h in HORIZONS:
            model_path = path / f"lgb_direct_h{h:02d}.txt"
            logger.info("  Loading h=%02d from %s", h, model_path)
            cls._models[h] = lgb.Booster(model_file=str(model_path))

        feat_path = path / "feature_cols.csv"
        with open(feat_path) as f:
            cls._feature_cols = [
                r["feature_cols"]
                for r in csv.DictReader(f)
                if r.get("feature_cols", "").strip()
            ]
        cls._loaded = True
        logger.info("All 4 models loaded. Features: %d", len(cls._feature_cols))

    @classmethod
    def predict(cls, X: pd.DataFrame) -> dict[int, list[float]]:
        if not cls._loaded:
            raise RuntimeError("Models not loaded yet")
        df = X.copy()
        if df["item_id"].dtype == object:
            df["item_id"] = df["item_id"].astype("category").cat.codes.astype("int32")
        Xf = df[cls._feature_cols]
        return {h: cls._models[h].predict(Xf).tolist() for h in HORIZONS}

    @classmethod
    def is_loaded(cls) -> bool:
        return cls._loaded

    @classmethod
    def feature_cols(cls) -> list[str]:
        return cls._feature_cols
