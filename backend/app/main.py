import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.state as state
from app.config import settings
from app.services.demo_loader import load_demo_state
from app.services.model_store import ModelStore
from app.routers import health, inventory, forecast, upload, chat

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(name)s  %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== M5 Forecasting System starting ===")

    ModelStore.load(settings.model_dir)
    inventory_df, forecast_df = load_demo_state(settings.data_dir)
    state.set_state(inventory_df, forecast_df, source="demo data")

    logger.info("=== Ready — %d items loaded ===", len(inventory_df))
    yield
    logger.info("Shutting down.")


app = FastAPI(title="M5 Demand Forecasting API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,    prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(forecast.router,  prefix="/api")
app.include_router(upload.router,    prefix="/api")
app.include_router(chat.router,      prefix="/api")
