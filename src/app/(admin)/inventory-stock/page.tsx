import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { loadInventoryStockView } from '@/modules/inventory/application/inventory-stock-repository';
import { Card, CardContent } from '@/shared/ui/primitives/card';

export default async function InventoryStockPage() {
  const supabase = await createTypedClient();
  const { items, summary } = await loadInventoryStockView(supabase);

  return (
    <main className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-blue">Inventario</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Stock actual</h1>
        <p className="mt-1 text-sm text-brand-gray-75">Los faltantes y niveles por debajo del mínimo aparecen primero.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent><p className="text-sm text-brand-gray-50">Referencias</p><p className="mt-1 text-3xl font-black">{summary.references}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Bajo mínimo</p><p className="mt-1 text-3xl font-black text-amber-700">{summary.critical}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-brand-gray-50">Agotados</p><p className="mt-1 text-3xl font-black text-red-700">{summary.outOfStock}</p></CardContent></Card>
      </div>

      {items.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <Card key={`${item.itemType}:${item.itemId}`} className={item.severity ? 'border-amber-300' : ''}>
              <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black text-brand-black">{item.name}</p>
                      <p className="text-sm text-brand-gray-50">{item.internalCode ?? 'Sin código'}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${item.itemType === 'raw_material' ? 'bg-amber-50 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                      {item.itemType === 'raw_material' ? 'Materia prima' : 'Producto'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between border-y border-brand-gray-25 py-3">
                    <div><span className="block text-xs text-brand-gray-50">Existencia</span><strong className="text-2xl">{item.quantity}</strong></div>
                    {item.severity ? <div className="text-right text-sm text-red-800"><strong>{item.severity === 'out' ? 'Agotado' : 'Stock crítico'}</strong><span className="block">Faltan {item.shortage} para el mínimo</span></div> : <span className="text-sm font-bold text-emerald-700">Nivel saludable</span>}
                  </div>
                  <Link href={`/inventory/kardex/${item.itemType}/${item.itemId}`} className="font-black text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">Ver kardex →</Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent><p className="py-8 text-center text-brand-gray-75">No hay existencias registradas.</p></CardContent></Card>
      )}
    </main>
  );
}
