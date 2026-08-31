import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeUnitOfMeasureFormValues } from '@/modules/inventory/application/unit-of-measure-contract';

import { UnitOfMeasureForm }
from '@/app/(admin)/_components/unit-of-measure-form';

import {
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
} from '../../actions';

export default async function EditUnitOfMeasurePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: unit, error } =
    await supabase
      .from('units_of_measure')
      .select('*')
      .eq('id', id)
      .single();

  if (error || !unit) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Unidad de Medida
      </h1>

      <UnitOfMeasureForm
        initialValues={normalizeUnitOfMeasureFormValues(unit)}
        action={updateUnitOfMeasure.bind(
          null,
          unit.id
        )}
      />

      <form
        action={deleteUnitOfMeasure.bind(
          null,
          unit.id
        )}
      >
        <button
          type="submit"
          className="rounded-lg border px-4 py-2"
        >
          Eliminar
        </button>
      </form>
    </main>
  );
}
