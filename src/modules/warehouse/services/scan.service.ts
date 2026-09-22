'use server';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export type FindLotResult = {
  type: 'product' | 'raw_material';
  lot: {
    id: string;
    lot_number: string;
    quantity: number;
  };
  itemId?: string;
  itemType?: 'product' | 'raw_material';
} | null;

export async function findLot(code: string): Promise<FindLotResult> {
  const supabase = await createTypedClient();

  // 1. Buscar en lotes de productos
  const { data: productLot } = await supabase
    .from('product_lots')
    .select('id, lot_number, quantity, product_id')
    .eq('lot_number', code)
    .maybeSingle();

  if (productLot) {
    return {
      type: 'product',
      lot: {
        id: productLot.id,
        lot_number: productLot.lot_number,
        quantity: productLot.quantity,
      },
      itemId: productLot.product_id,
      itemType: 'product',
    };
  }

  // 2. Buscar en lotes de materia prima
  const { data: materialLot } = await supabase
    .from('raw_material_lots')
    .select('id, lot_number, quantity, raw_material_id')
    .eq('lot_number', code)
    .maybeSingle();

  if (materialLot) {
    return {
      type: 'raw_material',
      lot: {
        id: materialLot.id,
        lot_number: materialLot.lot_number,
        quantity: materialLot.quantity,
      },
      itemId: materialLot.raw_material_id,
      itemType: 'raw_material',
    };
  }

  return null;
}