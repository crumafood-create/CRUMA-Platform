import { fetchProducts }
from '@/domains/catalog/services/catalog.service';

import { ProductGrid }
from '@/domains/catalog/components/product-grid';

import { PageContainer }
from '@/shared/layouts/page-container';

export default async function CatalogPage() {

  const products = await fetchProducts();

  return (

    <PageContainer>

      <div className="mb-8">

        <h1 className="text-4xl font-bold">

          Catálogo

        </h1>

      </div>

      <ProductGrid
        products={products}
      />

    </PageContainer>
  );
}
