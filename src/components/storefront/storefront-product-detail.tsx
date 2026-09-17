import Image from 'next/image';
import Link from 'next/link';

import type { StorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

function money(value: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function StorefrontProductDetail({ product }: { product: StorefrontProduct }) {
  return (
    <main className="px-5 py-12 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <Link href="/catalogo" className="font-black text-[#e85d32]">← Volver al catálogo</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start">
          <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-[#f6ead8]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.image_alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-2xl font-black text-[#173b2f]/45">
                {product.category_name}
              </div>
            )}
          </div>
          <section>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#e85d32]">{product.category_name}</p>
            <h1 className="mt-3 text-5xl font-black tracking-[-0.055em] text-[#173b2f] sm:text-6xl">{product.name}</h1>
            <p className="mt-6 text-xl leading-8 text-[#173b2f]/70">{product.short_description}</p>
            <div className="mt-8 rounded-[2rem] bg-[#173b2f] p-7 text-white">
              <p className="text-sm font-bold text-white/65">{product.presentation}</p>
              <p className="mt-2 text-4xl font-black">{money(product.price, product.currency)}</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                Precio público. La disponibilidad y entrega se confirman al preparar el pedido.
              </p>
            </div>
            {product.description && (
              <div className="mt-8">
                <h2 className="text-2xl font-black text-[#173b2f]">Conoce el producto</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-[#173b2f]/70">{product.description}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
