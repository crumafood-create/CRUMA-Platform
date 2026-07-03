'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import MobileScanner from '@/app/mobile/components/mobile-scanner';
import { confirmPicking } from './actions';

// ============================================================================
// TIPOS
// ============================================================================

type PickingOrder = {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  sales_order_id: string;
  created_at: string;
};

type PickingItem = {
  id: string;
  product_id: string;
  quantity_to_pick: number;
  suggested_lot?: {
    id: string;
    lot_number: string;
    quantity: number;
    location_name: string;
  };
  product?: {
    id: string;
    name: string;
  };
};

type PickingConfirmation = {
  picking_item_id: string;
  lot_id: string;
  scanned_lot_number: string;
  quantity_picked: number;
};

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

// ============================================================================
// COMPONENTE DE ÍTEM
// ============================================================================

type PickingItemRowProps = {
  item: PickingItem;
  onConfirm: (confirmation: PickingConfirmation) => Promise<void>;
  isLoading: boolean;
};

function PickingItemRow({
  item,
  onConfirm,
  isLoading,
}: PickingItemRowProps) {
  const [scannedLot, setScannedLot] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = item.suggested_lot;
  const product = item.product;

  async function handleConfirmPicking() {
    setError(null);
    setIsValidating(true);

    try {
      if (!scannedLot.trim()) {
        throw new Error('Escanea o ingresa el número de lote');
      }

      if (!suggested) {
        throw new Error('No hay lote sugerido para este item');
      }

      if (scannedLot.trim() !== suggested.lot_number) {
        throw new Error(
          `Lote incorrecto. Esperado: ${suggested.lot_number}, Escaneado: ${scannedLot}`,
        );
      }

      await onConfirm({
        picking_item_id: item.id,
        lot_id: suggested.id,
        scanned_lot_number: scannedLot.trim(),
        quantity_picked: item.quantity_to_pick,
      });

      setScannedLot('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar picking');
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="space-y-3">
        <div>
          <div className="text-sm font-medium text-gray-600">Producto</div>
          <div className="mt-1 text-lg font-semibold">{product?.name ?? '-'}</div>
        </div>

        <div>
          <div className="text-sm font-medium text-gray-600">Cantidad a pickear</div>
          <div className="mt-1 text-lg font-semibold">
            {item.quantity_to_pick} unidades
          </div>
        </div>
      </div>

      {suggested && (
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <div className="text-sm font-medium text-blue-900">Lote Sugerido</div>

          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Lote:</span>
              <span className="font-semibold text-blue-900">
                {suggested.lot_number}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-blue-700">Ubicación:</span>
              <span className="font-semibold text-blue-900">
                {suggested.location_name}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-blue-700">Disponible:</span>
              <span className="font-semibold text-blue-900">
                {suggested.quantity} unidades
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Escanea el código de lote
        </label>

        <input
          type="text"
          value={scannedLot}
          onChange={(e) => {
            setScannedLot(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleConfirmPicking();
            }
          }}
          placeholder="Apunta la cámara al código QR"
          className="w-full rounded-lg border border-gray-300 p-3 text-lg"
          disabled={isValidating || isLoading}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />

        <MobileScanner
          onDetected={(code) => {
            setScannedLot(code);
            setError(null);
          }}
        />
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleConfirmPicking}
        disabled={isValidating || isLoading}
        className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-gray-300"
      >
        {isValidating ? 'Validando...' : isLoading ? 'Guardando...' : 'Confirmar Picking'}
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function MobilePickingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const picking: PickingOrder = {
    id: params.id,
    status: 'in_progress',
    sales_order_id: 'SO-001',
    created_at: new Date().toISOString(),
  };

  const pickingItems: PickingItem[] = [
    {
      id: '1',
      product_id: 'prod-1',
      quantity_to_pick: 5,
      suggested_lot: {
        id: 'lot-1',
        lot_number: 'LOT-2026-001',
        quantity: 10,
        location_name: 'Congelador A - Nivel 2',
      },
      product: {
        id: 'prod-1',
        name: 'Tequeños Tradicionales',
      },
    },
    {
      id: '2',
      product_id: 'prod-2',
      quantity_to_pick: 3,
      suggested_lot: {
        id: 'lot-2',
        lot_number: 'LOT-2026-002',
        quantity: 8,
        location_name: 'Congelador B - Nivel 1',
      },
      product: {
        id: 'prod-2',
        name: 'Empanadas de Queso',
      },
    },
  ];

  async function handleConfirmPicking(confirmation: PickingConfirmation) {
    setIsLoading(true);
    setGlobalError(null);

    try {
      await confirmPicking(
        confirmation.picking_item_id,
        confirmation.scanned_lot_number,
      );

      router.push('/mobile/picking');
    } catch (error) {
      setGlobalError(
        error instanceof Error ? error.message : 'Error al confirmar picking',
      );
    } finally {
      setIsLoading(false);
    }
  }

  const completedCount = 0;
  const totalCount = pickingItems.length;

  return (
    <main className="space-y-6 p-6 pb-20">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Picking</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pedido: {picking.sales_order_id}
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
                picking.status,
              )}`}
            >
              {getStatusLabel(picking.status)}
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

      <div className="space-y-4">
        {pickingItems.map((item) => (
          <PickingItemRow
            key={item.id}
            item={item}
            onConfirm={handleConfirmPicking}
            isLoading={isLoading}
          />
        ))}
      </div>
    </main>
  );
}
