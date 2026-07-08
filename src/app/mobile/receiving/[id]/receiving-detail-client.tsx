'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import MobileScanner from '@/app/mobile/components/mobile-scanner';

import {
  confirmReceiving,
  getReceivingDetail,
  getReceivingLocations,
  type InventoryLocation,
  type ReceivingDetail,
  type ReceivingItem,
} from './actions';

type Props = {
  purchaseOrderId: string;
};

type PageState =
  | 'loading'
  | 'ready'
  | 'error'
  | 'completed';

export default function ReceivingDetailClient({
  purchaseOrderId,
}: Props) {
  const [detail, setDetail] =
    useState<ReceivingDetail | null>(null);

  const [locations, setLocations] =
    useState<InventoryLocation[]>([]);

  const [pageState, setPageState] =
    useState<PageState>('loading');

  const [error, setError] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [lotNumber, setLotNumber] =
    useState('');

  const [expirationDate, setExpirationDate] =
    useState('');

  const [locationId, setLocationId] =
    useState('');

  async function load() {
    try {
      const [detailData, locationData] =
        await Promise.all([
          getReceivingDetail(
            purchaseOrderId,
          ),
          getReceivingLocations(),
        ]);

      setDetail(detailData);

      setLocations(locationData);

      setPageState('ready');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar recepción.',
      );

      setPageState('error');
    }
  }

  useEffect(() => {
    void load();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentItem =
    detail?.items.find(
      (item) =>
        item.received_quantity <
        item.quantity,
    ) ?? null;

  const completedItems =
    detail?.items.filter(
      (item) =>
        item.received_quantity >=
        item.quantity,
    ) ?? [];

  async function handleConfirm() {
    if (!currentItem) return;

    if (!lotNumber.trim()) {
      setError(
        'Escanee el lote.',
      );
      return;
    }

    if (!expirationDate) {
      setError(
        'Seleccione la fecha de caducidad.',
      );
      return;
    }

    if (!locationId) {
      setError(
        'Seleccione la ubicación.',
      );
      return;
    }

    try {
      setSaving(true);

      await confirmReceiving(
        currentItem.id,
        lotNumber,
        expirationDate,
        locationId,
      );

      setLotNumber('');
      setExpirationDate('');
      setLocationId('');

      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (pageState === 'loading') {
    return (
      <main className="p-6">
        <div className="text-center">
          Cargando recepción...
        </div>
      </main>
    );
  }

  if (
    pageState === 'error' ||
    !detail
  ) {
    return (
      <main className="p-6">
        <div className="rounded-xl border border-red-300 bg-red-50 p-6">
          {error}
        </div>
      </main>
    );
  }
