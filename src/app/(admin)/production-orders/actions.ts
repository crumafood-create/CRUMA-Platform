'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function createProductionOrder(
  formData: FormData
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('production_orders')
      .insert({
        recipe_id:
          formData.get('recipe_id'),

        quantity:
          Number(
            formData.get('quantity')
          ),

        status: 'draft',

        notes:
          formData.get('notes'),
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(
    '/production-orders'
  );

  redirect(
    '/production-orders'
  );
}
export async function startProductionOrder(
  orderId: string
) {
  const supabase = await createClient();

  const { error } =
    await supabase
      .from('production_orders')
      .update({
        status: 'in_progress',
        updated_at: new Date(),
      })
      .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/production-orders');
}
export async function completeProductionOrder(
  orderId: string
) {
  const supabase = await createClient();

  const { data: order } =
    await supabase
      .from('production_orders')
      .select(`
        *,
        recipes (
          product_id
        )
      `)
      .eq('id', orderId)
      .single();

  if (!order) {
    throw new Error(
      'Orden no encontrada'
    );
  }

  const { data: ingredients } =
    await supabase
      .from('recipe_items')
      .select('*')
      .eq(
        'recipe_id',
        order.recipe_id
      );

  for (const item of ingredients ?? []) {
    const required =
      Number(item.quantity) *
      Number(order.quantity);

    await supabase
      .from('inventory_movements')
      .insert({
        product_id:
          item.ingredient_id,

        movement_type: 'exit',

        quantity: required,

        notes:
          'Consumo producción',
      });
  }

  await supabase
    .from('inventory_movements')
    .insert({
      product_id:
        order.recipes.product_id,

      movement_type: 'entry',

      quantity:
        order.quantity,

      notes:
        'Producción terminada',
    });

  await supabase
    .from('production_orders')
    .update({
      status: 'completed',
      updated_at: new Date(),
    })
    .eq('id', orderId);

  revalidatePath(
    `/production-orders/${orderId}`
  );
}
