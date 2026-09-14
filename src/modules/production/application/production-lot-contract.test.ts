import { describe, expect, it } from 'vitest';

import { buildProductionLotReleaseRequest } from './production-lot-contract';

function validForm(): FormData {
  const data = new FormData();
  data.set('production_output_id', 'a1000000-0000-0000-0000-000000000001');
  data.set('lot_number', '  pt-2026/001  ');
  data.set('expiration_date', '2099-12-31');
  data.set('warehouse_id', 'a2000000-0000-0000-0000-000000000001');
  data.set('inventory_location_id', 'a3000000-0000-0000-0000-000000000001');
  return data;
}

describe('contrato de liberación de lotes producidos', () => {
  it('normaliza el lote y conserva sus referencias operativas', () => {
    expect(buildProductionLotReleaseRequest(validForm())).toEqual({
      productionOutputId: 'a1000000-0000-0000-0000-000000000001',
      lotNumber: 'PT-2026/001',
      expirationDate: '2099-12-31',
      warehouseId: 'a2000000-0000-0000-0000-000000000001',
      inventoryLocationId: 'a3000000-0000-0000-0000-000000000001',
    });
  });

  it.each([
    ['production_output_id', 'La salida de producción es obligatoria.'],
    ['lot_number', 'El número de lote es obligatorio.'],
    ['expiration_date', 'La fecha de caducidad es obligatoria.'],
    ['warehouse_id', 'El almacén es obligatorio.'],
    ['inventory_location_id', 'La ubicación es obligatoria.'],
  ])('exige %s', (field, message) => {
    const data = validForm();
    data.delete(field);
    expect(() => buildProductionLotReleaseRequest(data)).toThrow(message);
  });

  it('rechaza formatos ambiguos de lote y fecha', () => {
    const badLot = validForm();
    badLot.set('lot_number', 'lote con espacios');
    expect(() => buildProductionLotReleaseRequest(badLot)).toThrow(
      'El número de lote contiene caracteres no permitidos.',
    );

    const badDate = validForm();
    badDate.set('expiration_date', '31/12/2099');
    expect(() => buildProductionLotReleaseRequest(badDate)).toThrow(
      'La fecha de caducidad no es válida.',
    );
  });
});
