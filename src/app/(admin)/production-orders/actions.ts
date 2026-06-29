'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

/**
 * Genera un número de orden único
 * Formato: OP-YYYYMMDD-XXXXXX
 */
function generateOrderNumber(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `OP-${yyyy}${mm}${dd}-${random}`;
}

/**
 * Obtiene el estado actual de una orden de producción
 */
async function getProductionOrder(
  supabase: any,
  orderId: string
) {
  const { data: order, error } = await supabase
    .from('production_orders')
    .select('id, planned_quantity, produced_quantity, status')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw new Error(error?.message ?? 'Orden de producción no encontrada');
  }

  return order;
}

/**
 * Valida que hay suficiente stock para los ingredientes de una receta
 */
async function validateRecipeStockAvailability(
  supabase: any,
  recipeId: string
) {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id, ingredients(ingredient_id, required_quantity)')
    .eq('id', recipeId)
    .single();

  if (recipeError || !recipe) {
    throw new Error(recipeError?.message ?? 'Receta no encontrada');
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return true; // Receta sin ingredientes es válida
  }

  // Validar stock disponible para cada ingrediente
  for (const item of recipe.ingredients) {
    const { data: stock, error: stockError } = await supabase
      .from('inventory_stock_by_item')
      .select('quantity')
      .eq('item_type', 'raw_material')
      .eq('item_id', item.ingredient_id)
      .single();

    if (stockError) {
      throw new Error(
        `No se puede verificar stock para ingrediente ${item.ingredient_id}`
      );
    }

    const available = Number(stock?.quantity ?? 0);
    const required = Number(item.required_quantity ?? 0);

    if (available < required) {
      throw new Error(
        `Stock insuficiente para el ingrediente ${item.ingredient_id}. ` +
        `Disponible: ${available}, Requerido: ${required}`
      );
    }
  }

  return true;
}

/**
 * Registra un movimiento de inventario
 */
async function createInventoryMovement(
  supabase: any,
  movement: {
    item_type: 'product' | 'raw_material';
    item_id: string;
    movement_type: 'entry' | 'exit' | 'adjustment';
    quantity: number;
    reference_type: string;
    reference_id: string;
    notes?: string;
  }
) {
  const { error } = await supabase
    .from('inventory_movements')
    .insert({
      item_type: movement.item_type,
      item_id: movement.item_id,
      movement_type: movement.movement_type,
      quantity: movement.quantity,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      notes: movement.notes || null,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error(`Error al registrar movimiento de inventario: ${error.message}`);
  }
}

// ============================================================================
// ACCIONES PRINCIPALES
// ============================================================================

/**
 * Crea una nueva orden de producción
 */
export async function createProductionOrder(formData: FormData) {
  const supabase = await createClient();

  const recipeId = formData.get('recipe_id')?.toString().trim() ?? '';
  const plannedQuantity = Number(formData.get('planned_quantity'));
  const notes = formData.get('notes')?.toString().trim() || null;

  // Validar inputs
  if (!recipeId || !plannedQuantity || plannedQuantity <= 0) {
    throw new Error('Receta y cantidad planeada son obligatorias');
  }

  // Validar que la receta existe y hay stock disponible
  await validateRecipeStockAvailability(supabase, recipeId);

  // Crear la orden
  const { error } = await supabase.from('production_orders').insert({
    recipe_id: recipeId,
    order_number: generateOrderNumber(),
    planned_quantity: plannedQuantity,
    produced_quantity: 0,
    status: 'draft',
    notes,
  });

  if (error) {
    throw new Error(`Error al crear orden de producción: ${error.message}`);
  }

  revalidatePath('/production-orders');
  redirect('/production-orders');
}

/**
 * Libera una orden de producción (draft → released)
 */
export async function releaseProductionOrder(orderId: string) {
  const supabase = await createClient();

  // Validar que la orden existe y está en estado correcto
  const order = await getProductionOrder(supabase, orderId);

  if (order.status !== 'draft') {
    throw new Error(
      `No se puede liberar una orden en estado ${order.status}`
    );
  }

  // Actualizar estado
  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'released',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Error al liberar orden: ${error.message}`);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

/**
 * Inicia la producción de una orden (released → in_progress)
 */
export async function startProductionOrder(orderId: string) {
  const supabase = await createClient();

  // Validar que la orden existe y está en estado correcto
  const order = await getProductionOrder(supabase, orderId);

  if (order.status !== 'released') {
    throw new Error(
      `No se puede iniciar una orden en estado ${order.status}`
    );
  }

  // Actualizar estado
  const { error } = await supabase
    .from('production_orders')
    .update({
      status: 'in_progress',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Error al iniciar orden: ${error.message}`);
  }

  revalidatePath('/production-orders');
  revalidatePath(`/production-orders/${orderId}`);
}

