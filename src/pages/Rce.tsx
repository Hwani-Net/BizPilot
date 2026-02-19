/**
 * src/pages/Rce.tsx
 * RCE (Revenue Continuity Engine) — Mileage-Based Maintenance Alerts
 *
 * Tab 1: Vehicle list + km gauge
 * Tab 2: Register / record visit
 * Tab 3: SMS send history + manual campaign trigger
 */
import { useState, useCallback } from 'react';
import {
  Car, Plus, Send, AlertTriangle, CheckCircle2,
  ChevronRight, X, Wrench, WifiOff, RefreshCw,
} from 'lucide-react';
import { useRce } from '@/hooks/useRce';
import type { Vehicle, VehicleDetail, RceLog } from '@/types/rce';

// ── Constants ────────────────────────────────────────────────────────────────

const VEHICLE_TYPES = ['세단', 'SUV', '경차', '트럭', '승합'];
const MAINTENANCE_ITEMS = [
  { key: 'engine_oil',       label: '엔진오일 (합성)',    icon: '🛢️' },
  { key: 'engine_oil_basic', label: '엔진오일 (일반)',    icon: '🛢️' },
  { key: 'air_filter',       label: '에어필터',           icon: '💨' },
  { key: 'ac_filter',        label: '에어컨 필터',        icon: '❄️' },
  { key: 'tire_rotation',    label: '타이어 위치 교환',   icon: '🔄' },
  { key: 'tire_replace',     label: '타이어 교체',        icon: '🔧' },
  { key: 'brake_pad',        label: '브레이크 패드',      icon: '🛑' },
  { key: 'spark_plug',       label: '점화플러그',         icon: '⚡' },
  { key: 'transmission_oil', label: '미션오일',           icon: '⚙️' },
  { key: 'coolant',          label: '냉각수',             icon: '🌡️' },
];

// ── Sub-components ──────────────────────────────────────────────────────────

/** Pill-shaped km badge */
function KmBadge({ km, tier }: { km: number; tier: 0 | 1 | 2 }) {
  const colors: Record<number, { bg: string; text: string; dot: string }> = {
    0: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', dot: '#6b7280' },
    1: { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', dot: '#3b82f6' },
    2: { bg: 'rgba(16,185,129,0.15)',  text: '#34d399', dot: '#10b981' },
  };
  const c = colors[tier] ?? colors[0];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: c.dot }} />
      {km.toLocaleString('ko-KR')}km
    </span>
  );
}

