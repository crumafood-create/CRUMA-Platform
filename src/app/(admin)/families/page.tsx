import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FamiliesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from('families')
    .select('*');

  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
