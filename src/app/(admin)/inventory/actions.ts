'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { buildProductInventoryMovement } from '@/modules/inventory/application/inventory-movement-contract';

export async function createInventoryMovement(
  formData: FormData
) {
  const supabase = await createTypedClient();
  const movement = buildProductInventoryMovement({
    productId: formData.get('product_id')?.toString() ?? '',
    warehouseId: formData.get('warehouse_id')?.toString() ?? '',
    movementType: formData.get('movement_type'),
    quantity: Number(formData.get('quantity')),
    notes: formData.get('notes')?.toString() || null,
  });

  const { error } = await supabase
    .from('inventory_movements')
    .insert(movement);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/inventory');
  redirect('/inventory');
}
