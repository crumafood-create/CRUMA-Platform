"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';

import MobileScanner from '@/app/mobile/components/mobile-scanner';

import {
  confirmProductionItem,
  getProductionDetail,
  type ProductionOrderDetail,
  type ProductionOrderDetailItem,
} from './actions';

// ============================================================================
// TYPES
// ============================================================================

type PageState =
  | 'loading'
  | 'error'
  | 'production'
  | 'completed';

type Props = {
  productionOrderId: string;
};

type ProductionOrderStatus =
  | 'draft'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ============================================================================
// HELPERS
// ============================================================================

function getStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Borrador';

    case 'released':
      return 'Liberada';

    case 'in_progress':
      return 'En Producción';

    case 'completed':
      return 'Completada';

    case 'cancelled':
      return 'Cancelada';

    default:
      return status;
  }
}

function getStatusBadge(status: string): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-700';

    case 'released':
      return 'bg-blue-100 text-blue-700';

    case 'in_progress':
      return 'bg-orange-100 text-orange-700';

    case 'completed':
      return 'bg-green-100 text-green-700';

    case 'cancelled':
      return 'bg-red-100 text-red-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function calculateProgress(
  completed: number,
  total: number,
) {
  if (total === 0) {
    return 0;
  }

  return Math.round(
    (completed / total) * 100,
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function ProductionDetailClient({
  productionOrderId,
}: Props) {
  const [detail, setDetail] =
    useState<ProductionOrderDetail | null>(
      null,
    );

  const [pageState, setPageState] =
    useState<PageState>('loading');

  const [globalError, setGlobalError] =
    useState<string | null>(null);

  const [scannedLot, setScannedLot] =
    useState('');

  const [isSaving, setIsSaving] =
    useState(false);

  const currentItem =
    detail?.items.find(
      (item) =>
        item.status !== 'completed',
    ) ?? null;

  const completedItems =
    detail?.items.filter(
      (item) =>
        item.status === 'completed',
    ) ?? [];

  const totalItems =
  totalItemsCount(
    detail?.items ?? [],
  );
  const completedCount =
  completedItemsCount(
    detail?.items ?? [],
  );

  const progress =
    calculateProgress(
      completedCount,
      totalItems,
    );

  const completed =
    completedCount === totalItems &&
    totalItems > 0;

  // ============================================================================
  // LOAD DETAIL
  // ============================================================================

  async function loadDetail() {
    try {
      const data =
        await getProductionDetail(
          productionOrderId,
        );

      setDetail(data);

      if (!data) {
        setPageState('error');
        return;
      }

      setPageState('production');
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : 'Error al cargar la orden',
      );

      setPageState('error');
    }
  }

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    void loadDetail();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productionOrderId]);

  useEffect(() => {
    setScannedLot('');
  }, [currentItem?.id]);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  async function handleConfirmProduction() {
    if (isSaving) {
  return;
    }
    
    if (!currentItem) {
      return;
    }

    const code =
      scannedLot.trim();

    if (!code) {
      setGlobalError(
        'Escanea el lote.',
      );

      return;
    }

    setIsSaving(true);
    setGlobalError(null);

    try {
      await confirmProductionItem(
        currentItem.id,
        code,
      );

      await loadDetail();
      setScannedLot('');
    } catch (error) {
      setGlobalError(
        error instanceof Error
          ? error.message
          : 'Error al confirmar consumo',
      );
    } finally {
      setIsSaving(false);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (pageState === 'loading') {
    return <LoadingState />;
  }

  if (
    pageState === 'error' ||
    !detail
  ) {
    return (
      <ErrorState
        error={globalError}
      />
    );
  }

  const status =
    detail.order.status as ProductionOrderStatus;

  return (
    <main className="space-y-6 p-6 pb-24">

      <PageHeader
        orderNumber={
          detail.order.order_number
        }
        recipeName={
          detail.order.recipe_name
        }
        status={status}
      />

      <ProgressCard
        completed={
          completedCount
        }
        total={totalItems}
        progress={progress}
        status={status}
      />

      {globalError && (
        <ErrorMessage
          message={globalError}
        />
      )}

      {completed ? (
        <CompletedState />
      ) : currentItem ? (
        <ProductionItemSection
          item={currentItem}
          scannedLot={scannedLot}
          onScannedLotChange={
            setScannedLot
          }
          onConfirm={
            handleConfirmProduction
          }
          isSaving={isSaving}
        />
      ) : null}

      {completedItems.length >
        0 && (
        <CompletedItemsSection
          items={completedItems}
        />
      )}

    </main>
  );
}

// ============================================================================
// HEADER
// ============================================================================

type PageHeaderProps = {
  orderNumber: string;
  recipeName: string;
  status: ProductionOrderStatus;
};

function PageHeader({
  orderNumber,
  recipeName,
  status,
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-4xl font-bold">
          Producción
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Orden: {orderNumber}
        </p>

        <p className="text-sm text-gray-500">
          Receta: {recipeName}
        </p>
      </div>

      <div className="text-right">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
            status,
          )}`}
        >
          {getStatusLabel(status)}
        </span>

        <div className="mt-3">
          <Link
            href="/mobile/production"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            ← Volver
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PROGRESS
// ============================================================================

type ProgressCardProps = {
  completed: number;
  total: number;
  progress: number;
  status: string;
};

function ProgressCard({
  completed,
  total,
  progress,
  status,
}: ProgressCardProps) {
  const pending = total - completed;

  return (
    <div className="rounded-2xl border bg-white p-6">
      {/* Estado y avance numérico */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Estado</div>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
              status,
            )}`}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Avance</div>
          <div className="text-3xl font-bold text-blue-700">
            {completed}/{total}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="mb-2 flex justify-between text-xs text-gray-500">
        <span>Progreso</span>
        <span>{progress}%</span>
      </div>

      <div className="h-3 rounded-full bg-gray-200">
        <div
          className="h-3 rounded-full bg-green-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Estadísticas: fuera de la barra, como sección propia */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border p-4 text-center">
          <div className="text-xs text-gray-500">Ingredientes</div>
          <div className="text-2xl font-bold">{total}</div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <div className="text-xs text-green-700">Consumidos</div>
          <div className="text-2xl font-bold text-green-700">
            {completed}
          </div>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center">
          <div className="text-xs text-orange-700">Pendientes</div>
          <div className="text-2xl font-bold text-orange-700">
            {pending}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR
