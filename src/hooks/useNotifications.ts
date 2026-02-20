/**
 * useNotifications — Polls for aggregated alerts every 30s.
 */
import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export interface Notification {
  id: string;
  type: 'call' | 'rce' | 'receipt' | 'booking';
  icon: string;
  title: string;
  description: string;
  count: number;
  href: string;
  urgency: 'high' | 'medium' | 'low' | 'info';
  createdAt: string;
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 'missed-demo', type: 'call', icon: '📞', title: '부재중 전화 2건', description: '오늘 처리되지 않은 전화가 있습니다.', count: 2, href: '/calls', urgency: 'high', createdAt: new Date().toISOString() },
  { id: 'rce-demo', type: 'rce', icon: '🔧', title: 'RCE 정비 권장 3대', description: '정비 시기가 도래한 차량이 있습니다.', count: 3, href: '/rce', urgency: 'medium', createdAt: new Date().toISOString() },
  { id: 'receipts-demo', type: 'receipt', icon: '🧾', title: '미확인 영수증 1건', description: '검증이 필요한 영수증이 있습니다.', count: 1, href: '/accounting', urgency: 'low', createdAt: new Date().toISOString() },
  { id: 'bookings-demo', type: 'booking', icon: '📅', title: '오늘 예약 4건', description: '오늘 확정된 예약이 4건 있습니다.', count: 4, href: '/bookings', urgency: 'info', createdAt: new Date().toISOString() },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [totalCount, setTotalCount] = useState(10);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/notifications`).catch(() => null);
      if (res?.ok) {
        const data = await res.json();
        if (data.notifications?.length > 0) {
          setNotifications(data.notifications);
          setTotalCount(data.totalCount ?? 0);
        }
      }
    } catch {
      // Keep demo data
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return { notifications, totalCount, refresh: fetchNotifications };
}
