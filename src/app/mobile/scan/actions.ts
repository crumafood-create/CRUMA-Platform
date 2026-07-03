'use server';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export type FindLotResult = {
  type: 'product' | 'raw_material';
  lot: {
    id: string;
    lot_number: string;
    quantity: number;
  };
  itemType: 'product' | 'raw_material';
  itemId: string;
} | null;

export async function findLot(
  code: string,
): Promise<FindLotResult> {
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
      lot: {
        id: String(
          productLot.id,
        ),
        lot_number:
          String(
            productLot.lot_number,
          ),
        quantity:
          Number(
            productLot.quantity ??
              0,
          ),
      },
      itemType:
        'product',
      itemId: String(
        productLot.product_id,
      ),
    };
  }

  //
  // Materia prima
  //
  const {
    data: materialLot,
  } = await supabase
    .from(
      'raw_material_lots',
    )
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
      lot: {
        id: String(
          materialLot.id,
        ),
        lot_number:
          String(
            materialLot.lot_number,
          ),
        quantity:
          Number(
            materialLot.quantity ??
              0,
          ),
      },
      itemType:
        'raw_material',
      itemId: String(
        materialLot.raw_material_id,
      ),
    };
  }

  return null;
}
