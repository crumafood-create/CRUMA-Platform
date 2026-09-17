import Link from 'next/link';

import { BrandMark } from './brand-mark';

export function StorefrontFooter() {
  return (
    <footer className="border-t border-[#173b2f]/10 bg-[#f2e8d8]">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[1fr_auto] lg:px-8">
        <div className="space-y-3">
          <BrandMark />
          <p className="max-w-md text-sm leading-6 text-[#36584d]">
            Tequeños, empanadas y masas elaborados en Toluca para hogares, negocios y eventos.
          </p>
        </div>
        <nav aria-label="Enlaces de pie de página" className="grid content-start gap-3 text-sm font-semibold">
          <Link href="/catalogo">Explorar catálogo</Link>
          <Link href="/catalogo#mayoreo">Atención a negocios</Link>
          <Link href="/login">Acceso al sistema</Link>
        </nav>
      </div>
      <p className="border-t border-[#173b2f]/10 px-5 py-4 text-center text-xs text-[#567268]">
        © 2026 Crumafood · Toluca, México
      </p>
    </footer>
  );
}
