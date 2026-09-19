import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { requireRows } from '@/modules/core/application/critical-read';
import { rankInventoryAlerts } from '@/modules/inventory/application/inventory-alert-contract';
import { fetchInventoryAlerts } from '@/modules/inventory/application/inventory-alert-repository';
import { Card, CardContent } from '@/shared/ui/primitives/card';

type CatalogItem = { id: string; name: string; internal_code: string | null };
type StockRow = {
  item_type: 'product' | 'raw_material';
  item_id: string;
  quantity: number;
};

export default async function InventoryStockPage() {
  const supabase = await createTypedClient();
  const [stockResult, rawAlerts] = await Promise.all([
    supabase.from('inventory_stock_by_item').select('item_type, item_id, quantity'),
    fetchInventoryAlerts(supabase),
  ]);
  const stock = requireRows(stockResult, 'stock') as StockRow[];
  const alerts = rankInventoryAlerts(rawAlerts);
  const alertMap = new Map(alerts.map((alert) => [`${alert.item_type}:${alert.item_id}`, alert]));
  const productIds = stock.filter((row) => row.item_type === 'product').map((row) => row.item_id);
  const materialIds = stock.filter((row) => row.item_type === 'raw_material').map((row) => row.item_id);
  const [productsResult, materialsResult] = await Promise.all([
    productIds.length ? supabase.from('products').select('id, name, internal_code').in('id', productIds) : Promise.resolve({ data: [], error: null }),
    materialIds.length ? supabase.from('raw_materials').select('id, name, internal_code').in('id', materialIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const products = requireRows(productsResult, 'stock') as CatalogItem[];
  const materials = requireRows(materialsResult, 'stock') as CatalogItem[];
  const itemMap = new Map([...products, ...materials].map((item) => [item.id, item]));
  const orderedStock = [...stock].sort((left, right) => {
    const leftAlert = alertMap.has(`${left.item_type}:${left.item_id}`);
    const rightAlert = alertMap.has(`${right.item_type}:${right.item_id}`);
    if (leftAlert !== rightAlert) return leftAlert ? -1 : 1;
    return left.quantity - right.quantity;
  });
  const outOfStock = alerts.filter((alert) => alert.severity === 'out').length;

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Inventario</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Stock actual</h1>
        <p className="mt-1 text-sm text-brand-gray-75">Los faltantes y niveles por debajo del mínimo aparecen primero.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent><p className="text-sm text-brand-gray-50">Referencias</p><p className="mt-1 text-3xl font-black">{stock.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Bajo mínimo</p><p className="mt-1 text-3xl font-black text-amber-700">{alerts.length}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Agotados</p><p className="mt-1 text-3xl font-black text-red-700">{outOfStock}</p></CardContent></Card>
      </div>

      {orderedStock.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {orderedStock.map((row) => {
            const item = itemMap.get(row.item_id);
            const alert = alertMap.get(`${row.item_type}:${row.item_id}`);
            return (
              <Card key={`${row.item_type}:${row.item_id}`} className={alert ? 'border-amber-300' : ''}>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-brand-black">{item?.name ?? 'Artículo sin nombre'}</p>
                      <p className="text-sm text-brand-gray-50">{item?.internal_code ?? 'Sin código'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${row.item_type === 'raw_material' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                      {row.item_type === 'raw_material' ? 'Materia prima' : 'Producto'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between border-y border-brand-gray-25 py-3">
                    <div><span className="block text-xs text-brand-gray-50">Existencia</span><strong className="text-2xl">{row.quantity}</strong></div>
                    {alert ? <div className="text-right text-sm text-red-800"><strong>{alert.severity === 'out' ? 'Agotado' : 'Stock crítico'}</strong><span className="block">Faltan {alert.shortage} para el mínimo</span></div> : <span className="text-sm font-bold text-emerald-700">Nivel saludable</span>}
                  </div>
                  <Link href={`/inventory/kardex/${row.item_type}/${row.item_id}`} className="font-black text-brand-blue">Ver kardex →</Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card><CardContent><p className="py-8 text-center text-brand-gray-75">No hay existencias registradas.</p></CardContent></Card>
      )}
    </main>
  );
}
