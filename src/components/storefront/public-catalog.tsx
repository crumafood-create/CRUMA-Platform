import Link from 'next/link';

import type { StorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';
import { storefrontCategories } from '@/modules/storefront/application/storefront-content';

import { CategoryCard } from './category-card';
import { StorefrontProductGrid } from './storefront-product-grid';

function CatalogIntro() {
  return (
    <section className="bg-[#173b2f] px-5 py-16 text-white lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#f3b64c]">Catálogo Crumafood</p>
        <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-[-0.055em] sm:text-6xl">Elige cómo quieres compartir.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
          Conoce nuestras líneas, presentaciones y precios públicos. La disponibilidad se confirma al preparar tu pedido.
        </p>
      </div>
    </section>
  );
}

function CatalogGrid() {
  return (
    <section className="px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
        {storefrontCategories.map((category, index) => (
          <CategoryCard key={category.slug} category={category} index={index} />
        ))}
      </div>
    </section>
  );
}

function ProductSection({ products }: { products: StorefrontProduct[] }) {
  return (
    <section className="bg-[#fffaf2] px-5 py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e85d32]">Presentaciones</p>
        <h2 className="mt-3 text-4xl font-black tracking-[-0.045em] text-[#173b2f]">Productos publicados</h2>
        <div className="mt-8">
          <StorefrontProductGrid products={products} />
        </div>
      </div>
    </section>
  );
}

function WholesaleSection() {
  return (
    <section id="mayoreo" className="scroll-mt-24 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[2.5rem] bg-[#e85d32] p-8 text-white md:p-12">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-white/75">Atención especializada</p>
        <h2 className="mt-3 text-4xl font-black tracking-[-0.045em]">¿Compras para tu negocio?</h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-white/85">
          Preparamos opciones para mayoreo, food service y eventos de acuerdo con el formato y volumen que necesitas.
        </p>
        <Link href="/login" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 font-black text-[#173b2f]">
          Acceso para clientes y equipo
        </Link>
      </div>
    </section>
  );
}

export function PublicCatalog({ products = [] }: { products?: StorefrontProduct[] }) {
  return (
    <>
      <CatalogIntro />
      <CatalogGrid />
      <ProductSection products={products} />
      <WholesaleSection />
    </>
  );
}
