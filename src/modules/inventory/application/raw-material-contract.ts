import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type RawMaterialInsert = PublicTableInsert<'raw_materials'>;
type RawMaterialUpdate = PublicTableUpdate<'raw_materials'>;
type RawMaterialCatalogFields = Pick<
  RawMaterialInsert,
  | 'name'
  | 'slug'
  | 'internal_code'
  | 'category_id'
  | 'family_id'
  | 'unit_of_measure_id'
  | 'minimum_stock'
  | 'description'
  | 'is_active'
  | 'required_storage_condition'
  | 'default_storage_use'
  | 'default_inventory_location_id'
>;

type RawMaterialFormSelection = Pick<
  PublicTableRow<'raw_materials'>,
  | 'name'
  | 'slug'
  | 'internal_code'
  | 'category_id'
  | 'family_id'
  | 'unit_of_measure_id'
  | 'current_stock'
  | 'minimum_stock'
  | 'average_cost'
  | 'last_cost'
  | 'description'
  | 'is_active'
  | 'required_storage_condition'
  | 'default_storage_use'
  | 'default_inventory_location_id'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function optionalText(form: FormData, field: string): string | null {
  return form.get(field)?.toString().trim() || null;
}

function nonNegativeNumber(form: FormData, field: string): number {
  const quantity = Number(form.get(field)?.toString().trim() || 0);

  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new Error(`El campo ${field} debe ser un número no negativo y finito.`);
  }

  return quantity;
}

function buildStoragePolicyFields(form: FormData): Pick<
  RawMaterialCatalogFields,
  'required_storage_condition' | 'default_storage_use' | 'default_inventory_location_id'
> {
  const condition = optionalText(form, 'required_storage_condition');
  const use = optionalText(form, 'default_storage_use');
  const locationId = optionalText(form, 'default_inventory_location_id');

  if ((condition === null) !== (use === null)) {
    throw new Error('Configura juntos el uso y la condición de conservación.');
  }
  if (condition !== null && !['dry', 'refrigerated'].includes(condition)) {
    throw new Error('La condición del ingrediente debe ser seco o refrigerado.');
  }
  if (use !== null && !['raw_material', 'prepared_ingredient'].includes(use)) {
    throw new Error('El uso del destino debe ser materia prima o ingrediente preparado.');
  }
  if (locationId !== null && (condition === null || use === null)) {
    throw new Error('Configura el uso y la condición antes de asignar una ubicación habitual.');
  }

  return {
    required_storage_condition: condition,
    default_storage_use: use,
    default_inventory_location_id: locationId,
  };
}

function buildRawMaterialCatalogFields(form: FormData): RawMaterialCatalogFields {
  const categoryId = optionalText(form, 'category_id');
  const familyId = optionalText(form, 'family_id');

  if (familyId && !categoryId) {
    throw new Error('La familia de una materia prima requiere una categoría.');
  }

  return {
    name: requiredText(form, 'name'),
    slug: requiredText(form, 'slug'),
    internal_code: optionalText(form, 'internal_code'),
    category_id: categoryId,
    family_id: familyId,
    unit_of_measure_id: optionalText(form, 'unit_of_measure_id'),
    minimum_stock: nonNegativeNumber(form, 'minimum_stock'),
    description: optionalText(form, 'description'),
    is_active: form.get('is_active') === 'true',
    ...buildStoragePolicyFields(form),
  };
}

export function buildRawMaterialInsert(form: FormData): RawMaterialInsert {
  return {
    ...buildRawMaterialCatalogFields(form),
    current_stock: nonNegativeNumber(form, 'current_stock'),
    average_cost: nonNegativeNumber(form, 'average_cost'),
    last_cost: nonNegativeNumber(form, 'last_cost'),
  };
}

export function buildRawMaterialUpdate(
  form: FormData,
  updatedAt: string,
): RawMaterialUpdate {
  const { unit_of_measure_id, ...catalogFields } =
    buildRawMaterialCatalogFields(form);

  return {
    ...catalogFields,
    ...(form.has('unit_of_measure_id') ? { unit_of_measure_id } : {}),
    updated_at: updatedAt,
  };
}

export function normalizeRawMaterialFormValues(material: RawMaterialFormSelection) {
  return {
    name: material.name,
    slug: material.slug,
    internal_code: material.internal_code ?? '',
    category_id: material.category_id ?? '',
    family_id: material.family_id ?? '',
    unit_of_measure_id: material.unit_of_measure_id ?? '',
    current_stock: material.current_stock,
    minimum_stock: material.minimum_stock,
    average_cost: material.average_cost,
    last_cost: material.last_cost,
    description: material.description ?? '',
    is_active: material.is_active,
    required_storage_condition: material.required_storage_condition ?? '',
    default_storage_use: material.default_storage_use ?? '',
    default_inventory_location_id: material.default_inventory_location_id ?? '',
  };
}

