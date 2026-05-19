import Link
from 'next/link';

export function StoreNavbar() {

  return (

    <header className="border-b">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        <Link href="/">

          <h2>
            Crumafood
          </h2>

        </Link>

        <nav className="flex items-center gap-4">

          <Link href="/catalogo">

            Catálogo
  
            <Link href="/ai">

  AI Search

</Link>
            /catalogo

          </Link>

          <Link href="/carrito">

            Carrito

          </Link>

        </nav>

      </div>

    </header>
  );
}
