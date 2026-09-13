import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

async function identityExists(supabase: TypedSupabaseClient, field: 'customer_code' | 'tax_id', value: string, excludedId?: string) {
  let query = supabase.from('customers').select('id').ilike(field, value).is('deleted_at', null).limit(1);
  if (excludedId) query = query.neq('id', excludedId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function assertCustomerIdentityAvailable(supabase: TypedSupabaseClient, code: string, taxId: string | null, excludedId?: string) {
  const duplicateCode = await identityExists(supabase, 'customer_code', code, excludedId);
  const duplicateTaxId = taxId ? await identityExists(supabase, 'tax_id', taxId, excludedId) : false;
  if (duplicateCode || duplicateTaxId) throw new Error('Ya existe un cliente con ese código o RFC.');
}

export async function assertCustomerCanBeDeactivated(supabase: TypedSupabaseClient, customerId: string) {
  const results = await Promise.all([
    supabase.from('sales_orders').select('id').eq('customer_id', customerId).is('deleted_at', null)
      .neq('status', 'delivered').neq('status', 'cancelled').limit(1),
    supabase.from('accounts_receivable').select('id').eq('customer_id', customerId).gt('balance', 0).limit(1),
  ]);
  for (const result of results) {
    if (result.error) throw new Error(result.error.message);
    if (result.data?.length) throw new Error('El cliente tiene órdenes abiertas o saldos pendientes.');
  }
}
