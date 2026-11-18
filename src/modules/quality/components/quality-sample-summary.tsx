import Link from 'next/link';

export type QualitySampleSummary = {
  lotId: string;
  lotNumber: string;
  productName: string;
  immediateInspection: number;
  immediateSampleId: string | null;
  safetyRetention: number;
};

export function QualitySampleSummary({
  samples,
}: {
  samples: readonly QualitySampleSummary[];
}) {
  if (samples.length === 0) return null;

  return (
    <section aria-labelledby="quality-samples-title" className="space-y-3 rounded-2xl border p-6">
      <h2 id="quality-samples-title" className="text-lg font-semibold">
        Muestras apartadas para Calidad
      </h2>
      {samples.map((sample) => (
        <div key={sample.lotId} className="rounded border p-4">
          <h3 className="font-medium">
            {sample.productName} · lote {sample.lotNumber}
          </h3>
          <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt>Inspección inmediata</dt>
              <dd>{sample.immediateInspection} piezas</dd>
              {sample.immediateSampleId ? (
                <Link
                  href={`/qa/samples/${sample.immediateSampleId}/inspect`}
                  className="mt-2 inline-flex rounded border px-3 py-2"
                >
                  Inspeccionar muestra
                </Link>
              ) : null}
            </div>
            <div>
              <dt>Retención de seguridad</dt>
              <dd>{sample.safetyRetention} piezas</dd>
            </div>
          </dl>
        </div>
      ))}
    </section>
  );
}
