import Link from 'next/link';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';

import StorageConditionsClient, { type StorageLot, type PendingFreezing } from './storage-conditions-client';

type StorageReadClient = {
  rpc: (
    name: string,
    args?: Record<string, string>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
};

export default async function ProductStorageConditionsPage() {
  const supabase = await createTypedClient();
  const { data: lots, error } = await supabase.from('product_lots').select(`
    id, product_id, lot_number, expiration_date, quantity, status,
    inventory_locations(name)
  `).order('created_at', { ascending: true });
  if (error) throw new Error('No fue posible cargar los lotes de producto.');

  const client = supabase as unknown as StorageReadClient;
  const productIds = [...new Set((lots ?? []).map((lot) => lot.product_id))];
  const { data: products, error: productsError } = productIds.length
    ? await supabase.from('products').select('id, name, preparation_types(name)').in('id', productIds)
    : { data: [], error: null };
  if (productsError) throw new Error('No fue posible consultar las preparaciones de producto.');
  const productById = new Map((products ?? []).map((product) => {
    const preparation = Array.isArray(product.preparation_types)
      ? product.preparation_types[0] : product.preparation_types;
    return [product.id, { name: product.name, isRaw: preparation?.name.trim().toLocaleLowerCase('es-MX') === 'crudo' }];
  }));
  const freezerLocationsResult = await supabase.from('inventory_locations')
    .select('id, name')
    .eq('location_use', 'finished_product')
    .eq('storage_condition', 'frozen')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');
  if (freezerLocationsResult.error) throw new Error('No fue posible consultar el congelador configurado.');

  const balances = await Promise.all(productIds.map(async (productId) => {
    const result = await client.rpc('get_product_lot_storage_balances', {
      p_product_id: productId,
    });
    if (result.error) throw new Error(result.error.message);
    const productName = productById.get(productId)?.name ?? '-';
    const tracked = ((result.data ?? []) as Omit<StorageLot, 'product_name'>[]).map((row) => ({
      ...row,
      product_name: productName,
    }));
    if (tracked.length || !productById.get(productId)?.isRaw) return tracked;
    return (lots ?? []).filter((lot) =>
      lot.product_id === productId
      && lot.status === 'available'
      && Number(lot.quantity) > 0
      && (!lot.expiration_date || lot.expiration_date >= new Date().toISOString().slice(0, 10))
    ).map((lot) => {
      const location = Array.isArray(lot.inventory_locations)
        ? lot.inventory_locations[0] : lot.inventory_locations;
      const quantity = Number(lot.quantity);
      return {
        product_lot_id: lot.id,
        lot_number: lot.lot_number,
        expiration_date: lot.expiration_date,
        location_name: location?.name ?? null,
        lot_quantity: quantity,
        fresh_quantity: quantity,
        raw_frozen_quantity: 0,
        freezing_quantity: 0,
        refrigerated_wait_quantity: 0,
        quality_waste_quantity: 0,
        refrigerated_wait_location_name: null,
        freezing_location_name: null,
        frozen_location_name: null,
        quality_sampling_pending_quantity: 0,
        quality_sampling_reserved_quantity: 0,
        product_name: productName,
      };
    });
  }));
  const pendingResult = await client.rpc('get_pending_product_lot_freezing_operations');
  if (pendingResult.error) throw new Error(pendingResult.error.message);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Condición de almacenamiento</h1>
          <p className="text-sm text-gray-600">Saldos frescos, crudos congelados y piezas apartadas por lote.</p>
        </div>
        <Link className="rounded border px-4 py-2" href="/lots">Volver a lotes</Link>
      </div>
      <StorageConditionsClient
        lots={balances.flat()}
        pending={pendingResult.data as PendingFreezing[] ?? []}
        freezerLocations={freezerLocationsResult.data ?? []}
      />
    </main>
  );
}
