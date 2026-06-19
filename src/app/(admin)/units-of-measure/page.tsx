import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function UnitsOfMeasurePage() {
  const supabase = await createClient();

  return (
    <main className="p-6">
      <pre>
        {JSON.stringify(
          {
            url:
              process.env.NEXT_PUBLIC_SUPABASE_URL,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
