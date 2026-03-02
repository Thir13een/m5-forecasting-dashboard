from fastapi import APIRouter
from app.services.model_store import ModelStore
import app.state as state

router = APIRouter()


@router.get("/health")
def health():
    inv = state.inventory_df
    return {
        "status": "ok",
        "models_loaded": ModelStore.is_loaded(),
        "model_count": 4 if ModelStore.is_loaded() else 0,
        "total_items": len(inv) if inv is not None else 0,
        "last_updated": state.last_updated,
    }
