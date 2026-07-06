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
// TIPOS
// ============================================================================

type PickingOrderStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type PageState = 'loading' | 'error' | 'picking' | 'completed';

type Props = {
  pickingId: string;
};

// ============================================================================
// FUNCIONES AUXILIARES - ESTADO
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

function getItemCardClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'border-green-200 bg-green-50';
    case 'pending':
      return 'border-gray-200 bg-white';
    default:
      return 'border-blue-200 bg-blue-50';
  }
}

function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function MobilePickingDetailPage({
  pickingId,
}: Props) {
  const [detail, setDetail] = useState<PickingDetail | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [globalError, setGlobalError] = useState<string | null>(null);

  const [scannedLot, setScannedLot] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentItem =
    detail?.items.find((item) => item.status !== 'completed') ?? null;

  const completedItems =
    detail?.items.filter((item) => item.status === 'completed') ?? [];

  const totalItems = detail?.items.length ?? 0;
  const completedCount = completedItems.length;
  const progress = calculateProgress(completedCount, totalItems);
  const isPickingCompleted = completedCount === totalItems && totalItems > 0;

  async function loadDetail() {
    try {
      const data = await getPickingDetail(pickingId);
      setDetail(data);

      if (!data) {
        setPageState('error');
        return;
      }

      setPageState('picking');
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Error al cargar el picking',
      );
      setPageState('error');
    }
  }

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickingId]);

  useEffect(() => {
    setScannedLot('');
  }, [currentItem?.id]);

  async function handleConfirmPicking() {
    if (!currentItem) return;

    const code = scannedLot.trim();

    if (!code) {
      setGlobalError('Escanea o ingresa el número de lote');
      return;
    }

    setIsSaving(true);
    setGlobalError(null);

    try {
      await confirmPicking(currentItem.id, code);
      await loadDetail();
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Error al confirmar picking',
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (pageState === 'loading') {
    return <LoadingState />;
  }

  if (pageState === 'error' || !detail) {
    return <ErrorState error={globalError} />;
  }

  const pickingStatus = detail.picking.status as PickingOrderStatus;

  return (
    <main className="space-y-6 p-6 pb-20">
      <PageHeader
        orderId={detail.picking.sales_order_id}
        status={pickingStatus}
      />

      <ProgressBar
        completed={completedCount}
        total={totalItems}
        progress={progress}
        status={pickingStatus}
      />

      {globalError && <ErrorMessage message={globalError} />}

      {isPickingCompleted ? (
        <CompletedState />
      ) : currentItem ? (
        <PickingItemSection
          item={currentItem}
          scannedLot={scannedLot}
          onScannedLotChange={setScannedLot}
          onConfirm={handleConfirmPicking}
          isSaving={isSaving}
        />
      ) : null}

      {completedItems.length > 0 && (
        <CompletedItemsSection items={completedItems} />
      )}
    </main>
  );
}

// ============================================================================
// COMPONENTES - ENCABEZADO Y NAVEGACIÓN
// ============================================================================

type PageHeaderProps = {
  orderId: string;
  status: PickingOrderStatus;
};

function PageHeader({ orderId, status }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-4xl font-bold">Picking</h1>
        <p className="mt-1 text-sm text-gray-500">Pedido: {orderId}</p>
      </div>

      <Link
        href="/mobile/picking"
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
      >
        ← Volver
      </Link>
    </div>
  );
}

type ProgressBarProps = {
  completed: number;
  total: number;
  progress: number;
  status: PickingOrderStatus;
};

