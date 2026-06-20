import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FamiliesPage() {
  const supabase = await createClient();

  const { data: families, error } =
    await supabase
      .from('families')
      .select('*')
      .is('deleted_at', null)
      .order('name');

  return (
    <pre>
      {JSON.stringify(
        {
          families,
          error,
        },
        null,
        2
      )}
    </pre>
  );
}
