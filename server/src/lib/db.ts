/**
 * lib/db.ts
 * SQLite persistence layer for BizPilot server.
 *
 * Tables:
 *   call_records      — 통화 기록 (AI 전화 에이전트)
 *   vehicles          — 차량 정보 (주행거리 기반 예측의 핵심)
 *   service_history   — 정비 이력 (소모품별 마지막 교체 km)
 *   rce_logs          — RCE 발송 이력
 *
 * Mileage Prediction Tiers:
 *   Tier 0: 전국 평균 (첫 방문 전) — 월 1,250 km
 *   Tier 1: 등록연도 + 첫 방문 계기판 → 생애 평균 즉시 계산
 *   Tier 2: 2회+ 방문 → 실측 방문 간 평균으로 업데이트
 *   Tier 3: 3회+ → 계절 보정 + 이상값 필터링
 */
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { CallRecord, TranscriptEntry, Receipt, LedgerEntry } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'bizpilot.db');

// National Average km/month by vehicle type
const AVG_KM_BY_TYPE: Record<string, number> = {
  경차: 700,
  세단: 1200,
  SUV: 1300,
  트럭: 2500,
  승합: 2000,
  기본: 1250,
};

// Maintenance intervals (km)
export const MAINTENANCE_INTERVALS: Record<string, { km: number; label: string; icon: string }> = {
  engine_oil:       { km: 10000, label: '엔진오일 (합성)',      icon: '🛢️' },
  engine_oil_basic: { km: 5000,  label: '엔진오일 (일반)',      icon: '🛢️' },
  air_filter:       { km: 20000, label: '에어필터',             icon: '💨' },
  ac_filter:        { km: 12000, label: '에어컨 필터',          icon: '❄️' },
  tire_rotation:    { km: 10000, label: '타이어 위치 교환',     icon: '🔄' },
  tire_replace:     { km: 50000, label: '타이어 교체',          icon: '🔧' },
  brake_pad:        { km: 40000, label: '브레이크 패드',        icon: '🛑' },
  spark_plug:       { km: 40000, label: '점화플러그',           icon: '⚡' },
  transmission_oil: { km: 50000, label: '미션오일',             icon: '⚙️' },
  coolant:          { km: 40000, label: '냉각수',               icon: '🌡️' },
};

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
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
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Vehicle master: one vehicle per customer (simplified)
    CREATE TABLE IF NOT EXISTS vehicles (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_name        TEXT NOT NULL,
      owner_phone       TEXT NOT NULL UNIQUE,
      vehicle_model     TEXT NOT NULL DEFAULT '차량',
      vehicle_type      TEXT NOT NULL DEFAULT '세단',
      reg_year          INTEGER,           -- 차량 등록 연도 (4자리)
      reg_km            INTEGER DEFAULT 0, -- 등록/구매 당시 km (신차=0, 중고차=실제값)
      first_visit_km    INTEGER,           -- 정비소 최초 방문 시 계기판
      first_visit_date  TEXT,              -- 최초 방문일 (ISO 8601 날짜)
      last_visit_km     INTEGER,           -- 가장 최근 방문 시 계기판
      last_visit_date   TEXT,              -- 최근 방문일
      measured_avg_km   REAL,             -- 실측 월 평균 km (2회+ 방문 시 업데이트)
      visit_count       INTEGER DEFAULT 0,
      notes             TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Service history per vehicle per item
    CREATE TABLE IF NOT EXISTS service_history (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id),
      item_key     TEXT NOT NULL,   -- e.g. 'engine_oil', 'air_filter'
      done_at_km   INTEGER NOT NULL,
      done_at_date TEXT NOT NULL,
      next_due_km  INTEGER NOT NULL,
      note         TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- RCE send log
    CREATE TABLE IF NOT EXISTS rce_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id   INTEGER NOT NULL REFERENCES vehicles(id),
      phone        TEXT NOT NULL,
      message      TEXT NOT NULL,
      items_alerted TEXT NOT NULL DEFAULT '[]', -- JSON array of item_keys
      status       TEXT NOT NULL DEFAULT 'sent',
      sent_at      TEXT NOT NULL DEFAULT (datetime('now')),
      twilio_sid   TEXT
    );

    -- Receipts (OCR scanned)
    CREATE TABLE IF NOT EXISTS receipts (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor     TEXT NOT NULL,
      amount     INTEGER NOT NULL,
      date       TEXT NOT NULL,
      category   TEXT NOT NULL DEFAULT '기타',
      items      TEXT NOT NULL DEFAULT '[]',  -- JSON
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Ledger entries
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      description TEXT NOT NULL,
      category    TEXT NOT NULL,
      amount      INTEGER NOT NULL,
      type        TEXT NOT NULL CHECK(type IN ('income','expense')),
      receipt_id  INTEGER REFERENCES receipts(id),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Bookings (Realtime management)
    CREATE TABLE IF NOT EXISTS bookings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id   INTEGER REFERENCES vehicles(id),
      owner_name   TEXT NOT NULL,
      owner_phone  TEXT NOT NULL,
      vehicle_model TEXT,
      service_type TEXT NOT NULL,
      start_time   TEXT NOT NULL, -- ISO 8601 (YYYY-MM-DD HH:mm)
      status       TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, pending, cancelled
      notes        TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ── Call Records ──────────────────────────────────────────

export function insertCallRecord(record: CallRecord & { transcript?: TranscriptEntry[] }): void {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO call_records
      (id, caller_name, caller_phone, started_at, ended_at, duration_sec, status, summary, sentiment, transcript)
    VALUES
      (@id, @callerName, @callerPhone, @startedAt, @endedAt, @durationSec, @status, @summary, @sentiment, @transcript)
  `).run({
    id: record.id,
    callerName: record.callerName ?? '알 수 없음',
    callerPhone: record.callerPhone,
    startedAt: record.startedAt,
    endedAt: record.endedAt ?? null,
    durationSec: record.durationSec ?? 0,
    status: record.status,
    summary: record.summary ?? null,
    sentiment: record.sentiment ?? null,
    transcript: JSON.stringify(record.transcript ?? []),
  });
}

export function listCallRecords(limit = 50): CallRecord[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM call_records ORDER BY started_at DESC LIMIT ?`
  ).all(limit) as Record<string, unknown>[];
  return rows.map(rowToCallRecord);
}

