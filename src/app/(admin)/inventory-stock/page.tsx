import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryStockPage() {
  const supabase = await createClient();

  const { data: stock } =
    await supabase
      .from('inventory_stock')
      .select(`
        quantity,
        products (
          name,
          internal_code
        )
      `);

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Stock Actual
      </h1>

      <div className="rounded-2xl border p-6">
        {stock?.length ? (
          <div className="space-y-3">
            {stock.map((item, index) => (
              <div
                key={index}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {item.products?.name}
                </div>

                <div className="text-sm text-gray-500">
                  {item.products?.internal_code}
                </div>

                <div className="mt-2 font-bold">
                  Stock:
                  {' '}
                  {item.quantity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay stock.</p>
        )}
      </div>
    </main>
  );
}
