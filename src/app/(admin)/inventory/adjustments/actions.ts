'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createInventoryAdjustment(
  formData: FormData
) {
  const supabase = await createClient();

  const item_type =
    String(formData.get('item_type'));

  const item_id =
    String(formData.get('item_id'));

  const movement_type =
    String(formData.get('movement_type'));

  const quantity =
    Number(formData.get('quantity'));

  const notes =
    formData.get('notes')?.toString() ??
    null;

  if (
    !item_type ||
    !item_id ||
    !movement_type ||
    quantity <= 0
  ) {
    throw new Error(
      'Todos los campos son obligatorios.'
    );
  }

  const { error } =
    await supabase
      .from('inventory_movements')
      .insert({
        item_type,
        item_id,
        movement_type,
        quantity,
        reference_type:
          'manual_adjustment',
        reference_id: null,
        notes,
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/inventory-stock');
  revalidatePath('/inventory/alerts');
  revalidatePath('/inventory/adjustments');

  redirect('/inventory/adjustments');
}
