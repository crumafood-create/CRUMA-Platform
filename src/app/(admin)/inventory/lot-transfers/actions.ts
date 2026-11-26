'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';

type TransferRpcClient = {
  rpc: (
    functionName: 'transfer_raw_material_lot_location',
    args: {
      p_lot_id: string;
      p_destination_location_id: string;
      p_reason: string;
      p_idempotency_key: string;
    },
  ) => Promise<{ data: string | null; error: { message: string } | null }>;
};

export async function transferRawMaterialLotLocation(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  const lotId = formData.get('lot_id')?.toString() ?? '';
  const destinationLocationId = formData.get('destination_location_id')?.toString() ?? '';
  const reason = formData.get('reason')?.toString().trim() ?? '';
  const idempotencyKey = formData.get('idempotency_key')?.toString() ?? '';
  if (!lotId || !destinationLocationId || !reason || !idempotencyKey) {
    throw new Error('Lote, destino, motivo y clave de operación son obligatorios.');
  }

  const client = supabase as unknown as TransferRpcClient;
  const { error } = await client.rpc('transfer_raw_material_lot_location', {
    p_lot_id: lotId,
    p_destination_location_id: destinationLocationId,
    p_reason: reason,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/inventory/lot-transfers');
  revalidatePath('/inventory');
  revalidatePath('/inventory/movements');
  revalidatePath('/raw-materials');
  revalidatePath('/ingredient-preparation');
  revalidatePath('/qa');
  redirect('/inventory/lot-transfers?transferred=1');
}
