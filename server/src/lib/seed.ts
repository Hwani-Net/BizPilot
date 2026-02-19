/**
 * lib/seed.ts
 * Demo seed data for BizPilot — auto-runs once on first server boot.
 * Provides rich sample data so the dashboard is populated immediately.
 */
import type { Database } from 'better-sqlite3';

export function seedDemoData(db: Database): void {
  // Guard: only seed if vehicles table is empty
  const count = (db.prepare('SELECT COUNT(*) as n FROM vehicles').get() as { n: number }).n;
  if (count > 0) return;

  console.log('[seed] 데모 데이터 삽입 중...');

  db.transaction(() => {
    // ─── Vehicles ───────────────────────────────────────────
    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (owner_name, owner_phone, vehicle_model, vehicle_type,
        registration_year, initial_km, current_km, last_visit_date, monthly_km_avg, prediction_tier)
      VALUES (@ownerName, @ownerPhone, @vehicleModel, @vehicleType,
        @registrationYear, @initialKm, @currentKm, @lastVisitDate, @monthlyKmAvg, @predictionTier)
    `);

    const v1 = insertVehicle.run({
      ownerName: '김민준', ownerPhone: '010-1234-5678',
      vehicleModel: '현대 그랜저 IG', vehicleType: '세단',
      registrationYear: 2019, initialKm: 45000, currentKm: 87500,
      lastVisitDate: '2025-11-20', monthlyKmAvg: 1200, predictionTier: 2,
    });

    const v2 = insertVehicle.run({
      ownerName: '이수진', ownerPhone: '010-9876-5432',
      vehicleModel: '기아 카니발 KA4', vehicleType: '승합',
      registrationYear: 2021, initialKm: 12000, currentKm: 53200,
      lastVisitDate: '2025-12-05', monthlyKmAvg: 1800, predictionTier: 2,
    });

    const v3 = insertVehicle.run({
      ownerName: '박영호', ownerPhone: '010-5555-7777',
      vehicleModel: '쌍용 티볼리 아머', vehicleType: 'SUV',
      registrationYear: 2020, initialKm: 28000, currentKm: 64800,
      lastVisitDate: '2025-10-15', monthlyKmAvg: 1350, predictionTier: 2,
    });

    // ─── Service History ─────────────────────────────────────
    const insertService = db.prepare(`
      INSERT INTO service_history (vehicle_id, service_type, service_date, km_at_service, notes)
      VALUES (@vehicleId, @serviceType, @serviceDate, @kmAtService, @notes)
    `);

    // Kim — 엔진오일 + 타이어 위치교환
    insertService.run({ vehicleId: v1.lastInsertRowid, serviceType: 'engine_oil',    serviceDate: '2025-11-20', kmAtService: 85000, notes: '합성유 5W30 교체' });
    insertService.run({ vehicleId: v1.lastInsertRowid, serviceType: 'tire_rotation', serviceDate: '2025-08-10', kmAtService: 80200, notes: '' });
    insertService.run({ vehicleId: v1.lastInsertRowid, serviceType: 'air_filter',    serviceDate: '2024-03-05', kmAtService: 62000, notes: '' });

    // Lee — 에어컨 필터 + 엔진오일
    insertService.run({ vehicleId: v2.lastInsertRowid, serviceType: 'ac_filter',  serviceDate: '2025-12-05', kmAtService: 52800, notes: '카오디오 청소 포함' });
    insertService.run({ vehicleId: v2.lastInsertRowid, serviceType: 'engine_oil', serviceDate: '2025-06-14', kmAtService: 42000, notes: '일반유 교체' });

    // Park — 브레이크 패드 + 냉각수
    insertService.run({ vehicleId: v3.lastInsertRowid, serviceType: 'brake_pad', serviceDate: '2025-10-15', kmAtService: 63000, notes: '전륜 교체' });
    insertService.run({ vehicleId: v3.lastInsertRowid, serviceType: 'coolant',   serviceDate: '2024-09-20', kmAtService: 48000, notes: '' });

    // ─── Bookings ────────────────────────────────────────────
    const insertBooking = db.prepare(`
      INSERT INTO bookings (vehicle_id, owner_name, owner_phone, vehicle_model,
        service_type, start_time, status, notes)
      VALUES (@vehicleId, @ownerName, @ownerPhone, @vehicleModel,
        @serviceType, @startTime, @status, @notes)
    `);

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

    insertBooking.run({ vehicleId: v1.lastInsertRowid, ownerName: '김민준', ownerPhone: '010-1234-5678', vehicleModel: '그랜저 IG', serviceType: '엔진오일 교환', startTime: `${today} 10:00`, status: 'confirmed', notes: '합성유 요청' });
    insertBooking.run({ vehicleId: v2.lastInsertRowid, ownerName: '이수진', ownerPhone: '010-9876-5432', vehicleModel: '카니발 KA4', serviceType: '타이어 위치교환', startTime: `${today} 14:00`, status: 'confirmed', notes: '' });
    insertBooking.run({ vehicleId: v3.lastInsertRowid, ownerName: '박영호', ownerPhone: '010-5555-7777', vehicleModel: '티볼리 아머', serviceType: '종합 점검', startTime: `${tomorrow} 09:30`, status: 'pending', notes: '소음 문의 포함' });
    insertBooking.run({ vehicleId: null, ownerName: '최지현', ownerPhone: '010-3333-8888', vehicleModel: '아반떼 CN7', serviceType: '에어컨 필터', startTime: `${tomorrow} 11:00`, status: 'confirmed', notes: '' });

    // ─── Ledger Entries ──────────────────────────────────────
    const insertLedger = db.prepare(`
      INSERT INTO ledger_entries (date, description, category, amount, type, created_at)
      VALUES (@date, @description, @category, @amount, @type, datetime('now'))
    `);

    const entries = [
      { date: today,      description: '그랜저 엔진오일 교환', category: '정비수입',  amount: 85000,  type: 'income'  },
      { date: today,      description: '카니발 타이어 위치교환', category: '정비수입', amount: 30000,  type: 'income'  },
      { date: today,      description: '엔진오일 재고 입고',   category: '부품비',    amount: 120000, type: 'expense' },
      { date: tomorrow,   description: '점검 공임',            category: '정비수입',  amount: 50000,  type: 'income'  },
      { date: '2026-02-18', description: '브레이크 패드 교체', category: '정비수입',  amount: 180000, type: 'income'  },
      { date: '2026-02-17', description: '에어컨 필터 교환',   category: '정비수입',  amount: 45000,  type: 'income'  },
      { date: '2026-02-17', description: '소모품 구매',        category: '부품비',    amount: 85000,  type: 'expense' },
      { date: '2026-02-16', description: '냉각수 교환 + 점검', category: '정비수입',  amount: 65000,  type: 'income'  },
    ];
    for (const e of entries) insertLedger.run(e);

    // ─── Call Records ────────────────────────────────────────
    const insertCall = db.prepare(`
      INSERT INTO call_records (id, caller_name, caller_phone, started_at, ended_at,
        duration_sec, status, summary, sentiment, created_at)
      VALUES (@id, @callerName, @callerPhone, @startedAt, @endedAt,
        @durationSec, @status, @summary, @sentiment, datetime('now'))
    `);

    insertCall.run({ id: 'demo-call-001', callerName: '김민준', callerPhone: '010-1234-5678', startedAt: `${today}T10:30:00`, endedAt: `${today}T10:32:15`, durationSec: 135, status: 'completed', summary: '엔진오일 교환 예약 확인. 오늘 10시 방문 예정.', sentiment: 'positive' });
    insertCall.run({ id: 'demo-call-002', callerName: '이수진', callerPhone: '010-9876-5432', startedAt: `${today}T13:15:00`, endedAt: `${today}T13:18:42`, durationSec: 222, status: 'completed', summary: '타이어 위치교환 문의. 오후 2시 예약 완료.', sentiment: 'neutral' });
    insertCall.run({ id: 'demo-call-003', callerName: '알 수 없음', callerPhone: '010-0000-1111', startedAt: `${today}T09:05:00`, endedAt: null, durationSec: 0, status: 'missed', summary: null, sentiment: null });

  })();

  console.log('[seed] ✅ 데모 데이터 삽입 완료 (차량 3, 예약 4, 장부 8, 통화 3)');
}
