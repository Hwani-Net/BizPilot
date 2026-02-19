import { useState, useCallback } from 'react';
import type { Booking } from '@/types';

// Demo data — 자동차 정비소 입고 예약
const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    customerName: '김민수',
    customerPhone: '010-1234-5678',
    vehicleModel: '그랜저 IG (2020)',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    service: '엔진오일 (합성유) + 오일필터',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    customerName: '박서준',
    customerPhone: '010-9876-5432',
    vehicleModel: '소나타 DN8',
    date: new Date().toISOString().split('T')[0],
    time: '11:00',
    service: '타이어 4본 위치교환 + 공기압 체크',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b3',
    customerName: '이있었',
    customerPhone: '010-5555-1234',
    vehicleModel: 'BMW 320i',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:00',
    service: '정기점검 (10만 km) + 브레이크 패드',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b4',
    customerName: '최드리',
    customerPhone: '010-3333-7777',
    vehicleModel: '투싼 NX4',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '14:00',
    service: '타이어 4본 교체 (19인치)',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>(DEMO_BOOKINGS);
  const [loading, setLoading] = useState(false);

  const addBooking = useCallback((booking: Omit<Booking, 'id' | 'createdAt'>) => {
    setLoading(true);
    const newBooking: Booking = {
      ...booking,
      id: `b-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [...prev, newBooking]);
    setLoading(false);
    return newBooking;
  }, []);

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  }, []);

  const cancelBooking = useCallback((id: string) => {
    updateBooking(id, { status: 'cancelled' });
  }, [updateBooking]);

  const todayBookings = bookings.filter(
    (b) => b.date === new Date().toISOString().split('T')[0] && b.status !== 'cancelled'
  );

  return { bookings, todayBookings, addBooking, updateBooking, cancelBooking, loading } as const;
}
