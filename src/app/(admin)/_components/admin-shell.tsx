'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { LogoutButton } from '@/components/auth/logout-button';
import { AnalyticsTracker } from '@/components/analytics/analytics-tracker';

type AdminShellProps = {
  children: ReactNode;
};

const navigation = [
  { href: '/dashboard', label: 'Inicio', icon: '📊' },
  { href: '/reports', label: 'Reportes', icon: '📈' },
  { href: '/sales-orders', label: 'Ventas', icon: '🛒' },
  { href: '/inventory-stock', label: 'Inventario', icon: '📦' },
  { href: '/production-orders', label: 'Producción', icon: '🏭' },
  {
    href: '/accounts-receivable',
    label: 'Cuentas por cobrar',
    icon: '💰',
  },
  { href: '/products', label: 'Productos', icon: '🍔' },
  { href: '/customers', label: 'Clientes', icon: '👥' },
  { href: '/mobile', label: 'Operación móvil', icon: '📱' },
] as const;

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-brand-gray-25/40 font-arkibal">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-brand-gray-75/20 bg-brand-black text-white md:flex">
        <div className="flex h-20 items-center border-b border-brand-gray-75/20 px-6">
          <Link
            href="/"
            className="font-grocry text-xl font-black tracking-tight text-brand-sand"
          >
            CRUMAFOOD
            <span className="-mt-1 block font-arkibal text-xs font-light uppercase tracking-widest text-brand-gray-25">
              Admin
            </span>
          </Link>
        </div>

        <nav
          className="flex-1 space-y-1.5 overflow-y-auto px-4 py-6"
          aria-label="Navegación del panel administrativo"
        >
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/10'
                    : 'text-brand-gray-25 hover:bg-brand-gray-75/30 hover:text-white'
                }`}
              >
                <span className="text-base" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex border-t border-brand-gray-75/20 p-4 *:w-full">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AnalyticsTracker area="admin" />
        <header className="flex h-20 items-center justify-between border-b border-brand-gray-25 bg-white px-6 md:px-8">
          <span className="text-xs font-black uppercase tracking-wider text-brand-gray-50">
            Módulo Administrativo
          </span>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-black text-brand-black">
                Administrador
              </p>
              <p className="text-[10px] font-light text-brand-gray-50">
                Crumafood Toluca
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-gray-25 bg-brand-blue font-grocry font-bold text-white shadow-sm">
              C
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
