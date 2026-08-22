import type { PublicTableRow } from '@/infrastructure/integrations/supabase/database.types';
import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import { createInventoryMovement } from '../actions';

type ProductRow = Pick<PublicTableRow<'products'>, 'id' | 'name' | 'internal_code'>;
type WarehouseRow = Pick<PublicTableRow<'warehouses'>, 'id' | 'code' | 'name'>;

export default async function MovementsPage() {
  const supabase = await createTypedClient();

  const [
    { data: products, error: productsError },
    { data: warehouses, error: warehousesError },
    { data: movements, error: movementsError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, internal_code')
      .order('name'),

    supabase
      .from('warehouses')
      .select('id, code, name')
      .order('name'),

    supabase
      .from('inventory_movements')
      .select('id, product_id, warehouse_id, movement_type, quantity, notes, created_at')
      .order('created_at', { ascending: false }),
  ]);

  if (productsError) throw new Error(productsError.message);
  if (warehousesError) throw new Error(warehousesError.message);
  if (movementsError) throw new Error(movementsError.message);

  const productMap = new Map<string, ProductRow>(
    (products ?? []).map((product) => [product.id, product]),
  );

  const warehouseMap = new Map<string, WarehouseRow>(
    (warehouses ?? []).map((warehouse) => [warehouse.id, warehouse]),
  );

  const rows = (movements ?? []).map((movement) => ({
    ...movement,
    product: movement.product_id ? productMap.get(movement.product_id) ?? null : null,
    warehouse: movement.warehouse_id ? warehouseMap.get(movement.warehouse_id) ?? null : null,
  }));

  return (
    <main className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Movimientos de Inventario</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          action={createInventoryMovement}
          className="space-y-4 rounded-2xl border p-6"
        >
          <div>
            <label className="mb-2 block font-medium">Producto</label>
            <select
              name="product_id"
              required
              className="w-full rounded border p-3"
              defaultValue=""
            >
              <option value="">Seleccionar producto</option>
              {(products ?? []).map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Almacén</label>
            <select
              name="warehouse_id"
              required
              className="w-full rounded border p-3"
              defaultValue=""
            >
              <option value="">Seleccionar almacén</option>
              {(warehouses ?? []).map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Tipo de movimiento</label>
            <select
              name="movement_type"
              required
              className="w-full rounded border p-3"
              defaultValue="entry"
            >
              <option value="entry">Entrada</option>
              <option value="exit">Salida</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Cantidad</label>
            <input
              type="number"
              name="quantity"
              required
              min={1}
              className="w-full rounded border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Notas</label>
            <textarea
              name="notes"
              rows={3}
              className="w-full rounded border p-3"
              placeholder="Observaciones del movimiento"
            />
          </div>

          <button
            type="submit"
            className="rounded border px-6 py-2 font-medium"
          >
            Registrar Movimiento
          </button>
        </form>

        <div className="rounded-2xl border p-6">
          <h2 className="mb-4 text-xl font-semibold">Historial</h2>

          {rows.length > 0 ? (
            <div className="space-y-3">
              {rows.map((movement) => (
                <div key={movement.id} className="rounded border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">
                        {movement.product?.name ?? 'Producto sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {movement.product?.internal_code ?? '-'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-semibold">
                        {movement.movement_type === 'entry' ? 'Entrada' : 'Salida'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(movement.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1 text-sm">
                    <div>
                      <span className="font-medium">Almacén:</span>{' '}
                      {movement.warehouse?.name ?? '-'}
                    </div>

                    <div>
                      <span className="font-medium">Cantidad:</span>{' '}
                      {movement.quantity}
                    </div>

                    {movement.notes ? (
                      <div>
                        <span className="font-medium">Notas:</span>{' '}
                        {movement.notes}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay movimientos registrados.</p>
          )}
        </div>
      </div>
    </main>
  );
}
