interface Props {

  status: string;
}

export function DeliveryStatusBadge({
  status
}: Props) {

  return (

    <span className="rounded-full border px-3 py-1 text-sm">

      {status}

    </span>
  );
}
