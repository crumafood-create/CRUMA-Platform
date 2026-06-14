import { createClient } from '@/infrastructure/integrations/supabase/server';

export default async function InventoryStockPage() {
  const supabase = await createClient();

  const { data: stock, error: stockError } =
    await supabase
      .from('inventory_stock')
      .select('*')
      .order('quantity', {
        ascending: false,
      });

  if (stockError) {
    throw new Error(stockError.message);
  }

  const productIds =
    stock?.map((row) => row.product_id) ?? [];

  const { data: products, error: productsError } =
    await supabase
      .from('products')
      .select(`
        id,
        name,
        internal_code
      `)
      .in('id', productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productMap = new Map(
    (products ?? []).map((product) => [
      product.id,
      product,
    ]),
  );

  const rows = (stock ?? []).map((row) => ({
    quantity: row.quantity,
    product: productMap.get(row.product_id),
  }));

  return (
    <main className="space-y-6">
      <h1 className="text-4xl font-bold">
        Stock Actual
      </h1>

      <div className="rounded-2xl border p-6">
        {rows.length > 0 ? (
          <div className="space-y-3">
            {rows.map((item, index) => (
              <div
                key={item.product?.id ?? index}
                className="rounded border p-4"
              >
                <div className="font-semibold">
                  {item.product?.name}
                </div>

                <div className="text-sm text-gray-500">
                  {item.product?.internal_code}
                </div>

                <div className="mt-2 font-bold">
                  Stock: {item.quantity}
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
