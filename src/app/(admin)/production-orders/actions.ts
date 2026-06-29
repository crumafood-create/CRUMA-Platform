'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function generateOrderNumber(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `OP-${yyyy}${mm}${dd}-${random}`;
}

export async function createProductionOrder(formData: FormData) {
  const supabase = await createClient();

  const recipeId = formData.get('recipe_id')?.toString().trim() ?? '';
  const plannedQuantity = Number(formData.get('planned_quantity'));
  const notes = formData.get('notes')?.toString().trim() || null;

  if (!recipeId || !plannedQuantity || plannedQuantity <= 0) {
    throw new Error('Receta y cantidad planeada son obligatorias');
  }

  const { error } = await supabase.from('production_orders').insert({
    recipe_id: recipeId,
    order_number: generateOrderNumber(),
    planned_quantity: plannedQuantity,
    produced_quantity: 0,
    status: 'draft',
    notes,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
  redirect('/production-orders');
}

export async function releaseProductionOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'released',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

export async function startProductionOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

export async function completeProductionOrder(orderId: string) {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('production_orders')
    .select('id, planned_quantity, produced_quantity, status')
    .eq('id', orderId)
    .single()
    .insert({
  item_type: 'product',
  item_id:
    order.recipes?.product_id,

  movement_type: 'entry',

  quantity: Number(
    order.quantity
  ),

  reference_type:
    'production_order',

  reference_id: order.id,

  notes:
    'Producción terminada',
})
    .from('inventory_stock_by_item')
.select('quantity')
.eq(
  'item_type',
  'raw_material'
)
.eq(
  'item_id',
  item.ingredient_id
)
.single();

  const available =
  Number(stock?.quantity ?? 0);

if (available < required) {
  throw new Error(
    `Stock insuficiente para el ingrediente ${item.ingredient_id}`
  );
}
  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Orden no encontrada');
  }

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'completed',
      produced_quantity: order.planned_quantity,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

export async function cancelProductionOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}
