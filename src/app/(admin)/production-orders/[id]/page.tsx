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

      <div className="flex flex-wrap gap-3">
        {order.status === 'draft' && (
          <form action={releaseProductionOrder.bind(null, order.id)}>
            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              Liberar Orden
            </button>
          </form>
        )}

        {order.status === 'released' && (
          <form action={startProductionOrder.bind(null, order.id)}>
            <button
              type="submit"
              className="rounded border px-4 py-2"
            >
              Iniciar Producción
            </button>
          </form>
        )}

        {order.status === 'in_progress' && (
          <form action={completeProductionOrder.bind(null, order.id)}>
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
            <form action={cancelProductionOrder.bind(null, order.id)}>
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
      </div>
    </main>
  );
}
