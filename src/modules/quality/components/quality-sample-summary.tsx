export type QualitySampleSummary = {
  lotId: string;
  lotNumber: string;
  productName: string;
  immediateInspection: number;
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
