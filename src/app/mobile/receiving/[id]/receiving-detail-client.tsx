'use client';

import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { MobileScanner } from '@/modules/warehouse/components/mobile-scanner';

import {
  confirmReceiving,
  getReceivingDetail,
  getReceivingLocations,
  type InventoryLocation,
  type ReceivingDetail,
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

      const [quantityReceived, setQuantityReceived] =
    useState('');

  const [deferredItemIds, setDeferredItemIds] =
    useState<string[]>([]);

  const [notice, setNotice] =
    useState<string | null>(null);

  const idempotencyKeyRef =
    useRef<string | null>(null);

  function resetReceivingAttempt(): void {
    idempotencyKeyRef.current = null;
    setError(null);
    setNotice(null);
  }

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

            const nextItem =
        detailData.items.find(
          (item) =>
            item.received_quantity <
            item.quantity && !deferredItemIds.includes(item.id),
        ) ?? null;

      setQuantityReceived(
        nextItem
          ? String(
              nextItem.quantity -
                nextItem.received_quantity,
            )
          : '',
      );

      idempotencyKeyRef.current = null;

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

  }, []);

  const currentItem =
    detail?.items.find(
      (item) =>
        item.received_quantity <
        item.quantity && !deferredItemIds.includes(item.id),
    ) ?? null;

      const pendingQuantity = currentItem
    ? currentItem.quantity -
      currentItem.received_quantity
    : 0;

  const completedItems =
    detail?.items.filter(
      (item) =>
        item.received_quantity >=
        item.quantity,
    ) ?? [];

    async function handleConfirm() {
    if (!currentItem) return;

    const parsedQuantity =
      Number(quantityReceived);

    if (
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      setError(
        'Ingrese una cantidad positiva.',
      );
      return;
    }

    if (parsedQuantity > pendingQuantity) {
      setError(
        `La cantidad no puede superar el pendiente de ${pendingQuantity}.`,
      );
      return;
    }

    if (
      currentItem.presentation_mode === 'sealed_package' &&
      Math.abs(
        parsedQuantity / currentItem.base_quantity_per_presentation -
          Math.round(parsedQuantity / currentItem.base_quantity_per_presentation),
      ) > 1e-8
    ) {
      setError('Solo se pueden aceptar presentaciones cerradas completas.');
      return;
    }

    if (!lotNumber.trim()) {
      setError('Escanee el lote.');
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

    const idempotencyKey =
      idempotencyKeyRef.current ??
      crypto.randomUUID();

    idempotencyKeyRef.current =
      idempotencyKey;

    try {
      setSaving(true);
      setError(null);

      await confirmReceiving({
        purchaseOrderItemId:
          currentItem.id,
        quantityReceived:
          parsedQuantity,
        lotNumber,
        expirationDate,
        inventoryLocationId:
          locationId,
        idempotencyKey,
      });

      idempotencyKeyRef.current = null;
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

  function rejectCurrentPresentation(): void {
    if (!currentItem || currentItem.presentation_mode !== 'sealed_package') return;
    setDeferredItemIds((current) => [...new Set([...current, currentItem.id])]);
    setQuantityReceived('');
    setLotNumber('');
    setExpirationDate('');
    setLocationId('');
    setError(null);
    setNotice('Presentación rechazada en esta sesión. La cantidad permanece pendiente y no se registró inventario.');
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

  const progress =
    detail.items.length === 0
      ? 0
      : Math.round(
          (completedItems.length / detail.items.length) * 100,
        );

  return (
    <main className="space-y-6 p-6 pb-24">
      {/* HEADER */}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Recepción
          </h1>

          <div className="mt-1 text-sm text-gray-500">
            OC {detail.purchaseOrder.order_number}
          </div>
        </div>

        <Link
          href="/mobile/receiving"
          className="rounded-lg border px-4 py-2"
        >
          ← Volver
        </Link>
      </div>

      {/* PROGRESO */}

      <div className="rounded-2xl border bg-white p-6">

        <div className="mb-4 flex items-center justify-between">

          <div>

            <div className="text-sm text-gray-500">
              Avance
            </div>

            <div className="text-3xl font-bold text-blue-700">
              {completedItems.length} / {detail.items.length}
            </div>

          </div>

          <div className="text-right">

            <div className="text-sm text-gray-500">
              Estado
            </div>

            <div className="font-semibold">
              {detail.purchaseOrder.status}
            </div>

          </div>

        </div>

        <div className="h-3 rounded-full bg-gray-200">

          <div
            className="h-3 rounded-full bg-green-600 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>

      {/* ERROR */}

      {error && (

        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">

          {error}

        </div>

      )}

      {notice ? (
        <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          {notice}
        </div>
      ) : null}

      {/* RECEPCIÓN TERMINADA */}

      {!currentItem && completedItems.length === detail.items.length && (

        <div className="rounded-2xl border border-green-200 bg-green-50 p-10 text-center">

          <div className="text-6xl">

            ✅

          </div>

          <div className="mt-4 text-2xl font-bold">

            Recepción completada

          </div>

          <p className="mt-2 text-green-700">

            Todos los materiales fueron recibidos.

          </p>

        </div>

      )}

      {!currentItem && completedItems.length < detail.items.length && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center text-amber-900">
          Hay presentaciones pendientes que no se aceptaron en esta sesión. No se creó inventario para esas cantidades.
        </div>
      )}

      {/* ITEM ACTUAL */}

      {currentItem && (

        <div className="rounded-2xl border bg-white p-6">

          <div className="text-sm text-gray-500">

            Materia Prima

          </div>

          <div className="mt-1 text-3xl font-bold">

            {currentItem.raw_material?.name}

          </div>

          <p className="mt-2 text-sm text-gray-600">
            {currentItem.presentation_mode === 'base_unit'
              ? `Compra directa en ${currentItem.base_unit_code}`
              : `${currentItem.purchase_quantity} presentaciones cerradas de ${currentItem.base_quantity_per_presentation} ${currentItem.base_unit_code} cada una`}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">

            <div className="rounded-xl bg-blue-50 p-6 text-center">

              <div className="text-xs uppercase text-blue-700">

                Esperado

              </div>

              <div className="mt-3 text-5xl font-bold text-blue-700">

                {currentItem.quantity} {currentItem.base_unit_code}

              </div>

            </div>

            <div className="rounded-xl bg-green-50 p-6 text-center">

              <div className="text-xs uppercase text-green-700">

                Recibido

              </div>

              <div className="mt-3 text-5xl font-bold text-green-700">

                {currentItem.received_quantity} {currentItem.base_unit_code}

              </div>

            </div>

          </div>

                              {/* CANTIDAD */}

          <div className="mt-8">
            <label className="block text-sm font-semibold text-gray-700">
              {currentItem.presentation_mode === 'sealed_package'
                ? `Cantidad aceptada (${currentItem.base_unit_code}; en paquetes completos)`
                : `Cantidad a recibir (${currentItem.base_unit_code})`}
            </label>

            <input
              type="number"
              min="0"
              max={pendingQuantity}
              step={currentItem.presentation_mode === 'sealed_package'
                ? currentItem.base_quantity_per_presentation
                : '0.0001'}
              value={quantityReceived}
              onChange={(event) => {
                setQuantityReceived(
                  event.target.value,
                );
                resetReceivingAttempt();
              }}
              className="mt-2 w-full rounded-xl border border-gray-300 p-4 text-lg"
            />

            <p className="mt-2 text-sm text-gray-500">
              Pendiente: {pendingQuantity} {currentItem.base_unit_code}
            </p>
          </div>

                    {/* LOTE */}

          <div className="mt-8">

            <label className="block text-sm font-semibold text-gray-700">
              Número de lote
            </label>

            <input
              type="text"
              value={lotNumber}
              onChange={(event) => {
              setLotNumber(event.target.value);
              resetReceivingAttempt();
              }}

              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleConfirm();
                }
              }}
              placeholder="Escanee el lote"
              className="mt-2 w-full rounded-xl border border-gray-300 p-4 text-lg"
              autoComplete="off"
              spellCheck={false}
            />

            <div className="mt-4">
              <MobileScanner
                onDetected={(code) => {
                  setLotNumber(code);
                  resetReceivingAttempt();
                }}

              />
            </div>

          </div>

          {/* FECHA */}

          <div className="mt-8">

            <label className="block text-sm font-semibold text-gray-700">
              Fecha de caducidad
            </label>

            <input
              type="date"
              value={expirationDate}
              onChange={(event) => {
              setExpirationDate(
               event.target.value,
            );
            resetReceivingAttempt();
          }}
              className="mt-2 w-full rounded-xl border border-gray-300 p-4"
            />

          </div>

          {/* UBICACIÓN */}

          <div className="mt-8">

            <label className="block text-sm font-semibold text-gray-700">
              Ubicación
            </label>

            <select
              value={locationId}
              onChange={(event) => {
                setLocationId(
                  event.target.value,
                );
                resetReceivingAttempt();
              }}

              className="mt-2 w-full rounded-xl border border-gray-300 p-4"
            >

              <option value="">
                Seleccione una ubicación
              </option>

              {locations.map(
                (location) => (
                  <option
                    key={location.id}
                    value={location.id}
                  >
                    {location.name}
                    {location.zone
                      ? ` (${location.zone})`
                      : ''}
                  </option>
                ),
              )}

            </select>

          </div>

          {/* BOTÓN */}

          <button
            type="button"
            onClick={() => {
              void handleConfirm();
            }}
            disabled={saving}
            className="mt-10 w-full rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white transition hover:bg-green-700 disabled:bg-gray-300"
          >
            {saving
              ? 'Guardando recepción...'
              : 'Confirmar recepción'}
          </button>

          {currentItem.presentation_mode === 'sealed_package' ? (
            <button
              type="button"
              onClick={rejectCurrentPresentation}
              disabled={saving}
              className="mt-3 w-full rounded-xl border border-red-300 px-6 py-3 font-semibold text-red-700"
            >
              Rechazar presentación y dejarla pendiente
            </button>
          ) : null}

        </div>

      )}

            {/* HISTORIAL */}

      {completedItems.length > 0 && (
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="mb-4 text-xl font-bold">
            Materiales recibidos
          </h2>

          <div className="space-y-3">
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4"
              >
                <div>
                  <div className="font-semibold">
                    {item.raw_material?.name}
                  </div>

                  <div className="mt-1 text-sm text-gray-500">
                    Cantidad recibida:{' '}
                    {item.received_quantity}
                  </div>

                  {item.suggested_location && (
                    <div className="mt-1 text-sm text-gray-500">
                      Ubicación:{' '}
                      {item.suggested_location.name}
                    </div>
                  )}
                </div>

                <div className="rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
                  ✓ Recibido
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESUMEN */}

      <div className="rounded-2xl border bg-gray-50 p-6">
        <div className="flex items-center justify-between">
          <span className="font-medium">
            Total de partidas
          </span>

          <span className="font-bold">
            {detail.items.length}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-medium">
            Partidas recibidas
          </span>

          <span className="font-bold text-green-700">
            {completedItems.length}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="font-medium">
            Pendientes
          </span>

          <span className="font-bold text-orange-600">
            {detail.items.length - completedItems.length}
          </span>
        </div>
      </div>

    </main>
  );
}
