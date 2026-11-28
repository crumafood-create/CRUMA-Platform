'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { decideUnderThresholdFrozenLotQuality } from '../../qa/actions';
import { decideProductLotRefrigeratedWait, resolveProductLotFreezing, startProductLotFreezing } from '../storage-actions';

export type StorageLot = {
  product_lot_id: string;
  lot_number: string;
  expiration_date: string | null;
  location_name: string | null;
  lot_quantity: number;
  fresh_quantity: number;
  raw_frozen_quantity: number;
  freezing_quantity: number;
  refrigerated_wait_quantity: number;
  quality_waste_quantity: number;
  refrigerated_wait_location_name: string | null;
  freezing_location_name: string | null;
  frozen_location_name: string | null;
  quality_sampling_pending_quantity: number;
  quality_sampling_reserved_quantity: number;
  quality_rejected_pending_quantity: number;
  cumulative_frozen_quantity: number;
  sampling_plan_remaining_quantity: number;
  quality_decision_history: {
    id: string;
    inspected_quantity: number;
    accepted_quantity: number;
    rejected_quantity: number;
    destructive_quantity: number;
    conservation_evidence: string;
    witness_sample_status: string;
    witness_sample_exception_reason: string;
    reason: string;
    decided_by: string;
    decided_at: string;
  }[];
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
  started_from?: string;
};

function newIdempotencyKey() {
  return globalThis.crypto.randomUUID();
}

