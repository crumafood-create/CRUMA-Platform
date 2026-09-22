import { recordQualityInspection } from '@/app/(admin)/qa/actions';

type OutputOption = {
  id: string;
  label: string;
  quantity: number;
};

type Props = {
  outputs: OutputOption[];
  initialOutputId?: string;
};

export function QualityInspectionForm({ outputs, initialOutputId }: Props) {
  return (
    <form action={recordQualityInspection} className="space-y-5 rounded-2xl border p-6">
      <label className="block text-sm">
        Salida de producción
        <select
          name="production_output_id"
          defaultValue={initialOutputId ?? ''}
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        >
          <option value="">Selecciona una salida</option>
          {outputs.map((output) => (
            <option key={output.id} value={output.id}>
              {output.label} · {output.quantity} unidades
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        Cantidad muestreada
        <input name="sampled_quantity" type="number" min="1" step="1" required className="mt-1 block w-full rounded border px-3 py-2" />
      </label>

      {[1, 2, 3].map((index) => (
        <fieldset key={index} className="grid gap-3 rounded border p-4 md:grid-cols-4">
          <legend className="px-2 text-sm font-semibold">Criterio {index}</legend>
          <input name={`criterion_${index}`} placeholder="Criterio" required={index === 1} className="rounded border px-3 py-2" />
          <input name={`expected_${index}`} placeholder="Valor esperado" className="rounded border px-3 py-2" />
          <input name={`actual_${index}`} placeholder="Valor observado" className="rounded border px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input name={`passed_${index}`} type="checkbox" />
            Cumple
          </label>
        </fieldset>
      ))}

      <fieldset className="grid gap-3 rounded border p-4 md:grid-cols-3">
        <legend className="px-2 text-sm font-semibold">Defecto opcional</legend>
        <input name="defect_type" placeholder="Tipo de defecto" className="rounded border px-3 py-2" />
        <select name="defect_severity" defaultValue="minor" className="rounded border px-3 py-2">
          <option value="minor">Menor</option>
          <option value="major">Mayor</option>
          <option value="critical">Crítico</option>
        </select>
        <input name="defect_quantity" type="number" min="1" step="1" defaultValue="1" className="rounded border px-3 py-2" />
        <textarea name="defect_description" placeholder="Descripción" className="rounded border px-3 py-2 md:col-span-3" />
      </fieldset>

      <textarea name="notes" placeholder="Notas de inspección" className="w-full rounded border px-3 py-2" />
      <button type="submit" className="rounded border px-4 py-2">Registrar y evaluar</button>
    </form>
  );
}
