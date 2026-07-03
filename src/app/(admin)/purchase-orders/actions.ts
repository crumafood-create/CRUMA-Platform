'use server';

import crypto from 'crypto';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface PurchaseOrderItemRow {
  id: string;
  purchase_order_id: string;
  raw_material_id: string;
  quantity: number | null;
  received_quantity: number | null;
  unit_cost: number | null;
}

interface RawMaterialRow {
  id: string;
  average_cost: number | null;
}

interface InventoryMovementInput {
  item_type: 'raw_material' | 'product';
  item_id: string;
  movement_type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  reference_type: string;
  reference_id: string;
  notes?: string;
}

function generateOrderNumber() {
  const date = new Date();

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  const random = crypto.randomUUID().slice(0, 6).toUpperCase();

  return `PO-${yyyy}${mm}${dd}-${random}`;
}

async function createInventoryMovement(
  supabase: SupabaseClient,
  movement: InventoryMovementInput,
) {
  const { error } = await supabase.from('inventory_movements').insert({
    item_type: movement.item_type,
    item_id: movement.item_id,
    movement_type: movement.movement_type,
    quantity: movement.quantity,
    reference_type: movement.reference_type,
    reference_id: movement.reference_id,
    notes: movement.notes ?? null,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Error al registrar movimiento de inventario: ${error.message}`);
  }
}

async function updatePurchaseOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data: items, error } = await supabase
    .from('purchase_order_items')
    .select(`
      quantity,
      received_quantity
    `)
    .eq('purchase_order_id', orderId);

  if (error) {
    throw new Error(error.message);
  }

  const typedItems = (items ?? []) as Array<
    Pick<PurchaseOrderItemRow, 'quantity' | 'received_quantity'>
  >;

  const total = typedItems.reduce(
    (
      sum: number,
      item: {
        quantity: number | null;
      },
    ) => sum + Number(item.quantity ?? 0),
    0,
  );

  const received = typedItems.reduce(
    (
      sum: number,
      item: {
        received_quantity: number | null;
      },
    ) => sum + Number(item.received_quantity ?? 0),
    0,
  );

  let status = 'released';

  if (received > 0) {
    status = received >= total ? 'received' : 'partially_received';
  }

  const { error: updateError } = await supabase
    .from('purchase_orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

export async function receivePurchaseOrderItem(
  itemId: string,
  quantityReceived: number,
) {
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (error || !item) {
    throw new Error('Item no encontrado');
  }

  const purchaseItem = item as PurchaseOrderItemRow;

  const pending =
    Number(purchaseItem.quantity ?? 0) -
    Number(purchaseItem.received_quantity ?? 0);

  if (quantityReceived <= 0 || quantityReceived > pending) {
    throw new Error('Cantidad inválida');
  }

  const newReceived =
    Number(purchaseItem.received_quantity ?? 0) + quantityReceived;

  const { error: itemError } = await supabase
    .from('purchase_order_items')
    .update({
      received_quantity: newReceived,
    })
    .eq('id', purchaseItem.id);

  if (itemError) {
    throw new Error(itemError.message);
  }

  await createInventoryMovement(supabase, {
    item_type: 'raw_material',
    item_id: purchaseItem.raw_material_id,
    movement_type: 'entry',
    quantity: quantityReceived,
    reference_type: 'purchase_order',
    reference_id: purchaseItem.purchase_order_id,
    notes: 'Recepción parcial',
  });

  await updatePurchaseOrderStatus(supabase, purchaseItem.purchase_order_id);

  revalidatePath(`/purchase-orders/${purchaseItem.purchase_order_id}`);
  revalidatePath('/purchase-orders');
  revalidatePath('/inventory-stock');
}

export async function createPurchaseOrder(formData: FormData) {
  const supabase = await createClient();

  const supplier_id = formData.get('supplier_id')?.toString() ?? '';
  const expected_date = formData.get('expected_date')?.toString() || null;
  const notes = formData.get('notes')?.toString() || null;

  if (!supplier_id) {
    throw new Error('Proveedor requerido');
  }

  const { error } = await supabase.from('purchase_orders').insert({
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
    .select('id, supplier_id')
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

  const typedItems = (items ?? []) as PurchaseOrderItemRow[];

  if (typedItems.length === 0) {
    throw new Error('La compra no tiene items para recibir');
  }

  const movements = typedItems.map((item: PurchaseOrderItemRow) => ({
    item_type: 'raw_material' as const,
    item_id: item.raw_material_id,
    movement_type: 'entry' as const,
    quantity: Number(item.quantity ?? 0),
    reference_type: 'purchase_order',
    reference_id: orderId,
    notes: 'Recepción de compra',
  }));

  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert(movements);

  if (movementError) {
    throw new Error(movementError.message);
  }

  for (const item of typedItems) {
    const { data: material, error: materialError } = await supabase
      .from('raw_materials')
      .select('id, average_cost')
      .eq('id', item.raw_material_id)
      .single();

    if (materialError || !material) {
      throw new Error(
        materialError?.message ??
          `No se encontró la materia prima ${item.raw_material_id}`,
      );
    }

    const typedMaterial = material as RawMaterialRow;

    const previousCost = Number(typedMaterial.average_cost ?? 0);
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

    const { error: itemUpdateError } = await supabase
      .from('purchase_order_items')
      .update({
        received_quantity: Number(item.quantity ?? 0),
      })
      .eq('id', item.id);

    if (itemUpdateError) {
      throw new Error(itemUpdateError.message);
    }
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
