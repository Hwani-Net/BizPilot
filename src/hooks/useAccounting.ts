/**
 * useAccounting — Fetches real ledger & receipt data from the backend.
 * Falls back to static mock data when the server is unavailable (dev/demo).
 */
import { useState, useEffect, useCallback } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export interface Receipt {
  id: number;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  items: { name: string; quantity: number; totalPrice: number }[];
  status: 'pending' | 'verified';
  createdAt: string;
}

export interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  receiptId?: number;
  createdAt: string;
}

export interface AccountingSummary {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

// ── Static fallback data (used when backend is unreachable) ──

const FALLBACK_LEDGER: LedgerEntry[] = [
  { id: 1, date: '2026-02-19', description: '그랜저 IG 엔진오일 + 필터', category: '기술료', amount: 120000, type: 'income', createdAt: '' },
  { id: 2, date: '2026-02-19', description: '투싼 타이어 4본 교체',        category: '기술료', amount: 480000, type: 'income', createdAt: '' },
  { id: 3, date: '2026-02-19', description: '한국자동차 부품 (브레이크 패드)', category: '부품매입', amount: 85000, type: 'expense', createdAt: '' },
  { id: 4, date: '2026-02-19', description: '소나타 엔진오일 교환',        category: '기술료', amount: 95000, type: 'income', createdAt: '' },
  { id: 5, date: '2026-02-19', description: '한일루브리케이터 오일 매입',  category: '소모품', amount: 45000, type: 'expense', createdAt: '' },
  { id: 6, date: '2026-02-18', description: 'BMW 320i 에어필터 교환',      category: '기술료', amount: 75000, type: 'income', createdAt: '' },
  { id: 7, date: '2026-02-18', description: '쿠팡 세차 용품 주문',         category: '소모품', amount: 38000, type: 'expense', createdAt: '' },
  { id: 8, date: '2026-02-18', description: '티구안 타이어 4본 교체',      category: '기술료', amount: 520000, type: 'income', createdAt: '' },
];

const FALLBACK_RECEIPTS: Receipt[] = [
  { id: 1, vendor: '한국자동차 부품점', amount: 85000, date: '2026-02-19', category: '부품매입', items: [], status: 'verified', createdAt: '' },
  { id: 2, vendor: '한일루브리케이터 오일', amount: 45000, date: '2026-02-19', category: '소모품', items: [], status: 'verified', createdAt: '' },
  { id: 3, vendor: '쿠팡 세차 용품', amount: 38000, date: '2026-02-18', category: '소모품', items: [], status: 'pending', createdAt: '' },
  { id: 4, vendor: '한국타이어 직영점', amount: 520000, date: '2026-02-17', category: '부품매입', items: [], status: 'verified', createdAt: '' },
];

// ─────────────────────────────────────────────────────────────

interface UseAccountingReturn {
  ledger: LedgerEntry[];
  receipts: Receipt[];
  summary: AccountingSummary;
  loading: boolean;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => Promise<void>;
  verifyReceipt: (id: number) => Promise<void>;
  reload: () => void;
}

export function useAccounting(): UseAccountingReturn {
  const [ledger, setLedger] = useState<LedgerEntry[]>(FALLBACK_LEDGER);
  const [receipts, setReceipts] = useState<Receipt[]>(FALLBACK_RECEIPTS);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ledgerRes, receiptsRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/accounting/ledger`).catch(() => null),
        fetch(`${SERVER_URL}/api/accounting/receipts`).catch(() => null),
      ]);

      if (ledgerRes?.ok) {
        const data = await ledgerRes.json() as LedgerEntry[];
        if (data.length > 0) setLedger(data);
      }
      if (receiptsRes?.ok) {
        const data = await receiptsRes.json() as Receipt[];
        if (data.length > 0) setReceipts(data);
      }
    } catch {
      // Server offline — keep fallback data silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const addLedgerEntry = useCallback(async (entry: Omit<LedgerEntry, 'id' | 'createdAt'>) => {
    const res = await fetch(`${SERVER_URL}/api/accounting/ledger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => null);

    if (res?.ok) {
      const newEntry = await res.json() as LedgerEntry;
      setLedger(prev => [newEntry, ...prev]);
    } else {
      // Optimistic update for offline
      const optimistic: LedgerEntry = { ...entry, id: Date.now(), createdAt: new Date().toISOString() };
      setLedger(prev => [optimistic, ...prev]);
    }
  }, []);

  const verifyReceipt = useCallback(async (id: number) => {
    await fetch(`${SERVER_URL}/api/accounting/receipts/${id}/verify`, {
      method: 'PATCH',
    }).catch(() => null);
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: 'verified' as const } : r));
  }, []);

  const summary: AccountingSummary = {
    totalIncome:  ledger.filter(l => l.type === 'income').reduce((s, l) => s + l.amount, 0),
    totalExpense: ledger.filter(l => l.type === 'expense').reduce((s, l) => s + l.amount, 0),
    netProfit:    ledger.filter(l => l.type === 'income').reduce((s, l) => s + l.amount, 0)
                - ledger.filter(l => l.type === 'expense').reduce((s, l) => s + l.amount, 0),
  };

  return { ledger, receipts, summary, loading, addLedgerEntry, verifyReceipt, reload: fetchAll };
}