// ============================================================================

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">

      <div className="font-semibold text-red-800">
        Error
      </div>

      <p className="mt-2 text-sm text-red-700">
        {message}
      </p>

    </div>
  );
}

// ============================================================================
// PRODUCTION ITEM
// ============================================================================

type ProductionItemSectionProps = {
  item: ProductionOrderDetailItem;
  scannedLot: string;
  onScannedLotChange: (value: string) => void;
  onConfirm: () => Promise<void>;
  isSaving: boolean;
};

function ProductionItemSection({
  item,
  scannedLot,
  onScannedLotChange,
  onConfirm,
  isSaving,
}: ProductionItemSectionProps) {
  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-6">

      {/* ENCABEZADO */}

      <div className="flex items-start justify-between">

        <div>

          <div className="text-sm text-gray-500">
            Materia Prima
          </div>

          <div className="mt-1 text-2xl font-bold">
            {item.raw_material?.name ?? 'Materia Prima'}
          </div>

        </div>

        <span
  className={`rounded-full px-3 py-1 text-xs font-semibold ${
    item.status === 'completed'
      ? 'bg-green-100 text-green-700'
      : 'bg-orange-100 text-orange-700'
  }`}
>
  {item.status === 'completed'
    ? 'Completado'
    : 'Pendiente'}
</span>

      </div>

      {/* CANTIDAD */}

      <div className="mt-6 rounded-xl bg-blue-50 p-6 text-center">

        <div className="text-xs font-medium uppercase text-blue-700">
          Cantidad a Consumir
        </div>

        <div className="mt-3 text-5xl font-bold text-blue-700">
          {formatQuantity(
  item.planned_quantity,
)}
        </div>

      </div>

      {/* LOTE */}
<div className="mt-6">
  <label className="block text-sm font-semibold text-gray-700">
    Escanea el lote de la materia prima
  </label>

  <input
    type="text"
    value={scannedLot}
    onChange={(e) => onScannedLotChange(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        void onConfirm();
      }
    }}
    placeholder="Escanea el código QR o código de barras"
    className="mt-2 w-full rounded-lg border border-gray-300 p-4 text-lg"
    autoComplete="off"
    autoCorrect="off"
    autoCapitalize="off"
    spellCheck={false}
    disabled={isSaving}
    autoFocus
  />
</div>

{/* SCANNER */}
<div className="mt-6">
  {!isSaving && (
    <MobileScanner
      onDetected={(value) => {
        onScannedLotChange(value);
      }}
    />
  )}
</div>

      {/* BOTÓN */}

      <button
        type="button"
        onClick={() => void onConfirm()}
        disabled={
          isSaving ||
          !scannedLot.trim()
        }
        className="mt-6 w-full rounded-xl bg-green-600 px-4 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isSaving ? (
          <span className="flex items-center justify-center gap-2">

            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />

            Guardando...

          </span>
        ) : (
          'Confirmar Consumo'
        )}
      </button>

    </div>
  );
}

