import Link from 'next/link';
import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FamiliesPage() {
  const supabase = await createClient();

  const { data: families, error } = await supabase
    .from('families')
    .select('*')
    .is('deleted_at', null)
    .order('name');

  return (
    <pre>
      {JSON.stringify(
        {
          error,
          families,
        },
        null,
        2
      )}
    </pre>
  );
}
