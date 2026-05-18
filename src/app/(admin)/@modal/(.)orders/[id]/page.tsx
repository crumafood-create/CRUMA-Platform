interface Props {

  params: Promise<{
    id: string;
  }>;
}

export default async function Modal({
  params
}: Props) {

  const { id } =
    await params;

  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      <div className="w-full max-w-2xl rounded-2xl bg-white p-8">

        <h2 className="text-2xl font-bold">

          Pedido #{id}
        </h2>

      </div>

    </div>
  );
}
