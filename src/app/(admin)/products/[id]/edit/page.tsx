import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { ProductForm } from '@/app/(admin)/_components/product-form';
import { normalizeProductFormValues } from '@/modules/inventory/application/product-catalog-contract';
import { fetchProductFormCatalog } from '@/modules/inventory/application/product-catalog-repository';

import {
  updateProduct,
  deleteProduct,
} from '../../actions';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: product } =
    await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

  if (!product) {
    notFound();
  }

  const catalog = await fetchProductFormCatalog(supabase);

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Producto
      </h1>

      <ProductForm
        initialValues={normalizeProductFormValues(product)}
        categories={catalog.categories}
        families={catalog.families}
        flavors={catalog.flavors}
        preparationTypes={catalog.preparationTypes}
        unitsOfMeasure={catalog.unitsOfMeasure}
        action={updateProduct.bind(
          null,
          product.id
        )}
      />

      <form
        action={deleteProduct.bind(
          null,
          product.id
        )}
      >
        <button
          type="submit"
          className="rounded border px-3 py-1"
        >
          Eliminar
        </button>
      </form>
    </main>
  );
}
