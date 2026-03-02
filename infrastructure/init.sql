CREATE TABLE IF NOT EXISTS pipeline_runs (
  id              SERIAL PRIMARY KEY,
  ran_at          TIMESTAMP DEFAULT NOW(),
  total_items     INT,
  critical_count  INT,
  warning_count   INT,
  total_order_qty BIGINT,
  source_file     TEXT
);