export function getCallRecord(id: string): (CallRecord & { transcript: TranscriptEntry[] }) | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM call_records WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToCallRecord(row) as CallRecord & { transcript: TranscriptEntry[] };
}

function rowToCallRecord(row: Record<string, unknown>): CallRecord {
  return {
    id: row.id as string,
    callerName: row.caller_name as string,
    callerPhone: row.caller_phone as string,
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | undefined,
    durationSec: row.duration_sec as number,
    status: row.status as CallRecord['status'],
    summary: row.summary as string | undefined,
    sentiment: row.sentiment as CallRecord['sentiment'],
    transcript: row.transcript ? JSON.parse(row.transcript as string) as TranscriptEntry[] : [],
  };
}

// ── Vehicle & Mileage Prediction ─────────────────────────

export interface Vehicle {
  id: number;
  ownerName: string;
  ownerPhone: string;
  vehicleModel: string;
  vehicleType: string;
  regYear?: number;
  regKm: number;
  firstVisitKm?: number;
  firstVisitDate?: string;
  lastVisitKm?: number;
  lastVisitDate?: string;
  measuredAvgKm?: number;
  visitCount: number;
}

export interface MaintenanceStatus {
  itemKey: string;
  label: string;
  icon: string;
  lastDoneKm: number;
  nextDueKm: number;
  kmRemaining: number;   // estimated km until next service
  daysRemaining: number; // estimated days until next service
  urgent: boolean;       // kmRemaining < 1000
}

/**
 * Estimate current odometer reading based on available data.
 * Uses a 3-tier system:
 *   T1: registration year + last visit km → extrapolate
 *   T2: measured avg from 2+ visits → extrapolate
 *   T0: national average fallback
 */
