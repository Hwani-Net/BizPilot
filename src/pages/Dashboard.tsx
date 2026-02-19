import {
  DollarSign,
  TrendingUp,
  Phone,
  CalendarDays,
  PhoneMissed,
  CalendarPlus,
  Receipt,
  Send,
  Clock,
  Car,
  Wrench,
  Check,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useDashboard, type DashboardStats, type DashboardTrends } from '@/hooks/useDashboard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  WEEKLY_REVENUE,
  MONTHLY_GOAL,
  RECENT_CALLS,
  UPCOMING_BOOKINGS,
  formatWon as fmtWon,
} from '@/lib/mock-data';

// ─── Mock / derived data helpers ────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: 'AI 전화 에이전트', icon: Phone, href: '/calls', accent: 'bg-primary/15 text-primary hover:bg-primary/25' },
  { label: '새 예약', icon: CalendarPlus, href: '/bookings', accent: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' },
  { label: '영수증 업로드', icon: Receipt, href: '/accounting', accent: 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' },
  { label: 'RCE 캠페인', icon: Send, href: '/rce', accent: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' },
];

const formatWon = fmtWon;

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCards({ stats, trends }: { stats: DashboardStats, trends: DashboardTrends }) {
  const cards = [
    {
      label: '오늘 매출',
      value: formatWon(stats.todayRevenue),
      icon: DollarSign,
      trend: `+${trends.revenue}%`,
      trendUp: trends.revenue >= 0,
      accent: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: '월간 수입',
      value: formatWon(stats.monthlyRevenue),
      icon: TrendingUp,
      trend: `+8.2%`,
      trendUp: true,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: '오늘 통화',
      value: `${stats.totalCallsToday}건`,
      icon: Phone,
      trend: `+${trends.calls}건`,
      trendUp: trends.calls >= 0,
      accent: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: '오늘 예약',
      value: `${stats.activeBookings}건`,
      icon: CalendarDays,
      trend: `${trends.bookings}건`,
      trendUp: trends.bookings >= 0,
      accent: 'text-rose-400',
      bg: 'bg-rose-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="v0-glass v0-glass-hover rounded-xl p-4 lg:p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-[hsl(var(--text-muted))]">{card.label}</span>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', card.bg)}>
              <card.icon className={cn('w-5 h-5', card.accent)} />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">{card.value}</p>
          <p className={cn('text-xs font-medium mt-1.5', card.trendUp ? 'text-emerald-400' : 'text-rose-400')}>
            {card.trend}{' '}
            <span className="text-[hsl(var(--text-muted))]">전일 대비</span>
          </p>
        </div>
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {QUICK_ACTIONS.map((action) => (
        <Link
          key={action.label}
          to={action.href}
          className={cn(
            'v0-glass rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:scale-[1.03]',
            action.accent
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--bg))/0.3] flex items-center justify-center">
            <action.icon className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

function RevenueChart() {
  const goalPercent = Math.round((MONTHLY_GOAL.current / MONTHLY_GOAL.target) * 100);

  return (
    <div className="v0-glass rounded-2xl p-6 flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold text-[hsl(var(--text))]">주간 매출</h3>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">이번 주 일별 매출 현황</p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={WEEKLY_REVENUE} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: 'hsl(var(--text-muted))', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--text-muted))', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--bg-glass))',
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: '8px',
                backdropFilter: 'blur(12px)',
                color: 'hsl(var(--text))',
                fontSize: '12px',
              }}
              formatter={(value: unknown) => [
                formatWon(typeof value === 'number' ? value : 0),
                '매출',
              ]}
              cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[hsl(var(--text-muted))]">월간 목표 달성률</span>
          <span className="text-xs font-bold text-[hsl(var(--primary))]">{goalPercent}%</span>
        </div>
        <div className="w-full h-2.5 bg-[hsl(var(--bg-card))] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${goalPercent}%`,
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-[hsl(var(--text-muted))]">{formatWon(MONTHLY_GOAL.current)}</span>
          <span className="text-xs text-[hsl(var(--text-muted))]">{formatWon(MONTHLY_GOAL.target)}</span>
        </div>
      </div>
    </div>
  );
}

function RecentCallsList() {
  return (
    <div className="v0-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--text))]">최근 통화</h3>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">오늘 수신된 전화 목록</p>
        </div>
        <span className="text-xs bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))] px-2 py-1 rounded-full font-medium">
          {RECENT_CALLS.length}건
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {RECENT_CALLS.map((call) => (
          <div
            key={call.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--bg-card)/0.5)] hover:bg-[hsl(var(--bg-card))] transition-colors"
          >
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
              call.status === 'completed' ? 'bg-emerald-500/15' : 'bg-rose-500/15'
            )}>
              {call.status === 'completed' ? (
                <Phone className="w-4 h-4 text-emerald-400" />
              ) : (
                <PhoneMissed className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[hsl(var(--text))] truncate">{call.name}</p>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  call.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                )}>
                  {call.status === 'completed' ? '완료' : '부재중'}
                </span>
                {call.rce && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[hsl(var(--primary))/0.15] text-[hsl(var(--primary))] flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />RCE
                  </span>
                )}
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))]">{call.phone} {call.outcome && <span className="text-[hsl(var(--primary))/0.8]">· {call.outcome}</span>}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1">
                <Clock className="w-3 h-3" />{call.time}
              </p>
              <p className="text-xs text-[hsl(var(--text-muted))]">{call.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpcomingBookingsList() {
  return (
    <div className="v0-glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[hsl(var(--text))]">다가오는 예약</h3>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">오늘 남은 예약 일정</p>
        </div>
        <span className="text-xs bg-[hsl(var(--bg-card))] text-[hsl(var(--text-muted))] px-2 py-1 rounded-full font-medium">
          {UPCOMING_BOOKINGS.length}건
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {UPCOMING_BOOKINGS.map((booking) => (
          <div
            key={booking.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-[hsl(var(--bg-card)/0.5)] hover:bg-[hsl(var(--bg-card))] transition-colors group"
          >
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
              booking.rce ? 'bg-[hsl(var(--primary))/0.2]' : 'bg-[hsl(var(--primary))/0.1]'
            )}>
              <Car className="w-4 h-4 text-[hsl(var(--primary))]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[hsl(var(--text))] truncate">{booking.customer}</p>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  booking.status === 'confirmed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                )}>
                  {booking.status === 'confirmed' ? '확정' : '대기중'}
                </span>
                {booking.rce && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[hsl(var(--primary))/0.15] text-[hsl(var(--primary))] flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />RCE 재방문
                  </span>
                )}
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))] truncate">{booking.vehicle} — {booking.service}</p>
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
              <p className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1">
                <Clock className="w-3 h-3" />{booking.time}
              </p>
              <div className="hidden group-hover:flex items-center gap-1">
                <button className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center hover:bg-emerald-500/25 transition-colors">
                  <Check className="w-3 h-3 text-emerald-400" />
                </button>
                <button className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center hover:bg-rose-500/25 transition-colors">
                  <X className="w-3 h-3 text-rose-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryRow({ stats }: { stats: DashboardStats }) {
  const summaryItems = [
    { label: '완료 정비', value: '2건', icon: Wrench, color: 'text-emerald-400' },
    { label: '대기 예약', value: `${stats.pendingActions}건`, icon: CalendarDays, color: 'text-amber-400' },
    { label: '순수익', value: formatWon(Math.round(stats.todayRevenue * 0.77)), icon: TrendingUp, color: 'text-blue-400' },
    { label: 'RCE 월 성과', value: '₩4,200,000', icon: Zap, color: 'text-[hsl(var(--primary))]' },
  ];

  return (
    <div className="v0-glass rounded-2xl p-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <item.icon className={cn('w-5 h-5 shrink-0', item.color)} />
            <div>
              <p className="text-xs text-[hsl(var(--text-muted))]">{item.label}</p>
              <p className="text-sm font-bold text-[hsl(var(--text))]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useI18n();
  const { stats, trends } = useDashboard();

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">
          {t('dashboard.greeting') || '안녕하세요, 강남 오토케어'}
        </h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">
          {today} — 오늘도 좋은 하루 되세요
        </p>
      </div>

      {/* KPI Cards */}
      <KpiCards stats={stats} trends={trends} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Revenue Chart + Recent Calls */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <RevenueChart />
        <RecentCallsList />
      </div>

      {/* Upcoming Bookings */}
      <UpcomingBookingsList />

      {/* Summary Row */}
      <SummaryRow stats={stats} />
    </div>
  );
}
