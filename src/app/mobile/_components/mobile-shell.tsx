'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AnalyticsTracker } from '@/components/analytics/analytics-tracker';

const tasks = [
  { href: '/mobile', label: 'Inicio', icon: '⌂' },
  { href: '/mobile/receiving', label: 'Recepción', icon: '↓' },
  { href: '/mobile/production', label: 'Producción', icon: '⚙' },
  { href: '/mobile/picking', label: 'Picking', icon: '✓' },
] as const;

export function MobileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-dvh bg-brand-gray-25/40 pb-24 font-arkibal text-brand-black">
      <AnalyticsTracker area="mobile" />
      <header className="sticky top-0 z-20 border-b border-brand-gray-25 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/mobile" className="rounded-lg font-black tracking-tight focus-visible:ring-2 focus-visible:ring-brand-blue">CRUMAFOOD <span className="text-brand-blue">Mobile</span></Link>
          <Link href="/dashboard" className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue">Panel admin</Link>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl">{children}</div>
      <nav aria-label="Tareas móviles" className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-gray-25 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {tasks.map((task) => {
            const active = task.href === '/mobile'
              ? pathname === task.href
              : pathname.startsWith(task.href);
            return <Link key={task.href} href={task.href} aria-current={active ? 'page' : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue ${active ? 'text-brand-blue' : 'text-brand-gray-75'}`}><span aria-hidden="true" className="text-xl">{task.icon}</span>{task.label}</Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
