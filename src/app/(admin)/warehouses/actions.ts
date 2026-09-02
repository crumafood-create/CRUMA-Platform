'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import {
  buildWarehouseInsert,
  buildWarehouseUpdate,
} from '@/modules/inventory/application/warehouse-contract';
import {
  assertWarehouseCanBeDeleted,
  assertWarehouseCodeAvailable,
} from '@/modules/inventory/application/warehouse-repository';

export async function createWarehouse(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE,
  );
  const warehouse = buildWarehouseInsert(formData);

  await assertWarehouseCodeAvailable(supabase, warehouse.code);

  const { error } = await supabase.from('warehouses').insert(warehouse);

  if (error) throw new Error(error.message);

  revalidatePath('/warehouses');
  redirect('/warehouses');
}

export async function updateWarehouse(warehouseId: string, formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE,
  );
  const warehouse = buildWarehouseUpdate(formData, new Date().toISOString());

  if (!warehouse.code) throw new Error('El campo code es obligatorio.');
  await assertWarehouseCodeAvailable(supabase, warehouse.code, warehouseId);

  const { error } = await supabase.from('warehouses').update(warehouse).eq('id', warehouseId);

  if (error) throw new Error(error.message);

  revalidatePath('/warehouses');
  redirect('/warehouses');
}

export async function deleteWarehouse(warehouseId: string) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_WAREHOUSE_MANAGE,
  );

  await assertWarehouseCanBeDeleted(supabase, warehouseId);

  const { error } = await supabase.from('warehouses').delete().eq('id', warehouseId);

  if (error) throw new Error(error.message);

  revalidatePath('/warehouses');
  redirect('/warehouses');
}
