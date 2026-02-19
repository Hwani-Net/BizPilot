/**
 * src/hooks/useRce.ts
 * RCE data hook — fetches from server with mock-data fallback.
 */
import { useState, useEffect, useCallback } from 'react';
import type {
  Vehicle, VehicleDetail, RceLog, VehicleDue,
  RegisterVehicleInput, RecordVisitInput,
} from '@/types/rce';

const SERVER = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

// ── Mock Data (offline fallback) ──────────────────────────────────
const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 1,
    ownerName: '김민수',
    ownerPhone: '010-1234-5678',
    vehicleModel: '그랜저 IG (2020)',
    vehicleType: 'SUV',
    regYear: 2020,
    regKm: 0,
    firstVisitKm: 38000,
    firstVisitDate: '2024-06-01',
    lastVisitKm: 62000,
    lastVisitDate: '2025-09-15',
    measuredAvgKm: 1300,
    visitCount: 4,
    estimatedKm: 76400,
  },
  {
    id: 2,
    ownerName: '박서준',
    ownerPhone: '010-9876-5432',
    vehicleModel: '소나타 DN8 (2022)',
    vehicleType: '세단',
    regYear: 2022,
    regKm: 0,
    firstVisitKm: 18000,
    firstVisitDate: '2024-11-10',
    lastVisitKm: 31000,
    lastVisitDate: '2025-12-20',
    measuredAvgKm: 1100,
    visitCount: 2,
    estimatedKm: 43100,
  },
  {
    id: 3,
    ownerName: '이있었',
    ownerPhone: '010-5555-1234',
    vehicleModel: 'BMW 320i (2019)',
    vehicleType: '세단',
    regYear: 2019,
    regKm: 5000,
    firstVisitKm: 55000,
    firstVisitDate: '2024-03-15',
    lastVisitKm: 78000,
    lastVisitDate: '2026-01-10',
    measuredAvgKm: 1250,
    visitCount: 6,
    estimatedKm: 80750,
  },
  {
    id: 4,
    ownerName: '최드리',
    ownerPhone: '010-3333-7777',
    vehicleModel: '투싼 NX4 (2023)',
    vehicleType: 'SUV',
    regYear: 2023,
    regKm: 0,
    firstVisitKm: 8000,
    firstVisitDate: '2025-08-20',
    lastVisitKm: 14000,
    lastVisitDate: '2026-01-15',
    visitCount: 2,
    estimatedKm: 15200,
  },
];

const MOCK_DUE: VehicleDue[] = [
  {
    vehicle: MOCK_VEHICLES[0],
    estimatedKm: 76400,
    dueItems: [
      {
        itemKey: 'engine_oil',
        label: '엔진오일 (합성)',
        icon: '🛢️',
        lastDoneKm: 68000,
        nextDueKm: 78000,
        kmRemaining: 1600,
        daysRemaining: 37,
        urgent: false,
        urgencyLabel: '🟡 교환 시기 임박',
      },
      {
        itemKey: 'air_filter',
        label: '에어필터',
        icon: '💨',
        lastDoneKm: 58000,
        nextDueKm: 78000,
        kmRemaining: 1600,
        daysRemaining: 37,
        urgent: false,
        urgencyLabel: '🟡 교환 시기 임박',
      },
    ],
  },
  {
    vehicle: MOCK_VEHICLES[2],
    estimatedKm: 80750,
    dueItems: [
      {
        itemKey: 'engine_oil',
        label: '엔진오일 (합성)',
        icon: '🛢️',
        lastDoneKm: 79000,
        nextDueKm: 80000,
        kmRemaining: 0,
        daysRemaining: 0,
        urgent: true,
        urgencyLabel: '🔴 즉시 교환 권장',
      },
    ],
  },
];

const MOCK_LOGS: RceLog[] = [
  {
    id: 1, vehicleId: 3, phone: '010-5555-1234',
    message: '안녕하세요, 이있었님 🔧\n\nBMW 320i의 주행 패턴을 분석해 드렸습니다.\n현재 예상 누적 주행거리: 약 80,750km\n\n─ 정비 예정 항목 ─\n🔴 엔진오일: 권장 주기 도달',
    itemsAlerted: '["engine_oil"]', status: 'sent',
    sentAt: '2026-02-18T10:02:00', ownerName: '이있었', vehicleModel: 'BMW 320i',
  },
  {
    id: 2, vehicleId: 1, phone: '010-1234-5678',
    message: '안녕하세요, 김민수님 🔧\n\n그랜저 IG의 주행 패턴을 분석해 드렸습니다.',
    itemsAlerted: '["engine_oil","air_filter"]', status: 'sent',
    sentAt: '2026-02-15T10:04:00', ownerName: '김민수', vehicleModel: '그랜저 IG',
  },
];

