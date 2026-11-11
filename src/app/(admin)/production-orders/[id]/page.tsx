import crypto from 'node:crypto';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { ProductionCostForm } from '@/modules/manufacturing/components/forms/production-cost-form';

import {
  releaseProductionOrder,
  startProductionOrder,
  completeProductionOrder,
  cancelProductionOrder,
} from '../actions';


type RecipeItem = {
  id: string;
  raw_material_id: string | null;
  product_id: string | null;
  planned_quantity: number;
};

type RawMaterial = {
  id: string;
  name: string;
  internal_code: string | null;
};

type InventoryStockRow = {
  item_id: string | null;
  quantity: number | null;
};

type MassProduct = {
  id: string;
  name: string;
  internal_code: string | null;
};

type MassProductLot = {
  id: string;
  product_id: string;
  lot_number: string;
  quantity: number;
  expiration_date: string | null;
  location_name: string | null;
};

type ReservedMassLot = {
  productLotId: string;
  lotNumber: string;
  quantity: number;
};

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'released':
      return 'Liberada';
    case 'in_progress':
      return 'En producción';
    case 'completed':
      return 'Completada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status;
  }
}

export default async function ProductionOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();

  const completionIdempotencyKey =
    crypto.randomUUID();

  const costSettlementIdempotencyKey =
    crypto.randomUUID();

  const { data: order } = await supabase
    .from('production_orders')
    .select(
      'id, production_number, recipe_id, planned_quantity, produced_quantity, production_status, notes, started_at, completed_at, created_at'
    )
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  const { data: currentCost, error: currentCostError } = await supabase
    .from('production_costs')
    .select('labor_cost, overhead_cost')
    .eq('production_order_id', order.id)
    .maybeSingle();
  if (currentCostError) throw new Error('No fue posible consultar el costo de producción.');

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, name, description')
    .eq('id', order.recipe_id)
    .single();

  const { data: ingredientRows, error: ingredientsError } = await supabase
    .from('production_order_items')
    .select('*')
    .eq('production_order_id', order.id)
    .order('created_at', { ascending: true });
  if (ingredientsError) throw new Error('No fue posible cargar el plan de materiales de la orden.');

  const ingredients: RecipeItem[] = ingredientRows ?? [];

  const ingredientIds = (ingredients ?? []).flatMap((item: RecipeItem) =>
    item.raw_material_id ? [item.raw_material_id] : [],
  );

  let materials: RawMaterial[] = [];
  if (ingredientIds.length > 0) {
    const { data } = await supabase
      .from('raw_materials')
      .select('id, name, internal_code')
      .in('id', ingredientIds);

    materials = data ?? [];
  }

  const massProductIds = [...new Set(
    ingredients.flatMap((item) => item.product_id ? [item.product_id] : []),
  )];
  let massProducts: MassProduct[] = [];
  let massLots: MassProductLot[] = [];
  let reservedMassLots: ReservedMassLot[] = [];
  if (massProductIds.length > 0) {
    const [{ data: products, error: productsError }, { data: lots, error: lotsError }] =
      await Promise.all([
        supabase
          .from('products')
          .select('id, name, internal_code')
          .in('id', massProductIds),
        supabase
          .from('inventory_product_lots_fefo')
          .select('id, product_id, lot_number, quantity, expiration_date, location_name')
          .in('product_id', massProductIds)
          .order('expiration_date', { ascending: true }),
      ]);

    if (productsError || lotsError) {
      throw new Error('No fue posible cargar las variedades y lotes disponibles de masa.');
    }

    massProducts = products ?? [];
    massLots = (lots ?? []).flatMap((lot) =>
      lot.id && lot.product_id && lot.lot_number
        ? [{
            id: lot.id,
            product_id: lot.product_id,
            lot_number: lot.lot_number,
            quantity: Number(lot.quantity ?? 0),
            expiration_date: lot.expiration_date,
            location_name: lot.location_name,
          }]
        : [],
    );

    if (order.production_status === 'in_progress') {
      const { data: reservations, error: reservationsError } = await supabase
        .from('production_order_product_lot_reservations')
        .select('product_lot_id, reserved_quantity')
        .eq('production_order_id', order.id)
        .order('product_lot_id');

      if (reservationsError) {
        throw new Error('No fue posible cargar los lotes de masa apartados.');
      }

      const reservedLotIds = (reservations ?? []).map(
        (reservation) => reservation.product_lot_id,
      );
      if (reservedLotIds.length > 0) {
        const { data: lotRows, error: lotRowsError } = await supabase
          .from('product_lots')
          .select('id, lot_number')
          .in('id', reservedLotIds);

        if (lotRowsError) {
          throw new Error('No fue posible consultar los lotes de masa apartados.');
        }

        const lotNumberById = new Map(
          (lotRows ?? []).map((lot) => [lot.id, lot.lot_number]),
        );
        reservedMassLots = (reservations ?? []).flatMap((reservation) => {
          const lotNumber = lotNumberById.get(reservation.product_lot_id);
          return lotNumber
            ? [{
                productLotId: reservation.product_lot_id,
                lotNumber,
                quantity: Number(reservation.reserved_quantity),
              }]
            : [];
        });
      }
    }
  }

  let stockRows: InventoryStockRow[] = [];
  if (ingredientIds.length > 0) {
    const { data } = await supabase
      .from('inventory_stock_by_item')
      .select(`
        item_id,
        quantity
      `)
      .eq('item_type', 'raw_material')
      .in('item_id', ingredientIds);

    stockRows = data ?? [];
  }

  const stockMap = stockRows.reduce<Record<string, number>>(
    (acc, row) => {
      if (row.item_id) {
        acc[row.item_id] =
          (acc[row.item_id] ?? 0) + Number(row.quantity ?? 0);
      }

      return acc;
    },
    {}
  );

  const materialMap = new Map(
    materials.map((material) => [material.id, material])
  );

  const canProduce =
    ingredients.every((item) => {
      if (item.product_id) {
        const available = massLots
          .filter((lot) => lot.product_id === item.product_id)
          .reduce((total, lot) => total + lot.quantity, 0);
        return available >= Number(item.planned_quantity);
      }
      if (!item.raw_material_id) return false;

      const required = Number(item.planned_quantity);

      const available =
        stockMap[item.raw_material_id] ?? 0;

      return available >= required;
    });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Orden de Producción
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {order.production_number}
          </p>
        </div>

        <Link
          href="/production-orders"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border p-6 space-y-4">
        <div>
          <div className="text-sm text-gray-500">
            Receta
          </div>
          <div className="font-semibold">
            {recipe?.name ?? '-'}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Rendimiento planeado
          </div>
          <div className="font-semibold">
            {order.planned_quantity}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Producido
          </div>
          <div className="font-semibold">
            {order.produced_quantity ?? 0}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">
            Estado
          </div>
          <div className="font-semibold">
            {getStatusLabel(order.production_status)}
          </div>
        </div>

        {order.notes ? (
          <div>
            <div className="text-sm text-gray-500">
              Notas
            </div>
            <div>{order.notes}</div>
          </div>
        ) : null}

        {recipe?.description ? (
          <div>
            <div className="text-sm text-gray-500">
              Descripción de receta
            </div>
            <div>{recipe.description}</div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Materia Prima Requerida
          </h2>

          {!canProduce && (
            <span className="text-sm font-medium text-red-600">
              Stock insuficiente para completar
            </span>
          )}
        </div>

        {ingredients?.length ? (
          <div className="space-y-3">
            {ingredients.map((item) => {
              const material = item.raw_material_id
                ? materialMap.get(item.raw_material_id)
                : undefined;
              const massProduct = item.product_id
                ? massProducts.find((product) => product.id === item.product_id)
                : undefined;

              const required = Number(item.planned_quantity);

              const available =
                item.raw_material_id
                  ? stockMap[item.raw_material_id] ?? 0
                  : massLots
                      .filter((lot) => lot.product_id === item.product_id)
                      .reduce((total, lot) => total + lot.quantity, 0);

              const enough = available >= required;

              return (
                <div
                  key={item.id}
                  className="rounded border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {material?.name ?? massProduct?.name ?? '-'}
                      </div>

                      <div className="text-sm text-gray-500">
                        {material?.internal_code ?? massProduct?.internal_code ?? '-'}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        enough
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {enough
                        ? 'Stock suficiente'
                        : 'Stock insuficiente'}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-gray-600 md:grid-cols-3">
                    <div>
                      Plan capturado: {item.planned_quantity} {item.product_id ? 'kg' : ''}
                    </div>

                    <div>
                      Requerido: {required} {item.product_id ? 'kg' : ''}
                    </div>

                    <div>
                      Disponible: {available} {item.product_id ? 'kg' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">
            Esta receta no tiene ingredientes.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {order.production_status === 'draft' && (
          <form
            action={releaseProductionOrder.bind(null, order.id)}
          >
            <input
              name="idempotency_key"
              type="hidden"
              value={crypto.randomUUID()}
            />

            <button
              type="submit"
              disabled={massProductIds.length > 0 && massLots.length === 0}
              className="rounded border px-4 py-2"
            >
              Liberar Orden
            </button>
          </form>
        )}

        {order.production_status === 'released' && (
          <form
            action={startProductionOrder.bind(null, order.id)}
            className="grid gap-3 rounded-xl border p-4"
          >
            {massProductIds.length > 0 && (
              <fieldset className="grid gap-3">
                <legend className="font-semibold">Pesar masa retirada por lote (kg)</legend>
                {massLots.length === 0 ? (
                  <p className="text-sm text-amber-700">
                    No hay lotes liberados y disponibles de esta variedad de masa.
                  </p>
                ) : massLots.map((lot) => {
                  const product = massProducts.find((row) => row.id === lot.product_id);
                  return (
                    <label key={lot.id} className="grid gap-1 text-sm">
                      <span>
                        {product?.name ?? 'Masa'} · lote {lot.lot_number} · disponible {lot.quantity} kg
                        {lot.location_name ? ` · ${lot.location_name}` : ''}
                      </span>
                      <input
                        name={`mass_lot_${lot.id}`}
                        type="number"
                        min="0"
                        max={lot.quantity}
                        step="0.0001"
                        inputMode="decimal"
                        className="rounded border px-3 py-2"
                      />
                    </label>
                  );
                })}
              </fieldset>
            )}
            <input
              name="idempotency_key"
              type="hidden"
              value={crypto.randomUUID()}
            />

            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              {massProductIds.length > 0 ? 'Pesar y apartar masa e iniciar' : 'Iniciar Producción'}
            </button>
          </form>
        )}

        {order.production_status === 'in_progress' && (
          <form
            action={completeProductionOrder.bind(
              null,
              order.id,
            )}
            className="grid gap-4 rounded-xl border p-4 md:grid-cols-2"
          >
            <label className="text-sm">
              Cantidad realmente producida
              <input
                name="produced_quantity"
                type="number"
                min="1"
                step="1"
                defaultValue={Number(
                  order.planned_quantity,
                )}
                required
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </label>

            {massProductIds.length > 0 && (
              <fieldset className="grid gap-3 rounded border p-3 md:col-span-2">
                <legend className="px-1 font-semibold">
                  Sobrante aprovechable por lote de masa (kg)
                </legend>
                {reservedMassLots.length === 0 ? (
                  <p className="text-sm text-red-700">
                    Esta orden no tiene lotes de masa apartados para cerrar.
                  </p>
                ) : reservedMassLots.map((lot) => (
                  <label key={lot.productLotId} className="text-sm">
                    Lote {lot.lotNumber}: retirado {lot.quantity.toFixed(4)} kg
                    <input
                      name={`mass_surplus_${lot.productLotId}`}
                      type="number"
                      min="0"
                      max={lot.quantity}
                      step="0.0001"
                      defaultValue="0"
                      required
                      className="mt-1 block w-full rounded border px-3 py-2"
                    />
                  </label>
                ))}
                <p className="text-xs text-gray-600">
                  El consumo de cada lote se calcula como peso retirado menos sobrante. El sobrante queda pendiente de destino y fuera del inventario disponible.
                </p>
              </fieldset>
            )}

            <label className="text-sm">
              Cantidad de merma
              <input
                name="waste_quantity"
                type="number"
                min="0"
                step="1"
                defaultValue={0}
                required
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </label>

            <label className="text-sm md:col-span-2">
              Motivo de la variación
              <textarea
                name="variance_reason"
                rows={3}
                maxLength={500}
                placeholder="Obligatorio cuando exista merma o sobreproducción"
                className="mt-1 block w-full rounded border px-3 py-2"
              />
              <span className="mt-1 block text-xs text-gray-500">
                Déjalo vacío únicamente cuando la producción coincida con el rendimiento planeado.
              </span>
            </label>

            <input
              name="idempotency_key"
              type="hidden"
              value={completionIdempotencyKey}
            />

            <button
              type="submit"
              disabled={massProductIds.length > 0 && reservedMassLots.length === 0}
              className="rounded border px-4 py-2 md:col-span-2"
            >
              Conciliar y completar producción
            </button>
          </form>
        )}

        {order.production_status !== 'completed' &&
          order.production_status !== 'cancelled' && (
            <form
              action={cancelProductionOrder.bind(null, order.id)}
              className="grid gap-3 rounded-xl border border-red-200 p-4"
            >
              <label className="text-sm">
                Motivo de cancelación
                <textarea
                  name="reason"
                  rows={3}
                  maxLength={500}
                  required
                  className="mt-1 block w-full rounded border px-3 py-2"
                  placeholder="Describe por qué se cancela la orden"
                />
              </label>

              <input
                name="idempotency_key"
                type="hidden"
                value={crypto.randomUUID()}
              />

              <button
                type="submit"
                className="rounded border border-red-300 px-4 py-2 text-red-700"
              >
                Cancelar
              </button>
            </form>
          )}

        <Link
          href={`/recipes/${order.recipe_id}/ingredients`}
          className="rounded border px-4 py-2"
        >
          Ver Ingredientes
        </Link>

        <Link
         href={`/production-orders/${order.id}/consumptions`}
         className="rounded border px-4 py-2"
        >
          Ver Consumos
       </Link>

        <Link
  href={`/lots/production/${order.id}`}
  className="rounded border px-4 py-2"
>
  Ver Trazabilidad
</Link>

        {order.production_status === 'completed' && (
          <ProductionCostForm
            productionOrderId={order.id}
            idempotencyKey={costSettlementIdempotencyKey}
            laborCost={Number(currentCost?.labor_cost ?? 0)}
            overheadCost={Number(currentCost?.overhead_cost ?? 0)}
          />
        )}

        {currentCost && (
          <Link href={`/production-costs/${order.id}`} className="rounded border px-4 py-2">
            Ver Costos
          </Link>
        )}

        {order.production_status === 'completed' && (
          <Link
            href={`/qa/create?production_order_id=${order.id}`}
            className="rounded border px-4 py-2"
          >
            Inspeccionar calidad
          </Link>
        )}
      </div>
    </main>
  );
}
