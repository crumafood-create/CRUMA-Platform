import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { FamilyForm } from '@/app/(admin)/_components/family-form';
import { normalizeFamilyFormValues } from '@/modules/inventory/application/category-family-contract';
import { fetchFamilyCategories } from '@/modules/inventory/application/category-family-repository';
import { updateFamily, deleteFamily } from '../../actions';

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: family } = await supabase
    .from('families')
    .select('id, name, slug, internal_code, category_id, description, is_active')
    .eq('id', id)
    .single();

  if (!family) notFound();

  const categories = await fetchFamilyCategories(supabase);

  return (
    <main className="space-y-6">
      <div>
        <a href="/families" className="text-sm text-blue-600 hover:text-blue-700">
          ← Volver a Familias
        </a>
        <h1 className="mt-2 text-4xl font-bold">Editar Familia</h1>
      </div>

      <FamilyForm
        categories={categories}
        initialValues={normalizeFamilyFormValues(family)}
        familyId={family.id}
        onDelete={deleteFamily}
        action={updateFamily.bind(null, family.id)}
      />
    </main>
  );
}
