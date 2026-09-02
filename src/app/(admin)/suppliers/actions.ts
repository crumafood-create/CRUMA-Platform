'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildSupplierInsert,
  buildSupplierUpdate,
} from '@/modules/procurement/application/supplier-contract';
import {
  assertSupplierCanBeDeactivated,
  assertSupplierTaxIdAvailable,
} from '@/modules/procurement/application/supplier-repository';

export async function createSupplier(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE,
  );
  const supplier = buildSupplierInsert(formData);
  await assertSupplierTaxIdAvailable(supabase, supplier.tax_id ?? null);

  const { error } = await supabase.from('suppliers').insert(supplier);
  if (error) throw new Error(error.message);

  revalidatePath('/suppliers');
  redirect('/suppliers');
}

export async function updateSupplier(supplierId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE,
  );
  const supplier = buildSupplierUpdate(formData, new Date().toISOString());
  await assertSupplierTaxIdAvailable(supabase, supplier.tax_id ?? null, supplierId);
  if (supplier.is_active === false) await assertSupplierCanBeDeactivated(supabase, supplierId);

  const { error } = await supabase.from('suppliers').update(supplier).eq('id', supplierId);
  if (error) throw new Error(error.message);

  revalidatePath('/suppliers');
  redirect('/suppliers');
}

export async function deleteSupplier(supplierId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_SUPPLIER_MANAGE,
  );
  await assertSupplierCanBeDeactivated(supabase, supplierId);
  const timestamp = new Date().toISOString();
  const { error } = await supabase
    .from('suppliers')
    .update({ deleted_at: timestamp, is_active: false, updated_at: timestamp })
    .eq('id', supplierId);
  if (error) throw new Error(error.message);

  revalidatePath('/suppliers');
  redirect('/suppliers');
}
