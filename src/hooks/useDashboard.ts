import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export interface DashboardStats {
  todayRevenue: number;
  monthlyRevenue: number;
  activeBookings: number;
  pendingActions: number;
  totalCallsToday: number;
  missedCalls: number;
}

export interface DashboardTrends {
  revenue: number;
  expense: number;
  calls: number;
  bookings: number;
}

export interface WeeklyRevenue {
  day: string;
  revenue: number;
  fullDate: string;
}

export interface ForecastData {
  nextWeekRevenue: number;
  confidence: number;
  rceExpectedVisits: number;
  breakdown: { item: string; revenue: number; count: number }[];
}

// Demo fallback data matching V0 design
const DEMO_STATS: DashboardStats = {
  todayRevenue: 2_450_000,
  monthlyRevenue: 38_720_000,
  activeBookings: 8,
  pendingActions: 3,
  totalCallsToday: 23,
  missedCalls: 3,
};

const DEMO_TRENDS: DashboardTrends = {
  revenue: 12.5,
  expense: -5.2,
  calls: 3,
  bookings: -2,
};

const DEMO_WEEKLY_REVENUE: WeeklyRevenue[] = [
  { day: '월', revenue: 1200000, fullDate: '2026-02-16' },
  { day: '화', revenue: 2100000, fullDate: '2026-02-17' },
  { day: '수', revenue: 1800000, fullDate: '2026-02-18' },
  { day: '목', revenue: 3200000, fullDate: '2026-02-19' },
  { day: '금', revenue: 2900000, fullDate: '2026-02-20' },
  { day: '토', revenue: 4500000, fullDate: '2026-02-21' },
  { day: '일', revenue: 3800000, fullDate: '2026-02-22' },
];

const DEMO_FORECAST: ForecastData = {
  nextWeekRevenue: 2340000,
  confidence: 82,
  rceExpectedVisits: 3,
  breakdown: [
    { item: '엔진오일 교체', revenue: 960000, count: 8 },
    { item: '브레이크 패드', revenue: 540000, count: 3 },
    { item: '타이어 교환', revenue: 480000, count: 2 },
    { item: '에어필터', revenue: 225000, count: 5 },
    { item: '냉각수 교체', revenue: 135000, count: 3 },
  ],
};

function hasRealData(s: DashboardStats): boolean {
  // Only consider it "real" data if there's actual revenue
  return s.todayRevenue > 0 && s.monthlyRevenue > 0;
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS);
  const [trends, setTrends] = useState<DashboardTrends>(DEMO_TRENDS);
  const [weeklyRevenue, setWeeklyRevenue] = useState<WeeklyRevenue[]>(DEMO_WEEKLY_REVENUE);
  const [forecast, setForecast] = useState<ForecastData>(DEMO_FORECAST);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/dashboard/stats`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        // Only use API data if it contains real values, otherwise keep demo
        if (data.stats && hasRealData(data.stats)) {
          setStats(data.stats);
          if (data.trends) setTrends(data.trends);
          if (data.weeklyRevenue) setWeeklyRevenue(data.weeklyRevenue);
        }
        if (data.forecast) setForecast(data.forecast);
      }
      // If fetch fails or returns empty data, DEMO_STATS remain in state
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, trends, weeklyRevenue, forecast, loading, refresh: fetchStats };
}
