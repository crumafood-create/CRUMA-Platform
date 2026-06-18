import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { ProductForm } from '@/app/(admin)/_components/product-form';

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

  const supabase = await createClient();

  const { data: product } =
    await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

  if (!product) {
    notFound();
  }

  const { data: categories } =
    await supabase
      .from('categories')
      .select('id, name')
      .is('deleted_at', null)
      .order('name');

  const { data: families } =
    await supabase
      .from('families')
      .select('id, name')
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
      .select('id, name, category_id')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Producto
      </h1>

      <ProductForm
        initialValues={product}
        categories={categories ?? []}
        families={families ?? []}
        flavors={flavors ?? []}
        preparationTypes={
          preparationTypes ?? []
        }
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
