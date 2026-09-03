'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export type SuggestedLot = {
  id: string;
  lot_number: string;
  quantity: number;
  location_name: string | null;
  expiration_date: string | null;
} | null;

export async function getSuggestedLot(
  productId: string,
): Promise<SuggestedLot> {
  const supabase = await createTypedClient();

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
