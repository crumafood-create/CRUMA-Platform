'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createInventoryMovement(
  formData: FormData
) {
  const supabase = await createClient();

  const productId =
    formData.get('product_id')?.toString();

  const locationId =
    formData.get('location_id')?.toString();

  const movementType =
    formData.get('movement_type')?.toString();

  const quantity =
    Number(formData.get('quantity'));

  const notes =
    formData.get('notes')?.toString() ?? null;

  if (
    !productId ||
    !locationId ||
    !movementType
  ) {
    throw new Error(
      'Datos incompletos'
    );
  }

  await supabase
    .from('inventory_movements')
    .insert({
      product_id: productId,
      location_id: locationId,
      movement_type: movementType,
      quantity,
      notes,
    });

  const { data: stock } =
    await supabase
      .from('inventory_stock')
      .select('*')
      .eq('product_id', productId)
      .eq('location_id', locationId)
      .maybeSingle();

  let newQuantity = quantity;

  if (stock) {
    if (movementType === 'entry') {
      newQuantity =
        Number(stock.quantity) +
        quantity;
    }

    if (movementType === 'exit') {
      newQuantity =
        Number(stock.quantity) -
        quantity;
    }

    if (movementType === 'adjustment') {
      newQuantity = quantity;
    }

    await supabase
      .from('inventory_stock')
      .update({
        quantity: newQuantity,
        updated_at: new Date(),
      })
      .eq('id', stock.id);
  } else {
    await supabase
      .from('inventory_stock')
      .insert({
        product_id: productId,
        location_id: locationId,
        quantity:
          movementType === 'exit'
            ? -quantity
            : quantity,
      });
  }

  revalidatePath('/inventory');

  redirect('/inventory');
}
