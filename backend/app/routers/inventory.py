from fastapi import APIRouter, HTTPException, Query
import app.state as state

router = APIRouter()


def _filter(df, store, category, state_filter, priority, search):
    if store:
        df = df[df["store"] == store]
    if category:
        df = df[df["category"] == category]
    if state_filter:
        df = df[df["state"] == state_filter]
    if priority:
        df = df[df["priority"] == priority]
    if search:
        df = df[df["item_id"].str.contains(search, case=False, na=False)]
    return df


@router.get("/inventory")
def get_inventory(
    store: str = Query(None),
    category: str = Query(None),
    state_filter: str = Query(None, alias="state"),
    priority: str = Query(None),
    search: str = Query(None),
    sort_by: str = Query("order_qty"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    inv = state.inventory_df
    if inv is None or inv.empty:
        return {"items": [], "total": 0, "page": page, "page_size": page_size,
                "summary": {"total": 0, "critical": 0, "warning": 0, "total_order_qty": 0, "avg_safety_stock": 0}}

    df = _filter(inv.copy(), store, category, state_filter, priority, search)

    # summary on filtered set
    summary = {
        "total": len(df),
        "critical": int((df["priority"] == "CRITICAL").sum()),
        "warning": int((df["priority"] == "WARNING").sum()),
        "total_order_qty": int(df["order_qty"].sum()),
        "avg_safety_stock": round(float(df["safety_stock"].mean()), 2) if len(df) else 0,
    }

    # sort
    if sort_by in df.columns:
        df = df.sort_values(sort_by, ascending=(sort_dir == "asc"))

    # paginate
    total = len(df)
    start = (page - 1) * page_size
    items = df.iloc[start: start + page_size].fillna(0)

    return {
        "items": items.to_dict(orient="records"),
        "total": total,
        "page": page,
        "page_size": page_size,
        "summary": summary,
    }


@router.get("/inventory/summary")
def get_summary():
    inv = state.inventory_df
    if inv is None or inv.empty:
        return {"total": 0, "critical": 0, "warning": 0, "total_order_qty": 0, "avg_safety_stock": 0}
    return {
        "total": len(inv),
        "critical": int((inv["priority"] == "CRITICAL").sum()),
        "warning": int((inv["priority"] == "WARNING").sum()),
        "total_order_qty": int(inv["order_qty"].sum()),
        "avg_safety_stock": round(float(inv["safety_stock"].mean()), 2),
    }


@router.get("/inventory/{item_id}")
def get_item(item_id: str):
    inv = state.inventory_df
    if inv is None or inv.empty:
        raise HTTPException(status_code=404, detail="No data loaded")
    row = inv[inv["item_id"] == item_id]
    if row.empty:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found")
    return row.iloc[0].fillna(0).to_dict()
