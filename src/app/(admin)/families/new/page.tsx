import { createClient } from '@/infrastructure/integrations/supabase/server';
import { FamilyForm } from '@/app/(admin)/_components/family-form';
import { createFamily } from '../actions';

export default async function NewFamilyPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .order('name');

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">Nueva Familia</h1>

      <FamilyForm categories={categories ?? []} action={createFamily} />
    </main>
  );
}
