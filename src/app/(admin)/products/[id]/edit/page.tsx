import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { ProductForm } from '@/app/(admin)/_components/product-form';

import { updateProduct } from '../../../actions';

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

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Producto
      </h1>

      <ProductForm
        initialValues={product}
        action={updateProduct.bind(
          null,
          product.id
        )}
      />
    </main>
  );
}
