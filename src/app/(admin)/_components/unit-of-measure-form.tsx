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
      <div className="overflow-hidden rounded-2xl border">
  <table className="w-full">
    <thead className="bg-gray-50">
      <tr>
        <th className="p-4 text-left">Código</th>
        <th className="p-4 text-left">Nombre</th>
        <th className="p-4 text-left">Estado</th>
        <th className="p-4 text-right">Acciones</th>
      </tr>
    </thead>

    <tbody>
      {units?.map((unit) => (
        <tr
          key={unit.id}
          className="border-t"
        >
          <td className="p-4">
            {unit.code}
          </td>

          <td className="p-4">
            {unit.name}
          </td>

          <td className="p-4">
            {unit.is_active
              ? 'Activo'
              : 'Inactivo'}
          </td>

          <td className="p-4 text-right">
            <Link
              href={`/units-of-measure/${unit.id}/edit`}
              className="rounded border px-3 py-1"
            >
              Editar
            </Link>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
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
