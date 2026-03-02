<div align="center">

# M5 Demand Forecasting Dashboard

### AI-powered retail inventory management — predict demand, prevent stockouts, optimize reorders

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![LightGBM](https://img.shields.io/badge/LightGBM-RMSSE_0.98-2563eb?style=for-the-badge)](https://lightgbm.readthedocs.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Groq](https://img.shields.io/badge/Groq-Qwen3--32B-f97316?style=for-the-badge)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=for-the-badge&logo=docker)](https://www.docker.com/)

**Built in 2 weeks · Made by [Krishna Sonji](https://github.com/Thir13een) & Shweta Bankar**

</div>

---

## What is this?

This project applies machine learning to the real-world **M5 Forecasting** dataset (Walmart retail sales across the United States). It combines a trained LightGBM model with a full-stack web application to deliver an end-to-end inventory intelligence system.

Given historical sales data, the system:
- **Predicts demand** for the next 1, 7, 14, and 28 days per SKU
- **Calculates safety stock** based on demand volatility and a 7-day lead time
- **Flags critical items** that are close to stockout and need immediate reordering
- **Answers natural language questions** about inventory via an AI chat assistant

---

## Key Features

| Feature | Description |
|---|---|
| **Inventory Dashboard** | Sortable, filterable grid of all 30,490 SKUs with status (CRITICAL / WARNING / OK) |
| **Inline Forecast View** | Click any row to expand a 28-day bar chart + key metrics inline |
| **AI Inventory Assistant** | Chat with Qwen3-32B (via Groq) pre-loaded with live inventory context |
| **CSV Upload** | Upload new sales data to re-run the full forecasting pipeline |
| **Reorder Quantities** | Per-SKU order recommendations based on 28-day demand + safety buffer |
| **Stockout Timelines** | Days until empty for every product across all stores |

---

## Tech Stack

### Machine Learning
- **LightGBM** — gradient boosting for direct multi-horizon forecasting (h=1, 7, 14, 28)
- **Feature engineering** — lag features (1–364 days), rolling mean/std, zero-sale rate, days since last sale, cyclical time encodings (day-of-week, month), SNAP flags, event indicators
- **Safety stock formula** — `Z × σ_lead_time` at 90% service level (Z = 1.282)
- **Accuracy** — RMSSE 0.98 on M5 competition data

### Backend
- **FastAPI** — async REST API with streaming SSE endpoints
- **pandas / numpy** — data processing and feature computation
- **PostgreSQL** — inventory state persistence
- **Groq API** — LLM inference (Qwen3-32B) with `<think>` block filtering

### Frontend
- **Next.js 14** — React framework with App Router
- **Bootstrap 5** — layout and utility classes
- **ReactMarkdown + remark-gfm** — renders AI responses with tables and formatting
- **Custom inline styles** — pixel-precise component styling

### Infrastructure
- **Docker Compose** — multi-container orchestration (postgres + backend + frontend)
- **GitHub Releases** — model artifact hosting (~1.1 GB of LightGBM `.txt` files)

---

## Model Performance

| Metric | Value |
|---|---|
| Algorithm | LightGBM (direct multi-horizon) |
| RMSSE | 0.98 |
| SKUs | 30,490 |
| Stores | 10 (CA-1–4, TX-1–3, WI-1–3) |
| Categories | FOODS, HOBBIES, HOUSEHOLD |
| Forecast horizon | 28 days |
| Training data | M5 Forecasting (Kaggle) |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Thir13een/m5-forecasting-dashboard.git
cd m5-forecasting-dashboard
```

### 2. Download the pre-trained models

Download all 5 files from the [v1.0 release](https://github.com/Thir13een/m5-forecasting-dashboard/releases/tag/v1.0) into a local folder:

| File | Size | Link |
|---|---|---|
| `lgb_direct_h01.txt` | 195 MB | [Download](https://github.com/Thir13een/m5-forecasting-dashboard/releases/download/v1.0/lgb_direct_h01.txt) |
| `lgb_direct_h07.txt` | 304 MB | [Download](https://github.com/Thir13een/m5-forecasting-dashboard/releases/download/v1.0/lgb_direct_h07.txt) |
| `lgb_direct_h14.txt` | 325 MB | [Download](https://github.com/Thir13een/m5-forecasting-dashboard/releases/download/v1.0/lgb_direct_h14.txt) |
| `lgb_direct_h28.txt` | 320 MB | [Download](https://github.com/Thir13een/m5-forecasting-dashboard/releases/download/v1.0/lgb_direct_h28.txt) |
| `feature_cols.csv` | 1 KB | [Download](https://github.com/Thir13een/m5-forecasting-dashboard/releases/download/v1.0/feature_cols.csv) |

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
MODELS_PATH=/absolute/path/to/models/folder
GROQ_API_KEY=your_groq_api_key_here
DATABASE_URL=postgresql://m5:m5pass@postgres:5432/m5db
```

Get a free Groq API key at [console.groq.com](https://console.groq.com).

### 4. Run

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API docs | http://localhost:8000/docs |

---

## Project Structure

```
m5-forecasting-dashboard/
├── backend/
│   ├── app/
│   │   ├── routers/            # FastAPI endpoints (inventory, forecast, chat, upload, health)
│   │   └── services/           # LightGBM inference, feature engineering, chat, demo loader
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # UI components (InventoryGrid, ChatWindow, DemandChart, ...)
│   ├── lib/                    # API client, TypeScript types, utils
│   └── Dockerfile
├── infrastructure/
│   └── init.sql                # PostgreSQL schema
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Authors

Built by **Krishna Sonji** and **Shweta Bankar** over 2 weeks as a full-stack ML deployment project.

[![GitHub](https://img.shields.io/badge/GitHub-Thir13een-181717?style=flat-square&logo=github)](https://github.com/Thir13een)
