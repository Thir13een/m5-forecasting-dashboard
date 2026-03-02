import json
import logging
from typing import AsyncGenerator

from groq import AsyncGroq

import app.state as state
from app.config import settings

logger = logging.getLogger(__name__)


def _build_system_prompt() -> str:
    inv = state.inventory_df

    if inv is None or inv.empty:
        return (
            "You are an AI assistant for a retail inventory management system. "
            "No inventory data is loaded yet. Tell the user to upload a sales CSV file."
        )

    total     = len(inv)
    critical  = int((inv["priority"] == "CRITICAL").sum())
    warning   = int((inv["priority"] == "WARNING").sum())
    ok        = int((inv["priority"] == "OK").sum())
    order_qty = int(inv["order_qty"].sum())

    out_today  = int((inv["days_until_stockout"] < 1).sum())
    out_3days  = int((inv["days_until_stockout"] < 3).sum())
    out_7days  = int((inv["days_until_stockout"] < 7).sum())

    # top 15 by order qty (all statuses)
    top_by_qty = inv.nlargest(15, "order_qty")[
        ["item_id", "store", "category", "order_qty", "days_until_stockout", "avg_daily_demand", "priority"]
    ]
    top_by_qty_rows = ""
    for _, r in top_by_qty.iterrows():
        days = "∞" if r["days_until_stockout"] >= 999 else f"{r['days_until_stockout']:.1f} days"
        top_by_qty_rows += (
            f"  - {r['item_id']} | {r['store']} | {r['category']} | "
            f"Order: {int(r['order_qty'])} units | Days left: {days} | "
            f"Daily sales: {r['avg_daily_demand']:.2f} | Status: {r['priority']}\n"
        )

    # top 15 critical items
    crit_df = inv[inv["priority"] == "CRITICAL"]
    top_urgent_rows = "| Item ID | Store | Category | Units to Order | Days Left | Daily Sales |\n"
    top_urgent_rows += "|---|---|---|---|---|---|\n"
    if not crit_df.empty:
        top_urgent = crit_df.nlargest(15, "order_qty")[
            ["item_id", "store", "category", "order_qty", "days_until_stockout", "avg_daily_demand"]
        ]
        for _, r in top_urgent.iterrows():
            days = "∞" if r["days_until_stockout"] >= 999 else f"{r['days_until_stockout']:.1f}"
            top_urgent_rows += (
                f"| {r['item_id']} | {r['store']} | {r['category']} | "
                f"{int(r['order_qty'])} | {days} days | {r['avg_daily_demand']:.2f} |\n"
            )
    else:
        top_urgent_rows += "| (no CRITICAL items) | | | | | |\n"

    # per-store breakdown
    store_all = (
        inv.groupby("store")
        .agg(
            items=("item_id", "count"),
            avg_demand=("avg_daily_demand", "mean"),
            total_order=("order_qty", "sum"),
            critical=("priority", lambda x: (x == "CRITICAL").sum()),
            warning=("priority", lambda x: (x == "WARNING").sum()),
        )
        .sort_values("critical", ascending=False)
    )
    store_str = "| Store | Avg Daily Demand | SKUs | Units to Order | Critical | Warning |\n"
    store_str += "|---|---|---|---|---|---|\n"
    for store, r in store_all.iterrows():
        store_str += (
            f"| {store} | {r['avg_demand']:.2f} units/day | {int(r['items'])} | "
            f"{int(r['total_order']):,} | {int(r['critical'])} | {int(r['warning'])} |\n"
        )

    # per-category breakdown
    cat_stats = (
        inv.groupby("category")
        .agg(
            total=("item_id", "count"),
            critical=("priority", lambda x: (x == "CRITICAL").sum()),
            warning=("priority", lambda x: (x == "WARNING").sum()),
            order_qty=("order_qty", "sum"),
        )
        .sort_values("critical", ascending=False)
    )
    cat_str = "| Category | SKUs | Critical | Warning | Units to Order |\n"
    cat_str += "|---|---|---|---|---|\n"
    for cat, r in cat_stats.iterrows():
        cat_str += (
            f"| {cat} | {int(r['total'])} | {int(r['critical'])} | "
            f"{int(r['warning'])} | {int(r['order_qty']):,} |\n"
        )

    return f"""You are an expert inventory AI assistant for a retail demand forecasting system (LightGBM, RMSSE 0.98).

FORMATTING RULES — follow these strictly:
- ALWAYS put spaces between words: "top FOODS items" not "topFOODSitems", "1,662 units" not "1,662units"
- ALWAYS put a space between a number and its unit: "108 units", "3 days", "0 items" — NEVER "108units" or "3days"
- ALWAYS put spaces around **bold** markers: "the **FOODS** category" not "the**FOODS**category"
- Use markdown tables (with | headers |) when listing more than 3 items
- Use **bold** only for key numbers and item IDs — never wrap whole phrases
- Keep answers concise and structured — lead with the direct answer, then supporting detail
- Numbers over 1000 must use commas: 30,490 not 30490

INVENTORY DATA (use this as your single source of truth):

## Summary
| Metric | Value |
|---|---|
| Total SKUs | {total:,} |
| CRITICAL — order immediately | {critical:,} |
| WARNING — order soon | {warning:,} |
| OK — well stocked | {ok:,} |
| Total units to order today | {order_qty:,} |

## Stockout Risk
| Timeframe | Items at risk |
|---|---|
| Stocking out today (< 1 day) | {out_today} items |
| Stocking out within 3 days | {out_3days} items |
| Stocking out within 7 days | {out_7days} items |

## By Category
{cat_str}
## By Store — ALL {total:,} SKUs (use this for any per-store question)
{store_str}
## Top 15 Items by Order Quantity (all statuses — matches dashboard grid sorted by "Units to Order")
{top_by_qty_rows}
## Top 15 Most Urgent CRITICAL Items (sorted by units to order — highest volume first)
{top_urgent_rows}
## Key Distinctions
- ALWAYS use the "By Store" table above for per-store counts/quantities — NEVER count from the Top 15 lists
- ALWAYS use the "By Category" table above for per-category counts — NEVER count from the Top 15 lists
- The Top 15 lists are item-level samples only — they do NOT represent all items in a store or category
- "Highest order quantity" = most units needed (includes Well Stocked high-volume FOODS items)
- "Most urgent" = CRITICAL items closest to running out (need immediate action regardless of quantity)
- A FOODS item can need 1,500+ units but still be "Well Stocked" if it has 14 days of inventory on hand
- CRITICAL items may need fewer units but face immediate stockout risk

## System Info
- Forecasts: 28-day LightGBM predictions
- Safety stock: 90% service level (Z = 1.282), 7-day lead time
- Stores: CA-1, CA-2, CA-3, CA-4 (California) | TX-1, TX-2, TX-3 (Texas) | WI-1, WI-2, WI-3 (Wisconsin)
- Categories: FOODS, HOBBIES, HOUSEHOLD
- "Days until empty" = simulated stock on hand ÷ avg daily demand
"""


