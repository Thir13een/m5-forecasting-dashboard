import pandas as pd
import numpy as np

RENAME = {
    "id": "item_id",
    "d": "day_id",
    "sales": "y",
    "sell_price": "price",
    "sell_price_isna": "price_missing",
    "snap": "is_snap",
    "wday_sin": "dow_sin",
    "wday_cos": "dow_cos",
    "month_sin": "mon_sin",
    "month_cos": "mon_cos",
    "is_event": "has_event",
    "event_cultural": "evt_cultural",
    "event_national": "evt_national",
    "event_none": "evt_none",
    "event_religious": "evt_religious",
    "event_sporting": "evt_sporting",
}

LAGS = [1, 7, 14, 28, 56, 84, 182, 364]
ROLL_MEAN = [7, 28, 56, 182, 364]
ROLL_STD = [28, 56]

REQUIRED_COLS = {
    "id", "d", "sales", "sell_price", "sell_price_isna", "snap",
    "wday_sin", "wday_cos", "month_sin", "month_cos",
    "is_event", "event_cultural", "event_national",
    "event_none", "event_religious", "event_sporting",
}


def validate_columns(df: pd.DataFrame) -> list[str]:
    missing = REQUIRED_COLS - set(df.columns)
    return sorted(missing)


def build_features(raw_df: pd.DataFrame) -> pd.DataFrame:
    df = raw_df.rename(columns=RENAME).copy()

    df["day_int"] = df["day_id"].str.extract(r"(\d+)").astype(int)
    df = df.sort_values(["item_id", "day_int"]).reset_index(drop=True)

    # lags
    for lag in LAGS:
        df[f"y_lag_{lag}"] = df.groupby("item_id")["y"].shift(lag)

    # rolling features on lag-1 (no lookahead)
    y_lag1 = df.groupby("item_id")["y"].shift(1)
    for w in ROLL_MEAN:
        df[f"y_roll_mean_{w}"] = (
            y_lag1.groupby(df["item_id"]).transform(lambda s: s.rolling(w, min_periods=1).mean())
        )
    for w in ROLL_STD:
        df[f"y_roll_std_{w}"] = (
            y_lag1.groupby(df["item_id"]).transform(lambda s: s.rolling(w, min_periods=2).std())
        )
    df["rolling_median_28"] = (
        y_lag1.groupby(df["item_id"]).transform(lambda s: s.rolling(28, min_periods=1).median())
    )

    # days since last sale
    df["_last_nz_day"] = df.groupby("item_id").apply(
        lambda g: g["day_int"].where(g["y"] > 0).ffill()
    ).reset_index(level=0, drop=True)
    df["days_since_last_sale"] = (df["day_int"] - df["_last_nz_day"]).fillna(df["day_int"])
    df.drop(columns=["_last_nz_day"], inplace=True)

    # zero rate and nonzero count (28-day)
    df["zero_rate_28"] = (
        y_lag1.groupby(df["item_id"]).transform(
            lambda s: s.rolling(28, min_periods=1).apply(lambda x: (x == 0).mean())
        )
    )
    df["rolling_nonzero_count_28"] = (
        y_lag1.groupby(df["item_id"]).transform(
            lambda s: s.rolling(28, min_periods=1).apply(lambda x: (x > 0).sum())
        )
    )

    return df
