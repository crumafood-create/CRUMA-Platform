interface Props {

  quantity: number;
}

export function LowStockAlert({
  quantity
}: Props) {

  if (quantity > 10) {
    return null;
  }

  return (

    <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-600">

      Bajo stock

    </span>
  );
}
