'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

function generateOrderNumber() {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const random = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `PO-${yyyy}${mm}${dd}-${random}`;
}

async function updatePurchaseOrderStatus(
  supabase: any,
  orderId: string,
) {
  const { data: items, error } =
    await supabase
      .from('purchase_order_items')
      .select(`
        quantity,
        received_quantity
      `)
      .eq(
        'purchase_order_id',
        orderId,
      );

  if (error) {
    throw new Error(error.message);
  }

  const total =
    (items ?? []).reduce(
      (sum, item) =>
        sum +
        Number(item.quantity),
      0,
    );

  const received =
    (items ?? []).reduce(
      (sum, item) =>
        sum +
        Number(
          item.received_quantity ??
            0,
        ),
      0,
    );

  let status =
    'released';

  if (received > 0) {
    status =
      received >= total
        ? 'received'
        : 'partially_received';
  }

  const { error: updateError } =
    await supabase
      .from('purchase_orders')
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', orderId);

  if (updateError) {
    throw new Error(
      updateError.message,
    );
  }
}

export async function createPurchaseOrder(formData: FormData) {
  const supabase = await createClient();

  const supplier_id = String(formData.get('supplier_id'));
  const expected_date = formData.get('expected_date') || null;
  const notes = formData.get('notes') || null;

  const { error } = await supabase
    .from('purchase_orders')
    .insert({
      order_number: generateOrderNumber(),
      supplier_id,
      status: 'draft',
      expected_date,
      notes,
      subtotal: 0,
      total: 0,
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/purchase-orders');
  redirect('/purchase-orders');
}

export async function releasePurchaseOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('purchase_orders')
    .update({
      status: 'released',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
}

export async function cancelPurchaseOrder(orderId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('purchase_orders')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
}

export async function receivePurchaseOrder(orderId: string) {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .select('id, status, supplier_id')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? 'Compra no encontrada');
  }

  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('purchase_order_id', orderId);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  if (!items || items.length === 0) {
    throw new Error('La compra no tiene items para recibir');
  }

  const movements = items.map((item) => ({
    item_type: 'raw_material',
    item_id: item.raw_material_id,
    movement_type: 'entry',
    quantity: Number(item.quantity),
    reference_type: 'purchase_order',
    reference_id: orderId,
    notes: 'Recepción de compra',
  }));

  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert(movements);

  for (const item of items ?? []) {
  const { error } = await supabase
    .from('purchase_order_items')
    .update({
      received_quantity: Number(item.quantity),
    })
    .eq('id', item.id);

  if (error) {
    throw new Error(error.message);
  }
  }

  if (movementError) {
    throw new Error(movementError.message);
  }

  for (const item of items) {
    const { data: material, error: materialError } = await supabase
      .from('raw_materials')
      .select('id, average_cost')
      .eq('id', item.raw_material_id)
      .single();

    if (materialError || !material) {
      throw new Error(
        materialError?.message ?? `No se encontró la materia prima ${item.raw_material_id}`
      );
    }

    const previousCost = Number(material.average_cost ?? 0);
    const purchaseCost = Number(item.unit_cost ?? 0);

    let newAverage = purchaseCost;

    if (previousCost > 0) {
      newAverage = (previousCost + purchaseCost) / 2;
    }

    const { error: updateMaterialError } = await supabase
      .from('raw_materials')
      .update({
        last_cost: purchaseCost,
        average_cost: Number(newAverage.toFixed(4)),
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.raw_material_id);

    if (updateMaterialError) {
      throw new Error(updateMaterialError.message);
    }
  }

  const { error: itemsUpdateError } = await supabase
    .from('purchase_order_items')
    .update({
      received_quantity: supabase.rpc ? undefined : undefined,
    })
    .eq('purchase_order_id', orderId);

  if (itemsUpdateError) {
    throw new Error(itemsUpdateError.message);
  }

  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update({
      status: 'received',
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  revalidatePath('/purchase-orders');
  revalidatePath(`/purchase-orders/${orderId}`);
  revalidatePath('/inventory-stock');
  revalidatePath('/inventory');
  revalidatePath('/raw-materials');
}
