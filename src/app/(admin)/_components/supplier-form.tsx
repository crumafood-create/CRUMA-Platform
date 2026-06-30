'use client';

interface SupplierFormProps {
  action: (formData: FormData) => Promise<void>;

  initialValues?: {
    name?: string;
    business_name?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    contact_name?: string;
    address?: string;
    notes?: string;
    is_active?: boolean;
  };
}

export function SupplierForm({
  action,
  initialValues,
}: SupplierFormProps) {
  return (
    <form
      action={action}
      className="space-y-8 rounded-2xl border bg-white p-6"
    >
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Información General
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Nombre Comercial *
            </label>

            <input
              name="name"
              required
              defaultValue={initialValues?.name ?? ''}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Razón Social
            </label>

            <input
              name="business_name"
              defaultValue={
                initialValues?.business_name ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              RFC
            </label>

            <input
              name="tax_id"
              defaultValue={
                initialValues?.tax_id ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Contacto
            </label>

            <input
              name="contact_name"
              defaultValue={
                initialValues?.contact_name ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>

            <input
              type="email"
              name="email"
              defaultValue={
                initialValues?.email ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Teléfono
            </label>

            <input
              name="phone"
              defaultValue={
                initialValues?.phone ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Dirección
            </label>

            <textarea
              rows={3}
              name="address"
              defaultValue={
                initialValues?.address ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Notas
            </label>

            <textarea
              rows={3}
              name="notes"
              defaultValue={
                initialValues?.notes ?? ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Configuración
        </h2>

        <select
          name="is_active"
          defaultValue={
            initialValues?.is_active === false
              ? 'false'
              : 'true'
          }
          className="rounded-lg border p-3"
        >
          <option value="true">
            Activo
          </option>

          <option value="false">
            Inactivo
          </option>
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
