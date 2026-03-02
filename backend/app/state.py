import pandas as pd
from datetime import datetime

# Global in-memory state — updated on every pipeline run
inventory_df: pd.DataFrame | None = None
forecast_df: pd.DataFrame | None = None
last_updated: str | None = None


def set_state(inv: pd.DataFrame, fc: pd.DataFrame, source: str = "upload") -> None:
    global inventory_df, forecast_df, last_updated
    inventory_df = inv
    forecast_df = fc
    last_updated = f"{datetime.utcnow().isoformat()}Z ({source})"
