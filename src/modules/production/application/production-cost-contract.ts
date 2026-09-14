export type ProductionCostRequest = {
  productionOrderId: string;
  laborCost: number;
  overheadCost: number;
};

export type ProductionCostTotals = {
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  unitCost: number;
};

function round(value: number): number {
  return Number(value.toFixed(4));
}

function cost(value: unknown): number {
  if ((typeof value !== 'string' && typeof value !== 'number') || value === '') {
    throw new Error('Los costos deben ser números finitos no negativos.');
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error('Los costos deben ser números finitos no negativos.');
  }
  return round(parsed);
}

export function buildProductionCostRequest(
  formData: FormData,
  productionOrderId: string,
): ProductionCostRequest {
  return {
    productionOrderId,
    laborCost: cost(formData.get('labor_cost')),
    overheadCost: cost(formData.get('overhead_cost')),
  };
}

export function calculateProductionCostTotals(
  material: number,
  labor: number,
  overhead: number,
  produced: number,
): ProductionCostTotals {
  const materialCost = cost(material);
  const laborCost = cost(labor);
  const overheadCost = cost(overhead);
  if (!Number.isFinite(produced) || produced <= 0) {
    throw new Error('La cantidad producida debe ser positiva.');
  }
  const totalCost = round(materialCost + laborCost + overheadCost);
  return { materialCost, laborCost, overheadCost, totalCost, unitCost: round(totalCost / produced) };
}
