import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { FamilyForm } from '@/app/(admin)/_components/family-form';

import { updateFamily, deleteFamily } from '../../actions';

export default async function EditFamilyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', id)
    .single();

  if (!family) notFound();

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .is('deleted_at', null)
    .order('name');

  return (
    <main className="space-y-6">
      <div>
        <a href="/families" className="text-sm text-blue-600 hover:text-blue-700">
          ← Volver a Familias
        </a>
        <h1 className="mt-2 text-4xl font-bold">Editar Familia</h1>
      </div>

      <FamilyForm
        categories={categories ?? []}
        initialValues={family}
        familyId={family.id}
        onDelete={deleteFamily}
        action={updateFamily.bind(null, family.id)}
      />
    </main>
  );
}
