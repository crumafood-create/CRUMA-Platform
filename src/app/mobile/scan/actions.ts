'use server';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function findLot(
  code: string,
) {
  const supabase =
    await createClient();

  //
  // Producto
  //
  const {
    data: productLot,
  } = await supabase
    .from('product_lots')
    .select(`
      id,
      lot_number,
      product_id,
      quantity
    `)
    .eq(
      'lot_number',
      code,
    )
    .maybeSingle();

  if (productLot) {
    return {
      type: 'product',
      lot: productLot,
      itemType:
        'product',
      itemId:
        productLot.product_id,
    };
  }

  //
  // Materia prima
  //
  const {
    data: materialLot,
  } = await supabase
    .from('raw_material_lots')
    .select(`
      id,
      lot_number,
      raw_material_id,
      quantity
    `)
    .eq(
      'lot_number',
      code,
    )
    .maybeSingle();

  if (materialLot) {
    return {
      type:
        'raw_material',
      lot:
        materialLot,
      itemType:
        'raw_material',
      itemId:
        materialLot.raw_material_id,
    };
  }

  return null;
}
