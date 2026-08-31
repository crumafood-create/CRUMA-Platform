import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type UnitInsert = PublicTableInsert<'units_of_measure'>;
type UnitUpdate = PublicTableUpdate<'units_of_measure'>;
type UnitFormSelection = Pick<
  PublicTableRow<'units_of_measure'>,
  'name' | 'code' | 'description' | 'is_active'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

function activeState(form: FormData): boolean {
  const value = form.get('is_active')?.toString() ?? 'true';

  if (value !== 'true' && value !== 'false') {
    throw new Error('Estado de unidad de medida inválido.');
  }

  return value === 'true';
}

export function buildUnitOfMeasureInsert(form: FormData): UnitInsert {
  return {
    name: requiredText(form, 'name'),
    code: requiredText(form, 'code'),
    description: form.get('description')?.toString().trim() || null,
    is_active: activeState(form),
  };
}

export function buildUnitOfMeasureUpdate(
  form: FormData,
  updatedAt: string,
): UnitUpdate {
  return { ...buildUnitOfMeasureInsert(form), updated_at: updatedAt };
}

export function normalizeUnitOfMeasureFormValues(unit: UnitFormSelection) {
  return {
    name: unit.name,
    code: unit.code,
    description: unit.description ?? '',
    is_active: unit.is_active,
  };
}
