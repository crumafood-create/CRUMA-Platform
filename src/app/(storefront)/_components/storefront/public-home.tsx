'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/primitives/button';
import {
  storefrontCategories,
  storefrontPromises,
} from '@/modules/storefront/application/storefront-content';

import { CategoryCard } from './category-card';
import { HeroArtwork } from './hero-artwork';

function HeroSection() {
  return (
    <section className="overflow-hidden px-5 py-14 lg:px-8 lg:py-24 bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-blue font-arkibal">
            De Toluca para compartir
          </p>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl text-brand-black">
            Tradición lista para compartir.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-brand-gray-75 font-light">
            Tequeños, empanadas y masas prácticas para hogares, negocios y eventos, en formatos frescos y congelados.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            {/* Convertimos los enlaces para usar el motor estético de tu componente Button */}
            <Link href="/catalogo" className="inline-block">
              <Button variant="primary" size="lg">
                Ver catálogo
              </Button>
            </Link>
            <Link href="/catalogo#mayoreo" className="inline-block">
              <Button variant="outline" size="lg" className="border-brand-gray-50 text-brand-black hover:bg-brand-gray-25">
                Compras para negocio
              </Button>
            </Link>
          </div>
        </div>
        <HeroArtwork />
      </div>
    </section>
  );
}

function PromiseStrip() {
  return (
    /* Reemplazamos el fondo crema anterior por tu arena oficial 'brand-sand' con opacidad sutil */
    <section aria-label="Compromisos Crumafood" className="border-y border-brand-gray-25 bg-brand-sand/15 px-5 py-8 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-3">
        {storefrontPromises.map((item) => (
          <article key={item.title} className="space-y-2">
            <h2 className="font-black text-xl text-brand-black">{item.title}</h2>
            <p className="text-sm leading-6 text-brand-gray-75 font-light">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section id="productos" className="scroll-mt-24 px-5 py-20 lg:px-8 bg-white">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-brand-blue font-arkibal">
          Nuestras líneas
        </p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <h2 className="max-w-2xl text-4xl font-black tracking-[-0.04em] sm:text-5xl text-brand-black">
            Productos para cada momento.
          </h2>
          <Link href="/catalogo" className="font-black text-brand-blue hover:underline transition-all">
            Ver catálogo completo →
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {storefrontCategories.map((category, index) => (
            <CategoryCard key={category.slug} category={category} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BusinessCallout() {
  return (
    <section className="px-5 pb-20 lg:px-8">
      {/* Modificado al fondo oficial 'brand-black' de CRUMAFOOD y botones con 'brand-sand' */}
      <div className="mx-auto grid max-w-7xl gap-7 rounded-[2.5rem] bg-brand-black p-8 text-white md:grid-cols-[1fr_auto] md:items-center md:p-12 border border-brand-gray-75/20">
        <div className="space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-sand font-arkibal">
            Food service y mayoreo
          </p>
          <h2 className="text-3xl font-black tracking-[-0.03em]">
            Haz crecer tu menú con Crumafood.
          </h2>
          <p className="max-w-2xl text-brand-gray-25 font-light text-sm md:text-base">
            Presentaciones pensadas para restaurantes, cafeterías, tiendas, distribuidores y eventos.
          </p>
        </div>
        <Link href="/catalogo#mayoreo" className="inline-block">
          <Button variant="secondary" size="lg" className="w-full md:w-auto font-black shadow-md shadow-brand-sand/10">
            Conocer opciones
          </Button>
        </Link>
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