function ProgressBar({
  completed,
  total,
  progress,
  status,
}: ProgressBarProps) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-600">Estado</div>
          <div className="mt-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(
                status,
              )}`}
            >
              {getStatusLabel(status)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-medium text-gray-600">Progreso</div>
          <div className="mt-1 text-2xl font-bold text-blue-600">
            {completed}/{total}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Completado</span>
          <span>{progress}%</span>
        </div>

        <div className="h-3 rounded-full bg-gray-200">
          <div
            className="h-3 rounded-full bg-green-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
      <p className="font-medium text-red-900">⚠️ Error</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
    </div>
  );
}

// ============================================================================
// COMPONENTES - PICKING EN PROGRESO
// ============================================================================

type PickingItemSectionProps = {
  item: PickingDetailItem;
  scannedLot: string;
  onScannedLotChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
};

function PickingItemSection({
  item,
  scannedLot,
  onScannedLotChange,
  onConfirm,
  isSaving,
}: PickingItemSectionProps) {
  return (
    <div className={`rounded-2xl border p-6 ${getItemCardClass(item.status)}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-600">Producto</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {item.product?.name ?? 'Producto'}
          </div>
        </div>

        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Pendiente
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-white p-6 text-center">
          <div className="text-xs font-medium text-gray-600">
            Cantidad a Surtir
          </div>
          <div className="mt-4 text-5xl font-bold text-blue-600">
            {item.quantity}
          </div>
          <div className="mt-2 text-sm text-gray-500">unidades</div>
        </div>

        <div className="space-y-3 rounded-xl bg-blue-50 p-6">
          <div className="text-xs font-medium uppercase text-blue-700">
            Lote Sugerido
          </div>

          <div className="rounded-lg bg-white p-4 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-900">
              {item.suggested_lot?.lot_number ?? 'SIN LOTE'}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <div className="text-xs text-blue-700">📍 Ubicación</div>
              <div className="font-semibold text-blue-900">
                {item.suggested_lot?.location_name ?? 'Sin ubicación'}
              </div>
            </div>

            <div>
              <div className="text-xs text-blue-700">Disponible</div>
              <div className="font-semibold text-blue-900">
                {item.suggested_lot?.quantity ?? 0} unidades
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700">
            Escanea el código de lote
          </label>
          <input
            type="text"
            value={scannedLot}
            onChange={(e) => onScannedLotChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                onConfirm();
              }
            }}
            placeholder="Apunta la cámara al código QR"
            className="mt-2 w-full rounded-lg border border-gray-300 p-4 text-lg font-medium"
            disabled={isSaving}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
          />
        </div>

        <MobileScanner
          onDetected={(code) => {
            onScannedLotChange(code);
          }}
        />
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={isSaving || !scannedLot.trim()}
        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-4 font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Guardando...
          </span>
        ) : (
          'Confirmar Picking'
        )}
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENTES - PICKING COMPLETADO
// ============================================================================

function CompletedState() {
  return (
    <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">
      <div className="text-6xl">🎉</div>

      <h2 className="mt-4 text-3xl font-bold text-green-900">
        Picking Completado
      </h2>

      <p className="mt-3 text-green-700">
        Todos los productos fueron surtidos correctamente.
      </p>

      <p className="mt-2 text-sm text-green-600">
        El pedido ya pasó a la siguiente etapa de preparación.
      </p>

      <Link
        href="/mobile/picking"
        className="mt-6 inline-flex rounded-lg bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700"
      >
        Volver al Listado
      </Link>
    </div>
  );
}

function CompletedItemsSection({
  items,
}: {
  items: PickingDetailItem[];
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900">
        Items Completados ({items.length})
      </h2>

      <div className="space-y-3">
        {items.map((item) => (
          <CompletedItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function CompletedItemRow({ item }: { item: PickingDetailItem }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-green-900">✓</span>
            <span className="font-semibold text-green-900">
              {item.product?.name ?? 'Producto'}
            </span>
          </div>

          <div className="mt-2 text-sm text-green-700">
            <span>{item.quantity} unidades</span>
            <span className="mx-2">•</span>
            <span>
              Lote: {item.suggested_lot?.lot_number ?? item.picked_lot?.lot_number ?? 'N/D'}
            </span>
          </div>
        </div>

        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-bold text-green-800">
          ✓
        </span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-4xl font-bold">Picking</h1>

      <div className="space-y-4">
        <div className="rounded-2xl border bg-white p-6">
          <div className="mb-4 h-8 w-32 animate-pulse rounded-lg bg-gray-200"></div>
          <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-200"></div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="space-y-3">
            <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200"></div>
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-200"></div>
          </div>
        </div>
      </div>

      <p className="text-center text-gray-500">Cargando picking...</p>
    </main>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-4xl font-bold">Picking</h1>

        <Link
          href="/mobile/picking"
          className="rounded-lg border bg-gray-50 px-4 py-2 font-medium hover:bg-gray-100"
        >
          ← Volver
        </Link>
      </div>

      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
        <div className="text-4xl">❌</div>

        <h2 className="mt-4 text-2xl font-bold text-red-900">
          Error al Cargar el Picking
        </h2>

        <p className="mt-3 text-red-700">
          {error ?? 'No se pudo cargar el picking. Por favor, intenta de nuevo.'}
        </p>

        <Link
          href="/mobile/picking"
          className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-2 font-semibold text-white hover:bg-red-700"
        >
          Volver al Listado
        </Link>
      </div>
    </main>
  );
}
