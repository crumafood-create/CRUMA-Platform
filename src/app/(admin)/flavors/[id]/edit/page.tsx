import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeFlavorFormValues } from '@/modules/inventory/application/flavor-catalog-contract';

import { FlavorForm } from '@/app/(admin)/_components/flavor-form';

import {
  updateFlavor,
  deleteFlavor,
} from '../../actions';

export default async function EditFlavorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createTypedClient();

  const { data: flavor } = await supabase
    .from('flavors')
    .select('id, name, slug, description, is_active')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!flavor) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Editar Sabor
      </h1>

      <FlavorForm
        initialValues={normalizeFlavorFormValues(flavor)}
        action={updateFlavor.bind(null, flavor.id)}
      />

      <form action={deleteFlavor.bind(null, flavor.id)}>
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
