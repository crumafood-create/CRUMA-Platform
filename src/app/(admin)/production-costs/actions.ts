'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/infrastructure/integrations/supabase/server';

export async function calculateProductionCost(
  productionOrderId: string,
) {
  const supabase =
    await createClient();

  //
  // Consumos por lote
  //
  const {
    data: consumptions,
    error:
      consumptionsError,
  } = await supabase
    .from(
      'production_lot_consumptions',
    )
    .select(`
      raw_material_id,
      quantity
    `)
    .eq(
      'production_order_id',
      productionOrderId,
    );

  if (
    consumptionsError
  ) {
    throw new Error(
      consumptionsError.message,
    );
  }

  //
  // Orden
  //
  const {
    data: order,
    error:
      orderError,
  } = await supabase
    .from(
      'production_orders',
    )
    .select(`
      id,
      produced_quantity
    `)
    .eq(
      'id',
      productionOrderId,
    )
    .single();

  if (
    orderError ||
    !order
  ) {
    throw new Error(
      orderError?.message ??
        'Orden no encontrada',
    );
  }

  const materialIds =
    consumptions?.map(
      (
        row,
      ) =>
        row.raw_material_id,
    ) ?? [];

  const {
    data:
      materials,
    error:
      materialsError,
  } =
    materialIds.length >
    0
      ? await supabase
          .from(
            'raw_materials',
          )
          .select(`
            id,
            average_cost
          `)
          .in(
            'id',
            materialIds,
          )
      : {
          data: [],
          error: null,
        };

  if (
    materialsError
  ) {
    throw new Error(
      materialsError.message,
    );
  }

  const materialMap =
    new Map(
      (
        materials ??
        []
      ).map(
        (
          material,
        ) => [
          material.id,
          Number(
            material.average_cost ??
              0,
          ),
        ],
      ),
    );

  //
  // Costo de materiales
  //
  let materialCost =
    0;

  for (const row of
    consumptions ??
    []) {
    const averageCost =
      materialMap.get(
        row.raw_material_id,
      ) ?? 0;

    materialCost +=
      Number(
        row.quantity,
      ) *
      averageCost;
  }

  const laborCost = 0;
  const overheadCost =
    0;

  const totalCost =
    materialCost +
    laborCost +
    overheadCost;

  const produced =
    Number(
      order.produced_quantity ??
        0,
    );

  const unitCost =
    produced > 0
      ? totalCost /
        produced
      : 0;

  //
  // Upsert
  //
  const {
    error:
      upsertError,
  } = await supabase
    .from(
      'production_costs',
    )
    .upsert(
      {
        production_order_id:
          productionOrderId,

        material_cost:
          Number(
            materialCost.toFixed(
              4,
            ),
          ),

        labor_cost:
          Number(
            laborCost.toFixed(
              4,
            ),
          ),

        overhead_cost:
          Number(
            overheadCost.toFixed(
              4,
            ),
          ),

        total_cost:
          Number(
            totalCost.toFixed(
              4,
            ),
          ),

        unit_cost:
          Number(
            unitCost.toFixed(
              4,
            ),
          ),

        updated_at:
          new Date().toISOString(),
      },
      {
        onConflict:
          'production_order_id',
      },
    );

  if (
    upsertError
  ) {
    throw new Error(
      upsertError.message,
    );
  }

  revalidatePath(
    '/production-costs',
  );

  revalidatePath(
    `/production-costs/${productionOrderId}`,
  );

  revalidatePath(
    `/production-orders/${productionOrderId}`,
  );
}
