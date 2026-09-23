import type { PublicTableInsert, PublicTableRow, PublicTableUpdate } from '@/infrastructure/integrations/supabase/database.types';

type CustomerInsert = PublicTableInsert<'customers'>;
type CustomerUpdate = PublicTableUpdate<'customers'>;
type CustomerFormValues = Pick<PublicTableRow<'customers'>,
  'customer_code' | 'customer_type' | 'name' | 'company_name' | 'tax_id' | 'email' |
  'phone' | 'mobile' | 'address' | 'city' | 'state' | 'postal_code' | 'notes' |
  'credit_limit' | 'is_active'>;

const optional = (form: FormData, field: string) => form.get(field)?.toString().trim() || null;

function email(form: FormData): string | null {
  const value = optional(form, 'email')?.toLowerCase() ?? null;
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('El correo del cliente no es válido.');
  return value;
}

function type(form: FormData): 'individual' | 'business' {
  const value = form.get('customer_type')?.toString();
  if (value !== 'individual' && value !== 'business') throw new Error('Tipo de cliente inválido.');
  return value;
}

function active(form: FormData): boolean {
  const value = form.get('is_active')?.toString() ?? 'true';
  if (value !== 'true' && value !== 'false') throw new Error('Estado de cliente inválido.');
  return value === 'true';
}

function creditLimit(form: FormData): number {
  const value = Number(form.get('credit_limit')?.toString().trim() || '0');
  if (!Number.isFinite(value) || value < 0) throw new Error('El límite de crédito no es válido.');
  return value;
}

export function buildCustomerInsert(form: FormData, generatedCode: string): CustomerInsert {
  const name = form.get('name')?.toString().trim() ?? '';
  if (!name) throw new Error('El nombre del cliente es obligatorio.');
  return {
    customer_code: (optional(form, 'customer_code') ?? generatedCode).toUpperCase(),
    customer_type: type(form), name, company_name: optional(form, 'company_name'),
    tax_id: optional(form, 'tax_id')?.toUpperCase() ?? null, email: email(form),
    phone: optional(form, 'phone'), mobile: optional(form, 'mobile'), address: optional(form, 'address'),
    city: optional(form, 'city'), state: optional(form, 'state'), postal_code: optional(form, 'postal_code'),
    notes: optional(form, 'notes'), credit_limit: creditLimit(form), is_active: active(form),
  };
}

export function buildCustomerUpdate(form: FormData, updatedAt: string): CustomerUpdate {
  const name = form.get('name')?.toString().trim() ?? '';
  if (!name) throw new Error('El nombre del cliente es obligatorio.');

  return {
    customer_type: type(form),
    name,
    company_name: optional(form, 'company_name'),
    tax_id: optional(form, 'tax_id')?.toUpperCase() ?? null,
    email: email(form),
    phone: optional(form, 'phone'),
    mobile: optional(form, 'mobile'),
    address: optional(form, 'address'),
    city: optional(form, 'city'),
    state: optional(form, 'state'),
    postal_code: optional(form, 'postal_code'),
    notes: optional(form, 'notes'),
    credit_limit: creditLimit(form),
    is_active: active(form),
    updated_at: updatedAt,
  };
}

export function normalizeCustomerFormValues(customer: CustomerFormValues) {
  return Object.fromEntries(Object.entries(customer).map(([key, value]) => [key, value ?? '']));
}
