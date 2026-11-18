export type CheeseStickPresentation = 'party' | 'traditional';

export interface CheeseCutRequest {
  sourceLotId: string;
  presentation: CheeseStickPresentation;
  stickMaterialId: string;
  trimMaterialId: string;
  sourceQuantityKg: number;
  pieceCount: number;
  stickWeightKg: number;
  trimWeightKg: number;
  wasteWeightKg: number;
  idempotencyKey: string;
  reason: string;
}

export interface CheeseGratingRequest {
  trimLotId: string;
  gratedMaterialId: string;
  sourceQuantityKg: number;
  gratedWeightKg: number;
  wasteWeightKg: number;
  idempotencyKey: string;
  reason: string;
}

function text(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function decimal(form: FormData, field: string, allowZero = false): number {
  const value = Number(form.get(field)?.toString());
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new Error(`El campo ${field} debe ser ${allowZero ? 'no negativo' : 'mayor que cero'}.`);
  }
  if (Math.round(value * 10000) !== value * 10000) {
    throw new Error(`El campo ${field} admite hasta cuatro decimales.`);
  }
  return value;
}

function uuid(form: FormData, field: string): string {
  const value = text(form, field);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`El campo ${field} no es válido.`);
  }
  return value;
}

export function buildCheeseCutRequest(form: FormData): CheeseCutRequest {
  const presentation = text(form, 'presentation');
  if (presentation !== 'party' && presentation !== 'traditional') {
    throw new Error('Selecciona Party o tradicional.');
  }
  const request: CheeseCutRequest = {
    sourceLotId: uuid(form, 'source_lot_id'),
    presentation,
    stickMaterialId: uuid(form, 'stick_material_id'),
    trimMaterialId: uuid(form, 'trim_material_id'),
    sourceQuantityKg: decimal(form, 'source_quantity_kg'),
    pieceCount: Number(text(form, 'piece_count')),
    stickWeightKg: decimal(form, 'stick_weight_kg'),
    trimWeightKg: decimal(form, 'trim_weight_kg', true),
    wasteWeightKg: decimal(form, 'waste_weight_kg', true),
    idempotencyKey: uuid(form, 'idempotency_key'),
    reason: text(form, 'reason'),
  };
  if (!Number.isSafeInteger(request.pieceCount) || request.pieceCount <= 0) {
    throw new Error('El conteo de palitos debe ser un entero mayor que cero.');
  }
  if (request.stickMaterialId === request.trimMaterialId) {
    throw new Error('Los palitos y el recorte deben usar existencias distintas.');
  }
  if (request.stickWeightKg + request.trimWeightKg + request.wasteWeightKg > request.sourceQuantityKg) {
    throw new Error('Las salidas y la merma exceden el peso de queso retirado.');
  }
  return request;
}

export function buildCheeseGratingRequest(form: FormData): CheeseGratingRequest {
  const request: CheeseGratingRequest = {
    trimLotId: uuid(form, 'trim_lot_id'),
    gratedMaterialId: uuid(form, 'grated_material_id'),
    sourceQuantityKg: decimal(form, 'source_quantity_kg'),
    gratedWeightKg: decimal(form, 'grated_weight_kg'),
    wasteWeightKg: decimal(form, 'waste_weight_kg', true),
    idempotencyKey: uuid(form, 'idempotency_key'),
    reason: text(form, 'reason'),
  };
  if (request.gratedWeightKg + request.wasteWeightKg > request.sourceQuantityKg) {
    throw new Error('El queso rallado y la merma exceden el peso de recorte de entrada.');
  }
  return request;
}
