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

export function StorefrontProductGrid({ products }: { products: StorefrontProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[#173b2f]/20 bg-white p-10 text-center">
        <h2 className="text-2xl font-black text-[#173b2f]">Estamos preparando el catálogo.</h2>
        <p className="mt-3 text-[#173b2f]/65">Muy pronto encontrarás aquí las presentaciones disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <article key={product.product_id} className="overflow-hidden rounded-[2rem] border border-[#173b2f]/10 bg-white shadow-sm">
          <div className="relative aspect-[4/3] bg-[#f6ead8]">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.image_alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center font-black text-[#173b2f]/45">
                {product.category_name}
              </div>
            )}
          </div>
          <div className="p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e85d32]">{product.category_name}</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-[#173b2f]">{product.name}</h2>
            <p className="mt-3 text-sm leading-6 text-[#173b2f]/65">{product.short_description}</p>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-[#173b2f]/55">{product.presentation}</p>
                <p className="mt-1 text-xl font-black text-[#173b2f]">{money(product.price, product.currency)}</p>
              </div>
              <Link
                href={`/producto/${product.slug}`}
                aria-label={`Ver ${product.name}`}
                className="rounded-full bg-[#173b2f] px-4 py-2 text-sm font-black text-white"
              >
                Ver ficha
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
