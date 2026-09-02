'use server';

import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireTypedAuthorizedAction } from '@/lib/auth/guards/action.guard';
import { PERMISSIONS } from '@/lib/auth/permissions/permissions.constants';
import { assertPurchaseOrderStatus, type PurchaseOrderStatus } from '@/modules/procurement/application/purchase-order-contract';

export type InventoryLocation = { id: string; code: string; name: string; zone: string | null };
export type ReceivingItem = {
  id: string; purchase_order_id: string; raw_material_id: string;
  quantity: number; received_quantity: number; unit_cost: number;
  raw_material: { id: string; name: string } | null;
  suggested_location: { id: string; name: string } | null;
};
export type ReceivingDetail = {
  purchaseOrder: { id: string; order_number: string; supplier_id: string; status: PurchaseOrderStatus };
  items: ReceivingItem[];
};

export async function getReceivingDetail(purchaseOrderId: string): Promise<ReceivingDetail> {
  const supabase = await createTypedClient();
  const { data: purchaseOrder, error } = await supabase
    .from('purchase_orders').select('id, order_number, supplier_id, status')
    .eq('id', purchaseOrderId).is('deleted_at', null).maybeSingle();
  if (error || !purchaseOrder) throw new Error('Orden de compra no encontrada.');
  const { data: items, error: itemsError } = await supabase
    .from('purchase_order_items')
    .select('id, purchase_order_id, raw_material_id, quantity, received_quantity, unit_cost')
    .eq('purchase_order_id', purchaseOrderId).order('id');
  if (itemsError) throw new Error('No fue posible cargar los renglones de compra.');
  const materialIds = (items ?? []).map((item) => item.raw_material_id);
  const { data: materials } = materialIds.length
    ? await supabase.from('raw_materials').select('id, name').in('id', materialIds)
    : { data: [] };
  const materialMap = new Map((materials ?? []).map((row) => [row.id, row]));
  return {
    purchaseOrder: { ...purchaseOrder, status: assertPurchaseOrderStatus(purchaseOrder.status) },
    items: (items ?? []).map((item) => ({
      ...item,
      raw_material: materialMap.get(item.raw_material_id) ?? null,
      suggested_location: null,
    })),
  };
}

export async function confirmReceiving(
  purchaseOrderItemId: string,
  lotNumber: string,
  expirationDate: string,
  inventoryLocationId: string,
) {
  const { supabase } = await requireTypedAuthorizedAction(
    PERMISSIONS.PROCUREMENT_ORDER_RECEIVE,
  );
  if (!lotNumber.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate) || !inventoryLocationId) {
    throw new Error('Lote, caducidad y ubicación son obligatorios.');
  }
  const { data: orderId, error } = await supabase.rpc('receive_purchase_order_lot', {
    p_item_id: purchaseOrderItemId,
    p_lot_number: lotNumber.trim(),
    p_expiration_date: expirationDate,
    p_inventory_location_id: inventoryLocationId,
  });
  if (error || !orderId) throw new Error('No fue posible confirmar la recepción.');
  revalidatePath('/mobile/receiving');
  revalidatePath(`/mobile/receiving/${orderId}`);
  revalidatePath(`/purchase-orders/${orderId}`);
}

export async function getReceivingLocations(): Promise<InventoryLocation[]> {
  const supabase = await createTypedClient();
  const { data, error } = await supabase.from('inventory_locations')
    .select('id, name, zone').eq('is_active', true).is('deleted_at', null).order('name');
  if (error) throw new Error('No fue posible cargar las ubicaciones.');
  return (data ?? []).map((row) => ({ ...row, code: row.name }));
}

export async function validateLotNumber(rawMaterialId: string, lotNumber: string): Promise<boolean> {
  const supabase = await createTypedClient();
  const { data, error } = await supabase.from('raw_material_lots').select('id')
    .eq('raw_material_id', rawMaterialId).ilike('lot_number', lotNumber.trim()).limit(1);
  if (error) throw new Error('No fue posible validar el lote.');
  return !data?.length;
}

export async function getLocation(id: string) {
  const supabase = await createTypedClient();
  const { data, error } = await supabase.from('inventory_locations')
    .select('id, name, zone').eq('id', id).eq('is_active', true).is('deleted_at', null).maybeSingle();
  if (error || !data) throw new Error('Ubicación no encontrada.');
  return data;
}
