import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RawMaterialForm } from '@/app/(admin)/_components/raw-material-form';

import {
  updateRawMaterial,
  deleteRawMaterial,
} from '../../actions';

export default async function EditRawMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: material } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('id', id)
    .single();

  if (!material) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, code_prefix')
    .is('deleted_at', null)
    .order('name');

  const { data: families } = await supabase
    .from('families')
    .select('id, name, category_id')
    .is('deleted_at', null)
    .order('name');

  const { data: unitsOfMeasure } = await supabase
    .from('units_of_measure')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name');

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Materia Prima
      </h1>

      <RawMaterialForm
        initialValues={material}
        categories={categories ?? []}
        families={families ?? []}
        unitsOfMeasure={unitsOfMeasure ?? []}
        action={updateRawMaterial.bind(
          null,
          material.id
        )}
      />

      <form
        action={deleteRawMaterial.bind(
          null,
          material.id
        )}
      >
        <button
          type="submit"
          className="rounded border border-red-300 px-4 py-2"
        >
          Eliminar Materia Prima
        </button>
      </form>
    </main>
  );
}
