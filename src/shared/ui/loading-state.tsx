interface Props {

  message?: string;
}

export function LoadingState({

  message = 'Cargando...'

}: Props) {

  return (

    <div className="flex items-center justify-center py-20">

      <div className="text-center">

        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

        <p className="mt-4 text-sm text-gray-500">

          {message}

        </p>

      </div>

    </div>
  );
}
