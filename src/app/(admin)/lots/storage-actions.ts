'use server';

import { revalidatePath } from 'next/cache';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';

type StorageRpc = {
  rpc: (name: string, args: Record<string, string | number | boolean | null>) =>
    Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function startProductLotFreezing(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  const client = supabase as unknown as StorageRpc;
  const quantity = Number(formData.get('quantity'));
  const { error } = await client.rpc('start_product_lot_freezing', {
    p_product_lot_id: formData.get('product_lot_id')?.toString() ?? '',
    p_quantity: quantity,
    p_reason: formData.get('reason')?.toString() ?? '',
    p_idempotency_key: formData.get('idempotency_key')?.toString() ?? '',
    p_process_location_id: formData.get('process_location_id')?.toString() ?? '',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/lots/storage-conditions');
  revalidatePath('/lots');
}

export async function resolveProductLotFreezing(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  const client = supabase as unknown as StorageRpc;
  const operationId = formData.get('operation_id')?.toString() ?? '';
  const operationField = (name: string) => formData.get(`${name}_${operationId}`);
  const destination = operationField('destination')?.toString() ?? '';
  const { error } = await client.rpc('resolve_product_lot_freezing', {
    p_operation_id: operationId,
    p_quantity: Number(operationField('quantity')),
    p_destination: destination,
    p_conservation_verified: destination === 'fresh'
      && operationField('conservation_verified') === 'on',
    p_reason: operationField('reason')?.toString() ?? '',
    p_idempotency_key: formData.get('idempotency_key')?.toString() ?? '',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/lots/storage-conditions');
  revalidatePath('/lots');
  revalidatePath('/mobile/picking');
}

export async function decideProductLotRefrigeratedWait(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  const client = supabase as unknown as StorageRpc;
  const destination = formData.get('destination')?.toString() ?? '';
  const { error } = await client.rpc('decide_product_lot_refrigerated_wait', {
    p_product_lot_id: formData.get('product_lot_id')?.toString() ?? '',
    p_quantity: Number(formData.get('quantity')),
    p_destination: destination,
    p_process_location_id: destination === 'freezing'
      ? formData.get('process_location_id')?.toString() ?? '' : null,
    p_reason: formData.get('reason')?.toString() ?? '',
    p_idempotency_key: formData.get('idempotency_key')?.toString() ?? '',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/lots/storage-conditions');
  revalidatePath('/lots');
  revalidatePath('/mobile/picking');
}
