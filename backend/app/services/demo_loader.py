import logging
from pathlib import Path

import pandas as pd

logger = logging.getLogger(__name__)


def load_demo_state(data_dir: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load inventory_plan.csv and forecast.csv from model dir. Returns empty DataFrames if missing."""
    path = Path(data_dir)

    inv_path = path / "inventory_plan.csv"
    fc_path  = path / "forecast.csv"

    if not inv_path.exists():
        logger.warning("inventory_plan.csv not found at %s — starting with empty state", inv_path)
        return pd.DataFrame(), pd.DataFrame()

    inventory_df = pd.read_csv(inv_path)
    logger.info("Loaded inventory_plan.csv — %d rows", len(inventory_df))

    forecast_df = pd.DataFrame()
    if fc_path.exists():
        forecast_df = pd.read_csv(fc_path)
        logger.info("Loaded forecast.csv — %d rows", len(forecast_df))

    return inventory_df, forecast_df
