interface Props {

  title: string;
}

export function RecommendedProducts({
  title
}: Props) {

  return (

    <div className="space-y-4">

      <h2 className="text-2xl font-bold">

        {title}

      </h2>

      <div className="rounded-2xl border p-6">

        AI Recommendations

      </div>

    </div>
  );
}
