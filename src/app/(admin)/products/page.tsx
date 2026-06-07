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

  if (
    role !== 'admin' &&
    role !== 'manager'
  ) {
    redirect('/dashboard');
  }

  const { data: products } =
  await supabase
    .from('products')
    .select('*')
    .order('name');

  <h1 className="text-3xl font-bold mb-6">
  Productos
</h1>

{products?.map(product => (
  <div key={product.id}>
    {product.name}
  </div>
))}

  return (
    <div>
      <h1>Productos</h1>
    </div>
  );
}
