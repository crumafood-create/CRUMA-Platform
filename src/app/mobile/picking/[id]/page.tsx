'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import MobileScanner from '@/app/mobile/components/mobile-scanner';
import {
  confirmPicking,
  getPickingDetail,
  type PickingDetail,
  type PickingDetailItem,
} from './actions';

// ============================================================================
// TIPOS LOCALES
// ============================================================================

type PickingOrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En progreso';
    case 'completed':
      return 'Completado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getLineStatusClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-green-200 bg-green-50';
    case 'pending':
      return 'border-gray-200 bg-white';
    default:
      return 'border-blue-200 bg-blue-50';
  }
}

// ============================================================================
// PAGE
// ============================================================================

export default function MobilePickingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [detail, setDetail] = useState<PickingDetail>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [scannedLot, setScannedLot] = useState('');

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const currentItem = detail?.items.find((item) => item.status !== 'completed') ?? null;
  const completedItems = detail?.items.filter((item) => item.status === 'completed') ?? [];
  const totalCount = detail?.items.length ?? 0;
  const completedCount = completedItems.length;

  useEffect(() => {
    setScannedLot('');
  }, [currentItem?.id]);

  async function loadDetail() {
    setLoading(true);
    setGlobalError(null);

    try {
      const data = await getPickingDetail(params.id);
      setDetail(data);
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Error al cargar el picking',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPicking() {
    if (!currentItem) {
      return;
    }

    const code = scannedLot.trim();

    if (!code) {
      setGlobalError('Escanea o ingresa el número de lote');
      return;
    }

    setSaving(true);
    setGlobalError(null);

    try {
      await confirmPicking(
  currentItem.id,
  code,
);

setScannedLot('');
await loadDetail();
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Error al confirmar picking',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Picking</h1>
        <div className="rounded-2xl border bg-white p-6 text-gray-500">
          Cargando picking...
        </div>
        <div className="mt-6">
  <div className="mb-2 flex justify-between text-sm">
    <span>Progreso</span>
    <span>
      {completedCount}/{totalCount}
    </span>
  </div>

  <div className="h-3 rounded-full bg-gray-200">
    <div
      className="h-3 rounded-full bg-blue-600 transition-all duration-500"
      style={{
        width: `${progress}%`,
      }}
    />
  </div>
</div>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="space-y-6 p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Picking</h1>

          <Link
            href="/mobile/picking"
            className="rounded-lg border bg-gray-50 px-4 py-2 font-medium hover:bg-gray-100"
          >
            ← Volver
          </Link>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">
            No se encontró el picking.
          </p>
        </div>
      </main>
    );
  }
  const supabase =
  await createClient();

const {
  data: picking,
  error: pickingError,
} = await supabase
  .from('picking_orders')
  .select(`
    id,
    status,
    sales_order_id,
    created_at
  `)
  .eq(
    'id',
    params.id,
  )
  .single();

if (
  pickingError ||
  !picking
) {
  return (
    <main className="p-6">
      Picking no encontrado
    </main>
  );
}

const {
  data: items,
  error: itemsError,
} = await supabase
  .from(
    'picking_order_items',
  )
  .select(`
    id,
    product_id,
    quantity,
    picked_quantity,
    status,
    products (
      id,
      name
    )
  `)
  .eq(
    'picking_order_id',
    params.id,
  );

if (itemsError) {
  return (
    <main className="p-6">
      Error al cargar
      items de picking.
    </main>
  );
}
const pickingItems =
  await Promise.all(
    (items ?? []).map(
      async (
        item,
      ) => {
        const {
          data:
            suggestedLot,
        } =
          await supabase
            .from(
              'inventory_product_lots_fefo',
            )
            .select(`
              id,
              lot_number,
              quantity,
              location_name
            `)
            .eq(
              'product_id',
              item.product_id,
            )
            .limit(1)
            .maybeSingle();

        return {
          id: item.id,
          product_id:
            item.product_id,
          quantity_to_pick:
            Number(
              item.quantity,
            ),
          picked_quantity:
            Number(
              item.picked_quantity ??
                0,
            ),
          status:
            item.status,
          suggested_lot:
            suggestedLot ??
            undefined,
          product:
            Array.isArray(
              item.products,
            )
              ? item.products[0]
              : item.products,
        };
      },
    ),
  );
  
  const pickingStatus = detail.picking.status as PickingOrderStatus;
  const isCompleted = pickingStatus === 'completed';

  return (
    <main className="space-y-6 p-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Picking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pedido: {detail.picking.sales_order_id}
          </p>
        </div>

        <Link
          href="/mobile/picking"
          className="rounded-lg border bg-gray-50 px-4 py-2 font-medium hover:bg-gray-100"
        >
          ← Volver
        </Link>
      </div>

      <div className="flex items-center justify-between rounded-2xl border bg-white p-6">
        <div>
          <div className="text-sm font-medium text-gray-600">Estado</div>
          <div className="mt-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                pickingStatus,
              )}`}
            >
              {getStatusLabel(pickingStatus)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-medium text-gray-600">Progreso</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {completedCount}/{totalCount}
          </div>
        </div>
      </div>

      {globalError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="text-red-700">{globalError}</p>
        </div>
      )}

      {!isCompleted && currentItem ? (
        <PickingItemRow
          item={currentItem}
          scannedLot={scannedLot}
          setScannedLot={setScannedLot}
          onConfirm={handleConfirmPicking}
          isSaving={saving}
        />
      ) : (
        <div className="rounded-2xl border bg-green-50 p-6 text-green-800">
          <div className="text-lg font-semibold">✅ Picking completado</div>
          <p className="mt-2">
            Todas las líneas fueron surtidas. El pedido ya quedó en preparación.
          </p>
        </div>
      )}

      {completedItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Líneas completadas</h2>

          <div className="space-y-3">
            {completedItems.map((item) => (
              <CompletedItemRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

// ============================================================================
// COMPONENTES
// ============================================================================

type PickingItemRowProps = {
  item: PickingDetailItem;
  scannedLot: string;
  setScannedLot: (value: string) => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
};

function PickingItemRow({
  item,
  scannedLot,
  setScannedLot,
  onConfirm,
  isSaving,
}: PickingItemRowProps) {
  const suggested = item.suggested_lot;
  const product = item.product;

  return (
    <div className={`rounded-2xl border p-6 ${getLineStatusClass(item.status)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500">Producto</div>
          <div className="mt-1 text-xl font-semibold">
            {product?.name ?? 'Producto'}
          </div>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Pendiente
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="text-xs text-gray-500">Cantidad a pickear</div>
          <div className="mt-3 text-center">
  <div className="mt-2 text-4xl font-bold text-gray-900">
  {item.quantity}
</div>

<div className="text-sm text-gray-500">
  unidades
</div>
        </div>

        <div className="rounded-xl bg-blue-50 p-4">
          <div className="text-xs text-blue-700">Lote sugerido</div>
          <div className="mt-3 text-center">
  <div className="text-xs text-blue-700">
    LOTE A SURTIR
  </div>

  <div className="mt-2 rounded-xl bg-white p-4 text-3xl font-bold text-blue-900 shadow-sm">
    {suggested?.lot_number ?? 'SIN LOTE'}
  </div>
</div>

          <div className="mt-2 rounded-lg bg-blue-100 p-3">
  <div className="text-xs text-blue-700">
    SIGUIENTE UBICACIÓN
  </div>

  <div className="mt-1 text-lg font-bold text-blue-900">
    📍 {suggested?.location_name ?? 'Sin ubicación'}
  </div>
</div>

          <div className="mt-1 text-sm text-blue-700">
            Disponible: {suggested?.quantity ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Escanea el código de lote
        </label>

        <input
          type="text"
          value={scannedLot}
          onChange={(e) => setScannedLot(e.target.value)}
          placeholder="Apunta la cámara al código QR"
          className="w-full rounded-lg border border-gray-300 p-3 text-lg"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        <MobileScanner
          onDetected={(code) => {
            setScannedLot(code);
          }}
        />
      </div>

      <button
        onClick={onConfirm}
        disabled={isSaving}
        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
      >
        {isSaving ? 'Guardando...' : 'Confirmar Picking'}
      </button>
    </div>
  );
}

function CompletedItemRow({ item }: { item: PickingDetailItem }) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-green-700">Completado</div>
          <div className="mt-1 text-lg font-semibold text-green-900">
            {item.product?.name ?? 'Producto'}
          </div>
        </div>

        <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
          ✓
        </div>
      </div>

      <div className="mt-3 text-sm text-green-800">
        {item.quantity} unidades • Lote:{' '}
        {item.suggested_lot?.lot_number ?? item.lot_number ?? 'N/D'}
      </div>
    </div>
  );
}
