'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import { buildInventoryAdjustment } from '@/modules/inventory/application/inventory-movement-contract';

export async function createInventoryAdjustment(
  formData: FormData
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  if (formData.get('item_type') === 'raw_material') {
    throw new Error('Las materias primas deben ajustarse por lote.');
  }
  const movement = buildInventoryAdjustment({
    itemType: formData.get('item_type'),
    itemId: formData.get('item_id')?.toString() ?? '',
    movementType: formData.get('movement_type'),
    quantity: Number(formData.get('quantity')),
    notes: formData.get('notes')?.toString() || null,
  });

  const { error } =
    await supabase
      .from('inventory_movements')
      .insert(movement);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/inventory-stock');
  revalidatePath('/inventory/alerts');
  revalidatePath('/inventory/adjustments');

  redirect('/inventory/adjustments');
}

export async function adjustRawMaterialLotQuantity(formData: FormData) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
  const rpcClient = supabase as unknown as {
    rpc: (
      functionName: 'adjust_raw_material_lot_quantity',
      args: {
        p_lot_id: string;
        p_movement_type: string;
        p_quantity: number;
        p_reason: string;
      },
    ) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await rpcClient.rpc(
    'adjust_raw_material_lot_quantity',
    {
      p_lot_id: formData.get('lot_id')?.toString() ?? '',
      p_movement_type: formData.get('movement_type')?.toString() ?? '',
      p_quantity: Number(formData.get('quantity')),
      p_reason: formData.get('reason')?.toString() ?? '',
    },
  );

  if (error) throw new Error('No fue posible registrar el ajuste del lote.');

  revalidatePath('/inventory-stock');
  revalidatePath('/raw-materials');
  revalidatePath('/inventory/adjustments');
  redirect('/inventory/adjustments');
}
