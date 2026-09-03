'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export async function getSuggestedLot(
  productId: string,
) {
  const supabase =
    await createTypedClient();

  const {
    data,
    error,
  } = await supabase
    .from(
      'inventory_pick_suggestions',
    )
    .select('lot_id, product_id, lot_number, quantity, location_name, expiration_date')
    .eq(
      'product_id',
      productId,
    )
    .gt(
      'quantity',
      0,
    )
    .order(
      'expiration_date',
      {
        ascending: true,
      },
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message,
    );
  }

  return data;
}
