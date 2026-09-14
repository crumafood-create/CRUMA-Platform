import { calculateProductionCost } from '@/app/(admin)/production-costs/actions';

type Props = {
  productionOrderId: string;
  laborCost?: number;
  overheadCost?: number;
};

export function ProductionCostForm({
  productionOrderId,
  laborCost = 0,
  overheadCost = 0,
}: Props) {
  return (
    <form action={calculateProductionCost.bind(null, productionOrderId)} className="flex flex-wrap gap-3 rounded border p-3">
      <label className="text-sm">
        Mano de obra
        <input name="labor_cost" type="number" min="0" step="0.0001" defaultValue={laborCost} required className="ml-2 w-28 rounded border px-2 py-1" />
      </label>
      <label className="text-sm">
        Indirectos
        <input name="overhead_cost" type="number" min="0" step="0.0001" defaultValue={overheadCost} required className="ml-2 w-28 rounded border px-2 py-1" />
      </label>
      <button type="submit" className="rounded border px-4 py-1">Calcular costos</button>
    </form>
  );
}
