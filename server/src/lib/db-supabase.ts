/**
 * lib/db-supabase.ts
 * Supabase (PostgreSQL) persistence layer for BizPilot server.
 * Drop-in async replacement for db.ts (which uses SQLite).
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '../config.js';
import type { CallRecord, TranscriptEntry, Receipt, LedgerEntry } from '../types.js';

// ── Supabase Client (lazy — ensures dotenv has loaded before first use) ──
let _supabase: ReturnType<typeof createClient> | null = null;
export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }
  return _supabase;
}
// backward-compat alias
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

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

export interface Part {
  id: number;
  part_number: string;
  name_ko: string;
  name_en?: string;
  description?: string;
  price_parts: number;
  price_labor?: number;
  compatible_models?: string[];
  category?: string;
  image_url?: string;
  created_at: string;
}

export async function insertCallRecord(record: CallRecord & { transcript?: TranscriptEntry[] }): Promise<void> {
  // ... existing implementation ...
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

// ── Parts (AR Scanner) ──────────────────────────────────────
export async function listParts(query?: string): Promise<Part[]> {
  let builder = supabase.from('parts').select('*');
  if (query) {
    // Simple search on number or name
    builder = builder.or(`part_number.ilike.%${query}%,name_ko.ilike.%${query}%,name_en.ilike.%${query}%`);
  }
  const { data, error } = await builder.order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}

export async function getPartByNumber(partNo: string): Promise<Part | null> {
  const { data, error } = await supabase.from('parts').select('*').eq('part_number', partNo).single();
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
  return data;
}

export async function searchPartsByVector(embedding: number[]): Promise<Part[]> {
  // Vector search requires 'match_parts' RPC function which we haven't created yet.
  // Fallback to text search or return empty for now.
  return [];
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

// ── Parts Seed ──────────────────────────────────────────────

export async function seedPartsIfEmpty(): Promise<void> {
  const { count } = await supabase
    .from('parts')
    .select('*', { count: 'exact', head: true });

  if ((count ?? 0) > 0) return; // Already seeded

  console.log('[seed] parts 테이블 시드 데이터 삽입 중...');

  const parts = [
    {
      part_number: 'OIL-5W30-SYN-4L',
      name_ko: '합성 엔진오일 5W-30 (4L)',
      name_en: 'Synthetic Engine Oil 5W-30 4L',
      description: '현대/기아 차량 권장 합성 엔진오일. API SP 등급.',
      price_parts: 38000,
      price_labor: 15000,
      compatible_models: ['그랜저', '소나타', '아반떼', 'K5', 'K8', '스포티지'],
      category: '엔진오일',
    },
    {
      part_number: 'OIL-5W40-SYN-4L',
      name_ko: '합성 엔진오일 5W-40 (4L)',
      name_en: 'Synthetic Engine Oil 5W-40 4L',
      description: '고성능/유럽형 엔진 전용 합성 엔진오일.',
      price_parts: 45000,
      price_labor: 15000,
      compatible_models: ['BMW', '벤츠', '아우디', '폭스바겐', '제네시스'],
      category: '엔진오일',
    },
    {
      part_number: 'FILTER-AIR-AVANTE',
      name_ko: '에어필터 (아반떼/i30 전용)',
      name_en: 'Air Filter for Avante/i30',
      description: '현대 아반떼 CN7, i30 전용 에어클리너 필터.',
      price_parts: 18000,
      price_labor: 10000,
      compatible_models: ['아반떼', 'i30'],
      category: '필터',
    },
    {
      part_number: 'FILTER-AIR-SONATA',
      name_ko: '에어필터 (소나타/K5 전용)',
      name_en: 'Air Filter for Sonata/K5',
      description: '현대 소나타 DN8, 기아 K5 DL3 전용 에어클리너 필터.',
      price_parts: 20000,
      price_labor: 10000,
      compatible_models: ['소나타', 'K5'],
      category: '필터',
    },
    {
      part_number: 'FILTER-AC-UNI',
      name_ko: '에어컨 필터 (활성탄 타입)',
      name_en: 'Cabin Air Filter (Activated Carbon)',
      description: '미세먼지 + 항균 기능 포함 고급형 에어컨 필터.',
      price_parts: 15000,
      price_labor: 8000,
      compatible_models: ['그랜저', '소나타', '아반떼', '투싼', '싼타페', 'K5', 'K7'],
      category: '필터',
    },
    {
      part_number: 'BRAKE-PAD-FRONT-GRAN',
      name_ko: '브레이크 패드 전륜 (그랜저)',
      name_en: 'Front Brake Pad for Grandeur',
      description: '현대 그랜저 IG/GN 전륜 브레이크 패드 (세라믹).',
      price_parts: 85000,
      price_labor: 40000,
      compatible_models: ['그랜저'],
      category: '브레이크',
    },
    {
      part_number: 'BRAKE-PAD-FRONT-AVANTE',
      name_ko: '브레이크 패드 전륜 (아반떼)',
      name_en: 'Front Brake Pad for Avante',
      description: '현대 아반떼 CN7 전륜 브레이크 패드.',
      price_parts: 55000,
      price_labor: 35000,
      compatible_models: ['아반떼'],
      category: '브레이크',
    },
    {
      part_number: 'SPARK-PLUG-IRIDIUM',
      name_ko: '이리듐 점화플러그 (4개 세트)',
      name_en: 'Iridium Spark Plug Set (4pcs)',
      description: '내구성과 점화 효율이 높은 이리듐 합금 점화플러그.',
      price_parts: 68000,
      price_labor: 30000,
      compatible_models: ['소나타', '아반떼', 'K5', 'K3', '코나'],
      category: '점화계통',
    },
    {
      part_number: 'WIPER-BLADE-600-450',
      name_ko: '와이퍼 블레이드 세트 (운전석 600mm + 조수석 450mm)',
      name_en: 'Wiper Blade Set 600mm/450mm',
      description: '무소음 그래파이트 코팅 프리미엄 와이퍼 블레이드.',
      price_parts: 22000,
      price_labor: 5000,
      compatible_models: ['그랜저', '소나타', '아반떼', 'K5', '투싼'],
      category: '외장',
    },
    {
      part_number: 'COOLANT-BLUE-2L',
      name_ko: '냉각수 (부동액) 2L 블루',
      name_en: 'Engine Coolant Antifreeze 2L Blue',
      description: '장기 내구성 실리케이트 타입 냉각수. 희석형(50:50).',
      price_parts: 12000,
      price_labor: 20000,
      compatible_models: ['그랜저', '소나타', '아반떼', '투싼', '싼타페', 'K5', 'K8'],
      category: '냉각계통',
    },
    {
      part_number: 'TIRE-195-65-R15',
      name_ko: '타이어 195/65R15 (1개)',
      name_en: 'Tire 195/65R15',
      description: '국산 사계절 타이어. 아반떼/K3 표준 규격.',
      price_parts: 95000,
      price_labor: 15000,
      compatible_models: ['아반떼', 'K3'],
      category: '타이어',
    },
    {
      part_number: 'TIRE-225-60-R17',
      name_ko: '타이어 225/60R17 (1개)',
      name_en: 'Tire 225/60R17',
      description: '중형 SUV용 사계절 타이어.',
      price_parts: 135000,
      price_labor: 15000,
      compatible_models: ['투싼', '스포티지', '코나'],
      category: '타이어',
    },
    {
      part_number: 'BATTERY-60AH-DIN',
      name_ko: '자동차 배터리 60Ah (DIN 규격)',
      name_en: 'Car Battery 60Ah DIN',
      description: 'AGM 타입 고출력 배터리. 아이들링 스톱 차량 호환.',
      price_parts: 180000,
      price_labor: 15000,
      compatible_models: ['소나타', '그랜저', 'K5', 'K8', '스타렉스'],
      category: '전기계통',
    },
    {
      part_number: 'TRANS-OIL-ATF-4L',
      name_ko: '자동변속기 오일 ATF (4L)',
      name_en: 'Automatic Transmission Fluid ATF 4L',
      description: '현대/기아 자동변속기 전용 유압유.',
      price_parts: 55000,
      price_labor: 35000,
      compatible_models: ['그랜저', '소나타', 'K5', 'K8', '카니발'],
      category: '미션',
    },
    {
      part_number: 'POWER-STEERING-FLUID',
      name_ko: '파워스티어링 오일 1L',
      name_en: 'Power Steering Fluid 1L',
      description: '유압식 파워스티어링 전용 오일.',
      price_parts: 8000,
      price_labor: 10000,
      compatible_models: ['그랜저', '소나타', '스타렉스'],
      category: '조향계통',
    },
    {
      part_number: 'BRAKE-FLUID-DOT4',
      name_ko: '브레이크 오일 DOT4 (500ml)',
      name_en: 'Brake Fluid DOT4 500ml',
      description: '고온 내성 DOT4 규격 브레이크 오일.',
      price_parts: 9000,
      price_labor: 15000,
      compatible_models: ['그랜저', '소나타', '아반떼', '투싼', 'K5', 'K8'],
      category: '브레이크',
    },
    {
      part_number: 'FILTER-OIL-GRAN-IG',
      name_ko: '오일필터 (그랜저 IG)',
      name_en: 'Oil Filter for Grandeur IG',
      description: '현대 그랜저 IG 2.4/3.3 엔진 전용 오일필터.',
      price_parts: 8000,
      price_labor: 0,
      compatible_models: ['그랜저'],
      category: '필터',
    },
    {
      part_number: 'BELT-TIMING-SONATA',
      name_ko: '타이밍 벨트 (소나타)',
      name_en: 'Timing Belt for Sonata',
      description: '현대 소나타 2.0 엔진 타이밍 벨트. 아이들러 풀리 포함.',
      price_parts: 75000,
      price_labor: 180000,
      compatible_models: ['소나타'],
      category: '엔진부품',
    },
    {
      part_number: 'SHOCK-ABSORBER-FRONT',
      name_ko: '쇼크업소버 전륜 (2개 세트)',
      name_en: 'Front Shock Absorber Set (x2)',
      description: '가스 봉입식 단통형 쇼크업소버. 주행 안정성 개선.',
      price_parts: 220000,
      price_labor: 80000,
      compatible_models: ['소나타', 'K5', '아반떼'],
      category: '현가장치',
    },
    {
      part_number: 'BULB-LED-H7',
      name_ko: 'LED 헤드램프 전구 H7 (2개)',
      name_en: 'LED Headlamp H7 Bulb Set',
      description: '6000K 화이트 LED 헤드램프 전구. 기존 할로겐 대체용.',
      price_parts: 35000,
      price_labor: 20000,
      compatible_models: ['소나타', '아반떼', 'K5', 'K3', '투싼', '스포티지'],
      category: '조명',
    },
  ];

  const { error } = await supabase.from('parts').insert(
    parts.map(p => ({
      ...p,
      compatible_models: p.compatible_models, // stored as jsonb array
    }))
  );

  if (error) {
    console.error('[seed] parts 시드 오류:', error.message);
  } else {
    console.log(`[seed] ✅ parts 시드 완료 (${parts.length}종)`);
  }
}
