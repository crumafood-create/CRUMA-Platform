import type {
  PublicTableInsert,
  PublicTableRow,
  PublicTableUpdate,
} from '@/infrastructure/integrations/supabase/database.types';

type SupplierInsert = PublicTableInsert<'suppliers'>;
type SupplierUpdate = PublicTableUpdate<'suppliers'>;
type SupplierFormSelection = Pick<
  PublicTableRow<'suppliers'>,
  | 'name' | 'business_name' | 'tax_id' | 'email' | 'phone'
  | 'contact_name' | 'address' | 'notes' | 'is_active'
>;

function requiredText(form: FormData, field: string): string {
  const value = form.get(field)?.toString().trim() ?? '';
  if (!value) throw new Error(`El campo ${field} es obligatorio.`);
  return value;
}

function optionalText(form: FormData, field: string): string | null {
  return form.get(field)?.toString().trim() || null;
}

function supplierEmail(form: FormData): string | null {
  const email = optionalText(form, 'email')?.toLowerCase() ?? null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('El correo del proveedor no es válido.');
  }
  return email;
}

function activeState(form: FormData): boolean {
  const value = form.get('is_active')?.toString() ?? 'true';
  if (value !== 'true' && value !== 'false') {
    throw new Error('Estado de proveedor inválido.');
  }
  return value === 'true';
}

export function buildSupplierInsert(form: FormData): SupplierInsert {
  return {
    name: requiredText(form, 'name'),
    business_name: optionalText(form, 'business_name'),
    tax_id: optionalText(form, 'tax_id')?.toUpperCase() ?? null,
    email: supplierEmail(form),
    phone: optionalText(form, 'phone'),
    contact_name: optionalText(form, 'contact_name'),
    address: optionalText(form, 'address'),
    notes: optionalText(form, 'notes'),
    is_active: activeState(form),
  };
}

export function buildSupplierUpdate(form: FormData, updatedAt: string): SupplierUpdate {
  return { ...buildSupplierInsert(form), updated_at: updatedAt };
}

export function normalizeSupplierFormValues(supplier: SupplierFormSelection) {
  return {
    name: supplier.name,
    business_name: supplier.business_name ?? '',
    tax_id: supplier.tax_id ?? '',
    email: supplier.email ?? '',
    phone: supplier.phone ?? '',
    contact_name: supplier.contact_name ?? '',
    address: supplier.address ?? '',
    notes: supplier.notes ?? '',
    is_active: supplier.is_active,
  };
}
