import { useState } from 'react';
import {
  Sun, Moon, Monitor, Languages, Save, CheckCircle2,
  Building2, Phone as PhoneIcon, MapPin, Briefcase,
  Clock, Mic, Volume2, MessageSquare, Bell, Zap,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import type { Theme } from '@/types';

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun,     label: '라이트' },
  { value: 'dark',  icon: Moon,    label: '다크' },
  { value: 'system',icon: Monitor, label: '시스템' },
];

const VOICE_OPTIONS = [
  { value: 'marin', label: 'Marin', desc: '자연스러운 여성 음성 (추천)' },
  { value: 'cedar', label: 'Cedar', desc: '차분한 남성 음성' },
  { value: 'coral', label: 'Coral', desc: '따뜻한 여성 음성' },
  { value: 'sage',  label: 'Sage',  desc: '전문적 중성 음성' },
];

function SectionHeader({ icon: Icon, title, desc }: { icon: typeof Save; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.2), hsl(var(--accent)/0.2))' }}
      >
        <Icon size={17} className="text-[hsl(var(--primary))]" />
      </div>
      <div>
        <p className="font-bold text-[hsl(var(--text))] text-sm">{title}</p>
        {desc && <p className="text-xs text-[hsl(var(--text-muted))]">{desc}</p>}
      </div>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { locale, toggleLocale, t } = useI18n();
  const [saved, setSaved] = useState(false);
  const [rceInterval, setRceInterval] = useState(7);
  const [aiVoice, setAiVoice] = useState('marin');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-5 md:p-7 animate-fade-up space-y-5 max-w-3xl">

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black gradient-text mb-0.5">{t('settings.title')}</h1>
        <p className="text-sm text-[hsl(var(--text-muted))]">사업장 및 AI 에이전트 환경을 설정하세요</p>
      </div>

      {/* ── Business Profile ── */}
      <section className="card p-5">
        <SectionHeader icon={Building2} title={t('settings.businessProfile')} desc="사업장 기본 정보" />
        <div className="grid md:grid-cols-2 gap-3">
          <div className="relative">
            <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
            <input className="input-field pl-9" placeholder="사업장 이름" defaultValue="비즈 카센터" />
          </div>
          <div className="relative">
            <PhoneIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
            <input className="input-field pl-9" placeholder="전화번호" defaultValue="02-123-4567" />
          </div>
          <div className="relative md:col-span-2">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
            <input className="input-field pl-9" placeholder="주소" defaultValue="서울시 강남구 테헤란로 123" />
          </div>
          <div className="relative">
            <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
            <input className="input-field pl-9" placeholder="업종" defaultValue="자동차 정비" />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--text-muted))]" />
              <input className="input-field pl-9" type="time" defaultValue="09:00" />
            </div>
            <span className="text-[hsl(var(--text-muted))] font-medium">~</span>
            <input className="input-field flex-1" type="time" defaultValue="21:00" />
          </div>
        </div>
      </section>

      {/* ── AI Settings ── */}
      <section className="card p-5">
        <SectionHeader icon={Mic} title={t('settings.aiSettings')} desc="AI 전화 에이전트 설정" />
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] mb-2 block flex items-center gap-1">
              <MessageSquare size={12} />인사말 스크립트
            </label>
            <textarea
              className="input-field min-h-[90px] resize-none text-sm leading-relaxed"
              defaultValue="안녕하세요, 비즈 카센터입니다. 정비 예약이나 문의 사항을 말씀해주세요."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[hsl(var(--text-muted))] mb-2 block flex items-center gap-1">
              <Volume2 size={12} />AI 음성 선택
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VOICE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  onClick={() => setAiVoice(value)}
                  className="text-left p-3 rounded-xl border transition-all duration-200"
                  style={{
                    borderColor: aiVoice === value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    background: aiVoice === value ? 'hsl(var(--primary)/0.08)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-bold text-[hsl(var(--text))]">{label}</p>
                    {aiVoice === value && <CheckCircle2 size={14} className="text-[hsl(var(--primary))]" />}
                  </div>
                  <p className="text-[10px] text-[hsl(var(--text-muted))]">{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── RCE Settings ── */}
      <section className="card p-5">
        <SectionHeader icon={Bell} title={t('settings.rceSettings')} desc="재방문 유도 문자 자동 발송" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[hsl(var(--text))] font-medium">발송 간격</label>
            <span
              className="text-sm font-black px-3 py-1 rounded-xl"
              style={{ background: 'hsl(var(--primary)/0.12)', color: 'hsl(var(--primary))' }}
            >
              {rceInterval * 100}km 임박 시
            </span>
          </div>
          <input
            type="range"
            min={3}
            max={30}
            value={rceInterval}
            onChange={(e) => setRceInterval(Number(e.target.value))}
            className="w-full accent-[hsl(var(--primary))]"
            style={{ accentColor: 'hsl(var(--primary))' }}
          />
          <div className="flex justify-between text-[10px] text-[hsl(var(--text-muted))]">
            <span>500km (엄격)</span>
            <span>|</span>
            <span>1,000km (표준)</span>
            <span>|</span>
            <span>1,500km (여유)</span>
          </div>
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs"
            style={{ background: 'hsl(var(--primary)/0.08)', border: '1px solid hsl(var(--primary)/0.2)' }}
          >
            <Zap size={13} className="text-[hsl(var(--primary))] mt-0.5 flex-shrink-0" />
            <p className="text-[hsl(var(--text-muted))]">
              주행거리 기반 예측: 차량별 평균 주행 패턴으로 다음 소모품 교체 시기가 <strong className="text-[hsl(var(--text))]">{rceInterval}km</strong> 이내로 다가오면 자동으로 안내 문자를 발송합니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── Appearance ── */}
      <div className="grid md:grid-cols-2 gap-5">
        <section className="card p-5">
          <SectionHeader icon={Sun} title={t('settings.theme')} />
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border"
                style={{
                  borderColor: theme === value ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  background: theme === value ? 'hsl(var(--primary)/0.1)' : 'transparent',
                  color: theme === value ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                }}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <SectionHeader icon={Languages} title={t('settings.language')} />
          <div className="flex gap-2">
            {(['ko', 'en'] as const).map((lang) => (
              <button
                key={lang}
                onClick={locale !== lang ? toggleLocale : undefined}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 border"
                style={{
                  borderColor: locale === lang ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  background: locale === lang ? 'hsl(var(--primary)/0.1)' : 'transparent',
                  color: locale === lang ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                }}
              >
                <Languages size={14} />
                <span>{lang === 'ko' ? '한국어' : 'English'}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ── Save Button ── */}
      <button
        onClick={handleSave}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold transition-all duration-300"
        style={saved ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}
      >
        {saved
          ? <><CheckCircle2 size={20} />{t('settings.saved')}</>
          : <><Save size={20} />{t('settings.save')}</>
        }
      </button>
    </div>
  );
}
