import {
  TrendingUp,
  Phone,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Plus,
  Upload,
  Send,
  Clock,
  CheckCircle2,
  PhoneMissed,
  DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';

// Mock data
const STATS = [
  {
    key: 'todayRevenue',
    label: '오늘 매출',
    value: '₩1,250,000',
    change: '+12%',
    up: true,
    icon: DollarSign,
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    key: 'weekRevenue',
    label: '이번 주 매출',
    value: '₩8,750,000',
    change: '+8%',
    up: true,
    icon: TrendingUp,
    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    key: 'todayCalls',
    label: '오늘 통화',
    value: '12',
    change: '+3',
    up: true,
    icon: Phone,
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    key: 'todayBookings',
    label: '오늘 예약',
    value: '5',
    change: '-1',
    up: false,
    icon: CalendarDays,
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245,158,11,0.3)',
  },
];

const RECENT_CALLS = [
  { name: '김민수', phone: '010-1234-5678', time: '14:32', duration: '2:15', status: 'completed' as const },
  { name: '이지은', phone: '010-9876-5432', time: '13:45', duration: '5:02', status: 'completed' as const },
  { name: 'Unknown', phone: '02-555-1234', time: '12:20', duration: '0:00', status: 'missed' as const },
  { name: '박서준', phone: '010-5555-9999', time: '11:05', duration: '1:30', status: 'completed' as const },
  { name: '최유나', phone: '010-7777-3333', time: '10:15', duration: '3:45', status: 'completed' as const },
];

const UPCOMING_BOOKINGS = [
  { name: '김민수', vehicle: '그랜저 IG', time: '09:00', service: '엔진오일 교환', status: 'confirmed' as const },
  { name: '박서준', vehicle: '소나타 DN8', time: '11:00', service: '타이어 위치교환', status: 'pending' as const },
  { name: '이있었', vehicle: 'BMW 320i', time: '내일 10:00', service: '정기점검', status: 'confirmed' as const },
];


const QUICK_ACTIONS = [
  { label: 'AI 에이전트', icon: Sparkles, to: '/calls', gradient: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' },
  { label: '새 예약', icon: Plus, to: '/bookings', gradient: 'linear-gradient(135deg, #10b981, #0d9488)' },
  { label: '영수증 업로드', icon: Upload, to: '/accounting', gradient: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  { label: 'RCE 발송', icon: Send, to: '/settings', gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
];

const statusIcon = { completed: CheckCircle2, missed: PhoneMissed, active: Phone, voicemail: Clock };
const statusColor = { completed: '#10b981', missed: '#f87171', active: '#60a5fa', voicemail: '#fbbf24' };
const bookingBadge = {
  confirmed: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: '확정' },
  pending: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: '대기' },
  cancelled: { bg: 'rgba(248,113,113,0.12)', text: '#f87171', label: '취소' },
  completed: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', label: '완료' },
};

export default function Dashboard() {
  const { t } = useI18n();
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="p-5 md:p-7 space-y-6 animate-fade-up">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black gradient-text mb-0.5">
            {t('dashboard.title')}
          </h1>
          <p className="text-sm text-[hsl(var(--text-muted))]">{today}</p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-emerald-400"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI 에이전트 대기 중
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        {STATS.map(({ key, label, value, change, up, icon: Icon, gradient, glow }) => (
          <div
            key={key}
            className="card p-4 md:p-5 group cursor-default"
            style={{ '--card-glow': glow } as React.CSSProperties}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg"
                style={{ background: gradient }}
              >
                <Icon size={18} />
              </div>
              <span
                className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  color: up ? '#10b981' : '#f87171',
                  background: up ? 'rgba(16,185,129,0.1)' : 'rgba(248,113,113,0.1)',
                }}
              >
                {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {change}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-black text-[hsl(var(--text))] leading-tight">{value}</p>
            <p className="text-xs text-[hsl(var(--text-muted))] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-5">

        {/* Recent Calls */}
        <div className="lg:col-span-2 card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[hsl(var(--text))]">{t('dashboard.recentCalls')}</h2>
            <Link to="/calls" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-1">
            {RECENT_CALLS.map((call, i) => {
              const StatusIcon = statusIcon[call.status];
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[hsl(var(--bg))] transition-colors duration-150 cursor-pointer"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.7), hsl(var(--accent)/0.7))' }}
                  >
                    {call.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[hsl(var(--text))] truncate">{call.name}</p>
                    <p className="text-xs text-[hsl(var(--text-muted))] truncate">{call.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[hsl(var(--text-muted))]">{call.time}</p>
                    <div className="flex items-center gap-1 text-xs justify-end mt-0.5" style={{ color: statusColor[call.status] }}>
                      <StatusIcon size={11} />
                      <span className="font-medium">{call.duration}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[hsl(var(--text))]">{t('dashboard.upcomingBookings')}</h2>
            <Link to="/bookings" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
              {t('dashboard.viewAll')}
            </Link>
          </div>
          <div className="space-y-2.5">
            {UPCOMING_BOOKINGS.map((b, i) => {
              const badge = bookingBadge[b.status];
              return (
                <div
                  key={i}
                  className="p-3 rounded-xl transition-all duration-200 hover:scale-[1.01]"
                  style={{ border: '1px solid hsl(var(--border)/0.5)', background: 'hsl(var(--bg-card)/0.5)' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <p className="text-sm font-semibold text-[hsl(var(--text))] truncate">{b.name}</p>
                      <span className="text-[10px] text-[hsl(var(--primary))] font-medium truncate shrink-0 px-1.5 py-0.5 rounded bg-[hsl(var(--primary)/0.1)]">
                        {b.vehicle}
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-2"
                      style={{ background: badge.bg, color: badge.text }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--text-muted))]">
                    <Clock size={11} />
                    <span>{b.time}</span>
                    <span>·</span>
                    <span className="font-medium text-[hsl(var(--text))]">{b.service}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="card p-4 md:p-5">
        <h2 className="font-bold text-[hsl(var(--text))] mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ label, icon: Icon, to, gradient }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl transition-all duration-300 group"
              style={{ border: '1px solid hsl(var(--border)/0.4)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border)/0.4)';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              <div
                className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                style={{ background: gradient, width: '52px', height: '52px' }}
              >
                <Icon size={22} />
              </div>
              <span className="text-xs font-semibold text-[hsl(var(--text))] text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
