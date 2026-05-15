interface Props {

  title: string;

  value: string;
}

export function KpiCard({
  title,
  value
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      <p className="text-sm text-gray-500">

        {title}

      </p>

      <h3 className="mt-2 text-3xl font-bold">

        {value}

      </h3>

    </div>
  );
}
