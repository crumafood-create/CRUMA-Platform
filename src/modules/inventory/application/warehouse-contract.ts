import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type WarehouseInsert = PublicTableInsert<'warehouses'>;
type WarehouseUpdate = PublicTableUpdate<'warehouses'>;
type WarehouseFormSelection = Pick<
  PublicTableRow<'warehouses'>,
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
    throw new Error('Estado de almacén inválido.');
  }

  return value === 'true';
}

export function buildWarehouseInsert(form: FormData): WarehouseInsert {
  return {
    name: requiredText(form, 'name'),
    code: requiredText(form, 'code').toUpperCase(),
    description: form.get('description')?.toString().trim() || null,
    is_active: activeState(form),
  };
}

export function buildWarehouseUpdate(
  form: FormData,
  updatedAt: string,
): WarehouseUpdate {
  return { ...buildWarehouseInsert(form), updated_at: updatedAt };
}

export function normalizeWarehouseFormValues(warehouse: WarehouseFormSelection) {
  return {
    name: warehouse.name,
    code: warehouse.code,
    description: warehouse.description ?? '',
    is_active: warehouse.is_active,
  };
}
