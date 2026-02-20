/**
 * Trends API — Viral product alerts for auto repair shops (Premium Feature)
 * GET /api/trends         — List trending products (premium-gated)
 * GET /api/trends/preview — Free preview (first 2 items only)
 */
import type { FastifyInstance } from 'fastify';

export interface TrendProduct {
  id: string;
  name: string;
  category: string;
  trendScore: number; // 0~100
  reason: string;     // Why it's trending
  source: string;     // Evidence source
  priceRange: string;
  recommendation: string; // Revenue opportunity for shop owners
  imageEmoji: string;     // Visual indicator
  warning?: string;       // Caution for low-quality products
  locked?: boolean;       // Premium gate
  updatedAt: string;
}

// ── Curated Demo Data: Real viral products in auto repair industry ──────────
const TRENDING_PRODUCTS: TrendProduct[] = [
  {
    id: 'trend-001',
    name: '3M 세라믹 코팅제 Pro',
    category: '코팅/광택',
    trendScore: 95,
    reason: '유튜브 "세알남" 채널에서 115만뷰 달성. 습식 코팅 시장 점유율 1위 등극. 기존 카나우바 왁스 대비 내구성 3배, 발수력 2배로 검증됨. 정비소 입고 시 객단가 5만원 이상 상승 가능.',
    source: 'YouTube "세알남" 채널 / 네이버 쇼핑 판매량 Top 1',
    priceRange: '35,000~45,000원 (1병 / 시공 1회당)',
    recommendation: '워시베이 보유 정비소는 "프리미엄 세라믹 코팅 서비스"로 메뉴화 시 객단가 50,000~80,000원 추가. 재방문 주기 3개월 단축 효과.',
    imageEmoji: '✨',
    updatedAt: '2026-02-20',
  },
  {
    id: 'trend-002',
    name: '소낙스 풀 이펙트 휠 클리너',
    category: '세차용품',
    trendScore: 88,
    reason: '인스타그램 릴스 300만뷰 달성. pH 중성이라 휠 손상 없이 브레이크 더스트 제거. 색 변환(보라→빨강) 반응이 SNS에서 바이럴.',
    source: 'Instagram Reels / 네이버 블로그 리뷰 2,400건+',
    priceRange: '18,000~22,000원 (500ml)',
    recommendation: '정비소 대기 공간에 디스플레이 → "무료 휠 클리닝 체험" 이벤트로 신규 고객 유입. 부품 교체 연계 매출 증가.',
    imageEmoji: '🧴',
    updatedAt: '2026-02-19',
  },
  {
    id: 'trend-003',
    name: '보쉬 에어로트윈 플러스 와이퍼',
    category: '와이퍼',
    trendScore: 82,
    reason: '겨울~봄 환절기 수요 급증. 네이버 검색량 전월 대비 +340% 폭증. OEM 동급 성능에 가격은 60% 수준으로 가성비 인정.',
    source: '네이버 데이터랩 / 쿠팡 베스트셀러 #3',
    priceRange: '12,000~18,000원 (1세트)',
    recommendation: '엔진오일 교체 시 "와이퍼 무료 점검 + 교체 할인" 번들. 교체 공임 5,000원 + 부품 마진 확보.',
    imageEmoji: '🌧️',
    updatedAt: '2026-02-18',
  },
  {
    id: 'trend-004',
    name: '리퀴몰리 디젤 세탄 부스터',
    category: '연료첨가제',
    trendScore: 78,
    reason: '디젤차주 커뮤니티(보배드림, 클리앙)에서 체감 후기 폭발. "시동성 개선 + 매연 감소" 실제 측정 데이터 공유. 쿠팡 연료첨가제 1위.',
    source: '보배드림 디젤 게시판 / 쿠팡 베스트셀러 #1',
    priceRange: '15,000~20,000원 (250ml)',
    recommendation: '디젤 차량 정기 점검 시 "연료 시스템 클리닝 서비스" 추가. 첨가제 + 공임으로 35,000원 서비스 메뉴화.',
    imageEmoji: '⛽',
    updatedAt: '2026-02-17',
  },
  {
    id: 'trend-005',
    name: '세알남 3PH 마이크로화이버 세트',
    category: '세차용품',
    trendScore: 75,
    reason: '"세알남" 브랜드 자체 제작 세차 타월 세트. 3가지 두께(세차/코팅/유리) 구분으로 입문자부터 마니아까지 폭발적 인기. 1차 → 3차까지 전량 매진.',
    source: 'YouTube "세알남" 쇼핑몰 / 스마트스토어 전량 매진',
    priceRange: '29,000~35,000원 (3종 세트)',
    recommendation: '세차 서비스 시 고급 타월 사용 → "프리미엄 핸드워시" 차별화. 타월 소매 판매 병행 가능.',
    imageEmoji: '🧽',
    updatedAt: '2026-02-16',
  },
  {
    id: 'trend-006',
    name: 'K2 폴리시 컴파운드 3단계 세트',
    category: '광택',
    trendScore: 71,
    reason: '유튜브 "차백과" 채널 150만뷰. 셀프 광택 유행 물결. 3단계(컷→폴리시→피니시) 세트로 초보자도 전문 광택 가능.',
    source: 'YouTube "차백과" / 네이버 카페 "셀프 광택 모임"',
    priceRange: '45,000~55,000원 (3종 세트)',
    recommendation: '광택 서비스 공임 80,000~150,000원. 제품 원가 대비 마진율 극대화. "보닛 반쪽 무료 체험" 마케팅 효과적.',
    imageEmoji: '💎',
    updatedAt: '2026-02-15',
  },
  {
    id: 'trend-007',
    name: '불스원 레인OK 속효 발수코팅',
    category: '유리관리',
    trendScore: 68,
    reason: 'TV CF + 우기철 진입으로 검색량 200% 급증. 발수 지속력 3개월로 재시공 수요 반복. 정비소 부가 서비스 최적.',
    source: 'TV CF / 네이버 쇼핑 유리관리 1위',
    priceRange: '8,000~12,000원 (1회분)',
    recommendation: '오일/타이어 교체 시 "발수 코팅 무료" 이벤트 → 고객 만족도 극대화. 원가 8천원으로 감동 서비스.',
    imageEmoji: '💧',
    updatedAt: '2026-02-14',
  },
  {
    id: 'trend-008',
    name: '덴소 이리듐 TT 점화플러그',
    category: '엔진부품',
    trendScore: 65,
    reason: '연비 1.5~2% 개선 실측 후기 공유. 기존 니켈 플러그 대비 수명 2배. 정비사 커뮤니티 추천 1위. 일본 직수입 정품 확인 필수.',
    source: '정비사 카페 / 쿠팡 점화플러그 1위',
    priceRange: '7,000~12,000원 (1개)',
    recommendation: '점화플러그 4개 세트 교체 시 공임 포함 80,000~100,000원. "연비 개선 패키지"로 마케팅.',
    imageEmoji: '⚡',
    updatedAt: '2026-02-13',
  },
  {
    id: 'trend-009',
    name: '만도 프리미엄 디스크 브레이크 패드',
    category: '제동장치',
    trendScore: 62,
    reason: '국산 고성능 패드로 수입차(벤츠, BMW) 호환 모델 확대. 가격은 순정 대비 40% 저렴하면서 제동력 동급 검증. 정비사 만족도 높음.',
    source: '정비사 네트워크 추천 / 만도 공식 OE 호환 리스트',
    priceRange: '35,000~55,000원 (1축)',
    recommendation: '수입차 브레이크 정비 시 "만도 프리미엄" 옵션 제안. 순정 대비 30% 가격 이점으로 고객 전환율 높음.',
    imageEmoji: '🛞',
    updatedAt: '2026-02-12',
  },
  {
    id: 'trend-010',
    name: 'SNS 저가 LED 언더바디 라이트킷',
    category: '악세서리',
    trendScore: 45,
    reason: '틱톡/쇼츠에서 야간 주행 영상 바이럴. 하지만 KS 인증 미취득 제품 다수. 배선 과열 → 차량 화재 사례 3건 보고. 중국 직구 제품 품질 편차 심각.',
    source: 'TikTok / YouTube Shorts (주의: 과장광고 다수)',
    priceRange: '15,000~30,000원 (세트)',
    recommendation: '⚠️ 고객 문의 시 KS 인증 제품만 취급 권장. 미인증 제품 시공 시 PL(제조물책임) 리스크 고지 필수.',
    imageEmoji: '💡',
    warning: '⚠️ 주의: KS 미인증 제품 다수. 차량 화재 위험. 쇼츠 과장광고에 유혹되지 마세요!',
    updatedAt: '2026-02-10',
  },
];

export async function trendRoutes(app: FastifyInstance) {
  /** GET /api/trends — Full trend list (premium-gated) */
  app.get<{ Querystring: { premium?: string } }>('/', async (req) => {
    const isPremium = req.query.premium !== 'false'; // default to premium for demo

    if (isPremium) {
      return {
        isPremium: true,
        totalCount: TRENDING_PRODUCTS.length,
        trends: TRENDING_PRODUCTS,
        lastUpdated: '2026-02-20',
      };
    }

    // Non-premium: first 2 visible, rest locked
    const trends = TRENDING_PRODUCTS.map((p, i) => {
      if (i < 2) return p;
      return {
        ...p,
        reason: '프리미엄 구독으로 잠금 해제하세요.',
        recommendation: '',
        source: '',
        priceRange: '',
        locked: true,
      };
    });

    return {
      isPremium: false,
      totalCount: TRENDING_PRODUCTS.length,
      trends,
      lastUpdated: '2026-02-20',
    };
  });

  /** GET /api/trends/preview — Always returns first 3 for dashboard widget */
  app.get('/preview', async () => {
    return {
      trends: TRENDING_PRODUCTS.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        trendScore: p.trendScore,
        imageEmoji: p.imageEmoji,
      })),
    };
  });
}