export function estimateCurrentKm(vehicle: Vehicle): { km: number; tier: 0 | 1 | 2 } {
  const now = new Date();

  // Tier 2: We have measured avg from multiple visits
  if (vehicle.measuredAvgKm && vehicle.lastVisitKm && vehicle.lastVisitDate) {
    const monthsSince = monthDiff(new Date(vehicle.lastVisitDate), now);
    return {
      km: Math.round(vehicle.lastVisitKm + vehicle.measuredAvgKm * monthsSince),
      tier: 2,
    };
  }

  // Tier 1: We have first-visit km + registration year
  if (vehicle.firstVisitKm && vehicle.firstVisitDate) {
    // Calculate lifetime avg from reg_year if available
    let avgKm: number;
    if (vehicle.regYear) {
      const regDate = new Date(vehicle.regYear, 0, 1); // Jan of reg year
      const lifeMonths = monthDiff(regDate, new Date(vehicle.firstVisitDate));
      const kmAtFirstVisit = vehicle.firstVisitKm - vehicle.regKm;
      avgKm = lifeMonths > 0 ? kmAtFirstVisit / lifeMonths : getDefaultAvg(vehicle.vehicleType);
    } else {
      avgKm = getDefaultAvg(vehicle.vehicleType);
    }
    const monthsSince = monthDiff(new Date(vehicle.firstVisitDate), now);
    return {
      km: Math.round(vehicle.firstVisitKm + avgKm * monthsSince),
      tier: 1,
    };
  }

  // Tier 0: No data — national average (shouldn't normally reach here)
  return {
    km: 0,
    tier: 0,
  };
}

function getDefaultAvg(vehicleType: string): number {
  return AVG_KM_BY_TYPE[vehicleType] ?? AVG_KM_BY_TYPE['기본'];
}

function monthDiff(from: Date, to: Date): number {
  return Math.max(0,
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) +
    (to.getDate() - from.getDate()) / 30
  );
}

export function upsertVehicle(data: Omit<Vehicle, 'id' | 'visitCount'>): Vehicle {
  const db = getDb();
  const existing = db.prepare(
    `SELECT * FROM vehicles WHERE owner_phone = ?`
  ).get(data.ownerPhone) as Record<string, unknown> | undefined;

  if (existing) {
    // Update: recalculate measured avg if new visit km given
    let measuredAvg = existing.measured_avg_km as number | null;
    const newVisitCount = (existing.visit_count as number) + 1;

    if (data.lastVisitKm && existing.first_visit_km && existing.first_visit_date) {
      const months = monthDiff(
        new Date(existing.first_visit_date as string),
        new Date()
      );
      if (months > 0) {
        measuredAvg = ((data.lastVisitKm as number) - (existing.first_visit_km as number)) / months;
      }
    }

    db.prepare(`
      UPDATE vehicles SET
        owner_name      = @ownerName,
        vehicle_model   = @vehicleModel,
        vehicle_type    = @vehicleType,
        last_visit_km   = @lastVisitKm,
        last_visit_date = @lastVisitDate,
        measured_avg_km = @measuredAvg,
        visit_count     = @visitCount,
        notes           = @notes,
        updated_at      = datetime('now')
      WHERE owner_phone = @ownerPhone
    `).run({
      ownerName: data.ownerName,
      vehicleModel: data.vehicleModel,
      vehicleType: data.vehicleType,
      lastVisitKm: data.lastVisitKm ?? existing.last_visit_km,
      lastVisitDate: data.lastVisitDate ?? existing.last_visit_date,
      measuredAvg,
      visitCount: newVisitCount,
      notes: data.ownerPhone,
      ownerPhone: data.ownerPhone,
    });
    return getVehicleByPhone(data.ownerPhone)!;
  } else {
    db.prepare(`
      INSERT INTO vehicles
        (owner_name, owner_phone, vehicle_model, vehicle_type, reg_year, reg_km,
         first_visit_km, first_visit_date, last_visit_km, last_visit_date, visit_count)
      VALUES
        (@ownerName, @ownerPhone, @vehicleModel, @vehicleType, @regYear, @regKm,
         @firstVisitKm, @firstVisitDate, @lastVisitKm, @lastVisitDate, 1)
    `).run({
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      vehicleModel: data.vehicleModel,
      vehicleType: data.vehicleType,
      regYear: data.regYear ?? null,
      regKm: data.regKm ?? 0,
      firstVisitKm: data.firstVisitKm ?? null,
      firstVisitDate: data.firstVisitDate ?? null,
      lastVisitKm: data.lastVisitKm ?? null,
      lastVisitDate: data.lastVisitDate ?? null,
    });
    return getVehicleByPhone(data.ownerPhone)!;
  }
}

