import { CategoryForm }
from '@/app/(admin)/_components/category-form';

import { createCategory }
from '../actions';

export async function updateCategory(
  categoryId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('categories')
    .update({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description:
        formData.get('description'),
      status:
        formData.get('status'),
      updated_at: new Date(),
    })
    .eq('id', categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/categories');

  redirect('/categories');
}

export async function deleteCategory(
  categoryId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('categories')
    .update({
      deleted_at: new Date(),
    })
    .eq('id', categoryId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/categories');

  redirect('/categories');
}

export default function NewCategoryPage() {
  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Nueva Categoría
      </h1>

      <CategoryForm
        action={createCategory}
      />
    </main>
  );
}
