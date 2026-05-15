interface Props {

  totalDeliveries: number;
}

export function DeliveryMetrics({
  totalDeliveries
}: Props) {

  return (

    <div className="rounded-2xl border bg-white p-6">

      <p className="text-sm text-gray-500">

        Entregas

      </p>

      <h3 className="mt-2 text-3xl font-bold">

        {totalDeliveries}

      </h3>

    </div>
  );
}
