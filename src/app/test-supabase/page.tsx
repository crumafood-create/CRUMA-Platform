import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function TestSupabasePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id,name,status')
    .limit(10);

  if (error) {
    return (
      <pre>
        {JSON.stringify(error, null, 2)}
      </pre>
    );
  }

  return (
    <pre>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
