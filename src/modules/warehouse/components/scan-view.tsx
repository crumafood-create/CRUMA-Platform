'use client';

import Link from 'next/link';
import { useState } from 'react';
import { findLot, type FindLotResult } from '../services/scan.service';
import { MobileScanner } from './mobile-scanner';

export function ScanView() {
  const [value, setValue] = useState('');
  const [lot, setLot] = useState<FindLotResult>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function searchLot(codeToSearch?: string) {
    const code = (codeToSearch || value).trim();
    if (!code) return;

    if (codeToSearch) {
      setValue(codeToSearch);
    }

    setLoading(true);
    setSearched(true);
    try {
      const result = await findLot(code);
      setLot(result);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="space-y-6 p-4 sm:p-6">
      <h1 className="text-3xl font-bold">Escanear Lote</h1>

      {/* Escáner de Cámara */}
      <MobileScanner onDetected={(code) => void searchLot(code)} />

      {/* Entrada Manual */}
      <div className="space-y-4 rounded-2xl border p-5 shadow-sm bg-white">
        <label htmlFor="lot-input" className="block text-sm font-medium text-gray-700">
          Búsqueda manual de código
        </label>
        <div className="flex gap-2">
          <input
            id="lot-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Escribe o pega el código del lote"
            className="flex-1 rounded-xl border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => void searchLot()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Estados de Carga / Resultados */}
      {loading && (
        <div className="rounded-2xl border p-6 text-center text-gray-500 bg-gray-50">
          Buscando lote...
        </div>
      )}

      {!loading && searched && !lot && (
        <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-5 text-sm text-yellow-800">
          No se encontró ningún lote para el código: <strong className="font-semibold">{value}</strong>
        </div>
      )}

      {lot && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Lote encontrado</h2>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
              {lot.type === 'product' ? 'Producto Terminado' : 'Materia Prima'}
            </span>
          </div>

          <div className="space-y-1 text-sm text-gray-700 border-t border-b py-3">
            <div><span className="font-medium text-gray-900">Número de Lote:</span> {lot.lot.lot_number}</div>
            <div><span className="font-medium text-gray-900">Cantidad Disponible:</span> {lot.lot.quantity}</div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {lot.itemId && lot.itemType && (
              <Link
                href={`/inventory/kardex/${lot.itemType}/${lot.itemId}`}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Ver Kardex
              </Link>
            )}
            <Link
              href={`/mobile/lots/${lot.lot.id}`}
              className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              Ver Trazabilidad
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}