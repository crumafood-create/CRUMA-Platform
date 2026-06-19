import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function UnitsOfMeasurePage() {
  const supabase = await createClient();

  const result = await supabase
    .from('units_of_measure')
    .select('*');

  return (
    <main>
      <pre>
        {JSON.stringify(
          {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            result,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
