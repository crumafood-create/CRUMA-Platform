import type { PublicTableInsert } from '@/infrastructure/integrations/supabase/database.types';

type InventoryMovementInsert = PublicTableInsert<'inventory_movements'>;

export type InventoryItemType = 'product' | 'raw_material';
export type ManualInventoryMovementType = 'entry' | 'exit' | 'adjustment';

type ProductMovementInput = {
  productId: string;
  warehouseId: string;
  movementType: unknown;
  quantity: number;
  notes: string | null;
};

type InventoryAdjustmentInput = {
  itemType: unknown;
  itemId: string;
  movementType: unknown;
  quantity: number;
  notes: string | null;
};

type BalanceMovement = {
  movement_type: string;
  quantity: number;
};

export function assertInventoryItemType(value: unknown): InventoryItemType {
  if (value !== 'product' && value !== 'raw_material') {
    throw new Error('Tipo de artículo fuera del contrato.');
  }

  return value;
}

export function assertInventoryMovementType(
  value: unknown,
): ManualInventoryMovementType {
  if (value !== 'entry' && value !== 'exit' && value !== 'adjustment') {
    throw new Error('Tipo de movimiento fuera del contrato.');
  }

  return value;
}

export function requirePositiveQuantity(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error('La cantidad debe ser positiva y finita.');
  }

  return quantity;
}

export function buildProductInventoryMovement(
  input: ProductMovementInput,
): InventoryMovementInsert {
  if (!input.productId || !input.warehouseId) {
    throw new Error('Producto y almacén son obligatorios.');
  }

  return {
    product_id: input.productId,
    item_type: 'product',
    item_id: input.productId,
    warehouse_id: input.warehouseId,
    movement_type: assertInventoryMovementType(input.movementType),
    quantity: requirePositiveQuantity(input.quantity),
    notes: input.notes,
  };
}

export function buildInventoryAdjustment(
  input: InventoryAdjustmentInput,
): InventoryMovementInsert {
  const itemType = assertInventoryItemType(input.itemType);

  if (!input.itemId) {
    throw new Error('El artículo es obligatorio.');
  }

  return {
    item_type: itemType,
    item_id: input.itemId,
    product_id: itemType === 'product' ? input.itemId : null,
    movement_type: assertInventoryMovementType(input.movementType),
    quantity: requirePositiveQuantity(input.quantity),
    reference_type: 'manual_adjustment',
    reference_id: null,
    notes: input.notes,
  };
}

export function calculateInventoryBalances<Movement extends BalanceMovement>(
  movements: readonly Movement[],
): Array<Movement & { balance: number }> {
  let balance = 0;

  return movements.map((movement) => {
    if (movement.movement_type === 'entry') balance += movement.quantity;
    if (movement.movement_type === 'exit') balance -= movement.quantity;

    return { ...movement, balance };
  });
}
