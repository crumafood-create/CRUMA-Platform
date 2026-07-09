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
