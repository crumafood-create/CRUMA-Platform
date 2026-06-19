import { createClient } from '@/infrastructure/integrations/supabase/server';

import { RawMaterialForm } from '@/app/(admin)/_components/raw-material-form';

import { createRawMaterial } from '../actions';

export default async function NewRawMaterialPage() {
  const supabase = await createClient();

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
        Nueva Materia Prima
      </h1>

      <RawMaterialForm
        action={createRawMaterial}
        categories={categories ?? []}
        families={families ?? []}
        unitsOfMeasure={unitsOfMeasure ?? []}
      />
    </main>
  );
}
