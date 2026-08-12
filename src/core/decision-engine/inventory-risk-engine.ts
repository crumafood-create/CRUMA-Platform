import {
  ExecutiveDecision,
  ExecutivePriority,
} from '@/shared/types/executive';

interface InventoryRiskInput {
  productId: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  tenantId: string;
}

export function analyzeInventoryRisk(
  input: InventoryRiskInput,
): ExecutiveDecision | null {
  const {
    productName,
    currentStock,
    minimumStock,
    tenantId,
  } = input;

  if (currentStock > minimumStock) {
    return null;
  }

  const shortage = minimumStock - currentStock;

  let priority: ExecutivePriority = 'medium';

  if (currentStock <= 0) {
    priority = 'critical';
  } else if (currentStock <= minimumStock * 0.25) {
    priority = 'high';
  }

  return {
    id: crypto.randomUUID(),
    tenantId,
    domain: 'inventory',
    title: `Riesgo de inventario: ${productName}`,
    summary: `Stock actual ${currentStock}. Se recomienda reabastecer ${shortage} unidades.`,
    priority,
    status: 'recommended',
    confidence: 0.92,
    impactEstimate: 'Evitar interrupción de producción',
    createdAt: new Date().toISOString(),
  };
}
