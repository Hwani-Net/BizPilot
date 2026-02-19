/**
 * Shared types for BizPilot server.
 */

export interface TranscriptEntry {
  role: 'caller' | 'agent';
  text: string;
  timestamp: number;
}

export interface CallRecord {
  id: string;
  callerName?: string;
  callerPhone: string;
  startedAt: string;      // ISO 8601
  endedAt?: string;
  durationSec: number;
  status: 'active' | 'completed' | 'missed' | 'error';
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  transcript?: TranscriptEntry[];
  copilotSuggestions?: string[];
}

export interface OcrResult {
  vendor: string;
  amount: number;
  date: string;
  category?: string;
  items: { name: string; quantity: number; totalPrice: number }[];
  raw?: Record<string, unknown>;
}

export interface Receipt {
  id: number;
  imageUrl?: string;
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

export interface SmsRequest {
  to: string;
  message: string;
  type: 'rce' | 'booking_confirm' | 'custom';
}
