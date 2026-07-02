'use client';

import Link from 'next/link';

import { useState } from 'react';

// import { Scanner }
  // from '@yudiel/react-qr-scanner';

import { findLot }
  from './actions';

type LotResult = {
  type:
    | 'product'
    | 'raw_material';

  itemType:
    | 'product'
    | 'raw_material';

  itemId: string;

  lot: {
    id: string;
    lot_number: string;
    quantity: number;
  };
} | null;

export default function ScanPage() {
  const [
    value,
    setValue,
  ] = useState('');

  const [
    lot,
    setLot,
  ] =
    useState<LotResult>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(false);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Escanear
      </h1>

      <div className="overflow-hidden rounded-2xl border">
        <Scanner
          onScan={async (
            result,
          ) => {
            if (
              !result.length
            ) {
              return;
            }

            const code =
              result[0]
                .rawValue;

            setValue(
              code,
            );

            setLoading(
              true,
            );

            try {
              const resultLot =
                await findLot(
                  code,
                );

              setLot(
                resultLot,
              );
            } finally {
              setLoading(
                false,
              );
            }
          }}
        />
      </div>

      <div className="rounded-2xl border p-6">
        <div className="text-sm text-gray-500">
          Resultado
        </div>

        <div className="mt-2 break-all text-lg font-semibold">
          {value ||
            'Escanea un código'}
        </div>

        {loading && (
          <div className="mt-4 text-sm text-gray-500">
            Buscando lote...
          </div>
        )}

        {!loading &&
          value &&
          !lot && (
            <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-4">
              No se encontró un lote para este código.
            </div>
          )}

        {lot && (
          <div className="mt-6 rounded border p-4">
            <div className="font-semibold">
              Lote encontrado
            </div>

            <div className="mt-3">
              Tipo:{' '}
              {lot.type ===
              'product'
                ? 'Producto'
                : 'Materia Prima'}
            </div>

            <div>
              Lote:{' '}
              {
                lot.lot
                  .lot_number
              }
            </div>

            <div>
              Cantidad:{' '}
              {
                lot.lot
                  .quantity
              }
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
  <Link
    href={`/inventory/kardex/${lot.itemType}/${lot.itemId}`}
    className="rounded border px-3 py-2 text-sm"
  >
    Ver Kardex
  </Link>

  <Link
    href={`/mobile/lots/${lot.lot.id}`}
    className="rounded border px-3 py-2 text-sm"
  >
    Ver Trazabilidad
  </Link>

  <button
    className="rounded border px-3 py-2 text-sm"
  >
    Imprimir Etiqueta
  </button>
</div>
          </div>
        )}
      </div>
    </main>
  );
}
