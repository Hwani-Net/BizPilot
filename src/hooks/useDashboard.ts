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

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SERVER_URL}/api/dashboard/stats`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTrends(data.trends);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, trends, loading, refresh: fetchStats };
}
