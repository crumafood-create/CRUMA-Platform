'use client';

interface WarehouseFormProps {
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    name?: string;
    code?: string;
    description?: string;
    is_active?: boolean;
  };
}

export function WarehouseForm({
  action,
  initialValues,
}: WarehouseFormProps) {
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
              Nombre *
            </label>

            <input
              name="name"
              required
              defaultValue={initialValues?.name ?? ''}
              className="w-full rounded-lg border p-3"
              placeholder="Materia Prima"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Código *
            </label>

            <input
              name="code"
              required
              defaultValue={initialValues?.code ?? ''}
              className="w-full rounded-lg border p-3"
              placeholder="MP"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Descripción
            </label>

            <textarea
              name="description"
              rows={3}
              defaultValue={
                initialValues?.description ?? ''
              }
              className="w-full rounded-lg border p-3"
              placeholder="Almacén de materia prima."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Configuración
        </h2>

        <div className="flex items-center gap-3">
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

          <span className="text-sm text-gray-600">
            Estado del almacén
          </span>
        </div>
      </section>

      <div className="border-t pt-6">
        <button
          type="submit"
          className="rounded-lg border bg-blue-50 px-6 py-3 font-medium text-blue-700 hover:bg-blue-100"
        >
          Guardar Almacén
        </button>
      </div>
    </form>
  );
}
