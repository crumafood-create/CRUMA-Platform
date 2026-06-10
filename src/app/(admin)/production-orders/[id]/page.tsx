import { notFound } from 'next/navigation';

import { createClient } from '@/infrastructure/integrations/supabase/server';

import {
  startProductionOrder,
  completeProductionOrder,
} from '../actions';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProductionOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Orden con receta y producto
  const { data: order } = await supabase
    .from('production_orders')
    .select(`
      *,
      recipes (
        id,
        products ( id, name )
      )
    `)
    .eq('id', id)
    .single();

  if (!order) notFound();

  // 2. Ingredientes de la receta
  const { data: ingredients } = await supabase
    .from('recipe_items')
    .select(`
      *,
      products!recipe_items_ingredient_id_fkey ( id, name )
    `)
    .eq('recipe_id', order.recipe_id);

  // 3. Stock de todos los ingredientes — una sola query
  const ingredientIds = (ingredients ?? []).map((item) => item.ingredient_id);

  const { data: stockRows } = ingredientIds.length > 0
    ? await supabase
        .from('inventory_stock')
        .select('product_id, quantity')
        .in('product_id', ingredientIds)
    : { data: [] };

  // 4. Mapa productId → stock total disponible
  const stockMap = (stockRows ?? []).reduce<Record<string, number>>((acc, row) => {
    acc[row.product_id] = (acc[row.product_id] ?? 0) + Number(row.quantity);
    return acc;
  }, {});

  // 5. ¿Hay stock suficiente para todos los ingredientes?
  const canProduce = (ingredients ?? []).every((item) => {
    const required  = Number(item.quantity) * Number(order.quantity);
    const available = stockMap[item.ingredient_id] ?? 0;
    return available >= required;
  });

  return (
    <main className="space-y-6">

      {/* ENCABEZADO + ACCIONES */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Orden de Producción</h1>

        <div className="flex gap-3">
          {order.status === 'draft' && (
            <form action={startProductionOrder.bind(null, order.id)}>
              <button className="rounded border px-4 py-2">
                Iniciar Producción
              </button>
            </form>
          )}

          {order.status === 'in_progress' && canProduce && (
            <form action={completeProductionOrder.bind(null, order.id)}>
              <button className="rounded border px-4 py-2">
                Finalizar Producción
              </button>
            </form>
          )}
        </div>
      </div>

      {/* DETALLE DE LA ORDEN */}
      <div className="rounded-2xl border p-6">
        <h2 className="text-2xl font-semibold">
          {order.recipes?.products?.name}
        </h2>
        <p>Cantidad: {order.quantity}</p>
        <p>Estado: {order.status}</p>
      </div>

      {/* MATERIA PRIMA */}
      <div className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Materia Prima Requerida</h2>

        {ingredients?.length ? (
          <div className="space-y-3">
            {ingredients.map((item) => {
              const required  = Number(item.quantity) * Number(order.quantity);
              const available = stockMap[item.ingredient_id] ?? 0;
              const enough    = available >= required;

              return (
                <div key={item.id} className="rounded border p-3">
                  <div className="font-medium">{item.products?.name}</div>
                  <div className="text-sm text-gray-500">
                    Fórmula: {item.quantity}
                  </div>
                  <div className="font-semibold">Requerido: {required}</div>
                  <div>Disponible: {available}</div>
                  <div className={enough ? 'text-green-600' : 'text-red-600'}>
                    {enough ? 'Stock suficiente' : 'Stock insuficiente'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p>Esta receta no tiene ingredientes.</p>
        )}
      </div>

    </main>
  );
}
