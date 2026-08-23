import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { fetchRawMaterialFormCatalog } from '@/modules/inventory/application/raw-material-repository';

import { RawMaterialForm } from '@/app/(admin)/_components/raw-material-form';

import { createRawMaterial } from '../actions';

export default async function NewRawMaterialPage() {
  const supabase = await createTypedClient();
  const { categories, families, unitsOfMeasure } =
    await fetchRawMaterialFormCatalog(supabase);

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Nueva Materia Prima
      </h1>

      <RawMaterialForm
        action={createRawMaterial}
        categories={categories}
        families={families}
        unitsOfMeasure={unitsOfMeasure}
      />
    </main>
  );
}
