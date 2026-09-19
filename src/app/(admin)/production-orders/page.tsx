import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/modules/core/application/critical-read';
import { getProductionPriority } from '@/modules/production/application/production-priority';
import { Button } from '@/shared/ui/primitives/button';
import { Card, CardContent } from '@/shared/ui/primitives/card';

const toneClasses = {
  critical: 'bg-red-50 text-red-800',
  warning: 'bg-amber-50 text-amber-800',
  info: 'bg-blue-50 text-blue-800',
  success: 'bg-emerald-50 text-emerald-800',
} as const;

export default async function ProductionOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ priority?: string }>;
}) {
  const { priority: priorityFilter } = await searchParams;
  const supabase = await createTypedClient();
  const [ordersResult, recipesResult, forecastsResult] = await Promise.all([
    supabase.from('production_orders').select('id, production_number, recipe_id, planned_quantity, produced_quantity, production_status, planned_start_at, created_at').order('created_at', { ascending: false }),
    supabase.from('recipes').select('id, name').order('name'),
    supabase.from('demand_forecasts').select('product_id, suggested_production').gt('suggested_production', 0).order('suggested_production', { ascending: false }).limit(5),
  ]);
  const orders = requireRows(ordersResult, 'órdenes de producción');
  const recipes = requireRows(recipesResult, 'órdenes de producción');
  const forecasts = requireRows(forecastsResult, 'producción sugerida');
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe.name]));
  const prioritized = orders.map((order) => ({
    order,
    priority: getProductionPriority({
      status: order.production_status,
      plannedStartAt: order.planned_start_at,
      plannedQuantity: order.planned_quantity,
      producedQuantity: order.produced_quantity ?? 0,
    }),
  })).sort((left, right) => Number(right.priority.isDelayed) - Number(left.priority.isDelayed));
  const visible = priorityFilter === 'delayed'
    ? prioritized.filter((item) => item.priority.isDelayed)
    : prioritized;
  const delayed = prioritized.filter((item) => item.priority.isDelayed).length;
  const suggestedTotal = forecasts.reduce((total, forecast) => total + Number(forecast.suggested_production), 0);

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Operación</p>
          <h1 className="mt-2 text-3xl font-black text-brand-black">Producción</h1>
          <p className="mt-1 text-sm text-brand-gray-75">Órdenes atrasadas primero y avance visible por corrida.</p>
        </div>
        <Link href="/production-orders/new"><Button>Nueva orden</Button></Link>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent><p className="text-sm text-brand-gray-50">Órdenes abiertas</p><p className="mt-1 text-3xl font-black">{prioritized.filter((item) => !['completed', 'cancelled'].includes(item.order.production_status)).length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Con atraso</p><p className="mt-1 text-3xl font-black text-red-700">{delayed}</p><Link href="/production-orders?priority=delayed" className="mt-2 inline-block text-sm font-bold text-brand-blue">Mostrar atrasadas</Link></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Sugerencia vigente</p><p className="mt-1 text-3xl font-black">{suggestedTotal.toFixed(0)} pzas</p><Link href="/demand-forecasts" className="mt-2 inline-block text-sm font-bold text-brand-blue">Ver pronóstico</Link></CardContent></Card>
      </div>

      {priorityFilter === 'delayed' ? <div className="flex items-center justify-between rounded-xl bg-red-50 p-4 text-sm text-red-900"><strong>Mostrando únicamente órdenes atrasadas.</strong><Link href="/production-orders" className="font-black">Quitar filtro</Link></div> : null}

      {visible.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map(({ order, priority }) => (
            <Card key={order.id} className={priority.isDelayed ? 'border-red-300' : ''}>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="font-black text-brand-black">{order.production_number}</p><p className="text-sm text-brand-gray-75">{recipeMap.get(order.recipe_id) ?? 'Receta no disponible'}</p></div>
                  <span className={`rounded-full px-3 py-1 text-xs font-black ${toneClasses[priority.tone]}`}>{priority.label}</span>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-xs font-bold text-brand-gray-75"><span>Avance</span><span>{priority.progress}%</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-gray-25"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${priority.progress}%` }} /></div>
                  <p className="mt-2 text-xs text-brand-gray-50">{order.produced_quantity ?? 0} de {order.planned_quantity} piezas</p>
                </div>
                <div className="flex items-center justify-between border-t border-brand-gray-25 pt-4 text-sm">
                  <span>Inicio planeado: <strong>{order.planned_start_at ? order.planned_start_at.slice(0, 10) : 'Sin fecha'}</strong></span>
                  <Link href={`/production-orders/${order.id}`} className="font-black text-brand-blue">Ver orden →</Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent><p className="py-8 text-center text-brand-gray-75">No hay órdenes con este filtro.</p></CardContent></Card>
      )}
    </main>
  );
}
