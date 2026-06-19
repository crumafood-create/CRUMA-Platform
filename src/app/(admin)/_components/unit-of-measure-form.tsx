interface Props {
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    name?:      string;
    code?:      string;
    is_active?: boolean;
  };
}

export function UnitOfMeasureForm({ action, initialValues }: Props) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border bg-white p-6">

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block font-medium">Nombre *</label>
          <input
            name="name"
            required
            defaultValue={initialValues?.name}
            className="w-full rounded-lg border p-3"
            placeholder="Mililitros"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Código *</label>
          <input
            name="code"
            required
            defaultValue={initialValues?.code}
            className="w-full rounded-lg border p-3"
            placeholder="ML"
          />
          <p className="mt-1 text-xs text-gray-400">
            Se guardará en mayúsculas. Ej: ML, KG, PZA
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={initialValues?.is_active ?? true}
        />
        <span>Activo</span>
      </div>

      <div className="border-t pt-6">
        <button type="submit" className="rounded border px-6 py-2">
          Guardar
        </button>
      </div>

    </form>
  );
}
