import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PurchaseOrderItemForm } from '@/modules/procurement/components/forms/purchase-order-item-form';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import {
  createPurchaseOrderItem,
  deletePurchaseOrderItem,
  updatePurchaseOrderItem,
} from './actions';

type PurchaseOrderItemView = {
  id: string;
  raw_material_id: string;
  quantity: number;
  received_quantity: number;
  unit_cost: number;
  total: number;
  presentation_mode: 'base_unit' | 'sealed_package';
  purchase_quantity: number;
  base_quantity_per_presentation: number;
  purchase_unit_price: number;
  raw_material: {
    name: string;
    unit_of_measure: { code: string } | null;
  } | null;
};

type PurchaseOrderItemReader = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{
        data: PurchaseOrderItemView[] | null;
        error: { message: string } | null;
      }>;
    };
  };
};

export default async function PurchaseOrderItemsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ rawMaterialId?: string }>;
}) {
  const [{ id }, { rawMaterialId }] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({ rawMaterialId: undefined }),
  ]);
  const supabase = await createTypedClient();
  const [{ data: order }, { data: materials }, { data: items }] = await Promise.all([
    supabase.from('purchase_orders').select('id, status').eq('id', id).is('deleted_at', null).maybeSingle(),
    supabase
      .from('raw_materials')
      .select('id, name, internal_code, unit_of_measure:units_of_measure!raw_materials_unit_of_measure_id_fkey(code)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
    (supabase as unknown as PurchaseOrderItemReader)
      .from('purchase_order_items')
      .select('id, raw_material_id, quantity, received_quantity, unit_cost, total, presentation_mode, purchase_quantity, base_quantity_per_presentation, purchase_unit_price, raw_material:raw_materials!purchase_order_items_raw_material_id_fkey(name, unit_of_measure:units_of_measure!raw_materials_unit_of_measure_id_fkey(code))')
      .eq('purchase_order_id', id),
  ]);
  const { data: { user } } = await supabase.auth.getUser();
  if (!order) notFound();

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Renglones de compra</h1>
        <div className="flex gap-2">
          {order.status === 'draft' ? (
            <Link
              href={`/raw-materials/new?returnToPurchaseOrderId=${order.id}`}
              className="rounded border px-4 py-2"
            >
              Crear materia prima
            </Link>
          ) : null}
          <Link href={`/purchase-orders/${id}`} className="rounded border px-4 py-2">Volver</Link>
        </div>
      </header>
      {order.status === 'draft' ? (
        <PurchaseOrderItemForm
          action={createPurchaseOrderItem}
          purchaseOrderId={order.id}
          userId={user?.id}
          materials={(materials ?? []).map((material) => ({
            ...material,
            base_unit_label: material.unit_of_measure?.code ?? 'unidad base',
          }))}
          initialMaterialId={
            materials?.some((material) => material.id === rawMaterialId)
              ? rawMaterialId
              : undefined
          }
        />
      ) : null}
      <section className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-semibold">Artículos</h2>
        {items?.length ? (
          <div className="space-y-3">
          {items.map((item) => (
              <article key={item.id} className="rounded border p-4">
                <div className="font-semibold">{item.raw_material?.name ?? 'Materia prima'}</div>
                <div>Pedido: {item.quantity} {item.raw_material?.unit_of_measure?.code ?? 'unidad base'}</div>
                <div>Recibido: {item.received_quantity} {item.raw_material?.unit_of_measure?.code ?? 'unidad base'}</div>
                <div>Presentación: {item.presentation_mode === 'base_unit'
                  ? `${item.purchase_quantity} ${item.raw_material?.unit_of_measure?.code ?? 'unidad base'}`
                  : `${item.purchase_quantity} × ${item.base_quantity_per_presentation} ${item.raw_material?.unit_of_measure?.code ?? 'unidad base'}`}</div>
                <div>Precio por presentación: ${Number(item.purchase_unit_price).toFixed(4)} MXN</div>
                <div>Costo equivalente: ${Number(item.unit_cost).toFixed(4)} MXN/{item.raw_material?.unit_of_measure?.code ?? 'unidad base'}</div>
                <div className="font-semibold">Importe del producto: ${Number(item.total).toFixed(4)} MXN</div>
                {order.status === 'draft' ? (
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <form action={updatePurchaseOrderItem.bind(null, item.id)} className="flex flex-wrap items-end gap-3">
                      <input type="hidden" name="purchase_order_id" value={order.id} />
                      <label className="grid gap-1 text-sm">
                        Presentación
                        <select name="presentation_mode" defaultValue={item.presentation_mode} className="rounded border p-2">
                          <option value="base_unit">Unidad base</option>
                          <option value="sealed_package">Presentación cerrada</option>
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm">
                        Cantidad
                        <input name="quantity" type="number" min="0.0001" step="0.0001" defaultValue={item.purchase_quantity} required className="w-32 rounded border p-2" />
                      </label>
                      <label className="grid gap-1 text-sm">
                        Contenido por presentación ({item.raw_material?.unit_of_measure?.code ?? 'unidad base'}; 1 para compra directa)
                        <input name="base_quantity_per_presentation" type="number" min="0.0001" step="0.0001" defaultValue={item.base_quantity_per_presentation} required className="w-32 rounded border p-2" />
                      </label>
                      <label className="grid gap-1 text-sm">
                        Precio por presentación (MXN)
                        <input name="unit_cost" type="number" min="0" step="0.0001" defaultValue={item.purchase_unit_price} required className="w-32 rounded border p-2" />
                      </label>
                      <button type="submit" className="rounded border px-4 py-2">Guardar cambios</button>
                    </form>
                    <form action={deletePurchaseOrderItem.bind(null, item.id, order.id)}>
                      <button type="submit" className="rounded border border-red-300 px-4 py-2 text-red-700">Retirar renglón</button>
                    </form>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : <p>No hay artículos.</p>}
      </section>
    </main>
  );
}
