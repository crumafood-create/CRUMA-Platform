import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { fetchProductFormCatalog } from '@/modules/inventory/application/product-catalog-repository';

import { ProductForm } from '../../_components/product-form';

import { createProduct } from '../actions';

export default async function NewProductPage() {
  const supabase = await createTypedClient();
  const catalog = await fetchProductFormCatalog(supabase);

  return (
    <main className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nuevo Producto
        </h1>

        <Link
          href="/products"
          className="rounded-lg border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <ProductForm
        action={createProduct}
        categories={catalog.categories}
        families={catalog.families}
        flavors={catalog.flavors}
        preparationTypes={catalog.preparationTypes}
        unitsOfMeasure={catalog.unitsOfMeasure}
      />
    </main>
  );
}
