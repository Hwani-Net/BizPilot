import { useState, useEffect } from "react";
import { Building2, Mic, FileText, Gauge, Palette, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";

const voiceOptions = [
  { id: "professional", name: "프로페셔널", desc: "차분하고 신뢰감 있는 남성 음성" },
  { id: "friendly", name: "친근한", desc: "밝고 활기찬 여성 음성" },
  { id: "calm", name: "안정적인", desc: "부드럽고 안정감 있는 남성 음성" },
  { id: "energetic", name: "에너제틱", desc: "활발하고 열정적인 여성 음성" },
];

function SettingsContent() {
  const [selectedVoice, setSelectedVoice] = useState("professional");
  const [rceDistance, setRceDistance] = useState([500]);
  const { locale, setLocale } = useI18n();
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  // 테마 초기값 로드
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
    if (savedTheme) setTheme(savedTheme);
    else setTheme("system");
  }, []);

  // 테마 변경 적용
  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Business Profile */}
      <section className="v0-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">업체 정보</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[hsl(var(--text-muted))]">상호명</span>
              <Input defaultValue="강남 오토케어" className="bg-[hsl(var(--bg-elevated))]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-[hsl(var(--text-muted))]">전화번호</span>
              <Input defaultValue="02-1234-5678" className="bg-[hsl(var(--bg-elevated))]" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[hsl(var(--text-muted))]">주소</span>
            <Input defaultValue="서울특별시 강남구 테헤란로 123" className="bg-[hsl(var(--bg-elevated))]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[hsl(var(--text-muted))]">영업 시간</span>
            <Input defaultValue="월~금 09:00 - 18:00 / 토 09:00 - 14:00" className="bg-[hsl(var(--bg-elevated))]" />
          </div>
        </div>
      </section>

      {/* AI Voice */}
      <section className="v0-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mic className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">AI 음성 설정</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {voiceOptions.map((voice) => (
            <button
              key={voice.id}
              onClick={() => setSelectedVoice(voice.id)}
              className={cn(
                "p-3 rounded-lg border text-left transition-all cursor-pointer bg-transparent outline-none",
                selectedVoice === voice.id
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.1]"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))/0.5] hover:border-[hsl(var(--primary))/0.3]"
              )}
            >
              <p className="text-sm font-medium text-[hsl(var(--text))]">{voice.name}</p>
              <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5">{voice.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Greeting Script */}
      <section className="v0-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">인사말 스크립트</h3>
        </div>
        <Textarea
          className="bg-[hsl(var(--bg-elevated))] resize-none min-h-[100px]"
          defaultValue="안녕하세요, 강남 오토케어입니다. 차량 정비 및 예약 관련 문의를 도와드리겠습니다. 어떤 서비스가 필요하신가요?"
        />
        <p className="text-xs text-[hsl(var(--text-muted))] mt-2">
          AI 에이전트가 전화를 받을 때 사용하는 기본 인사말입니다.
        </p>
      </section>

      {/* RCE Alert Distance */}
      <section className="v0-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gauge className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">RCE 알림 거리</h3>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[hsl(var(--text-muted))]">정비 알림 잔여 거리 기준</span>
            <span className="text-sm font-bold text-[hsl(var(--primary))]">{rceDistance[0]}km</span>
          </div>
          <Slider
            value={rceDistance}
            onValueChange={setRceDistance}
            min={100}
            max={2000}
            step={100}
            className="w-full"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(var(--text-muted))]">100km</span>
            <span className="text-[10px] text-[hsl(var(--text-muted))]">2,000km</span>
          </div>
        </div>
      </section>

      {/* Theme & Language */}
      <section className="v0-glass rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h3 className="text-sm font-semibold text-[hsl(var(--text))]">테마 & 언어</h3>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs text-[hsl(var(--text-muted))] mb-2 block">테마</span>
            <div className="flex gap-2">
              {(["dark", "light", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border bg-transparent outline-none",
                    theme === t
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))/0.1] text-[hsl(var(--primary))]"
                      : "border-[hsl(var(--border))] bg-[hsl(var(--bg-elevated))/0.5] text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
                  )}
                >
                  {t === "dark" ? "다크" : t === "light" ? "라이트" : "시스템"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[hsl(var(--text-muted))]" />
              <div>
                <p className="text-sm text-[hsl(var(--text))]">언어</p>
                <p className="text-xs text-[hsl(var(--text-muted))]">
                  {locale === "ko" ? "한국어" : "English"}
                </p>
              </div>
            </div>
            <Switch
              checked={locale === "en"}
              onCheckedChange={(checked: boolean) => setLocale(checked ? "en" : "ko")}
            />
          </div>
        </div>
      </section>

      <Button className="w-full sm:w-auto">설정 저장</Button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function Settings() {
  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-[hsl(var(--text))] tracking-tight">설정</h2>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">비즈파일럿 시스템 설정을 관리하세요</p>
      </div>

      <SettingsContent />
    </div>
  );
}
