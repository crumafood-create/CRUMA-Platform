import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryAlertsPage() {
  const supabase = await createClient();

  const { data: products } =
    await supabase
      .from('products')
      .select(`
        id,
        name,
        min_stock,
        inventory_stock (
          quantity
        )
      `)
      .is('deleted_at', null);

  const alerts =
    products?.filter(product => {
      const stock =
        product.inventory_stock?.reduce(
          (sum: number, item: any) =>
            sum + item.quantity,
          0
        ) ?? 0;

      return stock <= product.min_stock;
    }) ?? [];

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Alertas de Inventario
      </h1>

      <div className="space-y-3">
        {alerts.length ? (
          alerts.map(product => (
            <div
              key={product.id}
              className="rounded-xl border border-red-500 bg-red-50 p-4"
            >
              <div className="font-semibold">
                {product.name}
              </div>

              <div className="text-red-700">
                Stock por debajo del mínimo
              </div>
            </div>
          ))
        ) : (
          <p>
            No hay alertas.
          </p>
        )}
      </div>
    </main>
  );
}
