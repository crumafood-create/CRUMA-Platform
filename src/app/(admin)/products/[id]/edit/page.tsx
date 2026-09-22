import { notFound } from 'next/navigation';

import { ProductForm } from '@/modules/catalog/components/forms/product-form';
import { StorefrontPublicationForm } from '@/modules/storefront/components/forms/storefront-publication-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeProductFormValues } from '@/modules/inventory/application/product-catalog-contract';
import { fetchProductFormCatalog } from '@/modules/inventory/application/product-catalog-repository';
import { fetchStorefrontProductForAdmin } from '@/modules/storefront/application/storefront-product-repository';

import {
  deleteProduct,
  saveStorefrontPublication,
  updateProduct,
} from '../../actions';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();

  const [{ data: product }, catalog, publication] = await Promise.all([
    supabase.from('products').select('*').eq('id', id).single(),
    fetchProductFormCatalog(supabase),
    fetchStorefrontProductForAdmin(supabase, id),
  ]);

  if (!product) notFound();

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">Editar Producto</h1>

      <ProductForm
        initialValues={normalizeProductFormValues(product)}
        categories={catalog.categories}
        families={catalog.families}
        flavors={catalog.flavors}
        preparationTypes={catalog.preparationTypes}
        unitsOfMeasure={catalog.unitsOfMeasure}
        action={updateProduct.bind(null, product.id)}
      />

      <StorefrontPublicationForm
        product={product}
        publication={publication}
        action={saveStorefrontPublication.bind(null, product.id)}
      />

      <form action={deleteProduct.bind(null, product.id)}>
        <button type="submit" className="rounded border px-3 py-1">Eliminar</button>
      </form>
    </main>
  );
}
