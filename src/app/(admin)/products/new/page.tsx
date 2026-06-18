import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { ProductForm } from '../../_components/product-form';

import { createProduct } from '../actions';

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categories } =
    await supabase
      .from('categories')
.select('id, name, code_prefix')
      .is('deleted_at', null)
      .order('name');

  const { data: families } =
  await supabase
    .from('families')
    .select('id, name, category_id')
    .is('deleted_at', null)
    .order('name');

  const { data: flavors } =
    await supabase
      .from('flavors')
      .select('id, name')
      .is('deleted_at', null)
      .order('name');

  const { data: preparationTypes } =
    await supabase
      .from('preparation_types')
      .select('id, name')
      .is('deleted_at', null)
      .order('name');

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
        categories={categories ?? []}
        families={families ?? []}
        flavors={flavors ?? []}
        preparationTypes={
          preparationTypes ?? []
        }
      />
    </main>
  );
}
