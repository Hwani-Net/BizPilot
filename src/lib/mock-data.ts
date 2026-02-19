/**
 * Demo Mock Data — "강남 오토케어" Thursday 10:00 AM Scenario
 *
 * STORY FLOW:
 * 1. [RCE] Yesterday PM → Auto-SMS sent to 박지현 re: brake pads due
 * 2. [CALL] 08:47 → 박지현 calls in; AI agent handles → books appointment
 * 3. [BOOKING] Today's 6 bookings — 2 are RCE-driven revisits (marked)
 * 4. [DASHBOARD] ₩38.7M / ₩50M monthly goal (77%) — RCE contributed ₩4.2M
 * 5. [RCE] 이민호 urgent (overdue oil + tires) — alert banner active
 */

// ─── AI Phone Agent ─────────────────────────────────────────────────────────

export const callerInfo = {
  name: '박지현',
  phone: '010-9876-5432',
  vehicle: '소나타 DN8 (2022)',
  visitCount: 3,
  lastVisit: '2025-10-14',
  mainService: '브레이크 패드 교환',
  totalRevenue: 1_230_000,
  /** RCE flag: this visit was triggered by automated SMS yesterday */
  rceTriggered: true,
};

export const transcriptMessages = [
  {
    id: 1,
    role: 'agent' as const,
    text: '안녕하세요, 강남 오토케어입니다. 무엇을 도와드릴까요?',
    time: '08:47:02',
  },
  {
    id: 2,
    role: 'user' as const,
    text: '네, 안녕하세요. 어제 브레이크 패드 교환하라고 문자 받았는데요, 예약하고 싶어서요.',
    time: '08:47:09',
  },
  {
    id: 3,
    role: 'agent' as const,
    text: '네, 박지현 고객님 소나타 DN8 맞으시죠? 브레이크 패드 교환 도와드리겠습니다. 오늘 오후 2시에 예약 가능하세요?',
    time: '08:47:18',
  },
  {
    id: 4,
    role: 'user' as const,
    text: '오후 2시 괜찮아요. 혹시 앞뒤 다 교환하면 얼마예요?',
    time: '08:47:28',
  },
  {
    id: 5,
    role: 'agent' as const,
    text: '소나타 DN8 앞뒤 패드 풀 세트 교환은 공임 포함 약 18만 원입니다. 오늘 예약하시면 RCE 할인 10%도 적용돼서 16만 2천 원에 가능합니다. 예약 확정해 드릴까요?',
    time: '08:47:38',
  },
  {
    id: 6,
    role: 'user' as const,
    text: '네, 확정해주세요!',
    time: '08:47:45',
  },
  {
    id: 7,
    role: 'agent' as const,
    text: '오후 2시로 예약 완료됐습니다. 방문 30분 전에 알림 문자 보내드릴게요. 감사합니다!',
    time: '08:47:52',
  },
];

export const copilotSuggestions = [
  {
    id: 1,
    type: 'upsell' as const,
    text: '소나타 DN8 최근 타이어 마모도 점검 未실시 (12개월 초과). 패드 교환 시 함께 점검 제안 권장.',
  },
  {
    id: 2,
    type: 'script' as const,
    text: 'RCE 재방문 고객 — 10% 할인 쿠폰 적용 가능. "어제 문자 보내드렸죠?" 로 친밀감 형성.',
  },
  {
    id: 3,
    type: 'booking' as const,
    text: '오후 2시 슬롯 예약 가능 → 예약 생성 버튼으로 즉시 확정.',
  },
  {
    id: 4,
    type: 'upsell' as const,
    text: '워셔액 보충 서비스 제안 (무료) — 고객 만족도 상승 효과 높음.',
  },
];

