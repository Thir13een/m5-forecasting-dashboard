import numpy as np
import pandas as pd

from app.services.model_store import ModelStore

Z = 1.282   # 90% service level
LEAD_TIME = 7


def run_full_pipeline(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Takes a fully feature-engineered DataFrame.
    Returns (forecast_df, inventory_df).
    """
    # Use the last row per item as the forecast origin
    origin = df.sort_values("day_int").groupby("item_id").last().reset_index()

    predictions = ModelStore.predict(origin)

    forecast_df = pd.DataFrame({
        "item_id":   origin["item_id"].values,
        "pred_h01":  predictions[1],
        "pred_h07":  predictions[7],
        "pred_h14":  predictions[14],
        "pred_h28":  predictions[28],
    })

    inventory_df = _compute_inventory(forecast_df, origin)
    return forecast_df, inventory_df


def _compute_inventory(forecast_df: pd.DataFrame, origin: pd.DataFrame) -> pd.DataFrame:
    df = forecast_df.merge(
        origin[["item_id", "y_roll_std_28"]].fillna({"y_roll_std_28": 1.0}),
        on="item_id",
        how="left",
    )

    # Parse item_id: "FOODS_1_001_CA_1" → category, dept, sku_id, state, store
    parts = df["item_id"].str.split("_")
    df["category"] = parts.str[0]
    df["dept"]     = parts.str[0] + "_" + parts.str[1]
    df["sku_id"]   = parts.str[0] + "_" + parts.str[1] + "_" + parts.str[2]
    df["state"]    = parts.str[3]
    df["store"]    = parts.str[3] + "_" + parts.str[4]

    df["avg_daily_demand"]  = (df["pred_h28"] / 28).clip(lower=0)
    df["demand_next_28d"]   = df["pred_h28"].clip(lower=0)
    df["demand_lead_time"]  = df["pred_h07"].clip(lower=0)

    df["sigma_daily"]       = df["y_roll_std_28"].fillna(1.0).clip(lower=0.01)
    df["sigma_lead_time"]   = df["sigma_daily"] * np.sqrt(LEAD_TIME)
    df["safety_stock"]      = (Z * df["sigma_lead_time"]).clip(lower=0)
    df["reorder_point"]     = df["demand_lead_time"] + df["safety_stock"]
    df["current_stock_sim"] = np.ceil(df["avg_daily_demand"] * 14).clip(lower=0)
    df["order_qty"]         = np.maximum(
        0,
        np.ceil(df["demand_next_28d"] + df["safety_stock"] - df["current_stock_sim"]),
    )
    df["days_until_stockout"] = (
        (df["current_stock_sim"] / df["avg_daily_demand"].replace(0, np.nan))
        .fillna(999)
        .clip(upper=999)
    )

    df["priority"] = df.apply(_priority, axis=1)
    df["reorder_flag"] = (df["priority"] == "CRITICAL").astype(int)

    return df.drop(columns=["y_roll_std_28"])


def _priority(row) -> str:
    if row["current_stock_sim"] < row["reorder_point"]:
        return "CRITICAL"
    if row["days_until_stockout"] < LEAD_TIME * 2:
        return "WARNING"
    return "OK"
