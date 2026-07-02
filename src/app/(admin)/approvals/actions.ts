'use server';

import { revalidatePath } from 'next/cache';

import { createClient }
  from '@/infrastructure/integrations/supabase/server';

export async function approve(
  approvalId: string,
) {
  const supabase =
    await createClient();

  const {
    data: approval,
    error,
  } = await supabase
    .from(
      'approvals',
    )
    .select('*')
    .eq(
      'id',
      approvalId,
    )
    .single();

  if (
    error ||
    !approval
  ) {
    throw new Error(
      error?.message ??
        'Aprobación no encontrada',
    );
  }

  await supabase
    .from(
      'approvals',
    )
    .update({
      status:
        'approved',

      approved_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      approvalId,
    );

  //
  // Producción automática
  //
  if (
    approval.approval_type ===
      'production' &&
    approval.reference_type ===
      'product'
  ) {
    const {
      data: forecast,
    } = await supabase
      .from(
        'demand_forecasts',
      )
      .select(`
        suggested_production
      `)
      .eq(
        'product_id',
        approval.reference_id,
      )
      .single();

    const {
      data: recipe,
    } = await supabase
      .from(
        'recipes',
      )
      .select(`
        id
      `)
      .eq(
        'product_id',
        approval.reference_id,
      )
      .eq(
        'is_active',
        true,
      )
      .single();

    const suggestedProduction =
  Number(
    forecast
      ?.suggested_production ?? 0,
  );

if (
  recipe &&
  suggestedProduction > 0
) {
  await supabase
    .from(
      'production_orders',
    )
    .insert({
      recipe_id:
        recipe.id,

      planned_quantity:
        suggestedProduction,

      produced_quantity:
        0,

      status:
        'draft',

      notes:
        'Generada desde aprobación automática',
    });
    }
  }

  revalidatePath(
    '/approvals',
  );

  revalidatePath(
    '/production-orders',
  );

  //
//
// Compra automática
//
if (
  approval.approval_type ===
    'purchase' &&
  approval.reference_type ===
    'raw_material'
) {
  const {
    data: material,
    error: materialError,
  } = await supabase
    .from(
      'raw_materials',
    )
    .select(`
      id,
      name,
      reorder_quantity,
      last_cost,
      preferred_supplier_id
    `)
    .eq(
      'id',
      approval.reference_id,
    )
    .single();

  if (
    materialError ||
    !material
  ) {
    throw new Error(
      materialError?.message ??
        'Materia prima no encontrada',
    );
  }

  const supplierId =
    material.preferred_supplier_id;

  if (!supplierId) {
    throw new Error(
      `${material.name} no tiene proveedor preferido.`
    );
  }

  const quantity =
    Number(
      material.reorder_quantity ??
        0,
    );

  if (quantity <= 0) {
    return;
  }

  //
  // Crear orden
  //
  const {
    data: purchaseOrder,
    error: purchaseError,
  } = await supabase
    .from(
      'purchase_orders',
    )
    .insert({
      order_number:
        `AUTO-${Date.now()}`,

      supplier_id:
        supplierId,

      status:
        'draft',

      subtotal: 0,
      total: 0,

      notes:
        'Generada automáticamente desde aprobación',
    })
    .select('id')
    .single();

  if (
    purchaseError ||
    !purchaseOrder
  ) {
    throw new Error(
      purchaseError?.message ??
        'No se pudo crear la orden de compra'
    );
  }

  //
  // Crear renglón
  //
  const unitCost =
    Number(
      material.last_cost ?? 0,
    );

  const subtotal =
    quantity *
    unitCost;

  const {
    error: itemError,
  } = await supabase
    .from(
      'purchase_order_items',
    )
    .insert({
      purchase_order_id:
        purchaseOrder.id,

      raw_material_id:
        material.id,

      quantity,

      received_quantity: 0,

      unit_cost:
        unitCost,

      subtotal,
    });

  if (itemError) {
    throw new Error(
      itemError.message,
    );
  }

  //
  // Actualizar totales
  //
  await supabase
    .from(
      'purchase_orders',
    )
    .update({
      subtotal,
      total: subtotal,
    })
    .eq(
      'id',
      purchaseOrder.id,
    );
      }
}

export async function reject(
  approvalId: string,
) {
  const supabase =
    await createClient();

  const {
    error,
  } = await supabase
    .from('approvals')
    .update({
      status:
        'rejected',

      rejected_at:
        new Date().toISOString(),

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      'id',
      approvalId,
    );

  if (error) {
    throw new Error(
      error.message,
    );
  }

  revalidatePath(
    '/approvals',
  );
}

export async function createPurchaseApprovals() {
  const supabase =
    await createClient();

  const {
    data: materials,
    error,
  } = await supabase
    .from('raw_materials')
    .select(`
      id,
      name,
      minimum_stock,
      reorder_quantity
    `);

  if (error) {
    throw new Error(
      error.message,
    );
  }

  for (const material of materials ?? []) {
    const {
      data: stock,
    } = await supabase
      .from(
        'inventory_stock_by_item',
      )
      .select(`
        quantity
      `)
      .eq(
        'item_type',
        'raw_material',
      )
      .eq(
        'item_id',
        material.id,
      )
      .single();

    const quantity =
      Number(
        stock?.quantity ?? 0,
      );

    const minimum =
      Number(
        material.minimum_stock ??
          0,
      );

    const reorder =
      Number(
        material.reorder_quantity ??
          0,
      );

    if (
      quantity >
      minimum ||
      reorder <= 0
    ) {
      continue;
    }

    const {
      data: existing,
    } = await supabase
      .from(
        'approvals',
      )
      .select('id')
      .eq(
        'approval_type',
        'purchase',
      )
      .eq(
        'reference_type',
        'raw_material',
      )
      .eq(
        'reference_id',
        material.id,
      )
      .eq(
        'status',
        'pending',
      )
      .maybeSingle();

    if (existing) {
      continue;
    }

    await supabase
      .from(
        'approvals',
      )
      .insert({
        approval_type:
          'purchase',

        reference_type:
          'raw_material',

        reference_id:
          material.id,

        title:
          'Compra sugerida',

        description:
          `Comprar ${reorder} de ${material.name}.`,

        status:
          'pending',
      });
  }

  revalidatePath(
    '/approvals',
  );
}
