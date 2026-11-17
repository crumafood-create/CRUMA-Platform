'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export type SuggestedLot = {
  id: string;
  lot_number: string;
  quantity: number;
  location_name: string | null;
  expiration_date: string | null;
} | null;

export type StorageCondition = 'fresh' | 'raw_frozen';

export type ConditionLot = NonNullable<SuggestedLot> & {
  storage_condition: StorageCondition;
};

export async function getSuggestedLot(
  productId: string,
  condition?: StorageCondition,
): Promise<SuggestedLot | ConditionLot> {
  const supabase = await createTypedClient();

  if (condition) {
    const conditionClient = supabase as unknown as {
      rpc: (
        functionName: 'get_product_lot_storage_pick_suggestion',
        args: { p_product_id: string; p_storage_condition: StorageCondition },
      ) => Promise<{ data: {
        lot_id: string;
        lot_number: string;
        quantity: number;
        location_name: string | null;
        expiration_date: string | null;
        storage_condition: StorageCondition;
      } | null; error: { message: string } | null }>;
    };
    const { data, error } = await conditionClient.rpc(
      'get_product_lot_storage_pick_suggestion',
      { p_product_id: productId, p_storage_condition: condition },
    );
    if (error) throw new Error(error.message);
    if (!data) return null;
    return {
      id: data.lot_id,
      lot_number: data.lot_number,
      quantity: Number(data.quantity),
      location_name: data.location_name,
      expiration_date: data.expiration_date,
      storage_condition: data.storage_condition,
    };
  }

  const { data, error } = await supabase
    .from('inventory_pick_suggestions')
    .select(`
      lot_id,
      lot_number,
      quantity,
      location_name,
      expiration_date
    `)
    .eq('product_id', productId)
    .gt('quantity', 0)
    .order('expiration_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: String(data.lot_id),
    lot_number: String(data.lot_number),
    quantity: Number(data.quantity ?? 0),
    location_name: data.location_name ?? null,
    expiration_date: data.expiration_date ?? null,
  };
}
