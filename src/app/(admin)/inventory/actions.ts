'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createInventoryMovement(
  formData: FormData
) {
  const supabase = await createClient();

  const productId = formData.get('product_id')?.toString();
  const warehouseId = formData.get('warehouse_id')?.toString();
  const movementType = formData.get('movement_type')?.toString();
  const quantity = Number(formData.get('quantity'));
  const notes = formData.get('notes')?.toString() || null;

  if (!productId || !warehouseId || !movementType || !quantity) {
    throw new Error('Datos incompletos');
  }

  const { error } = await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      warehouse_id: warehouseId,
      movement_type: movementType,
      quantity,
      notes,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/inventory');
  redirect('/inventory');
}
