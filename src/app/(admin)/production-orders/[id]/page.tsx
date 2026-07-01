import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  releaseProductionOrder,
  startProductionOrder,
  completeProductionOrder,
  cancelProductionOrder,
} from '../actions';

type ProductionOrder = {
  id: string;
  order_number: string;
  recipe_id: string;
  planned_quantity: number;
  produced_quantity: number | null;
  status: string;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

type Recipe = {
  id: string;
  name: string;
  description: string | null;
};

type RecipeItem = {
  id: string;
  ingredient_id: string;
  quantity: number;
};

type RawMaterial = {
  id: string;
  name: string;
  internal_code: string | null;
};

type InventoryStockRow = {
  item_id: string;
  quantity: number | null;
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
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('production_orders')
    .select(
      'id, order_number, recipe_id, planned_quantity, produced_quantity, status, notes, started_at, completed_at, created_at'
    )
    .eq('id', id)
    .single();

  if (!order) {
    notFound();
  }

  const { data: recipe } = await supabase
    .from('recipes')
    .select('id, name, description')
    .eq('id', order.recipe_id)
    .single();

  const { data: ingredients } = await supabase
    .from('recipe_items')
    .select('id, ingredient_id, quantity')
    .eq('recipe_id', order.recipe_id)
    .order('created_at', { ascending: true });

  const ingredientIds =
    (ingredients ?? []).map((item: RecipeItem) => item.ingredient_id);

  let materials: RawMaterial[] = [];
  if (ingredientIds.length > 0) {
    const { data } = await supabase
      .from('raw_materials')
      .select('id, name, internal_code')
      .in('id', ingredientIds);

    materials = (data ?? []) as RawMaterial[];
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

    stockRows = (data ?? []) as InventoryStockRow[];
  }

  const stockMap = stockRows.reduce<Record<string, number>>(
    (acc, row) => {
      acc[row.item_id] =
        (acc[row.item_id] ?? 0) + Number(row.quantity ?? 0);

      return acc;
    },
    {}
  );

  const materialMap = new Map(
    materials.map((material) => [material.id, material])
  );

  const canProduce =
    (ingredients ?? []).every((item: RecipeItem) => {
      const required =
        Number(item.quantity) * Number(order.planned_quantity);

      const available =
        stockMap[item.ingredient_id] ?? 0;

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
            {order.order_number}
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
            {getStatusLabel(order.status)}
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
            {ingredients.map((item: RecipeItem) => {
              const material =
                materialMap.get(item.ingredient_id);

              const required =
                Number(item.quantity) *
                Number(order.planned_quantity);

              const available =
                stockMap[item.ingredient_id] ?? 0;

              const enough = available >= required;

              return (
                <div
                  key={item.id}
                  className="rounded border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">
                        {material?.name ?? '-'}
                      </div>

                      <div className="text-sm text-gray-500">
                        {material?.internal_code ?? '-'}
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
                      Fórmula: {item.quantity}
                    </div>

                    <div>
                      Requerido: {required}
                    </div>

                    <div>
                      Disponible: {available}
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
        {order.status === 'draft' && (
          <form
            action={releaseProductionOrder.bind(null, order.id)}
          >
            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              Liberar Orden
            </button>
          </form>
        )}

        {order.status === 'released' && (
          <form
            action={startProductionOrder.bind(null, order.id)}
          >
            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              Iniciar Producción
            </button>
          </form>
        )}

        {order.status === 'in_progress' && (
          <form
            action={completeProductionOrder.bind(null, order.id)}
          >
            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              Completar Producción
            </button>
          </form>
        )}

        {order.status !== 'completed' &&
          order.status !== 'cancelled' && (
            <form
              action={cancelProductionOrder.bind(null, order.id)}
            >
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
      </div>
    </main>
  );
}
