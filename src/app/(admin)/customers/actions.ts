'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildCustomerInsert, buildCustomerUpdate } from '@/modules/sales/application/customer-contract';
import { assertCustomerCanBeDeactivated, assertCustomerIdentityAvailable } from '@/modules/sales/application/customer-repository';

const code = () => `CLI-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
const finish = () => { revalidatePath('/customers'); redirect('/customers'); };

export async function createCustomer(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_CUSTOMER_MANAGE);
  const customer = buildCustomerInsert(formData, code());
  await assertCustomerIdentityAvailable(supabase, customer.customer_code, customer.tax_id ?? null);
  const { error } = await supabase.from('customers').insert(customer);
  if (error) throw new Error(error.message);
  finish();
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_CUSTOMER_MANAGE);
  const customer = buildCustomerUpdate(formData, new Date().toISOString());
  const existing = await supabase.from('customers').select('customer_code').eq('id', customerId).single();
  if (existing.error || !existing.data) throw new Error('El cliente no existe.');
  await assertCustomerIdentityAvailable(supabase, existing.data.customer_code, customer.tax_id ?? null, customerId);
  if (customer.is_active === false) await assertCustomerCanBeDeactivated(supabase, customerId);
  const { error } = await supabase.from('customers').update(customer).eq('id', customerId);
  if (error) throw new Error(error.message);
  finish();
}

export async function deleteCustomer(customerId: string) {
  const { supabase } = await requireTypedAuthorizedAction(PERMISSIONS.SALES_CUSTOMER_MANAGE);
  await assertCustomerCanBeDeactivated(supabase, customerId);
  const timestamp = new Date().toISOString();
  const { error } = await supabase.from('customers')
    .update({ deleted_at: timestamp, is_active: false, updated_at: timestamp }).eq('id', customerId);
  if (error) throw new Error(error.message);
  finish();
}
