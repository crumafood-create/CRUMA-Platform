'use client';

interface CustomerFormProps {
  action: (
    formData: FormData,
  ) => Promise<void>;

  initialValues?: {
    customer_code?: string;
    customer_type?: string;
    name?: string;
    company_name?: string;
    tax_id?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    notes?: string;
    credit_limit?: number;
    is_active?: boolean;
  };
}

export function CustomerForm({
  action,
  initialValues,
}: CustomerFormProps) {
  return (
    <form
      action={action}
      className="space-y-8 rounded-2xl border bg-white p-6"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Información General
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Código
            </label>

            <input
              name="customer_code"
              defaultValue={
                initialValues?.customer_code ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Tipo
            </label>

            <select
              name="customer_type"
              defaultValue={
                initialValues?.customer_type ??
                'individual'
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="individual">
                Particular
              </option>

              <option value="business">
                Empresa
              </option>
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Nombre *
            </label>

            <input
              name="name"
              required
              defaultValue={
                initialValues?.name ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Empresa
            </label>

            <input
              name="company_name"
              defaultValue={
                initialValues?.company_name ??
                ''
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
                initialValues?.tax_id ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Email
            </label>

            <input
              name="email"
              type="email"
              defaultValue={
                initialValues?.email ??
                ''
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
                initialValues?.phone ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Celular
            </label>

            <input
              name="mobile"
              defaultValue={
                initialValues?.mobile ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Dirección
            </label>

            <textarea
              name="address"
              rows={3}
              defaultValue={
                initialValues?.address ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Ciudad
            </label>

            <input
              name="city"
              defaultValue={
                initialValues?.city ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Estado
            </label>

            <input
              name="state"
              defaultValue={
                initialValues?.state ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Código Postal
            </label>

            <input
              name="postal_code"
              defaultValue={
                initialValues?.postal_code ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Límite de Crédito
            </label>

            <input
              type="number"
              step="0.01"
              name="credit_limit"
              defaultValue={
                initialValues?.credit_limit ??
                0
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Notas
            </label>

            <textarea
              name="notes"
              rows={3}
              defaultValue={
                initialValues?.notes ??
                ''
              }
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      <section>
        <label className="mb-2 block font-medium">
          Estado
        </label>

        <select
          name="is_active"
          defaultValue={
            initialValues?.is_active ===
            false
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
          Guardar Cliente
        </button>
      </div>
    </form>
  );
}
