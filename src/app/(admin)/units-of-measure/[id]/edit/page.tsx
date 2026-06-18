import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import { UnitOfMeasureForm } from '@/app/(admin)/_components/unit-of-measure-form';

import {
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
} from '../../actions';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUnitPage({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: unit, error } = await supabase
    .from('units_of_measure')
    .select('id, name, code, is_active')
    .eq('id', id)
    .single();

  if (error || !unit) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Unidad
      </h1>

      <UnitOfMeasureForm
        initialValues={unit}
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
          className="rounded border border-red-300 px-4 py-2"
        >
          Eliminar Unidad
        </button>
      </form>
    </main>
  );
}
