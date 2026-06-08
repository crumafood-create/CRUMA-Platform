import { CategoryForm }
from '@/app/(admin)/_components/category-form';

import { createCategory }
from '../actions';

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