/** Maintenance progress bar */
function MaintBar({ kmRemaining, totalKm, urgent }: { kmRemaining: number; totalKm: number; urgent: boolean }) {
  const pct = Math.min(100, Math.max(0, ((totalKm - kmRemaining) / totalKm) * 100));
  const color = urgent ? '#f87171' : kmRemaining < 3000 ? '#f59e0b' : '#10b981';
  return (
    <div className="w-full h-1.5 rounded-full bg-[hsl(var(--border)/0.4)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

/** Vehicle card */
function VehicleCard({ vehicle, onClick }: { vehicle: Vehicle; onClick: () => void }) {
  const tier = (vehicle.measuredAvgKm ? 2 : vehicle.firstVisitKm ? 1 : 0) as 0 | 1 | 2;
  const estKm = vehicle.estimatedKm ?? 0;
  const hasAlert = vehicle.visitCount > 0;

  return (
    <button
      onClick={onClick}
      className="card p-4 text-left group hover:border-[hsl(var(--primary)/0.4)] transition-all duration-200 w-full"
      style={{ borderLeft: '3px solid hsl(var(--primary)/0.5)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
            style={{ background: 'hsl(var(--primary)/0.12)' }}
          >
            🚗
          </div>
          <div>
            <p className="font-bold text-[hsl(var(--text))] text-sm leading-tight">{vehicle.vehicleModel}</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">{vehicle.ownerName} · {vehicle.ownerPhone}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {hasAlert && <KmBadge km={estKm} tier={tier} />}
          <ChevronRight size={14} className="text-[hsl(var(--text-muted))] group-hover:text-[hsl(var(--primary))] transition-colors" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-[hsl(var(--text-muted))] mb-3">
        <span>입고 {vehicle.visitCount}회</span>
        {vehicle.lastVisitDate && (
          <span>최근 {new Date(vehicle.lastVisitDate + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
        )}
        {vehicle.measuredAvgKm && (
          <span className="text-emerald-400">월 {Math.round(vehicle.measuredAvgKm).toLocaleString()}km</span>
        )}
      </div>

      {/* Mini maintenance gauge — show top 2 items */}
      {estKm > 0 && (
        <div className="space-y-1.5">
          {[
            { label: '엔진오일', totalKm: 10000, lastKm: vehicle.lastVisitKm ?? 0 },
            { label: '타이어 교환', totalKm: 50000, lastKm: vehicle.firstVisitKm ?? 0 },
          ].map(item => {
            const kmUsed = estKm - item.lastKm;
            const remaining = Math.max(0, item.totalKm - kmUsed);
            const urgent = remaining < 1000;
            return (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] text-[hsl(var(--text-muted))] mb-0.5">
                  <span>{item.label}</span>
                  <span style={{ color: urgent ? '#f87171' : undefined }}>
                    {urgent ? '🔴 교환 시기' : `${remaining.toLocaleString()}km 남음`}
                  </span>
                </div>
                <MaintBar kmRemaining={remaining} totalKm={item.totalKm} urgent={urgent} />
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

/** Vehicle detail modal */
function DetailModal({ phone, onClose, fetchDetail }: {
  phone: string;
  onClose: () => void;
  fetchDetail: (p: string) => Promise<VehicleDetail | null>;
}) {
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetchDetail(phone).then(d => { setDetail(d); setLoading(false); });
  });

  const tierColors = ['#6b7280', '#60a5fa', '#34d399'];
  const tierBg = ['rgba(107,114,128,0.08)', 'rgba(59,130,246,0.08)', 'rgba(16,185,129,0.08)'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="card w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-up"
        style={{ border: '1px solid hsl(var(--primary)/0.25)' }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-[hsl(var(--border)/0.4)] bg-[hsl(var(--bg-card))]">
          <div>
            <p className="font-black text-[hsl(var(--text))]">
              {detail?.vehicle.vehicleModel ?? phone}
            </p>
            <p className="text-xs text-[hsl(var(--text-muted))]">{detail?.vehicle.ownerName} · {phone}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--bg))] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="p-8 text-center text-[hsl(var(--text-muted))]">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm">불러오는 중...</p>
          </div>
        )}

        {!loading && detail && (
          <div className="p-5 space-y-5">
            {/* Km estimate */}
            <div
              className="rounded-2xl p-4 text-center"
              style={{ background: tierBg[detail.predictionTier] }}
            >
              <p className="text-4xl font-black mb-1" style={{ color: tierColors[detail.predictionTier] }}>
                {detail.estimatedKm.toLocaleString('ko-KR')}km
              </p>
              <p className="text-xs text-[hsl(var(--text-muted))]">
                예상 현재 주행거리 ({detail.predictionTierLabel})
              </p>
            </div>

            {/* Maintenance table */}
            <div>
              <p className="font-bold text-sm text-[hsl(var(--text))] mb-3">정비 항목 현황</p>
              <div className="space-y-2">
                {detail.maintenanceStatus.length === 0 ? (
                  <p className="text-xs text-[hsl(var(--text-muted))] text-center py-4">
                    방문 이력을 기록하면 예측 데이터가 생성됩니다.
                  </p>
                ) : (
                  detail.maintenanceStatus.map(item => (
                    <div
                      key={item.itemKey}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: item.urgent ? 'rgba(248,113,113,0.08)' : 'hsl(var(--bg)/0.6)',
                        border: item.urgent ? '1px solid rgba(248,113,113,0.25)' : '1px solid transparent',
                      }}
                    >
                      <span className="text-lg w-6 text-center">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[hsl(var(--text))] truncate">{item.label}</p>
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">
                          마지막 교체: {item.lastDoneKm > 0 ? `${item.lastDoneKm.toLocaleString()}km` : '미기록'}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.urgent ? (
                          <span className="text-[10px] font-bold text-red-400 flex items-center gap-1">
                            <AlertTriangle size={10} />교환 시기
                          </span>
                        ) : (
                          <p className="text-xs font-bold text-[hsl(var(--text))]">
                            {item.kmRemaining.toLocaleString()}km
                          </p>
                        )}
                        <p className="text-[10px] text-[hsl(var(--text-muted))]">
                          {item.urgent ? '' : `약 ${item.daysRemaining}일`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab 1: Vehicle List ───────────────────────────────────────────────────────
function TabVehicles({ vehicles, loading, onSelect }: {
  vehicles: Vehicle[];
  loading: boolean;
  onSelect: (phone: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = vehicles.filter(v =>
    v.ownerName.includes(search) || v.vehicleModel.includes(search) || v.ownerPhone.includes(search)
  );

  return (
    <div className="space-y-4">
      <input
        className="input-field"
        placeholder="차주명, 차량명, 전화번호 검색..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div className="py-12 text-center text-[hsl(var(--text-muted))]">
          <RefreshCw size={28} className="animate-spin mx-auto mb-2" />
          <p className="text-sm">불러오는 중...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Car size={36} className="mx-auto mb-3 text-[hsl(var(--text-muted))]" />
          <p className="text-sm text-[hsl(var(--text-muted))]">
            {search ? '검색 결과 없음' : '등록된 차량이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(v => (
            <VehicleCard key={v.id} vehicle={v} onClick={() => onSelect(v.ownerPhone)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Register / Visit ───────────────────────────────────────────────────
function TabRegister({ vehicles, registerVehicle, recordVisit }: {
  vehicles: Vehicle[];
  registerVehicle: (i: Parameters<ReturnType<typeof useRce>['registerVehicle']>[0]) => Promise<boolean>;
  recordVisit: (i: Parameters<ReturnType<typeof useRce>['recordVisit']>[0]) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<'register' | 'visit'>('register');
  const [success, setSuccess] = useState<string | null>(null);
  const [regForm, setRegForm] = useState({
    ownerName: '', ownerPhone: '', vehicleModel: '', vehicleType: '세단',
    regYear: '', regKm: '', currentKm: '',
  });
  const [visitPhone, setVisitPhone] = useState('');
  const [visitKm, setVisitKm] = useState('');
  const [visitServices, setVisitServices] = useState<string[]>([]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await registerVehicle({
      ownerName: regForm.ownerName,
      ownerPhone: regForm.ownerPhone,
      vehicleModel: regForm.vehicleModel,
      vehicleType: regForm.vehicleType,
      regYear: regForm.regYear ? Number(regForm.regYear) : undefined,
      regKm: regForm.regKm ? Number(regForm.regKm) : 0,
      currentKm: regForm.currentKm ? Number(regForm.currentKm) : undefined,
    });
    if (ok) {
      setSuccess('차량이 등록되었습니다 ✅');
      setRegForm({ ownerName: '', ownerPhone: '', vehicleModel: '', vehicleType: '세단', regYear: '', regKm: '', currentKm: '' });
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await recordVisit({
      phone: visitPhone,
      currentKm: Number(visitKm),
      services: visitServices,
    });
    if (ok) {
      setSuccess(`입고 처리 완료 ✅ (${visitKm}km)`);
      setVisitPhone(''); setVisitKm(''); setVisitServices([]);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const toggleService = (key: string) => {
    setVisitServices(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const foundVehicle = vehicles.find(v => v.ownerPhone === visitPhone || v.ownerName === visitPhone);

  return (
    <div className="max-w-xl space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2 p-1 rounded-xl bg-[hsl(var(--bg)/0.6)]">
        {(['register', 'visit'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: mode === m ? 'hsl(var(--primary))' : 'transparent',
              color: mode === m ? 'white' : 'hsl(var(--text-muted))',
            }}
          >
            {m === 'register' ? '🆕 신규 차량 등록' : '🔧 입고 처리'}
          </button>
        ))}
      </div>

      {success && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium animate-fade-up"
          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      {/* Register form */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} className="card p-5 space-y-3">
          <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mb-1">차주 정보</p>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" placeholder="차주 이름 *" required
              value={regForm.ownerName} onChange={e => setRegForm({...regForm, ownerName: e.target.value})} />
            <input className="input-field" placeholder="전화번호 * (010-0000-0000)" required
              value={regForm.ownerPhone} onChange={e => setRegForm({...regForm, ownerPhone: e.target.value})} />
          </div>

          <p className="text-xs font-bold text-[hsl(var(--text-muted))] uppercase tracking-wider mt-1">차량 정보</p>
          <input className="input-field" placeholder="차량명 * (예: 그랜저 IG 2020년형)" required
            value={regForm.vehicleModel} onChange={e => setRegForm({...regForm, vehicleModel: e.target.value})} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input-field" value={regForm.vehicleType}
              onChange={e => setRegForm({...regForm, vehicleType: e.target.value})}>
              {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="input-field" type="number" placeholder="등록 연도 (예: 2020)"
              value={regForm.regYear} onChange={e => setRegForm({...regForm, regYear: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input className="input-field" type="number" placeholder="등록 당시 km (신차=0)"
                value={regForm.regKm} onChange={e => setRegForm({...regForm, regKm: e.target.value})} />
              <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1 pl-1">중고차면 구매 당시 km</p>
            </div>
            <div>
              <input className="input-field" type="number" placeholder="현재 계기판 km (선택)"
                value={regForm.currentKm} onChange={e => setRegForm({...regForm, currentKm: e.target.value})} />
              <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1 pl-1">입력 시 예측 정확도↑</p>
            </div>
          </div>
          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Plus size={16} />차량 등록
          </button>
        </form>
      )}

      {/* Visit / odometer update form */}
      {mode === 'visit' && (
        <form onSubmit={handleVisit} className="card p-5 space-y-4">
          <div>
            <input className="input-field" placeholder="차주 전화번호 또는 이름 검색" required
              value={visitPhone} onChange={e => setVisitPhone(e.target.value)} />
            {foundVehicle && (
              <div
                className="mt-2 flex items-center gap-2 p-2.5 rounded-xl text-sm animate-fade-up"
                style={{ background: 'hsl(var(--primary)/0.08)', border: '1px solid hsl(var(--primary)/0.2)' }}
              >
                <span>🚗</span>
                <span className="font-semibold text-[hsl(var(--text))]">{foundVehicle.vehicleModel}</span>
                <span className="text-[hsl(var(--text-muted))]">— {foundVehicle.ownerName}</span>
                {foundVehicle.lastVisitKm && (
                  <span className="ml-auto text-xs text-[hsl(var(--text-muted))]">
                    이전 {foundVehicle.lastVisitKm.toLocaleString()}km
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <input className="input-field" type="number" placeholder="현재 계기판 km *" required
              value={visitKm} onChange={e => setVisitKm(e.target.value)} />
          </div>

          <div>
            <p className="text-xs font-bold text-[hsl(var(--text-muted))] mb-2">오늘 완료한 정비 (선택)</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {MAINTENANCE_ITEMS.map(item => (
                <label
                  key={item.key}
                  className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-150"
                  style={{
                    background: visitServices.includes(item.key)
                      ? 'hsl(var(--primary)/0.12)'
                      : 'hsl(var(--bg)/0.5)',
                    border: `1px solid ${visitServices.includes(item.key) ? 'hsl(var(--primary)/0.3)' : 'hsl(var(--border)/0.4)'}`,
                  }}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={visitServices.includes(item.key)}
                    onChange={() => toggleService(item.key)}
                  />
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-medium text-[hsl(var(--text))]">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            <Wrench size={16} />입고 처리 완료
          </button>
        </form>
      )}
    </div>
  );
}

// ── Tab 3: Send History ───────────────────────────────────────────────────────
function TabLogs({ logs, loading, runCampaign }: {
  logs: RceLog[];
  loading: boolean;
  runCampaign: () => Promise<unknown>;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    await runCampaign();
    setResult('캠페인이 실행됐습니다. 잠시 후 발송 이력이 업데이트됩니다.');
    setRunning(false);
    setTimeout(() => setResult(null), 5000);
  };

  const parseItems = (raw: string): string[] => {
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  };

  const ITEM_LABELS: Record<string, string> = Object.fromEntries(
    MAINTENANCE_ITEMS.map(i => [i.key, i.label])
  );

  return (
    <div className="space-y-4">
      {/* Campaign trigger */}
      <div
        className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ border: '1px solid hsl(var(--primary)/0.2)' }}
      >
        <div className="flex-1">
          <p className="font-bold text-sm text-[hsl(var(--text))]">주행거리 기반 캠페인 실행</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">
            교환 시기 임박 차량에 SMS 자동 발송 (매일 오전 10시 자동 실행)
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
          style={{ opacity: running ? 0.7 : 1 }}
        >
          {running ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          {running ? '실행 중...' : '지금 실행'}
        </button>
      </div>

      {result && (
        <div
          className="text-sm p-3 rounded-xl animate-fade-up"
          style={{ background: 'rgba(16,185,129,0.10)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          ✅ {result}
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="py-8 text-center">
          <RefreshCw size={22} className="animate-spin mx-auto mb-2 text-[hsl(var(--text-muted))]" />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center">
          <Send size={32} className="mx-auto mb-3 text-[hsl(var(--text-muted))]" />
          <p className="text-sm text-[hsl(var(--text-muted))]">발송 이력이 없습니다</p>
        </div>
      ) : (
        <div className="relative space-y-3 pl-5">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-[hsl(var(--border)/0.4)]" />
          {logs.map(log => {
            const items = parseItems(log.itemsAlerted);
            const isOk = log.status === 'sent';
            return (
              <div key={log.id} className="relative">
                <div
                  className="absolute -left-3 top-3 w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{
                    background: isOk ? 'rgba(16,185,129,0.2)' : 'rgba(248,113,113,0.2)',
                    borderColor: isOk ? '#10b981' : '#f87171',
                  }}
                >
                  {isOk
                    ? <CheckCircle2 size={9} color="#10b981" />
                    : <X size={9} color="#f87171" />
                  }
                </div>
                <div className="card p-3 ml-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[hsl(var(--text))] truncate">
                        {log.ownerName ?? '차주'} — {log.vehicleModel ?? log.phone}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {items.map(k => (
                          <span
                            key={k}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}
                          >
                            {ITEM_LABELS[k] ?? k}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          background: isOk ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
                          color: isOk ? '#10b981' : '#f87171',
                        }}
                      >
                        {isOk ? '발송됨' : '실패'}
                      </span>
                      <p className="text-[10px] text-[hsl(var(--text-muted))] mt-1">
                        {new Date(log.sentAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type Tab = 'vehicles' | 'register' | 'logs';

export default function Rce() {
  const {
    vehicles, duelist, logs, loading, isOffline,
    fetchAll, fetchVehicleDetail, registerVehicle, recordVisit, runCampaign,
  } = useRce();

  const [activeTab, setActiveTab] = useState<Tab>('vehicles');
  const [detailPhone, setDetailPhone] = useState<string | null>(null);

  const openDetail = useCallback((phone: string) => setDetailPhone(phone), []);
  const closeDetail = useCallback(() => setDetailPhone(null), []);

  const tabs: { id: Tab; label: string; icon: typeof Car }[] = [
    { id: 'vehicles', label: '차량 목록', icon: Car },
    { id: 'register', label: '입고 등록', icon: Plus },
    { id: 'logs',     label: '발송 이력', icon: Send },
  ];

  return (
    <div className="p-5 md:p-7 space-y-6 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black gradient-text mb-0.5">
            RCE · 재방문 유도
          </h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">
            차량별 주행거리 기반 정비 알림 자동화
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOffline && (
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}
            >
              <WifiOff size={11} />DEMO
            </span>
          )}
          <button
            onClick={fetchAll}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--bg-card))] hover:text-[hsl(var(--text))] transition-all"
            title="새로고침"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '등록 차량', value: vehicles.length, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', icon: '🚗' },
          { label: '알림 대상', value: duelist.length,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  icon: '📋' },
          { label: '이번 달 발송', value: logs.filter(l => {
            const d = new Date(l.sentAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length, color: '#34d399', bg: 'rgba(16,185,129,0.1)', icon: '📨' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl mb-0.5">{icon}</p>
            <p className="text-xl font-black mb-0.5" style={{ color }}>{value}</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Urgent Alert Banner ── */}
      {duelist.filter(d => d.dueItems.some(i => i.urgent)).length > 0 && (
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl animate-fade-up"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-[hsl(var(--text))]">
            <strong className="text-red-400">
              {duelist.filter(d => d.dueItems.some(i => i.urgent)).length}대
            </strong>의 차량이 즉시 교환이 필요한 소모품을 보유 중입니다.
          </p>
          <button
            onClick={() => setActiveTab('logs')}
            className="ml-auto text-xs font-bold text-red-400 hover:underline whitespace-nowrap"
          >
            알림 발송 →
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      <div>
        <div className="flex gap-1 p-1 rounded-2xl bg-[hsl(var(--bg)/0.6)] mb-5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: activeTab === id
                  ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))'
                  : 'transparent',
                color: activeTab === id ? 'white' : 'hsl(var(--text-muted))',
                boxShadow: activeTab === id ? '0 2px 8px hsl(var(--primary)/0.3)' : 'none',
              }}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'vehicles' && (
          <TabVehicles vehicles={vehicles} loading={loading} onSelect={openDetail} />
        )}
        {activeTab === 'register' && (
          <TabRegister vehicles={vehicles} registerVehicle={registerVehicle} recordVisit={recordVisit} />
        )}
        {activeTab === 'logs' && (
          <TabLogs logs={logs} loading={loading} runCampaign={runCampaign} />
        )}
      </div>

      {/* ── Detail Modal ── */}
      {detailPhone && (
        <DetailModal
          phone={detailPhone}
          onClose={closeDetail}
          fetchDetail={fetchVehicleDetail}
        />
      )}
    </div>
  );
}
