import Link from 'next/link';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function FamiliesPage() {
  const supabase = await createClient();

  const { data: families, error } = await supabase
    .from('families')
    .select('id, name, slug, internal_code, is_active')
    .is('deleted_at', null)
    .order('name');

  if (error) {
    return (
      <main className="space-y-6">
        <h1 className="text-4xl font-bold">Familias</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">Error al cargar familias: {error.message}</p>
        </div>
      </main>
    );
  }

  const familyList = families ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Familias</h1>

        <Link
          href="/families/new"
          className="rounded-lg border bg-blue-50 px-4 py-2 font-medium text-blue-700 hover:bg-blue-100"
        >
          Nueva Familia
        </Link>
      </div>

      <div className="rounded-2xl border p-6">
        {familyList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-4 text-left text-sm font-medium text-gray-600">Código</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">Nombre</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">Slug</th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">Estado</th>
                  <th className="p-4 text-right text-sm font-medium text-gray-600">Acción</th>
                </tr>
              </thead>

              <tbody>
                {familyList.map((family: any) => (
                  <tr key={family.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm font-medium">
                        {family.internal_code ?? '-'}
                      </code>
                    </td>

                    <td className="p-4 font-medium">{family.name}</td>

                    <td className="p-4 text-sm text-gray-500">{family.slug ?? '-'}</td>

                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          family.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {family.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <Link
                        href={`/families/${family.id}/edit`}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No hay familias creadas.</p>
        )}
      </div>
    </main>
  );
}
