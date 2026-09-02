import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

export async function assertSupplierTaxIdAvailable(
  supabase: TypedSupabaseClient,
  taxId: string | null,
  excludedId?: string,
): Promise<void> {
  if (!taxId) return;

  let query = supabase.from('suppliers').select('id').ilike('tax_id', taxId).limit(1);
  if (excludedId) query = query.neq('id', excludedId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (data) throw new Error('Ya existe un proveedor con ese RFC.');
}

function activeSupplierReferences(supabase: TypedSupabaseClient, supplierId: string) {
  return [
    supabase
      .from('purchase_orders')
      .select('id')
      .eq('supplier_id', supplierId)
      .is('deleted_at', null)
      .neq('status', 'received')
      .neq('status', 'cancelled')
      .limit(1),
    supabase
      .from('raw_materials')
      .select('id')
      .eq('preferred_supplier_id', supplierId)
      .is('deleted_at', null)
      .eq('is_active', true)
      .limit(1),
  ];
}

export async function assertSupplierCanBeDeactivated(
  supabase: TypedSupabaseClient,
  supplierId: string,
): Promise<void> {
  const results = await Promise.all(activeSupplierReferences(supabase, supplierId));

  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
    if (result.data?.length) {
      throw new Error(
        'El proveedor tiene órdenes abiertas o materias primas activas asociadas.',
      );
    }
  }
}
