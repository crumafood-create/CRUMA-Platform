'use client';

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
    detail?.items.length ?? 0;

  const completedCount =
    completedItems.length;

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
  status: ProductionOrderStatus;
};

function ProgressCard({
  completed,
  total,
  progress,
  status,
}: ProgressCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6">

      <div className="mb-4 flex items-center justify-between">

        <div>
          <div className="text-sm text-gray-500">
            Estado
          </div>

          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadge(
              status,
            )}`}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="text-right">

          <div className="text-sm text-gray-500">
            Avance
          </div>

          <div className="text-3xl font-bold text-blue-700">
            {completed}/{total}
          </div>

        </div>

      </div>

      <div className="mb-2 flex justify-between text-xs text-gray-500">

        <span>
          Progreso
        </span>

        <span>
          {progress}%
        </span>

      </div>

      <div className="h-3 rounded-full bg-gray-200">

        <div
          className="h-3 rounded-full bg-green-600 transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

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
