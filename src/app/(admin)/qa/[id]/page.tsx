import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  createTypedClient,
} from '@/infrastructure/integrations/supabase/server';
import { ProductLotQualitySampleDispositionForm } from '@/modules/quality/components/forms/product-lot-quality-sample-disposition-form';

import {
  decideQualityRelease,
  decideProductLotQualitySampleDisposition,
  decideRawMaterialQualityRelease,
  releasePreparedIngredientQualityLot,
  retainPreparedIngredientForStorageCorrection,
  disposeFinishedProductNonconformance,
} from '../actions';

const statusLabel: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  passed: 'Aprobada',
  failed: 'Fallida',
  hold: 'Retenida',
};

const decisionLabel: Record<string, string> = {
  release: 'Liberado',
  hold: 'Retenido',
  reject: 'Rechazado',
};

const dispositionLabel: Record<string, string> = {
  scrap: 'Descarte',
  rework: 'Retrabajo',
};

const qualitySampleDestinationLabel: Record<string, string> = {
  returned_to_lot: 'Devuelta al mismo lote',
  direct_waste: 'Merma directa de Calidad',
};

export default async function QualityInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();

  const {
    data: inspection,
    error,
  } = await supabase
    .from('quality_inspections')
    .select(`
      id,
      subject_type,
      product_lot_quality_sample_id,
      status,
      result,
      sampled_quantity,
      accepted_quantity,
      rejected_quantity,
      notes,
      inspected_at,
      production_outputs (
        id,
        quality_status,
        products (
          name
        ),
        production_orders (
          id,
          production_number
        )
      ),
      raw_material_lots (
        id,
        raw_material_id,
        lot_number,
        status,
        quantity,
        expiration_date,
        raw_materials (
          name,
          internal_code
        ),
        inventory_locations (
          name
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(
      'No fue posible consultar la inspección.',
    );
  }

  if (!inspection) {
    notFound();
  }

  let qualitySampleLotNumber: string | null = null;
  let qualitySample: {
    id: string;
    product_lot_id: string;
    quantity: number;
    purpose: string;
    status: string;
    destination: string | null;
    reason: string | null;
    decided_at: string | null;
  } | null = null;
  let sampleDispositions: {
    id: string;
    quantity: number;
    destination: string;
    return_authorized: boolean;
    reason: string;
    decided_by: string;
    decided_at: string;
  }[] = [];
  if (inspection.product_lot_quality_sample_id) {
    const { data: sample, error: sampleError } = await supabase
      .from('product_lot_quality_samples')
      .select('id, product_lot_id, quantity, purpose, status, destination, reason, decided_at')
      .eq('id', inspection.product_lot_quality_sample_id)
      .maybeSingle();
    if (sampleError) {
      throw new Error('No fue posible consultar el lote de la muestra.');
    }
    if (sample) {
      qualitySample = sample;
      const { data: sampleLot, error: sampleLotError } = await supabase
        .from('product_lots')
        .select('lot_number')
        .eq('id', sample.product_lot_id)
        .maybeSingle();
      if (sampleLotError) {
        throw new Error('No fue posible consultar el lote de inventario de la muestra.');
      }
      qualitySampleLotNumber = sampleLot?.lot_number ?? null;

      const { data: decisions, error: decisionsError } = await supabase
        .from('product_lot_quality_sample_dispositions')
        .select('id, quantity, destination, return_authorized, reason, decided_by, decided_at')
        .eq('sample_id', sample.id)
        .order('decided_at')
        .order('id');
      if (decisionsError) {
        throw new Error('No fue posible consultar las decisiones de la muestra.');
      }
      sampleDispositions = decisions ?? [];
    }
  }

  const [
    { data: items },
    { data: defects },
    { data: decision },
    { data: disposition },
  ] = await Promise.all([
    supabase
      .from('quality_inspection_items')
      .select(`
        id,
        criterion,
        expected_value,
        actual_value,
        passed,
        notes
      `)
      .eq('inspection_id', id)
      .order('created_at'),

    supabase
      .from('quality_defects')
      .select(`
        id,
        defect_type,
        severity,
        quantity,
        description
      `)
      .eq('inspection_id', id)
      .order('created_at'),

    supabase
      .from('quality_release_decisions')
      .select(`
        id,
        decision,
        reason,
        approved_at
      `)
      .eq('inspection_id', id)
      .maybeSingle(),

    supabase
      .from('finished_product_nonconformance_disposition_operations')
      .select(`
        id,
        disposition,
        reason,
        rework_production_order_id,
        disposed_at
      `)
      .eq('quality_inspection_id', id)
      .maybeSingle(),
  ]);

  const dispositionIdempotencyKey =
    crypto.randomUUID();

  const isRawMaterial =
    inspection.subject_type === 'raw_material_lot';
  const isProductLotSample =
    inspection.subject_type === 'product_lot_quality_sample';
  const rawMaterialLotId = isRawMaterial ? inspection.raw_material_lots?.id : null;
  const preparationResult = rawMaterialLotId
    ? await supabase.from('cheese_preparation_operations')
      .select('id, operation_type, source_lot_id, source_quantity, source_cost, output_lot_id, secondary_lot_id, secondary_quantity, reason')
      .or(`output_lot_id.eq.${rawMaterialLotId},secondary_lot_id.eq.${rawMaterialLotId}`)
      .limit(1)
      .maybeSingle()
    : { data: null, error: null };
  if (preparationResult.error) throw new Error('No fue posible consultar el origen de preparación.');
  const preparation = preparationResult.data;
  const preparationSourceResult = preparation
    ? await supabase.from('raw_material_lots')
      .select('lot_number, raw_materials(name)')
      .eq('id', preparation.source_lot_id)
      .maybeSingle()
    : { data: null, error: null };
  if (preparationSourceResult.error) throw new Error('No fue posible consultar el lote usado en la preparación.');
  const parentPreparationResult = preparation?.operation_type === 'grate'
    ? await supabase.from('cheese_preparation_operations')
      .select('source_lot_id')
      .eq('output_lot_id', preparation.source_lot_id)
      .maybeSingle()
    : { data: null, error: null };
  if (parentPreparationResult.error) throw new Error('No fue posible consultar el origen del recorte.');
  const originalCheeseLotResult = parentPreparationResult.data
    ? await supabase.from('raw_material_lots')
      .select('lot_number, raw_materials(name)')
      .eq('id', parentPreparationResult.data.source_lot_id)
      .maybeSingle()
    : { data: null, error: null };
  if (originalCheeseLotResult.error) throw new Error('No fue posible consultar el lote original de queso.');
  const preparedMaterialResult = preparation && rawMaterialLotId && inspection.raw_material_lots?.raw_material_id
    ? await supabase.from('raw_materials')
      .select('required_storage_condition, default_storage_use, default_inventory_location_id')
      .eq('id', inspection.raw_material_lots.raw_material_id)
      .maybeSingle()
    : { data: null, error: null };
  if (preparedMaterialResult.error) throw new Error('No fue posible consultar la conservación aprobada del ingrediente.');
  const preparedMaterialPolicy = preparedMaterialResult.data;
  const storageLocationsResult = preparation && preparedMaterialPolicy?.default_inventory_location_id
    ? await supabase.from('inventory_locations')
      .select('id, name, location_use, storage_condition')
      .eq('id', preparedMaterialPolicy.default_inventory_location_id)
      .eq('location_use', preparedMaterialPolicy.default_storage_use!)
      .eq('storage_condition', preparedMaterialPolicy.required_storage_condition!)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name')
    : { data: [], error: null };
  if (storageLocationsResult.error) throw new Error('No fue posible consultar las ubicaciones de almacén.');
  const configuredStorageLocation = storageLocationsResult.data?.[0] ?? null;
  const preparedLotStateResult = preparation && rawMaterialLotId
    ? await supabase.from('raw_material_lots')
      .select('status, storage_condition, expiration_date, inventory_location_id, quantity, remaining_value')
      .eq('id', rawMaterialLotId)
      .maybeSingle()
    : { data: null, error: null };
  if (preparedLotStateResult.error) throw new Error('No fue posible consultar la condición liberada del lote.');
  const preparedCurrentLocationResult = preparedLotStateResult.data?.inventory_location_id
    ? await supabase.from('inventory_locations')
      .select('id, name, location_use, storage_condition')
      .eq('id', preparedLotStateResult.data.inventory_location_id)
      .maybeSingle()
    : { data: null, error: null };
  if (preparedCurrentLocationResult.error) throw new Error('No fue posible consultar la ubicación actual del lote preparado.');
  const preparedCurrentLocation = preparedCurrentLocationResult.data;
  const preparedLotNeedsCorrection = Boolean(
    preparation
      && decision?.decision === 'release'
      && preparedLotStateResult.data?.status === 'available'
      && preparedMaterialPolicy?.required_storage_condition
      && preparedMaterialPolicy.default_storage_use
      && (preparedLotStateResult.data.storage_condition !== preparedMaterialPolicy.required_storage_condition
        || !preparedCurrentLocation
        || preparedCurrentLocation.storage_condition !== preparedMaterialPolicy.required_storage_condition
        || preparedCurrentLocation.location_use !== preparedMaterialPolicy.default_storage_use),
  );
  const disposedSampleQuantity = sampleDispositions.reduce(
    (total, disposition) => total + disposition.quantity,
    0,
  );
  const samplePendingQuantity = qualitySample
    ? Math.max(qualitySample.quantity - disposedSampleQuantity, 0)
    : 0;

  const subjectName = isRawMaterial
    ? inspection.raw_material_lots
        ?.raw_materials?.name ??
      'Materia prima'
    : inspection.production_outputs
        ?.products?.name ??
      'Producto terminado';

  const subjectReference = isProductLotSample
    ? `Lote ${qualitySampleLotNumber ?? '-'} · orden ${
        inspection.production_outputs
          ?.production_orders
          ?.production_number ?? '-'
      }`
    : isRawMaterial
    ? `Lote ${
        inspection.raw_material_lots
          ?.lot_number ?? '-'
      }`
    : `Orden ${
        inspection.production_outputs
          ?.production_orders
          ?.production_number ?? '-'
      }`;

  const decideAction = isRawMaterial
    ? decideRawMaterialQualityRelease
    : decideQualityRelease;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Inspección de calidad
          </h1>

          <p className="text-gray-500">
            {isProductLotSample
              ? 'Muestra de producto terminado'
              : isRawMaterial
              ? 'Materia prima'
              : 'Producto terminado'}
            {' · '}
            {subjectReference}
            {' · '}
            {subjectName}
          </p>
        </div>

        <Link
          href="/qa"
          className="rounded border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      {preparation ? (
        <section className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-bold">Origen de preparación</h2>
          <p>
            {preparation.operation_type === 'cut' ? 'Corte de queso' : 'Rallado'} ·{' '}
            {Number(preparation.source_quantity).toFixed(4)} kg de{' '}
            {preparationSourceResult.data?.raw_materials?.name ?? 'ingrediente'} · lote{' '}
            {preparationSourceResult.data?.lot_number ?? '-'} · costo asignado ${Number(preparation.source_cost).toFixed(4)}.
          </p>
          {originalCheeseLotResult.data ? (
            <p>Origen del recorte: {originalCheeseLotResult.data.raw_materials?.name ?? 'Queso'} · lote {originalCheeseLotResult.data.lot_number}.</p>
          ) : null}
          <p>{preparedLotStateResult.data?.status === 'hold'
            ? 'El lote está retenido y fuera del inventario disponible hasta una nueva decisión de Calidad.'
            : decision?.decision === 'release'
              ? 'El lote preparado fue liberado y forma parte del inventario disponible.'
              : 'El lote preparado permanece en cuarentena y fuera del inventario disponible hasta su liberación por Calidad.'}</p>
          {decision?.decision === 'release' && preparedLotStateResult.data?.status === 'available' ? (
            <p className="font-semibold text-green-800">
              Liberado · {preparedLotStateResult.data.storage_condition === 'dry' ? 'Almacén seco' : 'Almacén refrigerado'} · {preparedCurrentLocation?.name ?? 'sin ubicación'} · caducidad interna {preparedLotStateResult.data.expiration_date ?? '-'}.
            </p>
          ) : null}
          {preparedLotStateResult.data?.status === 'hold' ? (
            <p className="font-semibold text-amber-800">
              Retenido · {preparedLotStateResult.data.storage_condition === 'dry' ? 'Almacén seco' : 'Almacén refrigerado'} · {preparedCurrentLocation?.name ?? 'sin ubicación'} · {Number(preparedLotStateResult.data.quantity).toFixed(4)} kg apartados.
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        className={
          'grid gap-3 rounded-2xl border p-6 ' +
          'md:grid-cols-4'
        }
      >
        <div>
          <span className="text-sm text-gray-500">
            Estado
          </span>

          <strong className="block">
            {statusLabel[inspection.status] ??
              inspection.status}
          </strong>
        </div>

        <div>
          <span className="text-sm text-gray-500">
            Muestra
          </span>

          <strong className="block">
            {inspection.sampled_quantity}
          </strong>
        </div>

        <div>
          <span className="text-sm text-gray-500">
            Aceptadas
          </span>

          <strong className="block">
            {inspection.accepted_quantity}
          </strong>
        </div>

        <div>
          <span className="text-sm text-gray-500">
            Rechazadas
          </span>

          <strong className="block">
            {inspection.rejected_quantity}
          </strong>
        </div>
      </section>

      {isRawMaterial && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">
            Lote inspeccionado
          </h2>

          <div
            className={
              'mt-3 grid gap-3 text-sm ' +
              'md:grid-cols-3'
            }
          >
            <div>
              <span className="text-gray-500">
                Material
              </span>

              <strong className="block">
                {subjectName}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">
                Lote
              </span>

              <strong className="block">
                {inspection.raw_material_lots
                  ?.lot_number ?? '-'}
              </strong>
            </div>

            <div>
              <span className="text-gray-500">
                Ubicación
              </span>

              <strong className="block">
                {inspection.raw_material_lots
                  ?.inventory_locations?.name ??
                  'Sin ubicación'}
              </strong>
            </div>
          </div>
        </section>
      )}

      {isProductLotSample && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Lote de inventario</h2>
          <p className="mt-2">{qualitySampleLotNumber ?? '-'}</p>
        </section>
      )}

      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          Criterios
        </h2>

        {items?.map((item) => (
          <div
            key={item.id}
            className={
              'grid gap-2 rounded border p-3 ' +
              'md:grid-cols-4'
            }
          >
            <strong>{item.criterion}</strong>

            <span>
              Esperado:{' '}
              {item.expected_value ?? '-'}
            </span>

            <span>
              Observado:{' '}
              {item.actual_value ?? '-'}
            </span>

            <span>
              {item.passed
                ? 'Cumple'
                : 'No cumple'}
            </span>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border p-6">
        <h2 className="text-xl font-semibold">
          Defectos
        </h2>

        {defects?.length ? (
          defects.map((defect) => (
            <div
              key={defect.id}
              className="rounded border p-3"
            >
              <strong>
                {defect.defect_type}
              </strong>
              {' · '}
              {defect.severity}
              {' · '}
              {defect.quantity}

              {defect.description ? (
                <p className="text-sm text-gray-500">
                  {defect.description}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-gray-500">
            Sin defectos registrados.
          </p>
        )}
      </section>

      {inspection.notes ? (
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">
            Notas
          </h2>

          <p className="mt-2 text-sm text-gray-600">
            {inspection.notes}
          </p>
        </section>
      ) : null}

      {isProductLotSample ? (
        <section className="space-y-4 rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Destino de la muestra</h2>
          <p className="text-sm text-gray-600">
            La aprobación de la inspección y el destino se registran por separado.
            Las piezas sin destino siguen apartadas.
          </p>
          <p>
            Muestra de {qualitySample?.quantity ?? inspection.sampled_quantity}
            {' piezas · Pendientes de destino: '}
            {samplePendingQuantity}
          </p>

          {sampleDispositions.map((sampleDisposition) => (
            <div key={sampleDisposition.id} className="rounded border p-3 text-sm">
              <strong>
                {sampleDisposition.quantity} ·{' '}
                {qualitySampleDestinationLabel[sampleDisposition.destination] ??
                  sampleDisposition.destination}
              </strong>
              <p>{sampleDisposition.reason}</p>
              <p className="text-gray-500">
                {new Date(sampleDisposition.decided_at).toLocaleString('es-MX')}
                {' · Responsable: '}
                {sampleDisposition.decided_by}
                {sampleDisposition.return_authorized
                  ? ' · Retorno autorizado por Calidad'
                  : ''}
              </p>
            </div>
          ))}

          {qualitySample && samplePendingQuantity > 0 ? (
            <ProductLotQualitySampleDispositionForm
              action={decideProductLotQualitySampleDisposition}
              inspectionId={id}
              sampleId={qualitySample.id}
              pendingQuantity={samplePendingQuantity}
              idempotencyKey={dispositionIdempotencyKey}
            />
          ) : (
            <p className="text-sm text-green-700">
              Toda la muestra inmediata tiene un destino registrado.
            </p>
          )}
        </section>
      ) : decision ? (
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">
            {preparation && preparedLotStateResult.data?.status === 'hold'
              ? 'Decisión de la inspección anterior:'
              : 'Decisión:'}{' '}
            {decisionLabel[decision.decision] ??
              decision.decision}
          </h2>

          <p className="text-sm text-gray-500">
            {decision.reason ??
              'Sin observaciones'}
          </p>

          {preparedLotNeedsCorrection ? (
            <form
              action={retainPreparedIngredientForStorageCorrection.bind(null, id)}
              className="mt-5 space-y-3 rounded border border-amber-300 bg-amber-50 p-4"
            >
              <h3 className="font-semibold">Retener y corregir almacenamiento</h3>
              <p className="text-sm">Este lote fue liberado en una ubicación incompatible con la especificación actual. La operación lo apartará del saldo disponible, conservará cantidad y valor y lo moverá al destino configurado. Después requerirá una nueva inspección y una decisión de Calidad para volver a inventario.</p>
              <p className="text-sm">Ubicación actual: {preparedCurrentLocation?.name ?? 'sin ubicación'} · destino compatible: {configuredStorageLocation?.name ?? 'sin configurar'} · condición aprobada: {preparedMaterialPolicy?.required_storage_condition === 'refrigerated' ? 'refrigerado' : 'seco'}.</p>
              <label className="block text-sm">Motivo de la corrección
                <input name="reason" required maxLength={500} className="mt-1 w-full rounded border px-3 py-2" />
              </label>
              <button type="submit" disabled={!configuredStorageLocation} className="rounded border border-amber-700 px-4 py-2 disabled:opacity-50">Retener lote y corregir ubicación</button>
            </form>
          ) : null}

          {preparation && preparedLotStateResult.data?.status === 'hold' ? (
            <Link href="/qa/raw-materials/create" className="mt-4 inline-flex rounded border px-4 py-2">
              Registrar nueva inspección de Calidad
            </Link>
          ) : null}

          {disposition ? (
            <div
              className={
                'mt-4 rounded border ' +
                'border-amber-300 p-4'
              }
            >
              <strong>
                Disposición:{' '}
                {dispositionLabel[
                  disposition.disposition
                ] ?? disposition.disposition}
              </strong>

              <p className="text-sm text-gray-500">
                {disposition.reason}
              </p>

              {disposition
                .rework_production_order_id ? (
                <Link
                  href={
                    '/production-orders/' +
                    disposition
                      .rework_production_order_id
                  }
                  className={
                    'mt-3 inline-flex rounded ' +
                    'border px-4 py-2'
                  }
                >
                  Ver orden de retrabajo
                </Link>
              ) : null}
            </div>
          ) : null}

          {decision.decision === 'release' &&
          !isRawMaterial &&
          inspection.production_outputs?.id ? (
            <Link
              href={
                '/lots/release?output_id=' +
                inspection.production_outputs.id
              }
              className={
                'mt-4 inline-flex rounded ' +
                'border px-4 py-2'
              }
            >
              Liberar a inventario
            </Link>
          ) : null}

          {decision.decision === 'release' &&
          !isRawMaterial ? (
            <p className="mt-4 text-sm text-green-700">
              El producto terminado está disponible
              en inventario.
            </p>
          ) : null}
        </section>
      ) : (
        <section
          className={
            'grid gap-3 rounded-2xl border p-6 ' +
            'md:grid-cols-3'
          }
        >
          {inspection.status === 'passed' && preparation ? (
            <form
              action={releasePreparedIngredientQualityLot.bind(null, id)}
              className="space-y-3 rounded border p-4 md:col-span-2"
            >
              <h2 className="font-semibold">Liberar ingrediente preparado</h2>
              {preparedMaterialPolicy?.required_storage_condition && preparedMaterialPolicy.default_storage_use && preparedMaterialPolicy.default_inventory_location_id && configuredStorageLocation && storageLocationsResult.data?.length === 1 ? (
                <>
                  <p className="text-sm text-gray-600">La condición y el destino los configura el administrador según la especificación aprobada para este ingrediente. Calidad registra la caducidad interna. Los ingredientes preparados no se congelan.</p>
                  <p className="text-sm">Condición aprobada: <span className="font-medium">{preparedMaterialPolicy.required_storage_condition === 'refrigerated' ? 'Refrigerado' : 'Seco'}</span></p>
                  <input type="hidden" name="storage_condition" value={preparedMaterialPolicy.required_storage_condition} />
                  <p className="text-sm">Destino configurado: <span className="font-medium">{configuredStorageLocation.name}</span> · {preparedMaterialPolicy.default_storage_use === 'prepared_ingredient' ? 'semielaborados' : 'materias primas'}</p>
                  <input type="hidden" name="inventory_location_id" value={configuredStorageLocation.id} />
                </>
              ) : (
                <p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">No se puede liberar: el administrador debe configurar una condición aprobada y un destino activo compatible para esta materia prima.</p>
              )}
              <label className="block text-sm">Caducidad interna
                <input name="expiration_date" type="date" required className="mt-1 w-full rounded border px-3 py-2" />
              </label>
              <label className="block text-sm">Observaciones
                <input name="reason" maxLength={500} className="mt-1 w-full rounded border px-3 py-2" />
              </label>
              <button
                type="submit"
                disabled={!preparedMaterialPolicy?.required_storage_condition || !preparedMaterialPolicy.default_storage_use || !preparedMaterialPolicy.default_inventory_location_id || storageLocationsResult.data?.length !== 1}
                className="w-full rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
              >Liberar a inventario</button>
            </form>
          ) : inspection.status === 'passed' &&
          (isRawMaterial ? (
            <form
              action={decideAction.bind(
                null,
                id,
                'release',
              )}
              className="space-y-2"
            >
              <input
                name="reason"
                placeholder="Observaciones"
                className={
                  'w-full rounded border ' +
                  'px-3 py-2'
                }
              />

              <button
                type="submit"
                className={
                  'w-full rounded border ' +
                  'px-4 py-2'
                }
              >
                Liberar
              </button>
            </form>
          ) : (
            <Link
              href={
                '/lots/release?inspection_id=' +
                id
              }
              className={
                'inline-flex items-center ' +
                'justify-center rounded border ' +
                'px-4 py-2'
              }
            >
              Preparar liberación a inventario
            </Link>
          ))}

          <form
            action={decideAction.bind(
              null,
              id,
              'hold',
            )}
            className="space-y-2"
          >
            <input
              name="reason"
              placeholder="Motivo obligatorio"
              required
              className={
                'w-full rounded border ' +
                'px-3 py-2'
              }
            />

            <button
              type="submit"
              className={
                'w-full rounded border ' +
                'px-4 py-2'
              }
            >
              Retener
            </button>
          </form>

          {isRawMaterial ? (
            <form
              action={decideRawMaterialQualityRelease.bind(
                null,
                id,
                'reject',
              )}
              className="space-y-2"
            >
              <input
                name="reason"
                placeholder="Motivo obligatorio"
                required
                className={
                  'w-full rounded border ' +
                  'px-3 py-2'
                }
              />

              <button
                type="submit"
                className={
                  'w-full rounded border ' +
                  'border-red-300 px-4 py-2'
                }
              >
                Rechazar
              </button>
            </form>
          ) : null}

          {!isRawMaterial &&
          ['hold', 'failed'].includes(
            inspection.status,
          ) &&
          (inspection.result === 'rework' ||
            inspection.result === 'reject') ? (
            <form
              action={
                disposeFinishedProductNonconformance
              }
              className={
                'space-y-3 rounded border ' +
                'border-amber-300 p-4 ' +
                'md:col-span-2'
              }
            >
              <input
                type="hidden"
                name="quality_inspection_id"
                value={id}
              />

              <input
                type="hidden"
                name="idempotency_key"
                value={
                  dispositionIdempotencyKey
                }
              />

              <label className="block text-sm">
                Motivo de la disposición

                <textarea
                  name="reason"
                  required
                  maxLength={500}
                  className={
                    'mt-1 min-h-24 w-full ' +
                    'rounded border px-3 py-2'
                  }
                />
              </label>

              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="submit"
                  name="disposition"
                  value="scrap"
                  className={
                    'rounded border ' +
                    'border-red-400 px-4 py-2'
                  }
                >
                  Descarte
                </button>

                <button
                  type="submit"
                  name="disposition"
                  value="rework"
                  className={
                    'rounded border ' +
                    'border-amber-500 px-4 py-2'
                  }
                >
                  Retrabajo
                </button>
              </div>
            </form>
          ) : null}
        </section>
      )}
    </main>
  );
}
