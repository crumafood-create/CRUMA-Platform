interface Props {

  message?: string;
}

export function FormError({
  message
}: Props) {

  if (!message) {
    return null;
  }

  return (

    <p className="mt-2 text-sm text-red-500">

      {message}

    </p>
  );
}
