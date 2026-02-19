import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      <Sidebar />
      {/* 
        sidebar is w-64 = 256px fixed.
        We set margin-left via CSS var to guarantee correct offset
        regardless of Tailwind JIT generation.
      */}
      <main
        className="min-h-screen pb-20 transition-all duration-300"
        style={{ marginLeft: 'var(--sidebar-width, 0px)' }}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
