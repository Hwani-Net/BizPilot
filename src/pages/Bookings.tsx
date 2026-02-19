import { useState } from 'react';
import { Plus, Clock, X, Check, CalendarDays, User, Phone as PhoneIcon, Wrench, Car } from 'lucide-react';
import { useBookings } from '@/hooks/useBookings';
import { useI18n } from '@/hooks/useI18n';

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: '확정' },
  pending:   { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b', label: '대기' },
  cancelled: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', label: '취소' },
  completed: { bg: 'rgba(96,165,250,0.12)',  text: '#60a5fa', label: '완료' },
};

const LEFT_BORDER: Record<string, string> = {
  confirmed: '#10b981',
  pending:   '#f59e0b',
  cancelled: '#f87171',
  completed: '#60a5fa',
};

const TIMES = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];
const SERVICES = ['엔진오일 교환', '타이어 교체', '타이어 위치교환', '에어필터 교환', '에어컨 필터 교환', '브레이크 패드', '점화플러그', '정기점검', '미션오일', '배터리 교체', '기타'];

export default function Bookings() {
  const { bookings, addBooking, cancelBooking } = useBookings();
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '', customerPhone: '', vehicleModel: '', date: '', time: '10:00', service: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBooking({ ...formData, status: 'pending', notes: '' });
    setShowForm(false);
    setFormData({ customerName: '', customerPhone: '', vehicleModel: '', date: '', time: '10:00', service: '' });
  };

  // Group by date, sorted ascending
  const grouped = bookings.reduce<Record<string, typeof bookings>>((acc, b) => {
    (acc[b.date] ??= []).push(b);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort();

  // Today's stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount  = bookings.filter(b => b.date === todayStr && b.status !== 'cancelled').length;
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const totalCount  = bookings.filter(b => b.status !== 'cancelled').length;

  return (
    <div className="p-5 md:p-7 space-y-6 animate-fade-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black gradient-text mb-0.5">
            {t('bookings.title')}
          </h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">입고 예약을 관리하고 새 예약을 추가하세요</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          {t('bookings.newBooking')}
        </button>
      </div>

      {/* ── Mini Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '오늘 예약', value: todayCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: '대기 중',   value: pendingCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { label: '전체 예약', value: totalCount,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-black mb-0.5" style={{ color }}>{value}</p>
            <p className="text-xs text-[hsl(var(--text-muted))]">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Booking List ── */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays size={40} className="mx-auto mb-3 text-[hsl(var(--text-muted))]" />
            <p className="text-[hsl(var(--text-muted))]">예약이 없습니다</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 text-sm">
              첫 예약 추가하기
            </button>
          </div>
        ) : (
          sortedDates.map((date) => {
            const isToday = date === todayStr;
            const label = new Date(date + 'T00:00:00').toLocaleDateString('ko-KR', {
              month: 'long', day: 'numeric', weekday: 'short',
            });
            return (
              <div key={date}>
                {/* Date label */}
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-sm font-bold text-[hsl(var(--text))]">{label}</p>
                  {isToday && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}
                    >
                      오늘
                    </span>
                  )}
                  <div className="flex-1 h-px bg-[hsl(var(--border)/0.3)]" />
                  <span className="text-xs text-[hsl(var(--text-muted))]">{grouped[date].length}건</span>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {grouped[date].map((b) => {
                    const style = STATUS_STYLE[b.status] ?? STATUS_STYLE.pending;
                    return (
                      <div
                        key={b.id}
                        className="card p-4 group relative"
                        style={{ borderLeft: `3px solid ${LEFT_BORDER[b.status] ?? '#60a5fa'}` }}
                      >
                        {/* Status badge */}
                        <span
                          className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: style.bg, color: style.text }}
                        >
                          {style.label}
                        </span>

                        {/* Customer info */}
                        <div className="mb-3 pr-10">
                          <p className="font-bold text-[hsl(var(--text))] mb-0.5">{b.customerName}</p>
                          <p className="text-xs text-[hsl(var(--primary))] font-medium mb-0.5">{b.vehicleModel}</p>
                          <p className="text-xs text-[hsl(var(--text-muted))]">{b.customerPhone}</p>
                        </div>

                        {/* Details */}
                        <div className="flex items-center gap-3 text-xs text-[hsl(var(--text-muted))]">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            <span className="font-semibold text-[hsl(var(--text))]">{b.time}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Wrench size={11} />
                            {b.service}
                          </span>
                        </div>

                        {/* Cancel action */}
                        {b.status !== 'cancelled' && (
                          <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <button
                              onClick={() => cancelBooking(b.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors"
                              style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}
                            >
                              <X size={11} />{t('bookings.cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── New Booking Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="card w-full max-w-md p-6 animate-fade-up" style={{ border: '1px solid hsl(var(--primary)/0.3)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  <CalendarDays size={16} className="text-white" />
                </div>
                <h2 className="font-bold text-[hsl(var(--text))]">{t('bookings.newBooking')}</h2>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[hsl(var(--bg))] text-[hsl(var(--text-muted))] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
                <input
                  className="input-field pl-9"
                  placeholder="차주 이름"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <PhoneIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
                <input
                  className="input-field pl-9"
                  placeholder="010-0000-0000"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Car size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
                <input
                  className="input-field pl-9"
                  placeholder="차량명 (예: 그랜저 IG)"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="input-field"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <select
                  className="input-field"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                >
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <select
                className="input-field"
                value={formData.service}
                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                required
              >
                <option value="">서비스 선택</option>
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
                <Check size={16} />예약 확정
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
