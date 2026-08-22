import { describe, expect, it } from 'vitest';

import {
  assertInventoryItemType,
  assertInventoryMovementType,
  buildInventoryAdjustment,
  buildProductInventoryMovement,
  calculateInventoryBalances,
  requirePositiveQuantity,
} from './inventory-movement-contract';

describe('contrato canónico de movimientos de inventario', () => {
  it.each(['product', 'raw_material'])(
    'acepta un tipo de artículo canónico: %s',
    (itemType) => {
      expect(assertInventoryItemType(itemType)).toBe(itemType);
    },
  );

  it.each(['', 'ingredient', null])(
    'rechaza tipos de artículo fuera del contrato: %j',
    (itemType) => {
      expect(() => assertInventoryItemType(itemType)).toThrow(
        'Tipo de artículo fuera del contrato.',
      );
    },
  );

  it.each(['entry', 'exit', 'adjustment'])(
    'acepta un movimiento manual canónico: %s',
    (movementType) => {
      expect(assertInventoryMovementType(movementType)).toBe(movementType);
    },
  );

  it.each(['', 'transfer', null])(
    'rechaza movimientos manuales fuera del contrato: %j',
    (movementType) => {
      expect(() => assertInventoryMovementType(movementType)).toThrow(
        'Tipo de movimiento fuera del contrato.',
      );
    },
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rechaza cantidades no positivas o no finitas: %j',
    (quantity) => {
      expect(() => requirePositiveQuantity(quantity)).toThrow(
        'La cantidad debe ser positiva y finita.',
      );
    },
  );

  it('acepta cantidades decimales positivas', () => {
    expect(requirePositiveQuantity(0.125)).toBe(0.125);
  });

  it('conserva product_id y completa el contrato item_type/item_id', () => {
    expect(
      buildProductInventoryMovement({
        productId: 'product-1',
        warehouseId: 'warehouse-1',
        movementType: 'entry',
        quantity: 12,
        notes: 'Recepción inicial',
      }),
    ).toEqual({
      product_id: 'product-1',
      item_type: 'product',
      item_id: 'product-1',
      warehouse_id: 'warehouse-1',
      movement_type: 'entry',
      quantity: 12,
      notes: 'Recepción inicial',
    });
  });

  it('completa product_id en ajustes de productos', () => {
    expect(
      buildInventoryAdjustment({
        itemType: 'product',
        itemId: 'product-1',
        movementType: 'exit',
        quantity: 2,
        notes: null,
      }),
    ).toEqual({
      item_type: 'product',
      item_id: 'product-1',
      product_id: 'product-1',
      movement_type: 'exit',
      quantity: 2,
      reference_type: 'manual_adjustment',
      reference_id: null,
      notes: null,
    });
  });

  it('mantiene product_id vacío en ajustes de materias primas', () => {
    expect(
      buildInventoryAdjustment({
        itemType: 'raw_material',
        itemId: 'material-1',
        movementType: 'entry',
        quantity: 4,
        notes: null,
      }).product_id,
    ).toBe(null);
  });

  it('calcula el saldo acumulado y conserva ajustes sin signo explícito', () => {
    const rows = calculateInventoryBalances([
      { movement_type: 'entry', quantity: 10 },
      { movement_type: 'exit', quantity: 3 },
      { movement_type: 'adjustment', quantity: 2 },
      { movement_type: 'entry', quantity: 1 },
    ]);

    expect(rows.map((row) => row.balance)).toEqual([10, 7, 7, 8]);
  });
});