export function formatWon(amount: number) {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

// ─── Bookings ───────────────────────────────────────────────────────────────
// 2026-02-20 = Thursday (오늘)
// RCE-triggered revisits are marked with rce: true

export const allBookings = [
  // ── Today ──
  {
    id: 1,
    date: '2026-02-20',
    customer: '박지현',
    phone: '010-9876-5432',
    vehicle: '소나타 DN8',
    service: '브레이크 패드 교환 (앞뒤)',
    time: '14:00',
    status: 'confirmed' as const,
    rce: true,                // ← RCE SMS로 유도된 재방문
    note: 'AI 전화로 예약 완료 · RCE 10% 할인 적용',
  },
  {
    id: 2,
    date: '2026-02-20',
    customer: '김영수',
    phone: '010-1111-2222',
    vehicle: '그랜저 IG (2020)',
    service: '엔진오일 + 에어필터 교환',
    time: '10:00',
    status: 'confirmed' as const,
    rce: false,
    note: '',
  },
  {
    id: 3,
    date: '2026-02-20',
    customer: '이민호',
    phone: '010-5555-1234',
    vehicle: '쏘렌토 MQ4 (2021)',
    service: '종합 점검 (오일·타이어)',
    time: '11:30',
    status: 'pending' as const,
    rce: true,                // ← RCE 긴급 알림 후 인입
    note: '부재중 콜백 → 예약 전환 성공',
  },
  {
    id: 4,
    date: '2026-02-20',
    customer: '정수진',
    phone: '010-3333-7890',
    vehicle: '아반떼 CN7 (2022)',
    service: '타이어 4본 교체 (19인치)',
    time: '13:00',
    status: 'confirmed' as const,
    rce: false,
    note: '',
  },
  {
    id: 5,
    date: '2026-02-20',
    customer: '최동욱',
    phone: '010-7777-4321',
    vehicle: '투싼 NX4 (2023)',
    service: '에어컨 냉매 충전 + 필터 교환',
    time: '15:30',
    status: 'confirmed' as const,
    rce: false,
    note: '',
  },
  {
    id: 6,
    date: '2026-02-20',
    customer: '한지훈',
    phone: '010-2222-9999',
    vehicle: 'BMW 520i (2021)',
    service: '정기점검 (10만 km)',
    time: '17:00',
    status: 'pending' as const,
    rce: false,
    note: '',
  },
  // ── Tomorrow ──
  {
    id: 7,
    date: '2026-02-21',
    customer: '송미연',
    phone: '010-4444-5555',
    vehicle: '제네시스 GV80 (2023)',
    service: '엔진오일 교환 + 하체 점검',
    time: '10:00',
    status: 'confirmed' as const,
    rce: false,
    note: '',
  },
  {
    id: 8,
    date: '2026-02-21',
    customer: '오세진',
    phone: '010-6666-7777',
    vehicle: '카니발 (2022)',
    service: '브레이크 오일 교환',
    time: '14:00',
    status: 'pending' as const,
    rce: false,
    note: '',
  },
];

// ─── Accounting ──────────────────────────────────────────────────────────────
// Monthly summary reflects RCE-driven revenue

export const accountingSummary = {
  totalIncome: 14_850_000,   // Feb MTD
  totalExpense: 5_120_000,
  netProfit: 9_730_000,
  rceContribution: 4_200_000, // Revenue from RCE-triggered revisits this month
};

export const ledgerEntries = [
  // Today
  {
    id: 1,
    date: '2026-02-20',
    type: 'income' as const,
    category: '정비',
    description: '김영수 — 그랜저 IG 엔진오일+에어필터',
    amount: 95_000,
    rce: false,
  },
  {
    id: 2,
    date: '2026-02-20',
    type: 'income' as const,
    category: '정비',
    description: '이민호 — 쏘렌토 종합점검 (RCE 재방문)',
    amount: 180_000,
    rce: true,
  },
  // Yesterday
  {
    id: 3,
    date: '2026-02-19',
    type: 'income' as const,
    category: '정비',
    description: '박민수 — BMW 320i 타이어 4본 교체',
    amount: 520_000,
    rce: false,
  },
  {
    id: 4,
    date: '2026-02-19',
    type: 'income' as const,
    category: '정비',
    description: '이수연 — 아반떼 엔진오일 교환 (RCE 재방문)',
    amount: 65_000,
    rce: true,
  },
  {
    id: 5,
    date: '2026-02-19',
    type: 'expense' as const,
    category: '부품',
    description: '브레이크 패드 세트 12개 입고',
    amount: 480_000,
    rce: false,
  },
  {
    id: 6,
    date: '2026-02-18',
    type: 'income' as const,
    category: '정비',
    description: '한지훈 — 투싼 에어컨냉매+필터',
    amount: 142_000,
    rce: false,
  },
  {
    id: 7,
    date: '2026-02-18',
    type: 'expense' as const,
    category: '운영비',
    description: '2월 임대료 납부',
    amount: 2_200_000,
    rce: false,
  },
  {
    id: 8,
    date: '2026-02-17',
    type: 'income' as const,
    category: '정비',
    description: '최동욱 — 제네시스 G80 정기점검 (RCE)',
    amount: 350_000,
    rce: true,
  },
];

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const WEEKLY_REVENUE = [
  { day: '금', revenue: 2_850_000 },  // last week
  { day: '토', revenue: 1_450_000 },
  { day: '일', revenue: 480_000 },
  { day: '월', revenue: 3_200_000 },
  { day: '화', revenue: 4_100_000 },
  { day: '수', revenue: 2_980_000 },
  { day: '목', revenue: 1_420_000 },  // today (morning only, still counting)
];

export const MONTHLY_GOAL = {
  current: 38_720_000,
  target: 50_000_000,
  rceShare: 4_200_000,  // RCE-driven portion
};

// Calls feed — today's log showing AI + missed + RCE context
export const RECENT_CALLS = [
  {
    id: 1,
    name: '박지현',
    phone: '010-9876-5432',
    time: '08:47',
    duration: '5:12',
    status: 'completed' as const,
    outcome: '예약완료',    // AI booked → appointment #1
    rce: true,
  },
  {
    id: 2,
    name: '이민호',
    phone: '010-5555-1234',
    time: '09:03',
    duration: '0:00',
    status: 'missed' as const,
    outcome: '콜백예정',    // AI queued callback → became booking #3
    rce: true,
  },
  {
    id: 3,
    name: '김영수',
    phone: '010-1111-2222',
    time: '09:22',
    duration: '2:34',
    status: 'completed' as const,
    outcome: '예약확인',
    rce: false,
  },
  {
    id: 4,
    name: '정수진',
    phone: '010-3333-7890',
    time: '09:40',
    duration: '3:18',
    status: 'completed' as const,
    outcome: '예약완료',
    rce: false,
  },
  {
    id: 5,
    name: '모르는번호',
    phone: '010-8800-0000',
    time: '09:55',
    duration: '0:00',
    status: 'missed' as const,
    outcome: '미확인',
    rce: false,
  },
];

export const UPCOMING_BOOKINGS = allBookings
  .filter(b => b.date === '2026-02-20')
  .sort((a, b) => a.time.localeCompare(b.time));

// ─── Summary Row (bottom of dashboard) ──────────────────────────────────────

export const SUMMARY_ROW = [
  { label: '완료 정비', value: '2건', icon: 'Wrench', accent: 'text-[hsl(var(--accent))]' },
  { label: '대기 예약', value: '2건', icon: 'Clock', accent: 'text-amber-400' },
  { label: '순수익', value: '₩1,886,500', icon: 'TrendingUp', accent: 'text-emerald-400' },
  { label: 'RCE 성과', value: '₩4,200,000', icon: 'Zap', accent: 'text-[hsl(var(--primary))]' },
];
