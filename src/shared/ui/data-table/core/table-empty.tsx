interface Props {
  message?: string;
}

export function TableEmpty({
  message =
    'No hay registros',
}: Props) {
  return (
    <div className="py-12 text-center">
      {message}
    </div>
  );
}
