import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

export async function getLotById(id: string) {
  const supabase = await createTypedClient();

  const { data: productLot } = await supabase
    .from('product_lots')
    .select('id, lot_number, quantity, product_id')
    .eq('id', id)
    .maybeSingle();

  if (productLot) {
    return { ...productLot, type: 'Producto' as const };
  }

  const { data: materialLot } = await supabase
    .from('raw_material_lots')
    .select('id, lot_number, quantity, raw_material_id')
    .eq('id', id)
    .maybeSingle();

  if (materialLot) {
    return { ...materialLot, type: 'Materia Prima' as const };
  }

  return null;
}