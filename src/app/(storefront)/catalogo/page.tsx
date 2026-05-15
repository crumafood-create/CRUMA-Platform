import { fetchProducts }
from '@/domains/catalog/services/catalog.service';

export default async function CatalogPage() {

  const products = await fetchProducts();

  return (

    <main>

      <h1>
        Catálogo
      </h1>

      <pre>
        {JSON.stringify(products, null, 2)}
      </pre>

    </main>
  );
}
