'use server';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function getSuggestedLot(
  productId: string,
) {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from(
      'inventory_stock_by_lot_location',
    )
    .select('*')
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