// ── API helpers ────────────────────────────────────────────────────
async function api<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${SERVER}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

// ── Main Hook ─────────────────────────────────────────────────────
export function useRce() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [duelist, setDuelist] = useState<VehicleDue[]>([]);
  const [logs, setLogs] = useState<RceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [v, d, l] = await Promise.all([
      api<Vehicle[]>('/api/rce/vehicles'),
      api<{ targets: VehicleDue[] }>('/api/rce/due'),
      api<RceLog[]>('/api/rce/logs'),
    ]);

    if (v === null) {
      // Server offline — use mock data
      setIsOffline(true);
      setVehicles(MOCK_VEHICLES);
      setDuelist(MOCK_DUE);
      setLogs(MOCK_LOGS);
    } else {
      setIsOffline(false);
      setVehicles(v ?? []);
      setDuelist(d?.targets ?? []);
      setLogs(l ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Vehicle detail ───────────────────────────────────────────────
  const fetchVehicleDetail = useCallback(async (phone: string): Promise<VehicleDetail | null> => {
    const data = await api<VehicleDetail>(`/api/rce/vehicles/${encodeURIComponent(phone)}`);
    if (data) return data;
    // Mock fallback
    const v = MOCK_VEHICLES.find(x => x.ownerPhone === phone);
    if (!v) return null;
    return {
      vehicle: v,
      estimatedKm: v.estimatedKm ?? 0,
      predictionTier: v.measuredAvgKm ? 2 : v.firstVisitKm ? 1 : 0,
      predictionTierLabel: v.measuredAvgKm ? '실측 평균' : v.firstVisitKm ? '생애 주행 추정' : '국가 평균',
      maintenanceStatus: [],
      availableItems: [],
    };
  }, []);

  // ── Register vehicle ─────────────────────────────────────────────
  const registerVehicle = useCallback(async (input: RegisterVehicleInput): Promise<boolean> => {
    const data = await api<Vehicle>('/api/rce/vehicles', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    if (data) {
      setVehicles(prev => {
        const idx = prev.findIndex(v => v.ownerPhone === data.ownerPhone);
        return idx >= 0 ? prev.map((v, i) => i === idx ? { ...data } : v) : [data, ...prev];
      });
      return true;
    }
    // Offline mock — add optimistically
    if (isOffline) {
      const mock: Vehicle = {
        id: Date.now(),
        ownerName: input.ownerName,
        ownerPhone: input.ownerPhone,
        vehicleModel: input.vehicleModel,
        vehicleType: input.vehicleType ?? '세단',
        regYear: input.regYear,
        regKm: input.regKm ?? 0,
        firstVisitKm: input.currentKm,
        firstVisitDate: new Date().toISOString().split('T')[0],
        lastVisitKm: input.currentKm,
        lastVisitDate: new Date().toISOString().split('T')[0],
        visitCount: 1,
        estimatedKm: input.currentKm,
      };
      setVehicles(prev => [mock, ...prev]);
      return true;
    }
    return false;
  }, [isOffline]);

  // ── Record visit (odometer update) ───────────────────────────────
  const recordVisit = useCallback(async (input: RecordVisitInput): Promise<boolean> => {
    const data = await api<{ vehicle: Vehicle }>(`/api/rce/vehicles/${encodeURIComponent(input.phone)}/visit`, {
      method: 'POST',
      body: JSON.stringify({ currentKm: input.currentKm, services: input.services ?? [] }),
    });
    if (data?.vehicle) {
      setVehicles(prev => prev.map(v =>
        v.ownerPhone === input.phone ? { ...v, ...data.vehicle } : v
      ));
      return true;
    }
    // Offline mock
    if (isOffline) {
      setVehicles(prev => prev.map(v =>
        v.ownerPhone === input.phone
          ? { ...v, lastVisitKm: input.currentKm, lastVisitDate: new Date().toISOString().split('T')[0], visitCount: v.visitCount + 1 }
          : v
      ));
      return true;
    }
    return false;
  }, [isOffline]);

  // ── Run campaign ─────────────────────────────────────────────────
  const runCampaign = useCallback(async (): Promise<{ status: string } | null> => {
    const data = await api<{ status: string }>('/api/rce/run', { method: 'POST' });
    if (data) {
      setTimeout(fetchAll, 2000); // refresh logs after 2s
    }
    return data;
  }, [fetchAll]);

  return {
    vehicles, duelist, logs, loading, isOffline,
    fetchAll, fetchVehicleDetail,
    registerVehicle, recordVisit, runCampaign,
  };
}
