export type ProductionPriorityInput = {
  status: string;
  plannedStartAt: string | null;
  plannedQuantity: number;
  producedQuantity: number;
};

export type ProductionPriority = {
  isDelayed: boolean;
  progress: number;
  tone: 'critical' | 'warning' | 'info' | 'success';
  label: string;
};

export function getProductionPriority(
  input: ProductionPriorityInput,
  now = new Date(),
): ProductionPriority {
  const progress = input.plannedQuantity > 0
    ? Math.min(100, Math.max(0, Math.round((input.producedQuantity / input.plannedQuantity) * 100)))
    : 0;
  const isClosed = input.status === 'completed' || input.status === 'cancelled';
  const isDelayed = !isClosed && Boolean(
    input.plannedStartAt && new Date(input.plannedStartAt) < now && progress < 100,
  );

  if (isDelayed) return { isDelayed, progress, tone: 'critical', label: 'Atrasada' };
  if (input.status === 'completed') return { isDelayed, progress, tone: 'success', label: 'Completada' };
  if (input.status === 'in_progress') return { isDelayed, progress, tone: 'info', label: 'En producción' };
  return { isDelayed, progress, tone: 'warning', label: 'Pendiente' };
}
