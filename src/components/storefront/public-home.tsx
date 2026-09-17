import Link from 'next/link';

import {
  storefrontCategories,
  storefrontPromises,
} from '@/modules/storefront/application/storefront-content';

import { CategoryCard } from './category-card';
import { HeroArtwork } from './hero-artwork';

function HeroSection() {
  return (
    <section className="overflow-hidden px-5 py-14 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-[#e85d32]">De Toluca para compartir</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Tradición lista para compartir.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#47685d]">
            Tequeños, empanadas y masas prácticas para hogares, negocios y eventos, en formatos frescos y congelados.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/catalogo" className="rounded-full bg-[#e85d32] px-7 py-4 font-black text-white shadow-lg shadow-[#e85d32]/20">Ver catálogo</Link>
            <Link href="/catalogo#mayoreo" className="rounded-full border border-[#173b2f]/20 px-7 py-4 font-black">Compras para negocio</Link>
          </div>
        </div>
        <HeroArtwork />
      </div>
    </section>
  );
}

function PromiseStrip() {
  return (
    <section aria-label="Compromisos Crumafood" className="border-y border-[#173b2f]/10 bg-[#f2e8d8] px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-3">
        {storefrontPromises.map((item) => (
          <article key={item.title}>
            <h2 className="font-black">{item.title}</h2>
            <p className="mt-1 text-sm leading-6 text-[#567268]">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section id="productos" className="scroll-mt-24 px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#e85d32]">Nuestras líneas</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h2 className="max-w-2xl text-4xl font-black tracking-[-0.045em] sm:text-5xl">Productos para cada momento.</h2>
          <Link href="/catalogo" className="font-black text-[#e85d32]">Ver catálogo completo →</Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {storefrontCategories.map((category, index) => <CategoryCard key={category.slug} category={category} index={index} />)}
        </div>
      </div>
    </section>
  );
}

function BusinessCallout() {
  return (
    <section className="px-5 pb-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-7 rounded-[2.5rem] bg-[#173b2f] p-8 text-white md:grid-cols-[1fr_auto] md:items-center md:p-12">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[#f3b64c]">Food service y mayoreo</p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em]">Haz crecer tu menú con Crumafood.</h2>
          <p className="mt-3 max-w-2xl text-white/70">Presentaciones pensadas para restaurantes, cafeterías, tiendas, distribuidores y eventos.</p>
        </div>
        <Link href="/catalogo#mayoreo" className="rounded-full bg-[#f3b64c] px-7 py-4 text-center font-black text-[#173b2f]">Conocer opciones</Link>
      </div>
    </section>
  );
}

export function PublicHome() {
  return (
    <>
      <HeroSection />
      <PromiseStrip />
      <ProductPreview />
      <BusinessCallout />
    </>
  );
}
