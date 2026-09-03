import type { TypedSupabaseClient } from '@/infrastructure/integrations/supabase/database.types';

import {
  assertPurchaseOrderStatus,
  assertPurchaseOrderTransition,
} from './purchase-order-contract';

async function draftOrder(supabase: TypedSupabaseClient, orderId: string) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id, status')
    .eq('id', orderId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error('No fue posible validar la orden de compra.');
  if (!data) throw new Error('Orden de compra no encontrada.');
  const status = assertPurchaseOrderStatus(data.status);
  if (status !== 'draft') throw new Error('Solo se pueden modificar órdenes en borrador.');
  return data;
}

export async function assertSupplierCanReceiveOrders(
  supabase: TypedSupabaseClient,
  supplierId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('id')
    .eq('id', supplierId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error('No fue posible validar el proveedor.');
  if (!data) throw new Error('El proveedor no está disponible para nuevas órdenes.');
}

export async function assertPurchaseOrderCanRelease(
  supabase: TypedSupabaseClient,
  orderId: string,
): Promise<void> {
  await draftOrder(supabase, orderId);
  const { data, error } = await supabase
    .from('purchase_order_items')
    .select('id')
    .eq('purchase_order_id', orderId)
    .limit(1);
  if (error) throw new Error('No fue posible validar los renglones de compra.');
  if (!data?.length) throw new Error('La orden debe contener al menos un renglón.');
}

export async function assertPurchaseOrderCanCancel(
  supabase: TypedSupabaseClient,
  orderId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', orderId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error('No fue posible validar la orden de compra.');
  if (!data) throw new Error('Orden de compra no encontrada.');
  assertPurchaseOrderTransition(assertPurchaseOrderStatus(data.status), 'cancelled');
}

export async function assertPurchaseOrderItemCanBeAdded(
  supabase: TypedSupabaseClient,
  orderId: string,
  materialId: string,
): Promise<void> {
  await draftOrder(supabase, orderId);
  const { data: material, error: materialError } = await supabase
    .from('raw_materials').select('id').eq('id', materialId)
    .eq('is_active', true).is('deleted_at', null).maybeSingle();
  if (materialError) throw new Error('No fue posible validar la materia prima.');
  if (!material) throw new Error('La materia prima no está disponible.');
  const { data: duplicate, error } = await supabase
    .from('purchase_order_items').select('id')
    .eq('purchase_order_id', orderId).eq('raw_material_id', materialId).maybeSingle();
  if (error) throw new Error('No fue posible validar los renglones de compra.');
  if (duplicate) throw new Error('La materia prima ya está incluida en la orden.');
}
