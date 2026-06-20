import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { FamilyForm } from '@/app/(admin)/_components/family-form';

import {
  updateFamily,
  deleteFamily,
} from '../../actions';

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

  if (!family) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .is('deleted_at', null)
    .order('name');

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Familia
      </h1>

      <FamilyForm
        categories={categories ?? []}
        initialValues={family}
        action={updateFamily.bind(null, family.id)}
      />

      <form action={deleteFamily.bind(null, family.id)}>
        <button
          type="submit"
          className="rounded border px-4 py-2"
        >
          Eliminar
        </button>
      </form>
    </main>
  );
}
