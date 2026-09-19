'use client';

import { useMemo, useState } from 'react';

import type { StorefrontProduct } from '@/modules/storefront/application/storefront-product-repository';

import { StorefrontProductGrid } from './storefront-product-grid';

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-MX');
}

export function CatalogExplorer({ products }: { products: StorefrontProduct[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = useMemo(
    () => [...new Map(products.map((product) => [product.category_slug, product.category_name])).entries()],
    [products],
  );
  const categoryOptions: Array<readonly [string, string]> = [
    ['all', 'Todos'],
    ...categories,
  ];
  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    return products.filter((product) => {
      const matchesCategory = category === 'all' || product.category_slug === category;
      const haystack = normalize(`${product.name} ${product.short_description ?? ''} ${product.presentation}`);
      return matchesCategory && (!needle || haystack.includes(needle));
    });
  }, [category, products, query]);

  return (
    <div>
      <div className="rounded-3xl border border-brand-gray-25 bg-white p-5 shadow-sm">
        <label className="block text-sm font-black text-brand-black" htmlFor="catalog-search">
          Buscar productos
        </label>
        <input
          id="catalog-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej. empanada, tequeño o paquete"
          className="mt-2 min-h-12 w-full rounded-xl border border-brand-gray-50/40 px-4 text-brand-black outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20"
        />
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Filtrar por categoría">
          {categoryOptions.map(([slug, name]) => (
            <button
              key={slug}
              type="button"
              aria-pressed={category === slug}
              onClick={() => setCategory(slug)}
              className={`min-h-10 rounded-full px-4 text-sm font-bold transition-colors ${category === slug ? 'bg-brand-blue text-white' : 'bg-brand-gray-25 text-brand-black hover:bg-brand-sand/40'}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <p role="status" aria-live="polite" className="my-5 text-sm font-bold text-brand-gray-75">
        {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
      </p>
      <StorefrontProductGrid products={filtered} />
    </div>
  );
}
