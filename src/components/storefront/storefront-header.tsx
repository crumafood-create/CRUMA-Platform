import Link from 'next/link';

import { BrandMark } from './brand-mark';

const links = [
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/#productos', label: 'Productos' },
  { href: '/catalogo#mayoreo', label: 'Para negocios' },
] as const;

function DesktopNavigation() {
  return (
    <nav aria-label="Navegación principal" className="hidden items-center gap-7 md:flex">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-semibold hover:text-[#e85d32]">
          {link.label}
        </Link>
      ))}
      <Link href="/login" className="rounded-full border border-[#173b2f]/20 px-5 py-2 text-sm font-bold hover:bg-[#173b2f] hover:text-white">
        Acceso al sistema
      </Link>
    </nav>
  );
}

function MobileNavigation() {
  return (
    <details className="relative md:hidden">
      <summary className="cursor-pointer list-none rounded-full border px-4 py-2 text-sm font-bold">
        Menú
      </summary>
      <nav aria-label="Navegación móvil" className="absolute right-0 top-12 z-20 grid w-56 gap-1 rounded-2xl border bg-[#fffaf2] p-3 shadow-xl">
        {links.map((link) => <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2">{link.label}</Link>)}
        <Link href="/login" className="rounded-xl bg-[#173b2f] px-3 py-2 text-white">Acceso al sistema</Link>
      </nav>
    </details>
  );
}

export function StorefrontHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#173b2f]/10 bg-[#fffaf2]/95 backdrop-blur">
      <a href="#contenido" className="sr-only focus:not-sr-only">Saltar al contenido</a>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <BrandMark />
        <DesktopNavigation />
        <MobileNavigation />
      </div>
    </header>
  );
}