function FreezingStartForm({ lot, freezerLocations }: {
  lot: StorageLot;
  freezerLocations: { id: string; name: string }[];
}) {
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
  })} className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_1fr_auto]">
    <input type="hidden" name="product_lot_id" value={lot.product_lot_id} />
    <input type="hidden" name="idempotency_key" value={key} />
    <label className="text-xs text-gray-600">Destino del proceso
      <select name="process_location_id" required className="mt-1 w-full rounded border p-2" disabled={pending || !freezerLocations.length}>
        <option value="">Selecciona congelador</option>
        {freezerLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
      </select>
    </label>
    <label className="text-xs text-gray-600">Piezas
      <input name="quantity" type="number" min={1} max={lot.refrigerated_wait_quantity || lot.fresh_quantity} step={1} required
        className="mt-1 w-full rounded border p-2" disabled={pending || !(lot.refrigerated_wait_quantity || lot.fresh_quantity)} />
    </label>
    <label className="text-xs text-gray-600">Motivo
      <input name="reason" required minLength={3} placeholder="Preparar congelación"
        className="mt-1 w-full rounded border p-2" disabled={pending || !lot.fresh_quantity} />
    </label>
    <button type="submit" disabled={pending || !key || !lot.fresh_quantity || !freezerLocations.length}
      className="self-end rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300">
      {pending ? 'Apartando…' : lot.refrigerated_wait_quantity > 0 ? 'Iniciar desde espera refrigerada' : 'Iniciar congelación'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-3">{error}</p>}
  </form>;
}

function RefrigeratedWaitDecisionForm({ lot, freezerLocations }: {
  lot: StorageLot;
  freezerLocations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [destination, setDestination] = useState<'freezing' | 'waste'>('freezing');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  useEffect(() => setKey(newIdempotencyKey()), []);
  return <form action={(formData) => startTransition(async () => {
    setError('');
    try {
      await decideProductLotRefrigeratedWait(formData);
      setKey(newIdempotencyKey());
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible registrar la decisión.');
    }
  })} className="mt-3 grid gap-2 sm:grid-cols-2">
    <input type="hidden" name="product_lot_id" value={lot.product_lot_id} />
    <input type="hidden" name="idempotency_key" value={key} />
    <label className="text-xs text-gray-600">Piezas por resolver
      <input name="quantity" type="number" min={1} max={lot.refrigerated_wait_quantity} step={1} required className="mt-1 w-full rounded border p-2" disabled={pending} />
    </label>
    <label className="text-xs text-gray-600">Destino
      <select name="destination" value={destination} onChange={(event) => setDestination(event.target.value as 'freezing' | 'waste')} className="mt-1 w-full rounded border p-2" disabled={pending}>
        <option value="freezing">Iniciar congelación</option>
        <option value="waste">Merma autorizada</option>
      </select>
    </label>
    {destination === 'freezing' && <label className="text-xs text-gray-600 sm:col-span-2">Ubicación de proceso
      <select name="process_location_id" required className="mt-1 w-full rounded border p-2" disabled={pending || !freezerLocations.length}>
        <option value="">Selecciona congelador</option>
        {freezerLocations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
      </select>
    </label>}
    <label className="text-xs text-gray-600 sm:col-span-2">Motivo
      <input name="reason" required minLength={3} className="mt-1 w-full rounded border p-2" disabled={pending} />
    </label>
    <button type="submit" disabled={pending || !key || (destination === 'freezing' && !freezerLocations.length)} className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300 sm:col-span-2">
      {pending ? 'Guardando…' : destination === 'waste' ? 'Registrar merma autorizada' : 'Apartar e iniciar congelación'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
  </form>;
}

function ResolveFreezingForm({ operation }: { operation: PendingFreezing }) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [destination, setDestination] = useState<'raw_frozen' | 'fresh' | 'waste'>('raw_frozen');
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
  })} autoComplete="off" data-freezing-operation-id={operation.operation_id} className="mt-3 grid gap-2 sm:grid-cols-2">
    <input type="hidden" name="operation_id" value={operation.operation_id} />
    <input type="hidden" name="idempotency_key" value={key} />
    <label className="text-xs text-gray-600">Piezas por resolver
      <input name={`quantity_${operation.operation_id}`} type="number" min={1} max={operation.pending_quantity} step={1} required autoComplete="off"
        className="mt-1 w-full rounded border p-2" disabled={pending} />
    </label>
    <label className="text-xs text-gray-600">Destino
      <select name={`destination_${operation.operation_id}`} value={destination}
        onChange={(event) => setDestination(event.target.value as 'raw_frozen' | 'fresh' | 'waste')}
        className="mt-1 w-full rounded border p-2" disabled={pending}>
        <option value="raw_frozen">Crudo congelado</option>
        {operation.started_from === 'fresh' && <option value="fresh">Devolver a fresco</option>}
        <option value="waste">Merma autorizada</option>
      </select>
    </label>
    <p className="text-xs text-gray-600 sm:col-span-2">
      Solo se puede devolver a fresco una cantidad que siga pendiente y que no haya llegado a congelarse. Una vez confirmada como cruda congelada, no se puede reclasificar.
    </p>
    {destination === 'fresh' && <label className="flex items-start gap-2 text-sm sm:col-span-2">
      <input type="checkbox" name={`conservation_verified_${operation.operation_id}`} required className="mt-1" />
      Responsable autorizado verificó que no llegaron a congelarse y que conservaron las condiciones de Calidad.
    </label>}
    <label className="text-xs text-gray-600 sm:col-span-2">Motivo de la decisión
      <input name={`reason_${operation.operation_id}`} required minLength={3} autoComplete="off" className="mt-1 w-full rounded border p-2"
        placeholder={destination === 'fresh' ? 'Verificación de conservación' : destination === 'waste' ? 'Motivo de merma autorizado' : 'Congelación terminada'} disabled={pending} />
    </label>
    <button type="submit" disabled={pending || !key}
      className="rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300 sm:col-span-2">
      {pending ? 'Guardando…' : 'Registrar decisión'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
  </form>;
}

function UnderThresholdQualityDecisionForm({ lot }: { lot: StorageLot }) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  useEffect(() => setKey(newIdempotencyKey()), []);

  return <form action={(formData) => startTransition(async () => {
    setError('');
    try {
      await decideUnderThresholdFrozenLotQuality(formData);
      setKey(newIdempotencyKey());
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar la decisión de Calidad.');
    }
  })} className="mt-4 grid gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 sm:grid-cols-2">
    <input type="hidden" name="product_lot_id" value={lot.product_lot_id} />
    <input type="hidden" name="idempotency_key" value={key} />
    <p className="text-sm sm:col-span-2">
      Calidad debe inspeccionar el 100% de las {lot.quality_sampling_pending_quantity} piezas apartadas. Aceptadas, rechazadas y pruebas destructivas deben sumar esa cantidad.
    </p>
    <label className="text-sm">Cantidad inspeccionada
      <input name="inspected_quantity" type="number" value={lot.quality_sampling_pending_quantity} readOnly className="mt-1 w-full rounded border bg-white p-2" />
    </label>
    <label className="text-sm">Aceptadas
      <input name="accepted_quantity" type="number" min={0} max={lot.quality_sampling_pending_quantity} step={1} required defaultValue={0} className="mt-1 w-full rounded border bg-white p-2" disabled={pending} />
    </label>
    <label className="text-sm">Rechazadas · siguen retenidas
      <input name="rejected_quantity" type="number" min={0} max={lot.quality_sampling_pending_quantity} step={1} required defaultValue={0} className="mt-1 w-full rounded border bg-white p-2" disabled={pending} />
    </label>
    <label className="text-sm">Pruebas destructivas · merma de Calidad
      <input name="destructive_quantity" type="number" min={0} max={lot.quality_sampling_pending_quantity} step={1} required defaultValue={0} className="mt-1 w-full rounded border bg-white p-2" disabled={pending} />
    </label>
    <label className="flex items-start gap-2 text-sm sm:col-span-2">
      <input type="checkbox" name="process_verified" className="mt-1" disabled={pending} />
      Revisé visualmente cada pieza: armado cerrado, integridad y ausencia de roturas visibles.
    </label>
    <label className="flex items-start gap-2 text-sm sm:col-span-2">
      <input type="checkbox" name="conservation_verified" className="mt-1" disabled={pending} />
      Verifiqué la trazabilidad y que la lectura registrada esté dentro de la especificación aprobada.
    </label>
    <label className="text-sm sm:col-span-2">Evidencia positiva de conservación
      <textarea name="conservation_evidence" required maxLength={500} rows={2} className="mt-1 w-full rounded border bg-white p-2" disabled={pending}
        placeholder="folio=QA-123; fecha/hora=27/11 10:15; lectura=4 C; especificacion=2-5 C" />
      <span className="mt-1 block text-xs text-gray-600">Registra folio y lectura positiva comparada con la especificación. La ausencia de registros no confirma conservación; sin evidencia positiva no aceptes piezas.</span>
    </label>
    <label className="flex items-start gap-2 text-sm sm:col-span-2">
      <input type="checkbox" name="witness_sample_exception" required className="mt-1" disabled={pending} />
      Registrar la excepción como “sin muestra testigo por excepción autorizada”. No reduce el plan estándar 2+3 ni borra el acumulado.
    </label>
    <label className="text-sm sm:col-span-2">Motivo y responsable de la excepción
      <textarea name="witness_sample_exception_reason" required maxLength={500} rows={2} className="mt-1 w-full rounded border bg-white p-2" disabled={pending} />
    </label>
    <label className="text-sm sm:col-span-2">Decisión y observaciones de Calidad
      <textarea name="reason" required minLength={3} maxLength={500} rows={2} className="mt-1 w-full rounded border bg-white p-2" disabled={pending} />
    </label>
    <button type="submit" disabled={pending || !key} className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-gray-300 sm:col-span-2">
      {pending ? 'Guardando decisión…' : 'Registrar inspección y excepción de Calidad'}
    </button>
    {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
  </form>;
}

export default function StorageConditionsClient({
  lots,
  pending: pendingOperations,
  freezerLocations,
}: {
  lots: StorageLot[];
  pending: PendingFreezing[];
  freezerLocations: { id: string; name: string }[];
}) {
  return <>
    <section className="space-y-3 rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Saldo por lote</h2>
      {lots.length ? lots.map((lot) => <article key={lot.product_lot_id} data-quality-lot={lot.product_lot_id} className="rounded-lg border p-4">
        <div className="flex flex-wrap justify-between gap-2">
          <div><strong>{lot.product_name}</strong><div className="text-sm text-gray-600">Lote {lot.lot_number} · {lot.location_name ?? 'Sin ubicación'}</div></div>
          <div className="text-sm">Caduca: {lot.expiration_date ?? 'Sin fecha'}</div>
        </div>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <span>Fresco <strong>{lot.fresh_quantity}</strong></span>
          <span>Crudo congelado <strong>{lot.raw_frozen_quantity}</strong></span>
          <span>En congelación <strong>{lot.freezing_quantity}</strong></span>
          <span>Espera refrigerada <strong>{lot.refrigerated_wait_quantity}</strong> · {lot.refrigerated_wait_location_name ?? 'Sin ubicación'}</span>
          <span>Congelación en proceso · {lot.freezing_location_name ?? 'Sin ubicación'}</span>
          <span>Congelado disponible · {lot.frozen_location_name ?? 'Sin ubicación'}</span>
          <span>Merma por decisión de Calidad <strong>{lot.quality_waste_quantity}</strong></span>
          <span>Apartado bajo umbral, pendiente de Calidad <strong>{lot.quality_sampling_pending_quantity}</strong></span>
          <span>Muestras apartadas para Calidad <strong>{lot.quality_sampling_reserved_quantity}</strong></span>
          <span>Pendientes de disposición por rechazo <strong>{lot.quality_rejected_pending_quantity}</strong></span>
          <span>Congeladas acumuladas en el lote <strong>{lot.cumulative_frozen_quantity}</strong></span>
          {lot.sampling_plan_remaining_quantity > 0 && lot.cumulative_frozen_quantity > 0 && <span>Plan estándar 2+3: faltan <strong>{lot.sampling_plan_remaining_quantity}</strong> piezas para completar el apartado</span>}
        </div>
        {lot.quality_sampling_pending_quantity > 0 && lot.quality_sampling_pending_quantity < 5 && <UnderThresholdQualityDecisionForm lot={lot} />}
        {lot.quality_decision_history.length > 0 && <details className="mt-3 rounded border p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Historial de excepciones de Calidad ({lot.quality_decision_history.length})</summary>
          <ul className="mt-2 space-y-2">
            {lot.quality_decision_history.map((decision) => <li key={decision.id} className="border-t pt-2">
              <div>{decision.decided_at ? new Date(decision.decided_at).toLocaleString('es-MX') : 'Fecha no disponible'} · responsable {decision.decided_by}</div>
              <div>Inspeccionadas {decision.inspected_quantity}; aceptadas {decision.accepted_quantity}; rechazadas {decision.rejected_quantity}; prueba destructiva/merma {decision.destructive_quantity}.</div>
              <div>{decision.witness_sample_status}: {decision.witness_sample_exception_reason}</div>
              <div>Evidencia de conservación: {decision.conservation_evidence}</div>
              <div>{decision.reason}</div>
            </li>)}
          </ul>
        </details>}
        {lot.fresh_quantity > 0 && <FreezingStartForm lot={lot} freezerLocations={freezerLocations} />}
        {lot.refrigerated_wait_quantity > 0 && <RefrigeratedWaitDecisionForm lot={lot} freezerLocations={freezerLocations} />}
      </article>) : <p className="text-sm text-gray-600">No hay lotes liberados que manejen condición de almacenamiento.</p>}
    </section>
    <section className="space-y-3 rounded-2xl border p-5">
      <h2 className="text-xl font-semibold">Incidencias al cierre y congelaciones pendientes</h2>
      {lots.filter((lot) => lot.refrigerated_wait_quantity > 0).map((lot) => <article key={`wait-${lot.product_lot_id}`} className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <div><strong>{lot.product_name} · lote {lot.lot_number}</strong></div>
        <p className="mt-1 text-sm">Incidencia de cierre: {lot.refrigerated_wait_quantity} piezas siguen refrigeradas y pendientes de congelación en {lot.refrigerated_wait_location_name ?? 'ubicación sin configurar'}.</p>
        <p className="text-sm text-gray-600">La cantidad permanece fuera de reservas y picking hasta registrar su destino.</p>
      </article>)}
      {pendingOperations.map((operation) => <article key={operation.operation_id} data-freezing-operation-card={operation.operation_id} className="rounded-lg border p-4">
        <div><strong>{operation.product_name} · lote {operation.lot_number}</strong></div>
        <p className="mt-1 text-sm text-gray-600">Quedan {operation.pending_quantity} de {operation.requested_quantity} piezas apartadas. Iniciado: {new Date(operation.started_at).toLocaleString('es-MX')}</p>
        <p className="text-sm">Motivo inicial: {operation.reason}</p>
        <ResolveFreezingForm operation={operation} />
      </article>)}
      {!pendingOperations.length && !lots.some((lot) => lot.refrigerated_wait_quantity > 0) && <p className="text-sm text-gray-600">No hay incidencias de cierre ni piezas pendientes de decisión.</p>}
    </section>
  </>;
}