export function getVehicleByPhone(phone: string): Vehicle | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM vehicles WHERE owner_phone = ?`).get(phone) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToVehicle(row);
}

export function listVehicles(limit = 100): Vehicle[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM vehicles ORDER BY updated_at DESC LIMIT ?`).all(limit) as Record<string, unknown>[];
  return rows.map(rowToVehicle);
}

function rowToVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: row.id as number,
    ownerName: row.owner_name as string,
    ownerPhone: row.owner_phone as string,
    vehicleModel: row.vehicle_model as string,
    vehicleType: row.vehicle_type as string,
    regYear: row.reg_year as number | undefined,
    regKm: (row.reg_km as number) ?? 0,
    firstVisitKm: row.first_visit_km as number | undefined,
    firstVisitDate: row.first_visit_date as string | undefined,
    lastVisitKm: row.last_visit_km as number | undefined,
    lastVisitDate: row.last_visit_date as string | undefined,
    measuredAvgKm: row.measured_avg_km as number | undefined,
    visitCount: row.visit_count as number,
  };
}

// ── Service History ────────────────────────────────────────

export function recordService(vehicleId: number, itemKey: string, doneAtKm: number): void {
  const db = getDb();
  const interval = MAINTENANCE_INTERVALS[itemKey];
  if (!interval) return;
  db.prepare(`
    INSERT INTO service_history (vehicle_id, item_key, done_at_km, done_at_date, next_due_km)
    VALUES (@vehicleId, @itemKey, @doneAtKm, date('now'), @nextDueKm)
  `).run({
    vehicleId,
    itemKey,
    doneAtKm,
    nextDueKm: doneAtKm + interval.km,
  });
}

export function getMaintenanceStatus(vehicle: Vehicle): MaintenanceStatus[] {
  const db = getDb();
  const { km: estimatedKm } = estimateCurrentKm(vehicle);
  const avgKmPerMonth = vehicle.measuredAvgKm ?? getDefaultAvg(vehicle.vehicleType);

  const latestServices = db.prepare(`
    SELECT item_key, MAX(done_at_km) as last_km, MAX(next_due_km) as next_km
    FROM service_history
    WHERE vehicle_id = ?
    GROUP BY item_key
  `).all(vehicle.id) as { item_key: string; last_km: number; next_km: number }[];

  const serviceMap = new Map(latestServices.map(s => [s.item_key, s]));

  return Object.entries(MAINTENANCE_INTERVALS).map(([key, meta]) => {
    const record = serviceMap.get(key);
    const lastDoneKm = record?.last_km ?? 0;
    const nextDueKm = record?.next_km ?? meta.km; // first service at interval km
    const kmRemaining = Math.max(0, nextDueKm - estimatedKm);
    const daysRemaining = avgKmPerMonth > 0 ? Math.round((kmRemaining / avgKmPerMonth) * 30) : 999;

    return {
      itemKey: key,
      label: meta.label,
      icon: meta.icon,
      lastDoneKm,
      nextDueKm,
      kmRemaining,
      daysRemaining,
      urgent: kmRemaining < 1000,
    };
  });
}

/**
 * Get vehicles where any maintenance item is within alert threshold.
 * Default: 1500 km remaining (≈ alert ~35 days before for 1250 km/month driver)
 */
