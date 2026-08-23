import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeRawMaterialFormValues } from '@/modules/inventory/application/raw-material-contract';
import { fetchRawMaterialFormCatalog } from '@/modules/inventory/application/raw-material-repository';

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

  const supabase = await createTypedClient();

  const { data: material } = await supabase
    .from('raw_materials')
    .select('*')
    .eq('id', id)
    .single();

  if (!material) {
    notFound();
  }

  const { categories, families, unitsOfMeasure } =
    await fetchRawMaterialFormCatalog(supabase);

  return (
    <main className="max-w-5xl space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Materia Prima
      </h1>

      <RawMaterialForm
        initialValues={normalizeRawMaterialFormValues(material)}
        categories={categories}
        families={families}
        unitsOfMeasure={unitsOfMeasure}
        action={updateRawMaterial.bind(null, material.id)}
      />

      <form action={deleteRawMaterial.bind(null, material.id)}>
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
