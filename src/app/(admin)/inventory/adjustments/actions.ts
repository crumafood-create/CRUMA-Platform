'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { buildInventoryAdjustment } from '@/modules/inventory/application/inventory-movement-contract';

export async function createInventoryAdjustment(
  formData: FormData
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.INVENTORY_ADJUSTMENT_CREATE,
  );
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
