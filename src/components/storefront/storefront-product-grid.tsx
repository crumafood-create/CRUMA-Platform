'use client';

import React from 'react';
import { ProductCard } from './product-card';
import type { StorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

export function StorefrontProductGrid({ products }: { products: StorefrontProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-brand-gray-50/40 bg-white p-12 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-black text-brand-black">Estamos preparing el catálogo.</h2>
        <p className="mt-3 text-brand-gray-75 font-light text-sm">Muy pronto encontrarás aquí las presentaciones disponibles.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.product_id} product={product} />
      ))}
    </div>
  );
}