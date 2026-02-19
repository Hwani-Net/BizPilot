/**
 * lib/db-supabase.ts
 * Supabase (PostgreSQL) persistence layer for BizPilot server.
 * Drop-in async replacement for db.ts (which uses SQLite).
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '../config.js';
import type { CallRecord, TranscriptEntry, Receipt, LedgerEntry } from '../types.js';

// ── Supabase Client ─────────────────────────────────────────
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// ── Constants (re-exported for compatibility) ───────────────

// National Average km/month by vehicle type
const AVG_KM_BY_TYPE: Record<string, number> = {
  경차: 700,
  세단: 1200,
  SUV: 1300,
  트럭: 2500,
  승합: 2000,
  기본: 1250,
};

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

// ── Types ───────────────────────────────────────────────────

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
  kmRemaining: number;
  daysRemaining: number;
  urgent: boolean;
}

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

// ── Helpers ─────────────────────────────────────────────────

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

export function estimateCurrentKm(vehicle: Vehicle): { km: number; tier: 0 | 1 | 2 } {
  const now = new Date();

  if (vehicle.measuredAvgKm && vehicle.lastVisitKm && vehicle.lastVisitDate) {
    const monthsSince = monthDiff(new Date(vehicle.lastVisitDate), now);
    return { km: Math.round(vehicle.lastVisitKm + vehicle.measuredAvgKm * monthsSince), tier: 2 };
  }

  if (vehicle.firstVisitKm && vehicle.firstVisitDate) {
    let avgKm: number;
    if (vehicle.regYear) {
      const regDate = new Date(vehicle.regYear, 0, 1);
      const lifeMonths = monthDiff(regDate, new Date(vehicle.firstVisitDate));
      const kmAtFirstVisit = vehicle.firstVisitKm - vehicle.regKm;
      avgKm = lifeMonths > 0 ? kmAtFirstVisit / lifeMonths : getDefaultAvg(vehicle.vehicleType);
    } else {
      avgKm = getDefaultAvg(vehicle.vehicleType);
    }
    const monthsSince = monthDiff(new Date(vehicle.firstVisitDate), now);
    return { km: Math.round(vehicle.firstVisitKm + avgKm * monthsSince), tier: 1 };
  }

  return { km: 0, tier: 0 };
}

// ── Row mappers ─────────────────────────────────────────────

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

// ── Call Records ────────────────────────────────────────────

export async function insertCallRecord(record: CallRecord & { transcript?: TranscriptEntry[] }): Promise<void> {
  const { error } = await supabase.from('call_records').upsert({
    id: record.id,
    caller_name: record.callerName ?? '알 수 없음',
    caller_phone: record.callerPhone,
    started_at: record.startedAt,
    ended_at: record.endedAt ?? null,
    duration_sec: record.durationSec ?? 0,
    status: record.status,
    summary: record.summary ?? null,
    sentiment: record.sentiment ?? null,
    transcript: JSON.stringify(record.transcript ?? []),
  });
  if (error) throw error;
}

export async function listCallRecords(limit = 50): Promise<CallRecord[]> {
  const { data, error } = await supabase
    .from('call_records')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToCallRecord);
}

export async function getCallRecord(id: string): Promise<(CallRecord & { transcript: TranscriptEntry[] }) | null> {
  const { data, error } = await supabase
    .from('call_records')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return rowToCallRecord(data) as CallRecord & { transcript: TranscriptEntry[] };
}

// ── Vehicles ────────────────────────────────────────────────

export async function upsertVehicle(data: Omit<Vehicle, 'id' | 'visitCount'>): Promise<Vehicle> {
  const existing = await getVehicleByPhone(data.ownerPhone);

  if (existing) {
    let measuredAvg = existing.measuredAvgKm ?? null;
    const newVisitCount = existing.visitCount + 1;

    if (data.lastVisitKm && existing.firstVisitKm && existing.firstVisitDate) {
      const months = monthDiff(new Date(existing.firstVisitDate), new Date());
      if (months > 0) {
        measuredAvg = (data.lastVisitKm - existing.firstVisitKm) / months;
      }
    }

    const { data: updated, error } = await supabase
      .from('vehicles')
      .update({
        owner_name: data.ownerName,
        vehicle_model: data.vehicleModel,
        vehicle_type: data.vehicleType,
        last_visit_km: data.lastVisitKm ?? existing.lastVisitKm,
        last_visit_date: data.lastVisitDate ?? existing.lastVisitDate,
        measured_avg_km: measuredAvg,
        visit_count: newVisitCount,
        updated_at: new Date().toISOString(),
      })
      .eq('owner_phone', data.ownerPhone)
      .select('*')
      .single();
    if (error) throw error;
    return rowToVehicle(updated);
  } else {
    const { data: newVehicle, error } = await supabase
      .from('vehicles')
      .insert({
        owner_name: data.ownerName,
        owner_phone: data.ownerPhone,
        vehicle_model: data.vehicleModel,
        vehicle_type: data.vehicleType,
        reg_year: data.regYear ?? null,
        reg_km: data.regKm ?? 0,
        first_visit_km: data.firstVisitKm ?? null,
        first_visit_date: data.firstVisitDate ?? null,
        last_visit_km: data.lastVisitKm ?? null,
        last_visit_date: data.lastVisitDate ?? null,
        visit_count: 1,
      })
      .select('*')
      .single();
    if (error) throw error;
    return rowToVehicle(newVehicle);
  }
}

export async function getVehicleByPhone(phone: string): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('owner_phone', phone)
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return rowToVehicle(data);
}

export async function listVehicles(limit = 100): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToVehicle);
}

// ── Service History ─────────────────────────────────────────

export async function recordService(vehicleId: number, itemKey: string, doneAtKm: number): Promise<void> {
  const interval = MAINTENANCE_INTERVALS[itemKey];
  if (!interval) return;
  const { error } = await supabase.from('service_history').insert({
    vehicle_id: vehicleId,
    item_key: itemKey,
    done_at_km: doneAtKm,
    done_at_date: new Date().toISOString().split('T')[0],
    next_due_km: doneAtKm + interval.km,
  });
  if (error) throw error;
}

export async function getMaintenanceStatus(vehicle: Vehicle): Promise<MaintenanceStatus[]> {
  const { km: estimatedKm } = estimateCurrentKm(vehicle);
  const avgKmPerMonth = vehicle.measuredAvgKm ?? getDefaultAvg(vehicle.vehicleType);

  const { data: latestServices, error } = await supabase
    .from('service_history')
    .select('item_key, done_at_km, next_due_km')
    .eq('vehicle_id', vehicle.id)
    .order('done_at_km', { ascending: false });

  if (error) throw error;

  // Get latest per item_key
  const serviceMap = new Map<string, { last_km: number; next_km: number }>();
  for (const s of (latestServices ?? [])) {
    if (!serviceMap.has(s.item_key)) {
      serviceMap.set(s.item_key, { last_km: s.done_at_km, next_km: s.next_due_km });
    }
  }

  return Object.entries(MAINTENANCE_INTERVALS).map(([key, meta]) => {
    const record = serviceMap.get(key);
    const lastDoneKm = record?.last_km ?? 0;
    const nextDueKm = record?.next_km ?? meta.km;
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

export async function getVehiclesDueForAlert(thresholdKm = 1500): Promise<Array<{
  vehicle: Vehicle;
  dueItems: MaintenanceStatus[];
  estimatedKm: number;
}>> {
  const vehicles = await listVehicles();
  const result = [];

  for (const vehicle of vehicles) {
    if (!vehicle.firstVisitKm) continue;

    const { km: estimatedKm } = estimateCurrentKm(vehicle);
    const statuses = await getMaintenanceStatus(vehicle);
    const dueItems = statuses.filter(s => s.kmRemaining <= thresholdKm);

    if (dueItems.length > 0) {
      // Check: not alerted within last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: recentAlert } = await supabase
        .from('rce_logs')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .gte('sent_at', thirtyDaysAgo)
        .limit(1)
        .single();

      if (!recentAlert) {
        result.push({ vehicle, dueItems, estimatedKm });
      }
    }
  }

  return result;
}

// ── RCE Logs ───────────────────────────────────────────────

export async function insertRceLog(entry: {
  vehicleId: number;
  phone: string;
  message: string;
  itemsAlerted: string[];
  status: string;
  twilioSid?: string;
}): Promise<void> {
  const { error } = await supabase.from('rce_logs').insert({
    vehicle_id: entry.vehicleId,
    phone: entry.phone,
    message: entry.message,
    items_alerted: JSON.stringify(entry.itemsAlerted),
    status: entry.status,
    twilio_sid: entry.twilioSid ?? null,
  });
  if (error) throw error;
}

export async function listRceLogs(limit = 50) {
  const { data, error } = await supabase
    .from('rce_logs')
    .select('*, vehicles(owner_name, vehicle_model)')
    .order('sent_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function upsertRceCustomer(data: { name: string; phone: string; lastVisit: string; service?: string }): Promise<number> {
  const vehicle = await upsertVehicle({
    ownerName: data.name,
    ownerPhone: data.phone,
    vehicleModel: '차량 정보 미입력',
    vehicleType: '세단',
    lastVisitDate: data.lastVisit,
    regKm: 0,
  });
  return vehicle.id;
}

// ── Receipts ────────────────────────────────────────────────

export async function insertReceipt(data: Omit<Receipt, 'id' | 'createdAt' | 'imageUrl'>): Promise<Receipt> {
  const { data: newReceipt, error } = await supabase
    .from('receipts')
    .insert({
      vendor: data.vendor,
      amount: data.amount,
      date: data.date,
      category: data.category,
      items: JSON.stringify(data.items),
      status: data.status ?? 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToReceipt(newReceipt);
}

export async function getReceiptById(id: number): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return rowToReceipt(data);
}

export async function listReceipts(limit = 50): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToReceipt);
}

export async function updateReceiptStatus(id: number, status: 'pending' | 'verified'): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .update({ status })
    .eq('id', id);
  if (error) throw error;
}

// ── Ledger ──────────────────────────────────────────────────

export async function insertLedgerEntry(data: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
  const { data: newEntry, error } = await supabase
    .from('ledger_entries')
    .insert({
      date: data.date,
      description: data.description,
      category: data.category,
      amount: data.amount,
      type: data.type,
      receipt_id: data.receiptId ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToLedger(newEntry);
}

export async function listLedgerEntries(limit = 100): Promise<LedgerEntry[]> {
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToLedger);
}

export async function getLedgerSummary(): Promise<{ totalIncome: number; totalExpense: number; netProfit: number }> {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data, error } = await supabase
    .from('ledger_entries')
    .select('type, amount')
    .like('date', `${currentMonth}%`);
  if (error) throw error;

  const income  = (data ?? []).filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
  const expense = (data ?? []).filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  return { totalIncome: income, totalExpense: expense, netProfit: income - expense };
}

// ── Bookings ─────────────────────────────────────────────────

export async function createBooking(data: Omit<Booking, 'id'>): Promise<Booking> {
  const vehicle = await getVehicleByPhone(data.ownerPhone);

  const { data: newBooking, error } = await supabase
    .from('bookings')
    .insert({
      vehicle_id: vehicle?.id ?? null,
      owner_name: data.ownerName,
      owner_phone: data.ownerPhone,
      vehicle_model: data.vehicleModel ?? vehicle?.vehicleModel ?? '알 수 없음',
      service_type: data.serviceType,
      start_time: data.startTime,
      status: data.status ?? 'confirmed',
      notes: data.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return rowToBooking(newBooking);
}

export async function getBookingById(id: number): Promise<Booking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return rowToBooking(data);
}

export async function listBookings(date?: string): Promise<Booking[]> {
  let query = supabase.from('bookings').select('*');
  if (date) {
    query = query.like('start_time', `${date}%`);
  }
  const { data, error } = await query.order('start_time', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(rowToBooking);
}

export async function checkAvailability(date: string, time: string): Promise<boolean> {
  const target = `${date} ${time}`;
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('start_time', target)
    .neq('status', 'cancelled')
    .limit(1)
    .single();
  if (error && error.code === 'PGRST116') return true; // No conflict
  if (error) throw error;
  return false; // Has conflict
}
