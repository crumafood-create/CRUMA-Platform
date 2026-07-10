import type {
  FEFOAllocation,
  RawMaterialLot,
} from '../domain/types';

// ============================================================================
// FEFO ALLOCATION
// ============================================================================

export function buildFEFOAllocation(
  lots: RawMaterialLot[],
  requiredQuantity: number,
): FEFOAllocation[] {
  let remaining = requiredQuantity;

  const allocations: FEFOAllocation[] = [];

  for (const lot of lots) {
    if (remaining <= 0) {
      break;
    }

    const available = Number(lot.quantity);

    if (available <= 0) {
      continue;
    }

    const consumed = Math.min(
      available,
      remaining,
    );

    allocations.push({
      lot_id: lot.id,
      lot_number: lot.lot_number,
      quantity: consumed,
      remaining_quantity:
        available - consumed,
    });

    remaining -= consumed;
  }

  if (remaining > 0) {
    throw new Error(
      `Stock insuficiente. Faltan ${remaining} unidades.`,
    );
  }

  return allocations;
}
