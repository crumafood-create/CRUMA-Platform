import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function UnitsOfMeasurePage() {
  const supabase = await createClient();

  const { data: units, error } = await supabase
    .from('units_of_measure')
    .select('*');

  return (
    <main className="p-6">
      <h1>Debug Units</h1>

      <pre>
        {JSON.stringify(
          {
            units,
            error,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
