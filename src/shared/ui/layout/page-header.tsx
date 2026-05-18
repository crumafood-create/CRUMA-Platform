interface Props {

  title: string;

  description?: string;
}

export function PageHeader({

  title,
  description

}: Props) {

  return (

    <div>

      <h1 className="text-4xl font-bold tracking-tight">

        {title}

      </h1>

      {description && (

        <p className="mt-2 text-gray-500">

          {description}

        </p>
      )}

    </div>
  );
}
