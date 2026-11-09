'use server';

import { revalidatePath } from 'next/cache';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireTypedAuthorizedAction } from '@/modules/identity/guards/action.guard';
import { PERMISSIONS } from '@/modules/identity/permissions/permissions.constants';
import {
  assertPurchaseReceiptMatchesPresentation,
  parsePurchaseReceivingInput,
  type PurchaseReceivingInput,
} from '@/modules/procurement/application/purchase-receiving-contract';
import { assertPurchaseOrderStatus, type PurchaseOrderStatus } from '@/modules/procurement/application/purchase-order-contract';

export type InventoryLocation = { id: string; code: string; name: string; zone: string | null };
export type ReceivingItem = {
  id: string; purchase_order_id: string; raw_material_id: string;
  quantity: number; received_quantity: number; unit_cost: number;
  presentation_mode: 'base_unit' | 'sealed_package';
  purchase_quantity: number;
  base_quantity_per_presentation: number;
  base_unit_code: string;
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
  const receiptReader = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          order: (column: string) => Promise<{
            data: Array<{
              id: string;
              purchase_order_id: string;
              raw_material_id: string;
              quantity: number;
              received_quantity: number;
              unit_cost: number;
              presentation_mode: 'base_unit' | 'sealed_package';
              purchase_quantity: number;
              base_quantity_per_presentation: number;
              raw_material: {
                id: string;
                name: string;
                unit_of_measure: { code: string } | null;
              } | null;
            }> | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
  const { data: items, error: itemsError } = await receiptReader
    .from('purchase_order_items')
    .select('id, purchase_order_id, raw_material_id, quantity, received_quantity, unit_cost, presentation_mode, purchase_quantity, base_quantity_per_presentation, raw_material:raw_materials!purchase_order_items_raw_material_id_fkey(id, name, unit_of_measure:units_of_measure!raw_materials_unit_of_measure_id_fkey(code))')
    .eq('purchase_order_id', purchaseOrderId).order('id');
  if (itemsError) throw new Error('No fue posible cargar los renglones de compra.');
  return {
    purchaseOrder: { ...purchaseOrder, status: assertPurchaseOrderStatus(purchaseOrder.status) },
    items: (items ?? []).map((item) => ({
      ...item,
      raw_material: item.raw_material,
      base_unit_code: item.raw_material?.unit_of_measure?.code ?? 'unidad base',
      suggested_location: null,
    })),
  };
}

type ReceivePurchaseOrderLotRpc = (
  functionName: 'receive_purchase_order_lot',
  parameters: {
    p_item_id: string;
    p_quantity: number;
    p_lot_number: string;
    p_expiration_date: string;
    p_inventory_location_id: string;
    p_idempotency_key: string;
  },
) => Promise<{
  data: string | null;
  error: { message: string } | null;
}>;

export async function confirmReceiving(
  rawInput: PurchaseReceivingInput,
) {
  const input =
    parsePurchaseReceivingInput(rawInput);

  const { supabase } =
    await requireTypedAuthorizedAction(
      PERMISSIONS.PROCUREMENT_ORDER_RECEIVE,
    );

  const presentationReader = supabase as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: {
              presentation_mode: 'base_unit' | 'sealed_package';
              base_quantity_per_presentation: number;
            } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };
  const { data: item, error: itemError } = await presentationReader
    .from('purchase_order_items')
    .select('presentation_mode, base_quantity_per_presentation')
    .eq('id', input.purchaseOrderItemId)
    .maybeSingle();
  if (itemError || !item) throw new Error('No fue posible validar la presentación de compra.');
  assertPurchaseReceiptMatchesPresentation(
    input.quantityReceived,
    item.presentation_mode,
    item.base_quantity_per_presentation,
  );

  const receivePurchaseOrderLot =
    supabase.rpc.bind(supabase) as unknown as
      ReceivePurchaseOrderLotRpc;

  const { data: orderId, error } =
    await receivePurchaseOrderLot(
      'receive_purchase_order_lot',
      {
        p_item_id:
          input.purchaseOrderItemId,
        p_quantity:
          input.quantityReceived,
        p_lot_number:
          input.lotNumber,
        p_expiration_date:
          input.expirationDate,
        p_inventory_location_id:
          input.inventoryLocationId,
        p_idempotency_key:
          input.idempotencyKey,
      },
    );

  if (error || !orderId) {
    throw new Error(
      'No fue posible confirmar la recepción.',
    );
  }

  revalidatePath('/mobile/receiving');
  revalidatePath(
    `/mobile/receiving/${orderId}`,
  );
  revalidatePath(
    `/purchase-orders/${orderId}`,
  );
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