export async function cancelProductionOrder(
  orderId: string
) {
  const supabase = await createClient();

  const order = await getProductionOrder(
    supabase,
    orderId
  );

  const cancelableStates = [
    'draft',
    'released',
  ];

  if (
    !cancelableStates.includes(
      order.status
    )
  ) {
    throw new Error(
      `No se puede cancelar una orden en estado ${order.status}`
    );
  }

  const { error } =
    await supabase
      .from('production_orders')
      .update({
        status: 'cancelled',
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', orderId);

  if (error) {
    throw new Error(
      error.message
    );
  }

  revalidatePath(
    '/production-orders'
  );

  revalidatePath(
    `/production-orders/${orderId}`
  );
}

/**
 * Completa una orden de producción
 * Consume materias primas y genera producto terminado
 */
export async function completeProductionOrder(
  orderId: string
) {
  const supabase = await createClient();

  // 1. Validar estado
  const order = await getProductionOrder(
    supabase,
    orderId
  );

  if (order.status !== 'in_progress') {
    throw new Error(
      `No se puede completar una orden en estado ${order.status}`
    );
  }

  // 2. Obtener receta y producto terminado
  const {
    data: productionOrder,
    error: orderError,
  } = await supabase
    .from('production_orders')
    .select(`
      recipe_id,
      recipes (
        product_id
      )
    `)
    .eq('id', orderId)
    .single();

  if (orderError || !productionOrder) {
    throw new Error(
      'No se pudo obtener la receta de la orden'
    );
  }

  const recipe =
    Array.isArray(productionOrder.recipes)
      ? productionOrder.recipes[0]
      : productionOrder.recipes;

  if (!recipe?.product_id) {
    throw new Error(
      'La receta no tiene producto asociado'
    );
  }

  // 3. Obtener ingredientes
  const {
    data: ingredients,
    error: ingredientsError,
  } = await supabase
    .from('recipe_items')
    .select(`
      id,
      ingredient_id,
      quantity
    `)
    .eq(
      'recipe_id',
      productionOrder.recipe_id
    );

  if (ingredientsError) {
    throw new Error(
      ingredientsError.message
    );
  }

  // 4. Validar stock disponible
  for (const item of ingredients ?? []) {
    const required =
      Number(item.quantity) *
      Number(order.planned_quantity);

    const { data: stock } =
      await supabase
        .from(
          'inventory_stock_by_item'
        )
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
  }

  // 5. Consumir materias primas
  for (const item of ingredients ?? []) {
    const required =
      Number(item.quantity) *
      Number(order.planned_quantity);

    await createInventoryMovement(
      supabase,
      {
        item_type:
          'raw_material',

        item_id:
          item.ingredient_id,

        movement_type:
          'exit',

        quantity:
          required,

        reference_type:
          'production_order',

        reference_id:
          orderId,

        notes:
          'Consumo de producción',
      }
    );
  }

  // 6. Registrar entrada del producto terminado
  await createInventoryMovement(
    supabase,
    {
      item_type: 'product',

      item_id:
        recipe.product_id,

      movement_type:
        'entry',

      quantity:
        Number(
          order.planned_quantity
        ),

      reference_type:
        'production_order',

      reference_id:
        orderId,

      notes:
        'Producción terminada',
    }
  );

  // 7. Completar orden
  const {
    error: updateError,
  } = await supabase
    .from(
      'production_orders'
    )
    .update({
      status: 'completed',

      produced_quantity:
        order.planned_quantity,

      completed_at:
        new Date().toISOString(),

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
