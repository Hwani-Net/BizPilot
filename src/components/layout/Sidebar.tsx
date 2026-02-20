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
  ScanLine,
  Flame,
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useI18n } from '@/hooks/useI18n';
import type { Theme } from '@/types';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/calls', icon: Phone, labelKey: 'nav.calls' },
  { path: '/bookings', icon: CalendarDays, labelKey: 'nav.bookings' },
  { path: '/scanner', icon: ScanLine, labelKey: 'nav.scanner' },
  { path: '/accounting', icon: Receipt, labelKey: 'nav.accounting' },
  { path: '/rce', icon: Wrench, labelKey: 'nav.rce' },
  { path: '/trends', icon: Flame, labelKey: 'nav.trends', badge: 'PRO' },
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
      className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40"
      style={{
        width: '300px',
        background: 'hsl(var(--bg-glass))',
        backdropFilter: 'blur(28px) saturate(150%)',
        WebkitBackdropFilter: 'blur(28px) saturate(150%)',
        borderRight: '1px solid hsl(var(--border) / 0.3)',
      }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[hsl(var(--border)/0.3)]">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-lg flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, hsl(217,91%,60%), hsl(256,80%,65%))',
            boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
          }}
        >
          <Zap size={17} />
        </div>
        <div className="min-w-0">
          <p className="font-black text-base leading-tight gradient-text">BizPilot</p>
          <p className="text-sm text-[hsl(var(--text-muted))] leading-tight">
            {t('app.tagline')}
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ path, icon: Icon, labelKey, ...rest }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-200 relative group ${
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
            <Icon size={17} className="flex-shrink-0" />
            <span>{t(labelKey)}</span>
            {'badge' in rest && rest.badge && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm ml-auto">
                {rest.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom Controls ── */}
      <div className="px-3 py-3 border-t border-[hsl(var(--border)/0.3)] space-y-2">
        {/* User info */}
        <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-[hsl(var(--bg-card)/0.5)]">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, hsl(217,91%,60%), hsl(256,80%,65%))' }}
          >
            강남
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[hsl(var(--text))] truncate">강남 오토케어</p>
            <p className="text-sm text-[hsl(var(--text-muted))] truncate">프리미엄 플랜</p>
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center gap-0.5 rounded-lg p-0.5 bg-[hsl(var(--bg)/0.5)]">
          {THEME_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={value}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                theme === value
                  ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                  : 'text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]'
              }`}
            >
              <Icon size={13} />
            </button>
          ))}
        </div>

        {/* Language */}
        <button
          onClick={toggleLocale}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--bg-card)/0.6)] hover:text-[hsl(var(--text))] transition-all duration-200"
        >
          <Languages size={13} />
          <span>{locale === 'ko' ? '한국어 → EN' : 'EN → 한국어'}</span>
        </button>
      </div>
    </aside>
  );
}
