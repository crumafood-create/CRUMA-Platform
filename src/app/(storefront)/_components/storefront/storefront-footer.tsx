'use client';

import Link from 'next/link';
import { BrandMark } from './brand-mark';

export function StorefrontFooter() {
  return (
    /* Cambiado al fondo negro institucional y borde con escala de grises de marca */
    <footer className="border-t border-brand-gray-75/30 bg-brand-black text-white font-arkibal">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-[1fr_auto] lg:px-8">
        
        {/* Lado Izquierdo: Identidad de Marca */}
        <div className="space-y-4">
          {/* El componente BrandMark se adaptará o contrastará sobre el fondo oscuro */}
          <BrandMark />
          <p className="max-w-md text-sm leading-6 text-brand-gray-25 font-light">
            Tequeños, empanadas y masas elaborados en Toluca para hogares, negocios y eventos.
          </p>
        </div>

        {/* Lado Derecho: Enlaces de Navegación */}
        <nav aria-label="Enlaces de pie de página" className="grid content-start gap-3.5 text-sm font-semibold text-brand-gray-25">
          <Link href="/catalogo" className="hover:text-brand-sand transition-colors">
            Explorar catálogo
          </Link>
          <Link href="/catalogo#mayoreo" className="hover:text-brand-sand transition-colors">
            Atención a negocios
          </Link>
          <Link href="/login" className="hover:text-brand-sand transition-colors">
            Acceso al sistema
          </Link>
        </nav>

      </div>

      {/* Barra de Derechos de Autor Inferior */}
      <p className="border-t border-brand-gray-75/20 px-5 py-5 text-center text-xs text-brand-gray-50 font-light">
        © 2026 Crumafood · Toluca, México
      </p>
    </footer>
  );
}