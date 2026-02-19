// ===== BizPilot Core Types =====

// ----- Call & Agent -----
export interface CallRecord {
  id: string;
  callerName: string;
  callerPhone: string;
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  status: 'active' | 'completed' | 'missed' | 'voicemail';
  summary?: string;
  transcript?: TranscriptEntry[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface TranscriptEntry {
  role: 'caller' | 'agent';
  text: string;
  timestamp: number;
}

export interface CopilotSuggestion {
  id: string;
  type: 'script' | 'booking' | 'upsell' | 'info' | 'action';
  title: string;
  content: string;
  confidence: number;
}

// ----- Booking -----
export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  vehicleModel: string; // 차량명 (예: 그랜저 IG)
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  notes?: string;
  createdAt: string;
}

// ----- Accounting -----
export interface ReceiptEntry {
  id: string;
  imageUrl: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  category: string;
  items: ReceiptItem[];
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  receiptId?: string;
}

// ----- RCE (Revenue Continuity Engine) -----
export interface RCECampaign {
  id: string;
  customerName: string;
  customerPhone: string;
  lastVisit: string;
  daysSinceVisit: number;
  message: string;
  status: 'scheduled' | 'sent' | 'delivered' | 'failed';
  scheduledAt: string;
  sentAt?: string;
}

// ----- Dashboard -----
export interface DashboardStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayCalls: number;
  todayBookings: number;
  pendingReceipts: number;
}

// ----- Settings -----
export interface BusinessProfile {
  name: string;
  phone: string;
  address: string;
  category: string;
  operatingHours: {
    open: string;
    close: string;
    daysOff: number[];
  };
  aiGreeting: string;
  rceIntervalDays: number;
}

// ----- Theme & i18n -----
export type Theme = 'light' | 'dark' | 'system';
export type Locale = 'ko' | 'en';
