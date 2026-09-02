'use client';

interface SupplierFormValues {
  name?: string;
  business_name?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  contact_name?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}

interface FieldProps {
  field: keyof SupplierFormValues;
  label: string;
  values?: SupplierFormValues | undefined;
  required?: boolean;
  type?: 'email' | 'text' | undefined;
}

const SHORT_FIELDS = [
  ['name', 'Nombre Comercial *', true, 'text'],
  ['business_name', 'Razón Social', false, 'text'],
  ['tax_id', 'RFC', false, 'text'],
  ['contact_name', 'Contacto', false, 'text'],
  ['email', 'Email', false, 'email'],
  ['phone', 'Teléfono', false, 'text'],
] as const;

function ShortField({ field, label, values, required, type }: FieldProps) {
  const value = values?.[field];
  return (
    <div>
      <label className="mb-2 block font-medium">{label}</label>
      <input
        type={type}
        name={field}
        required={required}
        defaultValue={typeof value === 'string' ? value : ''}
        className="w-full rounded-lg border p-3"
      />
    </div>
  );
}

function LongField({ field, label, values }: FieldProps) {
  const value = values?.[field];
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block font-medium">{label}</label>
      <textarea
        rows={3}
        name={field}
        defaultValue={typeof value === 'string' ? value : ''}
        className="w-full rounded-lg border p-3"
      />
    </div>
  );
}

function SupplierFields({ values }: { values?: SupplierFormValues | undefined }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {SHORT_FIELDS.map(([field, label, required, type]) => (
        <ShortField
          key={field}
          field={field}
          label={label}
          values={values}
          required={required}
          type={type}
        />
      ))}
      <LongField field="address" label="Dirección" values={values} />
      <LongField field="notes" label="Notas" values={values} />
    </div>
  );
}

interface SupplierFormProps {
  action: (formData: FormData) => Promise<void>;
  initialValues?: SupplierFormValues | undefined;
}

export function SupplierForm({ action, initialValues }: SupplierFormProps) {
  return (
    <form action={action} className="space-y-8 rounded-2xl border bg-white p-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Información General</h2>
        <SupplierFields values={initialValues} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Configuración</h2>
        <select
          name="is_active"
          defaultValue={initialValues?.is_active === false ? 'false' : 'true'}
          className="rounded-lg border p-3"
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </section>

      <div className="border-t pt-6">
        <button
          type="submit"
          className="rounded-lg border bg-blue-50 px-6 py-3 font-medium text-blue-700 hover:bg-blue-100"
        >
          Guardar Proveedor
        </button>
      </div>
    </form>
  );
}
