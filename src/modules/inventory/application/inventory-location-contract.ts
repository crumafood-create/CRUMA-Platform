import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type LocationInsert = PublicTableInsert<'inventory_locations'>;
type LocationUpdate = PublicTableUpdate<'inventory_locations'>;
type LocationFormSelection = Pick<
  PublicTableRow<'inventory_locations'>,
  | 'id'
  | 'slug'
  | 'name'
  | 'description'
  | 'zone'
  | 'aisle'
  | 'rack'
  | 'level'
  | 'position'
  | 'is_active'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function nonNegativeInteger(form: FormData, field: string): number {
  const value = Number(form.get(field)?.toString().trim() || 0);

  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`El campo ${field} debe ser un entero no negativo y seguro.`);
  }

  return value;
}

export function buildInventoryLocationInsert(form: FormData): LocationInsert {
  return {
    slug: requiredText(form, 'slug').toUpperCase().replace(/\s+/g, '-'),
    name: requiredText(form, 'name'),
    description: form.get('description')?.toString().trim() || null,
    zone: requiredText(form, 'zone'),
    aisle: nonNegativeInteger(form, 'aisle'),
    rack: nonNegativeInteger(form, 'rack'),
    level: nonNegativeInteger(form, 'level'),
    position: nonNegativeInteger(form, 'position'),
    is_active: form.get('is_active') === 'on',
  };
}

export function buildInventoryLocationUpdate(
  form: FormData,
  updatedAt: string,
): LocationInsert & LocationUpdate {
  return { ...buildInventoryLocationInsert(form), updated_at: updatedAt };
}

export function normalizeInventoryLocationFormValues(location: LocationFormSelection) {
  return {
    ...location,
    zone: location.zone ?? '',
    aisle: location.aisle ?? 0,
    rack: location.rack ?? 0,
    level: location.level ?? 0,
    position: location.position ?? 0,
    is_active: location.is_active ?? true,
  };
}
