interface Props {

  totalOrders: number;
}

export function ProductionMetrics({
  totalOrders
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      <p className="text-sm text-gray-500">

        Órdenes producción

      </p>

      <h3 className="mt-2 text-3xl font-bold">

        {totalOrders}

      </h3>

    </div>
  );
}