async def stream_chat(
    message: str,
    history: list[dict],
) -> AsyncGenerator[str, None]:
    client = AsyncGroq(
        api_key=settings.groq_api_key,
    )

    messages = [{"role": "system", "content": _build_system_prompt()}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    try:
        stream = await client.chat.completions.create(
            model="qwen/qwen3-32b",
            messages=messages,
            stream=True,
            max_tokens=1500,
            temperature=0.3,
        )
        # Buffer to strip <think>...</think> reasoning blocks emitted by Qwen3
        buf = ""
        in_think = False
        async for chunk in stream:
            text = chunk.choices[0].delta.content or ""
            if not text:
                continue
            buf += text
            # Drain buf, skipping content inside <think>...</think>
            while buf:
                if in_think:
                    end = buf.find("</think>")
                    if end == -1:
                        buf = ""  # still inside think block, discard
                        break
                    buf = buf[end + len("</think>"):]
                    in_think = False
                else:
                    start = buf.find("<think>")
                    if start == -1:
                        yield f"data: {json.dumps({'text': buf})}\n\n"
                        buf = ""
                        break
                    if start > 0:
                        yield f"data: {json.dumps({'text': buf[:start]})}\n\n"
                    buf = buf[start + len("<think>"):]
                    in_think = True
    except Exception as e:
        logger.error("Groq error: %s", e)
        yield f"data: {json.dumps({'text': f'Error: {e}'})}\n\n"
    finally:
        yield "data: [DONE]\n\n"
