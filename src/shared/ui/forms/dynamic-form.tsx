interface Field {

  name: string;

  label: string;

  type: string;
}

interface Props {

  fields: Field[];
}

export function DynamicForm({
  fields
}: Props) {

  return (

    <form className="space-y-6">

      {fields.map(field => (

        <div key={field.name}>

          <label className="mb-2 block text-sm font-medium">

            {field.label}

          </label>

          <input
            type={field.type}
            className="w-full rounded-xl border px-4 py-3"
          />

        </div>
      ))}

    </form>
  );
}
