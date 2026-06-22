import { createClient } from '@/infrastructure/integrations/supabase/server';
import { FamilyForm } from '@/app/(admin)/_components/family-form';
import { createFamily } from '../actions';

export default async function NewFamilyPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .is('deleted_at', null)
    .order('name');

  return (
    <main className="space-y-6">
      <div>
        <a href="/families" className="text-sm text-blue-600 hover:text-blue-700">
          ← Volver a Familias
        </a>
        <h1 className="mt-2 text-4xl font-bold">Nueva Familia</h1>
      </div>

      <FamilyForm categories={categories ?? []} action={createFamily} />
    </main>
  );
}
