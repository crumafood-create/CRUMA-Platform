'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { resolveProductLotFreezing, startProductLotFreezing } from '../storage-actions';

export type StorageLot = {
  product_lot_id: string;
  lot_number: string;
  expiration_date: string | null;
  location_name: string | null;
  lot_quantity: number;
  fresh_quantity: number;
  raw_frozen_quantity: number;
  freezing_quantity: number;
  product_name: string;
};

export type PendingFreezing = {
  operation_id: string;
  product_lot_id: string;
  lot_number: string;
  product_name: string;
  requested_quantity: number;
  pending_quantity: number;
  reason: string;
  started_at: string;
};

function newIdempotencyKey() {
  return globalThis.crypto.randomUUID();
}

function FreezingStartForm({ lot }: { lot: StorageLot }) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  useEffect(() => setKey(newIdempotencyKey()), []);

  return <form action={(formData) => startTransition(async () => {
    setError('');
    try {
      await startProductLotFreezing(formData);
      setKey(newIdempotencyKey());
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible apartar las piezas.');
    }
  })} className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]">
    <input type="hidden" name="product_lot_id" value={lot.product_lot_id} />
    <input type="hidden" name="idempotency_key" value={key} />
    <label className="text-xs text-gray-600">Piezas
      <input name="quantity" type="number" min={1} max={lot.fresh_quantity} step={1} required
        className="mt-1 w-full rounded border p-2" disabled={pending || !lot.fresh_quantity} />
    </label>
    <label className="text-xs text-gray-600">Motivo
      <input name="reason" required minLength={3} placeholder="Preparar congelación"
        className="mt-1 w-full rounded border p-2" disabled={pending || !lot.fresh_quantity} />
    </label>
    <button type="submit" disabled={pending || !key || !lot.fresh_quantity}
      className="self-end rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300">
      {pending ? 'Apartando…' : 'Iniciar congelación'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{error}</p>}
  </form>;
}

function ResolveFreezingForm({ operation }: { operation: PendingFreezing }) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [destination, setDestination] = useState<'raw_frozen' | 'fresh'>('raw_frozen');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  useEffect(() => setKey(newIdempotencyKey()), []);

  return <form action={(formData) => startTransition(async () => {
    setError('');
    try {
      await resolveProductLotFreezing(formData);
      setKey(newIdempotencyKey());
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible registrar la decisión.');
    }
  })} className="mt-3 grid gap-2 sm:grid-cols-2">
    <input type="hidden" name="operation_id" value={operation.operation_id} />
    <input type="hidden" name="idempotency_key" value={key} />
    <label className="text-xs text-gray-600">Piezas por resolver
      <input name="quantity" type="number" min={1} max={operation.pending_quantity} step={1} required
        className="mt-1 w-full rounded border p-2" disabled={pending} />
    </label>
    <label className="text-xs text-gray-600">Destino
      <select name="destination" value={destination}
        onChange={(event) => setDestination(event.target.value as 'raw_frozen' | 'fresh')}
        className="mt-1 w-full rounded border p-2" disabled={pending}>
        <option value="raw_frozen">Crudo congelado</option>
        <option value="fresh">Devolver a fresco</option>
      </select>
    </label>
    <p className="text-xs text-gray-600 sm:col-span-2">
      Solo se puede devolver a fresco una cantidad que siga pendiente y que no haya llegado a congelarse. Una vez confirmada como cruda congelada, no se puede reclasificar.
    </p>
    {destination === 'fresh' && <label className="flex items-start gap-2 text-sm sm:col-span-2">
      <input type="checkbox" name="conservation_verified" required className="mt-1" />
      Responsable autorizado verificó que no llegaron a congelarse y que conservaron las condiciones de Calidad.
    </label>}
    <label className="text-xs text-gray-600 sm:col-span-2">Motivo de la decisión
      <input name="reason" required minLength={3} className="mt-1 w-full rounded border p-2"
        placeholder={destination === 'fresh' ? 'Verificación de conservación' : 'Congelación terminada'} disabled={pending} />
    </label>
    <button type="submit" disabled={pending || !key}
      className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300 sm:col-span-2">
      {pending ? 'Guardando…' : 'Registrar decisión'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
  </form>;
}

export default function StorageConditionsClient({
  lots,
  pending: pendingOperations,
}: {
  lots: StorageLot[];
  pending: PendingFreezing[];
}) {
  return <>
    <section className="space-y-3 rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Saldo por lote</h2>
      {lots.length ? lots.map((lot) => <article key={lot.product_lot_id} className="rounded-lg border p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div><strong>{lot.product_name}</strong><div className="text-sm text-gray-600">Lote {lot.lot_number} · {lot.location_name ?? 'Sin ubicación'}</div></div>
          <div className="text-sm">Caduca: {lot.expiration_date ?? 'Sin fecha'}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span>Fresco <strong>{lot.fresh_quantity}</strong></span>
          <span>Crudo congelado <strong>{lot.raw_frozen_quantity}</strong></span>
          <span>En congelación <strong>{lot.freezing_quantity}</strong></span>
        </div>
        <FreezingStartForm lot={lot} />
      </article>) : <p className="text-sm text-gray-600">No hay lotes liberados que manejen condición de almacenamiento.</p>}
    </section>
    <section className="space-y-3 rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Congelaciones pendientes de decisión</h2>
      {pendingOperations.length ? pendingOperations.map((operation) => <article key={operation.operation_id} className="rounded-lg border p-4">
        <div><strong>{operation.product_name} · lote {operation.lot_number}</strong></div>
        <p className="mt-1 text-sm text-gray-600">Quedan {operation.pending_quantity} de {operation.requested_quantity} piezas apartadas. Iniciado: {new Date(operation.started_at).toLocaleString('es-MX')}</p>
        <p className="text-sm">Motivo inicial: {operation.reason}</p>
        <ResolveFreezingForm operation={operation} />
      </article>) : <p className="text-sm text-gray-600">No hay piezas pendientes de decisión.</p>}
    </section>
  </>;
}
