import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { CategoryForm } from '@/app/(admin)/_components/category-form';

import {
  updateCategory,
  deleteCategory,
} from '../../actions';

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: category, error } =
    await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

  if (error || !category) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Categoría
      </h1>

      <CategoryForm
        initialValues={{
          name: category.name,
          slug: category.slug,
          description:
            category.description ?? '',
          status:
            category.status ?? 'active',
        }}
        action={updateCategory.bind(
          null,
          category.id
        )}
      />

      <form
        action={deleteCategory.bind(
          null,
          category.id
        )}
      >
        <button
          type="submit"
          className="rounded border border-red-300 px-4 py-2"
        >
          Eliminar Categoría
        </button>
      </form>
    </main>
  );
}
