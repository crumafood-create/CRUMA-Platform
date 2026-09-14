export type ProductionLotReleaseRequest = {
  productionOutputId: string;
  lotNumber: string;
  expirationDate: string;
  warehouseId: string;
  inventoryLocationId: string;
};

function required(formData: FormData, key: string, message: string): string {
  const value = formData.get(key)?.toString().trim() ?? '';
  if (!value) throw new Error(message);
  return value;
}

function normalizedLotNumber(value: string): string {
  const normalized = value.toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._/-]{1,39}$/.test(normalized)) {
    throw new Error('El número de lote contiene caracteres no permitidos.');
  }
  return normalized;
}

function validDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error('La fecha de caducidad no es válida.');
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error('La fecha de caducidad no es válida.');
  }
  return value;
}

export function buildProductionLotReleaseRequest(
  formData: FormData,
): ProductionLotReleaseRequest {
  const productionOutputId = required(
    formData, 'production_output_id', 'La salida de producción es obligatoria.',
  );
  const lotNumber = normalizedLotNumber(required(
    formData, 'lot_number', 'El número de lote es obligatorio.',
  ));
  const expirationDate = validDate(required(
    formData, 'expiration_date', 'La fecha de caducidad es obligatoria.',
  ));
  const warehouseId = required(formData, 'warehouse_id', 'El almacén es obligatorio.');
  const inventoryLocationId = required(
    formData, 'inventory_location_id', 'La ubicación es obligatoria.',
  );
  return {
    productionOutputId,
    lotNumber,
    expirationDate,
    warehouseId,
    inventoryLocationId,
  };
}
