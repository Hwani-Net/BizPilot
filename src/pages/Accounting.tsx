import { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Camera,
  Plus,
  X,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { accountingSummary, ledgerEntries, formatWon } from "@/lib/mock-data";

// ─── Accounting Summary Component ───────────────────────────────────────────

const summaryCards = [
  {
    label: "이번 달 수입",
    value: formatWon(accountingSummary.totalIncome),
    icon: TrendingUp,
    color: "text-[hsl(var(--accent))]",
    bg: "bg-[hsl(var(--accent))/0.1]",
  },
  {
    label: "이번 달 지출",
    value: formatWon(accountingSummary.totalExpense),
    icon: TrendingDown,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    label: "순이익",
    value: formatWon(accountingSummary.netProfit),
    icon: DollarSign,
    color: "text-[hsl(var(--primary))]",
    bg: "bg-[hsl(var(--primary))/0.1]",
  },
];

function AccountingSummary() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="v0-glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[hsl(var(--text-muted))]">{card.label}</span>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.bg)}>
                <card.icon className={cn("w-4 h-4", card.color)} />
              </div>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--text))] tracking-tight">{card.value}</p>
          </div>
        ))}
      </div>
      {/* RCE Insight Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[hsl(var(--primary))/0.3] bg-[hsl(var(--primary))/0.06]">
        <div className="w-8 h-8 rounded-lg bg-[hsl(var(--primary))/0.15] flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-[hsl(var(--primary))]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[hsl(var(--primary))]">RCE 엔진 성과</p>
          <p className="text-xs text-[hsl(var(--text-muted))]">이번 달 RCE 스마트알러트로 유도된 재방문 수익 <span className="font-bold text-[hsl(var(--primary))]">{formatWon(accountingSummary.rceContribution)}</span> (전체의 {Math.round(accountingSummary.rceContribution / accountingSummary.totalIncome * 100)}%)</p>
        </div>
      </div>
    </div>
  );
}

// ─── Accounting Actions Component ───────────────────────────────────────────

function AccountingActions() {
  const [openManual, setOpenManual] = useState(false);
  const [openOcr, setOpenOcr] = useState(false);
  const [entryType, setEntryType] = useState<"income" | "expense">("income");

  return (
    <div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setOpenOcr(true)} className="gap-2">
          <Camera className="w-4 h-4" />
          영수증 스캔
        </Button>
        <Button onClick={() => setOpenManual(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          수동 입력
        </Button>
      </div>

      {/* OCR Modal */}
      {openOcr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl p-6 relative animate-fade-up">
            <button onClick={() => setOpenOcr(false)} className="absolute top-4 right-4 text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]">
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-lg font-bold text-[hsl(var(--text))] mb-2">영수증 OCR 스캔</h2>
            <p className="text-sm text-[hsl(var(--text-muted))] mb-6">영수증 사진을 촬영하거나 파일을 업로드하세요</p>

            <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed border-[hsl(var(--border))] rounded-2xl bg-[hsl(var(--bg-elevated))/0.3]">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--bg-elevated))] flex items-center justify-center">
                <Camera className="w-8 h-8 text-[hsl(var(--text-muted))]" />
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="gap-2">
                  <Camera className="w-4 h-4" /> 카메로 촬영
                </Button>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" /> 파일 업로드
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {openManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[hsl(var(--bg-card))] border border-[hsl(var(--border))] rounded-xl shadow-2xl p-6 relative animate-fade-up">
            <h2 className="text-lg font-bold text-[hsl(var(--text))] mb-4">수입/지출 입력</h2>
            
            <div className="flex flex-col gap-4">
              <div className="flex rounded-lg overflow-hidden border border-[hsl(var(--border))] p-1 bg-[hsl(var(--bg-elevated))]">
                <button
                  onClick={() => setEntryType("income")}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium transition-colors rounded-md",
                    entryType === "income"
                      ? "bg-[hsl(var(--bg-card))] text-[hsl(var(--accent))] shadow-sm"
                      : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
                  )}
                >
                  수입
                </button>
                <button
                  onClick={() => setEntryType("expense")}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium transition-colors rounded-md",
                    entryType === "expense"
                      ? "bg-[hsl(var(--bg-card))] text-rose-500 shadow-sm"
                      : "text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
                  )}
                >
                  지출
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[hsl(var(--text-muted))]">날짜</span>
                  <Input type="date" className="bg-[hsl(var(--bg-elevated))]" defaultValue="2026-02-19" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-[hsl(var(--text-muted))]">카테고리</span>
                  <select className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))] px-3 py-2 text-sm text-[hsl(var(--text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]">
                    <option value="repair">정비</option>
                    <option value="parts">부품</option>
                    <option value="operation">운영비</option>
                    <option value="labor">인건비</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--text-muted))]">금액</span>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm text-[hsl(var(--text-muted))]">₩</span>
                  <Input type="number" placeholder="0" className="bg-[hsl(var(--bg-elevated))] pl-7" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-[hsl(var(--text-muted))]">설명</span>
                <Textarea placeholder="내용을 입력하세요" className="bg-[hsl(var(--bg-elevated))] resize-none" rows={3} />
              </div>

              <div className="flex gap-2 mt-2 justify-end">
                <Button variant="secondary" onClick={() => setOpenManual(false)}>취소</Button>
                <Button onClick={() => setOpenManual(false)}>저장</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ledger Table Component ─────────────────────────────────────────────────

