import io
import logging
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy import text

import app.state as state
from app.config import settings
from app.services.feature_engineering import build_features, validate_columns
from app.services.inference import run_full_pipeline

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/upload")
async def upload_sales(file: UploadFile = File(...)):
    if not file.filename.endswith((".csv", ".parquet")):
        raise HTTPException(status_code=400, detail="Only .csv or .parquet files accepted")

    content = await file.read()

    try:
        if file.filename.endswith(".parquet"):
            df = pd.read_parquet(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    missing = validate_columns(df)
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required columns: {missing}"
        )

    logger.info("Running feature engineering on %d rows...", len(df))
    try:
        featured = build_features(df)
        forecast_df, inventory_df = run_full_pipeline(featured)
    except Exception as e:
        logger.exception("Pipeline failed")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    state.set_state(inventory_df, forecast_df, source=file.filename)

    # log to postgres
    try:
        engine = create_async_engine(settings.database_url)
        async with AsyncSession(engine) as session:
            await session.execute(
                text("""
                    INSERT INTO pipeline_runs (total_items, critical_count, warning_count, total_order_qty, source_file)
                    VALUES (:ti, :cc, :wc, :oq, :sf)
                """),
                {
                    "ti": len(inventory_df),
                    "cc": int((inventory_df["priority"] == "CRITICAL").sum()),
                    "wc": int((inventory_df["priority"] == "WARNING").sum()),
                    "oq": int(inventory_df["order_qty"].sum()),
                    "sf": file.filename,
                },
            )
            await session.commit()
        await engine.dispose()
    except Exception as e:
        logger.warning("Could not log to DB: %s", e)

    return {
        "success": True,
        "total_items": len(inventory_df),
        "critical_count": int((inventory_df["priority"] == "CRITICAL").sum()),
        "warning_count": int((inventory_df["priority"] == "WARNING").sum()),
        "total_order_qty": int(inventory_df["order_qty"].sum()),
        "last_updated": state.last_updated,
    }
