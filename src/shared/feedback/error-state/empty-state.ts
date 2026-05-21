interface Props {

  title: string;

  description: string;
}

export function EmptyState({
  title,
  description
}: Props) {

  return (

    <div className="rounded-2xl border border-dashed p-12 text-center">

      <h3 className="text-xl font-semibold">

        {title}

      </h3>

      <p className="mt-2 text-gray-500">

        {description}

      </p>

    </div>
  );
}