export function getVehiclesDueForAlert(thresholdKm = 1500): Array<{
  vehicle: Vehicle;
  dueItems: MaintenanceStatus[];
  estimatedKm: number;
}> {
  const vehicles = listVehicles();
  const result = [];

  for (const vehicle of vehicles) {
    // Skip if no visit data
    if (!vehicle.firstVisitKm) continue;

    const { km: estimatedKm } = estimateCurrentKm(vehicle);
    const statuses = getMaintenanceStatus(vehicle);
    const dueItems = statuses.filter(s => s.kmRemaining <= thresholdKm);

    if (dueItems.length > 0) {
      // Check: not alerted in last 30 days
      const db = getDb();
      const recentAlert = db.prepare(`
        SELECT id FROM rce_logs
        WHERE vehicle_id = ? AND julianday('now') - julianday(sent_at) < 30
        LIMIT 1
      `).get(vehicle.id);

      if (!recentAlert) {
        result.push({ vehicle, dueItems, estimatedKm });
      }
    }
  }

  return result;
}

// ── RCE Logs ──────────────────────────────────────────────

export function insertRceLog(entry: {
  vehicleId: number;
  phone: string;
  message: string;
  itemsAlerted: string[];
  status: string;
  twilioSid?: string;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO rce_logs (vehicle_id, phone, message, items_alerted, status, twilio_sid)
    VALUES (@vehicleId, @phone, @message, @itemsAlerted, @status, @twilioSid)
  `).run({
    vehicleId: entry.vehicleId,
    phone: entry.phone,
    message: entry.message,
    itemsAlerted: JSON.stringify(entry.itemsAlerted),
    status: entry.status,
    twilioSid: entry.twilioSid ?? null,
  });
}

export function listRceLogs(limit = 50) {
  const db = getDb();
  return db.prepare(`
    SELECT l.*, v.owner_name, v.vehicle_model
    FROM rce_logs l
    JOIN vehicles v ON l.vehicle_id = v.id
    ORDER BY l.sent_at DESC
    LIMIT ?
  `).all(limit);
}

// Legacy compatibility — still used in calls.ts for auto-registration
export function upsertRceCustomer(data: { name: string; phone: string; lastVisit: string; service?: string }): number {
  const vehicle = upsertVehicle({
    ownerName: data.name,
    ownerPhone: data.phone,
    vehicleModel: '차량 정보 미입력',
    vehicleType: '세단',
    lastVisitDate: data.lastVisit,
    regKm: 0,
  });
  return vehicle.id;
}

// ── Receipts ───────────────────────────────────────────────

export function insertReceipt(data: Omit<Receipt, 'id' | 'createdAt' | 'imageUrl'>): Receipt {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO receipts (vendor, amount, date, category, items, status)
    VALUES (@vendor, @amount, @date, @category, @items, @status)
  `).run({
    vendor: data.vendor,
    amount: data.amount,
    date: data.date,
    category: data.category,
    items: JSON.stringify(data.items),
    status: data.status ?? 'pending',
  });
  return getReceiptById(result.lastInsertRowid as number)!;
}

export function getReceiptById(id: number): Receipt | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM receipts WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToReceipt(row);
}

export function listReceipts(limit = 50): Receipt[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM receipts ORDER BY date DESC, created_at DESC LIMIT ?`).all(limit) as Record<string, unknown>[];
  return rows.map(rowToReceipt);
}

export function updateReceiptStatus(id: number, status: 'pending' | 'verified'): void {
  getDb().prepare(`UPDATE receipts SET status = ? WHERE id = ?`).run(status, id);
}

function rowToReceipt(row: Record<string, unknown>): Receipt {
  return {
    id: row.id as number,
    vendor: row.vendor as string,
    amount: row.amount as number,
    date: row.date as string,
    category: row.category as string,
    items: JSON.parse(row.items as string) as Receipt['items'],
    status: row.status as Receipt['status'],
    createdAt: row.created_at as string,
  };
}

// ── Ledger ─────────────────────────────────────────────────

export function insertLedgerEntry(data: Omit<LedgerEntry, 'id' | 'createdAt'>): LedgerEntry {
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO ledger_entries (date, description, category, amount, type, receipt_id)
    VALUES (@date, @description, @category, @amount, @type, @receiptId)
  `).run({
    date: data.date,
    description: data.description,
    category: data.category,
    amount: data.amount,
    type: data.type,
    receiptId: data.receiptId ?? null,
  });
  return getLedgerEntryById(result.lastInsertRowid as number)!;
}

