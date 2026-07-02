import { notFound }
  from 'next/navigation';

import { createClient }
  from '@/infrastructure/integrations/supabase/server';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function LotPage({
  params,
}: Props) {
  const { id } =
    await params;

  const supabase =
    await createClient();

  //
  // Producto
  //
  const {
    data: productLot,
  } = await supabase
    .from(
      'product_lots',
    )
    .select(`
      id,
      lot_number,
      quantity,
      product_id
    `)
    .eq(
      'id',
      id,
    )
    .maybeSingle();

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
      quantity,
      raw_material_id
    `)
    .eq(
      'id',
      id,
    )
    .maybeSingle();

  const lot =
    productLot ??
    materialLot;

  if (!lot) {
    notFound();
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Trazabilidad
      </h1>

      <div className="rounded-2xl border p-6">
        <div>
          <span className="font-semibold">
            Lote:
          </span>{' '}
          {lot.lot_number}
        </div>

        <div className="mt-2">
          <span className="font-semibold">
            Cantidad:
          </span>{' '}
          {lot.quantity}
        </div>

        <div className="mt-2">
          <span className="font-semibold">
            Tipo:
          </span>{' '}
          {'product_id' in lot
            ? 'Producto'
            : 'Materia Prima'}
        </div>
      </div>
    </main>
  );
}
