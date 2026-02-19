CREATE TABLE IF NOT EXISTS call_records (
  id           TEXT PRIMARY KEY,
  caller_name  TEXT NOT NULL DEFAULT '알 수 없음',
  caller_phone TEXT NOT NULL,
  started_at   TEXT NOT NULL,
  ended_at     TEXT,
  duration_sec INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'completed',
  summary      TEXT,
  sentiment    TEXT,
  transcript   TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
  id                BIGSERIAL PRIMARY KEY,
  owner_name        TEXT NOT NULL,
  owner_phone       TEXT NOT NULL UNIQUE,
  vehicle_model     TEXT NOT NULL DEFAULT '차량',
  vehicle_type      TEXT NOT NULL DEFAULT '세단',
  reg_year          INTEGER,
  reg_km            INTEGER DEFAULT 0,
  first_visit_km    INTEGER,
  first_visit_date  TEXT,
  last_visit_km     INTEGER,
  last_visit_date   TEXT,
  measured_avg_km   REAL,
  visit_count       INTEGER DEFAULT 0,
  notes             TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS service_history (
  id           BIGSERIAL PRIMARY KEY,
  vehicle_id   BIGINT NOT NULL REFERENCES vehicles(id),
  item_key     TEXT NOT NULL,
  done_at_km   INTEGER NOT NULL,
  done_at_date TEXT NOT NULL,
  next_due_km  INTEGER NOT NULL,
  note         TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS rce_logs (
  id           BIGSERIAL PRIMARY KEY,
  vehicle_id   BIGINT NOT NULL REFERENCES vehicles(id),
  phone        TEXT NOT NULL,
  message      TEXT NOT NULL,
  items_alerted TEXT NOT NULL DEFAULT '[]',
  status       TEXT NOT NULL DEFAULT 'sent',
  sent_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  twilio_sid   TEXT
);

CREATE TABLE IF NOT EXISTS receipts (
  id         BIGSERIAL PRIMARY KEY,
  vendor     TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  date       TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT '기타',
  items      TEXT NOT NULL DEFAULT '[]',
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id          BIGSERIAL PRIMARY KEY,
  date        TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  amount      INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('income','expense')),
  receipt_id  BIGINT REFERENCES receipts(id),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id           BIGSERIAL PRIMARY KEY,
  vehicle_id   BIGINT REFERENCES vehicles(id),
  owner_name   TEXT NOT NULL,
  owner_phone  TEXT NOT NULL,
  vehicle_model TEXT,
  service_type TEXT NOT NULL,
  start_time   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'confirmed',
  notes        TEXT,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);