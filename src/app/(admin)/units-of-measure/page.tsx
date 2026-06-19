import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function UnitsOfMeasurePage() {
  const supabase = await createClient();

  const result = await supabase
    .from('units_of_measure')
    .select('*');

  return (
    <main className="p-6">
      <pre>
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}
