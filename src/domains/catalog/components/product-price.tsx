interface Props {

  retailPrice?: number | null;

  wholesalePrice?: number | null;

  isB2B?: boolean;
}

export function ProductPrice({
  retailPrice,
  wholesalePrice,
  isB2B
}: Props) {

  const price =
    isB2B
      ? wholesalePrice
      : retailPrice;

  return (

    <div className="space-y-1">

      <p className="text-2xl font-bold">

        ${price?.toFixed(2)}

      </p>

      {isB2B && wholesalePrice && (

        <p className="text-sm text-muted-foreground">

          Precio mayoreo

        </p>
      )}

    </div>
  );
}
