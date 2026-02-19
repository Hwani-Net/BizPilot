import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Phone,
  CalendarDays,
  Receipt,
  Wrench,
  Settings,
} from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/calls', icon: Phone, labelKey: 'nav.calls' },
  { path: '/bookings', icon: CalendarDays, labelKey: 'nav.bookings' },
  { path: '/accounting', icon: Receipt, labelKey: 'nav.accounting' },
  { path: '/rce', icon: Wrench, labelKey: 'nav.rce' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
] as const;

export default function MobileNav() {
  const { t } = useI18n();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-[hsl(var(--border)/0.5)] z-50 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map(({ path, icon: Icon, labelKey }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                isActive
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--text-muted))]'
              }`
            }
          >
            <Icon size={20} />
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
