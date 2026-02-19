import { useState } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Car,
  Phone,
  X,
  Check,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { allBookings } from "@/lib/mock-data";

// ─── Booking Stats Component ────────────────────────────────────────────────

const stats = [
  { label: "오늘 예약", value: "6건", icon: CalendarDays, color: "text-[hsl(var(--primary))]", bg: "bg-[hsl(var(--primary))/0.1]" },
  { label: "대기중", value: "2건", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "전체 예약", value: "8건", icon: CheckCircle, color: "text-[hsl(var(--accent))]", bg: "bg-[hsl(var(--accent))/0.1]" },
];

function BookingStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="v0-glass rounded-xl p-4 flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", stat.bg)}>
            <stat.icon className={cn("w-5 h-5", stat.color)} />
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--text-muted))]">{stat.label}</p>
            <p className="text-lg font-bold text-[hsl(var(--text))]">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Booking List Component ─────────────────────────────────────────────────

const statusConfig = {
  completed: { label: "완료", color: "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))]" },
  "in-progress": { label: "진행중", color: "bg-[hsl(var(--primary))/0.15] text-[hsl(var(--primary))]" },
  confirmed: { label: "확정", color: "bg-[hsl(var(--accent))/0.15] text-[hsl(var(--accent))]" },
  pending: { label: "대기중", color: "bg-amber-500/15 text-amber-500" },
};

const groupByDate = (bookings: typeof allBookings) => {
  const groups: Record<string, typeof allBookings> = {};
  for (const booking of bookings) {
    if (!groups[booking.date]) groups[booking.date] = [];
    groups[booking.date].push(booking);
  }
  return groups;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
};

function BookingList() {
  const [open, setOpen] = useState(false);
  const grouped = groupByDate(allBookings);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-xs hidden sm:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--text-muted))]" />
          <Input type="search" placeholder="예약 검색..." className="pl-9 bg-[hsl(var(--bg-elevated))]" />
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          새 예약
        </Button>
      </div>

      {Object.entries(grouped).map(([date, bookings]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-[hsl(var(--text-muted))] mb-3">{formatDateLabel(date)}</h3>
          <div className="flex flex-col gap-2">
            {bookings.map((booking) => {
              const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending;
              return (
                <div
                  key={booking.id}
                  className="v0-glass v0-glass-hover rounded-xl p-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))/0.1] flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-[hsl(var(--primary))]" />
                    </div>
                <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold text-[hsl(var(--text))]">{booking.customer}</p>
                        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", status.color)}>
                          {status.label}
                        </Badge>
                        {booking.rce && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[hsl(var(--primary))/0.15] text-[hsl(var(--primary))] flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" />RCE 재방문
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[hsl(var(--text-muted))]">
                        {booking.vehicle} — {booking.service}
                      </p>
                      {booking.note && (
                        <p className="text-[10px] text-[hsl(var(--primary))/0.7] mt-0.5">{booking.note}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />{booking.time}
                        </p>
                        <p className="text-xs text-[hsl(var(--text-muted))] flex items-center gap-1 justify-end">
                          <Phone className="w-3 h-3" />{booking.phone}
                        </p>
                      </div>
                      {(booking.status === "pending" || booking.status === "confirmed") && (
                        <div className="hidden group-hover:flex items-center gap-1.5">
                          <button className="w-7 h-7 rounded-full bg-[hsl(var(--accent))/0.15] flex items-center justify-center hover:bg-[hsl(var(--accent))/0.25] transition-colors">
                            <Check className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                          </button>
                          <button className="w-7 h-7 rounded-full bg-rose-500/15 flex items-center justify-center hover:bg-rose-500/25 transition-colors">
                            <X className="w-3.5 h-3.5 text-rose-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Simple Modal Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl p-6 relative animate-fade-up">
            <h2 className="text-lg font-bold text-[hsl(var(--text))] mb-4">새 예약 등록</h2>
            
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[hsl(var(--text-muted))]">고객명</span>
                  <Input placeholder="이름 입력" className="bg-[hsl(var(--bg-elevated))]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[hsl(var(--text-muted))]">전화번호</span>
                  <Input placeholder="010-0000-0000" className="bg-[hsl(var(--bg-elevated))]" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--text-muted))]">차량 정보</span>
                <Input placeholder="예: 소나타 DN8" className="bg-[hsl(var(--bg-elevated))]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[hsl(var(--text-muted))]">날짜</span>
                  <Input type="date" className="bg-[hsl(var(--bg-elevated))]" defaultValue="2026-02-19" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[hsl(var(--text-muted))]">시간</span>
                  <Input type="time" className="bg-[hsl(var(--bg-elevated))]" defaultValue="10:00" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--text-muted))]">서비스</span>
                <select className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))] px-3 py-2 text-sm text-[hsl(var(--text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                  <option value="oil">엔진오일 교환</option>
                  <option value="brake">브레이크 패드 교환</option>
                  <option value="tire">타이어 교환</option>
                  <option value="inspection">종합 점검</option>
                </select>
              </div>

              <div className="flex gap-2 mt-2 justify-end">
                <Button variant="secondary" onClick={() => setOpen(false)}>취소</Button>
                <Button onClick={() => setOpen(false)}>예약 등록</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Bookings() {
  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">예약 관리</h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">고객 예약 일정을 관리하세요</p>
      </div>

      <BookingStats />
      <BookingList />
    </div>
  );
}
