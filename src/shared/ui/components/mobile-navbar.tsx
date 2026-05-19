'use client';

import Link
from 'next/link';

export function MobileNavbar() {

  return (

    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 md:hidden">

      <div className="flex justify-around">

        <Link href="/">

          Inicio

        </Link>

        <Link href="/catalogo">

          Catálogo

        </Link>

        <Link href="/carrito">

          Carrito

        </Link>

      </div>

    </nav>
  );
}
