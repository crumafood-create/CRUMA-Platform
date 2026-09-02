import { notFound } from 'next/navigation';

import { SupplierForm } from '@/app/(admin)/_components/supplier-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { normalizeSupplierFormValues } from '@/modules/procurement/application/supplier-contract';

import { deleteSupplier, updateSupplier } from '../../actions';

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('id, name, business_name, tax_id, email, phone, contact_name, address, notes, is_active')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error || !supplier) notFound();

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">Editar Proveedor</h1>
      <SupplierForm
        initialValues={normalizeSupplierFormValues(supplier)}
        action={updateSupplier.bind(null, supplier.id)}
      />
      <form action={deleteSupplier.bind(null, supplier.id)}>
        <button type="submit" className="rounded-lg border px-4 py-2">
          Eliminar
        </button>
      </form>
    </main>
  );
}
