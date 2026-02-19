import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Calendar, Gauge, Wrench, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRce } from '@/hooks/useRce';
import type { VehicleDetail } from '@/types/rce';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const MAINTENANCE_LABELS: Record<string, { label: string; icon: string; intervalKm: number }> = {
  engine_oil:       { label: '엔진오일',        icon: '🛢️', intervalKm: 10000 },
  engine_oil_basic: { label: '엔진오일(일반)',   icon: '🛢️', intervalKm: 5000  },
  air_filter:       { label: '에어필터',         icon: '💨', intervalKm: 20000 },
  ac_filter:        { label: '에어컨 필터',      icon: '❄️', intervalKm: 12000 },
  tire_rotation:    { label: '타이어 위치교환',  icon: '🔄', intervalKm: 10000 },
  tire_replace:     { label: '타이어 교체',      icon: '🔧', intervalKm: 50000 },
  brake_pad:        { label: '브레이크 패드',    icon: '🛑', intervalKm: 40000 },
  spark_plug:       { label: '점화플러그',       icon: '⚡', intervalKm: 40000 },
  transmission_oil: { label: '미션오일',         icon: '⚙️', intervalKm: 50000 },
  coolant:          { label: '냉각수',           icon: '🌡️', intervalKm: 40000 },
};

export default function VehiclePassport() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const { vehicles } = useRce();
  const [detail, setDetail] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const vehicle = vehicles.find(v => v.ownerPhone === decodeURIComponent(phone ?? ''));

  useEffect(() => {
    if (!phone) return;
    setLoading(true);
    fetch(`${SERVER_URL}/api/rce/vehicles/${encodeURIComponent(phone)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setDetail(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [phone]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">차량 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <Car className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p>차량 정보를 찾을 수 없습니다.</p>
          <Button className="mt-4" onClick={() => navigate('/rce')}>RCE로 돌아가기</Button>
        </div>
      </div>
    );
  }

  const maintenanceItems = detail?.maintenanceStatus ?? [];
  const urgentItems = maintenanceItems.filter(m => m.urgent);
  const okItems = maintenanceItems.filter(m => !m.urgent && m.kmRemaining < 5000);
  const safeItems = maintenanceItems.filter(m => m.kmRemaining >= 5000);

  return (
    <div className="h-full overflow-y-auto bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background)/0.95)] backdrop-blur border-b border-[hsl(var(--border))] px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/rce')}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg leading-tight">차량 이력 여권</h1>
            <p className="text-xs text-muted-foreground">Asset History Passport</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-8">

        {/* Vehicle Identity Card */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/30 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
              🚗
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{vehicle.vehicleModel}</h2>
              <p className="text-sm text-muted-foreground">{vehicle.ownerName} · {vehicle.ownerPhone}</p>
              <div className="flex gap-3 mt-3">
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                  <Calendar className="w-3 h-3" /> {vehicle.regYear ?? '-'}년식
                </span>
                <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">
                  <Gauge className="w-3 h-3" /> {vehicle.visitCount}회 방문
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mileage Timeline */}
        <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))]">
          <h3 className="font-semibold text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> 주행 이력
          </h3>
          <div className="flex items-center gap-2 text-sm">
            {vehicle.firstVisitKm && (
              <>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">최초 방문</p>
                  <p className="font-bold text-base">{vehicle.firstVisitKm?.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">km</span></p>
                  <p className="text-xs text-muted-foreground">{vehicle.firstVisitDate}</p>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-blue-500 to-green-500 rounded relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs bg-[hsl(var(--card))] px-1 text-muted-foreground">
                      {vehicle.measuredAvgKm ? `월 ${vehicle.measuredAvgKm.toLocaleString()}km` : '추정 중'}
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">최근 방문</p>
                  <p className="font-bold text-base">{vehicle.lastVisitKm?.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">km</span></p>
                  <p className="text-xs text-muted-foreground">{vehicle.lastVisitDate}</p>
                </div>
              </>
            )}
          </div>
          {detail && (
            <div className="mt-3 pt-3 border-t border-[hsl(var(--border))] text-center">
              <p className="text-xs text-muted-foreground">현재 예상 주행거리</p>
              <p className="text-2xl font-bold text-blue-400">{detail.estimatedKm?.toLocaleString() ?? '-'} <span className="text-sm font-normal text-muted-foreground">km</span></p>
              <p className="text-xs text-muted-foreground mt-1">{detail.predictionTierLabel ?? '예측 불가'} 기반</p>
            </div>
          )}
        </div>

        {/* Maintenance Status */}
        {maintenanceItems.length > 0 && (
          <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))]">
            <h3 className="font-semibold text-sm text-muted-foreground mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> 소모품 현황
            </h3>
            <div className="space-y-3">
              {/* Urgent */}
              {urgentItems.map(item => {
                const meta = MAINTENANCE_LABELS[item.itemKey];
                return (
                  <div key={item.itemKey} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <span className="text-lg">{meta?.icon ?? '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-red-900/50 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full w-full" />
                        </div>
                        <span className="text-xs text-red-400 whitespace-nowrap">기한 초과</span>
                      </div>
                    </div>
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  </div>
                );
              })}
              {/* Warning */}
              {okItems.map(item => {
                const meta = MAINTENANCE_LABELS[item.itemKey];
                const progress = meta ? Math.min(100, 100 - (item.kmRemaining / meta.intervalKm) * 100) : 70;
                return (
                  <div key={item.itemKey} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <span className="text-lg">{meta?.icon ?? '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-yellow-900/50 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-yellow-400 whitespace-nowrap">{item.kmRemaining.toLocaleString()}km</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Safe */}
              {safeItems.slice(0, 4).map(item => {
                const meta = MAINTENANCE_LABELS[item.itemKey];
                const progress = meta ? Math.min(100, 100 - (item.kmRemaining / meta.intervalKm) * 100) : 20;
                return (
                  <div key={item.itemKey} className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
                    <span className="text-lg">{meta?.icon ?? '🔧'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-green-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500/60 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.kmRemaining.toLocaleString()}km</span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500/60 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Overall Health Score */}
        <div className="rounded-xl border border-[hsl(var(--border))] p-4 bg-[hsl(var(--card))]">
          <h3 className="font-semibold text-sm text-muted-foreground mb-3">종합 차량 건강도</h3>
          {(() => {
            const urgentCount = urgentItems.length;
            const warnCount = okItems.length;
            const score = Math.max(10, Math.round(100 - urgentCount * 20 - warnCount * 8));
            const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400';
            const bg = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
            return (
              <div>
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black ${color}`}>{score}</span>
                  <span className="text-muted-foreground text-lg mb-1">/ 100</span>
                </div>
                <div className="mt-3 h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <div className={`h-full ${bg} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {urgentCount > 0 ? `⚠️ ${urgentCount}개 즉시 정비 필요` : '✅ 전반적으로 양호한 상태입니다.'}
                </p>
              </div>
            );
          })()}
        </div>

        {/* Passport Footer */}
        <div className="text-center py-4 text-xs text-muted-foreground">
          <p>🔐 BizPilot Asset History Passport™</p>
          <p className="mt-1">발급일: {new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </div>
    </div>
  );
}
