'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProductionOrder(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production_orders')
    .insert({
      recipe_id: formData.get('recipe_id'),
      quantity:  Number(formData.get('quantity')),
      status:    'draft',
      notes:     formData.get('notes'),
    });

  if (error) throw new Error(error.message);

  revalidatePath('/production-orders');
  redirect('/production-orders');
}

// ─── Start ────────────────────────────────────────────────────────────────────

export async function startProductionOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('production_orders')
    .update({ status: 'in_progress', updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw new Error(error.message);

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

// ─── Complete ─────────────────────────────────────────────────────────────────

export async function completeProductionOrder(
  orderId: string
) {
  const supabase = await createClient();

  // 1. Cargar orden
  const { data: order } = await supabase
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

  // 2. Cargar ingredientes
  const { data: ingredients } =
    await supabase
      .from('recipe_items')
      .select('*')
      .eq(
        'recipe_id',
        order.recipe_id
      );

  // 3. Validar stock
  for (const item of ingredients ?? []) {
    const required =
      Number(item.quantity) *
      Number(order.quantity);

    const { data: stock } =
      await supabase
        .from('inventory_stock')
        .select('quantity')
        .eq(
          'product_id',
          item.ingredient_id
        );

    const available =
      stock?.reduce(
        (sum, row) =>
          sum + Number(row.quantity),
        0
      ) ?? 0;

    if (available < required) {
      throw new Error(
        `Stock insuficiente para ingrediente ${item.ingredient_id}`
      );
    }
  }

  // 4. Registrar salidas
  const exits =
    (ingredients ?? []).map(item => ({
      product_id:
        item.ingredient_id,

      movement_type: 'exit',

      quantity:
        Number(item.quantity) *
        Number(order.quantity),

      notes:
        'Consumo producción',
    }));

  if (exits.length > 0) {
    const { error } =
      await supabase
        .from('inventory_movements')
        .insert(exits);

    if (error) {
      throw new Error(
        error.message
      );
    }
  }

  // 5. Registrar entrada producto terminado
  const { error: entryError } =
    await supabase
      .from('inventory_movements')
      .insert({
        product_id:
          order.recipes?.product_id,

        movement_type: 'entry',

        quantity:
          order.quantity,

        notes:
          'Producción terminada',
      });

  if (entryError) {
    throw new Error(
      entryError.message
    );
  }

  // 6. Completar orden
  const { error: updateError } =
    await supabase
      .from('production_orders')
      .update({
        status: 'completed',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', orderId);

  if (updateError) {
    throw new Error(
      updateError.message
    );
  }

  revalidatePath(
    '/production-orders'
  );

  revalidatePath(
    `/production-orders/${orderId}`
  );
}
