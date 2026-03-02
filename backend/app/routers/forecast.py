from fastapi import APIRouter, HTTPException
import app.state as state

router = APIRouter()


@router.get("/forecast/{item_id}")
def get_forecast(item_id: str):
    fc = state.forecast_df
    if fc is None or fc.empty:
        raise HTTPException(status_code=404, detail="No forecast data loaded")
    row = fc[fc["item_id"] == item_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Forecast for {item_id} not found")
    r = row.iloc[0]
    return {
        "item_id": item_id,
        "pred_h01": round(float(r.get("pred_h01", 0)), 3),
        "pred_h07": round(float(r.get("pred_h07", 0)), 3),
        "pred_h14": round(float(r.get("pred_h14", 0)), 3),
        "pred_h28": round(float(r.get("pred_h28", 0)), 3),
    }
