'use client';

interface Props {
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    name?: string;
    code?: string;
    is_active?: boolean;
  };
}

export function UnitOfMeasureForm({
  action,
  initialValues,
}: Props) {
  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Nombre
        </label>

        <input
          name="name"
          required
          defaultValue={initialValues?.name}
          className="w-full rounded border p-3"
          placeholder="Gramos"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Código
        </label>

        <input
          name="code"
          required
          defaultValue={initialValues?.code}
          className="w-full rounded border p-3"
          placeholder="g"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Estado
        </label>

        <select
          name="is_active"
          defaultValue={
            initialValues?.is_active ? 'true' : 'false'
          }
          className="w-full rounded border p-3"
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Guardar
      </button>
    </form>
  );
}
