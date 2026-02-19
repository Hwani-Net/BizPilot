export const transcriptMessages = [
  { id: 1, role: 'agent', text: '안녕하세요, 강남 오토케어 AI 에이전트입니다. 무엇을 도와드릴까요?', time: '14:32:05' },
  { id: 2, role: 'user', text: '네, 엔진오일 교환 예약하려고 하는데요.', time: '14:32:12' },
  { id: 3, role: 'agent', text: '엔진오일 교환 예약 도와드리겠습니다. 방문하실 날짜와 시간이 어떻게 되시나요?', time: '14:32:18' },
  { id: 4, role: 'user', text: '이번 주 토요일 오후 2시쯤 가능할까요?', time: '14:32:25' },
  { id: 5, role: 'agent', text: '잠시만 확인해보겠습니다... 네, 토요일 오후 2시에 예약 가능합니다. 차량 번호를 알려주세요.', time: '14:32:30' },
];

export const copilotSuggestions = [
  { id: 1, type: 'upsell' as const, text: '고객님의 차량은 최근 브레이크 패드 점검 시기가 도래했습니다. 함께 점검을 제안해보세요.' },
  { id: 2, type: 'script' as const, text: '엔진오일 교환 시 에어필터도 함께 교체하시면 연비 향상에 도움이 됩니다.' },
  { id: 3, type: 'booking' as const, text: '토요일 오후 2시는 혼잡할 수 있으니 30분 일찍 오시면 대기 시간을 줄일 수 있다고 안내해주세요.' },
];

export const callerInfo = {
  name: '김철수',
  phone: '010-1234-5678',
  vehicle: '현대 그랜저 IG (2019)',
  visitCount: 5,
  lastVisit: '2023-11-15',
  mainService: '엔진오일 교환',
  totalRevenue: 850000,
};

export function formatWon(amount: number) {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export const allBookings = [
  { id: 1, date: '2026-02-19', customer: '김영수', phone: '010-1111-2222', vehicle: '그랜저 IG', service: '엔진오일 교환', time: '15:00', status: 'confirmed' as const },
  { id: 2, date: '2026-02-19', customer: '박지현', phone: '010-3333-4444', vehicle: '소나타 DN8', service: '브레이크 패드 교환', time: '15:30', status: 'confirmed' as const },
  { id: 3, date: '2026-02-19', customer: '이준석', phone: '010-5555-6666', vehicle: 'BMW 520d', service: '타이어 교환', time: '16:00', status: 'pending' as const },
  { id: 4, date: '2026-02-20', customer: '최민수', phone: '010-7777-8888', vehicle: '아반떼 CN7', service: '종합 점검', time: '10:00', status: 'confirmed' as const },
  { id: 5, date: '2026-02-20', customer: '강호동', phone: '010-9999-0000', vehicle: '제네시스 G80', service: '에어컨 점검', time: '11:00', status: 'pending' as const },
];

export const accountingSummary = {
  totalIncome: 12500000,
  totalExpense: 4500000,
  netProfit: 8000000,
};

export const ledgerEntries = [
  { id: 1, date: '2026-02-19', type: 'income' as const, category: '정비', description: '그랜저 IG 엔진오일 교환', amount: 150000 },
  { id: 2, date: '2026-02-19', type: 'expense' as const, category: '부품', description: '엔진오일 10L 구매', amount: 80000 },
  { id: 3, date: '2026-02-18', type: 'income' as const, category: '정비', description: '소나타 브레이크 패드 교환', amount: 120000 },
  { id: 4, date: '2026-02-18', type: 'expense' as const, category: '운영비', description: '관리비 납부', amount: 250000 },
  { id: 5, date: '2026-02-17', type: 'income' as const, category: '정비', description: '아반떼 타이어 교환', amount: 400000 },
];
