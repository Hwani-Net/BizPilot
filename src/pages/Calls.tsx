import { Phone, PhoneOff, Mic, MicOff, Sparkles, Clock, CalendarPlus, TrendingUp, Zap } from 'lucide-react';
import { useCallAgent } from '@/hooks/useCallAgent';
import { useI18n } from '@/hooks/useI18n';

const STATUS_CONFIG = {
  idle: { color: 'from-gray-400 to-gray-500', pulse: false, label: 'calls.status.idle' },
  connecting: { color: 'from-amber-400 to-amber-500', pulse: true, label: 'calls.status.processing' },
  listening: { color: 'from-emerald-400 to-emerald-500', pulse: true, label: 'calls.status.listening' },
  speaking: { color: 'from-blue-400 to-purple-500', pulse: true, label: 'calls.status.speaking' },
  processing: { color: 'from-amber-400 to-orange-500', pulse: true, label: 'calls.status.processing' },
  error: { color: 'from-red-400 to-red-500', pulse: false, label: 'common.error' },
} as const;

const SUGGESTION_ICONS = {
  script: Sparkles,
  booking: CalendarPlus,
  upsell: TrendingUp,
  info: Clock,
  action: Zap,
} as const;

export default function Calls() {
  const { status, transcript, suggestions, startAgent, stopAgent, error } = useCallAgent();
  const { t } = useI18n();
  const config = STATUS_CONFIG[status];
  const isActive = status !== 'idle' && status !== 'error';

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fade-up">
      <h1 className="text-2xl md:text-3xl font-bold gradient-text mb-6">{t('calls.title')}</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Agent Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Agent Control */}
          <div className="card p-6 md:p-8 flex flex-col items-center">
            {/* Status Ring */}
            <div className="relative mb-6">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-2xl transition-all duration-500 ${config.pulse ? 'animate-pulse-glow' : ''}`}>
                {isActive ? <Mic size={48} className="text-white" /> : <MicOff size={48} className="text-white/70" />}
              </div>
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r ${config.color} shadow-lg`}>
                {t(config.label)}
              </div>
            </div>

            {/* Start/Stop Button */}
            <button
              onClick={isActive ? stopAgent : startAgent}
              className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 ${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                  : 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]'
              }`}
            >
              {isActive ? <><PhoneOff size={20} />{t('calls.stopAgent')}</> : <><Phone size={20} />{t('calls.startAgent')}</>}
            </button>

            {error && (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            )}
          </div>

          {/* Transcript */}
          <div className="card p-5">
            <h2 className="font-semibold text-[hsl(var(--text))] mb-4">{t('calls.transcript')}</h2>
            <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto">
              {transcript.length === 0 ? (
                <p className="text-sm text-[hsl(var(--text-muted))] text-center py-8">{t('dashboard.noData')}</p>
              ) : (
                transcript.map((entry, i) => (
                  <div key={i} className={`flex ${entry.role === 'agent' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      entry.role === 'agent'
                        ? 'bg-gradient-to-r from-[hsl(var(--primary)/0.15)] to-[hsl(var(--accent)/0.15)] text-[hsl(var(--text))] rounded-br-md'
                        : 'bg-[hsl(var(--bg))] text-[hsl(var(--text))] rounded-bl-md'
                    }`}>
                      <p className="text-[10px] text-[hsl(var(--text-muted))] mb-0.5 font-medium">
                        {entry.role === 'agent' ? 'AI Agent' : 'Caller'}
                      </p>
                      {entry.text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Copilot Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[hsl(var(--primary))]" />
              <h2 className="font-semibold text-[hsl(var(--text))]">{t('calls.copilot.title')}</h2>
            </div>

            {suggestions.length === 0 ? (
              <p className="text-sm text-[hsl(var(--text-muted))] text-center py-6">{t('calls.startAgent')}</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((s) => {
                  const SIcon = SUGGESTION_ICONS[s.type];
                  return (
                    <div key={s.id} className="p-3 rounded-xl border border-[hsl(var(--border)/0.5)] hover:border-[hsl(var(--primary)/0.3)] transition-colors duration-200">
                      <div className="flex items-center gap-2 mb-1">
                        <SIcon size={14} className="text-[hsl(var(--primary))]" />
                        <span className="text-xs font-semibold text-[hsl(var(--text))]">{s.title}</span>
                        <span className="ml-auto text-[10px] text-[hsl(var(--text-muted))]">{Math.round(s.confidence * 100)}%</span>
                      </div>
                      <p className="text-xs text-[hsl(var(--text-muted))]">{s.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer Info placeholder */}
          <div className="card p-5">
            <h3 className="font-semibold text-[hsl(var(--text))] mb-3 text-sm">{t('calls.copilot.customerInfo')}</h3>
            <div className="space-y-2 text-xs text-[hsl(var(--text-muted))]">
              <div className="flex justify-between"><span>입고 횟수</span><span className="font-medium text-[hsl(var(--text))]">8회</span></div>
              <div className="flex justify-between"><span>마지막 입고</span><span className="font-medium text-[hsl(var(--text))]">3일 전</span></div>
              <div className="flex justify-between"><span>주 정비 유형</span><span className="font-medium text-[hsl(var(--text))]">엔진오일</span></div>
              <div className="flex justify-between"><span>누적 매출</span><span className="font-medium text-[hsl(var(--text))]">₩780,000</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
