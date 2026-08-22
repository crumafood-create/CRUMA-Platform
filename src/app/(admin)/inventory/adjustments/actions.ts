'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { buildInventoryAdjustment } from '@/modules/inventory/application/inventory-movement-contract';

export async function createInventoryAdjustment(
  formData: FormData
) {
  const supabase = await createTypedClient();
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
