import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Phone, Bot, User, Sparkles, TrendingUp, FileText, CalendarPlus, Car, Calendar, Wrench, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transcriptMessages, copilotSuggestions, callerInfo, formatWon } from "@/lib/mock-data";

// ─── Waveform Animation ─────────────────────────────────────────────────────

function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center gap-1 h-8">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full transition-all duration-150",
            color,
            active ? "animate-pulse" : "h-1"
          )}
          style={{
            height: active ? `${Math.max(20, Math.random() * 100)}%` : '4px',
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${0.5 + Math.random() * 0.5}s`
          }}
        />
      ))}
    </div>
  );
}

// ─── Agent Status Component ─────────────────────────────────────────────────

type AgentState = "idle" | "listening" | "speaking" | "processing";

const stateConfig: Record<AgentState, { label: string; color: string; ringColor: string; bgColor: string; pulseColor: string }> = {
  idle: { label: "대기중", color: "bg-[hsl(var(--text-muted))]", ringColor: "bg-[hsl(var(--text-muted))/0.3]", bgColor: "bg-[hsl(var(--bg-elevated))]", pulseColor: "bg-[hsl(var(--text-muted))]" },
  listening: { label: "수신중", color: "bg-[hsl(var(--accent))]", ringColor: "bg-[hsl(var(--accent))/0.3]", bgColor: "bg-[hsl(var(--accent))/0.1]", pulseColor: "bg-[hsl(var(--accent))]" },
  speaking: { label: "응답중", color: "bg-[hsl(var(--primary))]", ringColor: "bg-[hsl(var(--primary))/0.3]", bgColor: "bg-[hsl(var(--primary))/0.1]", pulseColor: "bg-[hsl(var(--primary))]" },
  processing: { label: "처리중", color: "bg-rose-500", ringColor: "bg-rose-500/30", bgColor: "bg-rose-500/10", pulseColor: "bg-rose-500" },
};

function AgentStatus({ isActive, setIsActive, state, setState }: any) {
  const config = stateConfig[state as AgentState];

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      setState("idle");
    } else {
      setIsActive(true);
      setState("listening");
    }
  };

  const cycleState = () => {
    if (!isActive) return;
    const states: AgentState[] = ["listening", "speaking", "processing"];
    const current = states.indexOf(state);
    setState(states[(current + 1) % states.length]);
  };

  // Simulate state changes for demo
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      cycleState();
    }, 4000);
    return () => clearInterval(interval);
  }, [isActive, state]);

  // Call timer simulator
  const [timer, setTimer] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => { clearInterval(interval); setTimer(0); };
  }, [isActive]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="v0-glass rounded-xl p-6 relative overflow-hidden">
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--primary))/0.05] to-transparent pointer-events-none" />
      )}
      <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
        <button onClick={cycleState} className="relative cursor-pointer bg-transparent border-0 p-0 outline-none hover:scale-105 transition-transform">
          <div className={cn("relative w-28 h-28 rounded-full flex items-center justify-center transition-colors duration-500", config.bgColor)}>
            {isActive && (
              <>
                <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", config.pulseColor)} />
                <div className={cn("absolute inset-2 rounded-full pulse-ring", config.ringColor)} style={{ animationDelay: "0.5s" }} />
              </>
            )}
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center relative z-10 transition-colors shadow-lg duration-300", config.color)}>
              {isActive ? (
                <Mic className="w-7 h-7 text-white animate-pulse" />
              ) : (
                <MicOff className="w-7 h-7 text-white" />
              )}
            </div>
          </div>
        </button>

        <div className="flex flex-col items-center sm:items-start gap-3 flex-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn("w-2.5 h-2.5 rounded-full transition-colors duration-300", config.color, isActive && "animate-pulse")} />
              <span className="text-lg font-semibold text-[hsl(var(--text))]">{config.label}</span>
            </div>
            {isActive && <Waveform active={state === 'speaking' || state === 'listening'} color={config.pulseColor} />}
          </div>
          <p className="text-sm text-[hsl(var(--text-muted))] text-center sm:text-left">
            {isActive
              ? "AI 에이전트가 통화를 처리하고 있습니다. 실시간 대화 내용이 아래에 표시됩니다."
              : "에이전트가 비활성 상태입니다. 시작 버튼을 눌러 전화 수신을 시뮬레이션하세요."
            }
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleToggle}
              variant={isActive ? "destructive" : "default"}
              className={cn("gap-2 shadow-sm transition-all", isActive ? "hover:bg-red-600" : "bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] hover:opacity-90")}
            >
              {isActive ? <Phone className="w-4 h-4 rotate-[135deg]" /> : <Phone className="w-4 h-4" />}
              {isActive ? "통화 종료" : "시뮬레이션 시작"}
            </Button>
          </div>
        </div>

        {isActive && (
          <div className="hidden sm:flex flex-col gap-2 text-right">
            <div className="text-xs text-[hsl(var(--text-muted))] uppercase tracking-wider">Call Duration</div>
            <div className="text-3xl font-mono font-bold text-[hsl(var(--primary))] tracking-widest">{formatTime(timer)}</div>
            <div className="text-xs text-[hsl(var(--text-muted))] font-medium">실시간 녹취 분석 중...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Transcript Component ───────────────────────────────────────────────────

function Transcript({ isActive }: { isActive: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      setVisibleCount(0);
      return;
    }
    // Simulate streaming transcript
    const interval = setInterval(() => {
      setVisibleCount(prev => prev < transcriptMessages.length ? prev + 1 : prev);
    }, 2500); // New message every 2.5s
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  const displayedMessages = isActive ? transcriptMessages.slice(0, visibleCount) : [];

  return (
    <div className="v0-glass rounded-xl p-5 flex flex-col h-[500px]">
      <div className="flex items-center justify-between mb-4 shrink-0 border-b border-[hsl(var(--border))] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">Live Transcript</h3>
          <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">실시간 음성-텍스트 변환 (STT)</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--accent))/0.1] border border-[hsl(var(--accent))/0.2]">
          <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-[hsl(var(--accent))] animate-pulse" : "bg-[hsl(var(--text-muted))]")} />
          <span className={cn("text-xs font-medium tracking-wide", isActive ? "text-[hsl(var(--accent))]" : "text-[hsl(var(--text-muted))]")}>
            {isActive ? "RECORDING" : "STANDBY"}
          </span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
        {!isActive ? (
          <div className="flex items-center justify-center h-full text-sm text-[hsl(var(--text-muted))] italic">
            시뮬레이션 시작 버튼을 눌러 데모를 확인하세요.
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {displayedMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300",
                  msg.role === "agent" ? "flex-row" : "flex-row-reverse"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === "agent" ? "bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]" : "bg-[hsl(var(--bg-elevated))]"
                )}>
                  {msg.role === "agent" ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-[hsl(var(--text-muted))]" />
                  )}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                  msg.role === "agent"
                    ? "bg-gradient-to-r from-[hsl(var(--primary))/0.1] to-[hsl(var(--primary))/0.05] border border-[hsl(var(--primary))/0.1] rounded-tl-sm text-[hsl(var(--text))]"
                    : "bg-[hsl(var(--bg-elevated))] border border-[hsl(var(--border))] rounded-tr-sm text-[hsl(var(--text))]"
                )}>
                  <p className="text-sm text-[hsl(var(--text))] leading-relaxed">{msg.text}</p>
                  <p className={cn(
                    "text-[10px] mt-1.5 font-medium tracking-wide",
                    msg.role === "agent" ? "text-[hsl(var(--primary))/0.7]" : "text-[hsl(var(--text-muted))]"
                  )}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {visibleCount < transcriptMessages.length && (
               <div className="flex gap-3 flex-row animate-pulse opacity-70">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]">
                   <Bot className="w-4 h-4 text-white" />
                 </div>
                 <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gradient-to-r from-[hsl(var(--primary))/0.1] to-[hsl(var(--primary))/0.05] border border-[hsl(var(--primary))/0.1] rounded-tl-sm flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-[hsl(var(--primary))/0.5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-[hsl(var(--primary))/0.5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-[hsl(var(--primary))/0.5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Copilot Sidebar Component ──────────────────────────────────────────────

const typeConfig = {
  upsell: { icon: TrendingUp, color: "text-[hsl(var(--accent))]", bg: "bg-[hsl(var(--accent))/0.1]", border: "border-[hsl(var(--accent))/0.2]", label: "업셀" },
  script: { icon: FileText, color: "text-[hsl(var(--primary))]", bg: "bg-[hsl(var(--primary))/0.1]", border: "border-[hsl(var(--primary))/0.2]", label: "스크립트" },
  booking: { icon: CalendarPlus, color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", label: "예약" },
};

function CopilotSidebar() {
  return (
    <div className="v0-glass rounded-xl p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary))/0.15] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">AI 코파일럿</h3>
          <p className="text-xs text-[hsl(var(--text-muted))]">실시간 제안</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {copilotSuggestions.map((suggestion) => {
          const config = typeConfig[suggestion.type];
          return (
            <button
              key={suggestion.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border text-left transition-all hover:scale-[1.01] cursor-pointer bg-transparent",
                config.bg,
                config.border
              )}
            >
              <config.icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
              <div className="flex-1">
                <span className={cn("text-[10px] font-semibold uppercase", config.color)}>{config.label}</span>
                <p className="text-xs text-[hsl(var(--text))/0.8] mt-0.5 leading-relaxed">{suggestion.text}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Caller Info Component ──────────────────────────────────────────────────

function CallerInfo() {
  const infoItems = [
    { label: "전화번호", value: callerInfo.phone, icon: Phone },
    { label: "차량", value: callerInfo.vehicle, icon: Car },
    { label: "방문 횟수", value: `${callerInfo.visitCount}회`, icon: Calendar },
    { label: "마지막 방문", value: callerInfo.lastVisit, icon: Calendar },
    { label: "주요 서비스", value: callerInfo.mainService, icon: Wrench },
    { label: "총 매출 기여", value: formatWon(callerInfo.totalRevenue), icon: DollarSign },
  ];

  return (
    <div className="v0-glass rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))/0.15] flex items-center justify-center">
          <User className="w-5 h-5 text-[hsl(var(--primary))]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">{callerInfo.name}</h3>
          <p className="text-xs text-[hsl(var(--text-muted))]">고객 정보</p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {infoItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 py-1.5">
            <item.icon className="w-4 h-4 text-[hsl(var(--text-muted))] shrink-0" />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs text-[hsl(var(--text-muted))]">{item.label}</span>
              <span className="text-xs font-medium text-[hsl(var(--text))]">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Calls() {
  const [state, setState] = useState<AgentState>("listening");
  const [isActive, setIsActive] = useState(false); // start as false for demo manually triggering

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 h-screen overflow-y-auto pb-20">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">AI 전화 에이전트</h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">실시간 AI 전화 응대 시스템</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <div className="lg:col-span-2 flex flex-col gap-5">
          <AgentStatus isActive={isActive} setIsActive={setIsActive} state={state} setState={setState} />
          <Transcript isActive={isActive} />
        </div>
        <div className="flex flex-col gap-5 sticky top-6">
          <CallerInfo />
          <CopilotSidebar />
        </div>
      </div>
    </div>
  );
}
