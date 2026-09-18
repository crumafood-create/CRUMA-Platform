'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/auth/logout-button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  // Arreglo de navegación interno para los administradores de CRUMAFOOD
  const navItems = [
    { href: '/dashboard', label: 'Inicio', icon: '📊' },
    { href: '/dashboard/pedidos', label: 'Pedidos / Ventas', icon: '📦' },
    { href: '/dashboard/catalogo', label: 'Gestionar Catálogo', icon: '🍔' },
    { href: '/dashboard/usuarios', label: 'Clientes', icon: '👥' },
  ];

  return (
    <div className="flex min-h-screen bg-brand-gray-25/40 font-arkibal">
      
      {/* 1. SIDEBAR FIJO (Estilo Premium Oscuro) */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-black text-white border-r border-brand-gray-75/20 shrink-0">
        
        {/* Encabezado del Sidebar */}
        <div className="h-20 flex items-center px-6 border-b border-brand-gray-75/20">
          <Link href="/" className="font-grocry text-xl font-black tracking-tight text-brand-sand">
            CRUMAFOOD <span className="text-xs font-arkibal font-light text-brand-gray-25 uppercase tracking-widest block -mt-1">Admin</span>
          </Link>
        </div>

        {/* Enlaces de Navegación del Panel */}
        <nav className="flex-1 px-4 py-6 space-y-1.5" aria-label="Navegación del panel administrativo">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-md shadow-brand-blue/10'
                    : 'text-brand-gray-25 hover:bg-brand-gray-75/30 hover:text-white'
                }`}
              >
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sección de Salida en la parte inferior */}
        <div className="p-4 border-t border-brand-gray-75/20 flex justify-stretch *:w-full">
          <LogoutButton />
        </div>
      </aside>

      {/* 2. CONTENEDOR DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Barra superior de estado (TopBar) */}
        <header className="h-20 bg-white border-b border-brand-gray-25 flex items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-brand-gray-50">
              Módulo Administrativo
            </span>
          </div>
          
          {/* Avatar / Perfil rápido */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black text-brand-black">Administrador</p>
              <p className="text-[10px] text-brand-gray-50 font-light">Crumafood Toluca</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-brand-blue flex items-center justify-center font-grocry text-white font-bold border border-brand-gray-25 shadow-sm">
              C
            </div>
          </div>
        </header>

        {/* Área del contenido dinámico de cada subpágina */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>

      </div>
    </div>
  );
}