import Link from 'next/link';

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

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, internal_code, status, image_url')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Productos</h1>
        <Link href="/products/new" className="rounded-lg border px-4 py-2">
          Nuevo Producto
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {products?.length ? (
          <div className="space-y-3">
            {products?.map((product) => (
  <div
    key={product.id}
    className="rounded-xl border p-4"
  >
    <div className="font-semibold">
      {product.name}
    </div>

    <div className="text-sm text-gray-500">
      {product.internal_code}
    </div>

    <div className="text-sm text-gray-500">
      {product.slug}
    </div>

    <div className="text-sm text-gray-500">
      {product.status}
    </div>

    <div className="mt-4 flex gap-2">
      <Link
        href={`/products/${product.id}/edit`}
        className="rounded border px-3 py-1"
      >
        Editar
      </Link>
    </div>
  </div>
))}
          </div>
        ) : (
          <p>No hay productos.</p>
        )}
      </div>
    </main>
  );
}
