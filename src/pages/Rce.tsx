
import {
  Car,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Mock Data ──────────────────────────────────────────────────────────────

const vehicles = [
  { id: 1, owner: "김철수", model: "그랜저 IG", number: "12가 3456", year: "2020", lastVisit: "2023-11-15", rceStatus: "active" },
  { id: 2, owner: "이영희", model: "아반떼 CN7", number: "34나 5678", year: "2021", lastVisit: "2024-01-20", rceStatus: "inactive" },
  { id: 3, owner: "박민수", model: "쏘렌토 MQ4", number: "56다 7890", year: "2022", lastVisit: "2024-02-10", rceStatus: "warning" },
  { id: 4, owner: "최수진", model: "제네시스 G80", number: "78라 1234", year: "2023", lastVisit: "2024-02-15", rceStatus: "active" },
  { id: 5, owner: "정우성", model: "BMW 520i", number: "90마 5678", year: "2019", lastVisit: "2023-10-05", rceStatus: "active" },
];

const smsHistory = [
  { id: 1, type: "RCE", receiver: "김철수 (12가 3456)", content: "엔진오일 교환 주기가 도래했습니다. 예약 시 10% 할인!", date: "2024-02-18 10:00", status: "success" },
  { id: 2, type: "Booking", receiver: "이영희 (34나 5678)", content: "내일 14:00 정비 예약 확인 안내입니다.", date: "2024-02-18 14:30", status: "success" },
  { id: 3, type: "Promo", receiver: "박민수 (56다 7890)", content: "봄맞이 타이어 특별 할인 행사 안내", date: "2024-02-17 09:00", status: "failed" },
];

// ─── Content Components ─────────────────────────────────────────────────────

function VehicleList() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center bg-[hsl(var(--bg-elevated))/0.3] p-1 rounded-lg">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[hsl(var(--text-muted))]" />
          <Input type="search" placeholder="차량번호 또는 차주명 검색..." className="pl-9 bg-[hsl(var(--bg-elevated))]" />
        </div>
        <Button size="sm" className="gap-2 hidden sm:flex">
          <Plus className="w-4 h-4" /> 차량 등록
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((car) => (
          <div key={car.id} className="v0-glass v0-glass-hover rounded-xl p-4 flex flex-col gap-3 group">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))/0.1] flex items-center justify-center">
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
            
            <div className="h-px bg-[hsl(var(--border))/0.5]" />
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-[hsl(var(--text-muted))]">차주: <span className="text-[hsl(var(--text))]">{car.owner}</span></span>
              <span className="text-[hsl(var(--text-muted))]">최근방문: {car.lastVisit}</span>
            </div>

            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className={cn(
                "text-[10px]",
                car.rceStatus === "active" ? "bg-[hsl(var(--accent))/0.1] text-[hsl(var(--accent))]" :
                car.rceStatus === "warning" ? "bg-amber-500/10 text-amber-500" :
                "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))]"
              )}>
                {car.rceStatus === "active" ? "RCE 활성" : 
                 car.rceStatus === "warning" ? "점검 필요" : "미가입"}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitRegistration() {
  return (
    <div className="v0-glass rounded-xl p-6 max-w-2xl mx-auto mt-4">
      <h3 className="text-lg font-bold text-[hsl(var(--text))] mb-1">방문/정비 등록</h3>
      <p className="text-xs text-[hsl(var(--text-muted))] mb-6">입고된 차량의 정비 내역을 기록합니다.</p>

      <div className="grid gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[hsl(var(--text-muted))]">차량 번호</span>
            <Input placeholder="12가 3456" className="bg-[hsl(var(--bg-elevated))]" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[hsl(var(--text-muted))]">주행 거리 (km)</span>
            <Input type="number" placeholder="50000" className="bg-[hsl(var(--bg-elevated))]" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-[hsl(var(--text-muted))]">정비 항목</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["엔진오일", "브레이크 패드", "타이어", "배터리", "에어컨 필터", "와이퍼"].map((item) => (
              <label key={item} className="flex items-center gap-2 p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))/0.3] cursor-pointer hover:border-[hsl(var(--primary))] transition-colors">
                <input type="checkbox" className="rounded border-[hsl(var(--border))]" />
                <span className="text-sm text-[hsl(var(--text))]">{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs text-[hsl(var(--text-muted))]">정비 메모</span>
          <Textarea placeholder="특이사항을 입력하세요..." className="bg-[hsl(var(--bg-elevated))] resize-none" rows={4} />
        </div>

        <Button className="w-full sm:w-auto self-end mt-2">저장하기</Button>
      </div>
    </div>
  );
}

function SmsHistory() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2">
        {smsHistory.map((sms) => (
          <div key={sms.id} className="v0-glass p-4 rounded-xl flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              sms.status === "success" ? "bg-[hsl(var(--accent))/0.1]" : "bg-rose-500/10"
            )}>
              {sms.status === "success" ? (
                <CheckCircle className={cn("w-5 h-5", sms.status === "success" ? "text-[hsl(var(--accent))]" : "text-rose-500")} />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="outline" className="text-[10px] py-0 h-5">
                  {sms.type}
                </Badge>
                <span className="text-sm font-semibold text-[hsl(var(--text))] truncate">{sms.receiver}</span>
              </div>
              <p className="text-xs text-[hsl(var(--text-muted))] truncate">{sms.content}</p>
            </div>
            <span className="text-xs text-[hsl(var(--text-muted))] whitespace-nowrap">{sms.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Rce() {
  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">RCE 엔진</h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">고객 재방문 유도 및 차량 관리 시스템</p>
      </div>

      <Tabs defaultValue="vehicles" className="flex flex-col gap-4">
        <TabsList className="w-full sm:w-auto self-start bg-[hsl(var(--bg-elevated))] p-1">
          <TabsTrigger value="vehicles" className="flex-1 sm:flex-none">차량 목록</TabsTrigger>
          <TabsTrigger value="visit" className="flex-1 sm:flex-none">등록/방문</TabsTrigger>
          <TabsTrigger value="sms" className="flex-1 sm:flex-none">SMS 이력</TabsTrigger>
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
