'use client';

interface Values {
  customer_code?: string; customer_type?: string; name?: string; company_name?: string;
  tax_id?: string; email?: string; phone?: string; mobile?: string; address?: string;
  city?: string; state?: string; postal_code?: string; notes?: string;
  credit_limit?: number; is_active?: boolean;
}

interface Props { action: (formData: FormData) => Promise<void>; initialValues?: Values }
type Field = { name: keyof Values; label: string; type?: string; required?: boolean };

const CONTACT: Field[] = [
  { name: 'customer_code', label: 'Código' }, { name: 'name', label: 'Nombre', required: true },
  { name: 'company_name', label: 'Empresa' }, { name: 'tax_id', label: 'RFC' },
  { name: 'email', label: 'Email', type: 'email' }, { name: 'phone', label: 'Teléfono' },
  { name: 'mobile', label: 'Celular' }, { name: 'city', label: 'Ciudad' },
  { name: 'state', label: 'Estado' }, { name: 'postal_code', label: 'Código Postal' },
  { name: 'credit_limit', label: 'Límite de Crédito', type: 'number' },
];

function Input({ field, values }: { field: Field; values: Values | undefined }) {
  return (
    <label className="space-y-2 font-medium">
      <span className="block">{field.label}{field.required ? ' *' : ''}</span>
      <input
        name={field.name} type={field.type} required={field.required}
        step={field.type === 'number' ? '0.01' : undefined}
        defaultValue={values?.[field.name]?.toString() ?? ''}
        className="w-full rounded-lg border p-3"
      />
    </label>
  );
}

function TextArea({ name, label, values }: { name: 'address' | 'notes'; label: string; values: Values | undefined }) {
  return (
    <label className="space-y-2 font-medium md:col-span-2">
      <span className="block">{label}</span>
      <textarea name={name} rows={3} defaultValue={values?.[name] ?? ''} className="w-full rounded-lg border p-3" />
    </label>
  );
}

export function CustomerForm({ action, initialValues }: Props) {
  return (
    <form action={action} className="space-y-8 rounded-2xl border bg-white p-6">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Información General</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 font-medium">
            <span className="block">Tipo</span>
            <select name="customer_type" defaultValue={initialValues?.customer_type ?? 'individual'} className="w-full rounded-lg border p-3">
              <option value="individual">Particular</option><option value="business">Empresa</option>
            </select>
          </label>
          {CONTACT.map((field) => <Input key={field.name} field={field} values={initialValues} />)}
          <TextArea name="address" label="Dirección" values={initialValues} />
          <TextArea name="notes" label="Notas" values={initialValues} />
        </div>
      </section>
      <label className="space-y-2 font-medium">
        <span className="block">Estado</span>
        <select name="is_active" defaultValue={initialValues?.is_active === false ? 'false' : 'true'} className="rounded-lg border p-3">
          <option value="true">Activo</option><option value="false">Inactivo</option>
        </select>
      </label>
      <div className="border-t pt-6">
        <button type="submit" className="rounded-lg border bg-blue-50 px-6 py-3 font-medium text-blue-700 hover:bg-blue-100">Guardar Cliente</button>
      </div>
    </form>
  );
}