// ============================================================================
// COMPLETED STATE
// ============================================================================

function CompletedState() {
  return (
    <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-8 text-center">

      <div className="text-6xl">
        🎉
      </div>

      <h2 className="mt-4 text-3xl font-bold text-green-900">
        Producción Completada
      </h2>

      <p className="mt-3 text-green-700">
        Todos los ingredientes fueron consumidos correctamente.
      </p>

      <p className="mt-2 text-sm text-green-600">
        La orden quedó registrada y el producto terminado fue generado.
      </p>

      <Link
        href="/mobile/production"
        className="mt-6 inline-flex rounded-lg bg-green-600 px-8 py-3 font-bold text-white hover:bg-green-700"
      >
        Volver al Listado
      </Link>

    </div>
  );
}

// ============================================================================
// COMPLETED ITEMS
// ============================================================================

function CompletedItemsSection({
  items,
}: {
  items: ProductionOrderDetailItem[];
}) {
  return (
    <div className="space-y-4">

      <h2 className="text-lg font-bold text-gray-900">
        Ingredientes Consumidos ({items.length})
      </h2>

      <div className="space-y-3">

        {items.map((item) => (
          <CompletedItemRow
            key={item.id}
            item={item}
          />
        ))}

      </div>

    </div>
  );
}

// ============================================================================
// COMPLETED ITEM ROW
// ============================================================================

function CompletedItemRow({
  item,
}: {
  item: ProductionOrderDetailItem;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4">

      <div className="flex items-start justify-between">

        <div className="flex-1">

          <div className="flex items-center gap-2">

            <span className="text-lg font-bold text-green-700">
              ✓
            </span>

            <span className="font-semibold text-green-900">
              {item.raw_material?.name ?? 'Materia Prima'}
            </span>

          </div>

          <div className="mt-2 text-sm text-green-700">

            <span>
              Planeado: {formatQuantity(
  item.planned_quantity,
)}
            </span>

            <span className="mx-2">
              •
            </span>

            <span>
              Consumido: {formatQuantity(
  item.consumed_quantity,
)}
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

// ============================================================================
// LOADING
// ============================================================================

function LoadingState() {
  return (
    <main className="space-y-6 p-6">

      <h1 className="text-4xl font-bold">
        Producción
      </h1>

      <div className="space-y-4">

        <div className="rounded-2xl border bg-white p-6">

          <div className="mb-4 h-8 w-40 animate-pulse rounded-lg bg-gray-200" />

          <div className="h-6 w-64 animate-pulse rounded-lg bg-gray-200" />

        </div>

        <div className="rounded-2xl border bg-white p-6">

          <div className="space-y-3">

            <div className="h-4 w-full animate-pulse rounded-lg bg-gray-200" />

            <div className="h-4 w-4/5 animate-pulse rounded-lg bg-gray-200" />

            <div className="h-4 w-3/5 animate-pulse rounded-lg bg-gray-200" />

          </div>

        </div>

      </div>

      <p className="text-center text-gray-500">
        Cargando orden de producción...
      </p>

    </main>
  );
}

// ============================================================================
// ERROR
// ============================================================================

function ErrorState({
  error,
}: {
  error: string | null;
}) {
  return (
    <main className="space-y-6 p-6">

      <div className="flex items-center justify-between">

        <h1 className="text-4xl font-bold">
          Producción
        </h1>

        <Link
          href="/mobile/production"
          className="rounded-lg border bg-gray-50 px-4 py-2 font-medium hover:bg-gray-100"
        >
          ← Volver
        </Link>

      </div>

      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">

        <div className="text-5xl">
          ❌
        </div>

        <h2 className="mt-4 text-2xl font-bold text-red-900">
          Error al cargar la producción
        </h2>

        <p className="mt-3 text-red-700">
          {error ??
            'No fue posible cargar la orden de producción.'}
        </p>

        <Link
          href="/mobile/production"
          className="mt-6 inline-flex rounded-lg bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
        >
          Volver al listado
        </Link>

      </div>

    </main>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function isCompleted(
  item: ProductionOrderDetailItem,
) {
  return item.status === 'completed';
}

function pendingItems(
  items: ProductionOrderDetailItem[],
) {
  return items.filter(
    (item) => !isCompleted(item),
  );
}

function completedItemsCount(
  items: ProductionOrderDetailItem[],
) {
  return items.filter(
    isCompleted,
  ).length;
}

function totalItemsCount(
  items: ProductionOrderDetailItem[],
) {
  return items.length;
}

function formatQuantity(
  quantity: number,
) {
  return new Intl.NumberFormat(
    'es-MX',
    {
      maximumFractionDigits: 2,
    },
  ).format(quantity);
}
