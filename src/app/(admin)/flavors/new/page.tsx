import { createClient } from '@/infrastructure/integrations/supabase/server';

import { FlavorForm } from '@/app/(admin)/_components/flavor-form';

import { createFlavor } from '../actions';

export default async function NewFlavorPage() {
  const supabase = await createClient();

  const { data: families } =
    await supabase
      .from('families')
      .select('id,name')
      .is('deleted_at', null)
      .order('name');

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Nuevo Sabor
      </h1>

      <FlavorForm
        families={families ?? []}
        action={createFlavor}
      />
    </main>
  );
}
