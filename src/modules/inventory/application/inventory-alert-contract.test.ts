import { describe, expect, it } from 'vitest';

import {
  collectInventoryAlertIds,
  resolveInventoryAlerts,
} from './inventory-alert-contract';

const products = [
  { id: 'product-1', name: 'Empanada', internal_code: 'PT-EMP', min_stock: 5 },
];

const materials = [
  { id: 'material-1', name: 'Harina', internal_code: 'MP-HAR', minimum_stock: 3 },
];

describe('contrato tipado de alertas de inventario', () => {
  it('identifica productos y materias primas sin duplicar identificadores', () => {
    expect(
      collectInventoryAlertIds([
        { item_type: 'product', item_id: 'product-1', quantity: 1 },
        { item_type: 'product', item_id: 'product-1', quantity: 2 },
        { item_type: 'raw_material', item_id: 'material-1', quantity: 3 },
      ]),
    ).toEqual({ productIds: ['product-1'], materialIds: ['material-1'] });
  });

  it('descarta filas con identificadores o tipos no válidos', () => {
    expect(
      collectInventoryAlertIds([
        { item_type: null, item_id: 'product-1', quantity: 1 },
        { item_type: 'product', item_id: null, quantity: 1 },
        { item_type: 'ingredient', item_id: 'material-1', quantity: 1 },
      ]),
    ).toEqual({ productIds: [], materialIds: [] });
  });

  it('emite alertas cuando el stock coincide con el mínimo', () => {
    const alerts = resolveInventoryAlerts(
      [{ item_type: 'product', item_id: 'product-1', quantity: 5 }],
      products,
      materials,
    );

    expect(alerts).toEqual([
      {
        item_type: 'product',
        item_id: 'product-1',
        quantity: 5,
        name: 'Empanada',
        internal_code: 'PT-EMP',
        minimum: 5,
      },
    ]);
  });

  it('omite artículos cuyo stock está por encima del mínimo', () => {
    expect(
      resolveInventoryAlerts(
        [{ item_type: 'raw_material', item_id: 'material-1', quantity: 4 }],
        products,
        materials,
      ),
    ).toEqual([]);
  });

  it('normaliza cantidades nulas a cero y conserva artículos críticos', () => {
    const alerts = resolveInventoryAlerts(
      [{ item_type: 'raw_material', item_id: 'material-1', quantity: null }],
      products,
      materials,
    );

    expect(alerts[0]?.quantity).toBe(0);
    expect(alerts[0]?.minimum).toBe(3);
  });

  it('omite referencias inexistentes en sus catálogos', () => {
    expect(
      resolveInventoryAlerts(
        [{ item_type: 'product', item_id: 'missing', quantity: 0 }],
        products,
        materials,
      ),
    ).toEqual([]);
  });

  it('normaliza umbrales de productos sin stock mínimo definido', () => {
    const alerts = resolveInventoryAlerts(
      [{ item_type: 'product', item_id: 'product-1', quantity: 0 }],
      [{ ...products[0]!, min_stock: null }],
      materials,
    );

    expect(alerts[0]?.minimum).toBe(0);
  });
});