export function getLedgerEntryById(id: number): LedgerEntry | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM ledger_entries WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToLedger(row);
}

export function listLedgerEntries(limit = 100): LedgerEntry[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT * FROM ledger_entries ORDER BY date DESC, created_at DESC LIMIT ?`
  ).all(limit) as Record<string, unknown>[];
  return rows.map(rowToLedger);
}

export function getLedgerSummary(): { totalIncome: number; totalExpense: number; netProfit: number } {
  const db = getDb();
  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const rows = db.prepare(
    `SELECT type, SUM(amount) as total FROM ledger_entries WHERE date LIKE ? GROUP BY type`
  ).all(`${currentMonth}%`) as { type: string; total: number }[];
  const income  = rows.find(r => r.type === 'income')?.total  ?? 0;
  const expense = rows.find(r => r.type === 'expense')?.total ?? 0;
  return { totalIncome: income, totalExpense: expense, netProfit: income - expense };
}

function rowToLedger(row: Record<string, unknown>): LedgerEntry {
  return {
    id: row.id as number,
    date: row.date as string,
    description: row.description as string,
    category: row.category as string,
    amount: row.amount as number,
    type: row.type as LedgerEntry['type'],
    receiptId: row.receipt_id as number | undefined,
    createdAt: row.created_at as string,
  };
}
// ── Bookings ──────────────────────────────────────────────

export interface Booking {
  id: number;
  vehicleId?: number;
  ownerName: string;
  ownerPhone: string;
  vehicleModel?: string;
  serviceType: string;
  startTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

export function createBooking(data: Omit<Booking, 'id'>): Booking {
  const db = getDb();
  const vehicle = getVehicleByPhone(data.ownerPhone);
  
  const result = db.prepare(`
    INSERT INTO bookings (vehicle_id, owner_name, owner_phone, vehicle_model, service_type, start_time, status, notes)
    VALUES (@vehicleId, @ownerName, @ownerPhone, @vehicleModel, @serviceType, @startTime, @status, @notes)
  `).run({
    ...data,
    vehicleId: vehicle?.id ?? null,
    vehicleModel: data.vehicleModel ?? vehicle?.vehicleModel ?? '알 수 없음',
  });

  return getBookingById(result.lastInsertRowid as number)!;
}

export function getBookingById(id: number): Booking | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM bookings WHERE id = ?`).get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return rowToBooking(row);
}

export function listBookings(date?: string): Booking[] {
  const db = getDb();
  let query = `SELECT * FROM bookings`;
  const params: any[] = [];
  
  if (date) {
    query += ` WHERE start_time LIKE ?`;
    params.push(`${date}%`);
  }
  
  query += ` ORDER BY start_time ASC`;
  const rows = db.prepare(query).all(...params) as Record<string, unknown>[];
  return rows.map(rowToBooking);
}

export function checkAvailability(date: string, time: string): boolean {
  const db = getDb();
  const target = `${date} ${time}`;
  const conflict = db.prepare(`
    SELECT id FROM bookings 
    WHERE start_time = ? AND status != 'cancelled'
  `).get(target);
  return !conflict;
}

function rowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as number,
    vehicleId: row.vehicle_id as number | undefined,
    ownerName: row.owner_name as string,
    ownerPhone: row.owner_phone as string,
    vehicleModel: row.vehicle_model as string | undefined,
    serviceType: row.service_type as string,
    startTime: row.start_time as string,
    status: row.status as Booking['status'],
    notes: row.notes as string | undefined,
  };
}
