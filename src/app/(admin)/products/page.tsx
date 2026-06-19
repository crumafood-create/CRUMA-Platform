import { redirect } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';
import { getUserRole } from '@/lib/auth/get-user-role';

export default async function ProductsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const role = await getUserRole(user.id);

  if (role !== 'admin' && role !== 'manager') {
    redirect('/dashboard');
  }

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .is('deleted_at', null);

  return (
    <main className="p-6">
      <pre>
        {JSON.stringify(
          {
            userId: user.id,
            role,
            error,
            count: products?.length,
            products,
          },
          null,
          2
        )}
      </pre>
    </main>
  );
}
