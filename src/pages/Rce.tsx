import { useState } from 'react';
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
  Loader2,
  Zap,
} from "lucide-react";
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const initialVehicles = [
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

function VehicleList({ vehicles }: { vehicles: typeof initialVehicles }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[hsl(var(--text-muted))]" />
          <Input 
            type="search" 
            placeholder="차주명, 차량명, 전화번호 검색..." 
            className="pl-10 h-12 text-base bg-[hsl(var(--bg-elevated)_/_0.5)] focus:bg-[hsl(var(--bg-card))]" 
            style={{ color: 'hsl(var(--text))' }}
          />
        </div>
        <Button size="default" className="gap-2 shrink-0 text-base font-semibold h-12 px-5">
          <Plus className="w-4 h-4" /> 차량 등록
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((car) => (
          <div key={car.id} className="v0-glass v0-glass-hover rounded-2xl p-6 flex flex-col gap-4 group">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[hsl(var(--primary)_/_0.15)] flex items-center justify-center shrink-0">
                  <Car className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[hsl(var(--text))]">{car.number}</h3>
                  <p className="text-base text-[hsl(var(--text-muted))]">{car.model} ({car.year})</p>
                </div>
              </div>
              <button className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))] opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="flex justify-between text-base text-[hsl(var(--text-muted))]">
              <span>차주: <span className="text-[hsl(var(--text))] font-semibold">{car.owner}</span> · {car.phone}</span>
            </div>
            <div className="flex justify-between text-base text-[hsl(var(--text-muted))]">
              <span>입고 {car.visitCount}회</span>
              <span>{car.lastVisit}</span>
              <span className="text-[hsl(var(--primary))] font-semibold">· {car.mileage.toLocaleString()}km</span>
            </div>

            {/* Service progress bars */}
            <div className="flex flex-col gap-2">
              {car.services.map((svc) => (
                <div key={svc.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-[hsl(var(--text-muted))]">{svc.name}</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      svc.urgent ? "text-rose-400" : "text-[hsl(var(--text-muted))]"
                    )}>
                      {svc.urgent ? "● 교환 시기" : `${(svc.usedKm / 1000).toFixed(0)},${((svc.usedKm % 1000) / 100).toFixed(0)}00km`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--border)_/_0.5)] overflow-hidden">
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
              "text-sm w-fit border-0 px-3 py-1",
              car.rceStatus === "active" ? "bg-emerald-500/15 text-emerald-400" : // Changed to emerald for active status to stand out
              car.rceStatus === "warning" ? "bg-amber-500/15 text-amber-400 animate-pulse" : // Added pulse animation
              "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))]"
            )}>
              {car.rceStatus === "active" ? "RCE 모니터링 중" :
               car.rceStatus === "warning" ? "알림 발송 필요" : "미가입"}
            </Badge>
            <button
              onClick={() => navigate(`/vehicles/${encodeURIComponent(car.phone)}`)}
              className="mt-1 text-base font-semibold text-[hsl(var(--primary))] hover:underline self-end"
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
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("방문 및 정비 내역이 성공적으로 등록되었습니다!", {
        icon: '📝',
        description: '차량 RCE 주기가 자동으로 재계산됩니다.'
      });
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
    }, 1200);
  };

  return (
    <div className="v0-glass rounded-xl p-6 max-w-2xl mx-auto mt-4">
      <h3 className="text-lg font-bold text-[hsl(var(--text))] mb-1">방문/정비 등록</h3>
      <p className="text-sm text-[hsl(var(--text-muted))] mb-6">입고된 차량의 정비 내역을 기록합니다.</p>

      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[hsl(var(--text-muted))]">차량 번호</span>
            <Input placeholder="12가 3456" className="h-11 text-sm bg-[hsl(var(--bg-elevated)_/_0.5)] border-[hsl(var(--border))]" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-[hsl(var(--text-muted))]">주행 거리 (km)</span>
            <Input type="number" placeholder="50000" className="h-11 text-sm bg-[hsl(var(--bg-elevated)_/_0.5)] border-[hsl(var(--border))]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[hsl(var(--text-muted))]">정비 항목</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["엔진오일", "브레이크 패드", "타이어", "배터리", "에어컨 필터", "와이퍼"].map((item) => (
              <label key={item} className="flex items-center gap-2 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated)_/_0.3)] cursor-pointer hover:border-[hsl(var(--primary))] transition-colors group">
                <input type="checkbox" className="rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]" />
                <span className="text-sm font-medium text-[hsl(var(--text))] group-hover:text-[hsl(var(--primary))] transition-colors">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[hsl(var(--text-muted))]">정비 메모</span>
          <Textarea placeholder="특이사항을 입력하세요..." className="text-sm bg-[hsl(var(--bg-elevated)_/_0.5)] border-[hsl(var(--border))] resize-none focus:ring-[hsl(var(--primary))]" rows={4} />
        </div>

        <Button 
          className="w-full sm:w-auto self-end mt-2 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:opacity-90 shadow-md transition-all gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? '저장 중...' : '저장하기'}
        </Button>
      </div>
    </div>
  );
}

function SmsHistory() {
  return (
    <div className="flex flex-col gap-3">
      {smsHistory.map((sms) => (
        <div key={sms.id} className="v0-glass p-4 rounded-xl flex items-center gap-4 hover:bg-[hsl(var(--bg-card))] transition-colors group">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
            sms.status === "success" ? "bg-emerald-500/15" : "bg-rose-500/15"
          )}>
            {sms.status === "success" ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant="outline" className="text-xs py-0.5 h-6 border-[hsl(var(--border))]">{sms.type}</Badge>
              <span className="text-base font-semibold text-[hsl(var(--text))] truncate">{sms.receiver}</span>
            </div>
            <p className="text-sm text-[hsl(var(--text-muted))] truncate">{sms.content}</p>
          </div>
          <span className="text-sm text-[hsl(var(--text-muted))] whitespace-nowrap bg-[hsl(var(--bg-elevated))] px-3 py-1.5 rounded-md">{sms.date}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Rce() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [sending, setSending] = useState(false);

  const urgentCount = vehicles.filter(v => v.rceStatus === "warning").length;

  const handleSendCampaign = () => {
    setSending(true);
    toast("캠페인 메시지 발송 스케줄링 중...", { icon: <Loader2 className="w-4 h-4 animate-spin text-[hsl(var(--primary))]" /> });

    setTimeout(() => {
      setSending(false);
      // Confetti effect
      const end = Date.now() + 1.5 * 1000;
      const colors = ['#f59e0b', '#10b981', '#3b82f6'];

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());

      // Display Success Toast
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">✨ 혁신적 성과!</span>
          <span><b>{urgentCount}명</b>의 타겟 고객에게 맞춤형 캠페인이 발송되었습니다!</span>
          <span className="text-xs text-[hsl(var(--text-muted))] mt-1">AI 예측 모델이 가장 효과적인 전환 시점을 계산했습니다.</span>
        </div>,
        { duration: 5000 }
      );

      // Dismiss warnings locally for demo effect
      setVehicles(prev => prev.map(v => 
        v.rceStatus === "warning" ? { ...v, rceStatus: "active", services: v.services.map(s => ({ ...s, urgent: false })) } : v
      ));

    }, 2000);
  };

  return (
    <div className="p-6 lg:p-8 flex flex-col gap-5 overflow-y-auto pb-20 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-[hsl(var(--text))] tracking-tight">RCE 캠페인 매니저</h2>
          <p className="text-lg text-[hsl(var(--text-muted))] mt-1">AI 기반 차량 생애 주기 초맞춤 마케팅 (Revenue Continuity Engine)</p>
        </div>
        <span className="hidden sm:inline-flex text-base bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-500 px-5 py-2.5 rounded-full font-bold shadow-sm items-center gap-2 border border-amber-500/20">
          <Zap className="w-5 h-5" /> PRO
        </span>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="v0-glass rounded-2xl p-5 text-center group hover:bg-[hsl(var(--bg-card))] transition-colors cursor-default">
          <div className="flex items-center justify-center mb-3">
            <div className="w-13 h-13 rounded-full bg-[hsl(var(--primary))/0.15] flex items-center justify-center group-hover:scale-110 transition-transform" style={{width:'52px',height:'52px'}}>
               <Car className="w-6 h-6 text-[hsl(var(--primary))]" />
            </div>
          </div>
          <p className="text-4xl font-black text-[hsl(var(--text))]">{vehicles.length}</p>
          <p className="text-base text-[hsl(var(--text-muted))] mt-1">관리 중인 차량 (대)</p>
        </div>
        <div className="v0-glass rounded-2xl p-5 text-center group hover:bg-[hsl(var(--bg-card))] transition-colors cursor-default relative overflow-hidden">
          {urgentCount > 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/20 rounded-bl-full -mr-8 -mt-8 animate-pulse" />}
          <div className="flex items-center justify-center mb-3">
            <div className="rounded-full bg-amber-500/15 flex items-center justify-center group-hover:scale-110 transition-transform" style={{width:'52px',height:'52px'}}>
               <Bell className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-[hsl(var(--text))]">{urgentCount}</p>
          <p className="text-base text-[hsl(var(--text-muted))] mt-1">정비 권장 대상 (대)</p>
        </div>
        <div className="v0-glass rounded-2xl p-5 text-center group hover:bg-[hsl(var(--bg-card))] transition-colors cursor-default">
          <div className="flex items-center justify-center mb-3">
            <div className="rounded-full bg-emerald-500/15 flex items-center justify-center group-hover:scale-110 transition-transform" style={{width:'52px',height:'52px'}}>
               <Send className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-[hsl(var(--text))]">2</p>
          <p className="text-base text-[hsl(var(--text-muted))] mt-1">이번 달 자동 발송 (건)</p>
        </div>
      </div>

      {/* Warning Banner */}
      {urgentCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-amber-600/5 border border-amber-500/30 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)] animate-in slide-in-from-top-4 fade-in duration-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg text-[hsl(var(--text))] font-bold">
                기회 감지: {urgentCount}대의 차량이 즉시 점검 대상입니다.
              </span>
              <span className="text-base text-[hsl(var(--text-muted))] mt-0.5">방치 시 고객 이탈 우려가 있습니다. 선제 권유로 매출을 확보하세요.</span>
            </div>
          </div>
          <Button 
            onClick={handleSendCampaign}
            disabled={sending}
            className="w-full sm:w-auto shrink-0 bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold shadow-lg transition-all hover:scale-105 gap-2 h-12 text-base px-6"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {sending ? 'AI 문구 생성 중...' : '원클릭 캠페인 발송'}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="vehicles" className="flex flex-col gap-5 mt-1">
        <TabsList className="w-full sm:w-auto self-start bg-[hsl(var(--bg-glass))] border border-[hsl(var(--border))/0.5] p-1.5 h-14 shadow-sm">
          <TabsTrigger value="vehicles" className="flex-1 sm:flex-none text-base font-semibold data-[state=active]:bg-[hsl(var(--bg))] data-[state=active]:shadow-sm">📋 차량 상태 맵</TabsTrigger>
          <TabsTrigger value="visit" className="flex-1 sm:flex-none text-base font-semibold data-[state=active]:bg-[hsl(var(--bg))] data-[state=active]:shadow-sm">✍️ 수기 입고 리포트</TabsTrigger>
          <TabsTrigger value="sms" className="flex-1 sm:flex-none text-base font-semibold data-[state=active]:bg-[hsl(var(--bg))] data-[state=active]:shadow-sm">🔔 아웃바운드 이력</TabsTrigger>
        </TabsList>
        <TabsContent value="vehicles" className="focus-visible:outline-none">
          <VehicleList vehicles={vehicles} />
        </TabsContent>
        <TabsContent value="visit" className="focus-visible:outline-none animate-in fade-in zoom-in-95 duration-200">
          <VisitRegistration />
        </TabsContent>
        <TabsContent value="sms" className="focus-visible:outline-none animate-in fade-in zoom-in-95 duration-200">
          <SmsHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
