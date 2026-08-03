import Link from 'next/link';
import { redirect } from 'next/navigation';

import { requireAuthenticatedUser } from '@/lib/auth/guards/auth.guard';
import {
  isAuthorizationError,
  requirePermission,
} from '@/lib/auth/guards/permission.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';

type LookupRow = {
  id: string;
  name: string;
};

type ProductRow = {
  id: string;
  category_id: string | null;
  family_id: string | null;
  flavor_id: string | null;
  preparation_type_id: string | null;
  slug: string | null;
  internal_code: string | null;
  name: string;
  status: string | null;
  is_featured: boolean | null;
};

export default async function ProductsPage() {
  const { actor, supabase } =
    await requireAuthenticatedUser().catch((error: unknown) => {
      if (
        isAuthorizationError(error) &&
        error.reason === 'unauthenticated'
      ) {
        redirect('/login');
      }

      throw error;
    });

  try {
    requirePermission(actor, PERMISSIONS.CATALOG_PRODUCT_MANAGE);
  } catch (error) {
    if (isAuthorizationError(error)) {
      redirect('/dashboard');
    }

    throw error;
  }

  const [
    { data: products, error: productsError },
    { data: categories },
    { data: families },
    { data: flavors },
    { data: preparationTypes },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, category_id, family_id, flavor_id, preparation_type_id, slug, internal_code, name, status, is_featured')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('product_families').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('flavors').select('id, name').is('deleted_at', null).order('name'),
    supabase.from('preparation_types').select('id, name').is('deleted_at', null).order('name'),
  ]);

  if (productsError) {
    return (
      <main className="p-6">
        <h1 className="text-4xl font-bold">Productos</h1>
        <div className="mt-6 rounded-2xl border p-6">
          <p className="text-red-600">Error al cargar productos.</p>
          <pre className="mt-4 whitespace-pre-wrap rounded border bg-gray-50 p-4 text-xs">
            {JSON.stringify(productsError, null, 2)}
          </pre>
        </div>
      </main>
    );
  }

  const categoryMap = new Map(
    (categories ?? []).map((item: LookupRow) => [item.id, item.name])
  );
  const familyMap = new Map(
    (families ?? []).map((item: LookupRow) => [item.id, item.name])
  );
  const flavorMap = new Map(
    (flavors ?? []).map((item: LookupRow) => [item.id, item.name])
  );
  const preparationTypeMap = new Map(
    (preparationTypes ?? []).map((item: LookupRow) => [item.id, item.name])
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Productos</h1>

        <Link
          href="/products/new"
          className="rounded-lg border px-4 py-2"
        >
          Nuevo Producto
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {products?.length ? (
          <div className="space-y-3">
            {products.map((product: ProductRow) => (
              <div
                key={product.id}
                className="rounded-xl border p-4"
              >
                <div className="font-semibold">
                  {product.name}
                </div>

                <div className="text-sm text-gray-500">
                  Código: {product.internal_code ?? '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Slug: {product.slug ?? '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Estado: {product.status ?? '-'}
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  Categoría:{' '}
                  {product.category_id
                    ? categoryMap.get(product.category_id) ?? '-'
                    : '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Familia:{' '}
                  {product.family_id
                    ? familyMap.get(product.family_id) ?? '-'
                    : '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Sabor:{' '}
                  {product.flavor_id
                    ? flavorMap.get(product.flavor_id) ?? '-'
                    : '-'}
                </div>

                <div className="text-sm text-gray-500">
                  Preparación:{' '}
                  {product.preparation_type_id
                    ? preparationTypeMap.get(product.preparation_type_id) ?? '-'
                    : '-'}
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="rounded border px-3 py-1"
                  >
                    Editar
                  </Link>

                  <Link
                    href={`/products/${product.id}/inventory`}
                    className="rounded border px-3 py-1"
                  >
                    Kardex
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
