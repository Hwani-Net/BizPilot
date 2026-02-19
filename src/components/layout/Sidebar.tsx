import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Phone,
  CalendarDays,
  Receipt,
  Settings,
  Sun,
  Moon,
  Monitor,
  Languages,
  Zap,
  Wrench,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import type { Theme } from '@/types';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/calls', icon: Phone, labelKey: 'nav.calls' },
  { path: '/bookings', icon: CalendarDays, labelKey: 'nav.bookings' },
  { path: '/accounting', icon: Receipt, labelKey: 'nav.accounting' },
  { path: '/rce', icon: Wrench, labelKey: 'nav.rce' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
] as const;

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: '라이트' },
  { value: 'dark', icon: Moon, label: '다크' },
  { value: 'system', icon: Monitor, label: '시스템' },
];

export default function Sidebar() {
  const { theme, setTheme } = useTheme();
  const { locale, toggleLocale, t } = useI18n();

  return (
    <aside
      className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40"
      style={{
        width: '256px',
        background: 'hsl(var(--bg-glass))',
        backdropFilter: 'blur(28px) saturate(150%)',
        WebkitBackdropFilter: 'blur(28px) saturate(150%)',
        borderRight: '1px solid hsl(var(--border) / 0.3)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--border)/0.3)]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0 animate-float"
          style={{
            background: 'linear-gradient(135deg, hsl(217,91%,60%), hsl(256,80%,65%))',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          <Zap size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-black text-base leading-tight gradient-text">BizPilot</p>
          <p className="text-[10px] text-[hsl(var(--text-muted))] leading-tight truncate">
            {t('app.tagline')}
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--bg-card)/0.6)] hover:text-[hsl(var(--text))]'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                    boxShadow: '0 4px 14px hsla(var(--primary) / 0.3)',
                  }
                : {}
            }
          >
            <Icon size={19} className="flex-shrink-0" />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom Controls ── */}
      <div className="px-4 py-4 border-t border-[hsl(var(--border)/0.3)] space-y-2.5">
        {/* Theme */}
        <div className="flex items-center gap-1 rounded-xl p-1 bg-[hsl(var(--bg)/0.5)]">
          {THEME_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={value}
              className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                theme === value
                  ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                  : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]'
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        {/* Language */}
        <button
          onClick={toggleLocale}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--bg-card)/0.6)] hover:text-[hsl(var(--text))] transition-all duration-200"
        >
          <Languages size={14} />
          <span>{locale === 'ko' ? '한국어 → EN' : 'EN → 한국어'}</span>
        </button>

        {/* Version */}
        <p className="text-center text-[9px] text-[hsl(var(--text-muted)/0.5)] font-medium tracking-wider">
          BizPilot v1.0 · Hackathon 2026
        </p>
      </div>
    </aside>
  );
}
