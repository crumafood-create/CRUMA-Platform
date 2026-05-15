interface Props {

  params: Promise<{
    id: string;
  }>;
}

export default async function OrderPage({
  params
}: Props) {

  const { id } = await params;

  return (

    <main className="mx-auto max-w-3xl p-8">

      <h1 className="text-4xl font-bold">

        Pedido creado

      </h1>

      <p className="mt-4">

        Pedido:
        {' '}
        {id}

      </p>

    </main>
  );
}
