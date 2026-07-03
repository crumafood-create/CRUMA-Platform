'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  findLot,
  type FindLotResult,
} from './actions';

export default function ScanPage() {
  const [value, setValue] =
    useState('');

  const [lot, setLot] =
    useState<FindLotResult>(
      null,
    );

  const [loading, setLoading] =
    useState(false);

  async function searchLot() {
    const code =
      value.trim();

    if (!code) {
      return;
    }

    setLoading(true);

    try {
      const result =
        await findLot(
          code,
        );

      setLot(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">
        Escanear
      </h1>

      <div className="space-y-4 rounded-2xl border p-6">
        <div className="text-sm text-gray-500">
          Código de lote
        </div>

        <input
          value={value}
          onChange={(e) =>
            setValue(
              e.target.value,
            )
          }
          placeholder="Escribe o pega el código"
          className="w-full rounded border p-3"
        />

        <button
          type="button"
          onClick={searchLot}
          className="rounded border px-4 py-2"
        >
          Buscar
        </button>
      </div>

      {loading && (
        <div className="rounded border p-4">
          Buscando lote...
        </div>
      )}

      {!loading &&
        value &&
        !lot && (
          <div className="rounded border border-yellow-300 bg-yellow-50 p-4">
            No se encontró un lote para este código.
          </div>
        )}

      {lot && (
        <div className="rounded border p-6">
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
            {lot.itemId &&
              lot.itemType && (
                <Link
                  href={`/inventory/kardex/${lot.itemType}/${lot.itemId}`}
                  className="rounded border px-3 py-2 text-sm"
                >
                  Ver Kardex
                </Link>
              )}

            <Link
              href={`/mobile/lots/${lot.lot.id}`}
              className="rounded border px-3 py-2 text-sm"
            >
              Ver Trazabilidad
            </Link>

            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
            >
              Imprimir Etiqueta
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
