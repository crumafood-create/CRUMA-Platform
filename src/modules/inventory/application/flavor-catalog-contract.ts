import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type FlavorInsert = PublicTableInsert<'flavors'>;
type FlavorUpdate = PublicTableUpdate<'flavors'>;
type FlavorFormSelection = Pick<
  PublicTableRow<'flavors'>,
  'name' | 'slug' | 'description' | 'is_active'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';

  if (!value) throw new Error(`El campo ${field} es obligatorio.`);

  return value;
}

export function buildFlavorInsert(form: FormData): FlavorInsert {
  return {
    name: requiredText(form, 'name'),
    slug: requiredText(form, 'slug'),
    description: form.get('description')?.toString().trim() || null,
    is_active: form.get('is_active') === 'true',
  };
}

export function buildFlavorUpdate(form: FormData, updatedAt: string): FlavorUpdate {
  return { ...buildFlavorInsert(form), updated_at: updatedAt };
}

export function normalizeFlavorFormValues(flavor: FlavorFormSelection) {
  return {
    name: flavor.name,
    slug: flavor.slug,
    description: flavor.description ?? '',
    is_active: flavor.is_active,
  };
}
