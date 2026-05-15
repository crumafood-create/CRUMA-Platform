import { fetchProducts }
from '@/domains/catalog/services/catalog.service';

import { ProductCard }
from '@/domains/catalog/components/product-card';

export default async function CatalogPage() {

  const products = await fetchProducts();

  return (

    <main className="grid gap-4">

      {products.map(product => (

        <ProductCard
          key={product.id}
          product={product}
        />
      ))}

    </main>
  );
}
