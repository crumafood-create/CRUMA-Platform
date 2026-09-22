'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/shared/ui/primitives/button';
import type { StorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

interface ProductCardProps {
  product: StorefrontProduct;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-brand-gray-25 bg-white shadow-sm hover:shadow-md hover:border-brand-gray-50 transition-all duration-300 flex flex-col justify-between h-full">
      
      <div>
        {/* 1. CONTENEDOR DE IMAGEN */}
        <div className="relative aspect-[4/3] bg-brand-gray-25 border-b border-brand-gray-25/50 overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.image_alt || product.name}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center font-black text-brand-gray-50/60 font-arkibal text-sm uppercase tracking-wider">
              {product.category_name}
            </div>
          )}
        </div>

        {/* 2. CUERPO DE INFORMACIÓN */}
        <div className="p-6 space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-blue font-arkibal">
            {product.category_name}
          </p>
          <h3 className="text-2xl font-black tracking-[-0.035em] text-brand-black group-hover:text-brand-blue transition-colors">
            {product.name}
          </h3>
          <p className="text-sm leading-6 text-brand-gray-75 font-light line-clamp-2">
            {product.short_description}
          </p>
        </div>
      </div>

      {/* 3. SECCIÓN INFERIOR (Precios y Acciones) */}
      <div className="p-6 pt-0 mt-auto">
        <div className="flex items-end justify-between gap-4 pt-4 border-t border-brand-gray-25/50">
          <div className="font-arkibal">
            <p className="text-xs text-brand-gray-50 uppercase tracking-wide font-medium">
              {product.presentation}
            </p>
            <p className="mt-0.5 text-xl font-black text-brand-black">
              {money(product.price, product.currency)}
            </p>
          </div>
          <Link href={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`} className="inline-block">
            <Button variant="dark" size="sm" className="font-bold px-4 py-2 text-xs">
              Ver ficha
            </Button>
          </Link>
        </div>
      </div>

    </article>
  );
});
