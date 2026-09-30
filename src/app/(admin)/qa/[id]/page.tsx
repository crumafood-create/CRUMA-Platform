import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  createTypedClient,
} from '@/infrastructure/integrations/supabase/server';

import {
  decideQualityRelease,
  decideRawMaterialQualityRelease,
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

  const [
    { data: items },
    { data: defects },
    { data: decision },
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
  ]);

  const isRawMaterial =
    inspection.subject_type === 'raw_material_lot';

  const subjectName = isRawMaterial
    ? inspection.raw_material_lots
        ?.raw_materials?.name ??
      'Materia prima'
    : inspection.production_outputs
        ?.products?.name ??
      'Producto terminado';

  const subjectReference = isRawMaterial
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
            {isRawMaterial
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

      {decision ? (
        <section className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">
            Decisión:{' '}
            {decisionLabel[decision.decision] ??
              decision.decision}
          </h2>

          <p className="text-sm text-gray-500">
            {decision.reason ??
              'Sin observaciones'}
          </p>

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
                    {inspection.status === 'passed' &&
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

          {(['hold', 'reject'] as const).map(
            (decisionValue) => (
              <form
                key={decisionValue}
                action={decideAction.bind(
                  null,
                  id,
                  decisionValue,
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
                  {decisionValue === 'hold'
                    ? 'Retener'
                    : 'Rechazar'}
                </button>
              </form>
            ),
          )}
        </section>
      )}
    </main>
  );
}