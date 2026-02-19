
import { useNavigate } from 'react-router-dom';
import {
  Car,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  AlertTriangle,
  Send,
  Bell,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const vehicles = [
  {
    id: 1,
    owner: "김민수",
    phone: "010-1234-5678",
    model: "그랜저 IG",
    number: "12가 3456",
    year: "2020",
    lastVisit: "최근 9월 15일",
    visitCount: 4,
    mileage: 76400,
    rceStatus: "active" as const,
    services: [
      { name: "엔진오일", usedKm: 4200, totalKm: 5000, urgent: true },
      { name: "타이어 교환", usedKm: 8400, totalKm: 20000, urgent: false },
    ],
    monthlyBill: "₩1,300km",
  },
  {
    id: 2,
    owner: "박서준",
    phone: "010-9876-5432",
    model: "소나타 DN8",
    number: "34나 5678",
    year: "2022",
    lastVisit: "최근 12월 20일",
    visitCount: 2,
    mileage: 43100,
    rceStatus: "active" as const,
    services: [
      { name: "엔진오일", usedKm: 3100, totalKm: 5000, urgent: false },
      { name: "타이어 교환", usedKm: 8100, totalKm: 20000, urgent: false },
    ],
    monthlyBill: "₩1,100km",
  },
  {
    id: 3,
    owner: "이있없",
    phone: "010-5555-1234",
    model: "BMW 320i",
    number: "56다 7890",
    year: "2019",
    lastVisit: "최근 1월 10일",
    visitCount: 6,
    mileage: 80750,
    rceStatus: "warning" as const,
    services: [
      { name: "엔진오일", usedKm: 4800, totalKm: 5000, urgent: true },
      { name: "타이어 교환", usedKm: 19500, totalKm: 20000, urgent: true },
    ],
    monthlyBill: "₩1,250km",
  },
  {
    id: 4,
    owner: "최드리",
    phone: "010-3333-7777",
    model: "투싼 NX4",
    number: "78라 1234",
    year: "2023",
    lastVisit: "최근 1월 15일",
    visitCount: 2,
    mileage: 15200,
    rceStatus: "active" as const,
    services: [
      { name: "엔진오일", usedKm: 1200, totalKm: 5000, urgent: false },
      { name: "타이어 교환", usedKm: 2200, totalKm: 20000, urgent: false },
    ],
    monthlyBill: "",
  },
];

const smsHistory = [
  { id: 1, type: "RCE", receiver: "김민수 (12가 3456)", content: "엔진오일 교환 주기가 도래했습니다. 예약 시 10% 할인!", date: "2024-02-18 10:00", status: "success" as const },
  { id: 2, type: "Booking", receiver: "박서준 (34나 5678)", content: "내일 14:00 정비 예약 확인 안내입니다.", date: "2024-02-18 14:30", status: "success" as const },
  { id: 3, type: "Promo", receiver: "이있없 (56다 7890)", content: "봄맞이 타이어 특별 할인 행사 안내", date: "2024-02-17 09:00", status: "failed" as const },
];

// ─── Content Components ──────────────────────────────────────────────────────

function VehicleList() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--text-muted))]" />
          <Input type="search" placeholder="차주명, 차량명, 전화번호 검색..." className="pl-9 bg-[hsl(var(--bg-elevated)_/_0.5)]" />
        </div>
        <Button size="sm" className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> 차량 등록
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((car) => (
          <div key={car.id} className="v0-glass v0-glass-hover rounded-xl p-4 flex flex-col gap-3 group">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[hsl(var(--text))]">{car.number}</h3>
                  <p className="text-xs text-[hsl(var(--text-muted))]">{car.model} ({car.year})</p>
                </div>
              </div>
              <button className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex justify-between text-xs text-[hsl(var(--text-muted))]">
              <span>차주: <span className="text-[hsl(var(--text))] font-medium">{car.owner}</span> · {car.phone}</span>
            </div>
            <div className="flex justify-between text-xs text-[hsl(var(--text-muted))]">
              <span>입고 {car.visitCount}회</span>
              <span>{car.lastVisit}</span>
              <span className="text-[hsl(var(--primary))] font-medium">· {car.mileage.toLocaleString()}km</span>
            </div>

            {/* Service progress bars */}
            <div className="flex flex-col gap-1.5">
              {car.services.map((svc) => (
                <div key={svc.name}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[11px] text-[hsl(var(--text-muted))]">{svc.name}</span>
                    <span className={cn(
                      "text-[10px] font-medium",
                      svc.urgent ? "text-rose-400" : "text-[hsl(var(--text-muted))]"
                    )}>
                      {svc.urgent ? "● 교환 시기" : `${(svc.usedKm / 1000).toFixed(0)},${((svc.usedKm % 1000) / 100).toFixed(0)}00km`}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[hsl(var(--border)_/_0.5)] overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        svc.urgent ? "bg-rose-500" : "bg-[hsl(var(--primary))]"
                      )}
                      style={{ width: `${Math.min(100, (svc.usedKm / svc.totalKm) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Badge */}
            <Badge variant="secondary" className={cn(
              "text-[10px] w-fit",
              car.rceStatus === "active" ? "bg-[hsl(var(--primary)_/_0.15)] text-[hsl(var(--primary))]" :
              car.rceStatus === "warning" ? "bg-amber-500/15 text-amber-400" :
              "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))]"
            )}>
              {car.rceStatus === "active" ? "RCE 활성" :
               car.rceStatus === "warning" ? "점검 필요" : "미가입"}
            </Badge>
            <button
              onClick={() => navigate(`/vehicles/${encodeURIComponent(car.phone)}`)}
              className="mt-1 text-xs text-[hsl(var(--primary))] hover:underline self-end"
            >
              이력 보기 →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitRegistration() {
  return (
    <div className="v0-glass rounded-xl p-6 max-w-2xl mx-auto mt-4">
      <h3 className="text-base font-bold text-[hsl(var(--text))] mb-1">방문/정비 등록</h3>
      <p className="text-xs text-[hsl(var(--text-muted))] mb-6">입고된 차량의 정비 내역을 기록합니다.</p>

      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[hsl(var(--text-muted))]">차량 번호</span>
            <Input placeholder="12가 3456" className="bg-[hsl(var(--bg-elevated)_/_0.5)]" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[hsl(var(--text-muted))]">주행 거리 (km)</span>
            <Input type="number" placeholder="50000" className="bg-[hsl(var(--bg-elevated)_/_0.5)]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-[hsl(var(--text-muted))]">정비 항목</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["엔진오일", "브레이크 패드", "타이어", "배터리", "에어컨 필터", "와이퍼"].map((item) => (
              <label key={item} className="flex items-center gap-2 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated)_/_0.3)] cursor-pointer hover:border-[hsl(var(--primary))] transition-colors">
                <input type="checkbox" className="rounded border-[hsl(var(--border))]" />
                <span className="text-sm text-[hsl(var(--text))]">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-[hsl(var(--text-muted))]">정비 메모</span>
          <Textarea placeholder="특이사항을 입력하세요..." className="bg-[hsl(var(--bg-elevated)_/_0.5)] resize-none" rows={4} />
        </div>

        <Button className="w-full sm:w-auto self-end mt-2">저장하기</Button>
      </div>
    </div>
  );
}

function SmsHistory() {
  return (
    <div className="flex flex-col gap-3">
      {smsHistory.map((sms) => (
        <div key={sms.id} className="v0-glass p-4 rounded-xl flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            sms.status === "success" ? "bg-emerald-500/15" : "bg-rose-500/15"
          )}>
            {sms.status === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="outline" className="text-[10px] py-0 h-5">{sms.type}</Badge>
              <span className="text-sm font-semibold text-[hsl(var(--text))] truncate">{sms.receiver}</span>
            </div>
            <p className="text-xs text-[hsl(var(--text-muted))] truncate">{sms.content}</p>
          </div>
          <span className="text-xs text-[hsl(var(--text-muted))] whitespace-nowrap">{sms.date}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Rce() {
  const urgentCount = vehicles.filter(v => v.rceStatus === "warning").length;

  return (
    <div className="p-5 lg:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[hsl(var(--text))] tracking-tight">RCE · 재방문 유도</h2>
          <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">차량별 주행거리 기반 정비 알림 자동화</p>
        </div>
        <span className="text-xs bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full font-semibold">◆ DEMO</span>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="v0-glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Car className="w-5 h-5 text-[hsl(var(--primary))]" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--text))]">{vehicles.length}</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">등록 차량</p>
        </div>
        <div className="v0-glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--text))]">2</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">알림 대상</p>
        </div>
        <div className="v0-glass rounded-xl p-4 text-center">
          <div className="flex items-center justify-center mb-2">
            <Send className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--text))]">2</p>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">이번 달 발송</p>
        </div>
      </div>

      {/* Warning Banner */}
      {urgentCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-sm text-amber-400 font-medium">
              <strong>{urgentCount}대</strong>의 차량이 즉시 교환이 필요한 소모품을 보유 중입니다.
            </span>
          </div>
          <button className="text-xs text-amber-400 font-semibold hover:underline shrink-0 flex items-center gap-1">
            <Send className="w-3 h-3" />알림 발송 →
          </button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="vehicles" className="flex flex-col gap-4">
        <TabsList className="w-full sm:w-auto self-start bg-[hsl(var(--bg-elevated))] p-1">
          <TabsTrigger value="vehicles" className="flex-1 sm:flex-none">☰ 차량 목록</TabsTrigger>
          <TabsTrigger value="visit" className="flex-1 sm:flex-none">+ 입고 등록</TabsTrigger>
          <TabsTrigger value="sms" className="flex-1 sm:flex-none">✈ 발송 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles">
          <VehicleList />
        </TabsContent>
        <TabsContent value="visit">
          <VisitRegistration />
        </TabsContent>
        <TabsContent value="sms">
          <SmsHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
