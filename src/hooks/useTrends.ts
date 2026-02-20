/**
 * useTrends — Fetches trending product data from the Trend Radar API.
 * Supports premium toggle for demo purposes.
 */
import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export interface TrendProduct {
  id: string;
  name: string;
  category: string;
  trendScore: number;
  reason: string;
  source: string;
  priceRange: string;
  recommendation: string;
  imageEmoji: string;
  warning?: string;
  locked?: boolean;
  updatedAt: string;
}

// Fallback demo data for offline
const DEMO_TRENDS: TrendProduct[] = [
  {
    id: 'trend-001', name: '3M 세라믹 코팅제 Pro', category: '코팅/광택', trendScore: 95,
    reason: '유튜브 "세알남" 채널에서 115만뷰 달성. 습식 코팅 시장 1위.',
    source: 'YouTube "세알남"', priceRange: '35,000~45,000원', imageEmoji: '✨',
    recommendation: '워시베이 보유 정비소는 객단가 5만원+ 상승 가능.', updatedAt: '2026-02-20',
  },
  {
    id: 'trend-002', name: '소낙스 풀 이펙트 휠 클리너', category: '세차용품', trendScore: 88,
    reason: '인스타 릴스 300만뷰. pH 중성으로 휠 손상 없음.',
    source: 'Instagram Reels', priceRange: '18,000~22,000원', imageEmoji: '🧴',
    recommendation: '무료 휠 클리닝 체험 이벤트로 신규 고객 유입.', updatedAt: '2026-02-19',
  },
  {
    id: 'trend-003', name: '보쉬 에어로트윈 와이퍼', category: '와이퍼', trendScore: 82,
    reason: '환절기 수요 급증. 네이버 검색 +340%.',
    source: '네이버 데이터랩', priceRange: '12,000~18,000원', imageEmoji: '🌧️',
    recommendation: '교체 공임 5,000원 + 부품 마진 확보.', updatedAt: '2026-02-18',
  },
];

export function useTrends() {
  const [trends, setTrends] = useState<TrendProduct[]>(DEMO_TRENDS);
  const [isPremium, setIsPremium] = useState(true); // default to premium for demo
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTrends = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/trends?premium=${isPremium}`);
      if (res.ok) {
        const data = await res.json();
        if (data.trends?.length > 0) {
          setTrends(data.trends);
          setTotalCount(data.totalCount ?? data.trends.length);
        }
      }
    } catch {
      // Keep demo data
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const togglePremium = useCallback(() => {
    setIsPremium((prev) => !prev);
  }, []);

  return { trends, isPremium, togglePremium, loading, totalCount, refresh: fetchTrends };
}