function LedgerTable() {
  return (
    <div className="v0-glass rounded-xl overflow-hidden mt-5">
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <h3 className="text-sm font-semibold text-[hsl(var(--text))]">거래 내역</h3>
        <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">최근 수입/지출 기록</p>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))/0.5]">
              <th className="text-left text-xs font-medium text-[hsl(var(--text-muted))] px-4 py-3">날짜</th>
              <th className="text-left text-xs font-medium text-[hsl(var(--text-muted))] px-4 py-3">유형</th>
              <th className="text-left text-xs font-medium text-[hsl(var(--text-muted))] px-4 py-3">카테고리</th>
              <th className="text-left text-xs font-medium text-[hsl(var(--text-muted))] px-4 py-3">설명</th>
              <th className="text-right text-xs font-medium text-[hsl(var(--text-muted))] px-4 py-3">금액</th>
            </tr>
          </thead>
          <tbody>
            {ledgerEntries.map((entry) => (
              <tr key={entry.id} className="border-b border-[hsl(var(--border))/0.5] hover:bg-[hsl(var(--bg-elevated))] transition-colors">
                <td className="px-4 py-3 text-sm text-[hsl(var(--text-muted))]">{entry.date}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0 border",
                      entry.type === "income"
                        ? "bg-[hsl(var(--accent))/0.1] text-[hsl(var(--accent))] border-[hsl(var(--accent))/0.2]"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    )}
                  >
                    {entry.type === "income" ? "수입" : "지출"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-[hsl(var(--text-muted))]">{entry.category}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[hsl(var(--text))]">{entry.description}</span>
                    {entry.rce && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[hsl(var(--primary))/0.15] text-[hsl(var(--primary))] flex items-center gap-0.5 shrink-0">
                        <Zap className="w-2.5 h-2.5" />RCE
                      </span>
                    )}
                  </div>
                </td>
                <td className={cn(
                  "px-4 py-3 text-sm font-medium text-right tabular-nums",
                  entry.type === "income" ? "text-[hsl(var(--accent))]" : "text-rose-500"
                )}>
                  {entry.type === "income" ? "+" : "-"}{formatWon(entry.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="sm:hidden flex flex-col">
        {ledgerEntries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))/0.5]">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              entry.type === "income" ? "bg-[hsl(var(--accent))/0.15]" : "bg-rose-500/15"
            )}>
              {entry.type === "income" ? (
                <TrendingUp className="w-4 h-4 text-[hsl(var(--accent))]" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--text))] truncate">{entry.description}</p>
              <p className="text-xs text-[hsl(var(--text-muted))]">{entry.date} - {entry.category}</p>
            </div>
            <p className={cn(
              "text-sm font-semibold shrink-0 tabular-nums",
              entry.type === "income" ? "text-[hsl(var(--accent))]" : "text-rose-500"
            )}>
              {entry.type === "income" ? "+" : "-"}{formatWon(entry.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Accounting() {
  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">회계 장부</h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">수입/지출 내역을 관리하세요</p>
      </div>

      <AccountingSummary />
      <AccountingActions />
      <LedgerTable />
    </div>
  );
}
