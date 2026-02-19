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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { useDashboard } from '@/hooks/useDashboard';
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

// ─── Mock / derived data helpers ────────────────────────────────────────────

const WEEKLY_REVENUE = [
  { day: '월', revenue: 3_200_000 },
  { day: '화', revenue: 4_100_000 },
  { day: '수', revenue: 2_800_000 },
  { day: '목', revenue: 5_200_000 },
  { day: '금', revenue: 6_100_000 },
  { day: '토', revenue: 4_500_000 },
  { day: '일', revenue: 1_200_000 },
];

const MONTHLY_GOAL = { current: 38_720_000, target: 50_000_000 };

const RECENT_CALLS = [
  { id: 1, name: '김철수', phone: '010-1234-5678', time: '14:32', duration: '3:45', status: 'completed' as const },
  { id: 2, name: '박영희', phone: '010-9876-5432', time: '13:15', duration: '1:22', status: 'completed' as const },
  { id: 3, name: '이민호', phone: '010-5555-1234', time: '12:48', duration: '0:00', status: 'missed' as const },
  { id: 4, name: '정수진', phone: '010-3333-7890', time: '11:20', duration: '5:10', status: 'completed' as const },
  { id: 5, name: '최동욱', phone: '010-7777-4321', time: '10:05', duration: '0:00', status: 'missed' as const },
];

const UPCOMING_BOOKINGS = [
  { id: 1, customer: '김영수', vehicle: '그랜저 IG', time: '15:00', service: '엔진오일 교환', status: 'confirmed' as const },
  { id: 2, customer: '박지현', vehicle: '소나타 DN8', time: '15:30', service: '브레이크 패드 교환', status: 'confirmed' as const },
  { id: 3, customer: '이준석', vehicle: 'BMW 520d', time: '16:00', service: '타이어 교환', status: 'pending' as const },
  { id: 4, customer: '송미연', vehicle: '아반떼 CN7', time: '16:30', service: '종합 점검', status: 'confirmed' as const },
  { id: 5, customer: '한지훈', vehicle: '투싼 NX4', time: '17:00', service: '에어컨 점검', status: 'pending' as const },
];

const QUICK_ACTIONS = [
  { label: 'AI 전화 에이전트', icon: Phone, href: '/calls', accent: 'bg-primary/15 text-primary hover:bg-primary/25' },
  { label: '새 예약', icon: CalendarPlus, href: '/bookings', accent: 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25' },
  { label: '영수증 업로드', icon: Receipt, href: '/accounting', accent: 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' },
  { label: 'RCE 캠페인', icon: Send, href: '/rce', accent: 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25' },
];

function formatWon(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCards({ stats, trends }: { stats: ReturnType<typeof useDashboard>['stats'], trends: ReturnType<typeof useDashboard>['trends'] }) {
  const cards = [
    {
      label: '오늘 매출',
      value: formatWon(stats?.todayRevenue ?? 2_450_000),
      icon: DollarSign,
      trend: `+${trends?.revenue ?? 12.5}%`,
      trendUp: (trends?.revenue ?? 12.5) >= 0,
      accent: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: '월간 수입',
      value: formatWon(stats?.monthlyRevenue ?? 38_720_000),
      icon: TrendingUp,
      trend: `+8.2%`,
      trendUp: true,
      accent: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
    {
      label: '오늘 통화',
      value: `${stats?.totalCallsToday ?? 23}건`,
      icon: Phone,
      trend: `+3건`,
      trendUp: true,
      accent: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      label: '오늘 예약',
      value: `${stats?.activeBookings ?? 8}건`,
      icon: CalendarDays,
      trend: `-2건`,
      trendUp: false,
      accent: 'text-rose-400',
      bg: 'bg-rose-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="v0-glass v0-glass-hover rounded-xl p-4 lg:p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-[hsl(var(--text-muted))]">{card.label}</span>
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', card.bg)}>
              <card.icon className={cn('w-4 h-4', card.accent)} />
            </div>
          </div>
          <p className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">{card.value}</p>
          <p className={cn('text-xs font-medium mt-1', card.trendUp ? 'text-emerald-400' : 'text-rose-400')}>
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
            'v0-glass rounded-xl p-4 flex flex-col items-center gap-2.5 transition-all hover:scale-[1.02]',
            action.accent
          )}
        >
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--bg))/0.3] flex items-center justify-center">
            <action.icon className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-center">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

function RevenueChart() {
  const goalPercent = Math.round((MONTHLY_GOAL.current / MONTHLY_GOAL.target) * 100);

  return (
    <div className="v0-glass rounded-xl p-5 flex flex-col gap-5">
      <div>
        <h3 className="text-sm font-semibold text-[hsl(var(--text))]">주간 매출</h3>
        <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">이번 주 일별 매출 현황</p>
      </div>

      <div className="h-[200px] w-full">
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
    <div className="v0-glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">최근 통화</h3>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">오늘 수신된 전화 목록</p>
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[hsl(var(--text))] truncate">{call.name}</p>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  call.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                )}>
                  {call.status === 'completed' ? '완료' : '부재중'}
                </span>
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))]">{call.phone}</p>
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
    <div className="v0-glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">다가오는 예약</h3>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">오늘 남은 예약 일정</p>
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
            <div className="w-9 h-9 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center shrink-0">
              <Car className="w-4 h-4 text-[hsl(var(--primary))]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-[hsl(var(--text))] truncate">{booking.customer}</p>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                  booking.status === 'confirmed'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-amber-500/15 text-amber-400'
                )}>
                  {booking.status === 'confirmed' ? '확정' : '대기중'}
                </span>
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))]">{booking.vehicle} - {booking.service}</p>
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

function SummaryRow({ stats }: { stats: ReturnType<typeof useDashboard>['stats'] }) {
  const summaryItems = [
    { label: '완료 정비', value: '12건', icon: Wrench, color: 'text-emerald-400' },
    { label: '대기 예약', value: '5건', icon: CalendarDays, color: 'text-amber-400' },
    { label: '순수익', value: formatWon(stats?.todayRevenue ? stats.todayRevenue * 0.77 : 1_890_000), icon: TrendingUp, color: 'text-blue-400' },
    { label: '부재중 전화', value: '3건', icon: PhoneMissed, color: 'text-rose-400' },
  ];

  return (
    <div className="v0-glass rounded-xl p-4">
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
    <div className="p-4 lg:p-6 flex flex-col gap-5">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
