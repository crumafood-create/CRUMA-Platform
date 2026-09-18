'use client';

import Link from 'next/link';
import { Button } from '@/components/button';
import { BrandMark } from './brand-mark';

const links = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#productos', label: 'Productos' },
  { href: '/catalogo#mayoreo', label: 'Para negocios' },
] as const;

function DesktopNavigation() {
  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-7 md:flex font-arkibal">
      {links.map((link) => (
        <Link 
          key={link.href} 
          href={link.href} 
          className="text-sm font-semibold text-brand-gray-75 hover:text-brand-blue transition-colors"
        >
          {link.label}
        </Link>
      ))}
      <Link href="/login" className="inline-block">
        <Button variant="outline" size="sm" className="border-brand-gray-50 text-brand-black hover:bg-brand-black hover:text-white hover:border-brand-black">
          Acceso al sistema
        </Button>
      </Link>
    </nav>
  );
}

function MobileNavigation() {
  return (
    <details className="relative md:hidden font-arkibal">
      <summary className="cursor-pointer list-none rounded-full border border-brand-gray-50 bg-white px-5 py-2 text-sm font-bold text-brand-black hover:bg-brand-gray-25 select-none transition-colors">
        Menú
      </summary>
      <nav aria-label="Navegación móvil" className="absolute right-0 top-12 z-20 grid w-56 gap-1 rounded-2xl border border-brand-gray-25 bg-white p-3 shadow-xl">
        {links.map((link) => (
          <Link 
            key={link.href} 
            href={link.href} 
            className="rounded-xl px-3 py-2.5 text-sm text-brand-gray-75 hover:bg-brand-gray-25 hover:text-brand-black transition-colors"
          >
            {link.label}
          </Link>
        ))}
        <div className="pt-2 mt-2 border-t border-brand-gray-25/50">
          <Link href="/login" className="inline-block w-full">
            <Button variant="dark" size="sm" fullWidth>
              Acceso al sistema
            </Button>
          </Link>
        </div>
      </nav>
    </details>
  );
}

export function StorefrontHeader() {
  return (
    /* Cambiado el fondo crema por un blanco traslúcido puro y borde con tu escala de grises */
    <header className="sticky top-0 z-30 border-b border-brand-gray-25 bg-white/90 backdrop-blur-md">
      <a href="#contenido" className="sr-only focus:not-sr-only">Saltar al contenido</a>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <BrandMark />
        <DesktopNavigation />
        <MobileNavigation />
      </div>
    </header>
  );
}