interface Props {

  message: string;
}

export function LiveNotification({
  message
}: Props) {

  return (

    <div className="rounded-xl border bg-white p-4 shadow-sm">

      {message}

    </div>
  );
}
